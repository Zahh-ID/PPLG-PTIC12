// Native GDevelop Text, Sprite and nine-patch objects; no DOM, CSS or HTML UI.
{
  const s=runtimeScene.__missionClient,m=s.mission,l=s.level;
  const first=name=>runtimeScene.getObjects(name)[0];
  const show=(name,visible)=>first(name)?.hide(!visible);
  const text=(name,value)=>{const o=first(name);if(o&&o.getString()!==String(value))o.setString(String(value));};
  const mode=!s.joined||!m?'offline':s.help?'help':m.status==='briefing'?'briefing':m.paused?'paused':['failed','success'].includes(m.status)?m.status:'';
  s.uiMode=mode;
  const hud=runtimeScene.getLayer('HUD');hud.setCameraZoom(1);hud.setCameraX(480);hud.setCameraY(270);
  const seconds=Math.ceil((m?.remainingMs??360000)/1000),clock=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
  text('HUDClock',clock);first('HUDClock').setColor(seconds<60?'224;119;112':'242;230;203');
  for(let i=0;i<5;i++)first('HUDShield'+i).setAnimationName(i<(m?.player.hp??5)?'full':'empty');
  const objective=!m?'Establishing uplink…':m.defused?'Charge safe. Reach the extraction lift.':!m.feedA?'Restore feed A at the loading dock.':!m.fuseCollected?'Recover the fuse beyond the patrol.':!m.fuseInstalled?'Install the fuse at feed B.':!m.feedB?'Activate feed B.':`Hold E at the AND console${m.defuseMs?' · '+Math.floor(m.defuseMs/30)+'%':''}.`;
  text('HUDObjective',s.error||m?.saveError||objective);
  text('HUDCircuit',`A ${Number(m?.feedA||false)}   AND   B ${Number(m?.feedB&&m?.fuseInstalled||false)}    →    SAFE ${Number(m?.output||false)}`);
  text('HUDFuse',m?.fuseInstalled?'FITTED':m?.fuseCollected?'READY':'FUSE');first('HUDFuseIcon').setOpacity(m?.fuseCollected?255:90);
  text('HUDZone',l?.zones?.find(z=>(m?.player.x??0)>=z.from&&(m?.player.x??0)<z.to)?.name||'BROKEN LOADING DOCK');
  show('UIPause',!mode);show('UIHelp',!mode);
  for(const name of ['ModalShade','ModalFrame','ModalEyebrow','ModalTitle','ModalBody','ModalFoot'])show(name,!!mode);
  first('ModalShade').setOpacity(205);
  show('UIHeroPreview',mode==='briefing');show('UIRiflePreview',mode==='briefing');
  text('ModalEyebrow','PROTOCOL ZERO / 01');
  text('ModalTitle',({offline:'LINK INTERRUPTED',briefing:'TWIN POWER',help:'FIELD CONTROLS',paused:'MISSION PAUSED',failed:'MISSION FAILED',success:'DOCK SECURED'})[mode]||'');
  const copy={
    offline:'Reconnecting to the dock.\nYour solo mission is paused on disconnect.',
    briefing:'MIRA: Two feeds. One safety lock.\nBoth must be live.\n\nRecover the fuse. Restore A and B.\nHold E at the AND console, then extract.\nSix minutes. Patrols take three rifle hits.',
    help:'MOVE       Arrows / A D\nJUMP       Space / W / Up\nFIRE       J / Left mouse · faces your last move\nDASH       K / Shift\nINTERACT   E · hold at the charge console\nPAUSE      Esc       HELP   H\n\nAND lock: 1 + 1 → SAFE. Both feeds are required.',
    paused:'Clock, patrols and projectiles are frozen.\n\nResume when you are ready.',
    failed:`${m?.reason==='timeout'?'The purge deadline expired.':m?.reason==='fall'?'RELAY-7 fell into the dock breach.':'RELAY-7 was disabled.'}\n\nRetry resets the clock, patrols and switches.\nYour saved campaign progress stays.`,
    success:`The AND safety lock held. MIRA has a route out.\n\nTime remaining: ${clock}\nArchive log: ${m?.logCollected?'Recovered':'Not found'}\n${m?.resultSaved?'Progress saved. Level 02 unlocked.':'Saving campaign progress…'}\nLevel 02 mission is not built yet.`,
  };
  text('ModalBody',s.error&&mode==='offline'?s.error:copy[mode]||'');
  text('ModalFoot',mode==='briefing'?'Enter to deploy · H for controls':mode==='help'?'Close / Esc to return':mode==='paused'?'Esc to resume':mode==='failed'||mode==='success'?m?.resultSaved?'R to replay Level 01':'Saving attempt…':'Waiting for the mission server');
  show('UIStart',mode==='briefing');show('UIResume',mode==='paused');show('UIRetry',['failed','success'].includes(mode)&&!!m?.resultSaved);show('UIModalHelp',['briefing','paused'].includes(mode));show('UICloseHelp',mode==='help');
  show('UIDefuseProgress',!mode&&!!m?.defuseMs&&!m?.defused);if(m?.defuseMs)first('UIDefuseProgress').setWidth(Math.max(1,560*m.defuseMs/3000));
  // Show one nearby prompt instead of pinning labels across the whole map.
  let prompt=null;
  if(m&&l&&!mode){
    const options=[{point:l.feedA,label:`E · POWER A : ${Number(m.feedA)}`},{point:l.feedB,label:m.fuseInstalled?`E · POWER B : ${Number(m.feedB)}`:m.fuseCollected?'E · INSTALL FUSE':'POWER B · FUSE REQUIRED'},{point:l.console,label:m.defused?'CHARGE SAFE':m.output?'HOLD E · DISABLE CHARGE':'AND LOCK · RESTORE BOTH FEEDS'},{point:l.exit,label:m.defused?'EXTRACT →':'LIFT LOCKED'}];
    prompt=options.map(o=>({...o,distance:Math.hypot(m.player.x+16-o.point.x,m.player.y+32-o.point.y)})).filter(o=>o.distance<95).sort((a,b)=>a.distance-b.distance)[0];
  }
  show('WorldPrompt',!!prompt);if(prompt){text('WorldPrompt',prompt.label);first('WorldPrompt').setPosition(prompt.point.x-100,prompt.point.y-32);}
  // Native pointer position drives hover feedback; native event conditions handle clicks.
  const mx=gdjs.evtTools.input.getMouseX(runtimeScene,'HUD',0),my=gdjs.evtTools.input.getMouseY(runtimeScene,'HUD',0),down=runtimeScene.getGame().getInputManager().isMouseButtonPressed(0);
  for(const name of ['UIPause','UIHelp','UIStart','UIResume','UIRetry','UIModalHelp','UICloseHelp']){const o=first(name),hover=o.isVisible()&&mx>=o.getX()&&mx<=o.getX()+o.getWidth()&&my>=o.getY()&&my<=o.getY()+o.getHeight();o.setColor(hover?'190;255;255':'255;255;255');o.setOpacity(hover&&down?185:255);}
}
