import { randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { z } from "zod";
import { database, transaction } from "./db";
import { audit, requirePermission, type Actor } from "./auth";
import { AppError } from "./errors";
import {
  readImportInspection,
  importStorage,
  type ImportStorage,
} from "./import-storage";
import {
  createImportUploadSession,
  uploadLocalImport,
  finalizeImportUpload,
} from "./import-uploads";
import { sha256 } from "./storage/object-store";
import {
  IMPORT_LIMITS,
  ValidateImportCommand,
  type ImportIssue,
} from "../../../packages/contracts/src/import";
import {
  normalizeImportRow,
  suggestMapping,
} from "../../../packages/import/src/normalize";
import { PlaceInput } from "./place-input";
import { spatialWarnings } from "./places";
type Db = ReturnType<typeof database>;
export interface ImportBatch {
  id: string;
  source_id: string;
  file_name: string;
  file_hash: string;
  storage_key: string | null;
  uploaded_by: string;
  uploaded_at: Date;
  status:
    | "UPLOADED"
    | "VALIDATING"
    | "READY_FOR_REVIEW"
    | "REJECTED"
    | "COMMITTED"
    | "FAILED";
  total_rows: number;
  valid_rows: number;
  warning_rows: number;
  invalid_rows: number;
  sheet_name: string | null;
  column_mapping: unknown;
  expires_at: Date;
  version: number;
  validation_duration_ms: number | null;
  validation_request: unknown;
  commit_result: import("./import-commit").ImportCommitResult | null;
}
export async function uploadImport(
  actor: Actor,
  file: { name: string; mime: string; bytes: Buffer; sourceId: string },
  connection = database(),
) {
  requirePermission(actor, "import");
  const storage = importStorage();
  if (storage.driver !== "local")
    throw new AppError(
      "DIRECT_UPLOAD_REQUIRED",
      409,
      "Hãy tạo phiên upload trực tiếp.",
    );
  z.uuid().parse(file.sourceId);
  if (
    // File names may never contain control characters or path separators.
    // eslint-disable-next-line no-control-regex
    !/^[^/\\\u0000-\u001f]{1,180}\.xlsx$/i.test(file.name) ||
    file.mime !==
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  )
    throw new AppError(
      "UNSUPPORTED_WORKBOOK",
      415,
      "Chỉ hỗ trợ file .xlsx với MIME Excel hợp lệ; không hỗ trợ macro.",
    );
  if (file.bytes.length > IMPORT_LIMITS.uploadBytes)
    throw new AppError(
      "UPLOAD_TOO_LARGE",
      413,
      "Workbook vượt giới hạn 8 MiB.",
    );
  const { id } = await createImportUploadSession(
    actor,
    {
      requestId: randomUUID(),
      sourceId: file.sourceId,
      name: file.name,
      mime: file.mime,
      size: file.bytes.length,
      sha256: sha256(file.bytes),
    },
    connection,
    storage,
  );
  await uploadLocalImport(
    actor,
    id,
    file.bytes,
    file.mime,
    connection,
    storage,
  );
  return finalizeImportUpload(actor, id, connection, storage);
}
export async function importBatch(
  actor: Actor,
  id: string,
  connection = database(),
  storage?: ImportStorage,
) {
  requirePermission(actor, "read");
  z.uuid().parse(id);
  const batch = (
    await connection.query<ImportBatch>(
      "SELECT * FROM import_batches WHERE id=$1",
      [id],
    )
  ).rows[0];
  if (!batch) throw new AppError("NOT_FOUND", 404, "Không tìm thấy lô import.");
  let sheets: Array<{
    index: number;
    name: string;
    blocked: boolean;
    reason: string | null;
    headers: string[];
    rowCount: number;
    mapping: ReturnType<typeof suggestMapping>;
  }> = [];
  if (batch.storage_key && batch.expires_at > new Date()) {
    const workbook = await readImportInspection(batch, connection, storage);
    sheets = workbook.sheets.map((s) => ({
      index: s.index,
      name: s.name,
      blocked: s.blocked,
      reason: s.reason,
      headers: s.headers,
      rowCount: s.rows.length,
      mapping: s.blocked ? {} : suggestMapping(s.headers),
    }));
  }
  return { batch, sheets };
}
export async function listImports(actor: Actor, connection = database()) {
  requirePermission(actor, "read");
  return (
    await connection.query<ImportBatch>(
      "SELECT * FROM import_batches ORDER BY uploaded_at DESC LIMIT 100",
    )
  ).rows;
}
export async function validateImport(
  actor: Actor,
  id: string,
  input: unknown,
  connection = database(),
  storage?: ImportStorage,
) {
  requirePermission(actor, "import");
  z.uuid().parse(id);
  const command = ValidateImportCommand.parse(input),
    started = performance.now();
  const { batch } = await importBatch(actor, id, connection, storage);
  if (batch.expires_at <= new Date() || !batch.storage_key)
    throw new AppError("IMPORT_EXPIRED", 410, "Dữ liệu staging đã hết hạn.");
  const workbook = await readImportInspection(batch, connection, storage),
    sheet = workbook.sheets.find((s) => s.index === command.sheetIndex);
  if (!sheet || sheet.blocked)
    throw new AppError(
      "UNSUPPORTED_SHEET",
      400,
      "Sheet không được phép mapping.",
    );
  if (
    Object.keys(command.mapping).some((c) => Number(c) >= sheet.headers.length)
  )
    throw new AppError(
      "INVALID_MAPPING",
      400,
      "Mapping trỏ đến cột không có trong sheet.",
    );
  await transaction(async (client) => {
    const locked = (
      await client.query<ImportBatch>(
        "SELECT * FROM import_batches WHERE id=$1 FOR UPDATE",
        [id],
      )
    ).rows[0]!;
    if (locked.expires_at <= new Date() || !locked.storage_key)
      throw new AppError("IMPORT_EXPIRED", 410, "Dữ liệu staging đã hết hạn.");
    if (
      locked.status === "READY_FOR_REVIEW" &&
      isDeepStrictEqual(locked.validation_request, command)
    )
      return;
    if (locked.version !== command.version)
      throw new AppError(
        "VERSION_CONFLICT",
        409,
        "Lô import đã thay đổi. Tải lại.",
      );
    if (locked.status !== "UPLOADED")
      throw new AppError(
        "INVALID_IMPORT_STATE",
        409,
        "Lô đã được staging; tải lô mới để thay mapping và giữ lịch sử review.",
      );
    await client.query(
      "UPDATE import_batches SET status='VALIDATING' WHERE id=$1",
      [id],
    );
    await client.query("SET LOCAL statement_timeout='15s'");
    const categories = (
      await client.query<{ id: string; code: string; name: string }>(
        "SELECT id,code,name FROM place_categories WHERE archived_at IS NULL",
      )
    ).rows;
    let valid = 0,
      warning = 0,
      invalid = 0;
    const slugs = new Map<string, number>(),
      coordinates = new Map<string, number>();
    for (const row of sheet.rows) {
      if (performance.now() - started > 60000)
        throw new AppError(
          "VALIDATION_TIMEOUT",
          422,
          "Staging vượt 60 giây; chia workbook thành lô nhỏ hơn. Không có dòng nào được commit.",
        );
      const normalized = normalizeImportRow(
          row,
          command.mapping,
          batch.source_id,
          categories,
        ),
        data = normalized.data,
        issues: ImportIssue[] = [...normalized.issues];
      const checked = PlaceInput.safeParse(data);
      if (!checked.success)
        for (const error of checked.error.issues)
          issues.push({
            field: String(error.path[0] ?? "row"),
            code: "INVALID_FIELD",
            severity: "INVALID",
            message: `Trường ${error.path.join(".")}: ${error.message}`,
            metadata: {},
          });
      for (const issue of await spatialWarnings(client, data.location))
        if (!issues.some((i) => i.code === issue.code))
          issues.push({ ...issue, field: "coordinates", metadata: {} });
      if (data.location) {
        const context = (
          await client.query<{ loaded: boolean; nearby: boolean }>(
            `SELECT EXISTS(SELECT 1 FROM road_segments rs JOIN dataset_releases r ON r.id=rs.release_id WHERE r.qa_status='PUBLISHED') AS loaded,EXISTS(SELECT 1 FROM road_segments rs JOIN dataset_releases r ON r.id=rs.release_id WHERE r.qa_status='PUBLISHED' AND ST_DWithin(rs.geometry::geography,ST_SetSRID(ST_MakePoint($1,$2),4326)::geography,500)) AS nearby`,
            [data.location.longitude, data.location.latitude],
          )
        ).rows[0]!;
        if (context.loaded && !context.nearby)
          issues.push({
            field: "coordinates",
            code: "DISTANT_FROM_MAPPED_ROAD",
            severity: "WARNING",
            message:
              "Không có đường đã công bố trong 500 m. Khoảng cách bản đồ không xác nhận khả năng tiếp cận; cần đối chiếu.",
            metadata: { thresholdMeters: 500 },
          });
      }
      const duplicates = (
        await client.query<{ id: string }>(
          `SELECT DISTINCT p.id FROM places p LEFT JOIN place_geometries g ON g.place_id=p.id AND g.valid_to IS NULL WHERE p.slug=$1 OR lower(unaccent(p.name))=lower(unaccent($2)) OR ($3::double precision IS NOT NULL AND ST_DWithin(g.geometry::geography,ST_SetSRID(ST_MakePoint($3,$4),4326)::geography,20)) OR EXISTS(SELECT 1 FROM external_references e WHERE e.subject_id=p.id AND e.external_url=ANY($5::text[])) LIMIT 20`,
          [
            data.slug,
            data.name,
            data.location?.longitude ?? null,
            data.location?.latitude ?? null,
            data.externalReferences.map((e) => e.externalUrl),
          ],
        )
      ).rows.map((r) => r.id);
      if (duplicates.length)
        issues.push({
          field: "row",
          code: "DUPLICATE_CANDIDATE",
          severity: "WARNING",
          message:
            "Có địa điểm tương tự theo slug, tên, vị trí trong 20 m hoặc URL. Cần quyết định rõ ràng; không tự merge.",
          metadata: { candidateIds: duplicates },
        });
      if (slugs.has(data.slug))
        issues.push({
          field: "slug",
          code: "DUPLICATE_SLUG_IN_WORKBOOK",
          severity: "WARNING",
          message: "Slug trùng một dòng trong workbook.",
          metadata: { rowNumber: slugs.get(data.slug) },
        });
      else slugs.set(data.slug, row.rowNumber);
      if (data.location) {
        const key = `${data.location.longitude},${data.location.latitude}`;
        if (coordinates.has(key))
          issues.push({
            field: "coordinates",
            code: "DUPLICATE_LOCATION_IN_WORKBOOK",
            severity: "WARNING",
            message: "Tọa độ trùng một dòng trong workbook.",
            metadata: { rowNumber: coordinates.get(key) },
          });
        else coordinates.set(key, row.rowNumber);
      }
      if (normalized.coordinateCandidate || normalized.mapCandidates.length)
        issues.push({
          field: "coordinates",
          code: "COORDINATE_COMPARISON_AVAILABLE",
          severity: "WARNING",
          message:
            "Có tọa độ ứng viên để đối chiếu; không thay tọa độ nhập tự động.",
          metadata: {
            reverseCandidate: normalized.coordinateCandidate,
            mapCandidates: normalized.mapCandidates,
          },
        });
      const state = issues.some((i) => i.severity === "INVALID")
        ? "INVALID"
        : issues.length
          ? "WARNING"
          : "VALID";
      if (state === "INVALID") invalid++;
      else if (state === "WARNING") warning++;
      else valid++;
      const rowId = (
        await client.query<{ id: string }>(
          "INSERT INTO import_rows(batch_id,row_number,raw_data_json,raw_payload_hash,normalized_data_json,validation_state,duplicate_candidate_ids) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id",
          [
            id,
            row.rowNumber,
            normalized.raw,
            normalized.hash,
            data,
            state,
            duplicates,
          ],
        )
      ).rows[0]!.id;
      for (const issue of issues)
        await client.query(
          "INSERT INTO import_row_errors(import_row_id,field,code,severity,message,metadata_json) VALUES($1,$2,$3,$4,$5,$6)",
          [
            rowId,
            issue.field,
            issue.code,
            issue.severity,
            issue.message,
            issue.metadata,
          ],
        );
    }
    await client.query(
      "UPDATE import_batches SET status='READY_FOR_REVIEW',sheet_name=$2,column_mapping=$3,total_rows=$4,valid_rows=$5,warning_rows=$6,invalid_rows=$7,validation_duration_ms=$8,version=version+1,validation_request=$9 WHERE id=$1",
      [
        id,
        sheet.name,
        command.mapping,
        sheet.rows.length,
        valid,
        warning,
        invalid,
        Math.round(performance.now() - started),
        command,
      ],
    );
    await audit(client, actor, "IMPORT_STAGED", "IMPORT_BATCH", id, {
      total: sheet.rows.length,
      valid,
      warning,
      invalid,
      parserVersion: workbook.parserVersion,
    });
  }, connection);
  return { id };
}
export type ImportDatabase = Db;
