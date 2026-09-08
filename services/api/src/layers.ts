import { database } from "./db";
import { LAND_VIEWER_BASE } from "../../../packages/config/src/viewer";
import { ViewerConfig } from "../../../packages/spatial-types/src/viewer";
export async function publicLayers(): Promise<ViewerConfig> {
  const rows = (
    await database().query<{
      kind: string;
      version: string;
      public_url: string;
      checksum: string;
    }>(
      `SELECT d.kind,r.version,a.public_url,a.checksum FROM datasets d JOIN dataset_releases r ON r.dataset_id=d.id JOIN dataset_assets a ON a.release_id=r.id JOIN sources s ON s.id=d.source_id WHERE r.qa_status='PUBLISHED' AND a.zone='published' AND a.public_url IS NOT NULL AND s.status='ACTIVE' AND s.archived_at IS NULL AND s.public_display='ALLOWED' AND s.redistribution='ALLOWED' AND s.derivatives='ALLOWED' AND ((d.kind='TERRAIN' AND a.content_type='application/vnd.land.terrain+json') OR (d.kind='ROADS' AND a.content_type='application/geo+json')) ORDER BY r.published_at DESC`,
    )
  ).rows;
  const terrain = rows.find((r) => r.kind === "TERRAIN"),
    roads = rows.find((r) => r.kind === "ROADS");
  const aoi = (
    await database().query<{
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
    terrainUrl: terrain?.public_url ?? null,
    terrainRelease: terrain?.version ?? null,
    terrainChecksum: terrain?.checksum ?? null,
    roadsUrl: roads?.public_url ?? null,
    roadsRelease: roads?.version ?? null,
  });
}
