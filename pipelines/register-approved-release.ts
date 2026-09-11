/** Operator-only metadata registration for an already reviewed terrain build. */
import { createHash, randomUUID } from "node:crypto";
import { lstat, readFile, realpath } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import pg from "pg";
import { z } from "zod";
import { databaseOptions } from "../packages/config/src/database.ts";
import { TerrainManifest } from "../packages/spatial-types/src/terrain.ts";

const Sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const SourceArtifact = z
  .object({
    filename: z.string().regex(/^[A-Za-z0-9._-]+$/),
    url: z.url().startsWith("https://"),
    sha256: Sha256,
    bytes: z.number().int().positive().max(128 * 1024 * 1024),
    downloadedAt: z.iso.datetime({ offset: true }),
  })
  .strict();
const SourceLock = z
  .object({ dem: SourceArtifact, geoid: SourceArtifact })
  .strict();
const TerrainQa = z
  .object({
    horizontalRoundTripMaxMeters: z.number().nonnegative().max(0.001),
    verticalRoundTripMaxMeters: z.number().nonnegative().max(0.001),
    geoidIndependentComparisonMaxMeters: z.number().nonnegative().max(0.001),
    noDataCount: z.literal(0),
    seamErrorMeters: z.literal(0),
    samples: z.array(
      z.object({ verificationStatus: z.literal("UNKNOWN") }).passthrough(),
    ),
    fieldControlPoints: z.literal("UNKNOWN"),
    absoluteLocalAccuracy: z.literal("UNKNOWN"),
  })
  .passthrough();
const BuildEvidence = z
  .object({
    sourceLock: SourceLock,
    manifestSha256: Sha256,
    qa: TerrainQa,
  })
  .passthrough();

type Pool = InstanceType<typeof pg.Pool>;
type RegistrationOptions = {
  sourceId: string;
  releaseDirectory: string;
  rawDirectory: string;
  qaEvidencePath: string;
  sourceLockPath: string;
};
type FileDescriptor = {
  zone: "raw" | "normalized" | "derived" | "published";
  file: string;
  checksum: string;
  size: number;
  contentType: string;
  public: boolean;
};

const hash = (bytes: Buffer) =>
  createHash("sha256").update(bytes).digest("hex");

async function readStandalone(path: string, maximum = 1024 * 1024) {
  const info = await lstat(path);
  if (info.isSymbolicLink() || !info.isFile() || info.size > maximum)
    throw Error("Unsafe terrain evidence file");
  return readFile(path);
}

async function readWithin(root: string, file: string, maximum: number) {
  if (!file || file.split("/").some((part) => !part || part === ".."))
    throw Error("Unsafe terrain asset path");
  let path = root;
  for (const part of file.split("/")) {
    path = resolve(path, part);
    if ((await lstat(path)).isSymbolicLink())
      throw Error("Terrain symlink rejected");
  }
  const actual = await realpath(path);
  const rel = relative(root, actual);
  if (isAbsolute(rel) || rel === ".." || rel.startsWith(`..${sep}`))
    throw Error("Unsafe terrain asset path");
  const info = await lstat(actual);
  if (!info.isFile() || info.size > maximum)
    throw Error("Invalid terrain asset size");
  return readFile(actual);
}

async function json(path: string) {
  return JSON.parse((await readStandalone(path)).toString("utf8")) as unknown;
}

function terrainQa(input: unknown) {
  const parsed = TerrainQa.safeParse(input);
  if (!parsed.success) throw Error("Terrain QA gate failed");
  return parsed.data;
}

async function descriptor(
  root: string,
  zone: FileDescriptor["zone"],
  file: string,
  contentType: string,
  maximum = 128 * 1024 * 1024,
): Promise<FileDescriptor> {
  const bytes = await readWithin(root, file, maximum);
  return {
    zone,
    file,
    checksum: hash(bytes),
    size: bytes.length,
    contentType,
    public: zone === "published",
  };
}

