// GDevelop JavaScript event: runs after native Platformer controls.
// Physics stay in Platformer/Platform behaviors. This block handles game rules and presentation.
// Deletion mutates GDevelop's live list. A snapshot keeps every shot/effect updated.
const objects = name => runtimeScene.getObjects(name).slice();
const player = objects('Player')[0];
if (!player) return;
const campaign=runtimeScene.__campaign;
if(runtimeScene.__animalUI?.modal || runtimeScene.__animalUI?.transitioning) return;
const input = runtimeScene.getGame().getInputManager();
const touchInput=runtimeScene.getGame().__crTouch;
const pressed=(code,action)=>input.isKeyPressed(code)||!!touchInput?.held[action]||action==='fire'&&!!touchInput?.fireRequested;
const move = player.getBehavior('Platformer');
const sceneNumber=(name,fallback)=>{const n=runtimeScene.getVariables().get(name).getAsNumber();return n>0?n:fallback;};
const worldWidth=sceneNumber('WorldWidth',4096),worldHeight=sceneNumber('WorldHeight',720);
const dt = Math.min(runtimeScene.getTimeManager().getElapsedTime() / 1000, 0.08);
const hit = (a,b) => gdjs.RuntimeObject.collisionTest(a,b,false);
const variable = (object,name) => object.getVariables().get(name);
const setText = (name,text) => {const o=objects(name)[0];if(o)o.setString(text);};
// Apply player animation once, after all movement/combat decisions are known.
let restartPlayerAnimation=false;
const animate = (object,name) => {if(object.getAnimationName()!==name)object.setAnimationName(name);};
let game = runtimeScene.__islandGame;
if (!game || runtimeScene.getTimeManager().isFirstFrame()) {
  const audio=runtimeScene.getGame().getSoundManager();for(const name of ['CR_answer_wrong','CR_answer_correct','CR_ui_click','CR_component_pickup','CR_combat_shot','CR_combat_cannon','CR_combat_impact','CR_combat_enemy_shot','CR_combat_enemy_attack','CR_combat_player_hit'])audio.loadAudio(name,false);
  game = runtimeScene.__islandGame = {
    time:0,health:campaign?.mecha?6:3,maxHealth:campaign?.mecha?6:3,shield:3,lives:3,ammo:40,coins:0,score:runtimeScene.getGame().getVariables().get('CRScore').getAsNumber(),
    state:'playing',facing:1,shotAt:-10,hurtUntil:0,invincibleUntil:0,
    deathAt:0,checkpointX:player.getX(),checkpointY:player.getY(),checkpointFeetY:player.getY()+(campaign?.mecha?168:112),checkpointActive:false,
    message:'Explore the rooms. Collect parts and repair three systems [E].',messageUntil:5,
    wasOnFloor:false,landUntil:0,cameraX:Math.max(640,Math.min(worldWidth-640,player.getX()+64)),cameraY:Math.max(360,Math.min(worldHeight-360,player.getY()+64)),totalCoins:objects('Coin').length
  };
  for(const crab of objects('Crab')) {
    crab.__patrol = {left:crab.getX()-90,right:crab.getX()+90,direction:-1,hp:2};
  }
  for(const flag of objects('Checkpoint'))flag.setColor('255;255;255');
  for(const part of objects('Coin'))part.setAnimationName('Part'+part.getVariables().get('PartId').getAsNumber());
  player.activateBehavior('Platformer',true);player.setOpacity(255);
}
game.time += dt;
// In combat sectors each key press or quick tap grants a brief shield; holding keeps it active.
const freeShield=!!campaign?.mecha&&(campaign?.level??0)>=7;
const shieldDown=!!campaign?.mecha&&pressed(75,'shield');
if(freeShield&&((shieldDown&&!game.shieldWasPressed)||touchInput?.shieldRequested))game.shieldUntil=game.time+.6;
game.shieldWasPressed=shieldDown;
const shieldActive=!!campaign?.mecha&&(freeShield?(shieldDown||game.time<(game.shieldUntil??0)):(shieldDown&&game.shield>.05));
if(touchInput)touchInput.shieldRequested=false;
const notice=(text,seconds=3)=>{game.message=text;game.messageUntil=game.time+seconds;};
function effect(name,x,y,w=48,h=48,life=.15){
  const o=runtimeScene.createObject(name);if(!o)return;
  o.setPosition(x,y);o.setWidth(w);o.setHeight(h);o.setZOrder(20);o.__ttl=life;return o;
}
function killCrab(crab){if(crab.__patrol.deadAt!==undefined)return;effect('Impact',crab.getX(),crab.getY(),80,80,.18);crab.__patrol.deadAt=game.time;crab.activateBehavior('Platformer',false);animate(crab,'Death');game.score+=50;}
function die(){
  if(game.state!=='playing')return;
  game.state='dying';game.lives--;game.deathAt=game.time;
  move.setCurrentSpeed(0);move.setCurrentFallSpeed(0);
  player.activateBehavior('Platformer',false);player.setOpacity(255);
  for(const name of ['Bullet','EnemyBolt','Muzzle'])for(const shot of objects(name))shot.deleteFromScene(runtimeScene);
}
function damage(amount){
  if(game.state!=='playing'||game.time<game.invincibleUntil)return;
  if(shieldActive)return;
  runtimeScene.getGame().getSoundManager().playSound('CR_combat_player_hit',false,100,1);
  game.health=Math.max(0,game.health-Math.min(2,amount));game.invincibleUntil=game.time+1.3;
  game.hurtUntil=game.time+(campaign?.mecha ? .8 : .42);
  move.setCurrentSpeed(-game.facing*180);
  if(game.health===0)die();
}
if(campaign?.pendingDamage){damage(campaign.pendingDamage);campaign.pendingDamage=0;}
if(game.state==='playing'){
  if(campaign?.mecha){
    game.maxHealth=6;player.setWidth(192);player.setHeight(192);
    game.shield=freeShield?3:Math.max(0,Math.min(3,game.shield+(shieldDown?-dt:dt*.4)));
  }
  const speed=move.getCurrentSpeed();
  const manualSteering=[37,39,65,68].some(code=>input.isKeyPressed(code))||touchInput?.held.left||touchInput?.held.right;
  if(Math.abs(speed)>5&&game.time>=game.hurtUntil&&(!move.isOnLadder()||manualSteering))game.facing=speed<0?-1:1;
  player.flipX(!move.isOnLadder()&&game.facing<0);
  const onFloor=move.isOnFloor();
  if(onFloor&&!game.wasOnFloor)game.landUntil=game.time+(campaign?.mecha ? .8 : .34);
  if(!onFloor||Math.abs(speed)>5)game.landUntil=0;
  game.wasOnFloor=onFloor;
  // Steady translucency communicates invulnerability without rapid flashing.
  player.setOpacity(game.time<game.invincibleUntil?180:255);
  // Hold J or X to shoot. A cooldown and finite ammunition prevent unlimited fire.
  if((pressed(74,'fire')||input.isKeyPressed(88))&&game.time-game.shotAt>=(campaign?.mecha ? .85 : .52)&&(campaign?.mecha||game.ammo>0)&&game.time>=game.hurtUntil){
    game.shotAt=game.time;if(!campaign?.mecha)game.ammo--;restartPlayerAnimation=true;
    runtimeScene.getGame().getSoundManager().playSound(campaign?.mecha?'CR_combat_cannon':'CR_combat_shot',false,100,1);
    const bullet=runtimeScene.createObject('Bullet');
    const mecha=!!campaign?.mecha,powerShot=mecha&&(campaign?.level??0)>=7,bulletW=powerShot?120:mecha?80:30,bulletH=powerShot?72:mecha?48:12;
    // Anchor the cannon flash at the muzzle, not the unscaled small-player height.
    const muzzleX=player.getX()+(mecha?(game.facing>0?150:42):(game.facing>0?92:22));
    const muzzleY=player.getY()+(mecha?112:52);
    const shotX=mecha&&game.facing<0?muzzleX-bulletW:muzzleX;
    bullet.setPosition(shotX,muzzleY-bulletH/2);bullet.setWidth(bulletW);bullet.setHeight(bulletH);if(mecha)bullet.setAnimationName('Cannon');
    bullet.setZOrder(12);bullet.flipX(game.facing<0);bullet.__velocity=game.facing*780;bullet.__ttl=1.5;bullet.__spawnedAt=game.time;
    const flash=effect('Muzzle',muzzleX-20,muzzleY-18,40,36,.09);if(flash)flash.flipX(game.facing<0);
  }
  // Guards and hostile projectiles run in the combat event after these player decisions.
  const bulletSolids=[...objects('Ground'),...objects('Bulkhead'),...objects('Ledge').filter(o=>o.isVisible()),...['RouteGate','ShortcutGate'].flatMap(name=>objects(name).filter(o=>o.isVisible()))];
  for(const bullet of objects('Bullet')){
    // Let a freshly fired projectile appear for a frame before it can hit anything.
    if(bullet.__spawnedAt===game.time)continue;
    bullet.__ttl=(bullet.__ttl??0)-dt;
    let destroyed=bullet.__ttl<=0;
    // Sample the native collision masks along the whole movement, including the muzzle.
    // Terrain wins ties, so a target behind a wall cannot absorb a shot through it.
    const dx=(bullet.__velocity??0)*dt,steps=Math.max(1,Math.ceil(Math.abs(dx)/6)),startX=bullet.getX();
    for(let step=0;step<=steps&&!destroyed;step++){
    bullet.setX(startX+dx*step/steps);
    destroyed=bulletSolids.some(terrain=>hit(bullet,terrain));
    for(const crab of objects('Crab'))if(!destroyed&&crab.__patrol.deadAt===undefined&&hit(bullet,crab)){
      runtimeScene.getGame().getSoundManager().playSound('CR_combat_impact',false,100,1);
      crab.__patrol.hp-=campaign?.mecha&&(campaign?.level??0)>=7?2:1;crab.__patrol.hurtUntil=game.time+.7;effect('Impact',bullet.getX(),bullet.getY()-12,36,36,.12);
      if(crab.__patrol.hp<=0)killCrab(crab);destroyed=true;
    }
    const boss=objects('CoreBoss')[0];
    if(!destroyed&&boss&&campaign?.boss&&!campaign.boss.dead&&hit(bullet,boss)){
      destroyed=true;
      runtimeScene.getGame().getSoundManager().playSound('CR_combat_impact',false,100,1);
      if(!campaign.boss.shield){const hitPower=campaign?.mecha&&campaign?.level===8?20:campaign?.mecha&&(campaign?.level??0)>=7?12:1,bonus=campaign.level===8?1:['recover','stagger'].includes(campaign.boss.state)?2:1;campaign.boss.hp=Math.max(0,campaign.boss.hp-hitPower*bonus);campaign.boss.flashUntil=game.time+.28;effect('Impact',bullet.getX()-8,bullet.getY()-8,88,88,.22);
      }else notice(campaign.level===8?'Complete all 3 challenges before attacking.':'Shield active! Repair the terminal first.',2);
    }
    }
    if(destroyed)bullet.deleteFromScene(runtimeScene);
  }
  for(const coin of objects('Coin'))if(hit(player,coin)){
    runtimeScene.getGame().getSoundManager().playSound('CR_component_pickup',false,85,1);
    game.coins++;game.score+=10;effect('Spark',coin.getX(),coin.getY(),36,36,.16);coin.deleteFromScene(runtimeScene);notice('Component recovered: '+game.coins+'/3');
  }
  for(const supply of objects('Ammo'))if(hit(player,supply)&&(campaign?.mecha?game.shield<3:game.ammo<40)){
    runtimeScene.getGame().getSoundManager().playSound('CR_component_pickup',false,85,1);
    if(campaign?.mecha){game.shield=Math.min(3,game.shield+1.5);notice('Shield energy restored');}else {game.ammo=Math.min(40,game.ammo+8);notice('+8 ammunition');}supply.deleteFromScene(runtimeScene);
  }
  for(const heart of objects('HealthPickup'))if(game.health<game.maxHealth&&hit(player,heart)){
    runtimeScene.getGame().getSoundManager().playSound('CR_component_pickup',false,85,1);
    game.health=Math.min(game.maxHealth,game.health+1);heart.deleteFromScene(runtimeScene);notice('Health restored');
  }
  const flag=objects('Checkpoint')[0];
  if(flag&&!game.checkpointActive&&hit(player,flag)){
    game.checkpointActive=true;game.checkpointX=flag.getX();game.checkpointFeetY=flag.getVariables().get('FloorY').getAsNumber()||flag.getY()+flag.getHeight();game.checkpointY=game.checkpointFeetY-(campaign?.mecha?168:112);game.health=game.maxHealth;
    flag.setColor('140;255;170');notice('Checkpoint saved. Health restored.',4);
  }
  const exit=objects('ExitDoor')[0];
  if(exit&&hit(player,exit)){
    if(campaign?.solved&&(campaign.level!==6||campaign.boarded)&&(!campaign.boss||campaign.boss.dead)){game.state='won';move.setCurrentSpeed(0);player.activateBehavior('Platformer',false);}
    else notice(campaign?.boss&&!campaign.boss.dead?'Defeat the guardian before leaving.':campaign?.level===6&&campaign.solved?'Board your mecha [E] before leaving.':'Complete the circuit mission at the terminal [E].',2);
  }
  if(player.getY()>worldHeight+200){game.health=0;die();}
  const bodyLeft=campaign?.mecha?36:45,bodyRight=campaign?.mecha?156:83;
  player.setX(Math.max(-bodyLeft,Math.min(worldWidth-bodyRight,player.getX())));
}
if(game.state==='dying'){
  if(game.time-game.deathAt>1){
    if(game.lives<=0)game.state='gameover';
    else {
      game.state='playing';game.health=game.maxHealth;game.ammo=Math.max(8,game.ammo);
      // A checkpoint stores its support surface, not the previous robot's height.
      game.checkpointY=game.checkpointFeetY-(campaign?.mecha?168:112);
      player.setPosition(game.checkpointX,game.checkpointY);
      player.activateBehavior('Platformer',true);move.setCurrentSpeed(0);move.setCurrentFallSpeed(0);
      if(campaign)campaign.pendingDamage=0;
      for(const name of ['Bullet','EnemyBolt'])for(const shot of objects(name))shot.deleteFromScene(runtimeScene);
      game.invincibleUntil=game.time+2;game.hurtUntil=0;game.landUntil=0;game.shotAt=-10;game.wasOnFloor=false;
      notice('Try again! '+game.lives+' lives remaining.');
    }
  }
}
// Remove transient visual effects. Bullets are handled separately above.
for(const name of ['Muzzle','Impact','Spark'])for(const o of objects(name)){
  o.__ttl-=dt;if(o.__ttl<=0)o.deleteFromScene(runtimeScene);
}
if(game.state!=='playing')for(const crab of objects('Crab'))crab.getBehavior('Platformer').setCurrentSpeed(0);
const targetZoom=campaign?.level===8&&player.getX()>2700 ? .75:1;game.cameraZoom=(game.cameraZoom??1)+(targetZoom-(game.cameraZoom??1))*(1-Math.exp(-dt*4));runtimeScene.getLayer('').setCameraZoom(game.cameraZoom);
const halfW=640/game.cameraZoom,halfH=360/game.cameraZoom;
const cameraBoss=objects('CoreBoss')[0],playerCenter=player.getX()+player.getWidth()/2;
const focusX=campaign?.level===8&&cameraBoss&&!campaign.boss?.dead&&!campaign.boss?.shield&&Math.abs(cameraBoss.getX()+cameraBoss.getWidth()/2-playerCenter)<1350?(playerCenter+cameraBoss.getX()+cameraBoss.getWidth()/2)/2:playerCenter;
const targetX=Math.max(halfW,Math.min(worldWidth-halfW,focusX));
const targetY=Math.max(halfH,Math.min(worldHeight-halfH,player.getY()+player.getHeight()/2-40));
// A single animation choice prevents competing state changes from restarting frames.
const grounded=move.isOnFloor(),moving=Math.abs(move.getCurrentSpeed())>5;
const onRail=move.isOnLadder(),climbing=onRail&&(input.isKeyPressed(38)||input.isKeyPressed(40)||input.isKeyPressed(87)||input.isKeyPressed(83)||touchInput?.held.climbUp||touchInput?.held.climbDown);
let playerAction=game.state==='dying'||game.state==='gameover'?'Death':
 game.state==='won'?'Idle':shieldActive?'Shield':
 game.time<game.hurtUntil?'Hurt':
 onRail?'Climb':
 !grounded?(move.isFalling()?'Fall':'Jump'):
 moving?'Run':game.time-game.shotAt<(campaign?.mecha ? .85 : .52)?'Shoot':
 game.time<game.landUntil?'Land':'Idle';
