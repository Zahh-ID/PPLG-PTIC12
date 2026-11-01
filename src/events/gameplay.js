// GDevelop JavaScript event: runs after native Platformer controls.
// Physics stay in Platformer/Platform behaviors. This block handles game rules and presentation.
const objects = name => runtimeScene.getObjects(name);
const player = objects('Player')[0];
if (!player) return;
const campaign=runtimeScene.__campaign;
if(runtimeScene.__animalUI?.modal || runtimeScene.__animalUI?.transitioning) return;
const input = runtimeScene.getGame().getInputManager();
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
  game = runtimeScene.__islandGame = {
    time:0,health:campaign?.mecha?6:3,maxHealth:campaign?.mecha?6:3,shield:3,lives:3,ammo:40,coins:0,score:runtimeScene.getGame().getVariables().get('CRScore').getAsNumber(),key:false,
    state:'playing',facing:1,shotAt:-10,hurtUntil:0,invincibleUntil:0,
    deathAt:0,checkpointX:player.getX(),checkpointY:player.getY(),checkpointActive:false,
    message:'Explore the rooms. Collect parts and repair three systems [E].',messageUntil:5,
    wasOnFloor:false,landUntil:0,cameraX:Math.max(640,Math.min(worldWidth-640,player.getX()+64)),cameraY:Math.max(360,Math.min(worldHeight-360,player.getY()+64)),totalCoins:objects('Coin').length
  };
  for(const crab of objects('Crab')) {
    crab.__patrol = {left:crab.getX()-90,right:crab.getX()+90,direction:-1,hp:2};
  }
  for(const chest of objects('Chest')){chest.__opened=false;chest.setAnimationName('Closed');}
  for(const flag of objects('Checkpoint'))flag.setColor('255;255;255');
  player.activateBehavior('Platformer',true);player.setOpacity(255);
}
game.time += dt;
const notice=(text,seconds=3)=>{game.message=text;game.messageUntil=game.time+seconds;};
function effect(name,x,y,w=48,h=48,life=.15){
  const o=runtimeScene.createObject(name);if(!o)return;
  o.setPosition(x,y);o.setWidth(w);o.setHeight(h);o.setZOrder(20);o.__ttl=life;
}
function killCrab(crab){effect('Impact',crab.getX(),crab.getY(),80,80,.18);crab.deleteFromScene(runtimeScene);game.score+=50;}
function die(){
  if(game.state!=='playing')return;
  game.state='dying';game.lives--;game.deathAt=game.time;
  move.setCurrentSpeed(0);move.setCurrentFallSpeed(0);
  player.activateBehavior('Platformer',false);player.setOpacity(255);
}
function damage(amount){
  if(game.state!=='playing'||game.time<game.invincibleUntil)return;
  if(campaign?.mecha&&input.isKeyPressed(75)&&game.shield>.05)return;
  game.health=Math.max(0,game.health-amount);game.invincibleUntil=game.time+1.3;
  game.hurtUntil=game.time+(campaign?.mecha ? .8 : .42);
  move.setCurrentSpeed(-game.facing*180);
  if(game.health===0)die();
}
if(campaign?.pendingDamage){damage(campaign.pendingDamage);campaign.pendingDamage=0;}
if(game.state==='playing'){
  if(campaign?.mecha){
    game.maxHealth=6;player.setWidth(192);player.setHeight(192);
    game.shield=Math.max(0,Math.min(3,game.shield+(input.isKeyPressed(75)?-dt:dt*.4)));
  }
  const speed=move.getCurrentSpeed();
  if(Math.abs(speed)>5)game.facing=speed<0?-1:1;
  player.flipX(game.facing<0);
  const onFloor=move.isOnFloor();
  if(onFloor&&!game.wasOnFloor)game.landUntil=game.time+(campaign?.mecha ? .8 : .34);
  if(!onFloor||Math.abs(speed)>5)game.landUntil=0;
  game.wasOnFloor=onFloor;
  // Steady translucency communicates invulnerability without rapid flashing.
  player.setOpacity(game.time<game.invincibleUntil?180:255);
  // Hold J or X to shoot. A cooldown and finite ammunition prevent unlimited fire.
  if((input.isKeyPressed(74)||input.isKeyPressed(88))&&game.time-game.shotAt>=(campaign?.mecha ? .85 : .52)&&(campaign?.mecha||game.ammo>0)&&game.time>=game.hurtUntil){
    game.shotAt=game.time;if(!campaign?.mecha)game.ammo--;restartPlayerAnimation=true;
    const bullet=runtimeScene.createObject('Bullet');
    const scale=campaign?.mecha?1.5:1;
    const handX=player.getX()+(game.facing>0?92:22)*scale;
    bullet.setPosition(handX,player.getY()+62*scale);bullet.setWidth(campaign?.mecha?50:30);bullet.setHeight(campaign?.mecha?22:12);
    bullet.setZOrder(12);bullet.flipX(game.facing<0);bullet.__velocity=game.facing*780;bullet.__ttl=1.5;
    effect('Muzzle',handX-10,player.getY()+46,40,36,.09);
  }
  // Crabs use the same Platformer engine for gravity and ground contact.
  for(const crab of objects('Crab')){
    const patrol=crab.__patrol;if(!patrol)continue;
    if(crab.getX()<=patrol.left)patrol.direction=1;
    if(crab.getX()>=patrol.right)patrol.direction=-1;
    const behavior=crab.getBehavior('Platformer');
    if(patrol.direction<0)behavior.simulateLeftKey();else behavior.simulateRightKey();
    crab.flipX(patrol.direction<0);
    if(hit(player,crab)){
      const feet=player.getY()+player.getHeight()*.875;
      const droneTop=crab.getY()+crab.getHeight()*26/128;
      if(move.isFalling()&&feet<droneTop+22){killCrab(crab);move.setCurrentFallSpeed(-380);}
      else damage(1);
    }
  }
  for(const bullet of objects('Bullet')){
    bullet.setX(bullet.getX()+bullet.__velocity*dt);bullet.__ttl-=dt;
    let destroyed=bullet.__ttl<=0;
    for(const crab of objects('Crab'))if(!destroyed&&hit(bullet,crab)){
      crab.__patrol.hp--;effect('Impact',bullet.getX(),bullet.getY()-12,36,36,.12);
      if(crab.__patrol.hp<=0)killCrab(crab);destroyed=true;
    }
    const boss=objects('CoreBoss')[0];
    if(!destroyed&&boss&&campaign?.boss&&!campaign.boss.dead&&hit(bullet,boss)){
      destroyed=true;
      if(!campaign.boss.shield){campaign.boss.hp--;campaign.boss.flashUntil=game.time+.2;
        if(campaign.level===8&&campaign.boss.hp>0&&campaign.boss.hp<=(campaign.bossPhase===0?24:campaign.bossPhase===1?12:-1)){
          campaign.bossPhase++;campaign.boss.shield=true;campaign.solved=false;campaign.activeTerminalId=campaign.bossPhase;campaign.board=campaign.boards[campaign.bossPhase]??null;
          objects('MissionTerminal').find(o=>o.getVariables().get('TerminalId').getAsNumber()===campaign.bossPhase)?.setAnimationName('Off');notice('SHIELD RESTORED • Find '+campaign.tasks[campaign.bossPhase].title+' [E]',6);
        }
      }else notice('Shield active! Repair the terminal first.',2);
    }
    for(const terrain of [...objects('Ground'),...objects('Ledge'),...objects('RouteGate').filter(o=>o.isVisible())])if(!destroyed&&hit(bullet,terrain))destroyed=true;
    if(destroyed)bullet.deleteFromScene(runtimeScene);
  }
  for(const coin of objects('Coin'))if(hit(player,coin)){
    game.coins++;game.score+=10;effect('Spark',coin.getX(),coin.getY(),36,36,.16);coin.deleteFromScene(runtimeScene);notice('Component recovered: '+game.coins+'/3');
  }
  for(const supply of objects('Ammo'))if(hit(player,supply)){
    game.ammo=Math.min(40,game.ammo+8);supply.deleteFromScene(runtimeScene);notice('+8 ammunition');
  }
  for(const heart of objects('HealthPickup'))if(game.health<game.maxHealth&&hit(player,heart)){
    game.health=Math.min(game.maxHealth,game.health+1);heart.deleteFromScene(runtimeScene);notice('Health restored');
  }
  for(const key of objects('Key'))if(hit(player,key)){
    game.key=true;game.score+=50;key.deleteFromScene(runtimeScene);notice('Keycard found! It opens the hidden credits chest.',5);
  }
  const flag=objects('Checkpoint')[0];
  if(flag&&!game.checkpointActive&&hit(player,flag)){
    game.checkpointActive=true;game.checkpointX=flag.getX();game.checkpointY=flag.getY()+flag.getHeight()-(campaign?.mecha?168:112);game.health=game.maxHealth;
    flag.setColor('140;255;170');notice('Checkpoint saved. Health restored.',4);
  }
  for(const chest of objects('Chest'))if(!chest.__opened&&hit(player,chest)){
    if(game.key){
      chest.__opened=true;animate(chest,'Open');game.score+=100;game.ammo=Math.min(40,game.ammo+8);notice('Treasure found! +100 score and +8 ammo');
      const ui=runtimeScene.__animalUI;
      if(ui){ui.modal='treasure';ui.treasureShownAt=Date.now();ui.creditsReturnTo='';runtimeScene.getTimeManager().setTimeScale(0);}
    }
    else notice('This chest needs the keycard.',1);
  }
  const exit=objects('ExitDoor')[0];
  if(exit&&hit(player,exit)){
    if(campaign?.solved&&(campaign.level!==6||campaign.boarded)&&(!campaign.boss||campaign.boss.dead)){game.state='won';move.setCurrentSpeed(0);player.activateBehavior('Platformer',false);}
    else notice(campaign?.boss&&!campaign.boss.dead?'Defeat the guardian before leaving.':campaign?.level===6&&campaign.solved?'Board your mecha [E] before leaving.':'Complete the circuit mission at the terminal [E].',2);
  }
  if(player.getY()>worldHeight+200){game.health=0;die();}
  player.setX(Math.max(-35,Math.min(worldWidth-96,player.getX())));
}
if(game.state==='dying'){
  if(game.time-game.deathAt>1){
    if(game.lives<=0)game.state='gameover';
    else {
      game.state='playing';game.health=game.maxHealth;game.ammo=Math.max(8,game.ammo);
      player.setPosition(game.checkpointX,game.checkpointY);
      player.activateBehavior('Platformer',true);move.setCurrentSpeed(0);move.setCurrentFallSpeed(0);
      game.invincibleUntil=game.time+1.5;game.hurtUntil=0;game.landUntil=0;game.shotAt=-10;
      notice('Try again! '+game.lives+' lives remaining.');
    }
  }
}
// Remove transient visual effects. Bullets are handled separately above.
for(const name of ['Muzzle','Impact','Spark'])for(const o of objects(name)){
  o.__ttl-=dt;if(o.__ttl<=0)o.deleteFromScene(runtimeScene);
}
if(game.state!=='playing')for(const crab of objects('Crab'))crab.getBehavior('Platformer').setCurrentSpeed(0);
const targetX=Math.max(640,Math.min(worldWidth-640,player.getX()+player.getWidth()/2));
const targetY=Math.max(360,Math.min(worldHeight-360,player.getY()+player.getHeight()/2-40));
// A single animation choice prevents competing state changes from restarting frames.
const grounded=move.isOnFloor(),moving=Math.abs(move.getCurrentSpeed())>5;
let playerAction=game.state==='dying'||game.state==='gameover'?'Death':
 game.state==='won'?'Idle':game.time<game.hurtUntil?'Hurt':
 game.time-game.shotAt<(campaign?.mecha ? .85 : .52)?'Shoot':
 campaign?.mecha&&input.isKeyPressed(75)&&game.shield>0?'Shield':
 !grounded?(move.isFalling()?'Fall':'Jump'):
 !moving&&game.time<game.landUntil?'Land':moving?'Run':'Idle';
