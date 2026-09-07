import { z } from "zod";
export const Wgs84Position = z
  .object({
    longitude: z.number().finite().min(-180).max(180),
    latitude: z.number().finite().min(-90).max(90),
    heightMeters: z.number().finite().nullable().optional(),
  })
  .strict();
export type Wgs84Position = z.infer<typeof Wgs84Position>;
export const AoiSchema = z
  .object({
    name: z.string().min(1),
    version: z.string().min(1),
    source: z.string().min(1),
    updatedAt: z.iso.datetime(),
    outsidePolicy: z.enum(["WARNING", "INVALID"]),
    vertices: z.array(Wgs84Position).min(4),
  })
  .strict()
  .refine(({ vertices }) => {
    const first = vertices[0],
      last = vertices.at(-1);
    return (
      first?.longitude === last?.longitude && first?.latitude === last?.latitude
    );
  }, "AOI ring must be closed");
export type Aoi = z.infer<typeof AoiSchema>;
export interface SpatialIssue {
  code:
    | "MISSING_COORDINATE"
    | "INVALID_COORDINATE"
    | "AMBIGUOUS_COORDINATE_ORDER"
    | "OUTSIDE_AOI";
  severity: "WARNING" | "INVALID";
  message: string;
}
export function isInsideAoi(point: Wgs84Position, aoi: Aoi): boolean {
  let inside = false;
  for (
    let i = 0, j = aoi.vertices.length - 1;
    i < aoi.vertices.length;
    j = i++
  ) {
    const a = aoi.vertices[i]!,
      b = aoi.vertices[j]!;
    const cross =
      (point.longitude - a.longitude) * (b.latitude - a.latitude) -
      (point.latitude - a.latitude) * (b.longitude - a.longitude);
    if (
      Math.abs(cross) < 1e-12 &&
      point.longitude >= Math.min(a.longitude, b.longitude) &&
      point.longitude <= Math.max(a.longitude, b.longitude) &&
      point.latitude >= Math.min(a.latitude, b.latitude) &&
      point.latitude <= Math.max(a.latitude, b.latitude)
    )
      return true;
    if (
      a.latitude > point.latitude !== b.latitude > point.latitude &&
      point.longitude <
        ((b.longitude - a.longitude) * (point.latitude - a.latitude)) /
          (b.latitude - a.latitude) +
          a.longitude
    )
      inside = !inside;
  }
  return inside;
}
/** Explicit lat,lon input. A reverse candidate is evidence for review, never a correction. */
export function parseCoordinates(
  input: string | null | undefined,
  aoi?: Aoi,
): {
  position: Wgs84Position | null;
  candidate: Wgs84Position | null;
  issues: SpatialIssue[];
} {
  if (!input?.trim())
    return {
      position: null,
      candidate: null,
      issues: [
        {
          code: "MISSING_COORDINATE",
          severity: "INVALID",
          message: "Chưa có tọa độ.",
        },
      ],
    };
  const match = /^\s*([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)\s*$/.exec(
    input,
  );
  if (!match)
    return {
      position: null,
      candidate: null,
      issues: [
        {
          code: "INVALID_COORDINATE",
          severity: "INVALID",
          message: "Nhập vĩ độ, kinh độ bằng số thập phân.",
        },
      ],
    };
  const latitude = Number(match[1]),
    longitude = Number(match[2]);
  const normal = Wgs84Position.safeParse({ latitude, longitude });
  const reverse = Wgs84Position.safeParse({
    latitude: longitude,
    longitude: latitude,
  });
  if (!normal.success)
    return {
      position: null,
      candidate: reverse.success ? reverse.data : null,
      issues: [
        {
          code: reverse.success
            ? "AMBIGUOUS_COORDINATE_ORDER"
            : "INVALID_COORDINATE",
          severity: "INVALID",
          message:
            "Tọa độ ngoài giới hạn hoặc ngược thứ tự. Cần sửa và xác nhận.",
        },
      ],
    };
  const issues: SpatialIssue[] = [];
  if (
    reverse.success &&
    latitude !== longitude &&
    (!aoi || !isInsideAoi(normal.data, aoi) || isInsideAoi(reverse.data, aoi))
  )
    issues.push({
      code: "AMBIGUOUS_COORDINATE_ORDER",
      severity: "WARNING",
      message: "Cả hai thứ tự có thể hợp lệ; cần xác nhận vĩ độ, kinh độ.",
    });
  if (aoi && !isInsideAoi(normal.data, aoi))
    issues.push({
      code: "OUTSIDE_AOI",
      severity: aoi.outsidePolicy,
      message: "Điểm nằm ngoài vùng nghiên cứu đã cấu hình.",
    });
  return {
    position: normal.data,
    candidate:
      issues.some((i) => i.code === "AMBIGUOUS_COORDINATE_ORDER") &&
      reverse.success
        ? reverse.data
        : null,
    issues,
  };
}
