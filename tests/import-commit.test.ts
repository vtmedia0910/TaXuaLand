import { randomUUID } from "node:crypto";
import { unlink } from "node:fs/promises";
import pg from "pg";
import ExcelJS from "exceljs";
import { describe, beforeAll, afterAll, it, expect } from "vitest";
import { migrate } from "../infra/migrate";
import {
  uploadImport,
  importBatch,
  validateImport,
} from "../services/api/src/imports";
import {
  importReview,
  reviewImportRow,
} from "../services/api/src/import-review";
import { commitImport } from "../services/api/src/import-commit";
import { savePlace, getPlace } from "../services/api/src/places";
import { PlaceInput } from "../services/api/src/place-input";
import type { Actor } from "../services/api/src/auth";

const connection = process.env.DATABASE_TEST_URL;
describe.skipIf(!connection)("atomic explicit import commit in PostGIS", () => {
  const databaseName = `land_test_${randomUUID().replaceAll("-", "")}`,
    batches: string[] = [];
  let owner: InstanceType<typeof pg.Client>,
    pool: InstanceType<typeof pg.Pool>,
    actor: Actor,
    sourceId: string;
  beforeAll(async () => {
    owner = new pg.Client({ connectionString: connection! });
    await owner.connect();
    await owner.query(`CREATE DATABASE "${databaseName}"`);
    const url = new URL(connection!);
    url.pathname = `/${databaseName}`;
    pool = new pg.Pool({ connectionString: url.toString() });
    await migrate(pool);
    const id = (
      await pool.query<{ id: string }>(
        "INSERT INTO admin_users(email,password_hash) VALUES('commit@example.invalid','test-only') RETURNING id",
      )
    ).rows[0]!.id;
    actor = {
      id,
      email: "commit@example.invalid",
      permissions: new Set(["read", "import", "edit"]),
      correlationId: randomUUID(),
    };
    sourceId = (
      await pool.query<{ id: string }>(
        "INSERT INTO sources(name,category,status) VALUES('Synthetic commit fixture','OTHER','ACTIVE') RETURNING id",
      )
    ).rows[0]!.id;
    await pool.query(
      "INSERT INTO place_categories(code,name) VALUES('TEST','Test')",
    );
    await pool.query(
      "INSERT INTO areas_of_interest(name,version,source,boundary,outside_policy,active) VALUES('Synthetic','test','Test fixture',ST_MakeEnvelope(104,21,105,22,4326),'INVALID',true)",
    );
  }, 30000);
  afterAll(async () => {
    for (const id of batches)
      await unlink(`work/imports/${id}.json`).catch(() => {});
    await pool?.end();
    if (owner) {
      await owner.query(`DROP DATABASE IF EXISTS "${databaseName}"`);
      await owner.end();
    }
  });
  async function stage(rows: string[][]) {
    const workbook = new ExcelJS.Workbook();
    workbook
      .addWorksheet("Places")
      .addRows([["Tên", "Slug", "Tọa Độ", "Danh mục"], ...rows]);
    const { id } = await uploadImport(
      actor,
      {
        name: "commit.xlsx",
        mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        bytes: Buffer.from(await workbook.xlsx.writeBuffer()),
        sourceId,
      },
      pool,
    );
    batches.push(id);
    const inspected = await importBatch(actor, id, pool);
    await validateImport(
      actor,
      id,
      { version: 1, sheetIndex: 0, mapping: inspected.sheets[0]!.mapping },
      pool,
    );
    return id;
  }
  async function decide(
    id: string,
    index: number,
    action: "CREATE" | "SKIP" | "UPDATE",
    target?: { id: string; version: number },
  ) {
    const review = await importReview(actor, id, pool);
    await reviewImportRow(
      actor,
      id,
      review.rows[index]!.id,
      {
        version: review.batch.version,
        action,
        targetPlaceId: target?.id ?? null,
        targetPlaceVersion: target?.version ?? null,
        warningsAcknowledged: true,
        replacementConfirmed: !!target,
      },
      pool,
    );
    return review.batch.version + 1;
  }
  it("requires confirmation, permission and complete review; commits once under concurrent retries with linked provenance", async () => {
    const id = await stage([
      ["Synthetic created", "commit-created", "21.1,104.1", "TEST"],
      ["Skip invalid", "commit-skip", "", "TEST"],
    ]);
    await expect(
      commitImport(actor, id, { version: 2, confirmed: false }, pool),
    ).rejects.toThrow();
    await expect(
      commitImport(
        { ...actor, permissions: new Set(["read"]) },
        id,
        { version: 2, confirmed: true },
        pool,
      ),
    ).rejects.toThrow("quyền");
    await decide(id, 0, "CREATE");
    await expect(
      commitImport(actor, id, { version: 3, confirmed: true }, pool),
    ).rejects.toThrow("toàn bộ dòng");
    const version = await decide(id, 1, "SKIP");
    const results = await Promise.all([
      commitImport(actor, id, { version, confirmed: true }, pool),
      commitImport(actor, id, { version, confirmed: true }, pool),
    ]);
    expect(results[0]).toEqual(results[1]);
    expect(results[0]).toMatchObject({ created: 1, updated: 0, skipped: 1 });
    const place = await getPlace(actor, results[0]!.rows[0]!.placeId!, pool);
    expect(place.place.publication_status).toBe("DRAFT");
    expect(place.geometry?.verification_status).toBe("UNKNOWN");
    expect(place.geometry?.verified_at).toBeNull();
    expect(place.accessVerification).toBe("UNKNOWN");
    const provenance = (
      await pool.query(
        "SELECT sr.import_batch_id,sr.import_row_id,sr.raw_payload_hash=r.raw_payload_hash AS hash_matches,r.committed_at FROM source_records sr JOIN import_rows r ON r.id=sr.import_row_id WHERE sr.import_batch_id=$1",
        [id],
      )
    ).rows;
    expect(provenance).toHaveLength(1);
    expect(provenance[0]).toMatchObject({
      import_batch_id: id,
      hash_matches: true,
    });
    expect(provenance[0]?.committed_at).toBeTruthy();
    expect(
      (
        await pool.query(
          "SELECT id FROM audit_events WHERE action='IMPORT_COMMITTED' AND subject_id=$1",
          [id],
        )
      ).rowCount,
    ).toBe(1);
    await expect(
      pool.query(
        "UPDATE import_rows SET admin_action='SKIP' WHERE batch_id=$1",
        [id],
      ),
    ).rejects.toThrow("immutable");
    await expect(
      pool.query("UPDATE import_batches SET commit_result='{}' WHERE id=$1", [
        id,
      ]),
    ).rejects.toThrow("immutable");
    await expect(
      pool.query(
        "DELETE FROM import_row_actions WHERE import_row_id IN(SELECT id FROM import_rows WHERE batch_id=$1)",
        [id],
      ),
    ).rejects.toThrow("immutable");
  }, 30000);
  it("rolls back every row and source record on a late unique conflict", async () => {
    const id = await stage([
      ["First rollback", "rollback-first", "21.2,104.2", "TEST"],
      ["Second rollback", "rollback-first", "21.3,104.3", "TEST"],
    ]);
    await decide(id, 0, "CREATE");
    const version = await decide(id, 1, "CREATE");
    await expect(
      commitImport(actor, id, { version, confirmed: true }, pool),
    ).rejects.toThrow("rollback");
    expect(
      (await pool.query("SELECT id FROM places WHERE slug='rollback-first'"))
        .rowCount,
    ).toBe(0);
    expect(
      (
        await pool.query(
          "SELECT id FROM source_records WHERE import_batch_id=$1",
          [id],
        )
      ).rowCount,
    ).toBe(0);
    expect((await importReview(actor, id, pool)).batch.status).toBe(
      "READY_FOR_REVIEW",
    );
    expect(
      (
        await pool.query(
          "SELECT id FROM audit_events WHERE action='IMPORT_COMMITTED' AND subject_id=$1",
          [id],
        )
      ).rowCount,
    ).toBe(0);
  }, 30000);
  it("rejects newly introduced duplicates and supports explicit revalidation before a new decision", async () => {
    const id = await stage([
      ["Concurrent target", "concurrent-target", "21.4,104.4", "TEST"],
    ]);
    const version = await decide(id, 0, "CREATE");
    const targetId = await savePlace(
      actor,
      PlaceInput.parse({
        name: "Concurrent target",
        slug: "concurrent-target",
        sourceId,
        location: { longitude: 104.4, latitude: 21.4 },
      }),
      null,
      pool,
    );
    await expect(
      commitImport(actor, id, { version, confirmed: true }, pool),
    ).rejects.toThrow("ứng viên trùng mới");
    let review = await importReview(actor, id, pool);
    await reviewImportRow(
      actor,
      id,
      review.rows[0]!.id,
      {
        version,
        action: "REVIEW_LATER",
        targetPlaceId: null,
        targetPlaceVersion: null,
        warningsAcknowledged: false,
        revalidate: true,
      },
      pool,
    );
    review = await importReview(actor, id, pool);
    expect(review.rows[0]?.duplicate_candidate_ids).toContain(targetId);
    expect(review.summary.unreviewed).toBe(1);
    await decide(id, 0, "UPDATE", { id: targetId, version: 1 });
    const result = await commitImport(
      actor,
      id,
      { version: review.batch.version + 1, confirmed: true },
      pool,
    );
    expect(result).toMatchObject({ created: 0, updated: 1 });
  }, 30000);
  it("updates preserve old verified geometry but imported observations remain UNKNOWN even at the same coordinates", async () => {
    const targetId = await savePlace(
      actor,
      PlaceInput.parse({
        name: "History target",
        slug: "history-target",
        sourceId,
        location: { longitude: 104.5, latitude: 21.5 },
        description: "Old snapshot",
      }),
      null,
      pool,
    );
    const old = await getPlace(actor, targetId, pool);
    // Synthetic verification fixture only; no real-world evidence or product verification is asserted.
    await pool.query(
      "UPDATE place_geometries SET valid_to=clock_timestamp() WHERE place_id=$1 AND valid_to IS NULL",
      [targetId],
    );
    await pool.query(
      "INSERT INTO place_geometries(place_id,geometry,source_record_id,source_crs,verification_status,location_role,verified_at,verified_by,verification_method,evidence_source_record_id,freshness_policy) VALUES($1,ST_SetSRID(ST_MakePoint(104.5,21.5),4326),$2,'EPSG:4326','VERIFIED','VERIFIED',now(),$3,'Synthetic test fixture',$2,'NO_EXPIRY')",
      [targetId, old.place.source_record_id, actor.id],
    );
    const id = await stage([
      ["History target", "history-target", "21.5,104.5", "TEST"],
    ]);
    const version = await decide(id, 0, "UPDATE", { id: targetId, version: 1 });
    await commitImport(actor, id, { version, confirmed: true }, pool);
    const changed = await getPlace(actor, targetId, pool);
    expect(changed.place.version).toBe(2);
    expect(changed.geometry?.verification_status).toBe("UNKNOWN");
    expect(
      changed.geometryHistory.some(
        (g) => g.verification_status === "VERIFIED" && g.valid_to !== null,
      ),
    ).toBe(true);
    expect(
      (
        await pool.query(
          "SELECT snapshot->'place'->>'description' AS description FROM place_content_revisions WHERE place_id=$1",
          [targetId],
        )
      ).rows[0]?.description,
    ).toBe("Old snapshot");
  }, 30000);
  it("corrections preserve immutable origin and require another review before approval", async () => {
    const id = await stage([
      ["Corrected fixture", "corrected-fixture", "21.7,104.7", "TEST"],
    ]);
    const review = await importReview(actor, id, pool),
      row = review.rows[0]!;
    await reviewImportRow(
      actor,
      id,
      row.id,
      {
        version: 2,
        action: "CREATE",
        targetPlaceId: null,
        targetPlaceVersion: null,
        warningsAcknowledged: true,
        manualCorrectionConfirmed: true,
        data: { ...row.normalized_data_json, name: "Corrected name" },
      },
      pool,
    );
    const corrected = await importReview(actor, id, pool);
    expect(corrected.rows[0]).toMatchObject({
      admin_action: "REVIEW_LATER",
      warnings_acknowledged: false,
      raw_payload_hash: row.raw_payload_hash,
      raw_data_json: row.raw_data_json,
    });
    expect(corrected.rows[0]?.normalized_data_json.name).toBe("Corrected name");
    await expect(
      commitImport(actor, id, { version: 3, confirmed: true }, pool),
    ).rejects.toThrow("toàn bộ dòng");
    await expect(
      pool.query("UPDATE import_rows SET raw_data_json='{}' WHERE id=$1", [
        row.id,
      ]),
    ).rejects.toThrow("immutable");
    const revisions = (
      await pool.query(
        "SELECT snapshot FROM import_row_revisions WHERE import_row_id=$1",
        [row.id],
      )
    ).rows;
    expect(revisions[0]?.snapshot.row.normalized_data_json.name).toBe(
      "Corrected fixture",
    );
    expect(revisions[0]?.snapshot.issues.length).toBeGreaterThan(0);
  }, 30000);
  it("rejects a changed update target and current AOI violations without writing provenance", async () => {
    const existing = (
      await pool.query<{ id: string; version: number }>(
        "SELECT id,version FROM places WHERE slug='history-target'",
      )
    ).rows[0]!;
    const id = await stage([
      ["History target", "history-target", "21.5,104.5", "TEST"],
    ]);
    const version = await decide(id, 0, "UPDATE", existing);
    await pool.query("UPDATE places SET version=version+1 WHERE id=$1", [
      existing.id,
    ]);
    await expect(
      commitImport(actor, id, { version, confirmed: true }, pool),
    ).rejects.toThrow("đích đã thay đổi");
    expect(
      (
        await pool.query(
          "SELECT id FROM source_records WHERE import_batch_id=$1",
          [id],
        )
      ).rowCount,
    ).toBe(0);
    const aoiBatch = await stage([
      ["AOI changes", "aoi-changes", "21.6,104.6", "TEST"],
    ]);
    const aoiVersion = await decide(aoiBatch, 0, "CREATE");
    await pool.query(
      "UPDATE areas_of_interest SET boundary=ST_MakeEnvelope(104,21,104.1,21.1,4326) WHERE active",
    );
    await expect(
      commitImport(
        actor,
        aoiBatch,
        { version: aoiVersion, confirmed: true },
        pool,
      ),
    ).rejects.toThrow("không gian đã thay đổi");
    expect(
      (await pool.query("SELECT id FROM places WHERE slug='aoi-changes'"))
        .rowCount,
    ).toBe(0);
  }, 30000);
});
