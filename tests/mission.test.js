import {test} from 'node:test';import assert from 'node:assert/strict';
import {createMission,missionCommand,advanceMission,missionProgress,output,LEVEL_ONE} from '../shared/mission.js';
const make=()=>createMission('attempt-1');
const input=(m,next)=>missionCommand(m,{type:'input',input:next});
function at(m,point){m.player.x=point.x-16;m.player.y=400;m.player.vx=0;m.player.vy=0;}
function tap(m){input(m,{interact:true});input(m,{interact:false});}
test('briefing and pause freeze clock, combat and physics; only start begins time',()=>{
  const m=make();advanceMission(m,9000);assert.equal(m.remainingMs,360000);
  missionCommand(m,{type:'start'});advanceMission(m,1000);assert.equal(m.remainingMs,359000);
  input(m,{jump:true,dash:true});missionCommand(m,{type:'pause',paused:true});assert.equal(m.jumpQueued,false);assert.equal(m.dashQueued,false);const before=structuredClone(m);advanceMission(m,5000);assert.deepEqual(m,before);
  missionCommand(m,{type:'pause',paused:false});advanceMission(m,20);assert.equal(m.remainingMs,358980);
  assert.throws(()=>missionCommand(m,{type:'start'}),/already started/);
});
test('fuse must be collected and installed; all AND combinations behave correctly',()=>{
  const m=make();missionCommand(m,{type:'start'});at(m,LEVEL_ONE.feedB);tap(m);assert.equal(m.fuseInstalled,false);
  m.fuseCollected=true;tap(m);assert.equal(m.fuseInstalled,true);assert.equal(m.feedB,false);
  for(const a of [false,true])for(const b of [false,true]){m.feedA=a;m.feedB=b;assert.equal(output(m),a&&b);}
  m.fuseInstalled=false;m.feedA=true;m.feedB=true;assert.equal(output(m),false);
});
test('defusal needs valid output and continuous hold; interruption resets progress',()=>{
  const m=make();missionCommand(m,{type:'start'});at(m,LEVEL_ONE.console);input(m,{interact:true});advanceMission(m,3100);assert.equal(m.defused,false);
  m.feedA=m.feedB=m.fuseInstalled=true;advanceMission(m,1500);assert.equal(m.defuseMs,1500);
  m.feedA=false;advanceMission(m,20);assert.equal(m.defuseMs,0);
  m.feedA=true;advanceMission(m,3000);assert.equal(m.defused,true);assert.equal(m.status,'running');
  at(m,LEVEL_ONE.exit);advanceMission(m,20);assert.equal(m.status,'success');
});
test('extraction before defusal cannot win, and deadline wins same-tick extraction',()=>{
  const m=make();missionCommand(m,{type:'start'});at(m,LEVEL_ONE.exit);advanceMission(m,20);assert.equal(m.status,'running');
  m.defused=true;m.remainingMs=20;advanceMission(m,20);assert.equal(m.status,'failed');assert.equal(m.reason,'timeout');
});
test('retry defaults reset transient state and retain only permanent logs',()=>{
  const progress={logs:['dock-record'],unlockedLevel:2};const m=createMission('new-attempt',progress);
  assert.equal(m.status,'briefing');assert.equal(m.player.hp,5);assert.equal(m.remainingMs,360000);assert.equal(m.logCollected,true);
  assert.equal(m.defused,false);assert.equal(m.fuseInstalled,false);assert.equal(m.feedA,false);assert.equal(m.enemies[0].hp,3);
});
test('patrol windup, invulnerability, player defeat and pulse damage are simulated',()=>{
  const m=make();missionCommand(m,{type:'start'});m.enemies=m.enemies.slice(0,1);const e=m.enemies[0];e.min=e.max=e.x=600;m.player.x=570;
  advanceMission(m,580);assert.equal(m.player.hp,5);advanceMission(m,40);assert.equal(m.player.hp,4);
  advanceMission(m,500);assert.equal(m.player.hp,4);assert.ok(m.player.x<570,'hit knocks the player away');
  m.player.x=480;m.player.facing=1;input(m,{shoot:true});advanceMission(m,1400);assert.equal(e.hp,0);
  const dead=make();missionCommand(dead,{type:'start'});dead.enemies=dead.enemies.slice(0,1);dead.enemies[0].x=80;dead.enemies[0].min=80;dead.enemies[0].max=80;dead.player.hp=1;
  advanceMission(dead,700);assert.equal(dead.status,'failed');assert.equal(dead.reason,'death');
});
test('safe console prevents damage while holding interaction, without freezing timer',()=>{
  const m=make();missionCommand(m,{type:'start'});at(m,LEVEL_ONE.console);const e=m.enemies[0];e.x=m.player.x;e.min=e.max=e.x;m.enemies=[e];
  input(m,{interact:true});advanceMission(m,2000);assert.equal(m.player.hp,5);assert.equal(m.remainingMs,358000);
});
test('server physics handles ground, jumping, gap failure and dash cooldown',()=>{
  const m=make();missionCommand(m,{type:'start'});advanceMission(m,100);assert.equal(m.player.y,400);
  input(m,{jump:true});advanceMission(m,200);assert.ok(m.player.y<350);
  input(m,{jump:false});advanceMission(m,800);assert.equal(m.player.y,400);
  input(m,{dash:true});advanceMission(m,20);assert.ok(m.player.dashCooldown>0);assert.ok(m.player.vx>200);
  const fall=make();missionCommand(fall,{type:'start'});fall.player.x=432;advanceMission(fall,1000);assert.equal(fall.reason,'fall');
});
test('raised maintenance route and archive log are actually reachable',()=>{
  const m=make();missionCommand(m,{type:'start'});m.player.x=620;advanceMission(m,40);
  input(m,{jump:true,right:true});
  for(let i=0;i<70&&m.player.x<690;i++)advanceMission(m,20);
  input(m,{jump:false,right:false});advanceMission(m,900);
  assert.equal(m.player.y,320,'lands on 80px-high maintenance platform');
  assert.equal(m.logCollected,true,'optional upper-route log collected');
});
test('authoritative completion is idempotent and failure grants no unlock',()=>{
  const m=make();m.status='success';m.remainingMs=200000;m.logCollected=true;
  const first=missionProgress({},m),again=missionProgress(first,m);assert.deepEqual(first,again);assert.equal(first.unlockedLevel,2);assert.equal(first.completed.L01.completions,1);
  m.attemptId='attempt-2';m.remainingMs=150000;const replay=missionProgress(first,m);assert.equal(replay.completed.L01.bestRemainingMs,200000);
  m.status='failed';m.attemptId='attempt-3';const failed=missionProgress({},m);assert.equal(failed.unlockedLevel,1);assert.deepEqual(failed.completed,{});
  assert.throws(()=>missionProgress({},make()),/unfinished/);
});
test('invalid client inputs and negative time are rejected',()=>{
  const m=make();missionCommand(m,{type:'start'});assert.throws(()=>missionCommand(m,{type:'input',input:{x:1000}}),/Invalid/);assert.throws(()=>missionCommand(m,{type:'input',input:{shoot:'yes'}}),/Invalid/);assert.throws(()=>advanceMission(m,-1),/Invalid/);
});
