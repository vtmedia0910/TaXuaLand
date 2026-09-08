import { randomUUID } from "node:crypto";
import { readFile, unlink } from "node:fs/promises";
import pg from "pg";
import ExcelJS from "exceljs";
import { describe, beforeAll, afterAll, it, expect } from "vitest";
import { migrate } from "../infra/migrate";
import {
  uploadImport,
  importBatch,
  validateImport,
} from "../services/api/src/imports";
import type { Actor } from "../services/api/src/auth";
import {
  importReview,
  reviewImportRow,
} from "../services/api/src/import-review";
const connection = process.env.DATABASE_TEST_URL;
describe.skipIf(!connection)("workbook staging with real PostGIS", () => {
  const name = `land_test_${randomUUID().replaceAll("-", "")}`,
    ids: string[] = [];
  let owner: InstanceType<typeof pg.Client>,
    pool: InstanceType<typeof pg.Pool>,
    actor: Actor,
    sourceId: string;
  beforeAll(async () => {
    owner = new pg.Client({ connectionString: connection! });
    await owner.connect();
    await owner.query(`CREATE DATABASE "${name}"`);
    const url = new URL(connection!);
    url.pathname = `/${name}`;
    pool = new pg.Pool({ connectionString: url.toString() });
    await migrate(pool);
    const user = (
      await pool.query<{ id: string }>(
        "INSERT INTO admin_users(email,password_hash) VALUES('import@example.invalid','unusable-test-hash') RETURNING id",
      )
    ).rows[0]!;
    actor = {
      id: user.id,
      email: "import@example.invalid",
      permissions: new Set(["read", "import"]),
      correlationId: randomUUID(),
    };
    sourceId = (
      await pool.query<{ id: string }>(
        "INSERT INTO sources(name,category,status) VALUES('Synthetic import','OTHER','ACTIVE') RETURNING id",
      )
    ).rows[0]!.id;
    await pool.query(
      "INSERT INTO place_categories(code,name) VALUES('TEST','Test')",
    );
    await pool.query(
      "INSERT INTO areas_of_interest(name,version,source,boundary,outside_policy,active) VALUES('Fixture','test','Synthetic',ST_MakeEnvelope(104,21,105,22,4326),'INVALID',true)",
    );
  }, 30000);
  afterAll(async () => {
    for (const id of ids)
      await unlink(`work/imports/${id}.json`).catch(() => {});
    await pool?.end();
    if (owner) {
      await owner.query(`DROP DATABASE IF EXISTS "${name}"`);
      await owner.end();
    }
  });
  it("inspect -> map -> stage preserves provenance, blocks sensitive sheet and never creates places", async () => {
    const workbook = new ExcelJS.Workbook(),
      sheet = workbook.addWorksheet("Địa điểm");
    sheet.addRows([
      ["Tên", "Slug", "Tọa Độ", "Danh mục", "URL Google Map", "URL Ảnh"],
      [
        "Synthetic first",
        "synthetic-first",
        "21.26,104.53",
        "TEST",
        "https://maps.app.goo.gl/fixture",
        "https://example.invalid/image.jpg",
      ],
      [
        "Synthetic duplicate",
        "synthetic-first",
        "21.26,104.53",
        "TEST",
        "",
        "",
      ],
      ["Missing coordinates", "missing-coordinates", "", "TEST", "", ""],
      ["Reversed", "reversed", "104.53,21.26", "TEST", "", ""],
    ]);
    workbook.addWorksheet("Tài khoản").addRows([
      ["Username", "Password"],
      ["test", "SYNTHETIC_ACCOUNT_SECRET"],
    ]);
    const bytes = Buffer.from(await workbook.xlsx.writeBuffer());
    const result = await uploadImport(
      actor,
      {
        name: "fixture.xlsx",
        mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        bytes,
        sourceId,
      },
      pool,
    );
    ids.push(result.id);
    const inspection = await importBatch(actor, result.id, pool);
    expect(inspection.sheets[1]?.blocked).toBe(true);
    expect(
      await readFile(`work/imports/${result.id}.json`, "utf8"),
    ).not.toContain("SYNTHETIC_ACCOUNT_SECRET");
    await expect(
      validateImport(
        actor,
        result.id,
        { version: 1, sheetIndex: 1, mapping: { "0": "name" } },
        pool,
      ),
    ).rejects.toThrow("Sheet");
    await validateImport(
      actor,
      result.id,
      { version: 1, sheetIndex: 0, mapping: inspection.sheets[0]!.mapping },
      pool,
    );
    const staged = await importBatch(actor, result.id, pool);
    expect(staged.batch).toMatchObject({
      status: "READY_FOR_REVIEW",
      total_rows: 4,
      valid_rows: 1,
      warning_rows: 1,
      invalid_rows: 2,
      version: 2,
    });
    expect((await pool.query("SELECT id FROM places")).rowCount).toBe(0);
    expect(
      (
        await pool.query(
          "SELECT id FROM import_rows WHERE admin_action<>'REVIEW_LATER'",
        )
      ).rowCount,
    ).toBe(0);
    expect(
      (
        await pool.query(
          "SELECT id FROM import_row_errors WHERE code='DUPLICATE_SLUG_IN_WORKBOOK'",
        )
      ).rowCount,
    ).toBe(1);
    const reverse = (
      await pool.query<{ normalized_data_json: { location: unknown } }>(
        "SELECT normalized_data_json FROM import_rows WHERE batch_id=$1 AND row_number=5",
        [result.id],
      )
    ).rows[0]!;
    expect(reverse.normalized_data_json.location).toBeNull();
    await expect(
      validateImport(
        actor,
        result.id,
        { version: 2, sheetIndex: 0, mapping: inspection.sheets[0]!.mapping },
        pool,
      ),
    ).rejects.toThrow("staging");
    await expect(
      uploadImport(
        { ...actor, permissions: new Set(["read"]) },
        {
          name: "fixture.xlsx",
          mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          bytes,
          sourceId,
        },
        pool,
      ),
    ).rejects.toThrow("quyền");
    await expect(
      uploadImport(
        actor,
        {
          name: "fixture.xlsm",
          mime: "application/vnd.ms-excel.sheet.macroEnabled.12",
          bytes,
          sourceId,
        },
        pool,
      ),
    ).rejects.toThrow("macro");
    const review = await importReview(actor, result.id, pool),
      first = review.rows[0]!,
      bad = review.rows[2]!;
    await expect(
      reviewImportRow(
        actor,
        result.id,
        bad.id,
        {
          version: 2,
          action: "CREATE",
          targetPlaceId: null,
          targetPlaceVersion: null,
          warningsAcknowledged: true,
        },
        pool,
      ),
    ).rejects.toThrow("Dòng lỗi");
    await reviewImportRow(
      actor,
      result.id,
      first.id,
      {
        version: 2,
        action: "CREATE",
        targetPlaceId: null,
        targetPlaceVersion: null,
        warningsAcknowledged: true,
      },
      pool,
    );
    await expect(
      reviewImportRow(
        actor,
        result.id,
        first.id,
        {
          version: 2,
          action: "SKIP",
          targetPlaceId: null,
          targetPlaceVersion: null,
          warningsAcknowledged: false,
        },
        pool,
      ),
    ).rejects.toThrow("thay đổi");
    await reviewImportRow(
      actor,
      result.id,
      bad.id,
      {
        version: 3,
        action: "SKIP",
        targetPlaceId: null,
        targetPlaceVersion: null,
        warningsAcknowledged: false,
      },
      pool,
    );
    const changed = await importReview(actor, result.id, pool);
    expect(changed.rows[0]?.admin_action).toBe("CREATE");
    expect(changed.rows[2]?.admin_action).toBe("SKIP");
    expect(changed.batch.version).toBe(4);
    expect(
      (await pool.query("SELECT id FROM import_row_revisions")).rowCount,
    ).toBe(2);
    expect((await pool.query("SELECT id FROM places")).rowCount).toBe(0);
  }, 30000);
});
