import { database } from "./db";
import { LAND_VIEWER_BASE } from "../../../packages/config/src/viewer";
import {
  GovernedLayerMetadata,
  ViewerConfig,
} from "../../../packages/spatial-types/src/viewer";
import { publishedBase, resolvePublishedAsset } from "./published-assets";
export async function publicLayers(
  connection = database(),
  env: Record<string, string | undefined> = process.env,
): Promise<ViewerConfig> {
  const base = publishedBase(env);
  const rows = (
    await connection.query<{
      kind: string;
      version: string;
      public_url: string;
      checksum: string;
      dataset_id: string;
      release_id: string;
      object_key: string;
      delivered_base: string | null;
      source_name: string;
      license_name: string | null;
      license_reference: string;
      bbox: number[];
      metadata: unknown;
    }>(
      `SELECT d.kind,d.id AS dataset_id,r.id AS release_id,r.version,a.object_key,a.public_url,a.checksum,delivery.public_base_url AS delivered_base,s.name AS source_name,s.license_name,s.license_reference,ARRAY[ST_XMin(r.bbox),ST_YMin(r.bbox),ST_XMax(r.bbox),ST_YMax(r.bbox)] AS bbox,p.manifest->'publicMetadata' AS metadata FROM datasets d JOIN dataset_releases r ON r.dataset_id=d.id JOIN dataset_assets a ON a.release_id=r.id JOIN sources s ON s.id=d.source_id LEFT JOIN LATERAL (SELECT run.manifest FROM pipeline_runs run WHERE run.release_id=r.id AND run.processing_version=r.pipeline_version AND run.status='COMPLETED' AND NOT EXISTS(SELECT 1 FROM pipeline_runs duplicate WHERE duplicate.release_id=run.release_id AND duplicate.processing_version=run.processing_version AND duplicate.status='COMPLETED' AND duplicate.id<>run.id)) p ON true LEFT JOIN spatial_object_deliveries delivery ON delivery.release_id=r.id AND delivery.public_base_url=$1 WHERE r.qa_status='PUBLISHED' AND (d.kind='TERRAIN' OR r.bbox IS NOT NULL) AND a.zone='published' AND a.checksum=r.checksum AND s.status='ACTIVE' AND s.archived_at IS NULL AND s.public_display='ALLOWED' AND s.redistribution='ALLOWED' AND s.derivatives='ALLOWED' AND s.caching='ALLOWED' AND s.license_reference IS NOT NULL AND (s.provider_id IS NULL OR EXISTS(SELECT 1 FROM integration_providers provider WHERE provider.id=s.provider_id AND provider.enabled AND NOT provider.kill_switch)) AND ((d.kind='TERRAIN' AND a.content_type='application/vnd.land.terrain+json') OR (d.kind='ROADS' AND a.content_type='application/geo+json') OR (d.kind='IMAGERY' AND a.content_type='application/vnd.land.imagery+json')) ORDER BY r.published_at DESC,r.id`,
      [base],
    )
  ).rows;
  const resolved = rows
    .map((row) => {
      const parsed = GovernedLayerMetadata.safeParse(row.metadata);
      const metadata =
        parsed.success &&
        parsed.data.sourceName === row.source_name &&
        parsed.data.licenseName === row.license_name &&
        parsed.data.licenseReference === row.license_reference &&
        parsed.data.bbox.every(
          (coordinate, index) => coordinate === Number(row.bbox[index]),
        )
          ? parsed.data
          : null;
      return { ...row, metadata, url: resolvePublishedAsset(row, base) };
    })
    .filter((row) => row.url && (row.kind === "TERRAIN" || row.metadata));
  const terrain = resolved.find((r) => r.kind === "TERRAIN"),
    roads = resolved.find((r) => r.kind === "ROADS"),
    imagery = resolved.find((r) => r.kind === "IMAGERY");
  const aoi = (
    await connection.query<{
      name: string;
      version: string;
      source: string;
      west: number;
      south: number;
      east: number;
      north: number;
    }>(
      "SELECT name,version,source,ST_XMin(boundary) AS west,ST_YMin(boundary) AS south,ST_XMax(boundary) AS east,ST_YMax(boundary) AS north FROM areas_of_interest WHERE active",
    )
  ).rows[0];
  return ViewerConfig.parse({
    ...LAND_VIEWER_BASE,
    aoi: aoi ?? LAND_VIEWER_BASE.aoi,
    terrainUrl: terrain?.url ?? null,
    terrainRelease: terrain?.version ?? null,
    terrainChecksum: terrain?.checksum ?? null,
    roadsUrl: roads?.url ?? null,
    roadsRelease: roads?.version ?? null,
    roadsMetadata: roads?.metadata ?? null,
    imageryManifestUrl: imagery?.url ?? null,
    imageryRelease: imagery?.version ?? null,
    imageryChecksum: imagery?.checksum ?? null,
    imageryMetadata: imagery?.metadata ?? null,
  });
}
