import assert from 'node:assert/strict';import {gameBrowser} from './helpers/game-browser.mjs';
const f=await gameBrowser(),{page,ready,level,errors,missing}=f;page.setDefaultTimeout(20000);
try{await ready(1);for(let n=1;n<=8;n++){
 if(n>1)await level(n);
 await page.evaluate(()=>{const s=window.__testGame.getSceneStack().getCurrentScene();for(const name of ['Ground','Ledge','Bulkhead','ClimbRail','Crab'])for(const o of [...s.getObjects(name)])o.deleteFromScene(s);const floor=s.createObject('Ground');floor.setPosition(400,1000);floor.setWidth(600);floor.setHeight(40);s.__islandGame.invincibleUntil=1e6;});
 for(const dir of ['left','right']){
  await page.evaluate(dir=>{const s=window.__testGame.getSceneStack().getCurrentScene(),p=s.getObjects('Player')[0],m=p.getBehavior('Platformer');p.setPosition((dir==='left'?520:880)-p.getWidth()/2,1000-p.getHeight()*.875-8);m.setCurrentSpeed(0);m.setCurrentFallSpeed(0);delete window.__edgeFall;},dir);
  await page.waitForFunction(()=>{const p=window.__testGame.getSceneStack().getCurrentScene().getObjects('Player')[0];return p.getBehavior('Platformer').isOnFloor()&&Math.abs(p.getY()+p.getHeight()*.875-1000)<1});await page.keyboard.down(dir==='left'?'a':'d');
  await page.waitForFunction(()=>{const p=window.__testGame.getSceneStack().getCurrentScene().getObjects('Player')[0],m=p.getBehavior('Platformer');if(!m.isOnFloor()&&m.getCurrentFallSpeed()>0){window.__edgeFall={center:p.getX()+p.getWidth()/2,animation:p.getAnimationName()};return true}return false});await page.keyboard.up(dir==='left'?'a':'d');const result=await page.evaluate(()=>window.__edgeFall);const overhang=dir==='left'?400-result.center:result.center-1000;assert.ok(overhang>=-5&&overhang<=52,JSON.stringify({n,dir,overhang,result}));
 }
 console.log('PASS level '+n+': falls promptly at both floor edges');
}assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);}finally{await f.close()}
