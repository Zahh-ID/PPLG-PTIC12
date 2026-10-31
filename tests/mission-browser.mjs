import puppeteer from 'puppeteer';import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';import {randomUUID} from 'node:crypto';import os from 'node:os';import path from 'node:path';import pg from 'pg';
import {createServer} from '../server/index.js';
const dataDir=await mkdtemp(path.join(os.tmpdir(),'logicworld-mission-browser-')),worldId='test-mission-browser-'+randomUUID(),databaseUrl=process.env.TEST_DATABASE_URL||null;
const options={port:0,dataDir,worldId,databaseUrl};let app=await createServer(options),browser;
try{
  browser=await puppeteer.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--disable-background-timer-throttling','--disable-renderer-backgrounding']});
  const page=await browser.newPage(),errors=[];await page.setViewport({width:960,height:540});await page.bringToFront();page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR',e.message);});
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  await page.goto(`http://127.0.0.1:${app.port}/?server=ws://127.0.0.1:${app.port}`);await page.waitForFunction(()=>window.__missionClient?.mission?.status==='briefing');
  const initial=await page.evaluate(()=>window.__missionClient.mission.remainingMs);await wait(300);assert.equal(await page.evaluate(()=>window.__missionClient.mission.remainingMs),initial,'briefing has no clock');
  await page.click('[data-action="start"]');await page.waitForFunction(()=>window.__missionClient.mission.status==='running');
  await page.click('[data-action="pause"]');await page.waitForFunction(()=>window.__missionClient.mission.paused);
  const paused=await page.evaluate(()=>window.__missionClient.mission.remainingMs);await wait(400);assert.equal(await page.evaluate(()=>window.__missionClient.mission.remainingMs),paused,'pause freezes clock');
  await page.click('#mission-panel [data-action="pause"]');await page.waitForFunction(()=>!window.__missionClient.mission.paused);
  await page.keyboard.down('ArrowRight');await page.waitForFunction(()=>window.__missionClient.mission.player.x>=320);await page.keyboard.up('ArrowRight');await wait(100);
  await page.keyboard.down('Space');await page.keyboard.down('ArrowRight');await page.waitForFunction(()=>window.__missionClient.mission.player.y<390,{timeout:3000});await page.keyboard.up('Space');
  await page.waitForFunction(()=>window.__missionClient.mission.player.x>=530);await page.keyboard.up('ArrowRight');await wait(150);
  await page.keyboard.press('e');await page.waitForFunction(()=>window.__missionClient.mission.feedA);
  await page.keyboard.down('j');await page.keyboard.down('ArrowRight');await page.waitForFunction(()=>window.__missionClient.mission.player.x>=1240);await page.keyboard.up('ArrowRight');await page.keyboard.up('j');await wait(200);
  const mid=await page.evaluate(()=>window.__missionClient.mission);assert.equal(mid.status,'running');assert.equal(mid.fuseCollected,true);assert.ok(mid.enemies.every(e=>e.hp===0),'both patrol bots defeated by pulse shots');
  await page.keyboard.press('e');await page.waitForFunction(()=>window.__missionClient.mission.fuseInstalled);await page.keyboard.press('e');await page.waitForFunction(()=>window.__missionClient.mission.output);
  await page.keyboard.down('ArrowRight');await page.waitForFunction(()=>window.__missionClient.mission.player.x>=1480);await page.keyboard.up('ArrowRight');await wait(100);
  await page.keyboard.down('e');await page.waitForFunction(()=>window.__missionClient.mission.defused);await page.keyboard.up('e');
  await page.screenshot({path:'.cache/level-one-defused.png'});
  await page.keyboard.down('ArrowRight');await page.waitForFunction(()=>window.__missionClient.mission.status==='success'&&window.__missionClient.mission.resultSaved);await page.keyboard.up('ArrowRight');
  assert.equal(await page.evaluate(()=>window.__missionClient.progress.unlockedLevel),2);assert.equal(await page.evaluate(()=>window.__missionClient.progress.completed.L01.completions),1);
  await page.screenshot({path:'.cache/level-one-victory.png'});
  // Restart the actual server, not just the tab. Browser reconnect uses the same token.
  const port=app.port;await app.close();app=null;app=await createServer({...options,port});
  await page.waitForFunction(()=>window.__missionClient?.joined&&window.__missionClient.mission.status==='briefing'&&window.__missionClient.progress.unlockedLevel===2);
  assert.equal(await page.evaluate(()=>window.__missionClient.progress.completed.L01.completions),1,'restart retains one completion');
  await page.click('[data-action="start"]');await page.keyboard.down('ArrowRight');await page.waitForFunction(()=>window.__missionClient.mission.status==='failed'&&window.__missionClient.mission.resultSaved);await page.keyboard.up('ArrowRight');
  assert.equal(await page.evaluate(()=>window.__missionClient.mission.reason),'fall');await page.click('[data-action="retry"]');await page.waitForFunction(()=>window.__missionClient.mission.status==='briefing');
  assert.equal(await page.evaluate(()=>window.__missionClient.mission.player.hp),5);assert.equal(await page.evaluate(()=>window.__missionClient.mission.fuseCollected),false);assert.equal(await page.evaluate(()=>window.__missionClient.progress.unlockedLevel),2);
  assert.deepEqual(errors,[]);
  console.log('PASS: real GDevelop Level01 briefing, pause, jump, two patrol fights, fuse/install, AND defusal, extraction, saved unlock, server restart and failure/retry.');
}catch(e){if(browser){for(const p of await browser.pages()){if(p.url().includes('127.0.0.1')){console.log(await p.evaluate(()=>window.__missionClient?.mission));await p.screenshot({path:'.cache/mission-browser-failed.png'});}}}throw e;
}finally{await browser?.close();await app?.close();if(databaseUrl){const c=new pg.Client({connectionString:databaseUrl});try{await c.connect();await c.query('DELETE FROM worlds WHERE id=$1',[worldId]);}finally{await c.end();}}await rm(dataDir,{recursive:true,force:true});}
