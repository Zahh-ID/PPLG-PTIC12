// Robot combat: readable state machines, fixed facing during attacks and repair-powered arena tools.
const combatCampaign=runtimeScene.__campaign,combatGame=runtimeScene.__islandGame;
if(!combatCampaign||!combatGame)return;
const c=combatCampaign,g=combatGame,O=name=>runtimeScene.getObjects(name),p=O('Player')[0];
if(!p||runtimeScene.__animalUI?.modal||runtimeScene.__animalUI?.transitioning)return;
const now=g.time,dt=Math.min(runtimeScene.getTimeManager().getElapsedTime()/1000,.08);
const worldWidth=runtimeScene.getVariables().get('WorldWidth').getAsNumber();
const feet=o=>o.getY()+o.getHeight()*.875,center=o=>o.getX()+o.getWidth()/2;
const px=center(p),py=p.getY()+p.getHeight()*.55;
const animate=(o,a)=>{if(o.getAnimationName()!==a)o.setAnimationName(a);};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const overlap=(x,y,w,h,o)=>{const left=c.mecha ? .1875:45/128,right=c.mecha ? .8125:83/128,top=c.mecha?40/256:32/128;return x<o.getX()+o.getWidth()*right&&x+w>o.getX()+o.getWidth()*left&&y<feet(o)&&y+h>o.getY()+o.getHeight()*top;};
const solids=()=>[...O('Ground'),...O('RouteGate').filter(o=>o.isVisible())];
// Segment/box test keeps guards from firing through solid room walls.
function crosses(x,y,tx,ty,o){let lo=0,hi=1;for(const[v,d,a,b]of [[x,tx-x,o.getX(),o.getX()+o.getWidth()],[y,ty-y,o.getY(),o.getY()+o.getHeight()]]){if(Math.abs(d)<.001){if(v<a||v>b)return false;}else{let t0=(a-v)/d,t1=(b-v)/d;if(t0>t1)[t0,t1]=[t1,t0];lo=Math.max(lo,t0);hi=Math.min(hi,t1);if(lo>hi)return false;}}return hi>=0&&lo<=1;}
function bolt(kind,x,y,tx,ty,speed=360){const o=runtimeScene.createObject('EnemyBolt');if(!o)return;const sizes={Plasma:[44,36],Missile:[90,58],Wave:[110,148]};const[w,h]=sizes[kind];o.setAnimationName(kind);o.setWidth(w);o.setHeight(h);o.setPosition(x-w/2,y-h/2);o.setZOrder(14);const a=Math.atan2(ty-y,tx-x);o.__vx=Math.cos(a)*speed;o.__vy=Math.sin(a)*speed;o.__ttl=7;o.__kind=kind;o.setAngle(a*180/Math.PI);return o;}
function message(text){g.message=text;g.messageUntil=now+1.1;}
c.combat??={shots:0,attacks:[],coverUses:0};
if(g.state!=='playing'){for(const e of O('Crab'))e.getBehavior('Platformer').setCurrentSpeed(0);for(const b of O('EnemyBolt'))b.deleteFromScene(runtimeScene);c.combat.marker?.hide();return;}
for(const e of O('Crab')){
 const a=e.__patrol;if(!a)continue;const move=e.getBehavior('Platformer');
 if(a.deadAt!==undefined){animate(e,'Death');if(now-a.deadAt>.85)e.deleteFromScene(runtimeScene);continue;}
 a.state??='patrol';a.until??=0;a.home??=center(e);
 const ex=center(e),ey=e.getY()+e.getHeight()*.5,dx=px-ex,dy=py-ey;
 const sees=Math.abs(dx)<650&&Math.abs(dy)<170&&!solids().some(o=>crosses(ex,ey,px,py,o));
 if(a.hurtUntil>now){move.setCurrentSpeed(0);animate(e,'Hurt');continue;}
 if(a.state==='aim'||a.state==='melee-windup'){
  move.setCurrentSpeed(0);animate(e,'Idle');e.setColor('255;205;155');
  if(now>=a.until){if(a.state==='aim'){bolt('Plasma',ex+a.direction*38,ey,a.aimX,a.aimY,350);c.combat.shots++;a.state='shoot';}else{a.state='melee';if(overlap(ex+(a.direction<0?-110:0),feet(e)-105,110,100,p))c.pendingDamage++;}a.until=now+.72;}
 }else if(a.state==='shoot'||a.state==='melee'){
  move.setCurrentSpeed(0);e.setColor('255;255;255');animate(e,a.state==='shoot'?'Shoot':'Melee');if(now>=a.until){a.state='recover';a.until=now+.65;}
 }else if(a.state==='recover'){
  move.setCurrentSpeed(0);animate(e,'Idle');if(now>=a.until)a.state='patrol';
 }else{
  e.setColor('255;255;255');let direction=a.direction;
  if(sees){a.direction=dx<0?-1:1;direction=a.direction;
   if(Math.abs(dx)<105){a.state='melee-windup';a.until=now+.65;move.setCurrentSpeed(0);}
   else if(Math.abs(dx)<430){a.state='aim';a.until=now+.7;a.aimX=px;a.aimY=py;move.setCurrentSpeed(0);}
   else a.state='pursue';
  }else{a.state='patrol';if(e.getX()<=a.left)a.direction=1;if(e.getX()>=a.right)a.direction=-1;direction=a.direction;}
  // Refuse unsupported steps: native Platformer still owns gravity and contacts.
  const ahead=ex+direction*(e.getWidth()*.4+20),floor=feet(e)+e.getHeight()*(120/128-.875);
  const safe=[...O('Ground'),...O('Ledge'),...O('RepairLift')].some(o=>ahead>=o.getX()&&ahead<=o.getX()+o.getWidth()&&o.getY()>=floor-20&&o.getY()<=floor+60);
  if(['patrol','pursue'].includes(a.state)&&safe){if(direction<0)move.simulateLeftKey();else move.simulateRightKey();animate(e,'Walk');}else{move.setCurrentSpeed(0);animate(e,'Idle');if(a.state==='patrol')a.direction=-direction;}
 }
 e.flipX(a.direction<0);
 if(gdjs.RuntimeObject.collisionTest(p,e,false)){
  const playerMove=p.getBehavior('Platformer');if(playerMove.isFalling()&&feet(p)<e.getY()+e.getHeight()*.3+24){a.hp=0;a.deadAt=now;e.activateBehavior('Platformer',false);animate(e,'Death');g.score+=50;playerMove.setCurrentFallSpeed(-380);}else c.pendingDamage++;
 }
}
const boss=c.boss,b=O('CoreBoss')[0];
// Cover becomes available after the first repair; E discharges it, clearing shots and staggering the boss.
for(const cover of O('ArenaCover')){
 cover.__readyAt??=0;const ready=c.completed[0]&&now>=cover.__readyAt;cover.__charged=ready;animate(cover,ready?'On':'Off');cover.setColor(ready?'130;235;255':'95;100;125');
 if(Math.abs(px-center(cover))<135&&Math.abs(feet(p)-feet(cover))<160){
  if(ready){message('Cover charged • E: EMP / restore shield');if(c.interactEdge){cover.__readyAt=now+16;c.combat.coverUses++;g.shield=3;for(const shot of O('EnemyBolt'))if(Math.hypot(center(shot)-center(cover),shot.getY()-cover.getY())<700)shot.deleteFromScene(runtimeScene);if(boss&&!boss.dead&&!boss.shield&&Math.abs(center(b)-center(cover))<1100){boss.state='stagger';boss.until=now+1.1;boss.staggerUntil=now+1.1;boss.windupUntil=0;}const fx=runtimeScene.createObject('Spark');fx.setPosition(cover.getX()-130,cover.getY()-80);fx.setWidth(320);fx.setHeight(320);fx.__ttl=.5;fx.setZOrder(18);}}
  else message(c.completed[0]?'Cover recharging':'Repair the first terminal to power cover');
 }
}
if(boss&&b&&!boss.dead){
 const final=c.level===8,size=final?640:384;
 boss.homeY??=b.getY();boss.floor??=boss.homeY+size*.875;boss.state??='pursue';boss.until??=now+1;boss.sequence??=0;boss.direction??=-1;
 b.setWidth(size);b.setHeight(size);
 const bx=center(b),distance=Math.abs(px-bx),phase=c.bossPhase;
 const bounds=final?[2800,worldWidth-size-180]:[2900,worldWidth-size-80];
 const enter=(state,duration)=>{boss.state=state;boss.until=now+duration;};
 if(boss.hp<=0){boss.dead=true;g.score+=600;animate(b,'Defeated');c.combat.marker?.hide();for(const shot of O('EnemyBolt'))shot.deleteFromScene(runtimeScene);message('GUARDIAN DEFEATED • Reach the airlock');g.messageUntil=now+10;}
 else if(boss.shield){for(const shot of O('EnemyBolt'))if(shot.__kind!=='Plasma')shot.deleteFromScene(runtimeScene);enter('pursue',.9);boss.windupUntil=0;boss.actionUntil=0;b.setY(boss.homeY);animate(b,'Shield');c.combat.marker?.hide();}
 else{
  if(boss.state==='stagger'){animate(b,'Hurt');b.setY(boss.homeY);c.combat.marker?.hide();if(now>=boss.until)enter('recover',.9);}
  else if(boss.state==='pursue'){
   boss.direction=px<bx?-1:1;const inArena=px>bounds[0]-700;
   if(inArena&&distance>(final?310:300)){b.setX(clamp(b.getX()+boss.direction*(final?155+phase*25:105)*dt,...bounds));animate(b,'Walk');}else animate(b,'Idle');
   if(inArena&&now>=boss.until){
    const choices=final?(py<boss.floor-280?['wave','wave','leap']:distance<480?['slash','slam','slash','dash']:distance<950?['dash','leap','wave']:['wave','leap']):distance<430?['ram','missile','slam']:['missile','ram'];
    boss.attack=choices[boss.sequence++%choices.length];boss.targetX=clamp(px,bounds[0]-150,worldWidth-220);if(boss.attack==='leap')boss.targetX=clamp(px,bounds[0]+size/2,bounds[1]+size/2);boss.targetY=py;boss.startX=b.getX();boss.hit=false;boss.fired=0;boss.windupUntil=now+(final?Math.max(.75,1.1-phase*.12):1.05);enter('windup',boss.windupUntil-now);c.combat.attacks.push(boss.attack);if(c.combat.attacks.length>40)c.combat.attacks.shift();
   }
  }else if(boss.state==='windup'){
   animate(b,'Windup');const warnings={slash:'Sword sweep • jump or retreat',dash:'Sword lunge • evade the marked lane',leap:'Targeted slam • leave the marked zone',slam:'Ground slam • jump clear',wave:'Sword wave • jump or use cover',missile:'Missile salvo • move or use cover',ram:'Heavy ram • clear the marked lane'};message(warnings[boss.attack]);
   let marker=c.combat.marker;if(!marker){marker=runtimeScene.createObject('ArenaTelegraph');c.combat.marker=marker;marker.setZOrder(9);marker.setHeight(16);marker.setColor('255;100;60');}
   const range=boss.attack==='leap'?360:boss.attack==='slash'?360:boss.attack==='slam'?520:700;
   const mx=boss.attack==='slam'?bx-range/2:boss.attack==='leap'?boss.targetX-range/2:boss.direction<0?bx-range:bx;
   marker.setPosition(mx,boss.floor-16);marker.setWidth(range);marker.hide(false);marker.setOpacity(180);
   if(now>=boss.until){boss.windupUntil=0;boss.activeAt=now;boss.actionUntil=now+(boss.attack==='leap'?1.5:.78);enter('active',boss.actionUntil-now);marker.hide();}
  }else if(boss.state==='active'){
   const t=now-boss.activeAt,attack=boss.attack;
   animate(b,attack==='slash'?'Slash':attack==='dash'?'Dash':attack==='leap'&&t<.8?'Jump':attack==='leap'||attack==='slam'?'Slam':attack==='ram'?'Walk':'Shoot');
   if(attack==='ram'||attack==='dash')b.setX(clamp(b.getX()+boss.direction*(final?620:440)*dt,...bounds));
   if(attack==='leap'){
    const u=Math.min(1,t/.8);b.setX(clamp(boss.startX+(boss.targetX-size/2-boss.startX)*u,...bounds));b.setY(boss.homeY-Math.sin(u*Math.PI)*240);
    if(t>=.8&&!boss.hit){boss.hit=true;if(overlap(center(b)-250,boss.floor-110,500,110,p))c.pendingDamage+=2;for(const direction of [-1,1])bolt('Wave',center(b),boss.floor-65,center(b)+direction*600,boss.floor-65,360);}
   }else if(['slash','slam','ram','dash'].includes(attack)&&t>.22&&t<.62&&!boss.hit){
    const range=attack==='slash'?330:attack==='slam'?260:260,x=attack==='slam'?center(b)-range:boss.direction<0?center(b)-range:center(b);
    if(overlap(x,boss.floor-(attack==='slam'?100:140),attack==='slam'?range*2:range,attack==='slam'?100:140,p)){c.pendingDamage+=2;boss.hit=true;}
   }else if(attack==='wave'||attack==='missile'){
    const count=attack==='missile'?3:phase===2?2:1;
    if(boss.fired<count&&t>=.16+boss.fired*.22){const kind=attack==='missile'?'Missile':'Wave';bolt(kind,bx+boss.direction*size*.24,boss.floor-size*.35,boss.targetX,boss.targetY+(boss.fired-1)*45,attack==='missile'?400:440);boss.fired++;c.combat.shots++;}
   }
   if(now>=boss.until){b.setY(boss.homeY);enter('recover',final?1.1-phase*.1:1.25);}
  }else if(boss.state==='recover'){
   animate(b,'Exposed');if(now>=boss.until)enter('pursue',.65);
  }
  b.flipX(boss.direction>0);
  if(!['active','windup','stagger'].includes(boss.state)&&gdjs.RuntimeObject.collisionTest(p,b,false))c.pendingDamage++;
 }
}
// Always drain projectiles, even after a boss dies. Solid cover and room walls block shots.
for(const shot of O('EnemyBolt')){
 shot.__ttl=(shot.__ttl??0)-dt;shot.setPosition(shot.getX()+(shot.__vx??0)*dt,shot.getY()+(shot.__vy??0)*dt);
 const blocked=solids().some(o=>gdjs.RuntimeObject.collisionTest(shot,o,false))||O('ArenaCover').some(o=>o.__charged&&gdjs.RuntimeObject.collisionTest(shot,o,false));
 if(blocked||shot.__ttl<=0||shot.getX()<-200||shot.getX()>worldWidth+200)shot.deleteFromScene(runtimeScene);
 else if(gdjs.RuntimeObject.collisionTest(p,shot,false)){c.pendingDamage++;shot.deleteFromScene(runtimeScene);}
}
