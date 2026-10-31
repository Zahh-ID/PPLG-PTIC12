// Embedded into the GDevelop JavaScript event by npm run build:client.
// The scene owns this state; world mutations are only sent as server commands.
if (!runtimeScene.__logicWorld) {
  const s = runtimeScene.__logicWorld = {
    connected:false, joined:false, id:null, devices:[], signals:{}, players:[],
    objects:new Map(), remotes:new Map(), inventory:{}, selected:'interact',
    revision:0, lastSend:0, message:'Connecting to the workshop…', cameraX:480,
  };
  window.__logicWorld=s;  s.scene=runtimeScene;
  const player=runtimeScene.getObjects('Player')[0];
  const hud=document.createElement('div'); hud.id='logicworld-hud';
  hud.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:100;font:14px monospace;color:#f2e6cb';
  hud.innerHTML=`<div style="padding:12px 18px;background:#20283bee"><b>LOGICWORLD · Workshop</b><span id="lw-status" style="float:right"></span><div id="lw-message" style="margin-top:8px"></div><div style="margin-top:6px;color:#a6b9c8">Arrows / Space: move & jump · Click: use / build · Right click: remove · R: return to spawn</div></div><div id="lw-toolbar" style="position:absolute;top:112px;left:12px;right:12px;display:flex;gap:6px;flex-wrap:wrap;pointer-events:auto"></div>`;
  document.body.appendChild(hud);
  const status=hud.querySelector('#lw-status'), message=hud.querySelector('#lw-message'), toolbar=hud.querySelector('#lw-toolbar');
  const buttons=new Map();
  for(const [i,kind] of ['interact','switch','wire','and','or','not','lamp','door','block'].entries()) {
    const button=document.createElement('button');button.dataset.tool=kind;
    button.style.cssText='font:12px monospace;border:2px solid #667487;border-radius:4px;padding:7px;background:#30394f;color:#f2e6cb;cursor:pointer';
    button.onclick=()=>{s.selected=kind;refresh();button.blur();};toolbar.appendChild(button);buttons.set(kind,button);
  }
  const demo=document.createElement('button');demo.textContent='Build AND example';demo.dataset.action='example';
  demo.style.cssText='font:14px monospace;padding:7px;background:#e6be68;color:#20283b;border:0;border-radius:4px;cursor:pointer';
  demo.onclick=()=>{send({type:'example'});demo.blur();};toolbar.appendChild(demo);
  function refresh() {
    for(const [i,[kind,b]] of [...buttons].entries()) {b.textContent=`${i+1} ${kind.toUpperCase()}${kind==='interact'?'':` (${s.inventory[kind]||0})`}`;b.style.borderColor=s.selected===kind?'#52c9d9':'#667487';}
    status.textContent=s.joined?`${s.players.length}/8 explorers · saved #${s.revision}`:'Reconnecting…';
    message.textContent=s.message;
  }
  function send(m) {if(s.joined&&s.ws?.readyState===WebSocket.OPEN)s.ws.send(JSON.stringify({v:1,...m}));else{s.message='Workshop offline. Start the local server to build together.';refresh();}}
  s.send=send; s.refresh=refresh;
  const params=new URLSearchParams(location.search);
  const endpoint=params.get('server')||`${location.protocol==='https:'?'wss':'ws'}://${location.hostname||'127.0.0.1'}:8787`;
  let retry=0, stopped=false, retryTimer, pingTimer;
  function connect() {
    if(stopped)return;
    s.message='Connecting to the workshop…';refresh();
    const ws=s.ws=new WebSocket(endpoint);
    ws.onopen=()=>{s.connected=true;ws.send(JSON.stringify({v:1,type:'join',token:sessionStorage.getItem('logicworld-token')}));};
    ws.onmessage=event=>{
      const m=JSON.parse(event.data);
      if(m.type==='welcome') {
        s.id=m.id;s.joined=true;retry=0;s.inventory=m.inventory;sessionStorage.setItem('logicworld-token',m.token);
        player.setPosition(m.spawn.x,m.spawn.y);
        s.message='Build the AND example, then click each switch. The door opens when BOTH are ON. Gate inputs: left top/bottom (one empty row between); output: right top.';
        clearInterval(pingTimer);pingTimer=setInterval(()=>send({type:'ping'}),5000);
      }
      if(m.type==='world'){s.devices=m.devices;s.signals=m.signals;s.revision=m.revision;rebuild();}
      if(m.type==='presence')s.players=m.players;
      if(m.type==='inventory')s.inventory=m.inventory;
      if(m.type==='correction')player.setPosition(m.x,m.y);
      if(m.type==='error')s.message=m.message;
      refresh();
    };
    ws.onerror=()=>{s.message='Workshop offline. Start the local server; reconnection is automatic.';refresh();};
    ws.onclose=()=>{s.connected=false;s.joined=false;s.players=[];clearInterval(pingTimer);refresh();if(!stopped)retryTimer=setTimeout(connect,Math.min(500*2**retry++,5000));};
  }
  function rebuild() {
    for(const o of s.objects.values())o.deleteFromScene(runtimeScene);s.objects.clear();
    const names={switch:'Switch',wire:'Wire',and:'AndGate',or:'OrGate',not:'NotGate',door:'Door',lamp:'Lamp',block:'Block'};
    for(const d of s.devices) {
      const o=runtimeScene.createObject(names[d.kind]);o.setPosition(d.x*16,d.y*16);o.setZOrder(4);
      o.setAnimation(s.signals[d.id]?1:0);
      if(d.kind==='door')o.activateBehavior('Platform',!s.signals[d.id]);
      s.objects.set(d.id,o);
    }
  }
  function mouse(event) {
    if(event.target.closest('#logicworld-hud'))return;
    const canvas=document.querySelector('canvas');if(!canvas)return;
    const bounds=canvas.getBoundingClientRect();
    const point=runtimeScene.getLayer('').convertCoords((event.clientX-bounds.left)*960/bounds.width,(event.clientY-bounds.top)*540/bounds.height,0);
    const x=Math.floor(point[0]/16), y=Math.floor(point[1]/16);
    const d=s.devices.find(d=>{const w=['and','or','not'].includes(d.kind)?2:1,h=d.kind==='door'?4:['and','or','not'].includes(d.kind)?3:1;return x>=d.x&&x<d.x+w&&y>=d.y&&y<d.y+h;});
    if(event.button===2){event.preventDefault();if(d)send({type:'remove',id:d.id});return;}
    if(event.button!==0)return;
    if(s.selected==='interact'){if(d?.kind==='switch')send({type:'toggle',id:d.id});else{s.message='Click a switch to toggle it, or select a building item below.';refresh();}}
    else send({type:'place',kind:s.selected,x,y});
  }
  function keydown(e) {
    if(e.repeat)return;
    const n=Number(e.key);if(n>=1&&n<=9){s.selected=[...buttons.keys()][n-1];refresh();}
    if(e.key.toLowerCase()==='r') {s.message='Returning to spawn...';s.ws.close();refresh();}
  }
  function context(e){if(e.target.tagName==='CANVAS')e.preventDefault();}
  window.addEventListener('pointerdown',mouse);window.addEventListener('keydown',keydown);window.addEventListener('contextmenu',context);
  s.dispose=()=>{stopped=true;clearTimeout(retryTimer);clearInterval(pingTimer);s.ws?.close();hud.remove();window.removeEventListener('pointerdown',mouse);window.removeEventListener('keydown',keydown);window.removeEventListener('contextmenu',context);};
  if(!window.__logicWorldUnloadRegistered){
    window.__logicWorldUnloadRegistered=true;
    gdjs.registerRuntimeSceneUnloadedCallback(scene=>scene.__logicWorld?.dispose());
  }
  connect();refresh();
}
{
  const s=runtimeScene.__logicWorld, player=runtimeScene.getObjects('Player')[0];
  player.activateBehavior('PlatformerObject',s.joined);
  player.setX(Math.max(0,Math.min(2544,player.getX())));
  if(player.getY()>500){player.setPosition(320,416);s.ws.close();}
  const layer=runtimeScene.getLayer('');
  s.cameraX=Math.max(240,Math.min(2320,player.getX()+128));
  layer.setCameraZoom(2);layer.setCameraX(s.cameraX);layer.setCameraY(360);
  if(performance.now()-s.lastSend>100&&s.joined){s.lastSend=performance.now();s.send({type:'move',x:player.getX(),y:player.getY()});}
  const ids=new Set();
  for(const p of s.players) {
    if(p.id===s.id)continue;ids.add(p.id);
    let o=s.remotes.get(p.id);
    if(!o){o=runtimeScene.createObject('RemotePlayer');o.setPosition(p.x,p.y);o.setColor('230;190;104');o.setZOrder(3);s.remotes.set(p.id,o);}
    o.setPosition(o.getX()+(p.x-o.getX())*0.35,o.getY()+(p.y-o.getY())*0.35);
  }
  for(const [id,o] of s.remotes)if(!ids.has(id)){o.deleteFromScene(runtimeScene);s.remotes.delete(id);}
}
