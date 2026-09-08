import type { PoolClient } from "pg";
import type { Wgs84Position } from "../../../packages/spatial-types/src/index";
import { spatialWarnings } from "./places";
/** Map context is a review warning, never evidence of accessibility or safety. */
export async function importSpatialWarnings(
  client: PoolClient,
  location: Wgs84Position | null,
) {
  const issues = await spatialWarnings(client, location);
  if (location) {
    const context = (
      await client.query<{ loaded: boolean; nearby: boolean }>(
        `SELECT EXISTS(SELECT 1 FROM road_segments rs JOIN dataset_releases r ON r.id=rs.release_id WHERE r.qa_status='PUBLISHED') AS loaded,EXISTS(SELECT 1 FROM road_segments rs JOIN dataset_releases r ON r.id=rs.release_id WHERE r.qa_status='PUBLISHED' AND ST_DWithin(rs.geometry::geography,ST_SetSRID(ST_MakePoint($1,$2),4326)::geography,500)) AS nearby`,
        [location.longitude, location.latitude],
      )
    ).rows[0]!;
    if (context.loaded && !context.nearby)
      issues.push({
        code: "DISTANT_FROM_MAPPED_ROAD",
        severity: "WARNING",
        message:
          "Không có đường đã công bố trong 500 m. Khoảng cách bản đồ không xác nhận khả năng tiếp cận; cần đối chiếu.",
      });
  }
  return issues;
}
