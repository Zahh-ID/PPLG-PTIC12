// Icon-only buttons shared by the opening, gameplay pause menu and result screens.
const sceneName=runtimeScene.getName();
const objects=name=>runtimeScene.getObjects(name);
const first=name=>objects(name)[0];
const input=runtimeScene.getGame().getInputManager();
const globals=runtimeScene.getGame().getVariables();
let ui=runtimeScene.__animalUI;
if(!ui||runtimeScene.getTimeManager().isFirstFrame()||ui.sceneName!==sceneName){
  ui=runtimeScene.__animalUI={sceneName,modal:'',keys:{},mouseDown:false,pressed:'',transitioning:false};
  for(const code of [13,27,72,80,82])ui.keys[code]=input.isKeyPressed(code);
  runtimeScene.getTimeManager().setTimeScale(1);
  const hero=first('MenuHero');
  if(hero){hero.activateBehavior('Platformer',false);hero.setAnimationName(sceneName==='game over'?'Death':'Idle');}
  if(first('MenuBackground'))first('MenuBackground').setColor(sceneName==='game over'?'125;155;205':sceneName==='winner'?'255;230;175':'255;255;255');
}
const game=runtimeScene.__islandGame;
const isGame=runtimeScene.getVariables().get('CampaignLevel').getAsNumber()>0;
const railPlayer=first('Player'),railMove=railPlayer?.getBehavior('Platformer');
const nearbyRails=railPlayer?objects('ClimbRail').filter(o=>gdjs.RuntimeObject.collisionTest(railPlayer,o,false)):[];
const nearRail=nearbyRails.length>0;
if(isGame&&!ui.modal&&!ui.transitioning&&railMove){
 if(input.isKeyPressed(87)){if(nearRail){railMove.simulateLadderKey();railMove.simulateUpKey();}else railMove.simulateJumpKey();}
 if(input.isKeyPressed(83)&&nearRail){railMove.simulateLadderKey();railMove.simulateDownKey();}
 // Native ladder descent otherwise stops on one-way landings. Open the hatch
 // while crossing, then restore its native Platform behavior after the body clears.
 const mecha=!!runtimeScene.__campaign?.mecha,w=railPlayer.getWidth(),h=railPlayer.getHeight(),left=railPlayer.getX()+w*(mecha?48/256:45/128),right=railPlayer.getX()+w*(mecha?208/256:83/128),head=railPlayer.getY()+h*(mecha?40/256:32/128),feet=railPlayer.getY()+h*.875;
 const descending=input.isKeyPressed(83)||input.isKeyPressed(40)||!!runtimeScene.getGame().__crTouch?.held.climbDown;
 const climbing=input.isKeyPressed(87)||input.isKeyPressed(38)||descending||runtimeScene.getGame().__crTouch?.held.climbUp,touch=runtimeScene.getGame().__crTouch;
 const steering=[37,39,65,68].some(code=>input.isKeyPressed(code))||touch?.held.left||touch?.held.right;
 const upward=input.isKeyPressed(87)||input.isKeyPressed(38)||!!touch?.held.climbUp;
 const currentRail=nearbyRails.sort((a,b)=>Math.abs(a.getX()+a.getWidth()/2-(railPlayer.getX()+w/2))-Math.abs(b.getX()+b.getWidth()/2-(railPlayer.getX()+w/2)))[0];
 // Align only when grabbing a rail. Never pull sideways while leaving it.
 if(railMove.isOnLadder()&&!railPlayer.__wasOnRail&&currentRail&&!steering){railPlayer.setX(currentRail.getX()+currentRail.getWidth()/2-w/2);railMove.setCurrentSpeed(0);}
 railPlayer.__wasOnRail=railMove.isOnLadder();
 for(const rail of objects('ClimbRail')){
  const top=rail.getVariables().get('UpperFloor').getAsNumber();
  if(rail===currentRail&&railMove.isOnLadder()&&upward&&feet<=top-4){rail.__releaseAtTop=true;rail.activateBehavior('Platform',false);railMove.simulateReleaseLadderKey();}
  if(rail.__releaseAtTop&&!upward){rail.__releaseAtTop=false;rail.activateBehavior('Platform',true);}
 }

 for(const hatch of objects('Ledge')){
  const across=right>hatch.getX()&&left<hatch.getX()+hatch.getWidth();
  if(descending&&nearRail&&!hatch.__railBottomStop&&across&&hatch.getY()>=head-8&&hatch.getY()<=feet+12)hatch.__railPass=true;
  if(hatch.__railPass){const crossing=across&&head<hatch.getY()+hatch.getHeight()+4&&feet>hatch.getY()-24;if(!crossing)hatch.__railPass=false;const pass=!!hatch.__railPass;hatch.activateBehavior('Platform',!pass);}
 }
}
// Touch controls use native Platformer simulation plus shared action state, never synthetic keyboard events.
const owner=runtimeScene.getGame();let touch=owner.__crTouch;
if(touch&&touch.scene!==runtimeScene){touch.dispose();delete owner.__crTouch;touch=null;}
if(isGame&&!touch&&typeof document!=='undefined'){
 const root=document.createElement('div');root.id='cr-touch-controls';root.setAttribute('aria-label','Touch game controls');
 root.innerHTML='<style>#cr-touch-controls{position:fixed;inset:0;z-index:9000;pointer-events:none;user-select:none;-webkit-user-select:none}#cr-touch-controls [hidden]{display:none!important}#cr-touch-controls button{pointer-events:auto;touch-action:none;-webkit-tap-highlight-color:transparent;border:0;padding:0;background:transparent;width:clamp(56px,9vmin,76px);height:clamp(56px,9vmin,76px);opacity:.8;cursor:pointer}#cr-touch-controls button img{width:100%;height:100%;object-fit:contain;image-rendering:pixelated;pointer-events:none}#cr-touch-controls button[aria-pressed=true]{opacity:1;filter:brightness(1.35);transform:translateY(3px) scale(.96)}#cr-touch-controls button:focus-visible{outline:2px solid #ffda7b;outline-offset:2px}#cr-touch-controls .cr-move{position:absolute;display:flex;gap:8px;left:max(12px,env(safe-area-inset-left));bottom:max(12px,env(safe-area-inset-bottom))}#cr-touch-controls .cr-actions{position:absolute;display:grid;grid-template-columns:repeat(2,auto);gap:6px;right:max(12px,env(safe-area-inset-right));bottom:max(12px,env(safe-area-inset-bottom))}#cr-touch-controls .cr-system{position:absolute;right:max(12px,env(safe-area-inset-right));top:max(12px,env(safe-area-inset-top))}#cr-touch-controls .cr-system button{width:52px;height:52px}@media(max-height:420px){#cr-touch-controls .cr-actions{gap:2px}#cr-touch-controls .cr-move{gap:4px}#cr-touch-controls button{width:56px;height:56px}}</style><div class="cr-move"></div><div class="cr-actions"></div><div class="cr-system"></div>';
 const held={left:false,right:false,jump:false,fire:false,interact:false,shield:false,climbUp:false,climbDown:false},pointers=new Map(),buttons=new Map();
 const resource=file=>owner.getGameData().resources.resources.find(r=>r.name==='CR_'+file.replace(/[^a-zA-Z0-9]/g,'_'))?.file??'';
 touch=owner.__crTouch={scene:runtimeScene,root,held,enabled:false,active:false,pauseRequested:false};
 function refresh(){for(const action of Object.keys(held))held[action]=[...pointers.values()].includes(action);for(const[action,button]of buttons)button.setAttribute('aria-pressed',String(!!held[action]));}
 function clear(){const ids=[...pointers.keys()];pointers.clear();touch.jumpRequested=false;touch.fireRequested=false;touch.interactRequested=false;refresh();for(const button of buttons.values())for(const id of ids)if(button.hasPointerCapture(id))button.releasePointerCapture(id);}
 touch.clear=clear;
 const definitions=[['left','Move left','ui/back.png','cr-move'],['right','Move right','ui/next.png','cr-move'],['interact','Use terminal or board mecha','mobile/interact.png','cr-actions'],['shield','Hold mecha shield','ui/shield.png','cr-actions'],['fire','Hold to fire','mobile/fire.png','cr-actions'],['jump','Jump','mobile/jump.png','cr-actions'],['pause','Pause or continue','ui/pause.png','cr-system']];
 const climbGroup=document.createElement('div');climbGroup.className='cr-climb';root.append(climbGroup);definitions.push(['climbUp','Climb up','mobile/jump.png','cr-climb'],['climbDown','Climb down','mobile/jump.png','cr-climb']);
 for(const[action,label,file,group]of definitions){const button=document.createElement('button');button.type='button';button.dataset.touchAction=action;button.setAttribute('aria-label',label);button.setAttribute('aria-pressed','false');const image=document.createElement('img');image.src=resource(file);image.alt='';image.draggable=false;button.append(image);root.querySelector('.'+group).append(button);buttons.set(action,button);
  button.onpointerdown=e=>{e.preventDefault();e.stopPropagation();if(!touch.enabled)return;if(action==='pause'){touch.pauseRequested=true;return;}if(!touch.active)return;if(['jump','fire','interact'].includes(action))touch[action+'Requested']=true;pointers.set(e.pointerId,action);button.setPointerCapture(e.pointerId);refresh();};
  button.onpointermove=e=>{if(!pointers.has(e.pointerId))return;e.preventDefault();const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-touch-action]'),next=target&&root.contains(target)?target.dataset.touchAction:null;pointers.set(e.pointerId,next&&next!=='pause'&&!buttons.get(next).hidden?next:null);refresh();};
  const release=e=>{pointers.delete(e.pointerId);refresh();if(button.hasPointerCapture(e.pointerId))button.releasePointerCapture(e.pointerId);};button.onpointerup=release;button.onpointercancel=release;button.onlostpointercapture=release;button.oncontextmenu=e=>e.preventDefault();
 }
 const fixedSlots=document.createElement('style');fixedSlots.textContent='#cr-touch-controls [data-touch-action=interact]{grid-area:1/1}#cr-touch-controls [data-touch-action=shield]{grid-area:1/2}#cr-touch-controls [data-touch-action=fire]{grid-area:2/1}#cr-touch-controls [data-touch-action=jump]{grid-area:2/2}#cr-touch-controls .cr-climb{position:absolute;left:max(12px,env(safe-area-inset-left));bottom:100px;display:flex;gap:8px}#cr-touch-controls [data-touch-action=climbDown] img{transform:rotate(180deg)}';root.append(fixedSlots);
 document.body.append(root);const blur=()=>clear(),visibility=()=>{if(document.hidden)clear();};window.addEventListener('blur',blur);window.addEventListener('pagehide',blur);window.addEventListener('orientationchange',blur);document.addEventListener('visibilitychange',visibility);
 touch.dispose=()=>{clear();root.remove();window.removeEventListener('blur',blur);window.removeEventListener('pagehide',blur);window.removeEventListener('orientationchange',blur);document.removeEventListener('visibilitychange',visibility);};
 touch.buttons=buttons;
}
if(touch){
 // Screen width alone misclassifies narrow desktop windows; touch capability alone misclassifies touch laptops.
 const touchCapable=navigator.maxTouchPoints>0,coarse=window.matchMedia('(pointer: coarse)').matches,hover=window.matchMedia('(hover: hover)').matches;
 const mobileDevice=navigator.userAgentData?.mobile===true||/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 touch.enabled=touchCapable&&(mobileDevice||coarse&&!hover);touch.root.dataset.device=touch.enabled?'mobile':'desktop';touch.root.dataset.orientation=window.matchMedia('(orientation: portrait)').matches?'portrait':'landscape';touch.active=touch.enabled&&!ui.modal&&!ui.transitioning&&(!game||game.state==='playing');if(!touch.active)touch.clear();touch.root.hidden=!touch.enabled||ui.transitioning||!!ui.modal&&ui.modal!=='pause';touch.root.querySelector('.cr-move').hidden=!touch.active;touch.root.querySelector('.cr-actions').hidden=!touch.active;touch.buttons.get('shield').hidden=!runtimeScene.__campaign?.mecha;const pause=touch.buttons.get('pause');pause.querySelector('img').src=owner.getGameData().resources.resources.find(r=>r.name===(ui.modal==='pause'?'CR_ui_resume_png':'CR_ui_pause_png'))?.file??'';pause.setAttribute('aria-label',ui.modal==='pause'?'Continue adventure':'Pause adventure');
 touch.root.querySelector('.cr-climb').hidden=!touch.active||!nearRail&&!railMove?.isOnLadder();
 if(touch.active){const move=first('Player')?.getBehavior('Platformer');if(move){if(touch.held.left&&!touch.held.right)move.simulateLeftKey();if(touch.held.right&&!touch.held.left)move.simulateRightKey();if(touch.held.jump||touch.jumpRequested)move.simulateJumpKey();if(touch.held.climbUp){move.simulateLadderKey();move.simulateUpKey();}if(touch.held.climbDown){move.simulateLadderKey();move.simulateDownKey();}}touch.jumpRequested=false;}
}
if(ui.modal==='mission'||ui.modal==='journey')return;
const isResult=sceneName==='winner'||sceneName==='game over';
const keyEdge=code=>{const now=input.isKeyPressed(code),edge=now&&!ui.keys[code];ui.keys[code]=now;return edge;};
const enter=keyEdge(13),escape=keyEdge(27),helpKey=keyEdge(72),pauseKey=keyEdge(80)||!!touch?.pauseRequested,replayKey=keyEdge(82);if(touch)touch.pauseRequested=false;
function navigate(name){
 if(name==='permainan'){
   if(isGame)name=sceneName;
   else if(sceneName==='game over'){const n=Math.max(1,globals.get('CRResumeLevel').getAsNumber());name=n===1?'permainan':'sector'+n;}
   else {const n=sceneName==='winner'?1:Math.max(1,globals.get('CRResumeLevel').getAsNumber());name=n===1?'permainan':'sector'+n;if(n===1)globals.get('CRScore').setNumber(0);}
 }
 runtimeScene.getTimeManager().setTimeScale(1);ui.modal='';ui.transitioning=true;gdjs.evtTools.runtimeScene.replaceScene(runtimeScene,name,false);
}
function modal(name){ui.modal=ui.modal===name?'':name;runtimeScene.getTimeManager().setTimeScale(ui.modal?0:1);}
function showCredits(returnTo=''){ui.modal='credits';ui.creditsReturnTo=returnTo;runtimeScene.getTimeManager().setTimeScale(0);}
function closeDialog(){
  if(ui.modal==='credits'&&ui.creditsReturnTo){const back=ui.creditsReturnTo;ui.creditsReturnTo='';ui.modal=back;runtimeScene.getTimeManager().setTimeScale(0);return;}
  modal(ui.modal);
}
function text(name,value){const o=first(name);if(o&&o.getString()!==String(value))o.setString(String(value));}
function visible(name,show){for(const o of objects(name))o.hide(!show);}
function panel(name,fill,opacity,x1,y1,x2,y2,outline=0){const o=first(name);if(!o)return;o.setFillColor(fill);o.setFillOpacity(opacity);o.setOutlineColor('77;77;77');o.setOutlineSize(outline);o.setOutlineOpacity(outline?255:0);o.drawRectangle(x1,y1,x2,y2);}
if(escape){if(ui.modal)closeDialog();else if(isGame)modal('pause');else if(isResult)navigate('opening');}
if(isGame&&pauseKey&&(!ui.modal||ui.modal==='pause'))modal('pause');
if(helpKey&&(!ui.modal||ui.modal==='help'))modal('help');
if(replayKey&&(isGame||isResult))navigate('permainan');
if(enter){if(ui.modal)closeDialog();else if(sceneName==='opening')navigate('permainan');}
if(ui.transitioning)return;
// Credits are a menu destination, independent of exploration or rewards.
const creditsReady=true;
const normalButtons=isGame?['HUDPause','HUDReplay','HUDHelp']:sceneName==='opening'?['BtnPlay','BtnNew','BtnHelp','BtnExit',...(creditsReady?['BtnCredits']:[])]:['BtnReplay','BtnHome',...(creditsReady?['BtnCredits']:[])];
for(const name of ['HUDPause','HUDReplay','HUDHelp','BtnPlay','BtnNew','BtnHelp','BtnExit','BtnCredits','BtnReplay','BtnHome'])visible(name,!ui.modal&&normalButtons.includes(name)&&!(name==='HUDPause'&&touch?.enabled));
visible('ModalContinue',!!ui.modal);visible('ModalReplay',ui.modal==='pause');visible('ModalHome',ui.modal==='pause');visible('ModalCredits',ui.modal==='pause'&&creditsReady);visible('ModalBadge',!!ui.modal);visible('HelpText',ui.modal==='help');visible('CreditsText',false);
const cont=first('ModalContinue');if(cont){const size=ui.modal==='pause'?80:96;cont.setWidth(size);cont.setHeight(size);cont.setPosition(ui.modal==='pause'?408:592,ui.modal==='pause'?390:ui.modal==='credits'?588:520);}
for(const [name,x]of [['ModalReplay',536],['ModalCredits',664],['ModalHome',792]]){const o=first(name);if(o){o.setPosition(x,390);o.setWidth(80);o.setHeight(80);}}
const badge=first('ModalBadge');if(badge){const size=ui.modal==='credits'?48:64;badge.setAnimationName(ui.modal==='help'?'Help':ui.modal==='credits'?'Credits':'Pause');badge.setWidth(size);badge.setHeight(size);badge.setPosition(ui.modal==='credits'?616:608,ui.modal==='pause'?250:ui.modal==='credits'?100:188);}
for(const name of ['CreditsHeading','PortraitProgrammer','PortraitArtist','PortraitLevelDesign','CreditNameProgrammer','CreditRoleProgrammer','CreditNimProgrammer','CreditNameArtist','CreditRoleArtist','CreditNimArtist','CreditNameLevelDesign','CreditRoleLevelDesign','CreditNimLevelDesign'])visible(name,ui.modal==='credits');
text('HelpText',"Move: A / D or left / right    Jump: Space\nClimb rails: W / S or up / down\nFire: J / X    Interact: E    Pause: P / Esc\nMecha shield: hold K\n\nCollect three materials and repair three machines.\nConnect the circuit ports and test every input case.\nBoard the mecha in level 6. Boss fights follow in levels 7 and 8.");
const shade=first('ModalShade');if(shade)shade.clear();
if(ui.modal){
  panel('ModalShade','0;0;0',102,0,0,1280,720);
  if(ui.modal==='pause')panel('ModalShade','43;43;43',248,380,220,900,530,1);
  else if(ui.modal==='credits'){
    panel('ModalShade','43;43;43',252,100,70,1180,700,1);
    for(const x of [150,490,830]){
      panel('ModalShade','51;51;51',255,x,230,x+300,555,2);
      panel('ModalShade','255;255;255',255,x+14,244,x+286,444,1);
    }
  }
  else panel('ModalShade','43;43;43',248,320,160,960,640,1);
}
const hud=first('HUDPlate');if(hud){hud.clear();panel('HUDPlate','43;43;43',210,12,10,780,76,1);}
const backdrop=first('ScreenShade');if(backdrop){backdrop.clear();if(isResult)panel('ScreenShade','8;19;34',sceneName==='winner'?65:150,0,0,1280,720);}
if(isGame&&game){
 text('HUDLivesValue',game.lives);text('HUDAmmoValue',runtimeScene.__campaign?.mecha?'∞':game.ammo);text('HUDCoinsValue',game.coins+'/'+game.totalCoins);text('HUDScoreValue',game.score);
}
if(isResult){
 text('ResultTitle',sceneName==='winner'?'STATION RESTORED':'MISSION FAILED');
 text('ResultScore',globals.get('AHLastScore').getAsNumber());
 text('ResultCoins',globals.get('AHLastCoins').getAsNumber()+'/'+globals.get('AHLastTotalCoins').getAsNumber());
}

