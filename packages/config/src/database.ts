import type { PoolConfig } from "pg";
import { z } from "zod";
import { assertDatabaseEnabled } from "./deployment.ts";

const Config = z.object({
  DATABASE_URL: z.string().url(),
  DATABASE_ENDPOINT_MODE: z
    .enum(["direct", "session", "transaction"])
    .default("direct"),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(10).default(2),
  DATABASE_CA_CERT: z.string().min(1).optional(),
});

/** Explicit TLS configuration: URL SSL options can otherwise override pg's ssl object. */
export function databaseOptions(
  input: Record<string, string | undefined>,
  operator = false,
): PoolConfig {
  assertDatabaseEnabled(input);
  const parsed = Config.safeParse(input);
  if (!parsed.success)
    throw new Error("LAND database configuration invalid (values suppressed)");
  const env = parsed.data;
  const url = new URL(env.DATABASE_URL);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !url.hostname ||
    url.hash ||
    url.pathname.length < 2 ||
    [...url.searchParams.keys()].some(
      (key) => !["application_name"].includes(key),
    ) ||
    (operator && env.DATABASE_ENDPOINT_MODE === "transaction") ||
    (local && input.LAND_ENVIRONMENT && input.LAND_ENVIRONMENT !== "LOCAL")
  )
    throw new Error(
      "LAND database endpoint policy invalid (values suppressed)",
    );
  return {
    connectionString: env.DATABASE_URL,
    ssl: local
      ? false
      : {
          rejectUnauthorized: true,
          ...(env.DATABASE_CA_CERT ? { ca: env.DATABASE_CA_CERT } : {}),
        },
    max: operator ? 1 : env.DATABASE_POOL_MAX,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
    // Migration DDL is operator-controlled and may exceed the request budget.
    statement_timeout: operator ? 0 : 15000,
    application_name: operator ? "taxua-land-operator" : "taxua-land-api",
  };
}
