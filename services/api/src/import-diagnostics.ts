import { z } from "zod";
import { database } from "./db";
import { requirePermission, type Actor } from "./auth";

export const ImportDiagnostic = z
  .object({
    id: z.uuid(),
    status: z.string(),
    uploadedAt: z.iso.datetime(),
    validationDurationMs: z.number().int().nullable(),
    totalRows: z.number().int(),
    validRows: z.number().int(),
    warningRows: z.number().int(),
    invalidRows: z.number().int(),
    duplicateRows: z.number().int(),
    errors: z.array(
      z
        .object({
          category: z.string().regex(/^[A-Z_]+$/),
          count: z.number().int(),
        })
        .strip(),
    ),
    commitResult: z
      .object({
        created: z.number().int(),
        updated: z.number().int(),
        skipped: z.number().int(),
      })
      .strip()
      .nullable(),
  })
  .strip();
export async function importDiagnostics(actor: Actor) {
  requirePermission(actor, "read");
  const result = await database().query(`WITH recent AS (
    SELECT * FROM import_batches ORDER BY uploaded_at DESC LIMIT 30
  ) SELECT b.id,b.status,b.uploaded_at AS "uploadedAt",b.validation_duration_ms AS "validationDurationMs",
    b.total_rows AS "totalRows",b.valid_rows AS "validRows",b.warning_rows AS "warningRows",b.invalid_rows AS "invalidRows",
    (SELECT count(*)::int FROM import_rows r WHERE r.batch_id=b.id AND cardinality(r.duplicate_candidate_ids)>0) AS "duplicateRows",
    coalesce((SELECT json_agg(x) FROM (SELECT e.code AS category,count(*)::int AS count FROM import_row_errors e JOIN import_rows r ON r.id=e.import_row_id WHERE r.batch_id=b.id GROUP BY e.code ORDER BY e.code) x),'[]') AS errors,
    b.commit_result AS "commitResult" FROM recent b ORDER BY b.uploaded_at DESC`);
  return z
    .array(ImportDiagnostic)
    .parse(JSON.parse(JSON.stringify(result.rows)));
}
