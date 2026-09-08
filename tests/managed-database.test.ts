import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { databaseOptions } from "../packages/config/src/database";
import { assertRuntimeDatabase } from "../services/api/src/database-readiness";
import { migrate } from "../infra/migrate";

const remote = {
  DATABASE_URL: "postgresql://land_app:synthetic@db.example.invalid/land",
  LAND_ENVIRONMENT: "STAGING",
};
it("uses verified TLS and small bounded pools; operator needs session affinity", () => {
  expect(databaseOptions(remote)).toMatchObject({
    ssl: { rejectUnauthorized: true },
    max: 2,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
  });
  expect(
    databaseOptions({ ...remote, DATABASE_CA_CERT: "test-ca" }).ssl,
  ).toEqual({ rejectUnauthorized: true, ca: "test-ca" });
  expect(databaseOptions(remote, true)).toMatchObject({
    max: 1,
    statement_timeout: 0,
  });
  expect(() =>
    databaseOptions({ ...remote, DATABASE_ENDPOINT_MODE: "transaction" }, true),
  ).toThrow("policy");
  for (const query of [
    "sslmode=disable",
    "sslmode=require",
    "sslcert=x",
    "host=localhost",
    "options=x",
  ])
    expect(() =>
      databaseOptions({
        ...remote,
        DATABASE_URL: `${remote.DATABASE_URL}?${query}`,
      }),
    ).toThrow("policy");
  for (const max of ["0", "11", "NaN"])
    expect(() =>
      databaseOptions({ ...remote, DATABASE_POOL_MAX: max }),
    ).toThrow("configuration");
  expect(() =>
    databaseOptions({ ...remote, LAND_ENVIRONMENT: "PREVIEW" }),
  ).toThrow("disabled");
  expect(() =>
    databaseOptions({
      ...remote,
      DATABASE_URL: "postgresql://land_app@127.0.0.1/land",
    }),
  ).toThrow("policy");
  expect(
    databaseOptions({ DATABASE_URL: "postgresql://land_app@127.0.0.1/land" })
      .ssl,
  ).toBe(false);
});

const connection = process.env.DATABASE_TEST_URL;
describe.skipIf(!connection)(
  "managed database safeguards on isolated PostGIS",
  () => {
    const name = `land_test_${randomUUID().replaceAll("-", "")}`;
    const role = `${name}_app`;
    const password = randomBytes(32).toString("hex");
    let owner: InstanceType<typeof pg.Client>;
    let pool: InstanceType<typeof pg.Pool>;
    let runtime: InstanceType<typeof pg.Pool>;
    beforeAll(async () => {
      owner = new pg.Client({ connectionString: connection });
      await owner.connect();
      await owner.query(`CREATE DATABASE "${name}"`);
      const url = new URL(connection!);
      url.pathname = `/${name}`;
      pool = new pg.Pool({ connectionString: url.toString() });
      await pool.query("CREATE TABLE unrelated_product(id integer)");
      await expect(migrate(pool)).rejects.toThrow("dedicated LAND");
      expect(
        (await pool.query("SELECT to_regclass('land_migrations') AS t")).rows[0]
          .t,
      ).toBeNull();
      await pool.query("DROP TABLE unrelated_product");
      await migrate(pool);
      await owner.query(
        `CREATE ROLE "${role}" LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT PASSWORD ${pg.escapeLiteral(password)}`,
      );
      await pool.query(`GRANT USAGE ON SCHEMA public TO "${role}"`);
      await pool.query(
        `GRANT SELECT ON ALL TABLES IN SCHEMA public TO "${role}"`,
      );
      await pool.query(
        `GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO "${role}"`,
      );
      url.username = role;
      url.password = password;
      runtime = new pg.Pool(databaseOptions({ DATABASE_URL: url.toString() }));
    }, 30000);
    afterAll(async () => {
      try {
        await Promise.all([runtime?.end(), pool?.end()]);
        if (owner) {
          await owner.query(`DROP DATABASE IF EXISTS "${name}"`);
          await owner.query(`DROP ROLE IF EXISTS "${role}"`);
        }
      } finally {
        await owner?.end();
      }
    });
    it("accepts read-only runtime, rejects owner and publication receipt write authority", async () => {
      await expect(assertRuntimeDatabase(runtime)).resolves.toBeUndefined();
      await expect(assertRuntimeDatabase(pool)).rejects.toThrow("readiness");
      await pool.query(
        `GRANT INSERT ON spatial_object_deliveries TO "${role}"`,
      );
      await expect(assertRuntimeDatabase(runtime)).rejects.toThrow("readiness");
      await pool.query(
        `REVOKE INSERT ON spatial_object_deliveries FROM "${role}"`,
      );
      await expect(assertRuntimeDatabase(runtime)).resolves.toBeUndefined();
    });
    it("queues a concurrent burst through a two-connection pool without losing transaction locks", async () => {
      const ids = await Promise.all(
        Array.from({ length: 8 }, async () => {
          const client = await runtime.connect();
          try {
            await client.query("BEGIN");
            await client.query("SELECT pg_advisory_xact_lock(73571999)");
            const row = (
              await client.query(
                "SELECT pg_backend_pid() AS pid, ST_SRID(ST_MakePoint(104,21)::geography::geometry) AS srid",
              )
            ).rows[0];
            expect(row.srid).toBe(4326);
            return row.pid;
          } finally {
            // Never return a failed test's open transaction/advisory lock to the pool.
            await client.query("ROLLBACK").finally(() => client.release());
          }
        }),
      );
      expect(new Set(ids).size).toBeLessThanOrEqual(2);
      expect(runtime.waitingCount).toBe(0);
    });
  },
);
