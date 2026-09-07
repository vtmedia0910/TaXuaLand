import { randomUUID } from "node:crypto";
import pg from "pg";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { migrate } from "../infra/migrate";
import {
  savePlace,
  getPlace,
  archivePlace,
  listPlaces,
} from "../services/api/src/places";
import { PlaceInput } from "../services/api/src/place-input";
import type { Actor } from "../services/api/src/auth";
import { publicPlace, publicPlaces } from "../services/api/src/public-places";
const connection = process.env.DATABASE_TEST_URL;
describe.skipIf(!connection)("place application service with PostGIS", () => {
  let owner: InstanceType<typeof pg.Client>,
    pool: InstanceType<typeof pg.Pool>,
    actor: Actor,
    sourceId: string,
    categoryId: string;
  const dbName = `land_test_${randomUUID().replaceAll("-", "")}`;
  beforeAll(async () => {
    owner = new pg.Client({ connectionString: connection! });
    await owner.connect();
    await owner.query(`CREATE DATABASE "${dbName}"`);
    const url = new URL(connection!);
    url.pathname = `/${dbName}`;
    pool = new pg.Pool({ connectionString: url.toString() });
    await migrate(pool);
    const user = (
      await pool.query<{ id: string }>(
        "INSERT INTO admin_users(email,password_hash) VALUES('editor@example.invalid','unusable-test-hash') RETURNING id",
      )
    ).rows[0]!;
    actor = {
      id: user.id,
      email: "editor@example.invalid",
      permissions: new Set(["read", "edit"]),
      correlationId: randomUUID(),
    };
    sourceId = (
      await pool.query<{ id: string }>(
        "INSERT INTO sources(name,category,status) VALUES('Fixture source','PLACES','ACTIVE') RETURNING id",
      )
    ).rows[0]!.id;
    categoryId = (
      await pool.query<{ id: string }>(
        "INSERT INTO place_categories(code,name) VALUES('TEST','Test') RETURNING id",
      )
    ).rows[0]!.id;
  }, 30000);
  afterAll(async () => {
    await pool?.end();
    if (owner) {
      await owner.query(`DROP DATABASE IF EXISTS "${dbName}"`);
      await owner.end();
    }
  });
  it("creates, corrects, audits, preserves history and archives without factual upgrades", async () => {
    const data = PlaceInput.parse({
      name: "Điểm kiểm thử",
      slug: "diem-kiem-thu",
      sourceId,
      categoryIds: [categoryId],
      location: { longitude: 104.53, latitude: 21.26 },
      media: [
        {
          mediaType: "IMAGE",
          sourceUrl: "https://example.invalid/image.jpg",
          altText: "Test",
        },
      ],
    });
    const id = await savePlace(actor, data, null, pool);
    const created = await getPlace(actor, id, pool);
    expect(created.place.publication_status).toBe("DRAFT");
    expect(created.geometry?.verification_status).toBe("UNKNOWN");
    expect(created.data.media).toHaveLength(1);
    await expect(
      savePlace(
        actor,
        { ...data, location: { longitude: 104.54, latitude: 21.26 } },
        { id, version: 1 },
        pool,
      ),
    ).rejects.toThrow("Xác nhận");
    await savePlace(
      actor,
      {
        ...data,
        location: { longitude: 104.54, latitude: 21.26 },
        geometryChangeConfirmed: true,
      },
      { id, version: 1 },
      pool,
    );
    const changed = await getPlace(actor, id, pool);
    expect(changed.geometryHistory).toHaveLength(2);
    expect(changed.geometry?.verification_status).toBe("UNKNOWN");
    expect(
      (
        await pool.query(
          "SELECT * FROM place_content_revisions WHERE place_id=$1",
          [id],
        )
      ).rowCount,
    ).toBe(1);
    await expect(
      savePlace(actor, data, { id, version: 1 }, pool),
    ).rejects.toThrow("thay đổi");
    expect(
      await listPlaces(actor, { query: "diem kiem thu" }, pool),
    ).toHaveLength(1);
    await archivePlace(actor, id, 2, pool);
    expect((await getPlace(actor, id, pool)).place.publication_status).toBe(
      "ARCHIVED",
    );
    expect(
      (await getPlace(actor, id, pool)).audit.some(
        (e) => e.action === "PLACE_ARCHIVED",
      ),
    ).toBe(true);
  });
  it("rejects edits by read-only actors", async () => {
    await expect(
      savePlace({ ...actor, permissions: new Set(["read"]) }, {}, null, pool),
    ).rejects.toThrow("quyền");
  });
  it("public projection fails closed for drafts and source rights and preserves per-section trust", async () => {
    const data = PlaceInput.parse({
      name: "Đỉnh thử công khai",
      slug: "dinh-thu-cong-khai",
      sourceId,
      categoryIds: [categoryId],
      location: { longitude: 104.53, latitude: 21.26 },
      internalNotes: "PRIVATE_ADMIN_NOTE",
      safetyNotes: [{ note: "Synthetic safety note", observedAt:null, expiresAt:null }],
      media: [
        {
          mediaType: "IMAGE",
          sourceUrl: "https://example.invalid/fixture.png",
          altText: "Synthetic",
        },
      ],
    });
    const id = await savePlace(actor, data, null, pool);
    expect((await publicPlaces({}, pool)).items).toHaveLength(0);
    // Test-only setup exercises read boundaries independently of milestone 9 publication commands.
    await pool.query(
      "UPDATE places SET publication_status='PUBLISHED',review_required=false WHERE id=$1",
      [id],
    );
    expect((await publicPlaces({}, pool)).items).toHaveLength(0);
    await pool.query(
      "UPDATE sources SET public_display='ALLOWED' WHERE id=$1",
      [sourceId],
    );
    const result = await publicPlaces({ query: "dinh thu" }, pool);
    expect(result.items.map((p) => p.id)).toEqual([id]);
    const detail = await publicPlace(data.slug, pool);
    expect(detail.location.trust.verificationStatus).toBe("UNKNOWN");
    expect(detail.trust.sourceAuthority).toBe("UNKNOWN");
    expect(detail.safetyNotes[0]?.trust.verificationStatus).toBe("UNKNOWN");
    expect(detail.media).toHaveLength(1);
    expect(JSON.stringify(detail)).not.toMatch(
      /PRIVATE_ADMIN_NOTE|source_record_id|verified_by|raw_payload|actor_id|password_hash/,
    );
    const hiddenSource = (
      await pool.query<{ id: string }>(
        "INSERT INTO sources(name,category,status,public_display) VALUES('Hidden fixture','MEDIA','ACTIVE','DENIED') RETURNING id",
      )
    ).rows[0]!.id;
    const hiddenRecord = (
      await pool.query<{ id: string }>(
        "INSERT INTO source_records(source_id,raw_payload_hash) VALUES($1,repeat('a',64)) RETURNING id",
        [hiddenSource],
      )
    ).rows[0]!.id;
    await pool.query(
      "UPDATE place_media SET source_record_id=$1 WHERE place_id=$2",
      [hiddenRecord, id],
    );
    expect((await publicPlace(data.slug, pool)).media).toHaveLength(0);
    expect(
      (await publicPlaces({ category: "DOES_NOT_EXIST" }, pool)).items,
    ).toHaveLength(0);
    expect((await publicPlaces({ query: "%" }, pool)).items).toHaveLength(0);
    await pool.query("UPDATE sources SET status='DISABLED' WHERE id=$1", [
      sourceId,
    ]);
    await expect(publicPlace(data.slug, pool)).rejects.toThrow("công khai");
  });
});
