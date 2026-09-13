/** Register the single approved Slice 1C roads candidate; never publish it. */
import { createHash, randomUUID } from "node:crypto";
import { lstat, readFile, realpath } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import pg from "pg";
import { z } from "zod";
import { databaseOptions } from "../packages/config/src/database.ts";
import { AUTHORITATIVE_AOI } from "./aoi-contract.ts";
import {
  ROAD_ATTRIBUTION,
  ROAD_LICENSE,
  ROAD_SOURCE_NAME,
  validateRoadCandidate,
} from "./road-contract.ts";

type Pool = InstanceType<typeof pg.Pool>;
type Options = {
  sourceId: string;
  releaseDirectory: string;
  rawDirectory: string;
  sourceLockPath: string;
};
type Asset = {
  zone: "raw" | "normalized" | "derived" | "published";
  file: string;
  checksum: string;
  size: number;
  contentType: string;
  publicUrl: string | null;
};
const hash = (bytes: Buffer) =>
  createHash("sha256").update(bytes).digest("hex");

async function safeRead(
  root: string,
  file: string,
  maximum = 128 * 1024 * 1024,
) {
  const base = await realpath(root),
    target = resolve(base, ...file.split("/"));
  const rel = relative(base, target);
  if (
    !file ||
    file.split("/").some((part) => !part || part === "..") ||
    isAbsolute(rel) ||
    rel === ".." ||
    rel.startsWith(`..${sep}`)
  )
    throw Error("Unsafe roads path");
  const info = await lstat(target);
  if (!info.isFile() || info.isSymbolicLink() || info.size > maximum)
    throw Error("Unsafe roads file");
  return readFile(target);
}

async function inspect(options: Options) {
  z.uuid().parse(options.sourceId);
  const sourceLock = JSON.parse(
    (await readFile(options.sourceLockPath)).toString("utf8"),
  );
  const manifestBytes = await safeRead(
    options.releaseDirectory,
    "manifest.json",
    1024 * 1024,
  );
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  const raw = await safeRead(options.rawDirectory, sourceLock.filename);
  if (raw.length !== sourceLock.bytes || hash(raw) !== sourceLock.sha256)
    throw Error("Road source checksum mismatch");
  const files: Asset[] = [
    {
      zone: "raw",
      file: sourceLock.filename,
      checksum: hash(raw),
      size: raw.length,
      contentType: "application/json",
      publicUrl: null,
    },
  ];
  let geojson: unknown;
  for (const zone of ["normalized", "derived", "published"] as const) {
    const bytes = await safeRead(
      options.releaseDirectory,
      `${zone}/roads.geojson`,
    );
    if (hash(bytes) !== manifest.checksum)
      throw Error("Road GeoJSON checksum mismatch");
    if (zone === "published") geojson = JSON.parse(bytes.toString("utf8"));
    files.push({
      zone,
      file: "roads.geojson",
      checksum: hash(bytes),
      size: bytes.length,
      contentType: "application/geo+json",
      publicUrl: zone === "published" ? "pending" : null,
    });
  }
  const parsed = validateRoadCandidate({
    source: {
      name: ROAD_SOURCE_NAME,
      license: ROAD_LICENSE,
      attribution: ROAD_ATTRIBUTION,
    },
    sourceLock,
    manifest,
    geojson,
  });
  return {
    sourceLock,
    manifest,
    manifestSha256: hash(manifestBytes),
    files,
    geojson: parsed,
  };
}

