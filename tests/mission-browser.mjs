import puppeteer from 'puppeteer';import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';import {randomUUID} from 'node:crypto';import os from 'node:os';import path from 'node:path';import pg from 'pg';
import {createServer} from '../server/index.js';
const dataDir=await mkdtemp(path.join(os.tmpdir(),'logicworld-mission-browser-')),worldId='test-mission-browser-'+randomUUID(),databaseUrl=process.env.TEST_DATABASE_URL||null;
const options={port:0,dataDir,worldId,databaseUrl};let app=await createServer(options),browser;
try{
  browser=await puppeteer.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--disable-background-timer-throttling','--disable-renderer-backgrounding']});
  const page=await browser.newPage(),errors=[];await page.setViewport({width:960,height:540});await page.bringToFront();page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR',e.message);});
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const tapInteract=async()=>{
    await page.keyboard.press('e',{delay:60});
    // Native input is sampled per render frame. Separate distinct taps with a
    // release frame instead of injecting two complete presses inside one frame.
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  };
  const clickNative=async name=>{
    await page.waitForFunction(n=>window.__missionClient?.scene.getObjects(n)[0]?.isVisible(),{},name);
    const point=await page.evaluate(n=>{const o=window.__missionClient.scene.getObjects(n)[0],r=document.querySelector('canvas').getBoundingClientRect();return{x:r.left+(o.getX()+o.getWidth()/2)*r.width/960,y:r.top+(o.getY()+o.getHeight()/2)*r.height/540};},name);
    await page.mouse.move(point.x,point.y);await page.mouse.down();await wait(70);await page.mouse.up();await wait(100);
  };
  await page.goto(`http://127.0.0.1:${app.port}/?server=ws://127.0.0.1:${app.port}`);await page.waitForFunction(()=>window.__missionClient?.mission?.status==='briefing');
  const initial=await page.evaluate(()=>window.__missionClient.mission.remainingMs);await wait(300);assert.equal(await page.evaluate(()=>window.__missionClient.mission.remainingMs),initial,'briefing has no clock');
  assert.equal(await page.$('#mission-hud'),null,'no HTML overlay');
  await clickNative('UIModalHelp');await page.waitForFunction(()=>window.__missionClient.uiMode==='help');
  await clickNative('UICloseHelp');await page.waitForFunction(()=>window.__missionClient.uiMode==='briefing');
  await page.screenshot({path:'.cache/native-ui-briefing.png'});
  await clickNative('UIStart');await page.waitForFunction(()=>window.__missionClient.mission.status==='running');
  await clickNative('UIPause');await page.waitForFunction(()=>window.__missionClient.mission.paused);
  const paused=await page.evaluate(()=>window.__missionClient.mission.remainingMs);await wait(400);assert.equal(await page.evaluate(()=>window.__missionClient.mission.remainingMs),paused,'pause freezes clock');
  await clickNative('UIResume');await page.waitForFunction(()=>!window.__missionClient.mission.paused);
  await clickNative('UIHelp');await page.waitForFunction(()=>window.__missionClient.mission.paused&&window.__missionClient.uiMode==='help');
  await clickNative('UICloseHelp');await page.waitForFunction(()=>!window.__missionClient.mission.paused);
  await page.keyboard.down('j');await wait(450);await page.keyboard.up('j');
  assert.equal(await page.evaluate(()=>window.__missionClient.objects.get('hero').getAnimationName()),'idle','stationary shooting keeps idle locomotion');
  assert.equal(await page.evaluate(()=>window.__missionClient.objects.get('rifle').isVisible()),true);
  await wait(400);const beforeMouse=await page.evaluate(()=>window.__missionClient.mission.nextProjectile);
  await page.mouse.move(500,250);await page.mouse.down();await wait(140);await page.mouse.up();
  await page.waitForFunction(n=>window.__missionClient.mission.nextProjectile>n,{},beforeMouse);
  await page.keyboard.down('j');await page.keyboard.down('ArrowRight');await wait(180);
  assert.equal(await page.evaluate(()=>window.__missionClient.objects.get('hero').getAnimationName()),'run','shooting does not replace run');
  await page.keyboard.up('j');await page.keyboard.up('ArrowRight');
  await page.keyboard.down('ArrowRight');await page.waitForFunction(()=>window.__missionClient.mission.player.x>=320);await page.keyboard.up('ArrowRight');await wait(100);
  await page.keyboard.down('Space');await page.keyboard.down('ArrowRight');await page.waitForFunction(()=>window.__missionClient.mission.player.y<390,{timeout:3000});await page.keyboard.up('Space');
  await page.keyboard.down('j');await wait(80);assert.ok(['jump','fall'].includes(await page.evaluate(()=>window.__missionClient.objects.get('hero').getAnimationName())),'shooting preserves airborne pose');await page.keyboard.up('j');
  await page.waitForFunction(()=>window.__missionClient.mission.player.x>=530);await page.keyboard.up('ArrowRight');await wait(150);
  await tapInteract();await page.waitForFunction(()=>window.__missionClient.mission.feedA);
  // Fight from each approach rather than assuming every shot lands while
  // sprinting through both patrols; input delivery can vary with renderer load.
  await page.keyboard.down('j');await page.waitForFunction(()=>window.__missionClient.mission.enemies[0].hp===0);
  await page.keyboard.down('ArrowRight');await page.waitForFunction(()=>window.__missionClient.mission.player.x>=1020);await page.keyboard.up('ArrowRight');
  await page.waitForFunction(()=>window.__missionClient.mission.enemies[1].hp===0);
  await page.keyboard.down('ArrowRight');await page.waitForFunction(()=>window.__missionClient.mission.player.x>=1240);await page.keyboard.up('ArrowRight');await page.keyboard.up('j');await wait(200);
  const mid=await page.evaluate(()=>window.__missionClient.mission);assert.equal(mid.status,'running');assert.equal(mid.fuseCollected,true);assert.ok(mid.enemies.every(e=>e.hp===0),'both patrol bots defeated by pulse shots');
  await tapInteract();await page.waitForFunction(()=>window.__missionClient.mission.fuseInstalled);await tapInteract();await page.waitForFunction(()=>window.__missionClient.mission.output);
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
  await clickNative('UIStart');await page.keyboard.down('ArrowRight');await page.waitForFunction(()=>window.__missionClient.mission.status==='failed'&&window.__missionClient.mission.resultSaved);await page.keyboard.up('ArrowRight');
  assert.equal(await page.evaluate(()=>window.__missionClient.mission.reason),'fall');await clickNative('UIRetry');await page.waitForFunction(()=>window.__missionClient.mission.status==='briefing');
  assert.equal(await page.evaluate(()=>window.__missionClient.mission.player.hp),5);assert.equal(await page.evaluate(()=>window.__missionClient.mission.fuseCollected),false);assert.equal(await page.evaluate(()=>window.__missionClient.progress.unlockedLevel),2);
  // Native hit testing must follow the resized game canvas, not CSS coordinates.
  await page.setViewport({width:1280,height:720});await wait(150);
  await clickNative('UIModalHelp');await page.waitForFunction(()=>window.__missionClient.uiMode==='help');
  await clickNative('UICloseHelp');await page.waitForFunction(()=>window.__missionClient.uiMode==='briefing');
  await clickNative('UIStart');await page.waitForFunction(()=>window.__missionClient.mission.status==='running');
  await page.keyboard.down('ArrowLeft');await wait(100);await page.keyboard.up('ArrowLeft');
  await page.keyboard.down('j');await wait(120);await page.keyboard.up('j');
  assert.equal(await page.evaluate(()=>window.__missionClient.objects.get('rifle').isFlippedX()),true,'rifle mirrors to face left');
  assert.ok(await page.evaluate(()=>window.__missionClient.mission.projectiles.some(p=>p.vx<0)),'left-facing shots move left');
  await page.screenshot({path:'.cache/native-ui-resized-rifle.png'});
  assert.deepEqual(errors,[]);
  console.log('PASS: native GDevelop UI click events at 960x540 and 1280x720, help/pause/resume/retry, rifle keyboard/mouse and mirrored left fire with idle/run/airborne poses, full Level01 completion and saved unlock after server restart.');
}catch(e){if(browser){for(const p of await browser.pages()){if(p.url().includes('127.0.0.1')){console.log(await p.evaluate(()=>window.__missionClient?.mission));await p.screenshot({path:'.cache/mission-browser-failed.png'});}}}throw e;
}finally{await browser?.close();await app?.close();if(databaseUrl){const c=new pg.Client({connectionString:databaseUrl});try{await c.connect();await c.query('DELETE FROM worlds WHERE id=$1',[worldId]);}finally{await c.end();}}await rm(dataDir,{recursive:true,force:true});}
