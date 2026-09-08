import { randomBytes, randomUUID } from "node:crypto";
import { existsSync, createWriteStream } from "node:fs";
import { mkdir, open, readFile, unlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import pg from "pg";
import { migrate } from "../../infra/migrate.ts";
import { hashPassword } from "../../services/api/src/auth.ts";

// This harness never migrates an existing application database. Only loopback
// PostgreSQL's maintenance database can create a new, uniquely named QA DB.
const root = resolve(import.meta.dirname, "../..");
process.chdir(root);
if (!process.env.DATABASE_TEST_URL && existsSync(".env.local"))
  process.loadEnvFile(".env.local");
const connection = new URL(process.env.DATABASE_TEST_URL ?? "invalid:");
if (
  !["postgres:", "postgresql:"].includes(connection.protocol) ||
  !["localhost", "127.0.0.1", "[::1]"].includes(connection.hostname) ||
  connection.pathname !== "/postgres" ||
  connection.search ||
  connection.hash
)
  throw Error(
    "Core E2E requires a loopback PostgreSQL maintenance DATABASE_TEST_URL (values suppressed)",
  );
await readFile("apps/web/.next/BUILD_ID");
await mkdir("work", { recursive: true });
const lockPath = resolve("work/e2e-core.lock");
const lock = await open(lockPath, "wx", 0o600);
const id = randomUUID().replaceAll("-", "");
const dbName = `land_e2e_${id}`;
const roleName = `land_e2e_app_${id}`;
const privateDir = resolve("work", `e2e-core-${id}`);
await mkdir(privateDir, { recursive: true, mode: 0o700 });
const credentialsFile = resolve(privateDir, "credentials.json");
const owner = new pg.Client({
  connectionString: connection.toString(),
  connectionTimeoutMillis: 5000,
});
let pool: InstanceType<typeof pg.Pool> | undefined;
let server: ChildProcess | undefined;
let browser: ChildProcess | undefined;
let serverPort: number | undefined;
let createdDb = false,
  createdRole = false;
const log = createWriteStream(resolve(privateDir, "server.log"), {
  mode: 0o600,
});
let phase = "database setup";

function stop(child: ChildProcess | undefined) {
  if (!child?.pid || child.exitCode !== null) return;
  if (process.platform === "win32") {
    const result = spawnSync(
      "taskkill",
      ["/PID", String(child.pid), "/T", "/F"],
      {
        windowsHide: true,
        stdio: "ignore",
      },
    );
    if (result.status !== 0) {
      // Restricted Windows sessions can deny taskkill's process enumeration.
      // Resolve only our already-started QA listener, never a user port/process.
      if (child === server && serverPort) {
        const sockets = spawnSync("netstat", ["-ano", "-p", "tcp"], {
          encoding: "utf8",
          windowsHide: true,
        });
        if (sockets.status !== 0)
          throw Error("Cannot identify owned QA server for cleanup");
        for (const line of sockets.stdout.split(/\r?\n/)) {
          const columns = line.trim().split(/\s+/);
          if (
            columns[0] === "TCP" &&
            columns[1] === `127.0.0.1:${serverPort}` &&
            columns[3] === "LISTENING"
          ) {
            const pid = Number(columns[4]);
            if (!Number.isSafeInteger(pid) || pid <= 0)
              throw Error("Invalid QA listener PID");
            process.kill(pid);
          }
        }
      }
      child.kill();
    }
  } else {
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ESRCH") throw error;
    }
  }
}
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.once(signal, () => {
    stop(browser);
    stop(server);
    process.exitCode = 1;
  });

