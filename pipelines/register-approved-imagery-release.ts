/** Register the single approved Slice 1C imagery candidate; never publish it. */
import { createHash, randomUUID } from "node:crypto";
import { lstat, readFile, realpath, readdir } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import pg from "pg";
import { z } from "zod";
import { databaseOptions } from "../packages/config/src/database.ts";
import { ImageryManifest } from "../packages/spatial-types/src/imagery.ts";
import {
  assertAuthoritativeAoi,
  AUTHORITATIVE_AOI,
} from "./aoi-contract.ts";
import {
  assertApprovedImageryBuild,
  assertApprovedImageryIdentity,
} from "./imagery-contract.ts";

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
const SOURCE_NAME =
  "Copernicus Sentinel-2 Collection 1 Level-2A Surface Reflectance / AWS Open Data COGs";
const LICENSE_NAME = "Copernicus Sentinel Data Legal Notice (rev. 1)";
const LICENSE = "https://cds.climate.copernicus.eu/licences/ec-sentinel";
const hash = (bytes: Buffer) =>
  createHash("sha256").update(bytes).digest("hex");

async function safeRead(
  root: string,
  file: string,
  maximum = 512 * 1024 * 1024,
) {
  const base = await realpath(root),
    target = resolve(base, ...file.split("/")),
    rel = relative(base, target);
  if (
    !file ||
    file.split("/").some((part) => !part || part === "..") ||
    isAbsolute(rel) ||
    rel === ".." ||
    rel.startsWith(`..${sep}`)
  )
    throw Error("Unsafe imagery path");
  const info = await lstat(target);
  if (!info.isFile() || info.isSymbolicLink() || info.size > maximum)
    throw Error("Unsafe imagery file");
  return readFile(target);
}

async function publishedFiles(
  root: string,
  directory = "published",
): Promise<string[]> {
  const result: string[] = [];
  for (const entry of await readdir(resolve(root, directory), {
    withFileTypes: true,
  })) {
    if (entry.isSymbolicLink() || (!entry.isFile() && !entry.isDirectory()))
      throw Error("Unsafe imagery published entry");
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) result.push(...(await publishedFiles(root, path)));
    else result.push(path.slice("published/".length));
  }
  return result.sort();
}

