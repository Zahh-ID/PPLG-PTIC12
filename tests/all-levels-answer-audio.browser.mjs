import assert from 'node:assert/strict';import {gameBrowser} from './helpers/game-browser.mjs';
const f=await gameBrowser();try{
 await f.ready(1);await f.page.waitForFunction(()=>window.__testGame.getSoundManager()._loadedSounds.getFromName('CR_answer_wrong')?.state()==='loaded');await f.page.evaluate(()=>{window.__wrongEvents=[];const h=window.__testGame.getSoundManager()._loadedSounds.getFromName('CR_answer_wrong');h.on('play',id=>window.__wrongEvents.push({volume:h._soundById(id)?._volume??0}));});let scenarios=0;
 for(let level=1;level<=8;level++){
  if(level>1)await f.level(level);
  await f.page.evaluate(()=>{const s=window.__testGame.getSceneStack().getCurrentScene();s.__islandGame.invincibleUntil=1e6;s.__islandGame.hurtUntil=0;s.__islandGame.ammo=40;for(const e of [...s.getObjects('Crab')])e.deleteFromScene(s)});
  const shot=level>=7?'CR_combat_cannon':'CR_combat_shot';
  await f.page.waitForFunction(name=>window.__testGame.getSoundManager()._loadedSounds.getFromName(name)?.state()==='loaded',{timeout:15000},shot);
  await f.page.evaluate(()=>Howler.ctx.suspend());await f.page.keyboard.down('j');await f.page.waitForFunction(name=>Howler.ctx.state==='running'&&window.__testGame.getSoundManager()._loadedSounds.getFromName(name)?.playing(),{timeout:10000},shot);await f.page.keyboard.up('j');
  for(let id=0;id<3;id++){
   await f.page.evaluate(id=>{const s=window.__testGame.getSceneStack().getCurrentScene();s.__islandGame.coins=3;s.__campaign.openMission(id)},id);
   await f.page.waitForFunction(()=>document.querySelector('#cr-workbench')?.dataset.motion==='ready');await f.page.click('[data-action=start-challenge]');await f.page.waitForFunction(()=>document.querySelector('#cr-workbench')?.dataset.motion==='ready'&&document.querySelector('[data-action=test]')?.offsetParent);
   await f.page.evaluate(()=>document.querySelector('[data-action=reset]').click());
   await f.page.waitForFunction(()=>{const h=window.__testGame.getSoundManager()._loadedSounds.getFromName('CR_answer_wrong');return h?.state()==='loaded'&&!h.playing()},{timeout:15000});
   const before=await f.page.evaluate(()=>window.__wrongEvents.length);await f.page.evaluate(()=>Howler.ctx.suspend());await f.page.click('[data-action=test]');
   await f.page.waitForFunction(n=>Howler.ctx.state==='running'&&!Howler._muted&&Howler.volume()>0&&window.__wrongEvents.length>n&&document.querySelector('.feedback')?.dataset.tone==='error',{timeout:15000},before);assert.ok(await f.page.evaluate(()=>window.__wrongEvents.at(-1).volume>0));scenarios++;
   await f.page.click('[data-action=close]');await f.page.waitForFunction(()=>!document.getElementById('cr-workbench'));
  }
  console.log('PASS level '+level+': player shot and all three wrong-answer checks play after audio resumes');
 }
 assert.equal(scenarios,24);assert.deepEqual(f.errors,[]);assert.deepEqual(f.missing,[]);console.log('PASS all 24 challenges and eight levels have working sound');
}finally{await f.close()}
