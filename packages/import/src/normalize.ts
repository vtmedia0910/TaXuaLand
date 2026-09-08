import { createHash } from "node:crypto";
import { type z } from "zod";
import {
  type ImportField,
  type ImportIssue,
  type WorkbookSheet,
} from "../../contracts/src/import";
import { makeSlug, normalizeVietnamese, SafeUrl } from "../../domain/src/index";
import { parseCoordinates } from "../../spatial-types/src/index";
const aliases: Record<ImportField, string[]> = {
  name: ["name", "ten", "dia diem", "ten dia diem"],
  slug: ["slug"],
  area: ["area", "khu vuc", "dia phuong"],
  coordinates: ["coordinates", "toa do"],
  google_maps_url: [
    "google maps url",
    "url google map",
    "google map",
    "link google maps",
  ],
  categories: ["category", "categories", "danh muc", "loai dia diem"],
  best_season: ["best season", "mua phu hop"],
  recommended_time: ["recommended time", "thoi gian phu hop"],
  difficulty: ["difficulty", "do kho"],
  audience: ["audience", "doi tuong"],
  guide_requirement: ["guide requirement", "huong dan vien"],
  access_method: ["access method", "phuong tien", "phuong thuc tiep can"],
  road_condition: ["road condition", "tinh trang duong"],
  route_note: ["route note", "ghi chu duong di"],
  short_description: ["short description", "gioi thieu ngan", "mo ta ngan"],
  description: ["description", "mo ta"],
  highlight: ["highlight", "review", "diem noi bat", "danh gia"],
  safety_note: ["safety note", "luu y an toan", "ghi chu an toan"],
  image_urls: ["image url", "image urls", "url anh", "hinh anh"],
  video_urls: ["video url", "video urls", "url video"],
  source: ["source", "nguon"],
  source_updated_at: ["source updated at", "ngay cap nhat nguon"],
  notes: ["notes", "ghi chu"],
};
const headerKey = (s: string) =>
  normalizeVietnamese(s.replaceAll("_", " ")).replace(/\s+/g, " ").trim();
