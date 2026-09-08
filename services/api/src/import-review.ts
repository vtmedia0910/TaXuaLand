import { z } from "zod";
import { database, transaction } from "./db";
import { audit, requirePermission, type Actor } from "./auth";
import { AppError } from "./errors";
import { importBatch, type ImportBatch } from "./imports";
import { PlaceInput } from "./place-input";
import { importSpatialWarnings } from "./import-spatial";
import type { normalizeImportRow } from "../../../packages/import/src/normalize";
export interface StagedRow {
  id: string;
  batch_id: string;
  row_number: number;
  raw_data_json: Record<string, string>;
  raw_payload_hash: string;
  normalized_data_json: ReturnType<typeof normalizeImportRow>["data"];
  validation_state: "VALID" | "WARNING" | "INVALID";
  target_place_id: string | null;
  target_place_version: number | null;
  duplicate_candidate_ids: string[];
  admin_action: "CREATE" | "UPDATE" | "SKIP" | "REVIEW_LATER";
  warnings_acknowledged: boolean;
  reviewed_by: string | null;
  reviewed_at: Date | null;
  committed_at: Date | null;
  replacement_confirmed: boolean;
}
export interface RowIssue {
  field: string;
  code: string;
  severity: "INVALID" | "WARNING";
  message: string;
  metadata_json: Record<string, unknown>;
}
export async function importReview(
  actor: Actor,
  id: string,
  connection = database(),
) {
  const inspection = await importBatch(actor, id, connection);
  const rows = (
    await connection.query<
      StagedRow & {
        issues: RowIssue[];
        candidates: Array<{
          id: string;
          name: string;
          slug: string;
          version: number;
          publication_status: string;
        }>;
      }
    >(
      `SELECT r.*,coalesce((SELECT jsonb_agg(jsonb_build_object('field',e.field,'code',e.code,'severity',e.severity,'message',e.message,'metadata_json',e.metadata_json) ORDER BY e.severity,e.code) FROM import_row_errors e WHERE e.import_row_id=r.id),'[]') AS issues,coalesce((SELECT jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'slug',p.slug,'version',p.version,'publication_status',p.publication_status)) FROM places p WHERE p.id=ANY(r.duplicate_candidate_ids)),'[]') AS candidates FROM import_rows r WHERE r.batch_id=$1 ORDER BY r.row_number`,
      [id],
    )
  ).rows;
  return {
    ...inspection,
    rows,
    summary: {
      total: rows.length,
      valid: rows.filter((r) => r.validation_state === "VALID").length,
      warnings: rows.filter((r) => r.validation_state === "WARNING").length,
      invalid: rows.filter((r) => r.validation_state === "INVALID").length,
      duplicates: rows.filter(
        (r) =>
          r.duplicate_candidate_ids.length > 0 ||
          r.issues.some((i) => i.code.includes("DUPLICATE")),
      ).length,
      missingCoordinates: rows.filter((r) => !r.normalized_data_json.location)
        .length,
      unreviewed: rows.filter((r) => r.admin_action === "REVIEW_LATER").length,
    },
  };
}
export const ReviewRowCommand = z
  .object({
    version: z.number().int().positive(),
    action: z.enum(["CREATE", "UPDATE", "SKIP", "REVIEW_LATER"]),
    targetPlaceId: z.uuid().nullable(),
    targetPlaceVersion: z.number().int().positive().nullable(),
    warningsAcknowledged: z.boolean(),
    data: PlaceInput.optional(),
    manualCorrectionConfirmed: z.boolean().default(false),
    replacementConfirmed: z.boolean().default(false),
    revalidate: z.boolean().default(false),
  })
  .strict();
