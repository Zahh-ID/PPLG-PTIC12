// Presentation and input only. Server snapshots own physics, damage and outcomes.
if(!runtimeScene.__missionClient){
  const s=runtimeScene.__missionClient={scene:runtimeScene,joined:false,mission:null,progress:{},level:null,objects:new Map(),keys:new Set(),lastInput:'',lastSend:0,cameraX:320};
  window.__missionClient=s;
  const hud=document.createElement('div');hud.id='mission-hud';
  hud.innerHTML=`<style>
  #mission-hud{position:fixed;inset:0;z-index:100;color:#e9e5d6;font:14px monospace;pointer-events:none}
  #mission-hud button{font:inherit;color:#e9e5d6;background:#233c4d;border:1px solid #527383;border-radius:5px;padding:9px 13px;cursor:pointer;pointer-events:auto}
  #mission-hud button:hover{background:#34576a}#mission-hud button:disabled{opacity:.4;cursor:default}
  #mission-top{padding:12px 18px;background:linear-gradient(#142331fa,#142331de);border-bottom:2px solid #b87d4b}
  #mission-info{display:flex;justify-content:space-between;gap:12px;align-items:center}#mission-clock{font-size:27px;color:#e6be68;font-weight:bold}
  #mission-message{margin-top:7px;color:#a6d8db;min-height:18px}#mission-signals{margin-top:7px;color:#f2e6cb}
  #mission-controls{position:absolute;bottom:8px;left:12px;right:12px;display:flex;gap:8px;align-items:center;justify-content:space-between;background:#142331e8;padding:7px 10px;border-radius:5px;font-size:12px}
  #mission-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#0d1724b0;pointer-events:auto}
  #mission-panel{max-width:540px;padding:25px 30px;background:#172a39f7;border:2px solid #b87d4b;border-radius:10px;box-shadow:0 15px 70px #0008}
  #mission-panel h1{font-size:25px;margin:0 0 12px;color:#6de09a}#mission-panel p{line-height:1.6}#mission-panel button{margin-right:8px;background:#286c6b}
  .mission-label{position:fixed;transform:translate(-50%,-100%);font-size:12px;padding:3px 6px;background:#142331da;border-radius:3px;white-space:nowrap}
  </style><div id="mission-top"><div id="mission-info"><b>PROTOCOL ZERO <span style="color:#6de09a">/ 01 TWIN POWER</span></b><span id="mission-hp">SHIELD ▰▰▰▰▰</span><span id="mission-clock">06:00</span><button data-action="pause">Pause</button></div><div id="mission-message">Connecting to the dock…</div><div id="mission-signals">A: 0 &nbsp; AND &nbsp; B: 0 &nbsp; → &nbsp; SAFE: 0</div></div><div id="mission-labels"></div><div id="mission-controls"><span>← → / A D Move · Space Jump · J Pulse · K Dash · E Interact · Esc Pause</span><button data-action="interact">Hold E / Interact</button></div><div id="mission-overlay"><div id="mission-panel"></div></div>`;
  document.body.appendChild(hud);s.hud=hud;
  const panel=hud.querySelector('#mission-panel'),overlay=hud.querySelector('#mission-overlay'),labels=hud.querySelector('#mission-labels');
  const labelNodes=new Map();
  for(const name of ['feedA','fuse','feedB','console','exit','log']){const node=document.createElement('div');node.className='mission-label';labels.appendChild(node);labelNodes.set(name,node);}
  function send(data){if(s.ws?.readyState===WebSocket.OPEN)s.ws.send(JSON.stringify({v:1,...data}));}
  s.send=send;
  function input(){return{left:s.keys.has('ArrowLeft')||s.keys.has('a'),right:s.keys.has('ArrowRight')||s.keys.has('d'),jump:s.keys.has(' ')||s.keys.has('ArrowUp')||s.keys.has('w'),shoot:s.keys.has('j'),dash:s.keys.has('k')||s.keys.has('Shift'),interact:s.keys.has('e')};}
  s.input=input;
  function pushInput(force=false){const next=input(),encoded=JSON.stringify(next);if(s.joined&&(force||encoded!==s.lastInput)){send({type:'mission',action:'input',input:next});s.lastInput=encoded;s.lastSend=performance.now();}}
  s.pushInput=pushInput;
  function handleButton(action){
    if(action==='start')send({type:'mission',action:'start'});
    if(action==='retry')send({type:'mission',action:'retry'});
    if(action==='pause'&&s.mission?.status==='running'){s.keys.clear();pushInput(true);send({type:'mission',action:'pause',paused:!s.mission.paused});}
  }
  hud.addEventListener('click',e=>{const a=e.target.closest('[data-action]')?.dataset.action;if(a&&a!=='interact'){handleButton(a);e.target.blur();}});
  const interact=hud.querySelector('[data-action="interact"]');
  interact.addEventListener('pointerdown',e=>{interact.setPointerCapture(e.pointerId);s.keys.add('e');pushInput();e.preventDefault();});
  interact.addEventListener('pointerup',()=>{s.keys.delete('e');pushInput();});
  function down(e){const key=e.key.length===1?e.key.toLowerCase():e.key;if([' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Escape'].includes(key))e.preventDefault();if(key==='Escape'&&!e.repeat){handleButton('pause');return;}if(key==='r'&&!e.repeat&&['failed','success'].includes(s.mission?.status)){handleButton('retry');return;}s.keys.add(key);pushInput();}
  function up(e){s.keys.delete(e.key.length===1?e.key.toLowerCase():e.key);pushInput();}
  function blur(){s.keys.clear();pushInput(true);if(s.mission?.status==='running'&&!s.mission.paused)send({type:'mission',action:'pause',paused:true});}
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);
  s.renderUI=()=>{
    const m=s.mission;if(!m)return;
    const seconds=Math.ceil(m.remainingMs/1000),clock=hud.querySelector('#mission-clock');clock.textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;clock.style.color=seconds<60?'#e07770':'#e6be68';
    hud.querySelector('#mission-hp').textContent='SHIELD '+ '▰'.repeat(m.player.hp)+'▱'.repeat(5-m.player.hp);
    const zone=s.level?.zones?.find(z=>m.player.x>=z.from&&m.player.x<z.to)?.name||'';
    hud.querySelector('#mission-message').textContent=(zone?zone+' · ':'')+(m.saveError||m.message);
    hud.querySelector('#mission-signals').textContent=`A: ${Number(m.feedA)}  AND  B: ${Number(m.feedB&&m.fuseInstalled)}  →  SAFE: ${Number(m.output)}     ${m.defused?'CHARGE DISABLED — REACH THE LIFT':`FUSE: ${m.fuseInstalled?'INSTALLED':m.fuseCollected?'CARRIED':'MISSING'}${m.defuseMs?`   DEFUSING ${Math.floor(m.defuseMs/3000*100)}%`:''}`}`;
    const mode=!s.joined?'offline':m.status==='briefing'?'briefing':m.paused?'paused':['failed','success'].includes(m.status)?m.status:null;
    overlay.style.display=mode?'flex':'none';
    if(mode!==s.overlayMode||['failed','success'].includes(mode)&&m.resultSaved!==s.savedMode){
      s.overlayMode=mode;s.savedMode=m.resultSaved;
      if(mode==='briefing')panel.innerHTML='<h1>01 / TWIN POWER</h1><p><b>MIRA:</b> “Two feeds. One safety lock. Both must be live.”</p><p>Recover the fuse, restore power A and B, then hold <b>E</b> at the charge console for three seconds. Reach the lift before the six-minute purge.</p><p><b>AND:</b> 0+0 → 0 · 0+1 → 0 · 1+0 → 0 · <b>1+1 → 1</b><br>Patrol bots take three pulse hits. Jump or dash to evade them.</p><button data-action="start">Start Mission</button><p style="font-size:11px;color:#9fb4bd">The clock starts when you do. Level 02 unlock is saved; its mission is not built yet.</p>';
      if(mode==='paused')panel.innerHTML='<h1>MISSION PAUSED</h1><p>Clock, patrols and projectiles are frozen.</p><button data-action="pause">Resume</button>';
      if(mode==='offline')panel.innerHTML='<h1>LINK INTERRUPTED</h1><p>Reconnecting to the dock. The server pauses your solo mission when disconnected.</p>';
      if(mode==='failed')panel.innerHTML=`<h1>MISSION FAILED</h1><p>${m.reason==='timeout'?'The purge deadline expired.':m.reason==='fall'?'RELAY-7 fell into the dock breach.':'RELAY-7 was disabled.'}</p><p>A retry resets the clock, patrols, fuse, switches and charge.</p><button data-action="retry" ${m.resultSaved?'':'disabled'}>${m.resultSaved?'Retry Level 01':'Saving attempt…'}</button>`;
      if(mode==='success')panel.innerHTML=`<h1>DOCK SECURED</h1><p>The AND safety lock held. MIRA has a route out.</p><p>${m.resultSaved?'Progress saved. Level 02 unlocked.':'Saving campaign progress…'}</p><p>Time remaining: ${clock.textContent} · Log: ${m.logCollected?'Recovered':'Not found'}</p><button data-action="retry" ${m.resultSaved?'':'disabled'}>Replay Level 01</button>`;
    }
  };
  const params=new URLSearchParams(location.search),endpoint=params.get('server')||`${location.protocol==='https:'?'wss':'ws'}://${location.hostname||'127.0.0.1'}:8787`;
  let stopped=false,retry=0,retryTimer,ping;
  function connect(){
    const ws=s.ws=new WebSocket(endpoint);
    ws.onopen=()=>send({type:'join',mode:'mission',token:sessionStorage.getItem('logicworld-mission-token')});
    ws.onmessage=e=>{const m=JSON.parse(e.data);
      if(m.type==='welcome'){s.joined=true;retry=0;s.level=m.level;s.progress=m.progress;sessionStorage.setItem('logicworld-mission-token',m.token);clearInterval(ping);ping=setInterval(()=>send({type:'ping'}),5000);}
      if(m.type==='mission'){s.mission=m.mission;s.progress=m.progress;s.renderUI();}
      if(m.type==='error'){hud.querySelector('#mission-message').textContent=m.message;if(!s.joined)ws.close();}
    };
    ws.onclose=()=>{s.joined=false;s.keys.clear();clearInterval(ping);s.renderUI();if(!stopped)retryTimer=setTimeout(connect,Math.min(500*2**retry++,5000));};
    ws.onerror=()=>{};
  }
  s.object=(id,type,x,y)=>{let o=s.objects.get(id);if(!o){o=runtimeScene.createObject(type);s.objects.set(id,o);}o.setPosition(x,y);return o;};
  s.label=(id,text,x,y,show=true)=>{const node=labelNodes.get(id);if(!show||!s.joined){node.style.display='none';return;}const bounds=document.querySelector('canvas').getBoundingClientRect(),cx=(x-s.cameraX)*1.5+480,cy=(y-320)*1.5+270;node.style.display=cx<0||cx>960?'none':'block';node.style.left=(bounds.left+cx*bounds.width/960)+'px';node.style.top=(bounds.top+cy*bounds.height/540)+'px';node.textContent=text;};
  s.dispose=()=>{stopped=true;clearTimeout(retryTimer);clearInterval(ping);s.ws?.close();hud.remove();window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);};
  if(!window.__missionUnloadHook){window.__missionUnloadHook=true;gdjs.registerRuntimeSceneUnloadedCallback(scene=>scene.__missionClient?.dispose());}
  connect();
}
{
  const s=runtimeScene.__missionClient,m=s.mission,l=s.level;
  if(m&&l){
    const p=m.player,player=s.object('hero','MissionPlayer',p.x,p.y);player.flipX(p.facing<0);player.setOpacity(p.invulnerableMs>0&&Math.floor(m.elapsedMs/80)%2?90:255);
    const animation=m.status==='failed'?'defeat':p.dashMs>0?'dash':p.invulnerableMs>200?'hurt':p.shotCooldown>0?'shoot':!p.grounded?(p.vy<0?'jump':'fall'):Math.abs(p.vx)>0?'run':'idle';if(player.getAnimationName()!==animation)player.setAnimationName(animation);
    if(m.status==='failed'){s.defeatStart??=performance.now();player.setAnimationFrame(Math.min(7,Math.floor((performance.now()-s.defeatStart)/100)));}else s.defeatStart=null;
    const a=s.object('feed-a','MissionSwitch',l.feedA.x-16,l.feedA.y);a.setAnimation(m.feedA?1:0);
    const b=s.object('feed-b','MissionSwitch',l.feedB.x-16,l.feedB.y);b.setAnimation(m.feedB&&m.fuseInstalled?1:0);
    const fuse=s.object('fuse','MissionFuse',l.fuse.x,l.fuse.y);fuse.hide(m.fuseCollected);
    const console=s.object('console','MissionConsole',l.console.x-16,l.console.y);
    const charge=s.object('charge','MissionCharge',l.console.x+28,l.console.y+16);charge.setAnimation(m.defused?1:0);
    const door=s.object('gate','MissionDoor',l.gate.x,l.gate.y);door.setAnimation(m.defused?1:0);
    s.object('lift','MissionLift',l.exit.x,l.exit.y);
    s.object('log','MissionLog',l.log.x,l.log.y).hide(m.logCollected);
    const live=new Set();
    for(const e of m.enemies){const id='enemy-'+e.id;live.add(id);const o=s.object(id,'MissionEnemy',e.x,e.y);o.flipX(e.dir<0);const anim=e.hp<=0?'defeat':e.hurtMs>0?'hurt':e.mode==='windup'?'windup':e.mode==='attack'?'attack':'walk';if(o.getAnimationName()!==anim)o.setAnimationName(anim);if(e.hp<=0)o.setAnimationFrame(Math.min(3,Math.floor(e.defeatMs/125)));}
    for(const shot of m.projectiles){const id='shot-'+shot.id;live.add(id);const o=s.object(id,'MissionPulse',shot.x,shot.y);o.setWidth(shot.w);o.setHeight(shot.h);}
    for(const [id,o]of s.objects)if(id.startsWith('shot-')&&!live.has(id)){o.deleteFromScene(runtimeScene);s.objects.delete(id);}
    s.cameraX=Math.max(320,Math.min(l.width-320,p.x+112));const layer=runtimeScene.getLayer('');layer.setCameraZoom(1.5);layer.setCameraX(s.cameraX);layer.setCameraY(320);
    const background=runtimeScene.getLayer('Backdrop');background.setCameraZoom(1.5);background.setCameraX(s.cameraX*0.35);background.setCameraY(320);
    for(const name of ['BackWall','CopperWall'])for(const o of runtimeScene.getObjects(name))o.setOpacity(name==='BackWall'?60:95);
    for(const name of ['DockWindow','Decor_dock_habitat','Decor_antenna'])for(const o of runtimeScene.getObjects(name))if(o.getLayer()==='Backdrop')o.setOpacity(95);
    player.setAnimationSpeedScale(m.paused?0:1);for(const e of m.enemies)s.objects.get('enemy-'+e.id)?.setAnimationSpeedScale(m.paused?0:1);
    s.label('feedA',`E · FEED A [${Number(m.feedA)}]`,l.feedA.x,l.feedA.y-8);
    s.label('feedB',`E · ${m.fuseInstalled?'FEED B ['+Number(m.feedB)+']':'INSTALL FUSE'}`,l.feedB.x,l.feedB.y-8);
    s.label('fuse','FUSE',l.fuse.x,l.fuse.y-6,!m.fuseCollected);
    s.label('console',m.defused?'CHARGE SAFE':'HOLD E · AND LOCK',l.console.x+12,l.console.y-8);
    s.label('exit',m.defused?'EXTRACT →':'LIFT LOCKED',l.exit.x+24,l.exit.y-8);
    s.label('log','ARCHIVE LOG',l.log.x,l.log.y-6,!m.logCollected);
    if(performance.now()-s.lastSend>100)s.pushInput(true);
  }
}