try {
  await owner.connect();
  await owner.query(`CREATE DATABASE ${pg.escapeIdentifier(dbName)}`);
  createdDb = true;
  const ownerUrl = new URL(connection);
  ownerUrl.pathname = `/${dbName}`;
  pool = new pg.Pool({ connectionString: ownerUrl.toString(), max: 2 });
  await migrate(pool);
  const password = randomBytes(32).toString("hex");
  const runtimePassword = randomBytes(32).toString("hex");
  const email = "core-qa@example.invalid";
  await writeFile(credentialsFile, JSON.stringify({ email, password }), {
    mode: 0o600,
  });
  const user = (
    await pool.query<{ id: string }>(
      "INSERT INTO admin_users(email,password_hash) VALUES($1,$2) RETURNING id",
      [email, await hashPassword(password)],
    )
  ).rows[0]!.id;
  await pool.query(
    "INSERT INTO admin_user_roles(user_id,role_code) VALUES($1,'SYSTEM_ADMIN')",
    [user],
  );
  await pool.query(
    "INSERT INTO sources(name,category,status,public_display) VALUES('LAND development fixtures','OTHER','ACTIVE','ALLOWED')",
  );
  await pool.query(
    "INSERT INTO areas_of_interest(name,version,source,boundary,outside_policy,active) VALUES('Authored QA rectangle','CORE-QA-001','Synthetic test coverage; not a factual boundary',ST_MakeEnvelope(104.45,21.20,104.62,21.35,4326),'WARNING',true)",
  );

  // A unique role avoids altering land_app or any pre-existing credentials.
  const role = pg.escapeIdentifier(roleName);
  await owner.query(
    `CREATE ROLE ${role} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT PASSWORD ${pg.escapeLiteral(runtimePassword)}`,
  );
  createdRole = true;
  await pool.query(`GRANT USAGE ON SCHEMA public TO ${role}`);
  await pool.query(`GRANT SELECT ON ALL TABLES IN SCHEMA public TO ${role}`);
  await pool.query(
    `GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO ${role}`,
  );
  for (const [permissions, tables] of [
    ["INSERT,UPDATE,DELETE", "admin_sessions,login_attempts"],
    [
      "INSERT",
      "audit_events,source_records,import_row_actions,import_row_revisions,place_content_revisions",
    ],
    [
      "INSERT,UPDATE",
      "places,place_categories,import_batches,import_rows,sources,datasets,dataset_releases,dataset_assets,pipeline_runs,integration_providers,integration_health_checks",
    ],
    ["INSERT", "place_geometries"],
    ["UPDATE(valid_to)", "place_geometries"],
    [
      "INSERT,UPDATE,DELETE",
      "place_category_links,place_visit_contexts,place_access_contexts,place_safety_notes,place_media,external_references,import_row_errors",
    ],
  ])
    await pool.query(`GRANT ${permissions} ON ${tables} TO ${role}`);
  const runtimeUrl = new URL(ownerUrl);
  runtimeUrl.username = roleName;
  runtimeUrl.password = runtimePassword;
  const socket = createServer();
  await new Promise<void>((done, reject) => {
    socket.once("error", reject);
    socket.listen(0, "127.0.0.1", done);
  });
  const address = socket.address();
  if (!address || typeof address === "string")
    throw Error("Port allocation failed");
  const port = address.port;
  await new Promise<void>((done, reject) =>
    socket.close((error) => (error ? reject(error) : done())),
  );
  const origin = `http://127.0.0.1:${port}`;
  // Owner credentials, GitHub tokens and general user environment are not
  // inherited by the production server. Runtime startup keeps its real gates.
  const systemEnv = Object.fromEntries(
    Object.entries(process.env).filter(([key]) =>
      ["PATH", "SYSTEMROOT", "WINDIR", "TEMP", "TMP", "HOME"].includes(
        key.toUpperCase(),
      ),
    ),
  );
  phase = "production startup";
  server = spawn(
    process.execPath,
    [
      resolve("infra/start-web.mjs"),
      "--hostname",
      "127.0.0.1",
      "--port",
      String(port),
    ],
    {
      cwd: resolve("apps/web"),
      windowsHide: true,
      detached: process.platform !== "win32",
      env: {
        ...systemEnv,
        NODE_ENV: "production",
        NEXT_TELEMETRY_DISABLED: "1",
        DATABASE_URL: runtimeUrl.toString(),
        SERVER_ORIGIN: origin,
        LAND_WORKSPACE_ROOT: root,
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  server.stdout?.pipe(log, { end: false });
  server.stderr?.pipe(log, { end: false });
  server.once("error", () => {
    process.exitCode = 1;
  });
  const deadline = Date.now() + 60000;
  let ready = false;
  while (Date.now() < deadline && server.exitCode === null) {
    try {
      const response = await fetch(`${origin}/api/public/places`, {
        signal: AbortSignal.timeout(1500),
      });
      if (response.ok && (await response.json()).items.length === 0) {
        ready = true;
        break;
      }
    } catch {
      /* bounded startup polling */
    }
    await delay(250);
  }
  if (!ready) throw Error("Production server readiness failed");
  serverPort = port;
  console.log(
    "Core E2E: fresh LAND PostGIS, synthetic fixtures, least-privileged production server ready.",
  );
  phase = "Playwright";
  browser = spawn(
    process.execPath,
    [
      resolve("node_modules/@playwright/test/cli.js"),
      "test",
      "--config=playwright.core.config.ts",
      ...process.argv.slice(2),
    ],
    {
      cwd: root,
      windowsHide: true,
      detached: process.platform !== "win32",
      stdio: "inherit",
      env: {
        ...process.env,
        DATABASE_URL: ownerUrl.toString(),
        E2E_BASE_URL: origin,
        E2E_CREDENTIALS_FILE: credentialsFile,
        E2E_RUNTIME_ROLE: roleName,
        E2E_CORE: "1",
      },
    },
  );
  const exitCode = await new Promise<number>((done) => {
    browser!.once("exit", (code) => done(code ?? 1));
    browser!.once("error", () => done(1));
  });
  if (exitCode !== 0) process.exitCode = exitCode;
} catch {
  console.error(
    `Core E2E failed during ${phase}; private diagnostics remain in work, never uploaded.`,
  );
  process.exitCode = 1;
} finally {
  stop(browser);
  stop(server);
  log.end();
  try {
    if (pool) {
      const batches = await pool.query<{ id: string }>(
        "SELECT id FROM import_batches",
      );
      for (const { id: batchId } of batches.rows) {
        if (!/^[a-f0-9-]{36}$/.test(batchId)) {
          process.exitCode = 1;
          continue;
        }
        await unlink(resolve(root, "work/imports", `${batchId}.json`)).catch(
          (error: NodeJS.ErrnoException) => {
            if (error.code !== "ENOENT") throw error;
          },
        );
      }
      await pool.end();
    }
    if (createdDb)
      await owner.query(
        `DROP DATABASE ${pg.escapeIdentifier(dbName)} WITH (FORCE)`,
      );
    if (createdRole)
      await owner.query(`DROP ROLE ${pg.escapeIdentifier(roleName)}`);
    console.log(
      "Core E2E cleanup: disposable database, runtime role and owned import files removed.",
    );
  } catch {
    console.error(
      "Core E2E cleanup failed; inspect unique land_e2e_* resources before retry.",
    );
    process.exitCode = 1;
  }
  await owner.end();
  await unlink(credentialsFile).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") throw error;
  });
  await lock.close();
  await unlink(lockPath);
}
