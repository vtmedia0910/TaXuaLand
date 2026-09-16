import { createHash, randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { migrate } from "../infra/migrate";

const connection = process.env.DATABASE_TEST_URL;

describe.skipIf(!connection)("ADR-010 Source governance migration", () => {
  const name = `land_test_${randomUUID().replaceAll("-", "")}`;
  let owner: InstanceType<typeof pg.Client>;
  let pool: InstanceType<typeof pg.Pool>;

  beforeAll(async () => {
    owner = new pg.Client({ connectionString: connection! });
    await owner.connect();
    await owner.query(`CREATE DATABASE "${name}"`);
    const url = new URL(connection!);
    url.pathname = `/${name}`;
    pool = new pg.Pool({ connectionString: url.toString() });
  });

  afterAll(async () => {
    await pool?.end();
    if (owner) {
      await owner.query(`DROP DATABASE IF EXISTS "${name}"`);
      await owner.end();
    }
  });

  it("upgrades existing Sources without manufacturing acceptance or rights evidence", async () => {
    const directory = fileURLToPath(
      new URL("../infra/migrations/", import.meta.url),
    );
    await pool.query(
      "CREATE TABLE land_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())",
    );
    for (const migration of (await readdir(directory))
      .filter((file) => file.endsWith(".sql") && file < "015_")
      .sort()) {
      const sql = await readFile(`${directory}/${migration}`, "utf8");
      await pool.query("BEGIN");
      try {
        await pool.query(sql);
        await pool.query(
          "INSERT INTO land_migrations(name,checksum) VALUES($1,$2)",
          [migration, createHash("sha256").update(sql).digest("hex")],
        );
        await pool.query("COMMIT");
      } catch (error) {
        await pool.query("ROLLBACK");
        throw error;
      }
    }
    const sourceId = (
      await pool.query<{ id: string }>(
        "INSERT INTO sources(name,category,status,public_display) VALUES('Existing Source','PLACES','ACTIVE','UNKNOWN') RETURNING id",
      )
    ).rows[0]!.id;

    await migrate(pool);
    expect(
      (
        await pool.query(
          "SELECT source_acceptance,provider_rights_status FROM sources WHERE id=$1",
          [sourceId],
        )
      ).rows[0],
    ).toEqual({
      source_acceptance: null,
      provider_rights_status: "UNKNOWN",
    });
    await migrate(pool);
    expect(
      (await pool.query("SELECT count(*)::int AS count FROM land_migrations"))
        .rows[0].count,
    ).toBe(15);
  }, 30000);
});
