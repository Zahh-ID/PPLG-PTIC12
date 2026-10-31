import {evaluate,example} from './world.js';

export const LEVEL_ONE = {
  id:'L01',name:'Twin Power',durationMs:360000,width:1920,height:540,
  spawn:{x:64,y:400},playerSize:{w:32,h:64},
  platforms:[{x:0,y:464,w:400,h:76},{x:480,y:464,w:1440,h:76},
    {x:656,y:384,w:112,h:16},{x:848,y:336,w:112,h:16},{x:1008,y:384,w:80,h:16},{x:1456,y:352,w:144,h:16}],
  zones:[{id:'loading-dock',name:'BROKEN LOADING DOCK',from:0,to:608},
    {id:'maintenance',name:'MAINTENANCE GANTRY',from:608,to:1088},
    {id:'power-bay',name:'POWER SERVICE BAY',from:1088,to:1440},
    {id:'control',name:'CONTROL ALCOVE / EXTRACTION',from:1440,to:1920}],
  feedA:{x:560,y:416},fuse:{x:1152,y:432},feedB:{x:1280,y:416},
  console:{x:1504,y:416},gate:{x:1712,y:400,w:16,h:64},exit:{x:1824,y:400,w:64,h:64},
  log:{id:'dock-record',x:704,y:352},
};
const circuit=example().map((d,i)=>({...d,id:`c${i}`}));
export function output(m){
  const devices=circuit.map(d=>({...d})),switches=devices.filter(d=>d.kind==='switch');
  switches[0].on=m.feedA;switches[1].on=m.feedB&&m.fuseInstalled;
  return evaluate(devices)[devices.find(d=>d.kind==='door').id];
}
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const near=(p,o,r=72)=>Math.hypot(p.x+16-o.x,p.y+32-o.y)<=r;
const blankInput=()=>({left:false,right:false,jump:false,shoot:false,dash:false,interact:false});
export function createMission(attemptId,progress={},options={}){
  const durationMs=options.durationMs??LEVEL_ONE.durationMs;
  return {levelId:'L01',attemptId,status:'briefing',paused:false,reason:null,durationMs,remainingMs:durationMs,elapsedMs:0,
    player:{...LEVEL_ONE.spawn,w:32,h:64,vx:0,vy:0,facing:1,hp:5,grounded:false,invulnerableMs:0,shotCooldown:0,dashCooldown:0,dashMs:0,knockbackMs:0,knockbackVx:0},
    feedA:false,feedB:false,fuseCollected:false,fuseInstalled:false,defused:false,defuseMs:0,
    logCollected:(progress.logs||[]).includes('dock-record'),input:blankInput(),jumpQueued:false,dashQueued:false,
    enemies:[{id:'patrol-a',x:736,y:416,w:32,h:48,min:672,max:864,hp:3,dir:-1,mode:'patrol',windupMs:0,cooldown:0,attackMs:0,hurtMs:0,defeatMs:0},
      {id:'patrol-b',x:1168,y:416,w:32,h:48,min:1088,max:1216,hp:3,dir:-1,mode:'patrol',windupMs:0,cooldown:0,attackMs:0,hurtMs:0,defeatMs:0}],
    projectiles:[],nextProjectile:0,message:'MIRA: Two feeds. One safety lock. Both must be live.',resultSaved:false,saveError:null};
}
export function missionCommand(m,command){
  if(command.type==='start'){
    if(m.status!=='briefing')throw new Error('This attempt has already started.');
    m.status='running';m.message='Restore feeds A and B, disable the charge, then reach the lift.';return;
  }
  if(command.type==='pause'){
    if(m.status!=='running')throw new Error('Only a running mission can be paused.');
    if(typeof command.paused!=='boolean')throw new Error('Invalid pause command.');
    m.paused=command.paused;m.input=blankInput();m.jumpQueued=false;m.dashQueued=false;return;
  }
  if(command.type!=='input')throw new Error('Unknown mission command.');
  if(!command.input||Object.keys(command.input).some(k=>!Object.hasOwn(m.input,k)||typeof command.input[k]!=='boolean'))throw new Error('Invalid mission input.');
  if(m.status!=='running'||m.paused)return;
  const old=m.input,next={...old,...command.input};
  if(next.jump&&!old.jump)m.jumpQueued=true;
  if(next.dash&&!old.dash)m.dashQueued=true;
  if(next.interact&&!old.interact){
    if(near(m.player,LEVEL_ONE.feedA)){m.feedA=!m.feedA;m.message=`Feed A: ${Number(m.feedA)}.`;}
    else if(near(m.player,LEVEL_ONE.feedB)){
      if(!m.fuseInstalled){if(m.fuseCollected){m.fuseInstalled=true;m.message='Fuse installed. Press E again to toggle feed B.';}else m.message='Feed B needs the fuse from the guarded dock.';}
      else{m.feedB=!m.feedB;m.message=`Feed B: ${Number(m.feedB)}.`;}
    }
  }
  m.input=next;
}
function fail(m,reason){m.status='failed';m.reason=reason;m.input=blankInput();m.defuseMs=0;m.message=reason==='timeout'?'Mission failed: the purge clock expired.':reason==='fall'?'Mission failed: lost in the dock breach.':'Mission failed: RELAY-7 was disabled.';}
function damage(m,enemy){
  const p=m.player;if(p.invulnerableMs>0||m.input.interact&&near(p,LEVEL_ONE.console))return;
  p.hp=Math.max(0,p.hp-1);p.invulnerableMs=1000;p.knockbackMs=120;p.knockbackVx=p.x<enemy.x?-160:160;p.vx=p.knockbackVx;
  if(!p.hp)fail(m,'death');
}
function moveBody(p,dt,solids){
  const dx=p.vx*dt;p.x+=dx;
  for(const r of solids)if(overlap(p,r)){p.x=dx>0?r.x-p.w:r.x+r.w;p.vx=0;}
  const dy=p.vy*dt;p.y+=dy;p.grounded=false;
  for(const r of solids)if(overlap(p,r)){if(dy>=0){p.y=r.y-p.h;p.grounded=true;}else p.y=r.y+r.h;p.vy=0;}
  p.x=Math.max(0,Math.min(LEVEL_ONE.width-p.w,p.x));
}
function step(m,ms){
  if(m.status!=='running'||m.paused)return;
  // Deadline wins over extraction, damage and defusal on the same tick.
  m.remainingMs=Math.max(0,m.remainingMs-ms);m.elapsedMs+=ms;
  if(m.remainingMs===0){fail(m,'timeout');return;}
  const p=m.player,dt=ms/1000;
  for(const k of ['invulnerableMs','shotCooldown','dashCooldown','dashMs','knockbackMs'])p[k]=Math.max(0,p[k]-ms);
  const direction=Number(m.input.right)-Number(m.input.left);
  if(direction)p.facing=direction;
  if(m.dashQueued&&p.dashCooldown===0){p.dashMs=160;p.dashCooldown=2000;p.invulnerableMs=Math.max(p.invulnerableMs,160);}
  if(m.jumpQueued&&p.grounded)p.vy=-500;
  m.jumpQueued=false;m.dashQueued=false;
  p.vx=p.knockbackMs>0?p.knockbackVx:p.dashMs>0?p.facing*520:direction*200;
  p.vy=Math.min(850,p.vy+1300*dt);
  moveBody(p,dt,[...LEVEL_ONE.platforms,...(m.defused?[]:[LEVEL_ONE.gate])]);
  if(p.y>560){fail(m,'fall');return;}
  if(near(p,LEVEL_ONE.fuse,48)&&!m.fuseCollected){m.fuseCollected=true;m.message='Fuse recovered. Install it at feed B.';}
  if(near(p,LEVEL_ONE.log,40)&&!m.logCollected){m.logCollected=true;m.message='Archive log recovered: WARDEN changed the evacuation orders.';}
  if(m.input.shoot&&p.shotCooldown===0){
    m.projectiles.push({id:`pulse-${m.nextProjectile++}`,x:p.x+(p.facing>0?28:-8),y:p.y+28,w:10,h:4,vx:p.facing*600,lifeMs:650});p.shotCooldown=350;
  }
  for(const shot of m.projectiles){
    shot.x+=shot.vx*dt;shot.lifeMs-=ms;
    if(LEVEL_ONE.platforms.some(r=>overlap(shot,r)))shot.lifeMs=0;
    for(const e of m.enemies)if(e.hp>0&&shot.lifeMs>0&&overlap(shot,e)){e.hp--;e.hurtMs=180;shot.lifeMs=0;if(!e.hp)m.message='Patrol disabled.';}
  }
  m.projectiles=m.projectiles.filter(s=>s.lifeMs>0);
  for(const e of m.enemies){
    if(e.hp<=0){e.defeatMs+=ms;continue;}e.cooldown=Math.max(0,e.cooldown-ms);e.hurtMs=Math.max(0,e.hurtMs-ms);
    const inReach=Math.abs((p.x+16)-(e.x+16))<58&&Math.abs(p.y+32-(e.y+24))<60;
    if(e.mode==='windup'){
      e.windupMs-=ms;if(e.windupMs<=0){if(inReach)damage(m,e);e.mode='attack';e.attackMs=240;e.cooldown=1100;}
    }else if(e.mode==='attack'){e.attackMs-=ms;if(e.attackMs<=0)e.mode='patrol';}
    else if(inReach&&e.cooldown===0){e.mode='windup';e.windupMs=600;}
    else{e.x+=e.dir*48*dt;if(e.x<=e.min){e.x=e.min;e.dir=1;}if(e.x>=e.max){e.x=e.max;e.dir=-1;}}
  }
  if(m.status!=='running')return;
  if(!m.defused&&m.input.interact&&near(p,LEVEL_ONE.console)&&output(m)){
    m.defuseMs+=ms;if(m.defuseMs>=3000){m.defused=true;m.message='Charge disabled. Reach the extraction lift before time expires!';}
  }else if(!m.defused)m.defuseMs=0;
  if(m.defused&&overlap(p,LEVEL_ONE.exit)){m.status='success';m.input=blankInput();m.message='Dock secured. Saving Level 02 unlock…';}
}
export function advanceMission(m,elapsedMs){
  if(!Number.isFinite(elapsedMs)||elapsedMs<0)throw new Error('Invalid simulation time.');
  // Substeps stop fast input or server scheduling gaps from tunnelling through platforms.
  for(let left=elapsedMs;left>0;left-=Math.min(20,left)){step(m,Math.min(20,left));if(m.status!=='running'||m.paused)break;}
  return m;
}
export function missionProgress(progress,m){
  if(!['success','failed'].includes(m.status))throw new Error('Cannot persist an unfinished attempt.');
  const p=structuredClone(progress||{});p.version=1;p.results??=[];p.logs??=[];p.completed??={};p.unlockedLevel??=1;
  if(p.results.some(r=>r.attemptId===m.attemptId))return p;
  p.results.push({attemptId:m.attemptId,levelId:m.levelId,status:m.status,reason:m.reason,remainingMs:m.remainingMs});
  p.results=p.results.slice(-30);
  if(m.logCollected&&!p.logs.includes('dock-record'))p.logs.push('dock-record');
  if(m.status==='success'){
    const old=p.completed.L01;p.completed.L01={bestRemainingMs:Math.max(old?.bestRemainingMs||0,m.remainingMs),completions:(old?.completions||0)+1};
    p.unlockedLevel=Math.max(p.unlockedLevel,2);
  }
  return p;
}
export function missionSnapshot(m){
  const {input,jumpQueued,dashQueued,...visible}=m;return {...visible,output:output(m)};
}