async function inspectBuild(options: RegistrationOptions) {
  z.uuid().parse(options.sourceId);
  const releaseRoot = await realpath(options.releaseDirectory);
  const rawRoot = await realpath(options.rawDirectory);
  const sourceLock = SourceLock.parse(await json(options.sourceLockPath));
  const qaEvidence = terrainQa(await json(options.qaEvidencePath));
  const qa = terrainQa(await json(resolve(releaseRoot, "qa.json")));
  const build = BuildEvidence.parse(await json(resolve(releaseRoot, "build.json")));
  if (
    !isDeepStrictEqual(sourceLock, build.sourceLock) ||
    !isDeepStrictEqual(qa, build.qa) ||
    !isDeepStrictEqual(qa, qaEvidence)
  )
    throw Error("Terrain QA evidence mismatch");

  const manifestBytes = await readWithin(
    releaseRoot,
    "published/manifest.json",
    1024 * 1024,
  );
  if (hash(manifestBytes) !== build.manifestSha256)
    throw Error("Terrain manifest checksum mismatch");
  const manifest = TerrainManifest.parse(
    JSON.parse(manifestBytes.toString("utf8")),
  );
  if (
    manifest.version !== releaseRoot.split(sep).at(-1) ||
    manifest.sourceVersion !== sourceLock.dem.sha256 ||
    manifest.geoidVersion !== sourceLock.geoid.sha256
  )
    throw Error("Terrain provenance mismatch");

  const files: FileDescriptor[] = [];
  for (const item of [sourceLock.dem, sourceLock.geoid]) {
    const raw = await descriptor(rawRoot, "raw", item.filename, "image/tiff");
    if (raw.checksum !== item.sha256 || raw.size !== item.bytes)
      throw Error("Terrain source lock mismatch");
    files.push(raw);
  }
  files.push(
    await descriptor(
      releaseRoot,
      "normalized",
      "normalized/orthometric-utm48n.tif",
      "image/tiff",
    ),
    await descriptor(
      releaseRoot,
      "normalized",
      "normalized/ellipsoid-utm48n.tif",
      "image/tiff",
    ),
    await descriptor(
      releaseRoot,
      "derived",
      "derived/height-grid.npy",
      "application/octet-stream",
    ),
    {
      zone: "published",
      file: "manifest.json",
      checksum: hash(manifestBytes),
      size: manifestBytes.length,
      contentType: "application/vnd.land.terrain+json",
      public: true,
    },
  );
  for (const [file, expected] of Object.entries(manifest.tiles)) {
    const tile = await descriptor(
      releaseRoot,
      "published",
      `published/${file}`,
      "application/octet-stream",
      expected.bytes,
    );
    tile.file = file;
    if (tile.size !== expected.bytes || tile.checksum !== expected.sha256)
      throw Error("Terrain tile checksum mismatch");
    files.push(tile);
  }
  return { sourceLock, qa, manifest, files };
}

function assetRows(
  files: FileDescriptor[],
  version: string,
  datasetId: string,
  releaseId: string,
) {
  return files
    .map((file) => {
      const objectKey = file.public
        ? `spatial/terrain/${datasetId}/${releaseId}/${file.file}`
        : `${file.zone}/${version}/${file.file.split("/").at(-1)}`;
      return {
        zone: file.zone,
        objectKey,
        checksum: file.checksum,
        size: file.size,
        contentType: file.contentType,
        publicUrl: file.public ? `/${objectKey}` : null,
      };
    })
    .sort((a, b) => a.objectKey.localeCompare(b.objectKey));
}

