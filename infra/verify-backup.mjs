import { randomUUID } from "node:crypto";
import { mkdir, chmod, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import pg from "pg";
// A local rehearsal only. Never restore over an existing database.
const source = new URL(process.env.DATABASE_URL ?? "");
if (!["127.0.0.1", "localhost", "[::1]"].includes(source.hostname))
  throw Error("Backup rehearsal requires a local dedicated LAND database");
const name = `land_restore_${randomUUID().replaceAll("-", "")}`;
const directory = resolve("work/backups");
await mkdir(directory, { recursive: true, mode: 0o700 });
const dump = resolve(directory, `${name}.dump`);
const owner = new pg.Client({ connectionString: source.toString() });
let restored,
  created = false;
const countsSql =
  "SELECT (SELECT count(*)::int FROM places) AS places,(SELECT count(*)::int FROM place_geometries) AS geometries,(SELECT count(*)::int FROM import_rows) AS import_rows,(SELECT count(*)::int FROM audit_events) AS audit_events";
function run(tool, args, database) {
  const executable = process.argv[2]
    ? resolve(
        process.argv[2],
        tool + (process.platform === "win32" ? ".exe" : ""),
      )
    : tool;
  const result = spawnSync(executable, args, {
    windowsHide: true,
    encoding: "utf8",
    timeout: 120000,
    env: {
      ...process.env,
      PGHOST: source.hostname,
      PGPORT: source.port || "5432",
      PGUSER: decodeURIComponent(source.username),
      PGPASSWORD: decodeURIComponent(source.password),
      PGDATABASE: database,
    },
  });
  if (result.status !== 0)
    throw Error(`${tool} failed; private tool output suppressed`);
}
try {
  await owner.connect();
  if (
    (await owner.query("SELECT product FROM product_identity WHERE id=true"))
      .rows[0]?.product !== "TAXUA_LAND"
  )
    throw Error("LAND database required");
  const original = (await owner.query(countsSql)).rows[0];
  run(
    "pg_dump",
    ["--format=custom", "--no-owner", "--no-privileges", "--file", dump],
    source.pathname.slice(1),
  );
  await chmod(dump, 0o600);
  await owner.query(`CREATE DATABASE "${name}"`);
  created = true;
  run(
    "pg_restore",
    [
      "--exit-on-error",
      "--no-owner",
      "--no-privileges",
      "--dbname",
      name,
      dump,
    ],
    name,
  );
  const target = new URL(source);
  target.pathname = `/${name}`;
  restored = new pg.Client({ connectionString: target.toString() });
  await restored.connect();
  const copied = (await restored.query(countsSql)).rows[0];
  const integrity = (
    await restored.query(
      "SELECT (SELECT product FROM product_identity WHERE id=true) AS product,(SELECT count(*)::int FROM place_geometries WHERE ST_SRID(geometry)<>4326 OR NOT ST_IsValid(geometry)) AS invalid_geometries,(SELECT count(*)::int FROM land_migrations) AS migrations",
    )
  ).rows[0];
  if (
    JSON.stringify(original) !== JSON.stringify(copied) ||
    integrity.product !== "TAXUA_LAND" ||
    integrity.invalid_geometries !== 0
  )
    throw Error("Restore verification failed");
  await writeFile(
    "work/backup-rehearsal.json",
    JSON.stringify(
      {
        measuredAt: new Date().toISOString(),
        status: "PASS",
        counts: copied,
        ...integrity,
        scope:
          "Local isolated restore; private backup retained; permissions reprovisioning remains separate",
      },
      null,
      2,
    ),
  );
  console.info(
    "LAND backup restored to an isolated database; counts, product identity and spatial integrity verified.",
  );
} finally {
  await restored?.end();
  if (created) await owner.query(`DROP DATABASE "${name}"`);
  await owner.end();
}