async function inspect(options: Options) {
  z.uuid().parse(options.sourceId);
  const lockBytes = await readFile(options.sourceLockPath),
    sourceLock = JSON.parse(lockBytes.toString("utf8"));
  const build = JSON.parse(
    (
      await safeRead(options.releaseDirectory, "build.json", 2 * 1024 * 1024)
    ).toString("utf8"),
  );
  const manifestBytes = await safeRead(
    options.releaseDirectory,
    "published/manifest.json",
    1024 * 1024,
  );
  const manifest = ImageryManifest.parse(
    JSON.parse(manifestBytes.toString("utf8")),
  );
  assertApprovedImageryIdentity(manifest);
  const lockHash = hash(lockBytes),
    manifestHash = hash(manifestBytes);
  assertAuthoritativeAoi(sourceLock.aoi);
  assertApprovedImageryBuild(manifest, build, manifestHash);
  if (
    sourceLock.itemId !== manifest.source.itemId ||
    sourceLock.productId !== manifest.source.productId ||
    sourceLock.sourceCrs !== manifest.sourceCrs ||
    manifest.source.sourceLockSha256 !== lockHash
  )
    throw Error("Imagery provenance mismatch");
  if (
    manifest.delivery.minimumLevel !== 0 ||
    manifest.delivery.maximumLevel !== 14 ||
    manifest.quality.aoiObstructionPercent > 10 ||
    !manifest.quality.aoiContained
  )
    throw Error("Imagery QA gate failed");

  const files: Asset[] = [];
  for (const [name, source] of Object.entries(manifest.source.assets)) {
    const filename =
      name === "item" ? "item.json" : name === "visual" ? "TCI.tif" : "SCL.tif";
    const bytes = await safeRead(options.rawDirectory, filename);
    if (bytes.length !== source.bytes || hash(bytes) !== source.sha256)
      throw Error("Imagery source checksum mismatch");
    files.push({
      zone: "raw",
      file: filename,
      checksum: hash(bytes),
      size: bytes.length,
      contentType: source.mediaType,
      publicUrl: null,
    });
  }
  const copiedLock = await safeRead(
    options.releaseDirectory,
    "raw/source-lock.json",
    1024 * 1024,
  );
  const acquisitionBytes = await safeRead(
      options.releaseDirectory,
      "raw/acquisition.json",
      1024 * 1024,
    ),
    acquisition = JSON.parse(acquisitionBytes.toString("utf8"));
  if (
    !copiedLock.equals(lockBytes) ||
    acquisition.itemId !== manifest.source.itemId ||
    acquisition.acquiredAt !== manifest.source.acquiredAt ||
    Object.entries(manifest.source.assets).some(
      ([name, asset]) =>
        acquisition.assets?.[name]?.sha256 !== asset.sha256 ||
        acquisition.assets?.[name]?.bytes !== asset.bytes,
    )
  )
    throw Error("Imagery acquisition evidence mismatch");
  files.push(
    {
      zone: "raw",
      file: "source-lock.json",
      checksum: lockHash,
      size: copiedLock.length,
      contentType: "application/json",
      publicUrl: null,
    },
    {
      zone: "raw",
      file: "acquisition.json",
      checksum: hash(acquisitionBytes),
      size: acquisitionBytes.length,
      contentType: "application/json",
      publicUrl: null,
    },
  );
  for (const [zone, names] of [
    ["normalized", ["visual-aoi.tif", "scl-aoi.tif"]],
    ["derived", ["visual-aoi-3857.tif", "qa.json"]],
  ] as const)
    for (const name of names) {
      const bytes = await safeRead(options.releaseDirectory, `${zone}/${name}`);
      files.push({
        zone,
        file: name,
        checksum: hash(bytes),
        size: bytes.length,
        contentType: name.endsWith(".json") ? "application/json" : "image/tiff",
        publicUrl: null,
      });
    }
  const expectedPublished = [
    "manifest.json",
    ...Object.keys(manifest.tiles),
  ].sort();
  if (
    !isDeepStrictEqual(
      await publishedFiles(options.releaseDirectory),
      expectedPublished,
    )
  )
    throw Error("Incomplete imagery tile set");
  files.push({
    zone: "published",
    file: "manifest.json",
    checksum: manifestHash,
    size: manifestBytes.length,
    contentType: "application/vnd.land.imagery+json",
    publicUrl: "pending",
  });
  for (const [file, expected] of Object.entries(manifest.tiles)) {
    const bytes = await safeRead(
      options.releaseDirectory,
      `published/${file}`,
      expected.bytes,
    );
    if (
      bytes.length !== expected.bytes ||
      hash(bytes) !== expected.sha256 ||
      !bytes
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    )
      throw Error("Imagery tile checksum or MIME mismatch");
    files.push({
      zone: "published",
      file,
      checksum: expected.sha256,
      size: expected.bytes,
      contentType: "image/png",
      publicUrl: "pending",
    });
  }
  const actualBuild = files.map(({ zone, file, checksum, size }) => ({
    zone,
    file,
    bytes: size,
    sha256: checksum,
  }));
  if (!isDeepStrictEqual(build.files, actualBuild))
    throw Error("Imagery build inventory mismatch");
  return { manifest, build, lockHash, manifestHash, files };
}

