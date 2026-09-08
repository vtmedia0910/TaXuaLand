import { randomUUID } from "node:crypto";
import { z } from "zod";
import { database, transaction } from "./db.ts";
import { audit, requirePermission, type Actor } from "./auth.ts";
import { AppError } from "./errors.ts";
import { inspectWorkbookIsolated } from "./import-worker.ts";
import {
  importStorage,
  associatedStorage,
  putImportObject,
  verifyObject,
  type ImportStorage,
  type ImportUpload,
} from "./import-storage.ts";
import {
  importObjectKey,
  XLSX_TYPE,
  sha256,
  ObjectStoreError,
} from "./storage/object-store.ts";
import { IMPORT_LIMITS } from "../../../packages/contracts/src/import.ts";

export const UploadSessionCommand = z
  .object({
    requestId: z.uuid(),
    sourceId: z.uuid(),
    // eslint-disable-next-line no-control-regex
    name: z.string().regex(/^[^/\\\u0000-\u001f]{1,180}\.xlsx$/i),
    mime: z.literal(XLSX_TYPE),
    size: z.number().int().min(4).max(IMPORT_LIMITS.uploadBytes),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();
type Batch = {
  id: string;
  source_id: string;
  file_name: string;
  file_hash: string;
  uploaded_by: string;
  expires_at: Date;
  status: string;
};
async function availableSource(
  connection: Pick<ReturnType<typeof database>, "query">,
  sourceId: string,
) {
  if (
    !(
      await connection.query(
        "SELECT id FROM sources WHERE id=$1 AND status<>'DISABLED' AND archived_at IS NULL",
        [sourceId],
      )
    ).rowCount
  )
    throw new AppError("INVALID_SOURCE", 400, "Nguồn không khả dụng.");
}
function owner(actor: Actor, batch: Batch | undefined) {
  if (!batch || batch.uploaded_by !== actor.id)
    throw new AppError("NOT_FOUND", 404, "Không tìm thấy lô upload của bạn.");
  if (batch.expires_at <= new Date())
    throw new AppError("IMPORT_EXPIRED", 410, "Lô import đã hết hạn.");
  return batch;
}
export async function createImportUploadSession(
  actor: Actor,
  input: unknown,
  connection = database(),
  supplied?: ImportStorage,
) {
  requirePermission(actor, "import");
  const command = UploadSessionCommand.parse(input),
    storage = supplied ?? importStorage();
  return transaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(81743,hashtext($1))", [
      actor.id,
    ]);
    await availableSource(client, command.sourceId);
    let upload = (
      await client.query<ImportUpload>(
        "SELECT * FROM import_uploads WHERE actor_id=$1 AND request_id=$2 FOR UPDATE",
        [actor.id, command.requestId],
      )
    ).rows[0];
    let batch: Batch;
    if (upload) {
      batch = owner(
        actor,
        (
          await client.query<Batch>(
            "SELECT * FROM import_batches WHERE id=$1",
            [upload.batch_id],
          )
        ).rows[0],
      );
      if (
        batch.source_id !== command.sourceId ||
        batch.file_name !== command.name ||
        batch.file_hash !== command.sha256 ||
        upload.expected_size !== command.size
      )
        throw new AppError(
          "IMPORT_RETRY_MISMATCH",
          409,
          "Mã retry đã dùng cho workbook khác.",
        );
    } else {
      const count = (
        await client.query<{ count: number }>(
          "SELECT count(*)::int AS count FROM import_batches WHERE uploaded_by=$1 AND uploaded_at>now()-interval '1 hour'",
          [actor.id],
        )
      ).rows[0]!.count;
      if (count >= 20)
        throw new AppError(
          "IMPORT_RATE_LIMIT",
          429,
          "Đã đạt giới hạn 20 workbook/giờ.",
        );
      const id = randomUUID();
      batch = (
        await client.query<Batch>(
          "INSERT INTO import_batches(id,source_id,file_name,file_hash,uploaded_by,expires_at) VALUES($1,$2,$3,$4,$5,now()+$6*interval '1 day') RETURNING *",
          [
            id,
            command.sourceId,
            command.name,
            command.sha256,
            actor.id,
            storage.retentionDays,
          ],
        )
      ).rows[0]!;
      upload = (
        await client.query<ImportUpload>(
          "INSERT INTO import_uploads(batch_id,actor_id,request_id,driver,raw_key,inspection_key,expected_size,expected_sha256,upload_expires_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,now()+$9*interval '1 second') RETURNING *",
          [
            id,
            actor.id,
            command.requestId,
            storage.driver,
            importObjectKey(id, "raw"),
            importObjectKey(id, "inspection"),
            command.size,
            command.sha256,
            storage.ttlSeconds,
          ],
        )
      ).rows[0]!;
      await audit(
        client,
        actor,
        "IMPORT_UPLOAD_SESSION_CREATED",
        "IMPORT_BATCH",
        id,
      );
    }
    associatedStorage(upload, storage);
    if (upload.state === "UPLOADED")
      return { id: batch.id, transport: storage.driver, upload: null };
    const remaining = Math.min(
      storage.ttlSeconds,
      Math.ceil((upload.upload_expires_at.getTime() - Date.now()) / 1000),
    );
    if (remaining < 30 || upload.state === "EXPIRED")
      throw new AppError(
        "UPLOAD_SESSION_EXPIRED",
        410,
        "Phiên upload đã hết hạn. Tạo phiên mới.",
      );
    if (upload.url_issues >= 10)
      throw new AppError(
        "UPLOAD_ISSUANCE_LIMIT",
        429,
        "Đã đạt giới hạn retry của phiên upload.",
      );
    const signed =
      storage.driver === "s3"
        ? await storage.signer!.createUploadUrl(
            {
              key: upload.raw_key!,
              size: command.size,
              sha256: command.sha256,
              contentType: command.mime,
            },
            remaining,
          )
        : {
            url: `/api/admin/imports/${batch.id}/upload`,
            method: "PUT" as const,
            headers: { "content-type": XLSX_TYPE },
            expiresAt: upload.upload_expires_at.toISOString(),
          };
    await client.query(
      "UPDATE import_uploads SET url_issues=url_issues+1 WHERE batch_id=$1",
      [batch.id],
    );
    return { id: batch.id, transport: storage.driver, upload: signed };
  }, connection);
}
export async function uploadLocalImport(
  actor: Actor,
  id: string,
  bytes: Buffer,
  mime: string,
  connection = database(),
  supplied?: ImportStorage,
) {
  requirePermission(actor, "import");
  z.uuid().parse(id);
  const storage = supplied ?? importStorage();
  if (storage.driver !== "local")
    throw new AppError(
      "DIRECT_UPLOAD_REQUIRED",
      409,
      "Hãy upload trực tiếp vào private storage.",
    );
  return transaction(async (client) => {
    const batch = owner(
      actor,
      (
        await client.query<Batch>(
          "SELECT * FROM import_batches WHERE id=$1 FOR UPDATE",
          [id],
        )
      ).rows[0],
    );
    const upload = (
      await client.query<ImportUpload>(
        "SELECT * FROM import_uploads WHERE batch_id=$1 FOR UPDATE",
        [id],
      )
    ).rows[0];
    if (
      !upload ||
      upload.upload_expires_at <= new Date() ||
      upload.state === "EXPIRED"
    )
      throw new AppError(
        "UPLOAD_SESSION_EXPIRED",
        410,
        "Phiên upload đã hết hạn.",
      );
    await availableSource(client, batch.source_id);
    if (
      mime !== XLSX_TYPE ||
      bytes.length !== upload.expected_size ||
      sha256(bytes) !== upload.expected_sha256
    )
      throw new AppError(
        "IMPORT_OBJECT_MISMATCH",
        422,
        "Workbook không khớp phiên upload.",
      );
    await putImportObject(
      associatedStorage(upload, storage),
      upload.raw_key!,
      bytes,
      mime,
    );
    return { id };
  }, connection);
}
export async function finalizeImportUpload(
  actor: Actor,
  id: string,
  connection = database(),
  supplied?: ImportStorage,
) {
  requirePermission(actor, "import");
  z.uuid().parse(id);
  const storage = supplied ?? importStorage();
  const batch = owner(
    actor,
    (
      await connection.query<Batch>(
        "SELECT * FROM import_batches WHERE id=$1",
        [id],
      )
    ).rows[0],
  );
  await availableSource(connection, batch.source_id);
  const initial = (
    await connection.query<ImportUpload>(
      "SELECT * FROM import_uploads WHERE batch_id=$1",
      [id],
    )
  ).rows[0];
  if (!initial)
    throw new AppError("IMPORT_NOT_UPLOADED", 409, "Lô không có phiên upload.");
  associatedStorage(initial, storage);
  if (initial.state === "UPLOADED") return { id };
  if (
    !(
      await connection.query(
        "UPDATE import_uploads SET finalize_attempts=finalize_attempts+1 WHERE batch_id=$1 AND finalize_attempts<10 AND state NOT IN ('EXPIRED','UPLOADED') RETURNING batch_id",
        [id],
      )
    ).rowCount
  ) {
    if (
      (
        await connection.query<ImportUpload>(
          "SELECT * FROM import_uploads WHERE batch_id=$1",
          [id],
        )
      ).rows[0]?.state === "UPLOADED"
    )
      return { id };
    throw new AppError(
      "FINALIZE_ATTEMPT_LIMIT",
      429,
      "Phiên đã hết hạn hoặc đạt giới hạn finalize.",
    );
  }
  try {
    return await transaction(async (client) => {
      owner(
        actor,
        (
          await client.query<Batch>(
            "SELECT * FROM import_batches WHERE id=$1 FOR UPDATE",
            [id],
          )
        ).rows[0],
      );
      const upload = (
        await client.query<ImportUpload>(
          "SELECT * FROM import_uploads WHERE batch_id=$1 FOR UPDATE",
          [id],
        )
      ).rows[0]!;
      if (upload.state === "UPLOADED") return { id };
      if (upload.state === "EXPIRED")
        throw new AppError("IMPORT_EXPIRED", 410, "Lô đã hết hạn.");
      await availableSource(client, batch.source_id);
      const store = associatedStorage(upload, storage);
      const expected = {
        key: upload.raw_key!,
        size: upload.expected_size!,
        sha256: upload.expected_sha256!,
        contentType: XLSX_TYPE,
      };
      const head = await store.head(expected.key);
      if (!head)
        throw new AppError(
          "IMPORT_OBJECT_MISSING",
          409,
          "Chưa tìm thấy workbook đã upload.",
        );
      verifyObject(expected, head);
      const raw = await store.get(expected.key);
      verifyObject(expected, raw);
      await client.query(
        "UPDATE import_uploads SET state='PROCESSING',error_category=NULL WHERE batch_id=$1",
        [id],
      );
      const workbook = await inspectWorkbookIsolated(raw.bytes);
      const inspected = await putImportObject(
        store,
        upload.inspection_key,
        Buffer.from(JSON.stringify(workbook)),
        "application/json",
      );
      await client.query(
        "UPDATE import_uploads SET state='UPLOADED',inspection_size=$2,inspection_sha256=$3,error_category=NULL WHERE batch_id=$1",
        [id, inspected.size, inspected.sha256],
      );
      await client.query(
        "UPDATE import_batches SET storage_key=$2 WHERE id=$1",
        [id, inspected.key],
      );
      await audit(client, actor, "IMPORT_UPLOADED", "IMPORT_BATCH", id, {
        eligibleSheets: workbook.sheets.filter((s) => !s.blocked).length,
        blockedSheets: workbook.sheets.filter((s) => s.blocked).length,
      });
      return { id };
    }, connection);
  } catch (error) {
    const category =
      error instanceof AppError
        ? error.code
        : error instanceof ObjectStoreError
          ? `STORAGE_${error.code}`
          : "IMPORT_PROCESSING_FAILED";
    await connection.query(
      "UPDATE import_uploads SET state='FAILED',error_category=$2 WHERE batch_id=$1 AND state NOT IN ('UPLOADED','EXPIRED')",
      [id, category],
    );
    if (error instanceof AppError) throw error;
    throw new AppError(
      "IMPORT_STORAGE_UNAVAILABLE",
      503,
      "Không thể hoàn tất import. Có thể thử lại cùng phiên.",
    );
  }
}
