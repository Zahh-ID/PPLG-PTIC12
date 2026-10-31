import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';
import {VERSION,evaluate} from '../shared/world.js';

const empty=()=>({version:VERSION,revision:0,devices:[],players:{}});
export function validateState(state) {
  if(state.version!==VERSION||!Number.isSafeInteger(state.revision)||state.revision<0||!Array.isArray(state.devices)||!state.players||typeof state.players!=='object')throw new Error('Unsupported save format');
  evaluate(state.devices);return state;
}
export async function migrate(client) {
  await client.query('BEGIN');
  try {
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended('logicworld:migrations',0))");
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
    const result=await client.query('SELECT version FROM schema_migrations ORDER BY version');
    if(result.rows.some(r=>r.version>1))throw new Error('Database schema is newer than this server');
    if(!result.rows.some(r=>r.version===1)){
      await client.query(await readFile(new URL('./migrations/001_initial.sql',import.meta.url),'utf8'));
      await client.query('INSERT INTO schema_migrations(version) VALUES (1)');
    }
    await client.query('COMMIT');
  } catch(e){await client.query('ROLLBACK');throw e;}
}
export async function createJsonStore(dataDir) {
  const file=path.resolve(dataDir,'world.json');await mkdir(path.dirname(file),{recursive:true});
  return {kind:'json',async load(){try{return validateState(JSON.parse(await readFile(file,'utf8')));}catch(e){if(e.code!=='ENOENT')throw e;return empty();}},async save(next){const temp=file+'.tmp';await writeFile(temp,JSON.stringify(next,null,2));await rename(temp,file);},async close(){}};
}
export async function createPostgresStore(databaseUrl,worldId='workshop') {
  const client=new pg.Client({connectionString:databaseUrl,connectionTimeoutMillis:5000,application_name:'logicworld'});
  // pg emits asynchronous errors on connection loss. Keep them contained so the
  // next command fails rather than taking down the server or falling back to JSON.
  client.on('error',()=>{});
  try {
    await client.connect();await migrate(client);
    const lock=await client.query("SELECT pg_try_advisory_lock(hashtextextended($1,0)) AS acquired",[`logicworld:world:${worldId}`]);
    if(!lock.rows[0].acquired)throw new Error('This PostgreSQL world already has an active server');
  } catch(e){await client.end().catch(()=>{});throw e;}
  return {kind:'postgres',
    async load(){
      const result=await client.query('SELECT schema_version,revision FROM worlds WHERE id=$1',[worldId]);
      if(!result.rowCount)return null;
      const devices=await client.query('SELECT id,kind,x,y,is_on AS on FROM devices WHERE world_id=$1 ORDER BY sort_index',[worldId]);
      const players=await client.query('SELECT id,reconnect_token AS token,inventory,quest_progress AS "questProgress" FROM players WHERE world_id=$1 ORDER BY id',[worldId]);
      return validateState({version:result.rows[0].schema_version,revision:Number(result.rows[0].revision),devices:devices.rows,players:Object.fromEntries(players.rows.map(p=>[p.id,p]))});
    },
    async save(next){
      validateState(next);await client.query('BEGIN');
      try {
        await client.query('INSERT INTO worlds(id,schema_version,revision) VALUES($1,$2,$3) ON CONFLICT(id) DO UPDATE SET schema_version=$2,revision=$3,updated_at=now()',[worldId,next.version,next.revision]);
        await client.query('DELETE FROM devices WHERE world_id=$1',[worldId]);
        await client.query(`INSERT INTO devices(world_id,id,kind,x,y,is_on,sort_index)
          SELECT $1,id,kind,x,y,"on","sortIndex" FROM jsonb_to_recordset($2::jsonb) AS d(id uuid,kind text,x int,y int,"on" boolean,"sortIndex" int)`,[worldId,JSON.stringify(next.devices.map((d,sortIndex)=>({...d,sortIndex})))]);
        await client.query(`INSERT INTO players(world_id,id,reconnect_token,inventory,quest_progress)
          SELECT $1,id,token,inventory,COALESCE("questProgress",'{}'::jsonb) FROM jsonb_to_recordset($2::jsonb) AS p(id uuid,token text,inventory jsonb,"questProgress" jsonb)
          ON CONFLICT(world_id,id) DO UPDATE SET reconnect_token=excluded.reconnect_token,inventory=excluded.inventory,quest_progress=excluded.quest_progress`,[worldId,JSON.stringify(Object.values(next.players))]);
        await client.query('COMMIT');
      }catch(e){await client.query('ROLLBACK').catch(()=>{});throw e;}
    },
    async close(){await client.end();}
  };
}
export async function openStore({databaseUrl,dataDir,worldId}) {
  if(!databaseUrl){const store=await createJsonStore(dataDir);return {store,state:await store.load()};}
  const store=await createPostgresStore(databaseUrl,worldId);
  try {
    let state=await store.load();
    if(!state){
      // Import a legacy save only into a world which does not exist yet.
      // Leave the original JSON untouched and never overwrite database state.
      try{state=validateState(JSON.parse(await readFile(path.resolve(dataDir,'world.json'),'utf8')));}catch(e){if(e.code!=='ENOENT')throw e;state=empty();}
      await store.save(state);
    }
    return {store,state};
  }catch(e){await store.close();throw e;}
}