if(campaign?.mecha)playerAction='Mecha'+playerAction;
if(player.getAnimationName()!==playerAction)player.setAnimationName(playerAction);
if(restartPlayerAnimation)player.setAnimationFrame(0);
const playerSize=campaign?.mecha?192:128;
if(player.getWidth()!==playerSize)player.setWidth(playerSize);
if(player.getHeight()!==playerSize)player.setHeight(playerSize);
game.cameraX+=(targetX-game.cameraX)*(1-Math.exp(-dt*8));
game.cameraY+=(targetY-game.cameraY)*(1-Math.exp(-dt*7));
runtimeScene.getLayer('').setCameraX(game.cameraX);runtimeScene.getLayer('').setCameraY(game.cameraY);
for(const name of ['Background','HUD']){runtimeScene.getLayer(name).setCameraX(640);runtimeScene.getLayer(name).setCameraY(360);}
for(let i=0;i<objects('HUDHeart').length;i++)animate(objects('HUDHeart')[i],i<(campaign?.mecha?Math.ceil(game.health/2):game.health)?'Full':'Empty');
setText('HUDMessage',game.time<game.messageUntil?game.message:'');
// Save the completed run, then show the dedicated ending screen.
if(game.state==='won'||game.state==='gameover'){
 const global=runtimeScene.getGame().getVariables();
 for(const [name,value]of Object.entries({AHLastScore:game.score,AHLastCoins:game.coins,AHLastTotalCoins:game.totalCoins,AHLastLives:game.lives,AHLastAmmo:game.ammo}))global.get(name).setNumber(value);
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
for(const [name,value]of Object.entries({Health:game.health,Lives:game.lives,Ammo:game.ammo,Coins:game.coins,Score:game.score,HasKey:game.key,CheckpointActive:game.checkpointActive,GameState:game.state,AnimationOverride:animationOverride})){
 const v=runtimeScene.getVariables().get(name);if(typeof value==='number')v.setNumber(value);else if(typeof value==='boolean')v.setBoolean(value);else v.setString(value);
}