export async function registerApprovedRoadsRelease(
  pool: Pool,
  options: Options,
) {
  const built = await inspect(options),
    client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (
      !(
        await client.query(
          "SELECT EXISTS(SELECT 1 FROM areas_of_interest WHERE active AND id=$1 AND version=$2 AND ST_SRID(boundary)=$3 AND outside_policy=$4 AND ST_Equals(boundary,ST_SetSRID(ST_GeomFromGeoJSON($5),$3))) AS matches",
          [
            AUTHORITATIVE_AOI.id,
            AUTHORITATIVE_AOI.version,
            AUTHORITATIVE_AOI.srid,
            AUTHORITATIVE_AOI.outsidePolicy,
            AUTHORITATIVE_AOI.canonicalGeoJson,
          ],
        )
      ).rows[0]?.matches
    )
      throw Error("Authoritative LAND AOI mismatch");
    if (
      (await client.query("SELECT product FROM product_identity WHERE id=true"))
        .rows[0]?.product !== "TAXUA_LAND"
    )
      throw Error("LAND database required");
    if (
      !(
        await client.query(
          "SELECT has_table_privilege(current_user,'spatial_object_deliveries','INSERT') AS allowed",
        )
      ).rows[0]?.allowed
    )
      throw Error("LAND operator database authority required");
    await client.query("SELECT pg_advisory_xact_lock(81742,16)");
    const source = (
      await client.query("SELECT * FROM sources WHERE id=$1 FOR SHARE", [
        options.sourceId,
      ])
    ).rows[0];
    if (
      !source ||
      source.archived_at ||
      source.status !== "ACTIVE" ||
      [
        source.public_display,
        source.redistribution,
        source.derivatives,
        source.caching,
      ].some((right) => right !== "ALLOWED") ||
      source.license_reference !== ROAD_LICENSE
    )
      throw Error("RIGHTS REVIEW REQUIRED");
    if (
      source.name !== ROAD_SOURCE_NAME ||
      source.category !== "ROADS" ||
      source.source_crs !== "EPSG:4326" ||
      source.license_name !==
        "Open Data Commons Open Database License (ODbL) 1.0"
    )
      throw Error("Road source identity conflict");

    let dataset = (
      await client.query(
        "SELECT id,kind,source_id FROM datasets WHERE code='TX_ROADS_BASE' FOR UPDATE",
      )
    ).rows[0];
    if (!dataset)
      dataset = (
        await client.query(
          "INSERT INTO datasets(code,name,kind,source_id) VALUES('TX_ROADS_BASE','Tà Xùa OSM roads context','ROADS',$1) RETURNING id,kind,source_id",
          [source.id],
        )
      ).rows[0];
    if (!dataset || dataset.kind !== "ROADS" || dataset.source_id !== source.id)
      throw Error("Road dataset identity conflict");

    const m = built.manifest;
    let release = (
      await client.query(
        "SELECT id,source_version,pipeline_version,source_crs,target_crs,vertical_datum,resolution,license,checksum,qa_status,published_at,ARRAY[ST_XMin(bbox),ST_YMin(bbox),ST_XMax(bbox),ST_YMax(bbox)] AS bbox FROM dataset_releases WHERE dataset_id=$1 AND version=$2 FOR UPDATE",
        [dataset.id, m.version],
      )
    ).rows[0];
    let reused = true;
    if (!release) {
      reused = false;
      release = (
        await client.query(
          "INSERT INTO dataset_releases(dataset_id,version,source_version,pipeline_version,source_crs,target_crs,vertical_datum,bbox,resolution,license,checksum,qa_status,generated_at) VALUES($1,$2,$3,$4,'EPSG:4326','EPSG:4326','UNKNOWN',ST_MakeEnvelope($5,$6,$7,$8,4326),NULL,$9,$10,'APPROVED',$11) RETURNING id,source_version,pipeline_version,source_crs,target_crs,vertical_datum,resolution,license,checksum,qa_status,published_at,ARRAY[ST_XMin(bbox),ST_YMin(bbox),ST_XMax(bbox),ST_YMax(bbox)] AS bbox",
          [
            dataset.id,
            m.version,
            m.sourceVersion,
            m.processingVersion,
            ...m.bbox,
            ROAD_LICENSE,
            m.checksum,
            m.sourceTimestamp,
          ],
        )
      ).rows[0];
    }
    if (
      !release ||
      release.source_version !== m.sourceVersion ||
      release.pipeline_version !== m.processingVersion ||
      release.source_crs !== "EPSG:4326" ||
      release.target_crs !== "EPSG:4326" ||
      release.vertical_datum !== "UNKNOWN" ||
      release.resolution !== null ||
      release.license !== ROAD_LICENSE ||
      release.checksum !== m.checksum ||
      release.qa_status !== "APPROVED" ||
      release.published_at !== null ||
      !isDeepStrictEqual(release.bbox.map(Number), m.bbox)
    )
      throw Error("Approved road release identity conflict");

    const assets = built.files
      .map(({ file, ...asset }) => ({
        ...asset,
        objectKey:
          asset.zone === "published"
            ? `spatial/roads/${dataset.id}/${release.id}/${file}`
            : `${asset.zone}/${m.version}/${file}`,
        publicUrl:
          asset.zone === "published"
            ? `/spatial/roads/${dataset.id}/${release.id}/${file}`
            : null,
      }))
      .sort((a, b) => a.objectKey.localeCompare(b.objectKey));
    const evidence = {
      registration: "APPROVED_OPERATOR",
      manifestSha256: built.manifestSha256,
      sourceLock: built.sourceLock,
      expectedFeatureCount: m.features,
      verificationStatus: "UNKNOWN",
      aoi: m.aoi,
      publicMetadata: {
        sourceName: ROAD_SOURCE_NAME,
        licenseName: "Open Data Commons Open Database License (ODbL) 1.0",
        licenseReference: ROAD_LICENSE,
        attribution: ROAD_ATTRIBUTION,
        acquisitionNotice: null,
        sourceTimestamp: m.sourceTimestamp,
        bbox: m.bbox,
        nativeResolutionMeters: null,
        deliveryResolutionMeters: null,
        verificationStatus: "UNKNOWN",
        accuracy: "UNKNOWN",
        limitations: [
          "Roads are mapped context only.",
          "No safety claim.",
          "No legal-access claim.",
          "No passability or vehicle-suitability claim.",
          "No routing-suitability claim.",
          "No current road-open-status claim.",
        ],
      },
    };
    if (!reused) {
      for (const asset of assets)
        await client.query(
          "INSERT INTO dataset_assets(release_id,zone,object_key,checksum,byte_size,content_type,public_url) VALUES($1,$2,$3,$4,$5,$6,$7)",
          [
            release.id,
            asset.zone,
            asset.objectKey,
            asset.checksum,
            asset.size,
            asset.contentType,
            asset.publicUrl,
          ],
        );
      const records = new Map<string, string>();
      for (const feature of built.geojson.features) {
        let recordId = records.get(feature.properties.sourceId);
        if (!recordId) {
          recordId = randomUUID();
          records.set(feature.properties.sourceId, recordId);
          await client.query(
            "INSERT INTO source_records(id,source_id,external_record_id,collected_at,raw_payload_hash,notes) VALUES($1,$2,$3,$4,$5,'Pinned OpenStreetMap snapshot; verification UNKNOWN')",
            [
              recordId,
              source.id,
              feature.properties.sourceId,
              m.sourceTimestamp,
              m.sourceVersion,
            ],
          );
        }
        await client.query(
          "INSERT INTO road_segments(release_id,source_record_id,geometry,external_id,name,verification_status) VALUES($1,$2,ST_SetSRID(ST_GeomFromGeoJSON($3),4326),$4,$5,'UNKNOWN')",
          [
            release.id,
            recordId,
            JSON.stringify(feature.geometry),
            feature.properties.sourceId,
            feature.properties.name,
          ],
        );
      }
      const qa = (
        await client.query(
          "SELECT count(*)::int AS count,count(*) FILTER (WHERE GeometryType(geometry)<>'LINESTRING' OR ST_SRID(geometry)<>4326 OR NOT ST_CoveredBy(geometry,ST_MakeEnvelope($2,$3,$4,$5,4326)))::int AS invalid FROM road_segments WHERE release_id=$1",
          [release.id, ...m.bbox],
        )
      ).rows[0];
      if (qa.count !== m.features || qa.invalid !== 0)
        throw Error("Road PostGIS QA mismatch");
      await client.query(
        "INSERT INTO pipeline_runs(dataset_id,release_id,processing_version,status,finished_at,manifest) VALUES($1,$2,$3,'COMPLETED',now(),$4)",
        [dataset.id, release.id, m.processingVersion, evidence],
      );
      await client.query(
        "INSERT INTO audit_events(action,subject_type,subject_id,correlation_id,details) VALUES('DATASET_APPROVED_RELEASE_REGISTERED','DATASET_RELEASE',$1,$2,$3)",
        [
          release.id,
          randomUUID(),
          {
            version: m.version,
            checksum: m.checksum,
            sourceId: source.id,
            featureCount: m.features,
            verification: "UNKNOWN",
          },
        ],
      );
    } else {
      const registeredAssets = (
        await client.query(
          'SELECT zone,object_key AS "objectKey",checksum,byte_size::int AS size,content_type AS "contentType",public_url AS "publicUrl" FROM dataset_assets WHERE release_id=$1 ORDER BY object_key',
          [release.id],
        )
      ).rows;
      const counts = (
        await client.query(
          "SELECT (SELECT count(*)::int FROM road_segments WHERE release_id=$1) AS roads,(SELECT count(DISTINCT source_record_id)::int FROM road_segments WHERE release_id=$1) AS records,(SELECT count(*)::int FROM pipeline_runs WHERE release_id=$1) AS runs,(SELECT count(*)::int FROM audit_events WHERE subject_id=$1 AND action='DATASET_APPROVED_RELEASE_REGISTERED') AS audits",
          [release.id],
        )
      ).rows[0];
      const run = (
        await client.query(
          "SELECT processing_version,status,manifest FROM pipeline_runs WHERE release_id=$1",
          [release.id],
        )
      ).rows[0];
      if (
        !isDeepStrictEqual(registeredAssets, assets) ||
        counts.roads !== m.features ||
        counts.records !==
          new Set(
            built.geojson.features.map(
              (feature) => feature.properties.sourceId,
            ),
          ).size ||
        counts.runs !== 1 ||
        counts.audits !== 1 ||
        run.processing_version !== m.processingVersion ||
        run.status !== "COMPLETED" ||
        !isDeepStrictEqual(run.manifest, evidence)
      )
        throw Error("Approved road registration conflict");
    }
    await client.query("COMMIT");
    return {
      datasetId: dataset.id,
      releaseId: release.id,
      version: m.version,
      status: "APPROVED" as const,
      checksum: m.checksum,
      features: m.features,
      assets: assets.length,
      reused,
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
  let pool: Pool | undefined;
  try {
    if (process.argv.length !== 4 || !process.env.DATABASE_URL)
      throw Error(
        "Usage: register-approved-roads-release.ts <reviewed-source-uuid> <release-directory>",
      );
    pool = new pg.Pool(databaseOptions(process.env, true));
    console.log(
      JSON.stringify(
        await registerApprovedRoadsRelease(pool, {
          sourceId: process.argv[2]!,
          releaseDirectory: process.argv[3]!,
          sourceLockPath: resolve(
            fileURLToPath(new URL("..", import.meta.url)),
            "pipelines/roads.lock.json",
          ),
          rawDirectory: resolve(
            fileURLToPath(new URL("..", import.meta.url)),
            "work/gis/raw",
          ),
        }),
      ),
    );
  } catch {
    console.error(
      "LAND approved road registration failed; verify operator authority, reviewed rights and immutable candidate evidence (values suppressed)",
    );
    process.exitCode = 1;
  } finally {
    await pool?.end();
  }
}
