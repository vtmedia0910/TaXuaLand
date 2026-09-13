import { createHash, randomUUID } from "node:crypto";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import pg from "pg";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { migrate } from "../infra/migrate";
import { AUTHORITATIVE_AOI } from "../pipelines/aoi-contract";
import { registerApprovedRoadsRelease } from "../pipelines/register-approved-roads-release";

vi.mock("../pipelines/road-contract.ts", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../pipelines/road-contract.ts")>()),
  validateRoadCandidate: (candidate: { geojson: unknown }) => candidate.geojson,
}));

const checksum = (bytes: Buffer) =>
  createHash("sha256").update(bytes).digest("hex");

describe.skipIf(!process.env.DATABASE_TEST_URL)(
  "approved roads registration",
  () => {
    const databaseName = `land_test_${randomUUID().replaceAll("-", "")}`;
    let owner: InstanceType<typeof pg.Client>,
      pool: InstanceType<typeof pg.Pool>,
      root: string;

    beforeAll(async () => {
      owner = new pg.Client({
        connectionString: process.env.DATABASE_TEST_URL,
      });
      await owner.connect();
      await owner.query(`CREATE DATABASE "${databaseName}"`);
      const url = new URL(process.env.DATABASE_TEST_URL!);
      url.pathname = `/${databaseName}`;
      pool = new pg.Pool({ connectionString: url.toString() });
      await migrate(pool);
    });
    beforeEach(async () => {
      await pool.query(
        "TRUNCATE spatial_object_deliveries,audit_events,pipeline_runs,road_segments,source_records,dataset_assets,dataset_releases,datasets,sources,areas_of_interest CASCADE",
      );
      await pool.query(
        "INSERT INTO areas_of_interest(id,name,version,source,boundary,outside_policy,active) VALUES($1,'Tà Xùa Phase 1 operational product coverage',$2,$3,ST_SetSRID(ST_GeomFromGeoJSON($4),4326),$5,true)",
        [
          AUTHORITATIVE_AOI.id,
          AUTHORITATIVE_AOI.version,
          AUTHORITATIVE_AOI.authoritySemantics,
          AUTHORITATIVE_AOI.canonicalGeoJson,
          AUTHORITATIVE_AOI.outsidePolicy,
        ],
      );
      root = await mkdtemp(resolve(tmpdir(), "land-approved-roads-"));
    });
    afterEach(async () => {
      await rm(root, { recursive: true, force: true });
    });
    afterAll(async () => {
      await pool?.end();
      if (owner) {
        await owner.query(`DROP DATABASE IF EXISTS "${databaseName}"`);
        await owner.end();
      }
    });

    async function source() {
      return (
        await pool.query(
          `INSERT INTO sources(name,category,authority_level,license_name,license_reference,commercial_use,public_display,caching,derivatives,redistribution,source_crs,freshness_class,status)
       VALUES('OpenStreetMap AOI road extract','ROADS','THIRD_PARTY','Open Data Commons Open Database License (ODbL) 1.0','https://opendatacommons.org/licenses/odbl/1-0/','ALLOWED','ALLOWED','ALLOWED','ALLOWED','ALLOWED','EPSG:4326','STATIC','ACTIVE') RETURNING id`,
        )
      ).rows[0].id as string;
    }

    async function fixture(variant = "initial") {
      const rawDirectory = resolve(root, "raw"),
        releaseDirectory = resolve(root, "TX-ROADS-2026-001"),
        sourceLockPath = resolve(root, "roads.lock.json");
      await mkdir(rawDirectory, { recursive: true });
      for (const zone of ["normalized", "derived", "published"])
        await mkdir(resolve(releaseDirectory, zone), { recursive: true });
      const raw = Buffer.from(JSON.stringify({ elements: [], variant }));
      const sourceLock = {
        filename: "roads.json",
        url: "https://overpass-api.de/api/interpreter",
        query: '[out:json];way["highway"](21.2,104.45,21.35,104.62);out geom;',
        sha256: checksum(raw),
        bytes: raw.length,
        sourceTimestamp: "2026-09-07T22:22:01Z",
        license: "https://opendatacommons.org/licenses/odbl/1-0/",
        attribution: "© OpenStreetMap contributors",
      };
      const features = [0, 1].map((part) => ({
        type: "Feature",
        id: `osm-way-1-${part}`,
        geometry: {
          type: "LineString",
          coordinates: [
            [104.5 + part * 0.01, 21.25],
            [104.505 + part * 0.01, 21.255],
          ],
        },
        properties: {
          name: null,
          sourceId: "way/1",
          roadClass: "track",
          verificationStatus: "UNKNOWN",
        },
      }));
      const geojson = Buffer.from(
        JSON.stringify({
          type: "FeatureCollection",
          attribution: sourceLock.attribution,
          license: sourceLock.license,
          sourceTimestamp: sourceLock.sourceTimestamp,
          bbox: [104.45, 21.2, 104.62, 21.35],
          features,
        }),
      );
      const manifest = {
        version: "TX-ROADS-2026-001",
        processingVersion: "land-roads-1.0.0",
        sourceVersion: sourceLock.sha256,
        sourceTimestamp: sourceLock.sourceTimestamp,
        horizontalCrs: "EPSG:4326",
        aoi: AUTHORITATIVE_AOI,
        bbox: [104.45, 21.2, 104.62, 21.35],
        features: features.length,
        checksum: checksum(geojson),
        license: sourceLock.license,
        attribution: sourceLock.attribution,
        verificationStatus: "UNKNOWN",
        sourceLock,
      };
      await writeFile(resolve(rawDirectory, sourceLock.filename), raw);
      await writeFile(sourceLockPath, JSON.stringify(sourceLock));
      await writeFile(
        resolve(releaseDirectory, "manifest.json"),
        JSON.stringify(manifest),
      );
      for (const zone of ["normalized", "derived", "published"])
        await writeFile(
          resolve(releaseDirectory, zone, "roads.geojson"),
          geojson,
        );
      return { releaseDirectory, rawDirectory, sourceLockPath };
    }

    it("registers SRID-4326 LineStrings and SourceRecords at APPROVED, then replays exactly", async () => {
      const sourceId = await source(),
        files = await fixture();
      const first = await registerApprovedRoadsRelease(pool, {
        sourceId,
        ...files,
      });
      expect(first).toMatchObject({
        status: "APPROVED",
        reused: false,
        features: 2,
        assets: 4,
      });
      expect(
        (
          await pool.query(
            "SELECT qa_status,published_at FROM dataset_releases WHERE id=$1",
            [first.releaseId],
          )
        ).rows[0],
      ).toEqual({ qa_status: "APPROVED", published_at: null });
      expect(
        (
          await pool.query(
            "SELECT count(*)::int AS count,count(*) FILTER (WHERE ST_SRID(geometry)<>4326 OR GeometryType(geometry)<>'LINESTRING')::int AS invalid,array_agg(DISTINCT external_id) AS external_ids FROM road_segments WHERE release_id=$1",
            [first.releaseId],
          )
        ).rows[0],
      ).toEqual({ count: 2, invalid: 0, external_ids: ["way/1"] });
      expect(
        (await pool.query("SELECT count(*)::int AS count FROM source_records"))
          .rows[0].count,
      ).toBe(1);
      expect(
        await registerApprovedRoadsRelease(pool, { sourceId, ...files }),
      ).toEqual({ ...first, reused: true });
      expect(
        (
          await pool.query(
            "SELECT count(*)::int AS count FROM pipeline_runs WHERE release_id=$1",
            [first.releaseId],
          )
        ).rows[0].count,
      ).toBe(1);
      expect(
        (
          await pool.query(
            "SELECT count(*)::int AS count FROM spatial_object_deliveries",
          )
        ).rows[0].count,
      ).toBe(0);
    });

    it("fails a conflicting replay closed and rolls back every partial row", async () => {
      const sourceId = await source(),
        files = await fixture();
      const first = await registerApprovedRoadsRelease(pool, {
        sourceId,
        ...files,
      });
      await fixture("changed");
      await expect(
        registerApprovedRoadsRelease(pool, { sourceId, ...files }),
      ).rejects.toThrow("identity conflict");
      expect(
        (
          await pool.query(
            "SELECT count(*)::int AS count FROM dataset_releases",
          )
        ).rows[0].count,
      ).toBe(1);
      expect(
        (
          await pool.query(
            "SELECT count(*)::int AS count FROM road_segments WHERE release_id=$1",
            [first.releaseId],
          )
        ).rows[0].count,
      ).toBe(2);
    });

    it("rejects revoked rights before creating Dataset or Release rows", async () => {
      const sourceId = await source(),
        files = await fixture();
      await pool.query(
        "UPDATE sources SET public_display='DENIED' WHERE id=$1",
        [sourceId],
      );
      await expect(
        registerApprovedRoadsRelease(pool, { sourceId, ...files }),
      ).rejects.toThrow("RIGHTS REVIEW REQUIRED");
      expect(
        (await pool.query("SELECT count(*)::int AS count FROM datasets"))
          .rows[0].count,
      ).toBe(0);
    });

    it("rejects registration when the active AOI differs", async () => {
      const sourceId = await source(),
        files = await fixture();
      await pool.query(
        "UPDATE areas_of_interest SET boundary=ST_MakeEnvelope(104.45,21.2,104.61,21.35,4326) WHERE active",
      );
      await expect(
        registerApprovedRoadsRelease(pool, { sourceId, ...files }),
      ).rejects.toThrow("Authoritative LAND AOI mismatch");
    });
  },
);
