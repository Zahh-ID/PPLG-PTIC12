import fs from 'node:fs';
import assert from 'node:assert/strict';
import {gameBrowser} from './helpers/game-browser.mjs';
const fixture=await gameBrowser(),{page,ready,errors,missing}=fixture,passed=[];
const pass=s=>{passed.push(s);console.log('PASS '+s);};
try{
 await ready(1);
 const range=await page.evaluate(()=>{
  const owner=window.__testGame,s=owner.getSceneStack().getCurrentScene(),p=s.getObjects('Player')[0],m=p.getBehavior('Platformer'),g=s.__islandGame,c=s.__campaign,input=owner.getInputManager();owner.pause(true);
  for(const name of ['Ground','Ledge','Bulkhead','ClimbRail','Crab'])for(const o of [...s.getObjects(name)]){if(name!=='Crab')o.activateBehavior('Platform',false);o.setPosition(-10000,-10000);o.deleteFromScene(s);}const floor=s.createObject('Ground');floor.setPosition(100,1000);floor.setWidth(1800);floor.setHeight(48);g.invincibleUntil=1e6;p.setPosition(736,888);m.setCurrentSpeed(0);m.setCurrentFallSpeed(0);
  const e=s.createObject('Crab');e.setPosition(500,910);e.setWidth(96);e.setHeight(96);e.__patrol={hp:2,left:480,right:680,direction:1,state:'patrol'};
  const step=()=>{s.renderAndStep(1000/60);input.onFrameEnded();};let shot=null;
  for(let i=0;i<150&&!shot;i++){step();shot=s.getObjects('EnemyBolt')[0];}
  if(!shot){owner.pause(false);return{error:'no shot after normal windup',guard:e.__patrol};}
  const horizontal=Math.abs(shot.__vy)<.00001&&shot.__vx>0,configured=shot.__distanceLeft+shot.__travelled;
  // Move the target behind the muzzle: the released bolt must keep its heading,
  // miss the target and disappear at the configured range rather than chase it.
  p.setPosition(200,888);m.setCurrentSpeed(0);m.setCurrentFallSpeed(0);for(let i=0;i<95;i++)step();
  const expired=!s.getObjects('EnemyBolt').includes(shot),travelled=shot.__travelled;
  for(const o of s.getObjects('EnemyBolt'))o.deleteFromScene(s);
  p.setPosition(736,626);m.setCurrentSpeed(0);m.setCurrentFallSpeed(0);const upper=s.createObject('Ledge');upper.setPosition(650,750);upper.setWidth(400);upper.setHeight(24);
  e.__patrol.state='patrol';e.__patrol.until=0;const before=c.combat.shots;for(let i=0;i<180;i++)step();const elevatedShots=c.combat.shots-before;
  upper.deleteFromScene(s);p.setPosition(1436,888);e.__patrol.state='patrol';e.__patrol.until=0;const distantBefore=c.combat.shots;for(let i=0;i<180;i++)step();const distantShots=c.combat.shots-distantBefore;
  p.setPosition(736,888);e.setPosition(500,910);e.__patrol.state='patrol';e.__patrol.until=0;const wall=s.createObject('Bulkhead');wall.setPosition(650,760);wall.setWidth(24);wall.setHeight(240);const wallBefore=c.combat.shots;for(let i=0;i<180;i++)step();
  const wallShots=c.combat.shots-wallBefore;owner.pause(false);return{horizontal,configured,expired,travelled,elevatedShots,distantShots,wallShots};
 });
 assert.equal(range.error,undefined,JSON.stringify(range));assert.equal(range.horizontal,true);assert.ok(Math.abs(range.configured-440)<.000001);assert.equal(range.expired,true);assert.ok(Math.abs(range.travelled-440)<.01,JSON.stringify(range));
 assert.equal(range.elevatedShots,0,JSON.stringify(range));assert.equal(range.distantShots,0);assert.equal(range.wallShots,0);
 pass('Normal guards shoot horizontally, expire shots at 440 units, and respect height, detection range and solid walls');
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
}finally{fs.mkdirSync('.local/reports',{recursive:true});fs.writeFileSync('.local/reports/world-mechanics-results.json',JSON.stringify({passed,errors,missing},null,2));await fixture.close();}
