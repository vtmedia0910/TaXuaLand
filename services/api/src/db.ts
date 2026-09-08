import pg from "pg";
import type { PoolClient as PgPoolClient } from "pg";
type PgPool = InstanceType<typeof pg.Pool>;
import { databaseOptions } from "../../../packages/config/src/database.ts";
import { assertDatabaseEnabled } from "../../../packages/config/src/deployment.ts";
let pool: PgPool | undefined;
export function database(): PgPool {
  assertDatabaseEnabled(process.env);
  if (!pool) {
    pool = new pg.Pool(databaseOptions(process.env));
    pool.on("error", () => {
      console.error(
        JSON.stringify({
          event: "database_pool_error",
          category: "DATABASE_UNAVAILABLE",
        }),
      );
    });
  }
  return pool;
}
export async function transaction<T>(
  action: (client: PgPoolClient) => Promise<T>,
  connection = database(),
): Promise<T> {
  const client = await connection.connect();
  try {
    await client.query("BEGIN");
    const result = await action(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
