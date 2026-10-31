// Isolated native GDevelop art review: no DOM, network mutations or campaign saves.
{
  gdjs.__proofScene=runtimeScene;
  const first=name=>runtimeScene.getObjects(name)[0],objects=name=>runtimeScene.getObjects(name);
  const input=runtimeScene.getGame().getInputManager();
  let proof=runtimeScene.__assetProof;
  if(!proof){proof=runtimeScene.__assetProof={state:createAssetProof(),keys:{},phase:0,shots:new Map()};window.__assetProof=proof;}
  const edge=code=>{const down=input.isKeyPressed(code),hit=(down||input.wasKeyReleased(code))&&!proof.keys[code];proof.keys[code]=down;return hit;};
  const interact=edge(69),pause=edge(27),reset=edge(82),nativeReset=runtimeScene.getVariables().get('ProofReset');
  if(reset||nativeReset.getAsBoolean()){proof.state=createAssetProof();proof.phase=0;nativeReset.setBoolean(false);for(const o of proof.shots.values())o.deleteFromScene(runtimeScene);proof.shots.clear();}
  const s=proof.state;if(pause)s.paused=!s.paused;if(interact)proofAction(s);
  const dt=runtimeScene.getTimeManager().getElapsedTime()/1000;
  const mx=gdjs.evtTools.input.getMouseX(runtimeScene,'HUD',0),my=gdjs.evtTools.input.getMouseY(runtimeScene,'HUD',0);
  const replayHover=mx>=888&&mx<=936&&my>=16&&my<=64;
  advanceAssetProof(s,{left:input.isKeyPressed(37)||input.isKeyPressed(65),right:input.isKeyPressed(39)||input.isKeyPressed(68),shoot:input.isKeyPressed(74)||input.isMouseButtonPressed(0)&&!replayHover},dt);
  const player=first('P_Player'),firing=s.time-s.shotAt<.35;
  const state=s.moving?(firing?'player_run_fire':'player_run'):(firing?'player_fire':'player_idle');
  if(!s.paused&&s.moving)proof.phase=(proof.phase+Math.min(dt,.05)*14)%12;
  const frame=s.moving?Math.floor(proof.phase):firing?Math.min(11,Math.floor((s.time-s.shotAt)/.35*12)):Math.floor(s.time*8)%12;
  if(player.getAnimationName()!==state)player.setAnimationName(state);
  player.setAnimationSpeedScale(0);player.setAnimationFrame(frame);player.flipX(s.facing<0);player.setPosition(s.x-32,PROOF_LAYOUT.floorY-72);
  const setText=(name,value)=>{const o=first(name);if(o.getString()!==value)o.setString(value);};
  function transition(name,key,complete,duration=.6,reverse=false){const o=first(name),start=s.transition[key];o.setAnimationSpeedScale(0);let f=start===undefined?(complete?11:0):Math.min(11,Math.floor((s.time-start)/duration*12));if(reverse)f=11-f;o.setAnimationFrame(f);}
  transition('P_Switch','switch',s.power,.5,!s.power&&s.transition.switch!==undefined);
  transition('P_Socket','socket',s.installed,.6);transition('P_Console','console',s.solved,.6);
  first('P_Fuse').hide(s.fuse);first('P_Fuse').setAnimationSpeedScale(s.paused?0:1);
  const labels={power:`POWER A / ${s.power?'ON':'OFF'}`,fuse:s.fuse?'FUSE / COLLECTED':'FUSE / COLLECT',socket:s.installed?'SOCKET / FITTED':s.fuse?'SOCKET / READY':'SOCKET / NEEDS FUSE',console:s.solved?'CONSOLE / ACCEPTED':s.power&&s.installed?'CONSOLE / READY':'CONSOLE / LOCKED'};
  const points=[['power',PROOF_LAYOUT.switch],['fuse',PROOF_LAYOUT.fuse],['socket',PROOF_LAYOUT.socket],['console',PROOF_LAYOUT.console]];
  const beacons=objects('P_Beacon');
  for(let i=0;i<points.length;i++){const [id]=points[i],done=id==='fuse'?s.fuse:id==='socket'?s.installed:id==='console'?s.solved:false;beacons[i].hide(done);beacons[i].setAnimationSpeedScale(s.paused?0:1);beacons[i].setOpacity(190);setText('Label_'+id,labels[id]);}
  const nearest=points.filter(([id,p])=>proofNear(s,p,82)&&!(id==='fuse'&&s.fuse)).map(([id,p])=>({id,p,d:Math.abs(s.x+16-p.x)})).sort((a,b)=>a.d-b.d)[0];
  const prompt=first('InteractionPrompt');prompt.hide(!nearest||s.paused);
  if(nearest){const {id,p}=nearest;const action=id==='power'?s.power?'E · SWITCH OFF':'E · ACTIVATE POWER':id==='fuse'?'WALK INTO FUSE TO COLLECT':id==='socket'?s.installed?'FUSE ALREADY FITTED':s.fuse?'E · INSTALL FUSE':'LOCKED · FIND THE FUSE':s.solved?'AND LOCK ACCEPTED':s.power&&s.installed?'E · AUTHORIZE CONSOLE':'LOCKED · POWER + FUSE REQUIRED';prompt.setPosition(p.x-130,PROOF_LAYOUT.floorY-(id==='console'?164:id==='fuse'?112:144));setText('InteractionPrompt',action);}
  const bot=first('P_Patrol'),warning=s.time%4>2.8;
  const botAnim=warning?'patrol_telegraph':'patrol_walk';if(bot.getAnimationName()!==botAnim)bot.setAnimationName(botAnim);
  bot.setAnimationSpeedScale(s.paused||s.patrolHp===0?0:1);if(s.patrolHp===0)bot.setAnimationFrame(11);bot.setColor(s.patrolHp===0?'90;110;120':s.time-s.patrolFlash<.12?'255;200;150':'255;255;255');
  bot.setX(1728+(warning||s.patrolHp===0?0:Math.sin(s.time)*24));setText('PatrolCaption',s.patrolHp>0?`PATROL / ${s.patrolHp} HITS`:'PATROL / DISABLED');
  const live=new Set();for(const shot of s.projectiles){live.add(shot.id);let o=proof.shots.get(shot.id);if(!o){shot.x=player.getPointX('Muzzle')+shot.dir*600*Math.min(dt,.05);shot.y=player.getPointY('Muzzle')-2;o=runtimeScene.createObject('P_Pulse');o.setWidth(10);o.setHeight(4);o.setZOrder(40);proof.shots.set(shot.id,o);}o.setPosition(shot.x,shot.y);o.flipX(shot.dir<0);}
  for(const [id,o]of proof.shots)if(!live.has(id)){o.deleteFromScene(runtimeScene);proof.shots.delete(id);}
  const camera=Math.max(384,Math.min(PROOF_LAYOUT.width-384,s.x+144));proof.camera=camera;
  const world=runtimeScene.getLayer('');world.setCameraZoom(1.25);world.setCameraX(camera);world.setCameraY(280);
  for(const [layerName,name,ratio,opacity]of [['Far','P_Far',.15,90],['Mid','P_Mid',.35,140],['Near','P_Near',.65,100]]){
    const layer=runtimeScene.getLayer(layerName);layer.setCameraZoom(1.25);layer.setCameraX(384+proofParallax(camera-384,ratio,1536));layer.setCameraY(280);
    for(const o of objects(name)){o.flipX(Math.round(o.getX()/768)%2!==0);o.setOpacity(opacity);}
  }
  const hud=runtimeScene.getLayer('HUD');hud.setCameraZoom(1);hud.setCameraX(480);hud.setCameraY(270);
  setText('ProofMessage',s.message);setText('ProofStatus',`POWER ${Number(s.power)} / FUSE ${s.installed?'FITTED':s.fuse?'CARRIED':'MISSING'} / CONSOLE ${s.solved?'ACCEPTED':s.power&&s.installed?'READY':'LOCKED'}`);setText('ProofPause',s.paused?'PAUSED':'');
  first('ProofReplay').setColor(replayHover?'190;255;255':'255;255;255');
}