if(campaign?.mecha)playerAction='Mecha'+playerAction;
if(player.getAnimationName()!==playerAction)player.setAnimationName(playerAction);
// Several original mecha frames contain detached pixels from a neighboring sprite.
// Clip only their transparent/contaminated top strip in the renderer; physics remains unchanged.
if(typeof PIXI!=='undefined'&&player.getRendererObject){
 const sprite=player.getRendererObject();
 const needsClip=campaign?.mecha&&['MechaRun','MechaJump','MechaShoot','MechaShield'].includes(playerAction);
 if(needsClip){
  let clip=player.__mechaArtClip;
  if(!clip){clip=new PIXI.Graphics();sprite.addChild(clip);player.__mechaArtClip=clip;}
  clip.visible=true;
  const tw=sprite.texture.orig.width,th=sprite.texture.orig.height,ax=sprite.anchor.x*tw,ay=sprite.anchor.y*th;
  clip.clear();clip.beginFill(0xffffff);clip.drawRect(-ax,48-ay,tw,th-48);clip.endFill();
  if(sprite.mask!==clip)sprite.mask=clip;
 }else if(player.__mechaArtClip){sprite.mask=null;player.__mechaArtClip.visible=false;}
}

if(onRail&&!climbing)player.pauseAnimation();else player.playAnimation();
if(restartPlayerAnimation&&playerAction.endsWith('Shoot'))player.setAnimationFrame(0);
const playerSize=campaign?.mecha?192:128;
if(player.getWidth()!==playerSize)player.setWidth(playerSize);
if(player.getHeight()!==playerSize)player.setHeight(playerSize);
game.cameraX+=(targetX-game.cameraX)*(1-Math.exp(-dt*8));
game.cameraY+=(targetY-game.cameraY)*(1-Math.exp(-dt*7));
runtimeScene.getLayer('').setCameraX(game.cameraX);runtimeScene.getLayer('').setCameraY(game.cameraY);
for(const name of ['Background','HUD']){runtimeScene.getLayer(name).setCameraX(640);runtimeScene.getLayer(name).setCameraY(360);}
if(touchInput)touchInput.fireRequested=false;
for(let i=0;i<objects('HUDHeart').length;i++)animate(objects('HUDHeart')[i],i<(campaign?.mecha?Math.ceil(game.health/2):game.health)?'Full':'Empty');
setText('HUDMessage',game.time<game.messageUntil?game.message:'');
// Save the completed run, then show the dedicated ending screen.
if(game.state==='won'||game.state==='gameover'){
 const global=runtimeScene.getGame().getVariables();
 for(const [name,value]of Object.entries({AHLastScore:game.score,AHLastCoins:game.coins,AHLastTotalCoins:game.totalCoins,AHLastLives:game.lives,AHLastAmmo:game.ammo}))global.get(name).setNumber(value);
 if(game.state==='won'&&runtimeScene.getGame().__crJourney){global.get('CRScore').setNumber(game.score);return;}
 runtimeScene.getTimeManager().setTimeScale(1);
 let destination='game over';
 if(game.state==='won'){
   global.get('CRScore').setNumber(game.score);
   const next=(campaign?.level??8)+1;
   if(next<=8){global.get('CRResumeLevel').setNumber(next);global.get('CRUnlocked').setNumber(Math.max(next,global.get('CRUnlocked').getAsNumber()));destination='sector'+next;}
   else {destination='winner';global.get('CRResumeLevel').setNumber(1);global.get('CRUnlocked').setNumber(8);}
 }
 gdjs.evtTools.runtimeScene.replaceScene(runtimeScene,destination,false);
 return;
}
const animationOverride=game.state!=='playing'?'Locked':game.time<game.hurtUntil?'Hurt':game.time-game.shotAt<(campaign?.mecha ? .85 : .52)?'Shoot':game.time<game.landUntil?'Land':campaign?.mecha?'Mecha':'';
for(const [name,value]of Object.entries({Health:game.health,Lives:game.lives,Ammo:game.ammo,Coins:game.coins,Score:game.score,CheckpointActive:game.checkpointActive,GameState:game.state,AnimationOverride:animationOverride})){
 const v=runtimeScene.getVariables().get(name);if(typeof value==='number')v.setNumber(value);else if(typeof value==='boolean')v.setBoolean(value);else v.setString(value);
}
