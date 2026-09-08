import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  mkdtemp,
  readdir,
  readFile,
  writeFile,
  mkdir,
  unlink,
  rm,
} from "node:fs/promises";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import pg from "pg";
import ExcelJS from "exceljs";
import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import { migrate } from "../infra/migrate";
import type { Actor } from "../services/api/src/auth";
import {
  createImportUploadSession,
  uploadLocalImport,
  finalizeImportUpload,
  UploadSessionCommand,
} from "../services/api/src/import-uploads";
import { importBatch, validateImport } from "../services/api/src/imports";
import {
  expireImportObjects,
  migrateLegacyInspections,
} from "../services/api/src/import-retention";
import { inspectWorkbookIsolated } from "../services/api/src/import-worker";
import {
  type ImportStorage,
  type ImportUpload,
  legacyInspectionPath,
} from "../services/api/src/import-storage";
import { LocalFilesystemObjectStore } from "../services/api/src/storage/local-object-store";
import {
  XLSX_TYPE,
  sha256,
  type ObjectDescriptor,
} from "../services/api/src/storage/object-store";
import { readWorkbookBody } from "../services/api/src/import-upload-body";

const scratch = vi.hoisted(() => ({ root: undefined as string | undefined }));
vi.mock("node:os", async (original) => {
  const os = await original<typeof import("node:os")>();
  return { ...os, tmpdir: () => scratch.root ?? os.tmpdir() };
});

it("upload contract rejects client bucket/key, macro, oversized and traversal inputs", () => {
  const input = {
    requestId: randomUUID(),
    sourceId: randomUUID(),
    name: "test.xlsx",
    mime: XLSX_TYPE,
    size: 4,
    sha256: "a".repeat(64),
  };
  expect(UploadSessionCommand.safeParse(input).success).toBe(true);
  for (const change of [
    { bucket: "public" },
    { key: "imports/raw/other.xlsx" },
    { name: "../test.xlsx" },
    { name: "test.xlsm" },
    { mime: "text/plain" },
    { size: 8388609 },
  ])
    expect(
      UploadSessionCommand.safeParse({ ...input, ...change }).success,
    ).toBe(false);
});
it("streaming ingress enforces actual size even without content-length", async () => {
  await expect(
    readWorkbookBody(
      new Request("http://localhost", {
        method: "PUT",
        body: Buffer.alloc(8388609),
      }),
    ),
  ).rejects.toMatchObject({ code: "UPLOAD_TOO_LARGE" });
});

