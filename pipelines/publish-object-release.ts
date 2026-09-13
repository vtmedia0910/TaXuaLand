import { randomUUID } from "node:crypto";
import { open, realpath, lstat } from "node:fs/promises";
import { resolve, relative, isAbsolute, sep } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { databaseOptions } from "../packages/config/src/database.ts";
import { z } from "zod";
import { TerrainManifest } from "../packages/spatial-types/src/terrain.ts";
import { ImageryManifest } from "../packages/spatial-types/src/imagery.ts";
import {
  publishedBase,
  spatialAssetFile,
} from "../services/api/src/published-assets.ts";
import { S3CompatibleObjectStore } from "../services/api/src/storage/s3-object-store.ts";
import {
  descriptor,
  publishedObjectKey,
  verifyBytes,
  ObjectStoreError,
  type ObjectStore,
  type ObjectDescriptor,
} from "../services/api/src/storage/object-store.ts";

type Asset = {
  object_key: string;
  checksum: string;
  byte_size: string;
  content_type: string;
};
/** Operator-only delivery: consumes approved PostGIS metadata, never creates approval or edits releases. */
export async function publishObjectRelease(
  pool: InstanceType<typeof pg.Pool>,
  id: string,
  directory: string,
  store: ObjectStore,
  base: string,
) {
  z.uuid().parse(id);
  if (
    publishedBase({
      LAND_ENVIRONMENT: "STAGING",
      OBJECT_STORE_DRIVER: "s3",
      PUBLIC_ASSET_BASE_URL: base,
    }) !== base
  )
    throw Error("Invalid public base");
  const root = await realpath(directory),
    client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (
      (await client.query("SELECT product FROM product_identity WHERE id=true"))
        .rows[0]?.product !== "TAXUA_LAND"
    )
      throw Error("LAND database required");
    const release = (
      await client.query<{
        release_id: string;
        dataset_id: string;
        source_id: string;
        kind: string;
        version: string;
        checksum: string;
        source_version: string;
        pipeline_version: string;
        source_crs: string;
        target_crs: string;
        vertical_datum: string;
        resolution: number | null;
        ready: boolean;
        provider_id: string | null;
        bbox: number[];
      }>(
        `SELECT r.id AS release_id,r.dataset_id,d.source_id,d.kind,r.version,r.checksum,r.source_version,r.pipeline_version,r.source_crs,r.target_crs,r.vertical_datum,r.resolution,s.provider_id,ARRAY[ST_XMin(r.bbox),ST_YMin(r.bbox),ST_XMax(r.bbox),ST_YMax(r.bbox)] AS bbox,
      (r.qa_status IN ('APPROVED','PUBLISHED') AND r.bbox IS NOT NULL AND ((d.kind IN ('TERRAIN','ROADS') AND r.target_crs='EPSG:4326') OR (d.kind='IMAGERY' AND r.source_crs='EPSG:32648' AND r.target_crs='EPSG:3857' AND r.resolution=10)) AND r.license<>'UNKNOWN' AND s.status='ACTIVE' AND s.archived_at IS NULL AND s.public_display='ALLOWED' AND s.redistribution='ALLOWED' AND s.derivatives='ALLOWED' AND s.caching='ALLOWED' AND s.license_reference IS NOT NULL AND EXISTS(SELECT 1 FROM pipeline_runs p WHERE p.release_id=r.id AND p.status='COMPLETED')) AS ready
      FROM dataset_releases r JOIN datasets d ON d.id=r.dataset_id JOIN sources s ON s.id=d.source_id WHERE r.id=$1 FOR UPDATE OF r FOR SHARE OF d,s`,
        [id],
      )
    ).rows[0];
    if (!release?.ready || !["TERRAIN", "ROADS", "IMAGERY"].includes(release.kind))
      throw Error("Spatial publication gate rejected");
    if (
      release.provider_id &&
      !(
        await client.query(
          "SELECT id FROM integration_providers WHERE id=$1 AND enabled AND NOT kill_switch FOR SHARE",
          [release.provider_id],
        )
      ).rowCount
    )
      throw Error("Spatial provider unavailable");
    const assets = (
      await client.query<Asset>(
        "SELECT object_key,checksum,byte_size,content_type FROM dataset_assets WHERE release_id=$1 AND zone='published' ORDER BY object_key FOR SHARE",
        [id],
      )
    ).rows;
    if (!assets.length || assets.length > 5462)
      throw Error("Invalid spatial asset count");
    const items = assets.map((asset) => {
      const file = spatialAssetFile({
        ...release,
        object_key: asset.object_key,
      });
      const object = descriptor("published", {
        key: publishedObjectKey(
          release.kind === "TERRAIN" ? "terrain" : release.kind === "IMAGERY" ? "imagery" : "roads",
          release.dataset_id,
          id,
          file,
        ),
        size: Number(asset.byte_size),
        sha256: asset.checksum,
        contentType: asset.content_type,
      });
      return { file, object };
    });
    if (
      new Set(items.map((item) => item.file)).size !== items.length ||
      items.reduce((n, item) => n + item.object.size, 0) > 128 * 1024 * 1024
    )
      throw Error("Invalid spatial release size");
    const read = async (file: string, object: ObjectDescriptor) => {
      let path = root;
      for (const segment of file.split("/")) {
        path = resolve(path, segment);
        if ((await lstat(path)).isSymbolicLink())
          throw Error("Spatial symlink rejected");
      }
      const actual = await realpath(path),
        rel = relative(root, actual);
      if (isAbsolute(rel) || rel === ".." || rel.startsWith(`..${sep}`))
        throw Error("Unsafe spatial file");
      const handle = await open(actual, "r");
      try {
        if ((await handle.stat()).size !== object.size)
          throw Error("Spatial size mismatch");
        const bytes = Buffer.alloc(object.size);
        let offset = 0;
        while (offset < bytes.length) {
          const part = await handle.read(
            bytes,
            offset,
            bytes.length - offset,
            offset,
          );
          if (!part.bytesRead) throw Error("Incomplete spatial file");
          offset += part.bytesRead;
        }
        verifyBytes(object, bytes);
        return bytes;
      } finally {
        await handle.close();
      }
    };
    const entry = items.find(
      (item) =>
        item.file ===
        (release.kind === "TERRAIN" || release.kind === "IMAGERY" ? "manifest.json" : "roads.geojson"),
    );
    if (!entry || entry.object.sha256 !== release.checksum)
      throw Error("Spatial entry checksum mismatch");
    const entryBytes = await read(entry.file, entry.object);
    if (release.kind === "TERRAIN") {
      if (
        entry.object.size > 1024 * 1024 ||
        entry.object.contentType !== "application/vnd.land.terrain+json"
      )
        throw Error("Invalid terrain entry");
      const manifest = TerrainManifest.parse(
        JSON.parse(entryBytes.toString("utf8")),
      );
      if (
        manifest.version !== release.version ||
        manifest.bbox.some(
          (coordinate, index) => coordinate !== release.bbox[index],
        ) ||
        manifest.sourceVersion !== release.source_version ||
        manifest.processingVersion !== release.pipeline_version ||
        manifest.verticalDatum !== release.vertical_datum ||
        manifest.resolutionMeters !== release.resolution ||
        items.length !== Object.keys(manifest.tiles).length + 1
      )
        throw Error("Terrain provenance mismatch");
      for (const item of items.filter((item) => item !== entry)) {
        const tile = manifest.tiles[item.file];
        if (
          !tile ||
          tile.sha256 !== item.object.sha256 ||
          tile.bytes !== item.object.size ||
          item.object.contentType !== "application/octet-stream"
        )
          throw Error("Terrain index mismatch");
      }
    } else if (release.kind === "IMAGERY") {
      if (entry.object.size > 1024 * 1024 || entry.object.contentType !== "application/vnd.land.imagery+json") throw Error("Invalid imagery entry");
      const manifest = ImageryManifest.parse(JSON.parse(entryBytes.toString("utf8")));
      if (manifest.releaseVersion !== release.version || manifest.source.sourceLockSha256 !== release.source_version || manifest.processing.version !== release.pipeline_version || manifest.sourceCrs !== release.source_crs || manifest.targetCrs !== release.target_crs || manifest.nativeResolutionMeters.visual !== release.resolution || manifest.bbox.some((coordinate, index) => coordinate !== release.bbox[index]) || items.length !== manifest.tileCount + 1) throw Error("Imagery provenance mismatch");
      for (const item of items.filter((item) => item !== entry)) {
        const tile = manifest.tiles[item.file];
        if (!tile || tile.sha256 !== item.object.sha256 || tile.bytes !== item.object.size || tile.mediaType !== item.object.contentType || item.object.contentType !== "image/png") throw Error("Imagery tile index mismatch");
      }
    } else if (
      items.length !== 1 ||
      entry.object.contentType !== "application/geo+json" ||
      JSON.parse(entryBytes.toString("utf8")).type !== "FeatureCollection"
    )
      throw Error("Invalid roads entry");
    // Check every registered file before making any bytes public. Recheck at upload to catch changed input.
    for (const item of items) await read(item.file, item.object);
    for (const item of items) {
      const bytes = await read(item.file, item.object);
      try {
        await store.put({ ...item.object, bytes });
      } catch (error) {
        if (!(error instanceof ObjectStoreError) || error.code !== "CONFLICT")
          throw error;
      }
      const uploaded = await store.get(item.object.key);
      if (
        uploaded.key !== item.object.key ||
        uploaded.sha256 !== item.object.sha256 ||
        uploaded.size !== item.object.size ||
        uploaded.contentType !== item.object.contentType
      )
        throw Error("Spatial uploaded descriptor mismatch");
      verifyBytes(item.object, uploaded.bytes);
    }
    const receipt = await client.query(
      "INSERT INTO spatial_object_deliveries(release_id,public_base_url,driver) VALUES($1,$2,'s3') ON CONFLICT DO NOTHING RETURNING release_id",
      [id, base],
    );
    if (receipt.rowCount)
      await client.query(
        "INSERT INTO audit_events(action,subject_type,subject_id,correlation_id,details) VALUES('DATASET_OBJECT_DELIVERED','DATASET_RELEASE',$1,$2,$3)",
        [
          id,
          randomUUID(),
          {
            objects: items.length,
            checksum: release.checksum,
            actor: "LAND maintenance CLI",
          },
        ],
      );
    await client.query("COMMIT");
    return {
      releaseId: id,
      objects: items.length,
      checksum: release.checksum,
      url: `${base}/${entry.object.key}`,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  let pool: InstanceType<typeof pg.Pool> | undefined,
    store: S3CompatibleObjectStore | undefined;
  try {
    if (process.argv.length !== 4 || !process.env.DATABASE_URL)
      throw Error(
        "Usage: publish-object-release.ts <approved-release-uuid> <published-directory>",
      );
    const base = publishedBase();
    if (!base)
      throw Error(
        "Configure S3 published storage and approved HTTPS public base",
      );
    pool = new pg.Pool(databaseOptions(process.env, true));
    store = new S3CompatibleObjectStore(process.env, "published");
    console.log(
      JSON.stringify(
        await publishObjectRelease(
          pool,
          process.argv[2]!,
          process.argv[3]!,
          store,
          base,
        ),
      ),
    );
  } catch {
    console.error(
      "LAND spatial delivery failed; verify approved release, local checksums, rights and storage configuration (values suppressed)",
    );
    process.exitCode = 1;
  } finally {
    store?.close();
    await pool?.end();
  }
}
