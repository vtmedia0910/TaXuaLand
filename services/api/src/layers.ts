import { database } from "./db";
import { LAND_VIEWER_BASE } from "../../../packages/config/src/viewer";
import { ViewerConfig } from "../../../packages/spatial-types/src/viewer";
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
    }>(
      `SELECT d.kind,d.id AS dataset_id,r.id AS release_id,r.version,a.object_key,a.public_url,a.checksum,delivery.public_base_url AS delivered_base FROM datasets d JOIN dataset_releases r ON r.dataset_id=d.id JOIN dataset_assets a ON a.release_id=r.id JOIN sources s ON s.id=d.source_id LEFT JOIN spatial_object_deliveries delivery ON delivery.release_id=r.id AND delivery.public_base_url=$1 WHERE r.qa_status='PUBLISHED' AND a.zone='published' AND a.checksum=r.checksum AND s.status='ACTIVE' AND s.archived_at IS NULL AND s.public_display='ALLOWED' AND s.redistribution='ALLOWED' AND s.derivatives='ALLOWED' AND (s.provider_id IS NULL OR EXISTS(SELECT 1 FROM integration_providers provider WHERE provider.id=s.provider_id AND provider.enabled AND NOT provider.kill_switch)) AND ((d.kind='TERRAIN' AND a.content_type='application/vnd.land.terrain+json') OR (d.kind='ROADS' AND a.content_type='application/geo+json')) ORDER BY r.published_at DESC`,
      [base],
    )
  ).rows;
  const resolved = rows
    .map((row) => ({ ...row, url: resolvePublishedAsset(row, base) }))
    .filter((row) => row.url);
  const terrain = resolved.find((r) => r.kind === "TERRAIN"),
    roads = resolved.find((r) => r.kind === "ROADS");
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
  });
}