const connection = process.env.DATABASE_TEST_URL;
describe.skipIf(!connection)(
  "durable import security with real PostGIS",
  () => {
    const name = `land_test_${randomUUID().replaceAll("-", "")}`;
    let owner: InstanceType<typeof pg.Client>,
      pool: InstanceType<typeof pg.Pool>,
      actor: Actor,
      sourceId: string,
      root: string,
      storage: ImportStorage,
      bytes: Buffer,
      legacyId: string;
    const command = (body = bytes) => ({
      requestId: randomUUID(),
      sourceId,
      name: "fixture.xlsx",
      mime: XLSX_TYPE,
      size: body.length,
      sha256: sha256(body),
    });
    const uploadRow = async (id: string) =>
      (
        await pool.query<ImportUpload>(
          "SELECT * FROM import_uploads WHERE batch_id=$1",
          [id],
        )
      ).rows[0]!;
    beforeAll(async () => {
      owner = new pg.Client({ connectionString: connection! });
      await owner.connect();
      await owner.query(`CREATE DATABASE "${name}"`);
      const url = new URL(connection!);
      url.pathname = `/${name}`;
      pool = new pg.Pool({ connectionString: url.toString() });
      // Exercise an actual upgrade from all twelve accepted Phase 0 migrations.
      await pool.query(
        "CREATE TABLE land_migrations(name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())",
      );
      for (const file of (await readdir("infra/migrations"))
        .filter((n) => n.endsWith(".sql") && n < "013")
        .sort()) {
        const sql = await readFile(resolve("infra/migrations", file), "utf8");
        await pool.query(sql);
        await pool.query(
          "INSERT INTO land_migrations(name,checksum) VALUES($1,$2)",
          [file, sha256(Buffer.from(sql))],
        );
      }
      actor = {
        id: (
          await pool.query(
            "INSERT INTO admin_users(email,password_hash) VALUES('durable@example.invalid','unusable') RETURNING id",
          )
        ).rows[0].id,
        email: "durable@example.invalid",
        permissions: new Set(["read", "import"]),
        correlationId: randomUUID(),
      };
      sourceId = (
        await pool.query(
          "INSERT INTO sources(name,category,status) VALUES('Durable QA','OTHER','ACTIVE') RETURNING id",
        )
      ).rows[0].id;
      await pool.query(
        "INSERT INTO place_categories(code,name) VALUES('TEST','Test')",
      );
      await pool.query(
        "INSERT INTO areas_of_interest(name,version,source,boundary,outside_policy,active) VALUES('Fixture','test','Synthetic',ST_MakeEnvelope(104,21,105,22,4326),'INVALID',true)",
      );
      const workbook = new ExcelJS.Workbook();
      workbook.addWorksheet("Places").addRows([
        ["Tên", "Slug", "Tọa Độ", "Danh mục"],
        ["Synthetic", "synthetic-durable", "21.26,104.53", "TEST"],
      ]);
      bytes = Buffer.from(await workbook.xlsx.writeBuffer());
      legacyId = randomUUID();
      await pool.query(
        "INSERT INTO import_batches(id,source_id,file_name,file_hash,uploaded_by,storage_key) VALUES($1::uuid,$2,'old.xlsx',$3,$4,$1::text)",
        [legacyId, sourceId, sha256(bytes), actor.id],
      );
      await mkdir(resolve("work/imports"), { recursive: true });
      await writeFile(
        legacyInspectionPath(legacyId),
        JSON.stringify(await inspectWorkbookIsolated(bytes)),
        { flag: "wx" },
      );
      await migrate(pool);
      root = await mkdtemp(resolve(tmpdir(), "land-durable-test-"));
      scratch.root = root;
      storage = {
        driver: "local",
        store: new LocalFilesystemObjectStore(root, "private"),
        ttlSeconds: 300,
        retentionDays: 7,
      };
    }, 30000);
    afterAll(async () => {
      if (legacyId)
        await unlink(legacyInspectionPath(legacyId)).catch((e) => {
          if (e.code !== "ENOENT") throw e;
        });
      if (root) await rm(root, { recursive: true, force: true });
      await pool?.end();
      if (owner) {
        await owner.query(`DROP DATABASE IF EXISTS "${name}"`);
        await owner.end();
      }
    });
    it("upgrades legacy inspection without losing batch/provenance and migrates idempotently", async () => {
      expect(
        (await pool.query("SELECT count(*)::int AS n FROM land_migrations"))
          .rows[0].n,
      ).toBe(13);
      expect(await migrateLegacyInspections(pool, storage)).toEqual({
        migrated: 1,
      });
      expect(await migrateLegacyInspections(pool, storage)).toEqual({
        migrated: 0,
      });
      const batch = await importBatch(actor, legacyId, pool, storage);
      expect(batch.sheets).toHaveLength(1);
      expect(batch.batch.file_hash).toBe(sha256(bytes));
      const url = new URL(connection!);
      url.pathname = `/${name}`;
      const result = await promisify(execFile)(
        process.execPath,
        [
          "--experimental-transform-types",
          "infra/expire-import-files.mjs",
          "--migrate-legacy",
        ],
        {
          env: { ...process.env, DATABASE_URL: url.toString() },
          windowsHide: true,
        },
      );
      expect(JSON.parse(result.stdout)).toEqual({ migrated: 0 });
    });
    it("binds short-lived signed issuance to server key and immutable metadata; bounds retries", async () => {
      const issued: { object: ObjectDescriptor; ttl: number }[] = [];
      const signed: ImportStorage = {
        ...storage,
        driver: "s3",
        ttlSeconds: 30,
        signer: {
          async createUploadUrl(object, ttl) {
            issued.push({ object, ttl });
            return {
              url: "https://storage.example.invalid/private",
              method: "PUT",
              headers: {},
              expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
            };
          },
          async createDownloadUrl() {
            throw Error("not used");
          },
        },
      };
      const input = command();
      const result = await createImportUploadSession(
        actor,
        input,
        pool,
        signed,
      );
      expect(issued[0]!.object).toMatchObject({
        size: bytes.length,
        sha256: sha256(bytes),
        contentType: XLSX_TYPE,
      });
      expect(issued[0]!.object.key).toContain(`/raw/${result.id}/`);
      expect(issued[0]!.ttl).toBe(30);
      // Use normal TTL for the repeated issuance cap; minimum-TTL case above is intentionally short.
      const retry = command();
      const session = await createImportUploadSession(
        actor,
        retry,
        pool,
        storage,
      );
      for (let i = 1; i < 10; i++)
        expect(
          (await createImportUploadSession(actor, retry, pool, storage)).id,
        ).toBe(session.id);
      await expect(
        createImportUploadSession(actor, retry, pool, storage),
      ).rejects.toMatchObject({ code: "UPLOAD_ISSUANCE_LIMIT" });
      await expect(
        createImportUploadSession(
          actor,
          { ...retry, sha256: "b".repeat(64) },
          pool,
          storage,
        ),
      ).rejects.toMatchObject({ code: "IMPORT_RETRY_MISMATCH" });
      await expect(
        pool.query(
          "UPDATE import_uploads SET raw_key=inspection_key WHERE batch_id=$1",
          [session.id],
        ),
      ).rejects.toThrow("immutable");
    });
    it("requires permission/ownership; rejects missing and mismatched objects before parsing", async () => {
      const denied = { ...actor, permissions: new Set(["read"]) };
      await expect(
        createImportUploadSession(denied, command(), pool, storage),
      ).rejects.toMatchObject({ status: 403 });
      const { id } = await createImportUploadSession(
        actor,
        command(),
        pool,
        storage,
      );
      await expect(
        finalizeImportUpload(denied, id, pool, storage),
      ).rejects.toMatchObject({ status: 403 });
      await expect(
        finalizeImportUpload({ ...actor, id: randomUUID() }, id, pool, storage),
      ).rejects.toMatchObject({ status: 404 });
      await expect(
        finalizeImportUpload(actor, id, pool, storage),
      ).rejects.toMatchObject({ code: "IMPORT_OBJECT_MISSING" });
      await expect(
        uploadLocalImport(
          actor,
          id,
          Buffer.from("wrong"),
          XLSX_TYPE,
          pool,
          storage,
        ),
      ).rejects.toMatchObject({ code: "IMPORT_OBJECT_MISMATCH" });
      await uploadLocalImport(actor, id, bytes, XLSX_TYPE, pool, storage);
      const original = await storage.store.head((await uploadRow(id)).raw_key!);
      for (const patch of [
        { key: `imports/raw/${randomUUID()}/${randomUUID()}.xlsx` },
        { size: 8388609 },
        { sha256: "c".repeat(64) },
        { contentType: "text/plain" },
      ]) {
        const bad: ImportStorage = {
          ...storage,
          store: {
            put: (v) => storage.store.put(v),
            get: (k) => storage.store.get(k),
            delete: (k) => storage.store.delete(k),
            head: async () => ({ ...original!, ...patch }),
          },
        };
        await expect(
          finalizeImportUpload(actor, id, pool, bad),
        ).rejects.toMatchObject({ code: "IMPORT_OBJECT_MISMATCH" });
      }
      expect((await pool.query("SELECT id FROM places")).rowCount).toBe(0);
    });
    it("survives adapter recreation; finalize/validate retries stage exactly once, retention preserves rows/audit", async () => {
      const input = command(),
        session = await createImportUploadSession(actor, input, pool, storage);
      await uploadLocalImport(
        actor,
        session.id,
        bytes,
        XLSX_TYPE,
        pool,
        storage,
      );
      const restarted = {
        ...storage,
        store: new LocalFilesystemObjectStore(root, "private"),
      };
      const before = (await readdir(tmpdir())).filter((n) =>
        n.startsWith("taxualand-import-"),
      );
      await Promise.all([
        finalizeImportUpload(actor, session.id, pool, restarted),
        finalizeImportUpload(actor, session.id, pool, restarted),
      ]);
      expect(
        (await readdir(tmpdir())).filter((n) =>
          n.startsWith("taxualand-import-"),
        ),
      ).toEqual(before);
      expect(
        (await createImportUploadSession(actor, input, pool, restarted)).upload,
      ).toBeNull();
      const inspected = await importBatch(actor, session.id, pool, restarted);
      const mapping = {
        version: 1,
        sheetIndex: 0,
        mapping: inspected.sheets[0]!.mapping,
      };
      await validateImport(actor, session.id, mapping, pool, restarted);
      await validateImport(actor, session.id, mapping, pool, restarted);
      expect(
        (
          await pool.query("SELECT id FROM import_rows WHERE batch_id=$1", [
            session.id,
          ])
        ).rowCount,
      ).toBe(1);
      expect(
        (
          await pool.query(
            "SELECT id FROM audit_events WHERE subject_id=$1 AND action='IMPORT_UPLOADED'",
            [session.id],
          )
        ).rowCount,
      ).toBe(1);
      const row = await uploadRow(session.id);
      expect(await restarted.store.head(row.raw_key!)).not.toBeNull();
      await pool.query(
        "UPDATE import_batches SET expires_at=now()-interval '1 day' WHERE id=$1",
        [session.id],
      );
      expect(await expireImportObjects(pool, restarted)).toEqual({
        expiredFiles: 1,
      });
      expect(await expireImportObjects(pool, restarted)).toEqual({
        expiredFiles: 0,
      });
      expect(await restarted.store.head(row.raw_key!)).toBeNull();
      expect(await restarted.store.head(row.inspection_key)).toBeNull();
      expect(
        (
          await pool.query("SELECT id FROM import_rows WHERE batch_id=$1", [
            session.id,
          ])
        ).rowCount,
      ).toBe(1);
      expect(
        (
          await pool.query("SELECT id FROM audit_events WHERE subject_id=$1", [
            session.id,
          ])
        ).rowCount,
      ).toBeGreaterThan(0);
      await expect(
        finalizeImportUpload(actor, session.id, pool, restarted),
      ).rejects.toMatchObject({ status: 410 });
    }, 30000);
    it("rejects corrupt containers and cleans parser scratch without creating places", async () => {
      const corrupt = Buffer.from("not an xlsx"),
        { id } = await createImportUploadSession(
          actor,
          command(corrupt),
          pool,
          storage,
        );
      await uploadLocalImport(actor, id, corrupt, XLSX_TYPE, pool, storage);
      const before = (await readdir(tmpdir())).filter((n) =>
        n.startsWith("taxualand-import-"),
      );
      await expect(
        finalizeImportUpload(actor, id, pool, storage),
      ).rejects.toMatchObject({ code: "WORKBOOK_REJECTED" });
      expect((await uploadRow(id)).state).toBe("FAILED");
      expect(
        (await readdir(tmpdir())).filter((n) =>
          n.startsWith("taxualand-import-"),
        ),
      ).toEqual(before);
      expect((await pool.query("SELECT id FROM places")).rowCount).toBe(0);
    });
  },
);
