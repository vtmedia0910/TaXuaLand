import { z } from "zod";
export const ImportField = z.enum([
  "name",
  "slug",
  "area",
  "coordinates",
  "google_maps_url",
  "categories",
  "best_season",
  "recommended_time",
  "difficulty",
  "audience",
  "guide_requirement",
  "access_method",
  "road_condition",
  "route_note",
  "short_description",
  "description",
  "highlight",
  "safety_note",
  "image_urls",
  "video_urls",
  "source",
  "source_updated_at",
  "notes",
]);
export type ImportField = z.infer<typeof ImportField>;
export const ColumnMapping = z
  .record(z.string().regex(/^(0|[1-9][0-9]?)$/), ImportField)
  .refine(
    (m) => new Set(Object.values(m)).size === Object.keys(m).length,
    "Mỗi trường chỉ được nhận một cột.",
  )
  .refine(
    (m) => Object.values(m).includes("name"),
    "Cần mapping tên địa điểm.",
  );
export const WorkbookCell = z
  .object({
    text: z.string().max(10000),
    issue: z
      .enum([
        "FORMULA_NOT_IMPORTED",
        "UNSUPPORTED_CELL",
        "SENSITIVE_VALUE_REDACTED",
      ])
      .nullable(),
  })
  .strict();
export const WorkbookSheet = z
  .object({
    index: z.number().int(),
    name: z.string(),
    blocked: z.boolean(),
    reason: z.string().nullable(),
    headerRow: z.number().int(),
    headers: z.array(z.string()),
    rows: z.array(
      z
        .object({ rowNumber: z.number().int(), cells: z.array(WorkbookCell) })
        .strict(),
    ),
  })
  .strict();
export const InspectedWorkbook = z
  .object({
    sheets: z.array(WorkbookSheet),
    parserVersion: z.literal("land-xlsx-1"),
  })
  .strict();
export type InspectedWorkbook = z.infer<typeof InspectedWorkbook>;
export const ImportIssue = z
  .object({
    field: z.string(),
    code: z.string(),
    severity: z.enum(["WARNING", "INVALID"]),
    message: z.string(),
    metadata: z.record(z.string(), z.unknown()).default({}),
  })
  .strict();
export type ImportIssue = z.infer<typeof ImportIssue>;
export const ValidateImportCommand = z
  .object({
    version: z.number().int().positive(),
    sheetIndex: z.number().int().nonnegative(),
    mapping: ColumnMapping,
  })
  .strict();
export const IMPORT_LIMITS = {
  uploadBytes: 8 * 1024 * 1024,
  expandedBytes: 32 * 1024 * 1024,
  entryBytes: 16 * 1024 * 1024,
  entries: 1000,
  sheets: 20,
  rowsPerSheet: 2000,
  columns: 80,
  textBytes: 8 * 1024 * 1024,
  timeoutMs: 20000,
} as const;
