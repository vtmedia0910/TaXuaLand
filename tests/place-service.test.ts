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
});