export async function reviewImportRow(
  actor: Actor,
  batchId: string,
  rowId: string,
  input: unknown,
  connection = database(),
) {
  requirePermission(actor, "import");
  z.uuid().parse(batchId);
  z.uuid().parse(rowId);
  const command = ReviewRowCommand.parse(input);
  // New warnings must be read before a corrected row can be approved.
  if (command.data) {
    command.action = "REVIEW_LATER";
    command.targetPlaceId = null;
    command.targetPlaceVersion = null;
    command.warningsAcknowledged = false;
    command.replacementConfirmed = false;
  }
  return transaction(async (client) => {
    const batch = (
      await client.query<ImportBatch>(
        "SELECT * FROM import_batches WHERE id=$1 FOR UPDATE",
        [batchId],
      )
    ).rows[0];
    if (
      !batch ||
      batch.status !== "READY_FOR_REVIEW" ||
      batch.expires_at <= new Date()
    )
      throw new AppError(
        "IMPORT_NOT_REVIEWABLE",
        409,
        "Lô chưa sẵn sàng review hoặc đã hết hạn/commit.",
      );
    if (batch.version !== command.version)
      throw new AppError(
        "VERSION_CONFLICT",
        409,
        "Lô đã thay đổi; tải lại trước khi review.",
      );
    const row = (
      await client.query<StagedRow>(
        "SELECT * FROM import_rows WHERE id=$1 AND batch_id=$2 FOR UPDATE",
        [rowId, batchId],
      )
    ).rows[0];
    if (!row)
      throw new AppError("NOT_FOUND", 404, "Không có dòng này trong lô.");
    await client.query(
      "INSERT INTO import_row_revisions(import_row_id,actor_id,snapshot) SELECT id,$2,jsonb_build_object('row',to_jsonb(r),'issues',(SELECT jsonb_agg(to_jsonb(e)) FROM import_row_errors e WHERE e.import_row_id=r.id)) FROM import_rows r WHERE id=$1",
      [rowId, actor.id],
    );
    let state = row.validation_state;
    if (command.data || command.revalidate) {
      if (command.revalidate && command.action !== "REVIEW_LATER")
        throw new AppError(
          "REVALIDATION_REQUIRES_REVIEW",
          409,
          "Kiểm tra lại phải đưa dòng về Xem lại sau để đọc cảnh báo mới.",
        );
      if (command.data && !command.manualCorrectionConfirmed)
        throw new AppError(
          "CORRECTION_CONFIRMATION",
          409,
          "Xác nhận đã đối chiếu toàn bộ dữ liệu sửa với nguồn gốc.",
        );
      const data = command.data ?? PlaceInput.parse(row.normalized_data_json);
      if (data.sourceId !== batch.source_id)
        throw new AppError(
          "SOURCE_MISMATCH",
          400,
          "Nguồn của dòng phải khớp nguồn lô import.",
        );
      const issues: RowIssue[] = (
        await importSpatialWarnings(client, data.location)
      ).map((i) => ({ ...i, field: "coordinates", metadata_json: {} }));
      if (command.revalidate && !command.data) {
        const previous = (
          await client.query<RowIssue>(
            "SELECT field,code,severity,message,metadata_json FROM import_row_errors WHERE import_row_id=$1",
            [row.id],
          )
        ).rows;
        issues.push(
          ...previous.filter(
            (i) =>
              ![
                "OUTSIDE_AOI",
                "AOI_NOT_CONFIGURED",
                "MISSING_COORDINATE",
                "DUPLICATE_CANDIDATE",
                "DISTANT_FROM_MAPPED_ROAD",
                "CATEGORY_REQUIRED_FOR_PUBLICATION",
                "MISSING_IMAGE",
                "MISSING_MAP_REFERENCE",
                "DUPLICATE_SLUG_IN_WORKBOOK",
                "DUPLICATE_COORDINATE_IN_WORKBOOK",
              ].includes(i.code),
          ),
        );
      }
      if (!data.categoryIds.length)
        issues.push({
          field: "categories",
          code: "CATEGORY_REQUIRED_FOR_PUBLICATION",
          severity: "WARNING",
          message: "Chưa có danh mục để xuất bản.",
          metadata_json: {},
        });
      const availableCategories = await client.query(
        "SELECT id FROM place_categories WHERE id=ANY($1::uuid[]) AND archived_at IS NULL",
        [data.categoryIds],
      );
      if (availableCategories.rowCount !== data.categoryIds.length)
        issues.push({
          field: "categories",
          code: "INVALID_CATEGORY",
          severity: "INVALID",
          message: "Danh mục đã ngừng khả dụng.",
          metadata_json: {},
        });
      const workbookDuplicates = (
        await client.query<{ row_number: number; slug_match: boolean }>(
          "SELECT row_number,normalized_data_json->>'slug'=$3 AS slug_match FROM import_rows WHERE batch_id=$1 AND id<>$2 AND (normalized_data_json->>'slug'=$3 OR ($4::jsonb IS NOT NULL AND normalized_data_json->'location'=$4::jsonb))",
          [
            batchId,
            rowId,
            data.slug,
            data.location ? JSON.stringify(data.location) : null,
          ],
        )
      ).rows;
      for (const other of workbookDuplicates)
        issues.push({
          field: "row",
          code: other.slug_match
            ? "DUPLICATE_SLUG_IN_WORKBOOK"
            : "DUPLICATE_COORDINATE_IN_WORKBOOK",
          severity: "WARNING",
          message: `Có dữ liệu tương tự dòng ${other.row_number}; cần quyết định riêng.`,
          metadata_json: { rowNumber: other.row_number },
        });
      if (!data.media.length)
        issues.push({
          field: "media",
          code: "MISSING_IMAGE",
          severity: "WARNING",
          message: "Chưa có media.",
          metadata_json: {},
        });
      if (!data.externalReferences.length)
        issues.push({
          field: "externalReferences",
          code: "MISSING_MAP_REFERENCE",
          severity: "WARNING",
          message: "Chưa có liên kết ngoài.",
          metadata_json: {},
        });
      const duplicateIds = (
        await client.query<{ id: string }>(
          `SELECT DISTINCT p.id FROM places p LEFT JOIN place_geometries g ON g.place_id=p.id AND g.valid_to IS NULL WHERE p.slug=$1 OR lower(unaccent(p.name))=lower(unaccent($2)) OR ($3::float IS NOT NULL AND ST_DWithin(g.geometry::geography,ST_SetSRID(ST_MakePoint($3,$4),4326)::geography,20)) OR EXISTS(SELECT 1 FROM external_references e WHERE e.subject_id=p.id AND e.external_url=ANY($5::text[])) LIMIT 20`,
          [
            data.slug,
            data.name,
            data.location?.longitude ?? null,
            data.location?.latitude ?? null,
            data.externalReferences.map((e) => e.externalUrl),
          ],
        )
      ).rows.map((p) => p.id);
      if (duplicateIds.length)
        issues.push({
          field: "row",
          code: "DUPLICATE_CANDIDATE",
          severity: "WARNING",
          message: "Có địa điểm tương tự; không tự merge.",
          metadata_json: { candidateIds: duplicateIds },
        });
      state = issues.some((i) => i.severity === "INVALID")
        ? "INVALID"
        : issues.length
          ? "WARNING"
          : "VALID";
      await client.query(
        "DELETE FROM import_row_errors WHERE import_row_id=$1",
        [rowId],
      );
      for (const issue of issues)
        await client.query(
          "INSERT INTO import_row_errors(import_row_id,field,code,severity,message,metadata_json) VALUES($1,$2,$3,$4,$5,$6)",
          [
            rowId,
            issue.field,
            issue.code,
            issue.severity,
            issue.message,
            issue.metadata_json,
          ],
        );
      await client.query(
        "UPDATE import_rows SET normalized_data_json=$2,validation_state=$3,duplicate_candidate_ids=$4 WHERE id=$1",
        [rowId, data, state, duplicateIds],
      );
    }
    if (["CREATE", "UPDATE"].includes(command.action)) {
      if (state === "INVALID")
        throw new AppError(
          "INVALID_ROW",
          409,
          "Dòng lỗi cần được sửa hoặc bỏ qua.",
        );
      if (state === "WARNING" && !command.warningsAcknowledged)
        throw new AppError(
          "WARNINGS_NOT_REVIEWED",
          409,
          "Cần xác nhận đã rà soát cảnh báo.",
        );
    }
    if (command.action === "UPDATE") {
      if (!command.replacementConfirmed)
        throw new AppError(
          "IMPORT_REPLACEMENT_REQUIRED",
          409,
          "Xác nhận thay thế toàn bộ nội dung và vị trí bằng dữ liệu dòng import.",
        );
      if (!command.targetPlaceId || !command.targetPlaceVersion)
        throw new AppError(
          "UPDATE_TARGET_REQUIRED",
          400,
          "Chọn địa điểm và phiên bản cập nhật.",
        );
      const target = await client.query(
        "SELECT id FROM places WHERE id=$1 AND version=$2",
        [command.targetPlaceId, command.targetPlaceVersion],
      );
      if (!target.rowCount)
        throw new AppError(
          "TARGET_VERSION_CONFLICT",
          409,
          "Địa điểm đích đã thay đổi.",
        );
    } else if (command.targetPlaceId || command.targetPlaceVersion)
      throw new AppError(
        "UNEXPECTED_TARGET",
        400,
        "Chỉ UPDATE được có địa điểm đích.",
      );
    await client.query(
      "UPDATE import_rows SET admin_action=$2,target_place_id=$3,target_place_version=$4,warnings_acknowledged=$5,reviewed_by=$6,reviewed_at=now(),replacement_confirmed=$7 WHERE id=$1",
      [
        rowId,
        command.action,
        command.targetPlaceId,
        command.targetPlaceVersion,
        command.warningsAcknowledged,
        actor.id,
        command.action === "UPDATE" && command.replacementConfirmed,
      ],
    );
    await client.query(
      "INSERT INTO import_row_actions(import_row_id,actor_id,action,target_place_id) VALUES($1,$2,$3,$4)",
      [rowId, actor.id, command.action, command.targetPlaceId],
    );
    await client.query(
      "UPDATE import_batches SET version=version+1,valid_rows=(SELECT count(*) FROM import_rows WHERE batch_id=$1 AND validation_state='VALID'),warning_rows=(SELECT count(*) FROM import_rows WHERE batch_id=$1 AND validation_state='WARNING'),invalid_rows=(SELECT count(*) FROM import_rows WHERE batch_id=$1 AND validation_state='INVALID') WHERE id=$1",
      [batchId],
    );
    await audit(client, actor, "IMPORT_ROW_REVIEWED", "IMPORT_BATCH", batchId, {
      rowId,
      action: command.action,
      corrected: !!command.data,
    });
    return { ok: true };
  }, connection);
}
