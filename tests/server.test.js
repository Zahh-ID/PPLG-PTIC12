import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';
import {WebSocket} from 'ws';
import {createServer} from '../server/index.js';
function client(port) {
  const ws=new WebSocket(`ws://127.0.0.1:${port}`), messages=[], waiters=[];
  ws.on('message',raw=>{const m=JSON.parse(raw);messages.push(m);for(const w of [...waiters])if(w.match(m)){clearTimeout(w.timer);waiters.splice(waiters.indexOf(w),1);w.resolve(m);}});
  return {ws,send:m=>ws.send(JSON.stringify({v:1,...m})),wait(match){const existing=messages.find(match);if(existing)return Promise.resolve(existing);return new Promise((resolve,reject)=>{const w={match,resolve};w.timer=setTimeout(()=>reject(new Error('Timed out waiting for server message')),3000);waiters.push(w);});},async join(token){if(ws.readyState!==WebSocket.OPEN)await new Promise(r=>ws.on('open',r));this.send({type:'join',token});return this.wait(m=>m.type==='welcome');}};
}
test('two clients share all AND states, reject invalid edits, and reload saved world + inventory',async()=>{
  const dataDir=await mkdtemp(path.join(os.tmpdir(),'logicworld-test-'));let app=await createServer({port:0,dataDir});
  const a=client(app.port),b=client(app.port);let c;
  try {
    const who=await a.join();await b.join();
    await a.wait(m=>m.type==='presence'&&m.players.length===2);
    a.send({type:'place',kind:'door',x:38,y:28});assert.match((await a.wait(m=>m.type==='error')).message,/workshop/);
    a.send({type:'example'});const built=await a.wait(m=>m.type==='world'&&m.revision===1);
    await b.wait(m=>m.type==='world'&&m.revision===1);
    const switches=built.devices.filter(d=>d.kind==='switch'),door=built.devices.find(d=>d.kind==='door');
    let revision=1;
    for(const [index,expected] of [[0,false],[1,true],[0,false],[1,false]]){
      a.send({type:'toggle',id:switches[index].id});revision++;
      const left=await a.wait(m=>m.type==='world'&&m.revision===revision),right=await b.wait(m=>m.type==='world'&&m.revision===revision);
      assert.equal(left.signals[door.id],expected);assert.deepEqual(left,right);
    }
    a.send({type:'place',kind:'switch',x:22,y:21});assert.match((await a.wait(m=>m.type==='error'&&/occupied/.test(m.message))).message,/occupied/);
    a.send({type:'move',x:2000,y:432});const corrected=await a.wait(m=>m.type==='correction');assert.equal(corrected.x,320);
    const saved=JSON.parse(await readFile(path.join(dataDir,'world.json'),'utf8'));assert.equal(saved.revision,5);
    assert.equal(saved.players[who.id].inventory.switch,6);
    await app.close();app=await createServer({port:0,dataDir});c=client(app.port);
    const rejoined=await c.join(who.token);assert.equal(rejoined.id,who.id);assert.equal(rejoined.inventory.switch,6);
    const restored=await c.wait(m=>m.type==='world'&&m.revision===5);assert.deepEqual(restored.devices,saved.devices);
    assert.equal(restored.signals[door.id],false);
    c.send({type:'remove',id:switches[0].id});await c.wait(m=>m.type==='world'&&m.revision===6);
    assert.equal((await c.wait(m=>m.type==='inventory')).inventory.switch,7);
  } finally {a.ws.terminate();b.ws.terminate();c?.ws.terminate();await app.close();await rm(dataDir,{recursive:true,force:true});}
});
test('malformed messages and duplicate identities cannot crash or replace a player',async()=>{
  const dataDir=await mkdtemp(path.join(os.tmpdir(),'logicworld-invalid-'));const app=await createServer({port:0,dataDir});
  const a=client(app.port),b=client(app.port);
  try {const who=await a.join();await b.join(who.token).catch(()=>{});assert.match((await b.wait(m=>m.type==='error')).message,/already connected/);a.ws.send('no json');assert.match((await a.wait(m=>m.type==='error')).message,/Invalid message/);}
  finally {a.ws.terminate();b.ws.terminate();await app.close();await rm(dataDir,{recursive:true,force:true});}
});
