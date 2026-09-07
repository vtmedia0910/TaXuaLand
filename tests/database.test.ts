import { randomUUID } from 'node:crypto';
import pg from 'pg';
type PgClient = InstanceType<typeof pg.Client>;
type PgPool = InstanceType<typeof pg.Pool>;
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { migrate } from '../infra/migrate';
const connection = process.env.DATABASE_TEST_URL;
describe.skipIf(!connection)('real PostgreSQL/PostGIS integration', () => {
  let owner: PgClient;
  let pool: PgPool;
  const name = `land_test_${randomUUID().replaceAll('-', '')}`;
  beforeAll(async () => {
    owner = new pg.Client({ connectionString: connection! }); await owner.connect();
    await owner.query(`CREATE DATABASE "${name}"`);
    const url = new URL(connection!); url.pathname = `/${name}`;
    pool = new pg.Pool({connectionString:url.toString()});
    await migrate(pool);
  }, 30000);
  afterAll(async () => { await pool?.end(); if (owner) { await owner.query(`DROP DATABASE IF EXISTS "${name}"`); await owner.end(); } });
  it('replays migrations idempotently on a fresh database', async () => {
    await migrate(pool); const result = await pool.query('SELECT count(*)::int AS n FROM land_migrations'); expect(result.rows[0].n).toBe(2);
  });
  it('stores and queries EPSG:4326 points and geodesic meters', async () => {
    const result = await pool.query("SELECT ST_SRID(p) AS srid, ST_X(p) AS longitude, ST_Y(p) AS latitude, ST_Distance(p::geography,ST_SetSRID(ST_MakePoint(104.531,21.262),4326)::geography) AS meters FROM (SELECT ST_SetSRID(ST_MakePoint(104.53,21.262),4326) p) q");
    expect(result.rows[0]).toMatchObject({srid:4326,longitude:104.53,latitude:21.262}); expect(result.rows[0].meters).toBeGreaterThan(100); expect(result.rows[0].meters).toBeLessThan(110);
  });
  it('preserves historical geometry and rejects destructive updates', async () => {
    const user=(await pool.query("INSERT INTO admin_users(email,password_hash) VALUES('test@example.invalid','test-only-unusable') RETURNING id")).rows[0].id;
    const source=(await pool.query("INSERT INTO sources(name,category) VALUES('test fixture','PLACES') RETURNING id")).rows[0].id;
    const record=(await pool.query("INSERT INTO source_records(source_id,raw_payload_hash) VALUES($1,$2) RETURNING id",[source,'0'.repeat(64)])).rows[0].id;
    const place=(await pool.query("INSERT INTO places(name,slug,created_by,updated_by) VALUES('Test','test',$1,$1) RETURNING id",[user])).rows[0].id;
    const sql="INSERT INTO place_geometries(place_id,geometry,source_record_id,source_crs) VALUES($1,ST_SetSRID(ST_MakePoint($3,21.26),4326),$2,'EPSG:4326') RETURNING id";
    const geometry=(await pool.query(sql,[place,record,104.53])).rows[0].id;
    await expect(pool.query('UPDATE place_geometries SET geometry=ST_SetSRID(ST_MakePoint(104.6,21.3),4326) WHERE id=$1',[geometry])).rejects.toThrow('validity interval');
    await expect(pool.query('DELETE FROM place_geometries WHERE id=$1',[geometry])).rejects.toThrow('cannot be deleted');
    await pool.query('UPDATE place_geometries SET valid_to=now() WHERE id=$1',[geometry]);
    await pool.query(sql,[place,record,104.54]);
    expect((await pool.query('SELECT count(*)::int AS n FROM place_geometries WHERE place_id=$1',[place])).rows[0].n).toBe(2);
    await expect(pool.query(sql,[place,record,104.55])).rejects.toThrow('one_current_geometry');
    await expect(pool.query(sql,[randomUUID(),record,184])).rejects.toThrow();
  });
  it('has spatial indexes and no public table grants', async () => {
    const indexes=await pool.query("SELECT indexdef FROM pg_indexes WHERE tablename IN ('place_geometries','road_segments','areas_of_interest') AND indexdef LIKE '%USING gist%'");
    expect(indexes.rowCount).toBe(3);
    const grants=await pool.query("SELECT * FROM information_schema.table_privileges WHERE grantee='PUBLIC' AND table_name='places'"); expect(grants.rowCount).toBe(0);
  });
});



