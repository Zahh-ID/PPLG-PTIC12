import fs from 'node:fs';
import assert from 'node:assert/strict';
import {gameBrowser} from './helpers/game-browser.mjs';

const first=Number(process.env.CR_ROUTE_FIRST??1),last=Number(process.env.CR_ROUTE_LAST??8);
const fixture=await gameBrowser(first===1?'permainan':'sector'+first),{page,ready,level,errors,missing}=fixture,passed=[];
page.setDefaultTimeout(90000);
try {
 await ready(first);
 for(let number=first;number<=last;number++) {
  if(number>first)await level(number);
  await page.waitForFunction(()=>window.__testGame.getSceneStack().getCurrentScene().getObjects('Player')[0].getBehavior('Platformer').isOnFloor());
  const spawn=await page.evaluate(()=>{const s=window.__testGame.getSceneStack().getCurrentScene(),p=s.getObjects('Player')[0],authored=s.getGame().getGameData().layouts.find(o=>o.name===s.getName()).instances.find(o=>o.name==='Player');return{actual:p.getY(),authored:authored.y,lives:s.__islandGame.lives};});
  assert.ok(Math.abs(spawn.actual-spawn.authored)<=13,JSON.stringify({number,...spawn}));assert.equal(spawn.lives,3);
  await page.evaluate(()=>{
   const s=window.__testGame.getSceneStack().getCurrentScene(),p=s.getObjects('Player')[0],g=s.__islandGame,c=s.__campaign,input=s.getGame().getInputManager();
   // Isolate map traversal from combat and puzzle correctness (covered separately).
   // No position edits, velocity injection or flying: the bot uses the normal controls.
   for(const e of [...s.getObjects('Crab')])e.deleteFromScene(s);
   g.invincibleUntil=1e6;
   const floors=[...s.getObjects('Ground'),...s.getObjects('Ledge'),...s.getObjects('Bulkhead').filter(o=>o.getHeight()<=20&&o.getWidth()>128)],move=p.getBehavior('Platformer');
   // The editor sometimes tiles one continuous floor with overlapping objects.
   // Treat that as one walking surface; native physics may retain either object as support.
   const surfaces=[];
   for(const floor of floors){
    let members=[floor],changed=true;
    while(changed){changed=false;for(let i=surfaces.length-1;i>=0;i--){const surface=surfaces[i];
     const left=Math.min(...members.map(o=>o.getX())),right=Math.max(...members.map(o=>o.getX()+o.getWidth()));
     if(Math.abs(surface.getY()-floor.getY())<1&&left<=surface.getX()+surface.getWidth()&&right>=surface.getX()){members.push(...surface.members);surfaces.splice(i,1);changed=true;}
    }}
    surfaces.push({members,getX:()=>Math.min(...members.map(o=>o.getX())),getY:()=>members[0].getY(),getWidth:()=>Math.max(...members.map(o=>o.getX()+o.getWidth()))-Math.min(...members.map(o=>o.getX()))});
   }
   const goals=[];
   for(const t of s.getObjects('MissionTerminal').sort((a,b)=>a.getVariables().get('TerminalId').getAsNumber()-b.getVariables().get('TerminalId').getAsNumber())) {
    const coin=s.getObjects('Coin').find(o=>o.getVariables().get('PartId').getAsNumber()===t.getVariables().get('TerminalId').getAsNumber());
    goals.push({name:'part '+(goals.length/2+1),x:coin.getX()+coin.getWidth()/2,y:coin.getVariables().get('FloorY').getAsNumber()});
    goals.push({name:'terminal '+t.getVariables().get('TerminalId').getAsNumber(),x:t.getX()+64,y:t.getY()+128,terminal:t.getVariables().get('TerminalId').getAsNumber()});
   }
   const mech=s.getObjects('HangarMecha')[0];if(c.level===6)goals.push({name:'boarding',x:mech.getX()+mech.getWidth()/2,y:mech.getY()+mech.getHeight()*.875});
   const exit=s.getObjects('ExitDoor')[0];goals.push({name:'airlock',x:exit.getX()+64,y:exit.getVariables().get('FloorY').getAsNumber()||exit.getY()+128});
   if(c.level===8){
    // Later shield phases require returning from the arena to the upper terminals.
    for(const id of [1,2]){const t=s.getObjects('MissionTerminal').find(o=>o.getVariables().get('TerminalId').getAsNumber()===id);goals.push({name:'return to phase '+id,x:t.getX()+64,y:t.getY()+128});}
    goals.push({name:'return to arena',x:exit.getX()+64,y:exit.getVariables().get('FloorY').getAsNumber()||exit.getY()+128});
   }
   const state=window.__route={level:c.level,goal:0,goals,hops:[],visited:[],started:g.time,done:false};
   const center=()=>p.getX()+p.getWidth()/2,feet=()=>p.getY()+(c.mecha?168:112),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
   const key=(code,on)=>{if(on)input.onKeyPressed(code);else input.onKeyReleased(code);};
   function steer(target){const dx=target-center(),speed=move.getCurrentSpeed(),brake=speed*speed/(2*1800)+5;key(37,dx<-6&&(speed>=0||-dx>brake));key(39,dx>6&&(speed<=0||dx>brake));}
   function path(from,to) {
    const queue=[from],parent=new Map([[from,null]]),edge=new Map();
    for(const a of queue) {
     if(a===to){const result=[];for(let n=to;n!==from;n=parent.get(n))result.unshift({to:n,rail:edge.get(n)});return result;}
     for(const b of surfaces){if(parent.has(b))continue;const rise=a.getY()-b.getY(),gap=Math.max(0,a.getX()-b.getX()-b.getWidth(),b.getX()-a.getX()-a.getWidth());
      const rail=s.getObjects('ClimbRail').find(r=>{const x=r.getX()+r.getWidth()/2,top=r.getVariables().get('UpperFloor').getAsNumber(),bottom=r.getVariables().get('LowerFloor').getAsNumber();return x>=a.getX()&&x<=a.getX()+a.getWidth()&&x>=b.getX()&&x<=b.getX()+b.getWidth()&&Math.min(a.getY(),b.getY())>=top-1&&Math.max(a.getY(),b.getY())<=bottom+1;});
      if(rail||rise<=120&&rise>=-900&&gap<=180){parent.set(b,a);edge.set(b,rail);queue.push(b);}}

    }
    return null;
   }
   const original=s._eventsFunction;
   s.setEventsFunction(scene=>{
    if(!state.done&&!state.error){
     if(g.state==='won'&&goals[state.goal]?.name==='airlock'){state.visited.push('airlock');state.done=true;}
     else if(g.state!=='playing'){state.error='lost life during traversal';}
     else if(g.time-state.started>260){state.error='route timeout';}
     else {
      const goal=goals[state.goal],support=surfaces.find(surface=>surface.members.some(o=>move.isOnFloorObject(o)))??(move.isOnFloor()?surfaces.find(o=>Math.abs(o.getY()-feet())<1&&center()+(c.mecha?60:19)>o.getX()&&center()-(c.mecha?60:19)<o.getX()+o.getWidth()):null);
      if(support&&Math.abs(feet()-goal.y)<2&&Math.abs(center()-goal.x)<15&&goal.name==='boarding'&&!c.boarded){key(69,true);key(37,false);key(39,false);}
      else if(support&&Math.abs(feet()-goal.y)<2&&Math.abs(center()-goal.x)<15){
       state.visited.push(goal.name);state.goal++;state.hop=null;key(32,false);
       key(69,false);key(87,false);key(83,false);
       if(goal.terminal!==undefined){c.completed[goal.terminal]=true;if(c.completed.every(Boolean))c.solved=true;}
       if(state.goal===goals.length){state.done=true;key(37,false);key(39,false);}
      } else if(goal) {
       const target=surfaces.filter(o=>Math.abs(o.getY()-goal.y)<1&&goal.x>=o.getX()&&goal.x<=o.getX()+o.getWidth()).sort((a,b)=>b.getWidth()-a.getWidth())[0];
       if(!target)state.error='missing support for '+goal.name;
       else if(support&&(support===target||Math.abs(support.getY()-target.getY())<1&&support.getX()<=target.getX()+target.getWidth()&&support.getX()+support.getWidth()>=target.getX())){state.hop=null;key(32,false);steer(goal.x);}
       else {
        if(!state.hop&&support){
         const route=path(support,target);
         if(!route?.length)state.error='no path to '+goal.name;
         else {const next=route[0].to,rail=route[0].rail,pad=36,landing=clamp(center(),next.getX()+pad,next.getX()+next.getWidth()-pad);state.hop={from:support,to:next,rail,landing,launch:rail?rail.getX()+rail.getWidth()/2:clamp(landing,support.getX()+pad,support.getX()+support.getWidth()-pad),jumpAt:null};state.hops.push({from:[support.getX(),support.getY()],to:[next.getX(),next.getY()],rail:!!rail});}
        }
        const hop=state.hop;
        if(hop){
         if(support&&support!==hop.from&&support!==hop.to){state.hop=null;key(32,false);key(87,false);key(83,false);}
         else if(support===hop.to&&(!hop.rail||hop.exiting)){state.hop=null;key(32,false);key(87,false);key(83,false);}
         else if(hop.rail){
          key(32,false);const up=hop.to.getY()<hop.from.getY(),x=hop.rail.getX()+hop.rail.getWidth()/2;
          if(!hop.climbing&&!move.isOnLadder()){steer(x);if(Math.abs(center()-x)<12){hop.climbing=true;key(87,up);key(83,!up);}}
          else if(!hop.exiting){key(37,false);key(39,false);key(87,up);key(83,!up);if(up?feet()<=hop.to.getY()-6:feet()>=hop.to.getY()-6){hop.exiting=true;key(87,false);key(83,false);}}
          else {key(87,false);key(83,false);steer(x+(goal.x>=x?1:-1)*(hop.rail.getWidth()/2+(c.mecha?60:19)+30));}
         }
         else if(hop.jumpAt!==null){key(32,g.time-hop.jumpAt<.13);steer(hop.landing);if(support&&g.time-hop.jumpAt>1.4){state.hop=null;key(32,false);}}
         else if(hop.to.getY()>hop.from.getY()+2){
          // Leave the source ledge to descend; jump-through floors are not solid ceilings.
          const left=hop.to.getX()+hop.to.getWidth()/2<=(hop.from.getX()+hop.from.getWidth()/2),edge=left?hop.from.getX()-100:hop.from.getX()+hop.from.getWidth()+100;
          steer(support?edge:hop.landing);key(32,false);if(!support)hop.jumpAt=g.time-.2;
         } else if(support&&Math.abs(center()-hop.launch)<16){hop.jumpAt=g.time;key(32,true);steer(hop.landing);}
         else steer(hop.launch);
        }
       }
      }
     }
    }
    original(scene);
    if(s.getObjects('Ledge').some(o=>o.getVariables().get('Role').getAsString()==='rail-hatch'&&!o.isVisible()))state.error='rail hatch became invisible';
    state.position={x:p.getX(),y:p.getY(),feet:feet(),speed:move.getCurrentSpeed(),onFloor:move.isOnFloor(),goal:goals[state.goal]?.name};
    if(state.done||state.error){input.releaseAllPressedKeys();s.setEventsFunction(original);}
   });
   // Fixed native steps avoid wall-clock/browser scheduling changing jump reach.
   s.getGame().pause(true);s.getTimeManager().setTimeScale(1);
   for(let frame=0;frame<18000&&!state.done&&!state.error;frame++){s.renderAndStep(1000/60);input.onFrameEnded();}
   s.getGame().pause(false);
  });
  try{await page.waitForFunction(()=>window.__route?.done||window.__route?.error,{polling:100});}
  catch(error){console.log('ROUTE STATE',await page.evaluate(()=>{const r=window.__route;return{...r,hop:r.hop?{launch:r.hop.launch,landing:r.hop.landing,jumpAt:r.hop.jumpAt,from:[r.hop.from.getX(),r.hop.from.getY()],to:[r.hop.to.getX(),r.hop.to.getY()]}:null};}));throw error;}
  const result=await page.evaluate(()=>{const r=window.__route;return{level:r.level,error:r.error,done:r.done,visited:r.visited,hops:r.hops,position:r.position,coins:window.__testGame.getSceneStack().getCurrentScene().__islandGame.coins};});
  assert.equal(result.error,undefined,JSON.stringify(result));assert.equal(result.done,true);assert.equal(result.coins,3,JSON.stringify(result));
  passed.push(result);console.log('PASS level '+number+': collected three parts and reached three terminals + airlock using native movement ('+result.hops.length+' hops)');
 }
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
} finally {
 fs.mkdirSync('.local/reports',{recursive:true});fs.writeFileSync('.local/reports/routes-results.json',JSON.stringify({passed,errors,missing},null,2));await fixture.close();
}
