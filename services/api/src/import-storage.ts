import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import { InspectedWorkbook } from "../../../packages/contracts/src/import.ts";
import { deploymentConfig } from "../../../packages/config/src/deployment.ts";
import { LocalFilesystemObjectStore } from "./storage/local-object-store.ts";
import { S3CompatibleObjectStore } from "./storage/s3-object-store.ts";
import {
  ObjectStoreError,
  sha256,
  type ObjectStore,
  type ObjectStoreSigner,
  type ObjectDescriptor,
} from "./storage/object-store.ts";
import { landWorkspace } from "./import-worker.ts";
import { AppError } from "./errors.ts";
import { database } from "./db.ts";

export interface ImportStorage {
  driver: "local" | "s3";
  store: ObjectStore;
  signer?: ObjectStoreSigner;
  ttlSeconds: number;
  retentionDays: number;
}
let cached: ImportStorage | undefined;
export function importStorage(): ImportStorage {
  if (
    process.env.LAND_ENVIRONMENT === "PREVIEW" ||
    process.env.VERCEL_ENV === "preview"
  )
    throw new AppError(
      "IMPORT_DISABLED",
      503,
      "Import không khả dụng trong Preview.",
    );
  if (cached) return cached;
  const driver = process.env.OBJECT_STORE_DRIVER ?? "local";
  const limits = z
    .object({
      ttlSeconds: z.coerce.number().int().min(30).max(600).default(300),
      retentionDays: z.coerce.number().int().min(1).max(7).default(7),
    })
    .parse({
      ttlSeconds: process.env.SIGNED_UPLOAD_TTL_SECONDS,
      retentionDays: process.env.IMPORT_RETENTION_DAYS,
    });
  if (
    driver === "local" &&
    (process.env.LAND_ENVIRONMENT ?? "LOCAL") === "LOCAL" &&
    process.env.VERCEL !== "1"
  ) {
    cached = {
      driver,
      store: new LocalFilesystemObjectStore(
        resolve(landWorkspace(), "work/object-store/private"),
        "private",
      ),
      ...limits,
    };
  } else {
    deploymentConfig(process.env);
    if (driver !== "s3")
      throw new AppError(
        "IMPORT_CONFIGURATION",
        503,
        "Cấu hình import chưa sẵn sàng.",
      );
    const store = new S3CompatibleObjectStore(process.env, "private");
    cached = { driver, store, signer: store, ...limits };
  }
  return cached;
}
export interface ImportUpload {
  batch_id: string;
  actor_id: string;
  request_id: string;
  driver: "local" | "s3";
  raw_key: string | null;
  inspection_key: string;
  expected_size: number | null;
  expected_sha256: string | null;
  inspection_size: number | null;
  inspection_sha256: string | null;
  state: "UPLOAD_PENDING" | "PROCESSING" | "UPLOADED" | "FAILED" | "EXPIRED";
  upload_expires_at: Date;
  url_issues: number;
  finalize_attempts: number;
}
export function associatedStorage(
  upload: ImportUpload,
  storage: ImportStorage,
) {
  if (upload.driver !== storage.driver)
    throw new AppError(
      "IMPORT_STORAGE_MISMATCH",
      503,
      "Storage của lô chưa được cấu hình đúng.",
    );
  return storage.store;
}
export function verifyObject(
  expected: ObjectDescriptor,
  actual: ObjectDescriptor,
) {
  if (
    expected.key !== actual.key ||
    expected.size !== actual.size ||
    expected.sha256 !== actual.sha256 ||
    expected.contentType !== actual.contentType
  )
    throw new AppError(
      "IMPORT_OBJECT_MISMATCH",
      422,
      "Đối tượng upload không khớp lô import.",
    );
}
export async function putImportObject(
  store: ObjectStore,
  key: string,
  bytes: Buffer,
  contentType: string,
) {
  const object = {
    key,
    bytes,
    size: bytes.length,
    sha256: sha256(bytes),
    contentType,
  };
  try {
    await store.put(object);
  } catch (error) {
    if (!(error instanceof ObjectStoreError) || error.code !== "CONFLICT")
      throw error;
    verifyObject(object, await store.get(key));
  }
  return object;
}
export function legacyInspectionPath(id: string) {
  z.uuid().parse(id);
  return resolve(landWorkspace(), "work/imports", `${id}.json`);
}
export async function readImportInspection(
  batch: { id: string; storage_key: string | null },
  connection = database(),
  storage?: ImportStorage,
) {
  const upload = (
    await connection.query<ImportUpload>(
      "SELECT * FROM import_uploads WHERE batch_id=$1",
      [batch.id],
    )
  ).rows[0];
  if (!upload) {
    if (
      (process.env.LAND_ENVIRONMENT ?? "LOCAL") !== "LOCAL" ||
      process.env.VERCEL === "1"
    )
      throw new AppError(
        "LEGACY_IMPORT_MIGRATION_REQUIRED",
        503,
        "Inspection cũ cần được chuyển sang object storage trước khi triển khai.",
      );
    if (batch.storage_key !== batch.id)
      throw new AppError(
        "IMPORT_NOT_UPLOADED",
        409,
        "Lô chưa hoàn tất upload.",
      );
    return InspectedWorkbook.parse(
      JSON.parse(await readFile(legacyInspectionPath(batch.id), "utf8")),
    );
  }
  if (
    upload.state !== "UPLOADED" ||
    batch.storage_key !== upload.inspection_key
  )
    throw new AppError(
      "IMPORT_NOT_UPLOADED",
      409,
      "Lô chưa hoàn tất upload hoặc đã hết hạn.",
    );
  const object = await associatedStorage(
    upload,
    storage ?? importStorage(),
  ).get(upload.inspection_key);
  verifyObject(
    {
      key: upload.inspection_key,
      size: upload.inspection_size!,
      sha256: upload.inspection_sha256!,
      contentType: "application/json",
    },
    object,
  );
  return InspectedWorkbook.parse(JSON.parse(object.bytes.toString("utf8")));
}
