import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { databaseOptions } from "../packages/config/src/database.ts";
type PgPool = InstanceType<typeof pg.Pool>;
export async function migrate(pool: PgPool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("SELECT pg_advisory_lock(73571000)");
    const identity = await client.query(
      "SELECT to_regclass('public.product_identity') AS identity",
    );
    if (identity.rows[0]?.identity) {
      if (
        (
          await client.query(
            "SELECT product FROM product_identity WHERE id=true",
          )
        ).rows[0]?.product !== "TAXUA_LAND"
      )
        throw new Error("Not a LAND database");
    } else {
      // Permit empty databases with provider-installed extensions, not unrelated products.
      const existing = await client.query(`SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m')
        AND NOT EXISTS (SELECT 1 FROM pg_depend d
          WHERE d.classid='pg_class'::regclass AND d.objid=c.oid AND d.deptype='e') LIMIT 1`);
      if (existing.rowCount)
        throw new Error("Migration requires an empty dedicated LAND database");
    }
    await client.query(
      "CREATE TABLE IF NOT EXISTS land_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())",
    );
    const directory = fileURLToPath(new URL("./migrations/", import.meta.url));
    for (const name of (await readdir(directory))
      .filter((n) => n.endsWith(".sql"))
      .sort()) {
      const sql = await readFile(`${directory}/${name}`, "utf8");
      const checksum = createHash("sha256").update(sql).digest("hex");
      const applied = await client.query<{ checksum: string }>(
        "SELECT checksum FROM land_migrations WHERE name=$1",
        [name],
      );
      if (applied.rows[0]) {
        if (applied.rows[0].checksum !== checksum)
          throw new Error(`Migration checksum changed: ${name}`);
        continue;
      }
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(
          "INSERT INTO land_migrations(name,checksum) VALUES($1,$2)",
          [name, checksum],
        );
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    await client.query("SELECT pg_advisory_unlock(73571000)");
    client.release();
  }
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL required");
  const pool = new pg.Pool(databaseOptions(process.env, true));
  try {
    await migrate(pool);
    console.log("LAND migrations applied");
  } catch {
    throw new Error(
      "LAND migration failed; inspect operator database and migration checksums (values suppressed)",
    );
  } finally {
    await pool.end();
  }
}
