import pg from 'pg';
import {unlink,readdir,stat} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(process.env.LAND_WORKSPACE_ROOT??'.'),directory=resolve(root,'work/imports');
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL});
try{
 const identity=(await pool.query('SELECT product FROM product_identity WHERE id=true')).rows[0];if(identity?.product!=='TAXUA_LAND')throw Error('LAND database required');
 const expired=(await pool.query("SELECT id FROM import_batches WHERE expires_at<=now() AND storage_key IS NOT NULL")).rows;
 for(const row of expired){if(!/^[0-9a-f-]{36}$/.test(row.id))throw Error('Invalid import id');await unlink(resolve(directory,`${row.id}.json`)).catch(error=>{if(error.code!=='ENOENT')throw error;});await pool.query('UPDATE import_batches SET storage_key=NULL WHERE id=$1',[row.id]);}
 // Remove only orphan inspection files older than retention; preserve database/audit rows.
 let orphans=0;for(const name of await readdir(directory).catch(error=>{if(error.code==='ENOENT')return [];throw error;})){if(!/^[0-9a-f-]{36}\.json$/.test(name))continue;const path=resolve(directory,name);if(Date.now()-(await stat(path)).mtimeMs<7*86400000)continue;const exists=await pool.query('SELECT id FROM import_batches WHERE id=$1',[name.slice(0,-5)]);if(!exists.rowCount){await unlink(path);orphans++;}}
 console.log(JSON.stringify({expiredFiles:expired.length,orphanFiles:orphans}));
}finally{await pool.end();}
