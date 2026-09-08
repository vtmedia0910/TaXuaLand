/** Local QA deployment adapter. Production object-store promotion uses the same manifest hashes. */
import { createHash, randomUUID } from "node:crypto";
import { readFile, stat, mkdir, copyFile } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { TerrainManifest } from "../packages/spatial-types/src/terrain.ts";
const root = fileURLToPath(new URL("..", import.meta.url));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const terrainDirectory = resolve(root, "work/gis/TX-DEM-2026-001");
const terrain = TerrainManifest.parse(
  await readJson(resolve(terrainDirectory, "published/manifest.json")),
);
const qa = await readJson(resolve(terrainDirectory, "qa.json"));
if (
  qa.noDataCount !== 0 ||
  qa.horizontalRoundTripMaxMeters > 0.001 ||
  qa.geoidIndependentComparisonMaxMeters > 0.001 ||
  qa.fieldControlPoints !== "UNKNOWN"
)
  throw Error("Terrain QA gate failed");
const roadsDirectory = resolve(root, "work/gis/TX-ROADS-2026-001"),
  roads = await readJson(resolve(roadsDirectory, "manifest.json"));
const sourceLock = await readJson(resolve(root, "pipelines/sources.lock.json"));
const definitions = [
  {
    kind: "TERRAIN",
    code: "TX_TERRAIN_BASE",
    name: "Copernicus GLO-30 Public AWS N21 E104",
    version: terrain.version,
    directory: terrainDirectory,
    entry: "manifest.json",
    mime: "application/vnd.land.terrain+json",
    bbox: terrain.bbox,
    sourceVersion: terrain.sourceVersion,
    pipeline: terrain.processingVersion,
    datum: terrain.verticalDatum,
    resolution: 60,
    license: terrain.license,
    licenseName: "Copernicus WorldDEM-30 Free & Open",
    raw: sourceLock.dem,
    extraRaw: sourceLock.geoid,
    files: Object.keys(terrain.tiles),
    qa,
  },
  {
    kind: "ROADS",
    code: "TX_ROADS_BASE",
    name: "OpenStreetMap AOI road extract",
    version: roads.version,
    directory: roadsDirectory,
    entry: "roads.geojson",
    mime: "application/geo+json",
    bbox: roads.bbox,
    sourceVersion: roads.sourceVersion,
    pipeline: roads.processingVersion,
    datum: "UNKNOWN",
    resolution: null,
    license: roads.license,
    licenseName: "ODbL 1.0",
    raw: roads.sourceLock,
    files: [],
    qa: {
      geometryValidation: "PostGIS ST_IsValid and WGS84 bounds",
      verificationStatus: "UNKNOWN",
    },
  },
];
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
async function registerPrivateAssets(releaseId, item) {
  const files =
    item.kind === "TERRAIN"
      ? [
          "normalized/orthometric-utm48n.tif",
          "normalized/ellipsoid-utm48n.tif",
          "derived/height-grid.npy",
        ]
      : ["normalized/roads.geojson", "derived/roads.geojson"];
  for (const key of files) {
    const bytes = await readFile(resolve(item.directory, key)),
      checksum = hash(bytes),
      objectKey = `${key.split("/")[0]}/${item.version}/${key.split("/").at(-1)}`;
    const prior = (
      await client.query(
        "SELECT checksum FROM dataset_assets WHERE object_key=$1",
        [objectKey],
      )
    ).rows[0];
    if (prior) {
      if (prior.checksum !== checksum)
        throw Error("Private immutable asset conflict");
      continue;
    }
    await client.query(
      "INSERT INTO dataset_assets(release_id,zone,object_key,checksum,byte_size,content_type) VALUES($1,$2,$3,$4,$5,$6)",
      [
        releaseId,
        key.split("/")[0],
        objectKey,
        checksum,
        bytes.length,
        key.endsWith(".tif")
          ? "image/tiff"
          : key.endsWith(".geojson")
            ? "application/geo+json"
            : "application/octet-stream",
      ],
    );
  }
}
await client.connect();
try {
  if (
    (await client.query("SELECT product FROM product_identity WHERE id=true"))
      .rows[0]?.product !== "TAXUA_LAND"
  )
    throw Error("LAND database required");
  for (const item of definitions) {
    const publicBase = `/spatial/${item.kind.toLowerCase()}/${item.version}/`;
    const publishedRoot = resolve(item.directory, "published");
    for (const key of [item.entry, ...item.files]) {
      const source = resolve(publishedRoot, key);
      if (relative(publishedRoot, source).startsWith(".."))
        throw Error("Unsafe asset path");
      const bytes = await readFile(source),
        digest = hash(bytes);
      if (
        item.kind === "TERRAIN" &&
        key !== item.entry &&
        digest !== terrain.tiles[key].sha256
      )
        throw Error("Tile hash mismatch");
      if (item.kind === "ROADS" && digest !== roads.checksum)
        throw Error("Road checksum mismatch");
      const destination = resolve(
        root,
        "apps/web/public",
        publicBase.slice(1),
        key,
      );
      await mkdir(dirname(destination), { recursive: true });
      if (await stat(destination).catch(() => null)) {
        if (hash(await readFile(destination)) !== digest)
          throw Error("Immutable public URL byte conflict");
      } else await copyFile(source, destination, constants.COPYFILE_EXCL);
    }
    await client.query("BEGIN");
    try {
      await client.query("SELECT pg_advisory_xact_lock(81742,13)");
      let sourceId = (
        await client.query("SELECT id FROM sources WHERE name=$1", [item.name])
      ).rows[0]?.id;
      if (!sourceId)
        sourceId = (
          await client.query(
            "INSERT INTO sources(name,category,authority_level,license_name,license_reference,commercial_use,public_display,caching,derivatives,redistribution,source_crs,freshness_class,status,last_checked_at) VALUES($1,$2,'THIRD_PARTY',$3,$4,'ALLOWED','ALLOWED','ALLOWED','ALLOWED','ALLOWED','EPSG:4326','STATIC','ACTIVE',now()) RETURNING id",
            [item.name, item.kind, item.licenseName, item.license],
          )
        ).rows[0].id;
      const rights = await client.query(
        "SELECT id FROM sources WHERE id=$1 AND status='ACTIVE' AND archived_at IS NULL AND public_display='ALLOWED' AND redistribution='ALLOWED' AND derivatives='ALLOWED' AND license_reference=$2",
        [sourceId, item.license],
      );
      if (!rights.rowCount)
        throw Error(
          "Source permissions or license changed; publication blocked",
        );
      const datasetId = (
        await client.query(
          "INSERT INTO datasets(code,name,kind,source_id) VALUES($1,$2,$3,$4) ON CONFLICT(code) DO UPDATE SET code=excluded.code RETURNING id",
          [item.code, item.code, item.kind, sourceId],
        )
      ).rows[0].id;
      if (
        !(
          await client.query(
            "SELECT id FROM datasets WHERE id=$1 AND source_id=$2 AND kind=$3",
            [datasetId, sourceId, item.kind],
          )
        ).rowCount
      )
        throw Error("Dataset source mismatch");
      const bytes = await readFile(resolve(publishedRoot, item.entry)),
        checksum = hash(bytes);
      const prior = (
        await client.query(
          "SELECT id,checksum FROM dataset_releases WHERE dataset_id=$1 AND version=$2",
          [datasetId, item.version],
        )
      ).rows[0];
      if (prior) {
        if (prior.checksum !== checksum)
          throw Error("Registered release checksum conflict");
        await registerPrivateAssets(prior.id, item);
        await client.query("COMMIT");
        continue;
      }
      const releaseId = (
        await client.query(
          "INSERT INTO dataset_releases(dataset_id,version,source_version,pipeline_version,source_crs,target_crs,vertical_datum,bbox,resolution,license,checksum,qa_status) VALUES($1,$2,$3,$4,'EPSG:4326','EPSG:4326',$5,ST_MakeEnvelope($6,$7,$8,$9,4326),$10,$11,$12,'APPROVED') RETURNING id",
          [
            datasetId,
            item.version,
            item.sourceVersion,
            item.pipeline,
            item.datum,
            ...item.bbox,
            item.resolution,
            item.licenseName,
            checksum,
          ],
        )
      ).rows[0].id;
      const addAsset = async (
        zone,
        key,
        digest,
        size,
        mime,
        publicUrl = null,
      ) =>
        client.query(
          "INSERT INTO dataset_assets(release_id,zone,object_key,checksum,byte_size,content_type,public_url) VALUES($1,$2,$3,$4,$5,$6,$7)",
          [releaseId, zone, key, digest, size, mime, publicUrl],
        );
      await registerPrivateAssets(releaseId, item);
      await addAsset(
        "raw",
        `raw/${item.version}/${item.raw.filename}`,
        item.raw.sha256,
        item.raw.bytes,
        item.kind === "TERRAIN" ? "image/tiff" : "application/json",
      );
      if (item.extraRaw)
        await addAsset(
          "raw",
          `raw/${item.version}/${item.extraRaw.filename}`,
          item.extraRaw.sha256,
          item.extraRaw.bytes,
          "image/tiff",
        );
      await addAsset(
        "published",
        publicBase.slice(1) + item.entry,
        checksum,
        bytes.length,
        item.mime,
        publicBase + item.entry,
      );
      for (const key of item.files)
        await addAsset(
          "published",
          publicBase.slice(1) + key,
          terrain.tiles[key].sha256,
          terrain.tiles[key].bytes,
          "application/octet-stream",
          publicBase + key,
        );
      if (item.kind === "ROADS") {
        const data = JSON.parse(bytes);
        for (const feature of data.features) {
          const recordId = (
            await client.query(
              "INSERT INTO source_records(source_id,external_record_id,collected_at,raw_payload_hash,notes) VALUES($1,$2,$3,$4,'OSM extract observation; safety and accessibility UNKNOWN') RETURNING id",
              [
                sourceId,
                feature.properties.sourceId,
                roads.sourceTimestamp,
                item.sourceVersion,
              ],
            )
          ).rows[0].id;
          await client.query(
            "INSERT INTO road_segments(release_id,source_record_id,geometry,external_id,name) VALUES($1,$2,ST_SetSRID(ST_GeomFromGeoJSON($3),4326),$4,$5)",
            [
              releaseId,
              recordId,
              JSON.stringify(feature.geometry),
              feature.properties.sourceId,
              feature.properties.name,
            ],
          );
        }
        const invalid = await client.query(
          "SELECT id FROM road_segments WHERE release_id=$1 AND (NOT ST_IsValid(geometry) OR NOT ST_CoveredBy(geometry,ST_MakeEnvelope($2,$3,$4,$5,4326)))",
          [releaseId, ...item.bbox],
        );
        if (invalid.rowCount) throw Error("Road geometry validation failed");
      }
      await client.query(
        "INSERT INTO pipeline_runs(dataset_id,release_id,processing_version,status,finished_at,manifest) VALUES($1,$2,$3,'COMPLETED',now(),$4)",
        [
          datasetId,
          releaseId,
          item.pipeline,
          {
            sourceLock: item.raw,
            qa: item.qa,
            localQa: true,
            licenseEvidence: item.license,
          },
        ],
      );
      await client.query(
        "UPDATE dataset_releases SET qa_status='RETIRED' WHERE dataset_id=$1 AND qa_status='PUBLISHED'",
        [datasetId],
      );
      await client.query(
        "UPDATE dataset_releases SET qa_status='PUBLISHED',published_at=now() WHERE id=$1",
        [releaseId],
      );
      await client.query(
        "INSERT INTO audit_events(action,subject_type,subject_id,correlation_id,details) VALUES('DATASET_LOCAL_QA_PUBLISHED','DATASET_RELEASE',$1,$2,$3)",
        [
          releaseId,
          randomUUID(),
          {
            version: item.version,
            checksum,
            licenseEvidence: item.license,
            fieldVerification: "UNKNOWN",
            actor: "LAND maintenance CLI",
          },
        ],
      );
      await client.query("COMMIT");
      console.log(
        JSON.stringify({
          release: item.version,
          checksum,
          url: publicBase + item.entry,
        }),
      );
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
} finally {
  await client.end();
}
