// GDevelop event: native sprite presentation of authoritative server snapshots.
{
  const s=runtimeScene.__missionClient,m=s.mission,l=s.level;
  s.object??=(id,type,x,y)=>{let o=s.objects.get(id);if(!o){o=runtimeScene.createObject(type);s.objects.set(id,o);}o.setPosition(x,y);return o;};
  if(m&&l){
    const p=m.player,frozen=m.paused||m.status!=='running',now=performance.now();
    const frameMs=Math.min(50,Math.max(0,now-(s.presentedAt||now)));s.presentedAt=now;
    const previous=s.lastPresentedPlayer,reset=previous?.attemptId!==m.attemptId;
    s.visualPlayer??={x:p.x,y:p.y};const visual=s.visualPlayer;
    if(reset||frozen||Math.hypot(visual.x-p.x,visual.y-p.y)>120){visual.x=p.x;visual.y=p.y;}
    else{const blend=1-Math.exp(-frameMs/45);visual.x+=(p.x-visual.x)*blend;visual.y+=(p.y-visual.y)*blend;}
    const player=s.object('hero','MissionPlayer',visual.x,visual.y);
    player.setZOrder(20);player.flipX(p.facing<0);
    // A short hit reaction is separate from the longer damage immunity window.
    player.setOpacity(p.invulnerableMs>0&&Math.floor(m.elapsedMs/120)%2?190:255);
    if(previous?.attemptId===m.attemptId&&!previous.grounded&&p.grounded&&m.status==='running')s.landUntil=m.elapsedMs+90;
    const animation=m.status==='briefing'?'idle':m.status==='failed'&&m.reason==='death'?'defeat':p.hurtMs>0?'hurt':p.dashMs>0?'dash':!p.grounded?(p.vy<-25?'jump':'fall'):Math.abs(p.vx)>1?'run':m.elapsedMs<(s.landUntil||0)?'land':'idle';
    if(player.getAnimationName()!==animation)player.setAnimationName(animation);
    // Airborne poses hold a readable frame; locomotion is never replaced by Shoot.
    if(animation==='jump'||animation==='fall')player.setAnimationFrame(0);
    player.setAnimationSpeedScale(frozen||animation==='jump'||animation==='fall'?0:1);
    if(animation==='defeat')player.setAnimationFrame(Math.min(7,Math.floor((performance.now()-(s.defeatStart??=performance.now()))/100)));else s.defeatStart=null;
    s.lastPresentedPlayer={attemptId:m.attemptId,grounded:p.grounded};
    const w=l.weapon,gun=s.object('rifle','MissionRifle',visual.x+(p.facing>0?w.gunRight:w.gunLeft),visual.y+w.gunY);
    gun.flipX(p.facing<0);gun.setZOrder(21);gun.hide(m.status==='failed');gun.setAnimationSpeedScale(frozen?0:1);
    const displayTime=m.elapsedMs+(frozen?0:Math.min(50,now-s.receivedAt)),sinceShot=displayTime-p.lastShotAt,flash=s.object('muzzle','MissionMuzzle',visual.x+(p.facing>0?w.muzzleRight:w.muzzleLeft)-20,visual.y+w.muzzleY-12);
    flash.flipX(p.facing<0);flash.setZOrder(22);flash.hide(sinceShot<0||sinceShot>=100||m.status!=='running');flash.setAnimationSpeedScale(0);flash.setAnimationFrame(Math.min(7,Math.max(0,Math.floor(sinceShot/14))));
    s.object('feed-a','MissionSwitch',l.feedA.x-16,l.feedA.y).setAnimation(m.feedA?1:0);
    s.object('feed-b','MissionSwitch',l.feedB.x-16,l.feedB.y).setAnimation(m.feedB&&m.fuseInstalled?1:0);
    s.object('fuse','MissionFuse',l.fuse.x,l.fuse.y).hide(m.fuseCollected);
    s.object('console','MissionConsole',l.console.x-16,l.console.y);
    s.object('charge','MissionCharge',l.console.x+28,l.console.y+16).setAnimation(m.defused?1:0);
    s.object('gate','MissionDoor',l.gate.x,l.gate.y).setAnimation(m.defused?1:0);
    s.object('lift','MissionLift',l.exit.x,l.exit.y);s.object('log','MissionLog',l.log.x,l.log.y).hide(m.logCollected);
    const live=new Set();
    for(const e of m.enemies){const id='enemy-'+e.id,o=s.object(id,'MissionEnemy',e.x,e.y);o.flipX(e.dir<0);o.setZOrder(18);const anim=e.hp<=0?'defeat':e.hurtMs>0?'hurt':e.mode==='windup'?'windup':e.mode==='attack'?'attack':'walk';if(o.getAnimationName()!==anim)o.setAnimationName(anim);if(e.hp<=0)o.setAnimationFrame(Math.min(3,Math.floor(e.defeatMs/125)));o.setAnimationSpeedScale(frozen?0:1);}
    for(const shot of m.projectiles){const id='shot-'+shot.id;live.add(id);const o=s.object(id,'MissionPulse',shot.x,shot.y);o.setWidth(shot.w);o.setHeight(shot.h);o.setZOrder(23);}
    for(const [id,o]of s.objects)if(id.startsWith('shot-')&&!live.has(id)){o.deleteFromScene(runtimeScene);s.objects.delete(id);}
    s.cameraX=Math.max(320,Math.min(l.width-320,visual.x+112));const layer=runtimeScene.getLayer('');layer.setCameraZoom(1.5);layer.setCameraX(s.cameraX);layer.setCameraY(344);
    const background=runtimeScene.getLayer('Backdrop');background.setCameraZoom(1.5);background.setCameraX(s.cameraX*0.35);background.setCameraY(344);
    for(const name of ['BackWall','CopperWall'])for(const o of runtimeScene.getObjects(name))o.setOpacity(name==='BackWall'?60:95);
    for(const name of ['DockWindow','Decor_dock_habitat','Decor_antenna'])for(const o of runtimeScene.getObjects(name))if(o.getLayer()==='Backdrop')o.setOpacity(95);
  }
}
