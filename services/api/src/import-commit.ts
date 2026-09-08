import { z } from "zod";
import { audit, requirePermission, type Actor } from "./auth";
import { database, transaction } from "./db";
import { AppError } from "./errors";
import type { ImportBatch } from "./imports";
import type { StagedRow } from "./import-review";
import { PlaceInput } from "./place-input";
import { savePlaceInTransaction } from "./places";
import { importSpatialWarnings } from "./import-spatial";

export const CommitImportCommand = z
  .object({
    version: z.number().int().positive(),
    confirmed: z.literal(true),
  })
  .strict();
export interface ImportCommitResult {
  batchId: string;
  created: number;
  updated: number;
  skipped: number;
  rows: Array<{
    rowNumber: number;
    action: "CREATE" | "UPDATE" | "SKIP";
    placeId: string | null;
  }>;
}

/** A batch is the idempotency boundary. An error rolls back places, provenance and audit together. */
export async function commitImport(
  actor: Actor,
  id: string,
  input: unknown,
  connection = database(),
): Promise<ImportCommitResult> {
  requirePermission(actor, "import");
  z.uuid().parse(id);
  const command = CommitImportCommand.parse(input);
  try {
    return await transaction(async (client) => {
      await client.query("SET LOCAL lock_timeout='5s'");
      await client.query("SET LOCAL statement_timeout='15s'");
      // Serialize import writers so two batches cannot bypass each other's duplicate review.
      await client.query("SELECT pg_advisory_xact_lock(81742,12)");
      const batch = (
        await client.query<
          ImportBatch & { commit_result: ImportCommitResult | null }
        >("SELECT * FROM import_batches WHERE id=$1 FOR UPDATE", [id])
      ).rows[0];
      if (!batch)
        throw new AppError("NOT_FOUND", 404, "Không tìm thấy lô import.");
      if (batch.status === "COMMITTED" && batch.commit_result)
        return batch.commit_result;
      if (batch.status !== "READY_FOR_REVIEW" || batch.expires_at <= new Date())
        throw new AppError(
          "IMPORT_NOT_COMMITTABLE",
          409,
          "Lô chưa sẵn sàng hoặc đã hết hạn.",
        );
      if (batch.version !== command.version)
        throw new AppError(
          "VERSION_CONFLICT",
          409,
          "Lô đã thay đổi; tải lại và kiểm tra quyết định.",
        );
      const rows = (
        await client.query<StagedRow>(
          "SELECT * FROM import_rows WHERE batch_id=$1 ORDER BY row_number FOR UPDATE",
          [id],
        )
      ).rows;
      if (
        !rows.length ||
        rows.length !== batch.total_rows ||
        rows.some(
          (r) =>
            r.admin_action === "REVIEW_LATER" ||
            !r.reviewed_at ||
            !r.reviewed_by,
        )
      )
        throw new AppError(
          "IMPORT_REVIEW_INCOMPLETE",
          409,
          "Quyết định tạo/cập nhật/bỏ qua cho toàn bộ dòng trước khi commit.",
        );
      const source = await client.query(
        "SELECT id FROM sources WHERE id=$1 AND archived_at IS NULL AND status<>'DISABLED' FOR SHARE",
        [batch.source_id],
      );
      if (!source.rowCount)
        throw new AppError(
          "INVALID_SOURCE",
          409,
          "Nguồn import đã ngừng khả dụng.",
        );
      await client.query("SELECT public.lock_import_aoi()");
      const targets = rows
        .filter((r) => r.admin_action === "UPDATE")
        .map((r) => r.target_place_id);
      if (targets.some((t) => !t) || new Set(targets).size !== targets.length)
        throw new AppError(
          "IMPORT_TARGET_CONFLICT",
          409,
          "Mỗi địa điểm đích chỉ được cập nhật một lần trong lô.",
        );
      await client.query(
        "SELECT id FROM places WHERE id=ANY($1::uuid[]) ORDER BY id FOR UPDATE",
        [targets],
      );
      const result: ImportCommitResult = {
        batchId: id,
        created: 0,
        updated: 0,
        skipped: 0,
        rows: [],
      };
      const started = performance.now();
      for (const row of rows) {
        if (performance.now() - started > 60000)
          throw new AppError(
            "IMPORT_TIMEOUT",
            503,
            "Commit vượt thời gian cho phép; toàn bộ thay đổi đã rollback.",
          );
        if (row.admin_action === "SKIP") {
          result.skipped++;
          result.rows.push({
            rowNumber: row.row_number,
            action: "SKIP",
            placeId: null,
          });
          continue;
        }
        if (
          row.validation_state === "INVALID" ||
          (row.validation_state === "WARNING" && !row.warnings_acknowledged)
        )
          throw new AppError(
            "IMPORT_ROW_NOT_APPROVED",
            409,
            `Dòng ${row.row_number} chưa hợp lệ/được duyệt cảnh báo.`,
          );
        const data = PlaceInput.parse(row.normalized_data_json);
        if (data.sourceId !== batch.source_id)
          throw new AppError(
            "IMPORT_PROVENANCE_MISMATCH",
            409,
            "Nguồn dòng không khớp lô.",
          );
        const issues = await importSpatialWarnings(client, data.location);
        const reviewedCodes = (
          await client.query<{ code: string }>(
            "SELECT code FROM import_row_errors WHERE import_row_id=$1",
            [row.id],
          )
        ).rows.map((e) => e.code);
        if (
          issues.some(
            (i) => i.severity === "INVALID" || !reviewedCodes.includes(i.code),
          )
        )
          throw new AppError(
            "IMPORT_SPATIAL_CHANGED",
            409,
            `Dòng ${row.row_number}: kiểm tra không gian đã thay đổi; review lại.`,
          );
        const duplicates = (
          await client.query<{ id: string }>(
            `SELECT DISTINCT p.id FROM places p LEFT JOIN place_geometries g ON g.place_id=p.id AND g.valid_to IS NULL WHERE p.slug=$1 OR lower(unaccent(p.name))=lower(unaccent($2)) OR ($3::float IS NOT NULL AND ST_DWithin(g.geometry::geography,ST_SetSRID(ST_MakePoint($3,$4),4326)::geography,20)) OR EXISTS(SELECT 1 FROM external_references e WHERE e.subject_id=p.id AND e.external_url=ANY($5::text[])) LIMIT 21`,
            [
              data.slug,
              data.name,
              data.location?.longitude ?? null,
              data.location?.latitude ?? null,
              data.externalReferences.map((e) => e.externalUrl),
            ],
          )
        ).rows;
        const reviewedWorkbookDuplicate =
          row.warnings_acknowledged &&
          reviewedCodes.some((code) => code.endsWith("_IN_WORKBOOK"));
        if (
          duplicates.some(
            (d) =>
              d.id !== row.target_place_id &&
              !row.duplicate_candidate_ids.includes(d.id) &&
              !(
                reviewedWorkbookDuplicate &&
                result.rows.some((r) => r.placeId === d.id)
              ),
          )
        )
          throw new AppError(
            "IMPORT_DUPLICATES_CHANGED",
            409,
            `Dòng ${row.row_number}: xuất hiện ứng viên trùng mới; review lại.`,
          );
        const existing =
          row.admin_action === "UPDATE"
            ? { id: row.target_place_id!, version: row.target_place_version! }
            : null;
        if (existing) {
          if (!row.replacement_confirmed || !existing.version)
            throw new AppError(
              "IMPORT_REPLACEMENT_REQUIRED",
              409,
              "Xác nhận thay thế nội dung và vị trí địa điểm đích.",
            );
          const target = (
            await client.query<{ version: number; publication_status: string }>(
              "SELECT version,publication_status FROM places WHERE id=$1",
              [existing.id],
            )
          ).rows[0];
          if (
            !target ||
            target.version !== existing.version ||
            target.publication_status === "ARCHIVED"
          )
            throw new AppError(
              "TARGET_VERSION_CONFLICT",
              409,
              `Dòng ${row.row_number}: địa điểm đích đã thay đổi hoặc lưu trữ.`,
            );
        }
        const sourceRecordId = (
          await client.query<{ id: string }>(
            "INSERT INTO source_records(source_id,import_batch_id,import_row_id,external_record_id,collected_at,raw_payload_hash,notes) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id",
            [
              batch.source_id,
              id,
              row.id,
              `${batch.sheet_name}:row:${row.row_number}`,
              data.sourceObservedAt,
              row.raw_payload_hash,
              "Explicit import commit; original sanitized row and review revisions retained. Factual verification UNKNOWN.",
            ],
          )
        ).rows[0]!.id;
        const placeId = await savePlaceInTransaction(
          client,
          actor,
          { ...data, geometryChangeConfirmed: row.replacement_confirmed },
          existing,
          sourceRecordId,
        );
        await client.query(
          "UPDATE import_rows SET target_place_id=$2 WHERE id=$1",
          [row.id, placeId],
        );
        result[existing ? "updated" : "created"]++;
        result.rows.push({
          rowNumber: row.row_number,
          action: existing ? "UPDATE" : "CREATE",
          placeId,
        });
        await audit(client, actor, "IMPORT_ROW_COMMITTED", "PLACE", placeId, {
          batchId: id,
          rowId: row.id,
          sourceRecordId,
          action: row.admin_action,
        });
      }
      await client.query(
        "UPDATE import_rows SET committed_at=now() WHERE batch_id=$1",
        [id],
      );
      await client.query(
        "UPDATE import_batches SET status='COMMITTED',committed_at=now(),commit_result=$2,version=version+1 WHERE id=$1",
        [id, result],
      );
      await audit(client, actor, "IMPORT_COMMITTED", "IMPORT_BATCH", id, {
        created: result.created,
        updated: result.updated,
        skipped: result.skipped,
      });
      return result;
    }, connection);
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error ? error.code : null;
    if (code === "23505")
      throw new AppError(
        "IMPORT_UNIQUE_CONFLICT",
        409,
        "Slug/đích trùng; toàn bộ lô đã rollback. Review lại các dòng.",
      );
    if (["40P01", "40001", "55P03", "57014"].includes(String(code)))
      throw new AppError(
        "IMPORT_RETRY_REQUIRED",
        409,
        "Dữ liệu đang thay đổi hoặc hết thời gian chờ; tải lại lô trước khi thử lại.",
      );
    throw error;
  }
}
