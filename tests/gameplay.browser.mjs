import fs from 'node:fs';
import assert from 'node:assert/strict';
import {gameBrowser} from './helpers/game-browser.mjs';

const fixture=await gameBrowser(),{page,ready,seconds,level,errors,missing}=fixture,passed=[];
const pass=label=>{passed.push(label);console.log('PASS '+label);};
const wait=fn=>page.waitForFunction(fn);
try {
 await ready(1);
 await page.evaluate(({gameplay,combat})=>{
  window.__gameplay=new Function('runtimeScene',gameplay);window.__combat=new Function('runtimeScene',combat);
  // Invoke the exported rules at a specified delta, using real GDevelop masks/objects.
  window.__tickRules=(kind,delta=.08)=>{const s=window.__testGame.getSceneStack().getCurrentScene(),tm=s.getTimeManager(),elapsed=tm.getElapsedTime;tm.getElapsedTime=()=>delta*1000;try{window[kind](s);}finally{tm.getElapsedTime=elapsed;}};
 },{gameplay:fs.readFileSync('src/events/gameplay.js','utf8'),combat:fs.readFileSync('src/events/combat.js','utf8')});
 const inventory=await page.evaluate(()=>window.__testGame.getGameData().layouts.map(s=>({name:s.name,removed:s.instances.filter(o=>['Chest','Key','TreasureChest','TreasureGlow','TreasureHeading','TreasureStory','HUDKeyIcon'].includes(o.name)).map(o=>o.name)})));
 assert.ok(inventory.every(s=>s.removed.length===0),JSON.stringify(inventory));pass('No chest, keycard, reveal or key HUD remains in any scene');
 await page.evaluate(()=>{const s=window.__testGame.getSceneStack().getCurrentScene();s.__islandGame.invincibleUntil=1e6;for(const e of s.getObjects('Crab'))e.deleteFromScene(s);});
 const jumpReach=await page.evaluate(()=>{
  const owner=window.__testGame,s=owner.getSceneStack().getCurrentScene(),p=s.getObjects('Player')[0],move=p.getBehavior('Platformer'),input=owner.getInputManager(),results=[];
  owner.pause(true);
  try{for(const fps of [20,30,60]){
   const start=p.getY();let top=start;
   for(let frame=0;frame<fps*2;frame++){
    if(frame/fps<.15)input.onKeyPressed(32);else input.onKeyReleased(32);
    s.renderAndStep(1000/fps);input.onFrameEnded();top=Math.min(top,p.getY());
   }
   results.push({fps,rise:start-top,grounded:move.isOnFloor()});
  }}finally{input.releaseAllPressedKeys();owner.pause(false);}
  return results;
 });
 for(const jump of jumpReach){assert.ok(jump.rise>=155&&jump.rise<=185,JSON.stringify(jumpReach));assert.equal(jump.grounded,true);}
 pass('Native jumps clear the 120px route steps with at least 35px margin at 20, 30 and 60fps');
 await page.keyboard.down('d');await page.keyboard.down('j');
 await wait(()=>{const s=window.__testGame.getSceneStack().getCurrentScene();return s.__islandGame.ammo<40&&s.getObjects('Player')[0].getAnimationName()==='Run';});
 await page.evaluate(()=>window.__frames=new Set());
 await wait(()=>{window.__frames.add(window.__testGame.getSceneStack().getCurrentScene().getObjects('Player')[0].getAnimationFrame());return window.__frames.size===8;});
 await page.keyboard.down('Space');
 await wait(()=>{const p=window.__testGame.getSceneStack().getCurrentScene().getObjects('Player')[0];return !p.getBehavior('Platformer').isOnFloor()&&['Jump','Fall'].includes(p.getAnimationName());});
 await page.keyboard.up('Space');await page.keyboard.up('d');await page.keyboard.up('j');
 pass('Running and airborne locomotion continue while firing; run visits all eight frames');
 const shots=await page.evaluate(()=>{
  const s=window.__testGame.getSceneStack().getCurrentScene(),g=s.__islandGame;
  const wall=s.createObject('Ground');wall.setPosition(600,600);wall.setWidth(2);wall.setHeight(200);
  const e=s.createObject('Crab');e.setPosition(620,660);e.setWidth(72);e.setHeight(72);e.activateBehavior('Platformer',false);e.__patrol={hp:2,left:0,right:0,direction:-1};
  const test=(x,velocity)=>{const shot=s.createObject('Bullet');shot.setPosition(x,680);shot.setWidth(30);shot.setHeight(12);shot.__velocity=velocity;shot.__ttl=1;window.__tickRules('__gameplay');return{remaining:s.getObjects('Bullet').includes(shot),hp:e.__patrol.hp};};
  const wallBeforeEnemy=test(560,780),thinWall=test(560,2000);wall.deleteFromScene(s);const clear=test(620,0);e.deleteFromScene(s);
  return{wallBeforeEnemy,thinWall,clear};
 });
 assert.deepEqual(shots,{wallBeforeEnemy:{remaining:false,hp:2},thinWall:{remaining:false,hp:2},clear:{remaining:false,hp:1}});
 pass('Player shots stop at a thin wall before a target, including a large movement step');
 const hostile=await page.evaluate(()=>{
  const s=window.__testGame.getSceneStack().getCurrentScene(),c=s.__campaign,g=s.__islandGame;
  const wall=s.createObject('Ground');wall.setPosition(600,600);wall.setWidth(2);wall.setHeight(200);
  const shot=s.createObject('EnemyBolt');shot.setAnimationName('Plasma');shot.setPosition(550,680);shot.setWidth(44);shot.setHeight(36);shot.__vx=2000;shot.__vy=0;shot.__ttl=1;shot.__kind='Plasma';c.pendingDamage=0;
  window.__tickRules('__combat');const result={remaining:s.getObjects('EnemyBolt').includes(shot),damage:c.pendingDamage};wall.deleteFromScene(s);return result;
 });
 assert.deepEqual(hostile,{remaining:false,damage:0});pass('Hostile projectiles cannot tunnel across thin room geometry');
 const guard=await page.evaluate(()=>{
  const s=window.__testGame.getSceneStack().getCurrentScene(),g=s.__islandGame,c=s.__campaign;
  const e=s.createObject('Crab');e.setPosition(1000,1132.5);e.setWidth(72);e.setHeight(72);e.__patrol={hp:2,left:900,right:1100,direction:-1,state:'shoot',activeAt:g.time-.4,until:g.time+.2,hit:false,aimX:800,aimY:1100,hurtUntil:g.time+.2};
  const shots=c.combat.shots;window.__tickRules('__combat');const stunned=e.getAnimationName();g.time+=.3;window.__tickRules('__combat');const result={stunned,state:e.__patrol.state,shots:c.combat.shots-shots};e.deleteFromScene(s);return result;
 });
 assert.deepEqual(guard,{stunned:'Hurt',state:'recover',shots:0});pass('Interrupting a guard cancels its shot and gives a recovery window');
 await level(6);
 const checkpoint=await page.evaluate(()=>{
  const s=window.__testGame.getSceneStack().getCurrentScene(),g=s.__islandGame,p=s.getObjects('Player')[0],flag=s.getObjects('Checkpoint')[0],c=s.__campaign;
  for(const e of s.getObjects('Crab'))e.deleteFromScene(s);
  p.setPosition(flag.getX(),flag.getY()+flag.getHeight()-112);p.getBehavior('Platformer').setCurrentSpeed(0);p.getBehavior('Platformer').setCurrentFallSpeed(0);window.__tickRules('__gameplay',0);
  const acquired=g.checkpointActive,surface=g.checkpointFeetY;
  c.mecha=true;c.boarded=true;g.maxHealth=6;g.state='dying';g.deathAt=g.time-2;p.activateBehavior('Platformer',false);p.setAnimationName('MechaDeath');p.setWidth(192);p.setHeight(192);
  window.__tickRules('__gameplay',0);
  return{acquired,surface,feet:p.getY()+168,y:p.getY(),expected:flag.getVariables().get('FloorY').getAsNumber()||flag.getY()+flag.getHeight()};
 });
 assert.equal(checkpoint.acquired,true);assert.equal(checkpoint.feet,checkpoint.expected);assert.equal(checkpoint.y,checkpoint.surface-168);
 await wait(()=>window.__testGame.getSceneStack().getCurrentScene().getObjects('Player')[0].getBehavior('Platformer').isOnFloor());
 pass('After boarding, a mecha respawns on the saved checkpoint floor without embedding its body');
 const landing=await page.evaluate(()=>{
  const s=window.__testGame.getSceneStack().getCurrentScene(),p=s.getObjects('Player')[0],old=p.getAnimationName(),frames=[];
  p.setAnimationName('MechaLand');p.setWidth(192);p.setHeight(192);
  for(let frame=0;frame<8;frame++){p.setAnimationFrame(frame);const vertices=p.getHitBoxes().flatMap(box=>box.vertices);frames.push({frame,body:[Math.min(...vertices.map(v=>v[0]))-p.getX(),Math.min(...vertices.map(v=>v[1]))-p.getY(),Math.max(...vertices.map(v=>v[0]))-p.getX(),Math.max(...vertices.map(v=>v[1]))-p.getY()],artFoot:p.getPointY('ArtFoot')-p.getY()});}
  p.setAnimationName(old);return frames;
 });
 for(const frame of landing){for(const[n,value]of frame.body.entries())assert.ok(Math.abs(value-[36,30,156,168][n])<.001,JSON.stringify(frame));assert.ok(Math.abs(frame.artFoot-168)<.001,JSON.stringify(frame));}
 pass('All eight mecha landing poses share a visible ground anchor and an unchanged native collision body');
 const cleared=await page.evaluate(()=>{
  const s=window.__testGame.getSceneStack().getCurrentScene(),g=s.__islandGame;
  for(let i=0;i<3;i++){const shot=s.createObject('Bullet');shot.__velocity=0;shot.__ttl=1;const hostile=s.createObject('EnemyBolt');hostile.__vx=0;hostile.__vy=0;hostile.__ttl=1;}g.state='playing';g.health=1;g.invincibleUntil=0;s.__campaign.pendingDamage=1;window.__tickRules('__gameplay',0);
  return{state:g.state,shots:s.getObjects('Bullet').length,hostile:s.getObjects('EnemyBolt').length};
 });
 assert.deepEqual(cleared,{state:'dying',shots:0,hostile:0});pass('Death clears live player shots instead of carrying them into the next life');
 await level(8);
 const boss=await page.evaluate(()=>{
  const s=window.__testGame.getSceneStack().getCurrentScene(),p=s.getObjects('Player')[0],b=s.getObjects('CoreBoss')[0],c=s.__campaign,g=s.__islandGame;
  Object.assign(c.boss,{shield:false,state:'recover',until:g.time+10,homeY:b.getY(),floor:b.getY()+b.getHeight()*.875});p.setPosition(b.getX()+b.getWidth()/2-96,b.getY()+b.getHeight()*.875-168);c.pendingDamage=0;
  window.__tickRules('__combat',0);return c.pendingDamage;
 });
 assert.equal(boss,0);pass('A boss in exposed recovery does not apply incidental contact damage');
 const boundary=await page.evaluate(()=>{
  const s=window.__testGame.getSceneStack().getCurrentScene(),p=s.getObjects('Player')[0],w=s.getVariables().get('WorldWidth').getAsNumber();
  p.setX(w+500);window.__tickRules('__gameplay',0);return {right:p.getX()+156,width:w};
 });
 assert.equal(boundary.right,boundary.width);pass('World boundaries account for the wider mecha collision body');
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
} finally {
 fs.mkdirSync('.local/reports',{recursive:true});fs.writeFileSync('.local/reports/gameplay-results.json',JSON.stringify({passed,errors,missing},null,2));await fixture.close();
}