export function suggestMapping(headers: string[]): Record<string, ImportField> {
  const mapping: Record<string, ImportField> = {};
  const used = new Set<ImportField>();
  headers.forEach((header, index) => {
    const field = (Object.keys(aliases) as ImportField[]).find((f) =>
      aliases[f].includes(headerKey(header)),
    );
    if (field && !used.has(field)) {
      mapping[String(index)] = field;
      used.add(field);
    }
  });
  return mapping;
}
export function mapsCoordinateCandidate(
  value: string,
): { longitude: number; latitude: number } | null {
  const safe = SafeUrl.safeParse(value);
  if (!safe.success) return null;
  const url = new URL(value);
  if (
    !["www.google.com", "google.com", "maps.google.com"].includes(url.hostname)
  )
    return null;
  const raw = url.searchParams.get("query") ?? url.searchParams.get("q");
  if (!raw) return null;
  const result = parseCoordinates(raw);
  return result.issues.length === 0 ? result.position : null;
}
export function normalizeImportRow(
  row: z.infer<typeof WorkbookSheet>["rows"][number],
  mapping: Record<string, ImportField>,
  sourceId: string,
  categories: Array<{ id: string; code: string; name: string }>,
) {
  const fields: Partial<Record<ImportField, string>> = {},
    issues: ImportIssue[] = [];
  const issue = (
    field: string,
    code: string,
    severity: "WARNING" | "INVALID",
    message: string,
    metadata: Record<string, unknown> = {},
  ) => issues.push({ field, code, severity, message, metadata });
  for (const [column, field] of Object.entries(mapping)) {
    const cell = row.cells[Number(column)];
    fields[field] = cell?.text ?? "";
    if (cell?.issue)
      issue(
        field,
        cell.issue,
        "INVALID",
        "Ô công thức, lỗi hoặc nhạy cảm không được nhập.",
      );
  }
  const coordinate = parseCoordinates(fields.coordinates);
  for (const i of coordinate.issues)
    issue("coordinates", i.code, i.severity, i.message);
  const categoryIds: string[] = [];
  for (const token of (fields.categories ?? "")
    .split(/[,;|\n]/)
    .map((v) => v.trim())
    .filter(Boolean)) {
    const category = categories.find(
      (c) =>
        headerKey(c.code) === headerKey(token) ||
        headerKey(c.name) === headerKey(token),
    );
    if (category) {
      if (!categoryIds.includes(category.id)) categoryIds.push(category.id);
    } else
      issue(
        "categories",
        "UNKNOWN_CATEGORY",
        "WARNING",
        `Danh mục chưa có mapping: ${token.slice(0, 100)}`,
      );
  }
  if (!categoryIds.length)
    issue(
      "categories",
      "CATEGORY_REQUIRED_FOR_PUBLICATION",
      "WARNING",
      "Chưa có danh mục hợp lệ để xuất bản.",
    );
  const urls = (field: ImportField) =>
    (fields[field] ?? "")
      .split(/[;|\n]/)
      .map((v) => v.trim())
      .filter(Boolean)
      .filter((url) => {
        if (!SafeUrl.safeParse(url).success) {
          issue(
            field,
            "INVALID_URL",
            "INVALID",
            "Chỉ hỗ trợ URL HTTPS không chứa credential.",
          );
          return false;
        }
        return true;
      });
  const images = urls("image_urls"),
    videos = urls("video_urls"),
    maps = urls("google_maps_url");
  if (!maps.length)
    issue(
      "google_maps_url",
      "MISSING_MAP_REFERENCE",
      "WARNING",
      "Chưa có liên kết bản đồ tham khảo.",
    );
  if (!images.length)
    issue("image_urls", "MISSING_IMAGE", "WARNING", "Chưa có URL ảnh.");
  let observedAt: string | null = null;
  if (fields.source_updated_at) {
    const raw = fields.source_updated_at;
    if (
      /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)?$/.test(raw) &&
      Number.isFinite(Date.parse(raw))
    ) {
      observedAt = new Date(raw).toISOString();
      if (raw.length === 10 && observedAt.slice(0, 10) !== raw) {
        observedAt = null;
        issue(
          "source_updated_at",
          "INVALID_DATE",
          "INVALID",
          "Ngày không tồn tại.",
        );
      }
    } else
      issue(
        "source_updated_at",
        "AMBIGUOUS_DATE",
        "INVALID",
        "Ngày nguồn cần YYYY-MM-DD hoặc ISO UTC.",
      );
  }
  const data = {
    name: fields.name ?? "",
    slug: fields.slug || makeSlug(fields.name ?? ""),
    shortDescription: fields.short_description ?? "",
    description: [fields.description, fields.highlight]
      .filter(Boolean)
      .join("\n\n"),
    areaName: fields.area ?? "",
    internalNotes: [
      fields.notes,
      fields.source ? `Source label from workbook: ${fields.source}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
    sourceId,
    sourceObservedAt: observedAt,
    location: coordinate.position,
    horizontalAccuracyMeters: null,
    geometryChangeConfirmed: false,
    categoryIds,
    visitContext: {
      bestSeasonText: fields.best_season ?? "",
      recommendedTimeText: fields.recommended_time ?? "",
      difficulty: fields.difficulty ?? "",
      audienceText: fields.audience ?? "",
      guideRequirement: fields.guide_requirement ?? "",
    },
    accessContext: {
      accessMethodText: fields.access_method ?? "",
      roadConditionText: fields.road_condition ?? "",
      routeNote: fields.route_note ?? "",
      observedAt,
    },
    safetyNotes: fields.safety_note
      ? [{ note: fields.safety_note, observedAt, expiresAt: null }]
      : [],
    media: [
      ...images.map((sourceUrl) => ({
        mediaType: "IMAGE" as const,
        sourceUrl,
        title: null,
        altText: "",
        capturedAt: null,
      })),
      ...videos.map((sourceUrl) => ({
        mediaType: "VIDEO_LINK" as const,
        sourceUrl,
        title: null,
        altText: "",
        capturedAt: null,
      })),
    ],
    externalReferences: maps.map((externalUrl) => ({
      provider: "Google Maps reference",
      externalUrl,
    })),
  };
  if (!data.name.trim())
    issue("name", "MISSING_REQUIRED_FIELD", "INVALID", "Thiếu tên địa điểm.");
  return {
    data,
    issues,
    raw: fields,
    hash: createHash("sha256").update(JSON.stringify(fields)).digest("hex"),
    coordinateCandidate: coordinate.candidate,
    mapCandidates: maps.map(mapsCoordinateCandidate).filter(Boolean),
  };
}
