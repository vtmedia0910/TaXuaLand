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
import { registerApprovedImageryRelease } from "../pipelines/register-approved-imagery-release";

vi.mock("../pipelines/imagery-contract.ts", () => ({
  assertApprovedImageryIdentity: () => undefined,
  assertApprovedImageryBuild: () => undefined,
}));

const sha256 = (bytes: Buffer) =>
  createHash("sha256").update(bytes).digest("hex");
const bbox = [104.45, 21.2, 104.62, 21.35] as const;

function tileNames() {
  const names: string[] = [];
  for (let level = 0; level <= 14; level++) {
    const n = 2 ** level,
      x = (longitude: number) => ((longitude + 180) / 360) * n,
      y = (latitude: number) =>
        ((1 - Math.asinh(Math.tan((latitude * Math.PI) / 180)) / Math.PI) / 2) *
        n;
    for (
      let column = Math.floor(x(bbox[0]));
      column <= Math.ceil(x(bbox[2])) - 1;
      column++
    )
      for (
        let row = Math.floor(y(bbox[3]));
        row <= Math.ceil(y(bbox[1])) - 1;
        row++
      )
        names.push(`${level}/${column}/${row}.png`);
  }
  return names;
}

describe.skipIf(!process.env.DATABASE_TEST_URL)(
  "approved imagery registration",
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
        "TRUNCATE spatial_object_deliveries,audit_events,pipeline_runs,source_records,dataset_assets,dataset_releases,datasets,sources,areas_of_interest CASCADE",
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
      root = await mkdtemp(resolve(tmpdir(), "land-approved-imagery-"));
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
       VALUES('Copernicus Sentinel-2 Collection 1 Level-2A Surface Reflectance / AWS Open Data COGs','IMAGERY','THIRD_PARTY','Copernicus Sentinel Data Legal Notice (rev. 1)','https://cds.climate.copernicus.eu/licences/ec-sentinel','ALLOWED','ALLOWED','ALLOWED','ALLOWED','ALLOWED','EPSG:32648','VOLATILE','ACTIVE') RETURNING id`,
        )
      ).rows[0].id as string;
    }

    async function fixture(variant = "") {
      const rawDirectory = resolve(root, "raw"),
        releaseDirectory = resolve(root, "release"),
        sourceLockPath = resolve(root, "imagery.lock.json");
      for (const directory of [
        rawDirectory,
        ...["raw", "normalized", "derived", "published"].map((zone) =>
          resolve(releaseDirectory, zone),
        ),
      ])
        await mkdir(directory, { recursive: true });
      const raw = {
        item: Buffer.from("item"),
        visual: Buffer.from("visual"),
        scl: Buffer.from("scl"),
      };
      const sourceLock = {
        itemId: "S2C_T48QVJ_20260527T033930_L2A",
        productId:
          "S2C_MSIL2A_20260527T032511_N0512_R018_T48QVJ_20260527T082311.SAFE",
        sourceCrs: "EPSG:32648",
        aoi: AUTHORITATIVE_AOI,
      };
      const lockBytes = Buffer.from(JSON.stringify(sourceLock)),
        acquisition = Buffer.from(
          JSON.stringify({
            itemId: sourceLock.itemId,
            acquiredAt: "2026-09-12T00:00:00Z",
            assets: Object.fromEntries(
              Object.entries(raw).map(([name, bytes]) => [
                name,
                { bytes: bytes.length, sha256: sha256(bytes) },
              ]),
            ),
          }),
        );
      await writeFile(sourceLockPath, lockBytes);
      await writeFile(
        resolve(releaseDirectory, "raw/source-lock.json"),
        lockBytes,
      );
      await writeFile(
        resolve(releaseDirectory, "raw/acquisition.json"),
        acquisition,
      );
      for (const [name, bytes] of Object.entries(raw))
        await writeFile(
          resolve(
            rawDirectory,
            name === "item"
              ? "item.json"
              : name === "visual"
                ? "TCI.tif"
                : "SCL.tif",
          ),
          bytes,
        );
      for (const file of [
        "normalized/visual-aoi.tif",
        "normalized/scl-aoi.tif",
        "derived/visual-aoi-3857.tif",
        "derived/qa.json",
      ])
        await writeFile(resolve(releaseDirectory, file), `${file}${variant}`);
      const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0]),
        tiles: Record<
          string,
          { bytes: number; sha256: string; mediaType: "image/png" }
        > = {};
      for (const name of tileNames()) {
        await mkdir(resolve(releaseDirectory, "published", name, ".."), {
          recursive: true,
        });
        await writeFile(resolve(releaseDirectory, "published", name), png);
        tiles[name] = {
          bytes: png.length,
          sha256: sha256(png),
          mediaType: "image/png",
        };
      }
      const asset = (name: keyof typeof raw, mediaType: string) => ({
        sha256: sha256(raw[name]),
        bytes: raw[name].length,
        mediaType,
      });
      const quality = {
        sceneCloudPercent: 8.2,
        obstructionThresholdPercent: 10,
        aoiObstructionPercent: 5.8,
        obstructionClasses: [3, 8, 9, 10, 11],
        validPixelCount: 100,
        obstructedPixelCount: 6,
        nodataPixelCount: 0,
        saturatedPixelCount: 0,
        aoiContained: true,
      };
      const manifest = {
        format: "LAND_IMAGERY_V1",
        datasetCode: "TX_IMAGERY_BASE",
        releaseVersion: "TX-IMAGERY-S2L2A-20260527T034216Z-001",
        source: {
          name: "Synthetic",
          collection: "sentinel-2-c1-l2a",
          itemId: sourceLock.itemId,
          productId: sourceLock.productId,
          sourceLockSha256: sha256(lockBytes),
          assets: {
            item: asset("item", "application/geo+json"),
            visual: asset(
              "visual",
              "image/tiff; application=geotiff; profile=cloud-optimized",
            ),
            scl: asset(
              "scl",
              "image/tiff; application=geotiff; profile=cloud-optimized",
            ),
          },
          sensingAt: "2026-05-27T03:42:16.849Z",
          generatedAt: "2026-05-27T08:23:11Z",
          acquiredAt: "2026-09-12T00:00:00Z",
        },
        processing: {
          version: "land-imagery-1.0.0",
          processedAt: "2026-09-12T01:00:00Z",
          tools: {
            rasterio: "test",
            gdal: "test",
            proj: "test",
            libpng: "test",
          },
        },
        sourceCrs: "EPSG:32648",
        targetCrs: "EPSG:3857",
        aoi: AUTHORITATIVE_AOI,
        bbox,
        nativeResolutionMeters: { visual: 10, sclQa: 20 },
        delivery: {
          scheme: "WEB_MERCATOR_XYZ",
          tileSize: 256,
          minimumLevel: 0,
          maximumLevel: 14,
          resolutionAtMaximumLevelMeters: 9.55,
          tileUrlTemplate: "{z}/{x}/{y}.png",
        },
        quality,
        rights: {
          licenseName: "Copernicus Sentinel Data Legal Notice (rev. 1)",
          licenseReference:
            "https://cds.climate.copernicus.eu/licences/ec-sentinel",
          publicNotice: "Contains modified Copernicus Sentinel data 2026",
          acquisitionNotice: "Synthetic acquisition.",
        },
        verificationStatus: "UNKNOWN",
        accuracy: "UNKNOWN",
        limitations: [
          "Resolution is not positional accuracy.",
          "Cloud screening is not field verification.",
        ],
        tileCount: Object.keys(tiles).length,
        tiles,
      };
      const manifestBytes = Buffer.from(JSON.stringify(manifest));
      await writeFile(
        resolve(releaseDirectory, "published/manifest.json"),
        manifestBytes,
      );
      const files: Array<{
        zone: string;
        file: string;
        bytes: number;
        sha256: string;
      }> = [];
      const add = (zone: string, file: string, bytes: Buffer) =>
        files.push({ zone, file, bytes: bytes.length, sha256: sha256(bytes) });
      add("raw", "item.json", raw.item);
      add("raw", "TCI.tif", raw.visual);
      add("raw", "SCL.tif", raw.scl);
      add("raw", "source-lock.json", lockBytes);
      add("raw", "acquisition.json", acquisition);
      for (const file of ["visual-aoi.tif", "scl-aoi.tif"])
        add("normalized", file, Buffer.from(`normalized/${file}${variant}`));
      for (const file of ["visual-aoi-3857.tif", "qa.json"])
        add("derived", file, Buffer.from(`derived/${file}${variant}`));
      add("published", "manifest.json", manifestBytes);
      for (const file of Object.keys(tiles)) add("published", file, png);
      await writeFile(
        resolve(releaseDirectory, "build.json"),
        JSON.stringify({
          releaseVersion: manifest.releaseVersion,
          sourceLockSha256: sha256(lockBytes),
          manifestSha256: sha256(manifestBytes),
          qa: {
            ...quality,
            itemId: sourceLock.itemId,
            aoiId: AUTHORITATIVE_AOI.id,
            aoiVersion: AUTHORITATIVE_AOI.version,
            aoiSha256: AUTHORITATIVE_AOI.sha256,
            verificationStatus: "UNKNOWN",
            accuracy: "UNKNOWN",
          },
          files,
        }),
      );
      return { releaseDirectory, rawDirectory, sourceLockPath };
    }

    it("registers the governed assets at APPROVED and replays exactly", async () => {
      const sourceId = await source(),
        files = await fixture();
      const first = await registerApprovedImageryRelease(pool, {
        sourceId,
        ...files,
      });
      expect(first).toMatchObject({
        status: "APPROVED",
        reused: false,
        tiles: 123,
        assets: 133,
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
        await registerApprovedImageryRelease(pool, { sourceId, ...files }),
      ).toEqual({ ...first, reused: true });
      expect(
        (
          await pool.query(
            "SELECT count(*)::int AS count FROM spatial_object_deliveries",
          )
        ).rows[0].count,
      ).toBe(0);
    });

    it("rejects revoked rights before creating Dataset or Release rows", async () => {
      const sourceId = await source(),
        files = await fixture();
      await pool.query(
        "UPDATE sources SET public_display='DENIED' WHERE id=$1",
        [sourceId],
      );
      await expect(
        registerApprovedImageryRelease(pool, { sourceId, ...files }),
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
        registerApprovedImageryRelease(pool, { sourceId, ...files }),
      ).rejects.toThrow("Authoritative LAND AOI mismatch");
    });

    it("fails a conflicting replay closed without changing the approved release", async () => {
      const sourceId = await source(),
        files = await fixture();
      const first = await registerApprovedImageryRelease(pool, {
        sourceId,
        ...files,
      });
      await fixture("changed");
      await expect(
        registerApprovedImageryRelease(pool, { sourceId, ...files }),
      ).rejects.toThrow("registration conflict");
      expect(
        (
          await pool.query(
            "SELECT count(*)::int AS count FROM dataset_releases WHERE id=$1 AND qa_status='APPROVED'",
            [first.releaseId],
          )
        ).rows[0].count,
      ).toBe(1);
    });
  },
);