// Hit-test only the currently visible icon controls. Modal buttons capture input.
const mx=gdjs.evtTools.input.getMouseX(runtimeScene,'HUD',0),my=gdjs.evtTools.input.getMouseY(runtimeScene,'HUD',0);
const active=ui.modal?(ui.modal==='pause'?['ModalContinue','ModalReplay','ModalCredits','ModalHome']:['ModalContinue']):normalButtons;
const down=input.isMouseButtonPressed(0),released=input.isMouseButtonReleased(0);
let hover='';
for(const name of active){const o=first(name);if(!o)continue;const inside=mx>=o.getX()&&mx<=o.getX()+o.getWidth()&&my>=o.getY()&&my<=o.getY()+o.getHeight();if(inside)hover=name;o.setColor(inside?'225;235;255':'255;255;255');o.setOpacity(down&&inside?225:255);}
if(down&&!ui.mouseDown)ui.pressed=hover;
const clicked=released&&hover&&ui.pressed===hover?hover:'';
if(!down)ui.pressed='';ui.mouseDown=down;
if(clicked==='HUDPause')modal('pause');
if(clicked==='HUDHelp'||clicked==='BtnHelp')modal('help');
if(clicked==='ModalContinue')closeDialog();
if(clicked==='BtnCredits')showCredits();
if(clicked==='ModalCredits')showCredits('pause');
if(['HUDReplay','ModalReplay','BtnReplay','BtnPlay'].includes(clicked))navigate('permainan');
if(clicked==='BtnNew'){globals.get('CRResumeLevel').setNumber(1);globals.get('CRScore').setNumber(0);navigate('permainan');}
if(['ModalHome','BtnHome'].includes(clicked))navigate('opening');
if(clicked==='BtnExit'){ui.transitioning=true;gdjs.evtTools.runtimeScene.stopGame(runtimeScene);}
