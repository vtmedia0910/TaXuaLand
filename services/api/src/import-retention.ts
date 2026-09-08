import { readFile, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { database, transaction } from "./db.ts";
import {
  importStorage,
  associatedStorage,
  legacyInspectionPath,
  putImportObject,
  type ImportStorage,
  type ImportUpload,
} from "./import-storage.ts";
import { InspectedWorkbook } from "../../../packages/contracts/src/import.ts";

export async function expireImportObjects(
  connection = database(),
  supplied?: ImportStorage,
) {
  const storage = supplied ?? importStorage();
  if (
    (
      await connection.query(
        "SELECT product FROM product_identity WHERE id=true",
      )
    ).rows[0]?.product !== "TAXUA_LAND"
  )
    throw Error("LAND database required");
  const batches = (
    await connection.query<{ id: string }>(
      "SELECT b.id FROM import_batches b LEFT JOIN import_uploads u ON u.batch_id=b.id WHERE b.expires_at<=now() AND (b.storage_key IS NOT NULL OR (u.batch_id IS NOT NULL AND u.state<>'EXPIRED')) ORDER BY b.id",
    )
  ).rows;
  for (const { id } of batches)
    await transaction(async (client) => {
      const batch = (
        await client.query<{ storage_key: string | null }>(
          "SELECT storage_key FROM import_batches WHERE id=$1 AND expires_at<=now() FOR UPDATE",
          [id],
        )
      ).rows[0];
      if (!batch) return;
      const upload = (
        await client.query<ImportUpload>(
          "SELECT * FROM import_uploads WHERE batch_id=$1 FOR UPDATE",
          [id],
        )
      ).rows[0];
      if (upload) {
        const store = associatedStorage(upload, storage);
        if (upload.raw_key) await store.delete(upload.raw_key);
        await store.delete(upload.inspection_key);
        await client.query(
          "UPDATE import_uploads SET state='EXPIRED' WHERE batch_id=$1",
          [id],
        );
      } else if (batch.storage_key) {
        if (storage.driver !== "local")
          throw Error(
            "Legacy import cleanup requires local operator migration",
          );
        await unlink(legacyInspectionPath(id)).catch(
          (e: NodeJS.ErrnoException) => {
            if (e.code !== "ENOENT") throw e;
          },
        );
      }
      await client.query(
        "UPDATE import_batches SET storage_key=NULL WHERE id=$1",
        [id],
      );
    }, connection);
  return { expiredFiles: batches.length };
}

/** Run from the old local workspace before deploying an ephemeral runtime. */
export async function migrateLegacyInspections(
  connection = database(),
  supplied?: ImportStorage,
) {
  const storage = supplied ?? importStorage();
  if (
    (
      await connection.query(
        "SELECT product FROM product_identity WHERE id=true",
      )
    ).rows[0]?.product !== "TAXUA_LAND"
  )
    throw Error("LAND database required");
  const rows = (
    await connection.query<{ id: string }>(
      "SELECT b.id FROM import_batches b WHERE b.storage_key=b.id::text AND b.expires_at>now() AND NOT EXISTS(SELECT 1 FROM import_uploads u WHERE u.batch_id=b.id)",
    )
  ).rows;
  for (const { id } of rows)
    await transaction(async (client) => {
      const batch = (
        await client.query<{
          uploaded_by: string;
          expires_at: Date;
          storage_key: string;
        }>(
          "SELECT uploaded_by,expires_at,storage_key FROM import_batches WHERE id=$1 FOR UPDATE",
          [id],
        )
      ).rows[0]!;
      if (
        batch.storage_key !== id ||
        (
          await client.query(
            "SELECT batch_id FROM import_uploads WHERE batch_id=$1",
            [id],
          )
        ).rowCount
      )
        return;
      const workbook = InspectedWorkbook.parse(
        JSON.parse(await readFile(legacyInspectionPath(id), "utf8")),
      );
      const key = `imports/inspection/${id}/${id}.json`;
      const object = await putImportObject(
        storage.store,
        key,
        Buffer.from(JSON.stringify(workbook)),
        "application/json",
      );
      await client.query(
        "INSERT INTO import_uploads(batch_id,actor_id,request_id,driver,inspection_key,inspection_size,inspection_sha256,state,upload_expires_at) VALUES($1,$2,$3,$4,$5,$6,$7,'UPLOADED',$8)",
        [
          id,
          batch.uploaded_by,
          randomUUID(),
          storage.driver,
          key,
          object.size,
          object.sha256,
          batch.expires_at,
        ],
      );
      await client.query(
        "UPDATE import_batches SET storage_key=$2 WHERE id=$1",
        [id, key],
      );
    }, connection);
  return { migrated: rows.length };
}
