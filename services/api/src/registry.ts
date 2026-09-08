import { z } from "zod";
import { database, transaction } from "./db";
import { audit, requirePermission, type Actor } from "./auth";
import { SourceSchema } from "../../../packages/provenance/src/index";
import { AppError } from "./errors";
import { importDiagnostics } from "./import-diagnostics";
import { publishedBase } from "./published-assets";
export async function listSources(actor: Actor) {
  requirePermission(actor, "read");
  const result = await database().query(
    `SELECT id,name,provider_id AS "providerId",category,authority_level AS "authorityLevel",license_name AS "licenseName",license_reference AS "licenseReference",commercial_use AS "commercialUse",public_display AS "publicDisplay",caching,derivatives,redistribution,legal_reviewed_at AS "legalReviewedAt",source_crs AS "sourceCrs",freshness_class AS "freshnessClass",status,last_checked_at AS "lastCheckedAt" FROM sources WHERE archived_at IS NULL ORDER BY name`,
  );
  return z.array(SourceSchema).parse(JSON.parse(JSON.stringify(result.rows)));
}
export async function registerSource(actor: Actor, input: unknown) {
  requirePermission(actor, "configure");
  const s = SourceSchema.parse(input);
  return transaction(async (client) => {
    await client.query(
      `INSERT INTO sources(id,name,provider_id,category,authority_level,license_name,license_reference,commercial_use,public_display,caching,derivatives,redistribution,legal_reviewed_at,source_crs,freshness_class,status,last_checked_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      [
        s.id,
        s.name,
        s.providerId,
        s.category,
        s.authorityLevel,
        s.licenseName,
        s.licenseReference,
        s.commercialUse,
        s.publicDisplay,
        s.caching,
        s.derivatives,
        s.redistribution,
        s.legalReviewedAt,
        s.sourceCrs,
        s.freshnessClass,
        s.status,
        s.lastCheckedAt,
      ],
    );
    await audit(client, actor, "SOURCE_REGISTERED", "SOURCE", s.id, {
      authority: s.authorityLevel,
      publicDisplay: s.publicDisplay,
    });
    return s;
  });
}
const DatabaseTimestamp = z.iso
  .datetime({ offset: true })
  .transform((value) => new Date(value).toISOString());
export const DatasetReleaseDiagnostic = z
  .object({
    id: z.uuid(),
    version: z.string(),
    sourceVersion: z.string(),
    processingVersion: z.string(),
    sourceCrs: z.string(),
    targetCrs: z.string(),
    verticalDatum: z.string(),
    resolution: z.number().nullable(),
    license: z.string(),
    checksum: z.string(),
    qaStatus: z.string(),
    generatedAt: DatabaseTimestamp,
    publishedAt: DatabaseTimestamp.nullable(),
  })
  .strip();
const Dataset = z
  .object({
    id: z.uuid(),
    code: z.string(),
    name: z.string(),
    kind: z.string(),
    sourceName: z.string(),
    releases: z.array(DatasetReleaseDiagnostic),
  })
  .strip();
export async function listDatasets(actor: Actor) {
  requirePermission(actor, "read");
  const rows = (
    await database().query(
      `SELECT d.id,d.code,d.name,d.kind,s.name AS "sourceName",coalesce((SELECT json_agg(json_build_object('id',r.id,'version',r.version,'sourceVersion',r.source_version,'processingVersion',r.pipeline_version,'sourceCrs',r.source_crs,'targetCrs',r.target_crs,'verticalDatum',r.vertical_datum,'resolution',r.resolution,'license',r.license,'checksum',r.checksum,'qaStatus',r.qa_status,'generatedAt',r.generated_at,'publishedAt',r.published_at) ORDER BY r.generated_at DESC) FROM dataset_releases r WHERE r.dataset_id=d.id),'[]') AS releases FROM datasets d JOIN sources s ON s.id=d.source_id ORDER BY d.code`,
    )
  ).rows;
  return z.array(Dataset).parse(JSON.parse(JSON.stringify(rows)));
}
export const ProviderDiagnostic = z
  .object({
    id: z.string(),
    type: z.string(),
    enabled: z.boolean(),
    credentialStatus: z.enum([
      "CONFIGURED",
      "MISSING",
      "DISABLED",
      "UNHEALTHY",
    ]),
    healthStatus: z.string(),
    lastCheckedAt: z.iso.datetime().nullable(),
    killSwitch: z.boolean(),
  })
  .strip();
export async function diagnostics(actor: Actor) {
  requirePermission(actor, "read");
  const providers = (
    await database().query(
      'SELECT id,type,enabled,credential_status AS "credentialStatus",health_status AS "healthStatus",last_checked_at AS "lastCheckedAt",kill_switch AS "killSwitch" FROM integration_providers ORDER BY id',
    )
  ).rows;
  const databaseReady =
    (
      await database().query(
        "SELECT product FROM product_identity WHERE id=true",
      )
    ).rows[0]?.product === "TAXUA_LAND";
  return {
    database: databaseReady ? "CONFIGURED" : "UNHEALTHY",
    providers: z
      .array(ProviderDiagnostic)
      .parse(JSON.parse(JSON.stringify(providers))),
    sources: await listSources(actor),
    datasets: await listDatasets(actor),
    imports: await importDiagnostics(actor),
  };
}
export async function publishRelease(
  actor: Actor,
  id: string,
  connection = database(),
  env: Record<string, string | undefined> = process.env,
) {
  requirePermission(actor, "configure");
  z.uuid().parse(id);
  const base = publishedBase(env);
  return transaction(async (client) => {
    const release = (
      await client.query<{
        id: string;
        dataset_id: string;
        qa_status: string;
        public_display: string;
        redistribution: string;
        derivatives: string;
        ready: boolean;
      }>(
        `SELECT r.id,r.dataset_id,r.qa_status,s.public_display,s.redistribution,s.derivatives,(s.status='ACTIVE' AND s.archived_at IS NULL AND r.bbox IS NOT NULL AND r.target_crs='EPSG:4326' AND (d.kind<>'TERRAIN' OR (r.vertical_datum='WGS84_ELLIPSOID' AND r.resolution IS NOT NULL)) AND EXISTS(SELECT 1 FROM dataset_assets a WHERE a.release_id=r.id AND a.zone='published' AND a.public_url IS NOT NULL AND a.checksum=r.checksum) AND EXISTS(SELECT 1 FROM pipeline_runs p WHERE p.release_id=r.id AND p.status='COMPLETED')) AS ready FROM dataset_releases r JOIN datasets d ON d.id=r.dataset_id JOIN sources s ON s.id=d.source_id WHERE r.id=$1 FOR UPDATE OF r`,
        [id],
      )
    ).rows[0];
    if (
      base &&
      !(
        await client.query(
          "SELECT release_id FROM spatial_object_deliveries WHERE release_id=$1 AND public_base_url=$2",
          [id, base],
        )
      ).rowCount
    )
      throw new AppError(
        "RELEASE_DELIVERY_REQUIRED",
        409,
        "Release cần được kiểm tra object delivery trước khi publish.",
      );
    if (
      !(
        await client.query(
          "SELECT s.id FROM sources s JOIN datasets d ON d.source_id=s.id JOIN dataset_releases r ON r.dataset_id=d.id WHERE r.id=$1 AND (s.provider_id IS NULL OR EXISTS(SELECT 1 FROM integration_providers p WHERE p.id=s.provider_id AND p.enabled AND NOT p.kill_switch))",
          [id],
        )
      ).rowCount
    )
      throw new AppError("RELEASE_GATE", 409, "Provider không khả dụng.");
    if (
      !release ||
      !release.ready ||
      release.qa_status !== "APPROVED" ||
      release.public_display !== "ALLOWED" ||
      release.redistribution !== "ALLOWED" ||
      release.derivatives !== "ALLOWED"
    )
      throw new AppError(
        "RELEASE_GATE",
        409,
        "Release phải APPROVED và có đủ quyền hiển thị, biến đổi, phân phối.",
      );
    await client.query("SELECT id FROM datasets WHERE id=$1 FOR UPDATE", [
      release.dataset_id,
    ]);
    await client.query(
      "UPDATE dataset_releases SET qa_status='RETIRED' WHERE dataset_id=$1 AND qa_status='PUBLISHED'",
      [release.dataset_id],
    );
    await client.query(
      "UPDATE dataset_releases SET qa_status='PUBLISHED',published_at=now() WHERE id=$1",
      [id],
    );
    await audit(
      client,
      actor,
      "DATASET_RELEASE_PUBLISHED",
      "DATASET_RELEASE",
      id,
    );
  }, connection);
}
