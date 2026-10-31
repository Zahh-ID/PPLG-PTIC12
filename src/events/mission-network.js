// GDevelop event: transport and input only. All interface visuals are scene objects.
if(!runtimeScene.__missionClient){
  const s=runtimeScene.__missionClient={scene:runtimeScene,joined:false,mission:null,progress:{},level:null,objects:new Map(),lastInput:'',lastSend:0,cameraX:320,keyEdges:{},help:false};
  window.__missionClient=s;
  s.send=data=>{if(s.ws?.readyState===WebSocket.OPEN)s.ws.send(JSON.stringify({v:1,...data}));};
  s.clearInput=()=>{s.lastInput='';s.send({type:'mission',action:'input',input:{left:false,right:false,jump:false,shoot:false,dash:false,interact:false}});};
  s.action=action=>{
    const m=s.mission;
    if(action==='help'){
      s.help=true;s.resumeAfterHelp=m?.status==='running'&&!m.paused;
      if(s.resumeAfterHelp){s.clearInput();s.send({type:'mission',action:'pause',paused:true});}
      return;
    }
    if(action==='closeHelp'){
      s.help=false;if(s.resumeAfterHelp)s.send({type:'mission',action:'pause',paused:false});s.resumeAfterHelp=false;return;
    }
    if(!s.joined||!m)return;
    s.clearInput();
    if(action==='start'&&m.status==='briefing')s.send({type:'mission',action:'start'});
    if(action==='retry'&&m.resultSaved)s.send({type:'mission',action:'retry'});
    if(action==='pause'&&m.status==='running')s.send({type:'mission',action:'pause',paused:!m.paused});
  };
  const params=new URLSearchParams(location.search),endpoint=params.get('server')||`${location.protocol==='https:'?'wss':'ws'}://${location.hostname||'127.0.0.1'}:8787`;
  let stopped=false,retry=0,retryTimer,ping;
  function connect(){
    const ws=s.ws=new WebSocket(endpoint);
    ws.onopen=()=>s.send({type:'join',mode:'mission',token:sessionStorage.getItem('logicworld-mission-token')});
    ws.onmessage=e=>{const data=JSON.parse(e.data);
      if(data.type==='welcome'){s.joined=true;retry=0;s.level=data.level;s.progress=data.progress;sessionStorage.setItem('logicworld-mission-token',data.token);clearInterval(ping);ping=setInterval(()=>s.send({type:'ping'}),5000);}
      if(data.type==='mission'){if(data.mission.attemptId!==s.mission?.attemptId)s.help=false;s.mission=data.mission;s.receivedAt=performance.now();s.progress=data.progress;s.error='';}
      if(data.type==='error'){s.error=data.message;if(!s.joined)ws.close();}
    };
    ws.onclose=()=>{s.joined=false;s.lastInput='';clearInterval(ping);if(!stopped)retryTimer=setTimeout(connect,Math.min(500*2**retry++,5000));};
    ws.onerror=()=>{};
  }
  function blur(){s.clearInput();if(s.mission?.status==='running'&&!s.mission.paused)s.send({type:'mission',action:'pause',paused:true});}
  window.addEventListener('blur',blur);
  s.dispose=()=>{stopped=true;clearTimeout(retryTimer);clearInterval(ping);s.ws?.close();window.removeEventListener('blur',blur);};
  if(!window.__missionUnloadHook){window.__missionUnloadHook=true;gdjs.registerRuntimeSceneUnloadedCallback(scene=>scene.__missionClient?.dispose());}
  connect();
}
{
  const s=runtimeScene.__missionClient,m=s.mission,input=runtimeScene.getGame().getInputManager();
  const edge=code=>{const now=input.isKeyPressed(code),pressed=(now||input.wasKeyReleased(code))&&!s.keyEdges[code];s.keyEdges[code]=now;return pressed;};
  const escape=edge(27),enter=edge(13),help=edge(72),retry=edge(82);
  // Native click events write this variable. They are editable in the event sheet.
  const command=runtimeScene.getVariables().get('UIAction').getAsString();
  runtimeScene.getVariables().get('UIAction').setString('');
  if(command)s.action(command);
  else if(escape)s.action(s.help?'closeHelp':'pause');
  else if(help)s.action(s.help?'closeHelp':'help');
  else if(enter&&m?.status==='briefing'&&!s.help)s.action('start');
  else if(retry&&['failed','success'].includes(m?.status)&&!s.help)s.action('retry');
  const active=s.joined&&m?.status==='running'&&!m.paused&&!s.help;
  // Native release flags preserve a tap that begins and ends between two frames.
  // A release after an observed hold must not create another interaction edge.
  const key=(...codes)=>active&&codes.some(code=>input.isKeyPressed(code)||input.wasKeyReleased(code)&&!s.inputKeys?.[code]);
  const mouseX=gdjs.evtTools.input.getMouseX(runtimeScene,'HUD',0),mouseY=gdjs.evtTools.input.getMouseY(runtimeScene,'HUD',0);
  const overUI=['UIPause','UIHelp'].some(name=>{const o=runtimeScene.getObjects(name)[0];return o?.isVisible()&&mouseX>=o.getX()&&mouseX<=o.getX()+o.getWidth()&&mouseY>=o.getY()&&mouseY<=o.getY()+o.getHeight();});
  const next={left:key(37,65),right:key(39,68),jump:key(32,38,87),shoot:key(74)||!!(active&&!overUI&&input.isMouseButtonPressed(0)),dash:key(75,16),interact:key(69)};
  s.inputKeys=Object.fromEntries([37,65,39,68,32,38,87,74,75,16,69].map(code=>[code,input.isKeyPressed(code)]));
  const encoded=JSON.stringify(next),now=performance.now();
  if(s.joined&&(encoded!==s.lastInput||now-s.lastSend>100)){s.send({type:'mission',action:'input',input:next});s.lastInput=encoded;s.lastSend=now;}
}
