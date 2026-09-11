import { createHash, randomUUID } from "node:crypto";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import pg from "pg";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { migrate } from "../infra/migrate";
import { registerApprovedTerrainRelease } from "../pipelines/register-approved-release";

const sha256 = (bytes: Buffer) =>
  createHash("sha256").update(bytes).digest("hex");

describe.skipIf(!process.env.DATABASE_TEST_URL)(
  "approved terrain release registration",
  () => {
    const databaseName = `land_test_${randomUUID().replaceAll("-", "")}`;
    let owner: InstanceType<typeof pg.Client>;
    let pool: InstanceType<typeof pg.Pool>;
    let root: string;

    beforeAll(async () => {
      owner = new pg.Client({ connectionString: process.env.DATABASE_TEST_URL });
      await owner.connect();
      await owner.query(`CREATE DATABASE "${databaseName}"`);
      const url = new URL(process.env.DATABASE_TEST_URL!);
      url.pathname = `/${databaseName}`;
      pool = new pg.Pool({ connectionString: url.toString() });
      await migrate(pool);
    });

    beforeEach(async () => {
      await pool.query(
        "TRUNCATE spatial_object_deliveries,audit_events,pipeline_runs,dataset_assets,dataset_releases,datasets,sources CASCADE",
      );
      root = await mkdtemp(resolve(tmpdir(), "land-approved-terrain-"));
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
        await pool.query<{ id: string }>(
          `INSERT INTO sources(name,category,authority_level,license_name,license_reference,commercial_use,public_display,caching,derivatives,redistribution,source_crs,freshness_class,status)
           VALUES('Synthetic reviewed terrain','TERRAIN','THIRD_PARTY','Synthetic terrain licence','https://example.invalid/terrain-license','ALLOWED','ALLOWED','ALLOWED','ALLOWED','ALLOWED','EPSG:4326','STATIC','ACTIVE') RETURNING id`,
        )
      ).rows[0]!.id;
    }

    async function fixture() {
      const releaseDirectory = resolve(root, "TX-DEM-TEST-001");
      const published = resolve(releaseDirectory, "published");
      const rawDirectory = resolve(root, "raw");
      const qaEvidencePath = resolve(root, "terrain-qa.json");
      const sourceLockPath = resolve(root, "sources.lock.json");
      await mkdir(resolve(published, "0/0"), { recursive: true });
      await mkdir(resolve(releaseDirectory, "normalized"), { recursive: true });
      await mkdir(resolve(releaseDirectory, "derived"), { recursive: true });
      await mkdir(rawDirectory, { recursive: true });

      const dem = Buffer.from("synthetic-dem");
      const geoid = Buffer.from("synthetic-geoid");
      const tile = Buffer.alloc(16_900);
      const sourceLock = {
        dem: {
          filename: "dem.tif",
          url: "https://example.invalid/dem.tif",
          sha256: sha256(dem),
          bytes: dem.length,
          downloadedAt: "2026-09-07T00:00:00.000Z",
        },
        geoid: {
          filename: "geoid.tif",
          url: "https://example.invalid/geoid.tif",
          sha256: sha256(geoid),
          bytes: geoid.length,
          downloadedAt: "2026-09-07T00:00:01.000Z",
        },
      };
      const qa = {
        horizontalRoundTripMaxMeters: 0,
        verticalRoundTripMaxMeters: 0,
        geoidIndependentComparisonMaxMeters: 0,
        noDataCount: 0,
        seamErrorMeters: 0,
        samples: [{ verificationStatus: "UNKNOWN" }],
        fieldControlPoints: "UNKNOWN",
        absoluteLocalAccuracy: "UNKNOWN",
      };
      const manifest = {
        format: "LAND_HEIGHTMAP_V1",
        version: "TX-DEM-TEST-001",
        processingVersion: "terrain-test-v1",
        bbox: [104.3, 21.05, 104.8, 21.55],
        tileSize: 65,
        maximumLevel: 0,
        horizontalCrs: "EPSG:4326",
        verticalDatum: "WGS84_ELLIPSOID",
        sourceVerticalDatum: "EGM2008",
        normalizationCrs: "EPSG:32648",
        resolutionMeters: 60,
        heightRangeMeters: [0, 100],
        source: "Synthetic reviewed terrain",
        sourceVersion: sourceLock.dem.sha256,
        geoidVersion: sourceLock.geoid.sha256,
        license: "https://example.invalid/terrain-license",
        attribution: "Synthetic fixture",
        liabilityNotice: "Not real terrain",
        surfaceModel: "DSM",
        verificationStatus: "UNKNOWN",
        sourceMetadata: {
          crs: "EPSG:4326",
          pixelSpacingDegrees: [0.01, 0.01],
          rasterType: "Point",
          bounds: [104, 21, 105, 22],
        },
        tiles: {
          "0/0/0.bin": { sha256: sha256(tile), bytes: tile.length },
        },
      };
      const manifestBytes = Buffer.from(JSON.stringify(manifest));
      const build = {
        sourceLock,
        manifestSha256: sha256(manifestBytes),
        qa,
      };

      await writeFile(resolve(rawDirectory, sourceLock.dem.filename), dem);
      await writeFile(resolve(rawDirectory, sourceLock.geoid.filename), geoid);
      await writeFile(resolve(releaseDirectory, "qa.json"), JSON.stringify(qa));
      await writeFile(resolve(releaseDirectory, "build.json"), JSON.stringify(build));
      await writeFile(qaEvidencePath, JSON.stringify(qa));
      await writeFile(sourceLockPath, JSON.stringify(sourceLock));
      await writeFile(resolve(published, "manifest.json"), manifestBytes);
      await writeFile(resolve(published, "0/0/0.bin"), tile);
      await writeFile(
        resolve(releaseDirectory, "normalized/orthometric-utm48n.tif"),
        "orthometric",
      );
      await writeFile(
        resolve(releaseDirectory, "normalized/ellipsoid-utm48n.tif"),
        "ellipsoid",
      );
      await writeFile(
        resolve(releaseDirectory, "derived/height-grid.npy"),
        "height-grid",
      );

      return {
        releaseDirectory,
        rawDirectory,
        qaEvidencePath,
        sourceLockPath,
        manifest,
        qa,
        build,
      };
    }

    it("registers valid reviewed terrain as APPROVED only and reuses identical metadata", async () => {
      const sourceId = await source();
      const files = await fixture();
      const first = await registerApprovedTerrainRelease(pool, {
        sourceId,
        ...files,
      });

      expect(first.status).toBe("APPROVED");
      expect(first.reused).toBe(false);
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
            "SELECT zone,count(*)::int AS count FROM dataset_assets WHERE release_id=$1 GROUP BY zone ORDER BY zone",
            [first.releaseId],
          )
        ).rows,
      ).toEqual([
        { zone: "derived", count: 1 },
        { zone: "normalized", count: 2 },
        { zone: "published", count: 2 },
        { zone: "raw", count: 2 },
      ]);
      expect(
        (
          await pool.query(
            "SELECT status FROM pipeline_runs WHERE release_id=$1",
            [first.releaseId],
          )
        ).rows,
      ).toEqual([{ status: "COMPLETED" }]);
      expect(
        (
          await pool.query(
            "SELECT action FROM audit_events WHERE subject_id=$1",
            [first.releaseId],
          )
        ).rows,
      ).toEqual([{ action: "DATASET_APPROVED_RELEASE_REGISTERED" }]);
      expect(
        (
          await pool.query(
            "SELECT 1 FROM spatial_object_deliveries WHERE release_id=$1",
            [first.releaseId],
          )
        ).rowCount,
      ).toBe(0);

      const second = await registerApprovedTerrainRelease(pool, {
        sourceId,
        ...files,
      });
      expect(second).toEqual({ ...first, reused: true });
      expect(
        (
          await pool.query(
            "SELECT count(*)::int AS count FROM dataset_assets WHERE release_id=$1",
            [first.releaseId],
          )
        ).rows[0]?.count,
      ).toBe(7);
      expect(
        (
          await pool.query(
            "SELECT count(*)::int AS count FROM pipeline_runs WHERE release_id=$1",
            [first.releaseId],
          )
        ).rows[0]?.count,
      ).toBe(1);
    });

    it("rejects UNKNOWN or DENIED source rights and a missing licence reference", async () => {
      const sourceId = await source();
      const files = await fixture();
      for (const [field, value] of [
        ["public_display", "UNKNOWN"],
        ["redistribution", "DENIED"],
        ["derivatives", "UNKNOWN"],
        ["caching", "DENIED"],
      ] as const) {
        await pool.query(`UPDATE sources SET ${field}=$1 WHERE id=$2`, [
          value,
          sourceId,
        ]);
        await expect(
          registerApprovedTerrainRelease(pool, { sourceId, ...files }),
        ).rejects.toThrow("RIGHTS REVIEW REQUIRED");
        await pool.query(`UPDATE sources SET ${field}='ALLOWED' WHERE id=$1`, [
          sourceId,
        ]);
      }
      await pool.query("UPDATE sources SET license_reference=NULL WHERE id=$1", [
        sourceId,
      ]);
      await expect(
        registerApprovedTerrainRelease(pool, { sourceId, ...files }),
      ).rejects.toThrow("RIGHTS REVIEW REQUIRED");
      await pool.query(
        "UPDATE sources SET license_reference='https://example.invalid/other-license' WHERE id=$1",
        [sourceId],
      );
      await expect(
        registerApprovedTerrainRelease(pool, { sourceId, ...files }),
      ).rejects.toThrow("RIGHTS REVIEW REQUIRED");
      expect((await pool.query("SELECT 1 FROM datasets")).rowCount).toBe(0);
    });

    it("requires an existing active, unarchived reviewed source", async () => {
      const files = await fixture();
      await expect(
        registerApprovedTerrainRelease(pool, {
          sourceId: randomUUID(),
          ...files,
        }),
      ).rejects.toThrow("RIGHTS REVIEW REQUIRED");
      const sourceId = await source();
      await pool.query("UPDATE sources SET status='DISABLED' WHERE id=$1", [
        sourceId,
      ]);
      await expect(
        registerApprovedTerrainRelease(pool, { sourceId, ...files }),
      ).rejects.toThrow("RIGHTS REVIEW REQUIRED");
      await pool.query(
        "UPDATE sources SET status='ACTIVE',archived_at=now() WHERE id=$1",
        [sourceId],
      );
      await expect(
        registerApprovedTerrainRelease(pool, { sourceId, ...files }),
      ).rejects.toThrow("RIGHTS REVIEW REQUIRED");
    });

    it("rejects a source whose name does not match the terrain manifest", async () => {
      const sourceId = await source();
      const files = await fixture();
      await pool.query("UPDATE sources SET name='Different reviewed terrain source' WHERE id=$1", [
        sourceId,
      ]);
      await expect(
        registerApprovedTerrainRelease(pool, { sourceId, ...files }),
      ).rejects.toThrow("Terrain source identity mismatch");
      expect((await pool.query("SELECT 1 FROM datasets")).rowCount).toBe(0);
    });

    it("rejects QA that claims non-UNKNOWN field verification", async () => {
      const sourceId = await source();
      const files = await fixture();
      const qa = { ...files.qa, fieldControlPoints: "VERIFIED" };
      await writeFile(resolve(files.releaseDirectory, "qa.json"), JSON.stringify(qa));
      await writeFile(files.qaEvidencePath, JSON.stringify(qa));
      await writeFile(
        resolve(files.releaseDirectory, "build.json"),
        JSON.stringify({ ...files.build, qa }),
      );
      await expect(
        registerApprovedTerrainRelease(pool, { sourceId, ...files }),
      ).rejects.toThrow("Terrain QA gate failed");
    });

    it("rejects an invalid terrain manifest", async () => {
      const sourceId = await source();
      const files = await fixture();
      const manifest = { ...files.manifest, verticalDatum: "EGM2008" };
      const bytes = Buffer.from(JSON.stringify(manifest));
      await writeFile(resolve(files.releaseDirectory, "published/manifest.json"), bytes);
      await writeFile(
        resolve(files.releaseDirectory, "build.json"),
        JSON.stringify({ ...files.build, manifestSha256: sha256(bytes) }),
      );
      await expect(
        registerApprovedTerrainRelease(pool, { sourceId, ...files }),
      ).rejects.toThrow();
    });

    it("rejects a terrain tile checksum mismatch", async () => {
      const sourceId = await source();
      const files = await fixture();
      await writeFile(
        resolve(files.releaseDirectory, "published/0/0/0.bin"),
        Buffer.alloc(16_900, 1),
      );
      await expect(
        registerApprovedTerrainRelease(pool, { sourceId, ...files }),
      ).rejects.toThrow("Terrain tile checksum mismatch");
    });

    it("fails closed when an existing release identity has different bytes", async () => {
      const sourceId = await source();
      const files = await fixture();
      await registerApprovedTerrainRelease(pool, { sourceId, ...files });
      const manifest = { ...files.manifest, attribution: "Changed bytes" };
      const bytes = Buffer.from(JSON.stringify(manifest));
      await writeFile(resolve(files.releaseDirectory, "published/manifest.json"), bytes);
      await writeFile(
        resolve(files.releaseDirectory, "build.json"),
        JSON.stringify({ ...files.build, manifestSha256: sha256(bytes) }),
      );
      await expect(
        registerApprovedTerrainRelease(pool, { sourceId, ...files }),
      ).rejects.toThrow("Approved release identity conflict");
    });

    it("requires the LAND database identity", async () => {
      const sourceId = await source();
      const files = await fixture();
      await pool.query("DELETE FROM product_identity");
      await expect(
        registerApprovedTerrainRelease(pool, { sourceId, ...files }),
      ).rejects.toThrow("LAND database required");
    });
  },
);