export async function registerApprovedTerrainRelease(
  pool: Pool,
  options: RegistrationOptions,
) {
  const inspected = await inspectBuild(options);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
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
    await client.query("SELECT pg_advisory_xact_lock(81742,15)");
    const source = (
      await client.query<{
        id: string;
        name: string;
        category: string;
        source_crs: string;
        status: string;
        archived_at: Date | null;
        public_display: string;
        redistribution: string;
        derivatives: string;
        caching: string;
        license_reference: string | null;
      }>(
        "SELECT id,name,category,source_crs,status,archived_at,public_display,redistribution,derivatives,caching,license_reference FROM sources WHERE id=$1 FOR SHARE",
        [options.sourceId],
      )
    ).rows[0];
    if (
      !source ||
      source.status !== "ACTIVE" ||
      source.archived_at ||
      [
        source.public_display,
        source.redistribution,
        source.derivatives,
        source.caching,
      ].some((right) => right !== "ALLOWED") ||
      !source.license_reference ||
      source.license_reference !== inspected.manifest.license
    )
      throw Error("RIGHTS REVIEW REQUIRED");
    if (source.name !== inspected.manifest.source)
      throw Error("Terrain source identity mismatch");
    if (
      source.category !== "TERRAIN" ||
      source.source_crs !== inspected.manifest.horizontalCrs
    )
      throw Error("Terrain source contract mismatch");

    let dataset = (
      await client.query<{
        id: string;
        kind: string;
        source_id: string;
      }>("SELECT id,kind,source_id FROM datasets WHERE code='TX_TERRAIN_BASE' FOR UPDATE")
    ).rows[0];
    if (!dataset)
      dataset = (
        await client.query(
          "INSERT INTO datasets(code,name,kind,source_id) VALUES('TX_TERRAIN_BASE','TX_TERRAIN_BASE','TERRAIN',$1) RETURNING id,kind,source_id",
          [source.id],
        )
      ).rows[0];
    if (!dataset) throw Error("Terrain dataset registration failed");
    if (dataset.kind !== "TERRAIN" || dataset.source_id !== source.id)
      throw Error("Terrain dataset identity conflict");

    const manifest = inspected.manifest;
    let release = (
      await client.query<{
        id: string;
        source_version: string;
        pipeline_version: string;
        source_crs: string;
        target_crs: string;
        vertical_datum: string;
        resolution: number;
        license: string;
        checksum: string;
        qa_status: string;
        published_at: Date | null;
        bbox: number[];
      }>(
        "SELECT id,source_version,pipeline_version,source_crs,target_crs,vertical_datum,resolution,license,checksum,qa_status,published_at,ARRAY[ST_XMin(bbox),ST_YMin(bbox),ST_XMax(bbox),ST_YMax(bbox)] AS bbox FROM dataset_releases WHERE dataset_id=$1 AND version=$2 FOR UPDATE",
        [dataset.id, manifest.version],
      )
    ).rows[0];
    let reused = true;
    if (!release) {
      reused = false;
      release = (
        await client.query(
          "INSERT INTO dataset_releases(dataset_id,version,source_version,pipeline_version,source_crs,target_crs,vertical_datum,bbox,resolution,license,checksum,qa_status) VALUES($1,$2,$3,$4,$5,'EPSG:4326',$6,ST_MakeEnvelope($7,$8,$9,$10,4326),$11,$12,$13,'APPROVED') RETURNING id,source_version,pipeline_version,source_crs,target_crs,vertical_datum,resolution,license,checksum,qa_status,published_at,ARRAY[ST_XMin(bbox),ST_YMin(bbox),ST_XMax(bbox),ST_YMax(bbox)] AS bbox",
          [
            dataset.id,
            manifest.version,
            manifest.sourceVersion,
            manifest.processingVersion,
            manifest.horizontalCrs,
            manifest.verticalDatum,
            ...manifest.bbox,
            manifest.resolutionMeters,
            manifest.license,
            inspected.files.find((file) => file.file === "manifest.json")!
              .checksum,
          ],
        )
      ).rows[0];
    }
    if (!release) throw Error("Terrain release registration failed");
    const manifestChecksum = inspected.files.find(
      (file) => file.file === "manifest.json",
    )!.checksum;
    if (
      release.source_version !== manifest.sourceVersion ||
      release.pipeline_version !== manifest.processingVersion ||
      release.source_crs !== manifest.horizontalCrs ||
      release.target_crs !== "EPSG:4326" ||
      release.vertical_datum !== manifest.verticalDatum ||
      release.resolution !== manifest.resolutionMeters ||
      release.license !== manifest.license ||
      release.checksum !== manifestChecksum ||
      release.qa_status !== "APPROVED" ||
      release.published_at !== null ||
      !isDeepStrictEqual(release.bbox.map(Number), manifest.bbox)
    )
      throw Error("Approved release identity conflict");

    const assets = assetRows(
      inspected.files,
      manifest.version,
      dataset.id,
      release.id,
    );
    const pipelineEvidence = {
      registration: "APPROVED_OPERATOR",
      sourceLock: inspected.sourceLock,
      qa: inspected.qa,
      licenseEvidence: manifest.license,
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
      await client.query(
        "INSERT INTO pipeline_runs(dataset_id,release_id,processing_version,status,finished_at,manifest) VALUES($1,$2,$3,'COMPLETED',now(),$4)",
        [dataset.id, release.id, manifest.processingVersion, pipelineEvidence],
      );
      await client.query(
        "INSERT INTO audit_events(action,subject_type,subject_id,correlation_id,details) VALUES('DATASET_APPROVED_RELEASE_REGISTERED','DATASET_RELEASE',$1,$2,$3)",
        [
          release.id,
          randomUUID(),
          {
            version: manifest.version,
            checksum: manifestChecksum,
            sourceId: source.id,
            fieldVerification: "UNKNOWN",
            accuracy: "UNKNOWN",
            actor: "LAND operator CLI",
          },
        ],
      );
    } else {
      const registeredAssets = (
        await client.query(
          "SELECT zone,object_key AS \"objectKey\",checksum,byte_size::int AS size,content_type AS \"contentType\",public_url AS \"publicUrl\" FROM dataset_assets WHERE release_id=$1 ORDER BY object_key",
          [release.id],
        )
      ).rows;
      const runs = (
        await client.query(
          "SELECT processing_version,status,manifest FROM pipeline_runs WHERE release_id=$1",
          [release.id],
        )
      ).rows;
      const audits = await client.query(
        "SELECT 1 FROM audit_events WHERE subject_id=$1 AND action='DATASET_APPROVED_RELEASE_REGISTERED'",
        [release.id],
      );
      if (
        !isDeepStrictEqual(registeredAssets, assets) ||
        runs.length !== 1 ||
        runs[0].processing_version !== manifest.processingVersion ||
        runs[0].status !== "COMPLETED" ||
        !isDeepStrictEqual(runs[0].manifest, pipelineEvidence) ||
        audits.rowCount !== 1
      )
        throw Error("Approved release registration conflict");
    }
    await client.query("COMMIT");
    return {
      datasetId: dataset.id,
      releaseId: release.id,
      version: manifest.version,
      status: "APPROVED" as const,
      checksum: manifestChecksum,
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
    if (process.argv.length !== 5 || !process.env.DATABASE_URL)
      throw Error(
        "Usage: register-approved-release.ts <reviewed-source-uuid> <terrain-release-directory> <qa-evidence-json>",
      );
    const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
    pool = new pg.Pool(databaseOptions(process.env, true));
    console.log(
      JSON.stringify(
        await registerApprovedTerrainRelease(pool, {
          sourceId: process.argv[2]!,
          releaseDirectory: process.argv[3]!,
          qaEvidencePath: process.argv[4]!,
          sourceLockPath: resolve(repositoryRoot, "pipelines/sources.lock.json"),
          rawDirectory: resolve(repositoryRoot, "work/gis/raw"),
        }),
      ),
    );
  } catch (error) {
    console.error(
      error instanceof Error && error.message === "RIGHTS REVIEW REQUIRED"
        ? error.message
        : "LAND approved terrain registration failed; verify operator authority, reviewed source rights and release evidence (values suppressed)",
    );
    process.exitCode = 1;
  } finally {
    await pool?.end();
  }
}
