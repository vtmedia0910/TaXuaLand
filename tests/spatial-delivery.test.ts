import { randomUUID } from "node:crypto";
import { mkdtemp, mkdir, writeFile, rm, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import pg from "pg";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { migrate } from "../infra/migrate";
import { publishObjectRelease } from "../pipelines/publish-object-release";
import {
  publishedBase,
  resolvePublishedAsset,
} from "../services/api/src/published-assets";
import { publicLayers } from "../services/api/src/layers";
import { publishRelease } from "../services/api/src/registry";
import { LocalFilesystemObjectStore } from "../services/api/src/storage/local-object-store";
import {
  sha256,
  publishedObjectKey,
  type ObjectStore,
} from "../services/api/src/storage/object-store";
import type { Actor } from "../services/api/src/auth";

const base = "https://assets.example.invalid";
const env = {
  LAND_ENVIRONMENT: "STAGING",
  OBJECT_STORE_DRIVER: "s3",
  PUBLIC_ASSET_BASE_URL: base,
};
it("resolves only configured origins, matching delivery and release-scoped keys", () => {
  const release = {
    dataset_id: randomUUID(),
    release_id: randomUUID(),
    kind: "TERRAIN",
    version: "TX-TEST-1",
    object_key: "spatial/terrain/TX-TEST-1/manifest.json",
    public_url: "https://attacker.invalid/terrain",
    delivered_base: base,
  };
  expect(resolvePublishedAsset(release, base)).toBe(
    `${base}/spatial/terrain/${release.dataset_id}/${release.release_id}/manifest.json`,
  );
  expect(
    resolvePublishedAsset({ ...release, delivered_base: null }, base),
  ).toBeNull();
  expect(
    resolvePublishedAsset(
      { ...release, delivered_base: "https://other.invalid" },
      base,
    ),
  ).toBeNull();
  expect(resolvePublishedAsset(release, null)).toBeNull();
  for (const key of [
    "../manifest.json",
    "spatial/terrain/TX-TEST-1/../manifest.json",
    "imports/raw/test",
    `spatial/terrain/${randomUUID()}/${release.release_id}/manifest.json`,
  ])
    expect(
      resolvePublishedAsset({ ...release, object_key: key }, base),
    ).toBeNull();
  expect(() =>
    publishedBase({
      ...env,
      PUBLIC_ASSET_BASE_URL: "https://user:secret@assets.example.invalid",
    }),
  ).toThrow();
  expect(() =>
    publishedBase({ ...env, PUBLIC_ASSET_BASE_URL: "https://*.vercel.app" }),
  ).toThrow();
  expect(() =>
    publishedBase({ ...env, LAND_ENVIRONMENT: "PREVIEW" }),
  ).toThrow();
});

describe.skipIf(!process.env.DATABASE_TEST_URL)(
  "PostGIS spatial delivery",
  () => {
    const name = `land_test_${randomUUID().replaceAll("-", "")}`;
    let owner: InstanceType<typeof pg.Client>,
      pool: InstanceType<typeof pg.Pool>,
      root: string,
      store: LocalFilesystemObjectStore,
      actor: Actor;
    beforeAll(async () => {
      owner = new pg.Client({
        connectionString: process.env.DATABASE_TEST_URL,
      });
      await owner.connect();
      await owner.query(`CREATE DATABASE "${name}"`);
      const url = new URL(process.env.DATABASE_TEST_URL!);
      url.pathname = `/${name}`;
      pool = new pg.Pool({ connectionString: url.toString() });
      await migrate(pool);
      root = await mkdtemp(resolve(tmpdir(), "land-spatial-delivery-"));
      store = new LocalFilesystemObjectStore(
        resolve(root, "objects"),
        "published",
      );
      actor = {
        id: (
          await pool.query(
            "INSERT INTO admin_users(email,password_hash) VALUES('delivery@example.invalid','unusable') RETURNING id",
          )
        ).rows[0].id,
        email: "delivery@example.invalid",
        permissions: new Set(["configure"]),
        correlationId: randomUUID(),
      };
    });
    afterAll(async () => {
      await pool?.end();
      if (owner) {
        await owner.query(`DROP DATABASE IF EXISTS "${name}"`);
        await owner.end();
      }
      if (root) await rm(root, { recursive: true, force: true });
    });
    async function fixture(kind = "ROADS") {
      const source = (
        await pool.query(
          "INSERT INTO sources(name,category,status,public_display,redistribution,derivatives,caching,license_reference) VALUES('Synthetic delivery',$1,'ACTIVE','ALLOWED','ALLOWED','ALLOWED','ALLOWED','https://example.invalid/license') RETURNING id",
          [kind],
        )
      ).rows[0].id;
      const dataset = (
        await pool.query(
          "INSERT INTO datasets(code,name,kind,source_id) VALUES($1,'Synthetic',$2,$3) RETURNING id",
          [randomUUID(), kind, source],
        )
      ).rows[0].id;
      const id = randomUUID(),
        version = `TX-${id.toUpperCase()}`,
        directory = resolve(root, id);
      await mkdir(directory);
      const tile = Buffer.alloc(16900);
      const bytes = Buffer.from(
        JSON.stringify(
          kind === "ROADS"
            ? { type: "FeatureCollection", features: [] }
            : {
                format: "LAND_HEIGHTMAP_V1",
                version,
                processingVersion: "test",
                bbox: [104, 21, 105, 22],
                tileSize: 65,
                maximumLevel: 0,
                horizontalCrs: "EPSG:4326",
                verticalDatum: "WGS84_ELLIPSOID",
                sourceVerticalDatum: "EGM2008",
                normalizationCrs: "EPSG:32648",
                resolutionMeters: 60,
                heightRangeMeters: [0, 100],
                source: "Synthetic QA",
                sourceVersion: "a".repeat(64),
                geoidVersion: "b".repeat(64),
                license: "https://example.invalid/license",
                attribution: "Synthetic QA",
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
                  "0/0/0.bin": { bytes: tile.length, sha256: sha256(tile) },
                },
              },
        ),
      );
      await pool.query(
        "INSERT INTO dataset_releases(id,dataset_id,version,source_version,pipeline_version,source_crs,target_crs,vertical_datum,resolution,bbox,license,checksum,qa_status) VALUES($1,$2,$3,$4,'test','EPSG:4326','EPSG:4326','WGS84_ELLIPSOID',60,ST_MakeEnvelope(104,21,105,22,4326),'Synthetic',$5,'APPROVED')",
        [id, dataset, version, "a".repeat(64), sha256(bytes)],
      );
      await pool.query(
        "INSERT INTO pipeline_runs(dataset_id,release_id,processing_version,status,manifest) VALUES($1,$2,'test','COMPLETED','{}')",
        [dataset, id],
      );
      const files =
        kind === "TERRAIN"
          ? ([
              ["manifest.json", bytes, "application/vnd.land.terrain+json"],
              ["0/0/0.bin", tile, "application/octet-stream"],
            ] as const)
          : ([["roads.geojson", bytes, "application/geo+json"]] as const);
      for (const [file, data, mime] of files) {
        if (file.includes("/"))
          await mkdir(resolve(directory, "0/0"), { recursive: true });
        await writeFile(resolve(directory, file), data);
        const key = `spatial/${kind.toLowerCase()}/${version}/${file}`;
        await pool.query(
          "INSERT INTO dataset_assets(release_id,zone,object_key,checksum,byte_size,content_type,public_url) VALUES($1,'published',$2,$3,$4,$5,$6)",
          [id, key, sha256(data), data.length, mime, `/${key}`],
        );
      }
      return { id, source, dataset, directory, bytes, version };
    }
    it("delivery is not publish; explicit publication, retry, revoked rights and retirement remain authoritative", async () => {
      const f = await fixture();
      await expect(
        publishRelease(actor, f.id, pool, env),
      ).rejects.toMatchObject({ code: "RELEASE_DELIVERY_REQUIRED" });
      const original = (
        await pool.query("SELECT * FROM dataset_releases WHERE id=$1", [f.id])
      ).rows[0];
      const delivered = await publishObjectRelease(
        pool,
        f.id,
        f.directory,
        store,
        base,
      );
      expect(
        (await pool.query("SELECT * FROM dataset_releases WHERE id=$1", [f.id]))
          .rows[0],
      ).toEqual(original);
      expect((await publicLayers(pool, env)).roadsUrl).toBeNull();
      await publishRelease(actor, f.id, pool, env);
      expect((await publicLayers(pool, env)).roadsUrl).toBe(delivered.url);
      await publishObjectRelease(pool, f.id, f.directory, store, base);
      expect(
        (
          await pool.query(
            "SELECT * FROM spatial_object_deliveries WHERE release_id=$1",
            [f.id],
          )
        ).rowCount,
      ).toBe(1);
      expect(
        (
          await pool.query(
            "SELECT * FROM audit_events WHERE subject_id=$1 AND action='DATASET_OBJECT_DELIVERED'",
            [f.id],
          )
        ).rowCount,
      ).toBe(1);
      await expect(
        pool.query(
          "DELETE FROM spatial_object_deliveries WHERE release_id=$1",
          [f.id],
        ),
      ).rejects.toThrow("immutable");
      await expect(
        pool.query(
          "UPDATE dataset_assets SET checksum=repeat('f',64) WHERE release_id=$1",
          [f.id],
        ),
      ).rejects.toThrow("immutable");
      await pool.query(
        "UPDATE sources SET redistribution='UNKNOWN' WHERE id=$1",
        [f.source],
      );
      expect((await publicLayers(pool, env)).roadsUrl).toBeNull();
      await expect(
        publishObjectRelease(pool, f.id, f.directory, store, base),
      ).rejects.toThrow("gate");
      await pool.query(
        "UPDATE sources SET redistribution='ALLOWED' WHERE id=$1",
        [f.source],
      );
      await pool.query(
        "INSERT INTO integration_providers(id,type,enabled,kill_switch) VALUES('delivery_test','TERRAIN',true,true)",
      );
      await pool.query(
        "UPDATE sources SET provider_id='delivery_test' WHERE id=$1",
        [f.source],
      );
      expect((await publicLayers(pool, env)).roadsUrl).toBeNull();
      await expect(
        publishObjectRelease(pool, f.id, f.directory, store, base),
      ).rejects.toThrow("unavailable");
      await pool.query(
        "UPDATE integration_providers SET kill_switch=false WHERE id='delivery_test'",
      );
      expect(
        (
          await publicLayers(pool, {
            ...env,
            PUBLIC_ASSET_BASE_URL: "https://other.invalid",
          })
        ).roadsUrl,
      ).toBeNull();
      await pool.query(
        "UPDATE dataset_releases SET qa_status='RETIRED' WHERE id=$1",
        [f.id],
      );
      expect((await publicLayers(pool, env)).roadsUrl).toBeNull();
    });
    it("terrain survives removal of web-independent input; manifest and tile checksums remain unchanged", async () => {
      const f = await fixture("TERRAIN");
      const delivered = await publishObjectRelease(
        pool,
        f.id,
        f.directory,
        store,
        base,
      );
      await expect(
        pool.query(
          "UPDATE dataset_releases SET checksum=repeat('f',64) WHERE id=$1",
          [f.id],
        ),
      ).rejects.toThrow("immutable");
      await publishRelease(actor, f.id, pool, env);
      await rm(f.directory, { recursive: true });
      const fresh = new LocalFilesystemObjectStore(
        resolve(root, "objects"),
        "published",
      );
      expect(
        (
          await fresh.get(
            publishedObjectKey("terrain", f.dataset, f.id, "manifest.json"),
          )
        ).bytes,
      ).toEqual(f.bytes);
      expect(
        (
          await fresh.get(
            publishedObjectKey("terrain", f.dataset, f.id, "0/0/0.bin"),
          )
        ).bytes.length,
      ).toBe(16900);
      expect((await publicLayers(pool, env)).terrainUrl).toBe(delivered.url);
    });
    it("rejects unapproved/missing/corrupt inputs and provider failure without delivery or overwrite", async () => {
      const f = await fixture();
      await pool.query(
        "UPDATE dataset_releases SET qa_status='DRAFT' WHERE id=$1",
        [f.id],
      );
      await expect(
        publishObjectRelease(pool, f.id, f.directory, store, base),
      ).rejects.toThrow("gate");
      await pool.query(
        "UPDATE dataset_releases SET qa_status='APPROVED' WHERE id=$1",
        [f.id],
      );
      await unlink(resolve(f.directory, "roads.geojson"));
      await expect(
        publishObjectRelease(pool, f.id, f.directory, store, base),
      ).rejects.toThrow();
      await writeFile(resolve(f.directory, "roads.geojson"), "corrupt");
      await expect(
        publishObjectRelease(pool, f.id, f.directory, store, base),
      ).rejects.toThrow();
      await writeFile(resolve(f.directory, "roads.geojson"), f.bytes);
      const broken: ObjectStore = {
        put: async () => {
          throw Error("unavailable");
        },
        get: (k) => store.get(k),
        head: (k) => store.head(k),
        delete: (k) => store.delete(k),
      };
      await expect(
        publishObjectRelease(pool, f.id, f.directory, broken, base),
      ).rejects.toThrow();
      expect(
        (
          await pool.query(
            "SELECT * FROM spatial_object_deliveries WHERE release_id=$1",
            [f.id],
          )
        ).rowCount,
      ).toBe(0);
      const key = publishedObjectKey("roads", f.dataset, f.id, "roads.geojson"),
        wrong = Buffer.from("wrong immutable bytes");
      await store.put({
        key,
        bytes: wrong,
        size: wrong.length,
        sha256: sha256(wrong),
        contentType: "application/geo+json",
      });
      await expect(
        publishObjectRelease(pool, f.id, f.directory, store, base),
      ).rejects.toThrow("mismatch");
      expect((await store.get(key)).bytes).toEqual(wrong);
    });
  },
);
