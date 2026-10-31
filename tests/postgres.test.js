import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';
import pg from 'pg';import {WebSocket} from 'ws';
import {createPostgresStore,openStore} from '../server/storage.js';
import {createServer} from '../server/index.js';
import {STOCK} from '../shared/world.js';
const databaseUrl=process.env.DATABASE_URL;
async function removeWorld(worldId){const c=new pg.Client({connectionString:databaseUrl});try{await c.connect();await c.query('DELETE FROM worlds WHERE id=$1',[worldId]);}finally{await c.end();}}
function client(port) {
  const ws=new WebSocket(`ws://127.0.0.1:${port}`),messages=[],listeners=[];
  ws.on('message',raw=>{const m=JSON.parse(raw);messages.push(m);for(const l of [...listeners])if(l.match(m)){clearTimeout(l.timer);listeners.splice(listeners.indexOf(l),1);l.resolve(m);}});
  return {ws,send:m=>ws.send(JSON.stringify({v:1,...m})),wait(match){const old=messages.find(match);if(old)return Promise.resolve(old);return new Promise((resolve,reject)=>{const l={match,resolve};l.timer=setTimeout(()=>reject(new Error('Server message timeout')),5000);listeners.push(l);});},async join(token){if(ws.readyState!==WebSocket.OPEN)await new Promise(r=>ws.on('open',r));this.send({type:'join',token});return this.wait(m=>m.type==='welcome');}};
}
test('PostgreSQL: legacy import, migrations, single writer, rollback, and stored progress', {skip:!databaseUrl}, async()=>{
  const worldId='test-storage-'+randomUUID(),dataDir=await mkdtemp(path.join(os.tmpdir(),'logicworld-pg-'));
  const player={id:randomUUID(),token:randomUUID(),inventory:{...STOCK},questProgress:{tutorial:{step:2}}};
  const initial={version:1,revision:3,devices:[{id:randomUUID(),kind:'switch',x:22,y:21,on:true}],players:{[player.id]:player}};
  await writeFile(path.join(dataDir,'world.json'),JSON.stringify(initial));let store;
  try {
    ({store}=await openStore({databaseUrl,dataDir,worldId}));assert.deepEqual(await store.load(),initial);
    await assert.rejects(()=>createPostgresStore(databaseUrl,worldId),/active server/);
    const broken=structuredClone(initial);broken.revision++;broken.devices[0].kind='invalid';
    await assert.rejects(()=>store.save(broken),/check constraint/);assert.deepEqual(await store.load(),initial,'failed save rolls back every row');
    await store.close();store=null;
    await writeFile(path.join(dataDir,'world.json'),JSON.stringify({...initial,revision:999}));
    ({store}=await openStore({databaseUrl,dataDir,worldId}));assert.deepEqual(await store.load(),initial,'database is not replaced by old JSON');
  }finally{await store?.close();await removeWorld(worldId);await rm(dataDir,{recursive:true,force:true});}
});
test('PostgreSQL: two players, shared AND state, server restart and inventory recovery', {skip:!databaseUrl}, async()=>{
  const worldId='test-server-'+randomUUID(),dataDir=await mkdtemp(path.join(os.tmpdir(),'logicworld-pg-server-'));
  const options={databaseUrl,worldId,dataDir,port:0};let app=await createServer(options),a,b,c;
  try {
    a=client(app.port);b=client(app.port);const who=await a.join();await b.join();
    a.send({type:'example'});const built=await a.wait(m=>m.type==='world'&&m.revision===1);
    const switches=built.devices.filter(d=>d.kind==='switch'),door=built.devices.find(d=>d.kind==='door');
    a.send({type:'toggle',id:switches[0].id});await b.wait(m=>m.type==='world'&&m.revision===2);
    b.send({type:'toggle',id:switches[1].id});
    const left=await a.wait(m=>m.type==='world'&&m.revision===3),right=await b.wait(m=>m.type==='world'&&m.revision===3);
    assert.deepEqual(left,right);assert.equal(left.signals[door.id],true);
    await app.close();app=null;app=await createServer(options);c=client(app.port);
    const restored=await c.join(who.token);assert.equal(restored.id,who.id);assert.equal(restored.inventory.switch,6);
    assert.deepEqual(await c.wait(m=>m.type==='world'&&m.revision===3),left);
    const health=await(await fetch(`http://127.0.0.1:${app.port}/health`)).json();assert.equal(health.storage,'postgres');
  }finally{a?.ws.terminate();b?.ws.terminate();c?.ws.terminate();await app?.close();await removeWorld(worldId);await rm(dataDir,{recursive:true,force:true});}
});
