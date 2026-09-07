import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
type PgPool = InstanceType<typeof pg.Pool>;
export async function migrate(pool: PgPool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("SELECT pg_advisory_lock(73571000)");
    await client.query('CREATE TABLE IF NOT EXISTS land_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
    const directory = fileURLToPath(new URL('./migrations/', import.meta.url));
    for (const name of (await readdir(directory)).filter(n => n.endsWith('.sql')).sort()) {
      const sql = await readFile(`${directory}/${name}`, 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const applied = await client.query<{checksum:string}>('SELECT checksum FROM land_migrations WHERE name=$1',[name]);
      if (applied.rows[0]) { if (applied.rows[0].checksum !== checksum) throw new Error(`Migration checksum changed: ${name}`); continue; }
      await client.query('BEGIN');
      try { await client.query(sql); await client.query('INSERT INTO land_migrations(name,checksum) VALUES($1,$2)',[name,checksum]); await client.query('COMMIT'); }
      catch (error) { await client.query('ROLLBACK'); throw error; }
    }
  } finally { await client.query('SELECT pg_advisory_unlock(73571000)'); client.release(); }
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL required');
  const pool = new pg.Pool({connectionString:process.env.DATABASE_URL});
  try { await migrate(pool); console.log('LAND migrations applied'); } finally { await pool.end(); }
}


