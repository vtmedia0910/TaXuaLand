import { existsSync } from "node:fs";
import { access, mkdir } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import pg from "pg";
import { RuntimeEnvironment } from "../packages/config/src/runtime.ts";
import { deploymentConfig } from "../packages/config/src/deployment.ts";
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
process.env.LAND_WORKSPACE_ROOT ||= resolve(import.meta.dirname, "..");
process.env.NODE_ENV = "production";
const config = RuntimeEnvironment.safeParse(process.env);
if (!config.success)
  throw Error(
    "LAND runtime configuration invalid: DATABASE_URL, HTTPS/loopback SERVER_ORIGIN and LAND_WORKSPACE_ROOT are required (values suppressed)",
  );
let pool;
try {
  await access(
    resolve(
      config.data.LAND_WORKSPACE_ROOT,
      "workers/import/src/parse-workbook.ts",
    ),
    constants.R_OK,
  );
  const deployment = deploymentConfig(process.env);
  if (deployment.OBJECT_STORE_DRIVER === "local") {
    const imports = resolve(
      config.data.LAND_WORKSPACE_ROOT,
      "work/object-store/private",
    );
    await mkdir(imports, { recursive: true, mode: 0o700 });
    await access(imports, constants.W_OK);
  }
  pool = new pg.Pool({
    connectionString: config.data.DATABASE_URL,
    connectionTimeoutMillis: 5000,
    statement_timeout: 5000,
    max: 1,
  });
  const product = (
    await pool.query("SELECT product FROM product_identity WHERE id=true")
  ).rows[0]?.product;
  const role = (
    await pool.query(
      "SELECT rolsuper,rolcreatedb,rolcreaterole FROM pg_roles WHERE rolname=current_user",
    )
  ).rows[0];
  const privileges = (
    await pool.query(
      "SELECT has_table_privilege(current_user,'admin_users','UPDATE') AS credentials,has_table_privilege(current_user,'audit_events','DELETE') AS audit",
    )
  ).rows[0];
  if (
    product !== "TAXUA_LAND" ||
    !role ||
    role.rolsuper ||
    role.rolcreatedb ||
    role.rolcreaterole ||
    privileges.credentials ||
    privileges.audit
  )
    throw Error("Unsafe role");
} catch {
  throw Error(
    "LAND startup validation failed: check dedicated database identity, least-privileged runtime role, parser and storage configuration (values suppressed)",
  );
} finally {
  await pool?.end();
}
console.info(
  "LAND runtime configuration, product isolation, parser and storage validated.",
);
const server = spawn(
  process.execPath,
  [
    resolve(import.meta.dirname, "../apps/web/node_modules/next/dist/bin/next"),
    "start",
    ...process.argv.slice(2),
  ],
  { stdio: "inherit", windowsHide: true, env: process.env },
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => server.kill(signal));
server.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
server.on("error", () => {
  console.error("LAND server could not start");
  process.exitCode = 1;
});