export async function registerApprovedImageryRelease(
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
    await client.query("SELECT pg_advisory_xact_lock(81742,17)");
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
      source.license_reference !== LICENSE
    )
      throw Error("RIGHTS REVIEW REQUIRED");
    if (
      source.name !== SOURCE_NAME ||
      source.category !== "IMAGERY" ||
      source.source_crs !== "EPSG:32648" ||
      source.license_name !== LICENSE_NAME
    )
      throw Error("Imagery source identity conflict");

    let dataset = (
      await client.query(
        "SELECT id,kind,source_id FROM datasets WHERE code='TX_IMAGERY_BASE' FOR UPDATE",
      )
    ).rows[0];
    if (!dataset)
      dataset = (
        await client.query(
          "INSERT INTO datasets(code,name,kind,source_id) VALUES('TX_IMAGERY_BASE','Tà Xùa Sentinel-2 L2A true-colour imagery','IMAGERY',$1) RETURNING id,kind,source_id",
          [source.id],
        )
      ).rows[0];
    if (
      !dataset ||
      dataset.kind !== "IMAGERY" ||
      dataset.source_id !== source.id
    )
      throw Error("Imagery dataset identity conflict");

    const m = built.manifest;
    let release = (
      await client.query(
        "SELECT id,source_version,pipeline_version,source_crs,target_crs,vertical_datum,resolution,license,checksum,qa_status,published_at,ARRAY[ST_XMin(bbox),ST_YMin(bbox),ST_XMax(bbox),ST_YMax(bbox)] AS bbox FROM dataset_releases WHERE dataset_id=$1 AND version=$2 FOR UPDATE",
        [dataset.id, m.releaseVersion],
      )
    ).rows[0];
    let reused = true;
    if (!release) {
      reused = false;
      release = (
        await client.query(
          "INSERT INTO dataset_releases(dataset_id,version,source_version,pipeline_version,source_crs,target_crs,vertical_datum,bbox,resolution,license,checksum,qa_status,generated_at) VALUES($1,$2,$3,$4,'EPSG:32648','EPSG:3857','UNKNOWN',ST_MakeEnvelope($5,$6,$7,$8,4326),10,$9,$10,'APPROVED',$11) RETURNING id,source_version,pipeline_version,source_crs,target_crs,vertical_datum,resolution,license,checksum,qa_status,published_at,ARRAY[ST_XMin(bbox),ST_YMin(bbox),ST_XMax(bbox),ST_YMax(bbox)] AS bbox",
          [
            dataset.id,
            m.releaseVersion,
            built.lockHash,
            m.processing.version,
            ...m.bbox,
            LICENSE,
            built.manifestHash,
            m.processing.processedAt,
          ],
        )
      ).rows[0];
    }
    if (
      !release ||
      release.source_version !== built.lockHash ||
      release.pipeline_version !== m.processing.version ||
      release.source_crs !== "EPSG:32648" ||
      release.target_crs !== "EPSG:3857" ||
      release.vertical_datum !== "UNKNOWN" ||
      Number(release.resolution) !== 10 ||
      release.license !== LICENSE ||
      release.checksum !== built.manifestHash ||
      release.qa_status !== "APPROVED" ||
      release.published_at !== null ||
      !isDeepStrictEqual(release.bbox.map(Number), m.bbox)
    )
      throw Error("Approved imagery release identity conflict");

    const assets = built.files
      .map(({ file, ...asset }) => ({
        ...asset,
        objectKey:
          asset.zone === "published"
            ? `spatial/imagery/${dataset.id}/${release.id}/${file}`
            : `${asset.zone}/${m.releaseVersion}/${file}`,
        publicUrl:
          asset.zone === "published"
            ? `/spatial/imagery/${dataset.id}/${release.id}/${file}`
            : null,
      }))
      .sort((a, b) => a.objectKey.localeCompare(b.objectKey));
    const evidence = {
      registration: "APPROVED_OPERATOR",
      itemId: m.source.itemId,
      sourceLockSha256: built.lockHash,
      manifestSha256: built.manifestHash,
      quality: m.quality,
      acquisitionNotice: m.rights.acquisitionNotice,
      verificationStatus: "UNKNOWN",
      accuracy: "UNKNOWN",
      aoi: m.aoi,
      publicMetadata: {
        sourceName: SOURCE_NAME,
        licenseName: LICENSE_NAME,
        licenseReference: LICENSE,
        attribution: m.rights.publicNotice,
        acquisitionNotice: m.rights.acquisitionNotice,
        sourceTimestamp: m.source.sensingAt,
        bbox: m.bbox,
        nativeResolutionMeters: m.nativeResolutionMeters.visual,
        deliveryResolutionMeters: m.delivery.resolutionAtMaximumLevelMeters,
        verificationStatus: "UNKNOWN",
        accuracy: "UNKNOWN",
        limitations: m.limitations,
      },
    };
    if (!reused) {
      const recordId = randomUUID();
      await client.query(
        "INSERT INTO source_records(id,source_id,external_record_id,collected_at,raw_payload_hash,notes) VALUES($1,$2,$3,$4,$5,'Pinned Sentinel Item; verification and accuracy UNKNOWN')",
        [
          recordId,
          source.id,
          m.source.itemId,
          m.source.sensingAt,
          m.source.assets.item.sha256,
        ],
      );
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
      await client.query(
        "INSERT INTO pipeline_runs(dataset_id,release_id,processing_version,status,finished_at,manifest) VALUES($1,$2,$3,'COMPLETED',now(),$4)",
        [dataset.id, release.id, m.processing.version, evidence],
      );
      await client.query(
        "INSERT INTO audit_events(action,subject_type,subject_id,correlation_id,details) VALUES('DATASET_APPROVED_RELEASE_REGISTERED','DATASET_RELEASE',$1,$2,$3)",
        [
          release.id,
          randomUUID(),
          {
            version: m.releaseVersion,
            checksum: built.manifestHash,
            sourceId: source.id,
            itemId: m.source.itemId,
            verification: "UNKNOWN",
            accuracy: "UNKNOWN",
          },
        ],
      );
    } else {
      const registeredAssets = (
        await client.query(
          'SELECT zone,object_key AS "objectKey",checksum,byte_size::int AS size,content_type AS "contentType",public_url AS "publicUrl" FROM dataset_assets WHERE release_id=$1 ORDER BY object_key',
          [release.id],
        )
      ).rows.sort((a, b) => a.objectKey.localeCompare(b.objectKey));
      const counts = (
        await client.query(
          "SELECT (SELECT count(*)::int FROM source_records WHERE source_id=$2 AND external_record_id=$3 AND raw_payload_hash=$4) AS records,(SELECT count(*)::int FROM pipeline_runs WHERE release_id=$1) AS runs,(SELECT count(*)::int FROM audit_events WHERE subject_id=$1 AND action='DATASET_APPROVED_RELEASE_REGISTERED') AS audits",
          [release.id, source.id, m.source.itemId, m.source.assets.item.sha256],
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
        counts.records !== 1 ||
        counts.runs !== 1 ||
        counts.audits !== 1 ||
        run.processing_version !== m.processing.version ||
        run.status !== "COMPLETED" ||
        !isDeepStrictEqual(run.manifest, evidence)
      )
        throw Error("Approved imagery registration conflict");
    }
    await client.query("COMMIT");
    return {
      datasetId: dataset.id,
      releaseId: release.id,
      version: m.releaseVersion,
      status: "APPROVED" as const,
      checksum: built.manifestHash,
      tiles: m.tileCount,
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
        "Usage: register-approved-imagery-release.ts <reviewed-source-uuid> <release-directory>",
      );
    const repository = fileURLToPath(new URL("..", import.meta.url));
    pool = new pg.Pool(databaseOptions(process.env, true));
    console.log(
      JSON.stringify(
        await registerApprovedImageryRelease(pool, {
          sourceId: process.argv[2]!,
          releaseDirectory: process.argv[3]!,
          sourceLockPath: resolve(repository, "pipelines/imagery.lock.json"),
          rawDirectory: resolve(
            repository,
            "work/gis/raw/S2C_T48QVJ_20260527T033930_L2A",
          ),
        }),
      ),
    );
  } catch {
    console.error(
      "LAND approved imagery registration failed; verify operator authority, reviewed rights and immutable candidate evidence (values suppressed)",
    );
    process.exitCode = 1;
  } finally {
    await pool?.end();
  }
}
