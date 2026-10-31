// Export GDevelop to exports/web first. Optionally set CHROME_PATH.
import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';
import {mkdtemp,rm,mkdir} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';
import {randomUUID} from 'node:crypto';
import pg from 'pg';
import {createServer} from '../server/index.js';
const dataDir=await mkdtemp(path.join(os.tmpdir(),'logicworld-browser-'));
const databaseUrl=process.env.TEST_DATABASE_URL||null,worldId='test-browser-'+randomUUID();
const app=await createServer({port:0,dataDir,databaseUrl,worldId,clientDir:'exports/workshop'});let browser;
try {
  browser=await puppeteer.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']});
  const a=await browser.newPage(),b=await browser.newPage(),errors=[];
  for(const page of [a,b]){await page.bringToFront();await page.setViewport({width:960,height:540});page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR',e.message);});await page.goto(`http://127.0.0.1:${app.port}/?server=ws://127.0.0.1:${app.port}`);await page.waitForFunction(()=>window.__logicWorld?.joined);}
  await a.bringToFront();
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const position=page=>page.evaluate(()=>{const p=window.__logicWorld.scene.getObjects('Player')[0];return{x:p.getX(),y:p.getY()};});
  async function clickTile(page,x,y,button='left') {
    await page.bringToFront();await page.focus('canvas');await page.waitForFunction(()=>document.visibilityState==='visible');await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(resolve)));
    const point=await page.evaluate(({x,y})=>{const s=window.__logicWorld,b=document.querySelector('canvas').getBoundingClientRect();return {x:b.left+((x*16+8-s.cameraX)*2+480)*b.width/960,y:b.top+((y*16+8-360)*2+270)*b.height/540};},{x,y});
    await page.mouse.move(point.x,point.y);await page.mouse.down({button});await new Promise(r=>setTimeout(r,60));await page.mouse.up({button});
  }
  await a.waitForFunction(()=>window.__logicWorld.players.length===2);
  await a.click('[data-action="example"]');
  await a.focus('canvas');
  await a.waitForFunction(()=>window.__logicWorld.revision===1);await b.waitForFunction(()=>window.__logicWorld.revision===1);
  await wait(300);assert.equal(Math.round((await position(a)).y),432);
  await a.keyboard.down('Space');await a.waitForFunction(()=>window.__logicWorld.scene.getObjects('Player')[0].getY()<420);await a.keyboard.up('Space');await wait(900);
  assert.equal(Math.round((await position(a)).y),432,'lands on terrain');
  await a.keyboard.down('ArrowRight');await wait(1600);await a.keyboard.up('ArrowRight');await wait(200);
  const blocked=await position(a);if(blocked.x>593){console.log(await a.evaluate(()=>{const s=window.__logicWorld,d=s.devices.find(d=>d.kind==='door'),o=s.objects.get(d.id);return{door:d,signal:s.signals[d.id],x:o.getX(),y:o.getY(),w:o.getWidth(),h:o.getHeight(),active:o.behaviorActivated('Platform'),hit:o.getHitBoxes().map(h=>h.vertices),behavior:{registered:o.getBehavior('Platform')._registeredInManager,type:o.getBehavior('Platform')._platformType,box:(()=>{const b=o.getBehavior('Platform').currentRBushAABB;return b?{minX:b.minX,minY:b.minY,maxX:b.maxX,maxY:b.maxY}:null;})()},playerY:s.scene.getObjects('Player')[0].getY()};}));await a.screenshot({path:'.cache/door-failed.png'});}assert.ok(blocked.x>=570&&blocked.x<=593,`closed door blocks at ${blocked.x}`);
  await a.keyboard.down('ArrowLeft');await wait(500);await a.keyboard.up('ArrowLeft');await wait(200);
  await clickTile(a,22,21);await a.waitForFunction(()=>window.__logicWorld.revision===2);
  assert.equal(await a.evaluate(()=>{const s=window.__logicWorld;return s.signals[s.devices.find(d=>d.kind==='door').id];}),false);
  await b.bringToFront();await clickTile(b,22,27);await a.waitForFunction(()=>window.__logicWorld.revision===3);await b.waitForFunction(()=>window.__logicWorld.revision===3);await a.bringToFront();await a.focus('canvas');
  for(const page of [a,b])assert.equal(await page.evaluate(()=>{const s=window.__logicWorld;return s.signals[s.devices.find(d=>d.kind==='door').id];}),true);
  await a.keyboard.down('ArrowRight');await wait(1000);await a.keyboard.up('ArrowRight');await wait(200);
  assert.ok((await position(a)).x>630,'open door is passable');
  await b.bringToFront();await b.waitForFunction(()=>window.__logicWorld.remotes.size===1);
  await a.bringToFront();
  await a.keyboard.down('ArrowLeft');await wait(400);await a.keyboard.up('ArrowLeft');await wait(200);
  await clickTile(a,36,23,'right');await a.waitForFunction(()=>window.__logicWorld.revision===4);
  assert.equal(await a.evaluate(()=>{const s=window.__logicWorld;return s.signals[s.devices.find(d=>d.kind==='door').id];}),false,'removing wire breaks circuit');
  await a.click('[data-tool="wire"]');await clickTile(a,36,23);await a.waitForFunction(()=>window.__logicWorld.revision===5);await b.waitForFunction(()=>window.__logicWorld.revision===5);
  assert.equal(await a.evaluate(()=>{const s=window.__logicWorld;return s.signals[s.devices.find(d=>d.kind==='door').id];}),true,'placing wire restores circuit');
  const before=await a.evaluate(()=>({id:window.__logicWorld.id,inventory:window.__logicWorld.inventory}));
  await a.reload();await a.waitForFunction(()=>window.__logicWorld?.joined&&window.__logicWorld.revision===5);
  assert.deepEqual(await a.evaluate(()=>({id:window.__logicWorld.id,inventory:window.__logicWorld.inventory})),before,'rejoin restores identity and inventory');
  await mkdir('.cache',{recursive:true});await a.screenshot({path:'.cache/two-player-workshop.png'});
  assert.deepEqual(errors,[],'no browser runtime errors');
  console.log('PASS: two GDevelop tabs, collision, jump, camera, closed/open door, switches, shared signals, remote avatar and rejoin.');
} catch(e){if(browser)for(const page of await browser.pages())if(page.url().includes('127.0.0.1'))console.log(await page.evaluate(()=>{const s=window.__logicWorld;return s?{joined:s.joined,id:s.id,players:s.players,remotes:s.remotes.size,message:s.message}:{};}));throw e;
} finally {await browser?.close();await app.close();if(databaseUrl){const c=new pg.Client({connectionString:databaseUrl});try{await c.connect();await c.query('DELETE FROM worlds WHERE id=$1',[worldId]);}finally{await c.end();}}await rm(dataDir,{recursive:true,force:true});}
