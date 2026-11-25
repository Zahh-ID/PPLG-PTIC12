import fs from 'node:fs';
import assert from 'node:assert/strict';
import {gameBrowser} from './helpers/game-browser.mjs';
const passed=[];
for(const mobile of [false,true]){
 const fixture=await gameBrowser('sector5',mobile?{width:390,height:844,isMobile:true,hasTouch:true}:{width:1280,height:720}),{page,ready,errors,missing}=fixture;
 const wait=fn=>page.waitForFunction(fn);
 const port=id=>'[data-port="'+id+'"]';
 const tap=async selector=>{await page.$eval(selector,e=>e.scrollIntoView({block:'nearest',inline:'nearest'}));if(mobile){const p=await page.$eval(selector,e=>{const r=e.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};});await page.touchscreen.tap(p.x,p.y);}else await page.click(selector);};
 try{
  await ready(5);await page.evaluate(()=>{const s=window.__testGame.getSceneStack().getCurrentScene();s.__islandGame.coins=3;s.__campaign.openMission(2);});
  await wait(()=>document.querySelector('#cr-workbench')?.dataset.motion==='ready');await tap('[data-action=start-challenge]');await wait(()=>document.querySelector('#cr-workbench')?.dataset.motion==='ready');
  await tap('[data-tool=nand]');await tap('[data-cell="34"]');await tap('[data-cell="37"]');await tap('[data-tool=wire]');
  const sides=await page.evaluate(()=>{const rect=id=>{const r=document.querySelector('[data-port="'+id+'"]').getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};},gate=document.querySelector('[data-cell="34"]').getBoundingClientRect();return{a:rect('g34.a'),b:rect('g34.b'),out:rect('g34.out'),center:gate.left+gate.width/2};});
  assert.ok(sides.a.x<sides.center&&sides.b.x<sides.center&&sides.out.x>sides.center&&sides.a.y<sides.b.y,JSON.stringify(sides));
  if(mobile){await tap(port('A.out'));await tap(port('g34.a'));}
  else {const points=await page.evaluate(()=>['A.out','g34.a'].map(id=>{const r=document.querySelector('[data-port="'+id+'"]').getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};}));await page.mouse.move(points[0].x,points[0].y);await page.mouse.down();await page.mouse.move(points[1].x,points[1].y,{steps:12});await page.mouse.up();}
  await wait(()=>window.__testGame.getSceneStack().getCurrentScene().__campaign.board.links.length===1);
  // Starting from an input is just as valid as starting from an output.
  for(const[from,to]of [['g34.b','B.out'],['g34.out','g37.a'],['g34.out','g37.b'],['g37.out','Y.in']]){await tap(port(from));await tap(port(to));}
  assert.equal(await page.evaluate(()=>window.__testGame.getSceneStack().getCurrentScene().__campaign.board.links.length),5);
  await tap('[data-action=test]');assert.equal(await page.$eval('[data-action=finish]',e=>e.hidden),false);
  await tap(port('A.out'));await tap(port('g34.b'));await tap('[data-action=test]');assert.equal(await page.$eval('[data-action=finish]',e=>e.hidden),true);
  await tap('[data-action=undo]');await tap('[data-action=test]');assert.equal(await page.$eval('[data-action=finish]',e=>e.hidden),false);
  await tap('[data-tool=erase]');await tap(port('g37.b'));assert.equal(await page.evaluate(()=>window.__testGame.getSceneStack().getCurrentScene().__campaign.board.links.length),4);
  await tap('[data-action=undo]');assert.equal(await page.evaluate(()=>window.__testGame.getSceneStack().getCurrentScene().__campaign.board.links.length),5);
  await tap('[data-tool=wire]');await tap(port('A.out'));await page.keyboard.press('Escape');assert.ok(await page.$('#cr-workbench'));assert.equal(await page.$('.cr-port.pending'),null);
  await tap('[data-action=close]');await wait(()=>!document.getElementById('cr-workbench'));assert.equal(await page.$('.cr-cable-preview'),null);
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
  const label=(mobile?'Touch':'Desktop')+' port editor: left inputs, direct/reverse connections, fan-out, rewiring, trim, undo and cancel';passed.push(label);console.log('PASS '+label);
 }finally{await fixture.close();}
}
fs.mkdirSync('.local/reports',{recursive:true});fs.writeFileSync('.local/reports/circuit-ports-results.json',JSON.stringify({passed},null,2));
