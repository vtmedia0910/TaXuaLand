import pg from 'pg';
import type { PoolClient as PgPoolClient } from 'pg';
type PgPool = InstanceType<typeof pg.Pool>;
import { z } from 'zod';
const DatabaseConfig = z.object({ DATABASE_URL: z.string().url().refine(v => /^postgres(ql)?:/.test(v), 'PostgreSQL required') });
let pool: PgPool | undefined;
export function database(): PgPool {
  if (!pool) {
    const env = DatabaseConfig.parse(process.env);
    pool = new pg.Pool({ connectionString: env.DATABASE_URL, max: 10, connectionTimeoutMillis: 5000, idleTimeoutMillis: 30000, statement_timeout: 15000, application_name: 'taxua-land-api' });
    pool.on('error', () => { console.error(JSON.stringify({event:'database_pool_error',category:'DATABASE_UNAVAILABLE'})); });
  }
  return pool;
}
export async function transaction<T>(action: (client: PgPoolClient) => Promise<T>, connection = database()): Promise<T> {
  const client = await connection.connect();
  try { await client.query('BEGIN'); const result = await action(client); await client.query('COMMIT'); return result; }
  catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}


