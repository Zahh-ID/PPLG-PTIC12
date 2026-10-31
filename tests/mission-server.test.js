import {test} from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,rm,readFile} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import {WebSocket} from 'ws';import {createServer} from '../server/index.js';
function connect(port){const ws=new WebSocket(`ws://127.0.0.1:${port}`),messages=[],listeners=[];ws.on('message',raw=>{const m=JSON.parse(raw);messages.push(m);for(const l of [...listeners])if(l.test(m)){clearTimeout(l.timer);listeners.splice(listeners.indexOf(l),1);l.resolve(m);}});return{ws,send:m=>ws.send(JSON.stringify({v:1,...m})),wait(test){const old=messages.find(test);if(old)return Promise.resolve(old);return new Promise((resolve,reject)=>{const l={test,resolve};l.timer=setTimeout(()=>reject(new Error('Mission server response timed out')),4000);listeners.push(l);});},async join(token){if(ws.readyState!==WebSocket.OPEN)await new Promise(r=>ws.on('open',r));this.send({type:'join',mode:'mission',token});return this.wait(m=>m.type==='welcome');}};}
test('mission socket rejects client-claimed wins and coordinates; disconnect/rejoin pauses same attempt',async()=>{
  const dataDir=await mkdtemp(path.join(os.tmpdir(),'mission-authority-')),app=await createServer({port:0,dataDir,databaseUrl:null});let a=connect(app.port),b;
  try{
    const who=await a.join();const initial=await a.wait(m=>m.type==='mission');a.send({type:'mission',action:'start'});await a.wait(m=>m.type==='mission'&&m.mission.status==='running');
    a.send({type:'mission',action:'success'});assert.match((await a.wait(m=>m.type==='error'&&/Unknown mission/.test(m.message))).message,/Unknown/);
    a.send({type:'mission',action:'input',input:{x:1500}});await a.wait(m=>m.type==='error'&&/Invalid mission input/.test(m.message));
    a.send({type:'move',x:1500,y:400});await a.wait(m=>m.type==='error'&&/Workshop commands/.test(m.message));
    a.ws.close();await new Promise(r=>a.ws.on('close',r));b=connect(app.port);await b.join(who.token);const restored=await b.wait(m=>m.type==='mission');
    assert.equal(restored.mission.attemptId,initial.mission.attemptId);assert.equal(restored.mission.paused,true);assert.equal(restored.mission.player.x,64);assert.equal(restored.progress.unlockedLevel,undefined);
  }finally{a.ws.terminate();b?.ws.terminate();await app.close();await rm(dataDir,{recursive:true,force:true});}
});
test('timeout saves failure without unlock, then retry creates a fresh briefing and full clock',async()=>{
  const dataDir=await mkdtemp(path.join(os.tmpdir(),'mission-timeout-')),app=await createServer({port:0,dataDir,databaseUrl:null,missionOptions:{durationMs:150}}),a=connect(app.port);
  try{
    const who=await a.join();a.send({type:'mission',action:'start'});const failed=await a.wait(m=>m.type==='mission'&&m.mission.status==='failed'&&m.mission.resultSaved);
    assert.equal(failed.mission.reason,'timeout');assert.equal(failed.progress.unlockedLevel,1);assert.equal(failed.progress.results.length,1);
    const saved=JSON.parse(await readFile(path.join(dataDir,'world.json'),'utf8'));assert.equal(saved.players[who.id].questProgress.results[0].status,'failed');
    a.send({type:'mission',action:'retry'});const fresh=await a.wait(m=>m.type==='mission'&&m.mission.attemptId!==failed.mission.attemptId&&m.mission.status==='briefing');
    assert.equal(fresh.mission.remainingMs,150);assert.equal(fresh.mission.player.hp,5);assert.equal(fresh.mission.feedA,false);
  }finally{a.ws.terminate();await app.close();await rm(dataDir,{recursive:true,force:true});}
});
