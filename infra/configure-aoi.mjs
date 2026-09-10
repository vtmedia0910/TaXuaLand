import pg from 'pg';
import { databaseOptions } from '../packages/config/src/database.ts';
const pool = new pg.Pool(databaseOptions(process.env, true));
try {
 const identity=(await pool.query('SELECT product FROM product_identity WHERE id=true')).rows[0];
 if(identity?.product!=='TAXUA_LAND')throw new Error('LAND database required');
 // Product coverage configuration, never an official administrative or cadastral boundary.
 await pool.query("INSERT INTO areas_of_interest(name,version,source,boundary,outside_policy,active) SELECT 'Tà Xùa operational demo coverage','TX-AOI-DEMO-001','LAND Phase 0 operational rectangle; not an official boundary',ST_MakeEnvelope(104.45,21.20,104.62,21.35,4326),'WARNING',true WHERE NOT EXISTS(SELECT 1 FROM areas_of_interest WHERE active) ON CONFLICT(version) DO NOTHING");
 console.log('Operational AOI configured if no active AOI existed.');
}finally{await pool.end();}
