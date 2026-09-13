import pg from 'pg';
import { databaseOptions } from '../packages/config/src/database.ts';
const pool = new pg.Pool(databaseOptions(process.env, true));
try {
 const identity=(await pool.query('SELECT product FROM product_identity WHERE id=true')).rows[0];
 if(identity?.product!=='TAXUA_LAND')throw new Error('LAND database required');
 // Owner-approved product coverage, never an official administrative or cadastral boundary.
 await pool.query("INSERT INTO areas_of_interest(id,name,version,source,boundary,outside_policy,active) SELECT '1a169926-5c2c-48a7-a880-8e62b2b1d33d','Tà Xùa Phase 1 operational product coverage','TX-AOI-2026-001','Owner-approved Phase 1 operational product coverage; not a legal or administrative boundary',ST_SetSRID(ST_GeomFromGeoJSON('{\"type\":\"Polygon\",\"coordinates\":[[[104.45,21.2],[104.45,21.35],[104.62,21.35],[104.62,21.2],[104.45,21.2]]]}'),4326),'WARNING',true WHERE NOT EXISTS(SELECT 1 FROM areas_of_interest WHERE active) ON CONFLICT(version) DO NOTHING");
 console.log('Operational AOI configured if no active AOI existed.');
}finally{await pool.end();}
