// Scene introductions, language selection, unrestricted level selection and explicit completion routing.
const journeyGame=runtimeScene.getGame(),L=journeyGame.__crLocale;if(!L||typeof document==='undefined')return;
const ui=runtimeScene.__animalUI;if(!ui)return;
const level=runtimeScene.getVariables().get('CampaignLevel').getAsNumber(),game=runtimeScene.__islandGame;
const titles=['','Emergency Station','Cargo Warehouse','Transit Network','Security Tower','Underground Reactor','Mecha Hangar','Industrial Battlefield','Guardian Core'];
const concepts=['','NOT','AND','OR','XOR','NAND and NOR','NAND then NOT','NOR','XOR, AND, NOR'];
const introductions=[
 null,
 {
  "concept": [
   "NOT gives the opposite result. An active input turns the output off.",
   "NOT memberikan hasil yang berlawanan. Masukan yang aktif membuat keluaran mati."
  ],
  "example": [
   "When the switch is off, the lamp is on. Turn the switch on and the lamp goes off.",
   "Saat sakelar mati, lampu menyala. Saat sakelar dinyalakan, lampu mati."
  ],
  "mission": [
   "Collect a fuse, wire coil and battery. Restore the relay, ventilation and airlock controls.",
   "Kumpulkan sekering, gulungan kabel, dan baterai. Pulihkan relai, ventilasi, dan kontrol pintu udara."
  ]
 },
 {
  "concept": [
   "AND turns the output on only when both inputs are on.",
   "AND menyalakan keluaran hanya saat kedua masukan aktif."
  ],
  "example": [
   "The lift runs when power is available and the safety switch is on. If either condition is missing, it stops.",
   "Lift bergerak saat daya tersedia dan sakelar pengaman aktif. Jika salah satu syarat belum terpenuhi, lift berhenti."
  ],
  "mission": [
   "Repair the scanner, hoist and exit. Each circuit needs power from both inputs.",
   "Perbaiki pemindai, katrol, dan pintu keluar. Setiap rangkaian memerlukan daya dari kedua masukan."
  ]
 },
 {
  "concept": [
   "OR turns the output on when at least one input is on.",
   "OR menyalakan keluaran saat setidaknya satu masukan aktif."
  ],
  "example": [
   "Either generator can power the station. The lights stay on while at least one generator is running.",
   "Salah satu generator sudah cukup untuk memasok daya stasiun. Lampu tetap menyala selama ada generator yang bekerja."
  ],
  "mission": [
   "Restore the signals, switching panel and junction using either power source.",
   "Pulihkan sinyal, panel pengalih, dan persimpangan menggunakan salah satu sumber daya."
  ]
 },
 {
  "concept": [
   "XOR turns the output on when the two inputs are different.",
   "XOR menyalakan keluaran saat keadaan kedua masukan berbeda."
  ],
  "example": [
   "The lock opens when only one switch is on. Turning both switches on keeps it closed.",
   "Kunci terbuka saat hanya satu sakelar aktif. Menyalakan kedua sakelar membuat kunci tetap tertutup."
  ],
  "mission": [
   "Climb the tower. Repair its sensors, security lock and uplink.",
   "Panjat menara. Perbaiki sensor, kunci keamanan, dan sambungan menara."
  ]
 },
 {
  "concept": [
   "NAND turns off when both inputs are on. NOR turns on only when both inputs are off.",
   "NAND mematikan keluaran saat kedua masukan aktif. NOR menyalakan keluaran hanya saat kedua masukan mati."
  ],
  "example": [
   "Cooling runs while power and safety are on and no fault is detected. The alarm interlock activates only when both alarms are off.",
   "Pendingin bekerja saat daya dan pengaman aktif serta tidak ada gangguan. Pengaman alarm hanya aktif saat kedua alarm mati."
  ],
  "mission": [
   "Repair the cooling system and alarm. Then build an AND circuit using only NAND gates.",
   "Perbaiki pendingin dan alarm. Lalu rakit rangkaian AND hanya dengan gerbang NAND."
  ]
 },
 {
  "concept": [
   "NAND followed by NOT works like AND. Both inputs must be on.",
   "NAND yang diikuti NOT bekerja seperti AND. Kedua masukan harus aktif."
  ],
  "example": [
   "Both power cells must be on to start the mecha. A NAND gate followed by NOT checks that condition.",
   "Kedua sel daya harus aktif untuk menyalakan mecha. Gerbang NAND yang diikuti NOT memeriksa syarat tersebut."
  ],
  "mission": [
   "Repair all three hangar systems, then approach the mecha to board it.",
   "Perbaiki ketiga sistem hanggar, lalu dekati mecha untuk menaikinya."
  ]
 },
 {
  "concept": [
   "NOR turns the output on only when both inputs are off.",
   "NOR menyalakan keluaran hanya saat kedua masukan mati."
  ],
  "example": [
   "The siege weapon is ready when both safety alarms are off. Either alarm disables it.",
   "Senjata pengepungan siap saat kedua alarm pengaman mati. Jika salah satu alarm aktif, senjata berhenti."
  ],
  "mission": [
   "Repair three siege systems. Use the mecha to defeat Bastion and reach the exit.",
   "Perbaiki tiga sistem pengepungan. Gunakan mecha untuk mengalahkan Bastion dan mencapai pintu keluar."
  ],
  "tips": [
   [
    "Avoid marked attack lanes. Use your shield against missiles.",
    "Hindari jalur serangan bertanda. Gunakan perisai untuk menahan rudal."
   ],
   [
    "Attack during recovery for double damage.",
    "Serang saat bos memulihkan posisi untuk menghasilkan kerusakan ganda."
   ]
  ]
 },
 {
  "concept": [
   "Each shield uses a different gate rule. Repair a new circuit whenever the shield returns.",
   "Setiap perisai memakai aturan gerbang yang berbeda. Perbaiki rangkaian baru setiap kali perisai pulih."
  ],
  "example": [
   "The first shield opens when the switches differ. The next needs both switches on, and the last needs both off.",
   "Perisai pertama terbuka saat posisi sakelar berbeda. Perisai berikutnya memerlukan kedua sakelar aktif, sedangkan perisai terakhir memerlukan keduanya mati."
  ],
  "mission": [
   "Disable the Crimson Warden’s shields, defeat it with the mecha and reach the exit.",
   "Nonaktifkan perisai Crimson Warden, kalahkan dengan mecha, lalu capai pintu keluar."
  ],
  "tips": [
   [
    "Leave marked sword and slam zones. Counterattack during recovery for double damage.",
    "Keluar dari area sapuan pedang dan hantaman yang ditandai. Balas saat bos memulihkan posisi untuk menghasilkan kerusakan ganda."
   ],
   [
    "The first repair powers cover. Interact nearby to clear enemy shots, recharge your shield and stagger the boss.",
    "Perbaikan pertama mengaktifkan pelindung. Gunakan interaksi di dekatnya untuk menghapus tembakan musuh, mengisi perisai, dan membuat bos terhuyung."
   ]
  ]
 }
];
let j=journeyGame.__crJourney;
if(!j){let completed=[];try{completed=JSON.parse(localStorage.getItem('cr-completed-levels')||'[]');}catch{}j=journeyGame.__crJourney={completed:new Set(Array.isArray(completed)?completed.filter(n=>Number.isInteger(n)&&n>=1&&n<=8):[]),stack:[],scene:null,request:null};}
if(j.scene!==runtimeScene){j.root?.remove();j.scene=runtimeScene;j.stack=[];j.savedModal='';j.introShown=false;j.completionShown=false;j.request=null;}
const art=file=>journeyGame.getGameData().resources.resources.find(r=>r.name==='CR_'+file.replace(/[^a-zA-Z0-9]/g,'_'))?.file??'';
const pick=pair=>pair[L.language==='id'?1:0],t=L.tr;
function image(file,label=''){const img=document.createElement('img');img.src=art(file);img.alt=label;img.draggable=false;return img;}
function lock(){ui.modal='journey';runtimeScene.getTimeManager().setTimeScale(0);journeyGame.getInputManager().releaseAllPressedKeys();journeyGame.__crTouch?.clear();ui.mouseDown=false;ui.pressed='';}
function closeAll(){const closingRoot=j.root;L.dismissModal(closingRoot,()=>{if(j.scene!==runtimeScene||j.root!==closingRoot)return;closingRoot?.remove();j.root=null;j.stack=[];ui.modal=j.savedModal??'';runtimeScene.getTimeManager().setTimeScale(ui.modal?0:1);journeyGame.getInputManager().releaseAllPressedKeys();journeyGame.__crTouch?.clear();ui.mouseDown=false;ui.pressed='';const focus=j.returnFocus;if(focus?.isConnected)focus.focus({preventScroll:true});});}
function navigate(scene,reset=false){const root=j.root;if(!root){j.request={scene,reset};return;}L.dismissModal(root,()=>{if(j.root!==root||j.scene!==runtimeScene)return;root.remove();j.root=null;j.stack=[];j.request={scene,reset};});}
function button(parent,label,file,action,attribute){const el=document.createElement('button');el.type='button';el.className='cr-flow-choice';el.dataset.flow=attribute;if(file&&!['ui/next.png','ui/back.png'].includes(file))el.append(image(file));const caption=document.createElement('span');caption.textContent=t(label);el.append(caption);el.setAttribute('aria-label',t(label));el.onclick=action;parent.append(el);return el;}
function paragraph(parent,text,className=''){const p=document.createElement('p');p.className=className;p.textContent=text;parent.append(p);return p;}
function render(){const wasOpen=!!j.root?.isConnected,focusKey=document.activeElement?.dataset.flow,snapshot=wasOpen&&j.root.dataset.screen!==j.stack.at(-1)?L.captureModal(j.root):null;j.root?.remove();if(!j.stack.length)return;lock();const kind=j.stack[j.stack.length-1],root=document.createElement('div');root.id='cr-journey';root.dataset.screen=kind;root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.innerHTML='<style>#cr-journey{position:fixed;inset:0;z-index:11000;background:#020b17ed;display:flex;align-items:center;justify-content:center;color:#ecf8ff;font:16px system-ui;touch-action:pan-y}#cr-journey *{box-sizing:border-box}#cr-journey [hidden]{display:none!important}#cr-journey .cr-flow-panel{width:min(1000px,96vw);max-height:94dvh;overflow:auto;border:18px solid transparent;border-image:url('+JSON.stringify(art('ui/dialog-frame.png'))+') 60/18px;padding:12px;background:#0a2032;background-clip:padding-box;overscroll-behavior:contain}#cr-journey header{position:sticky;top:-12px;z-index:2;background:#0a2032;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 0}#cr-journey h2{font-size:24px;margin:0;color:#85eeff}#cr-journey h3{color:#ffdb82;margin:10px 0}#cr-journey p{line-height:1.6;margin:10px 0}#cr-journey .cr-flow-actions{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin:18px 0 4px}#cr-journey .cr-flow-choice{border:10px solid transparent;border-image:url('+JSON.stringify(art('ui/button-normal.png'))+') 30 fill/10px;background:transparent;color:#eefaff;cursor:pointer;min-height:52px;padding:12px 16px;font:inherit;text-align:center}#cr-journey .cr-flow-choice img{display:block;width:64px;height:64px;object-fit:contain;image-rendering:pixelated;margin:0 auto 8px}#cr-journey .cr-flow-choice span{display:block}#cr-journey .cr-flow-choice:hover,#cr-journey .cr-flow-choice[aria-pressed=true]{filter:brightness(1.2);outline:2px solid #ffd47a;outline-offset:-4px}#cr-journey button:focus-visible{outline:3px solid #ffe08c}#cr-journey .cr-concept{display:grid;grid-template-columns:1.3fr 1fr;gap:22px}#cr-journey .cr-example{border:1px solid #3b6475;padding:14px;background:#102d40;color:#ffd47a;overflow-wrap:anywhere}#cr-journey .cr-flow-badge{display:block;width:100px;height:100px;object-fit:contain;image-rendering:pixelated;margin:10px auto}#cr-journey .cr-levels{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}#cr-journey .cr-levels button{width:100%;padding:10px 6px}#cr-journey .cr-levels strong,#cr-journey .cr-levels small{display:block;margin:6px 0}#cr-journey .cr-levels small{color:#83e7b7}#cr-journey .cr-language-options{display:flex;gap:18px;justify-content:center;flex-wrap:wrap}#cr-journey header .cr-flow-choice{padding:4px 8px;font-size:13px}#cr-journey header .cr-flow-choice img{width:36px;height:36px;margin:0 auto 3px}@media(max-width:700px){#cr-journey{font-size:14px}#cr-journey h2{font-size:18px}#cr-journey .cr-concept{grid-template-columns:1fr}#cr-journey .cr-levels{grid-template-columns:repeat(2,1fr)}#cr-journey .cr-flow-panel{border-width:12px;border-image-width:12px;padding:8px}#cr-journey .cr-flow-actions{gap:8px}#cr-journey .cr-flow-choice{padding:8px}#cr-journey .cr-flow-choice img{width:48px;height:48px}}</style><section class="cr-flow-panel"><header><h2></h2><div class="cr-flow-header-actions"></div></header><div class="cr-flow-content"></div></section>';
 const title=root.querySelector('h2'),head=root.querySelector('.cr-flow-header-actions'),content=root.querySelector('.cr-flow-content');
 title.id='cr-journey-heading';root.setAttribute('aria-labelledby',title.id);
 const heading=document.createElement('div');heading.className='cr-modal-heading';title.before(heading);heading.append(title);

 head.style.display='flex';head.style.gap='6px';const mobileBrowser=journeyGame.__crMobileBrowser;if(mobileBrowser?.isMobile()){const fs=button(head,mobileBrowser.isFullscreen()?'Exit fullscreen':'Enter fullscreen','mobile/fullscreen.png',()=>{void mobileBrowser.toggle();},'fullscreen');fs.setAttribute('data-cr-fullscreen','');mobileBrowser.paint(fs);}
 if(kind==='language'){title.textContent=t('Choose language');const options=document.createElement('div');options.className='cr-language-options';content.append(options);for(const[code,label]of [['id','Bahasa Indonesia'],['en','English']]){const el=button(options,label,'',()=>{L.setLanguage(code);render();},'language-'+code);el.setAttribute('aria-pressed',String(L.language===code));}const actions=document.createElement('div');actions.className='cr-flow-actions';content.append(actions);button(actions,'Back','ui/back.png',()=>{j.stack.pop();if(j.stack.length)render();else closeAll();},'back');}
 else if(kind==='levels'){title.textContent=t('Level List');paragraph(content,t('Choose a level to start a new run.'));const grid=document.createElement('div');grid.className='cr-levels';content.append(grid);for(let n=1;n<=8;n++){const el=document.createElement('button');el.type='button';el.className='cr-flow-choice';el.dataset.level=String(n);const num=document.createElement('strong');num.textContent='Level '+n;const name=document.createElement('span');name.textContent=t(titles[n]);const gate=document.createElement('small');gate.textContent=t(concepts[n])+(j.completed.has(n)?' • '+t('Completed'):'');el.append(num,name,gate);el.onclick=()=>navigate(n===1?'permainan':'sector'+n,true);grid.append(el);}button(head,'Back','ui/back.png',()=>{j.stack.pop();if(j.stack.length)render();else closeAll();},'back');}
 else if(kind==='intro'){
 const intro=introductions[level];title.textContent='Level '+level+' — '+t(titles[level]);
 const languageButton=button(head,'Language','navigation/language.png',()=>j.open('language'),'language');languageButton.querySelector('span').textContent=L.language.toUpperCase();languageButton.title=t('Language');
 const columns=document.createElement('div');columns.className='cr-concept';content.append(columns);
 const lesson=document.createElement('div'),example=document.createElement('div');example.className='cr-example';columns.append(lesson,example);
 const h=document.createElement('h3');h.textContent=t('Concept')+' '+t(concepts[level]);lesson.append(h);paragraph(lesson,pick(intro.concept));
 const label=document.createElement('h3');label.textContent=t('Your mission');lesson.append(label);paragraph(lesson,pick(intro.mission));
 if(level===1){const steps=document.createElement('ol');steps.setAttribute('aria-label',t('How to play'));for(const line of [t('Move with A/D or left/right. Jump with Space.'),t('Climb ladders with W/S or up/down. On touch screens, use the climb buttons near a ladder.'),t('Find a glowing material, then approach a machine and press E or the interact button.'),t('In the challenge, connect the blue output to a gold input. Test the circuit, then confirm the repair.'),t('Repair all three machines, then reach the airlock.')]){const item=document.createElement('li');item.textContent=line;steps.append(item);}lesson.append(steps);}else paragraph(lesson,t('Climb the marked rails with W/S or up/down. Space jumps off.'));
 if(intro.tips){const tips=document.createElement('details');tips.className='cr-intro-tips';const summary=document.createElement('summary');summary.textContent=t('Combat tips');tips.append(summary);for(const tip of intro.tips)paragraph(tips,pick(tip));lesson.append(tips);}
 const eh=document.createElement('h3');eh.textContent=t('Example');example.append(eh);
 paragraph(example,pick(intro.example));
 const actions=document.createElement('div');actions.className='cr-flow-actions';content.append(actions);button(actions,'Start Level','ui/play.png',()=>{closeAll();},'start-level');
 }
 else if(kind==='complete'){title.textContent=t('Level Complete')+' • '+level;content.append(image('navigation/level-complete.png',t('Level Complete')));content.lastElementChild.className='cr-flow-badge';paragraph(content,t(titles[level]));paragraph(content,(L.language==='id'?'Skor: ':'Score: ')+(game?.score??0)+' • '+(L.language==='id'?'Komponen: ':'Parts: ')+(game?.coins??0)+'/3');const actions=document.createElement('div');actions.className='cr-flow-actions';content.append(actions);button(actions,level===8?'View Ending':'Next Level','ui/next.png',()=>navigate(level===8?'winner':'sector'+(level+1)),'next-level');button(actions,'Level List','navigation/level-list.png',()=>j.open('levels'),'level-list');button(actions,'Main Menu','ui/home.png',()=>navigate('opening'),'main-menu');}
 root.tabIndex=-1;root.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();if(kind==='language'||kind==='levels'){j.stack.pop();if(j.stack.length)render();else closeAll();}}if(e.key==='Tab'){const items=[...root.querySelectorAll('button')].filter(el=>!el.closest('[inert]')&&el.getClientRects().length),first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}e.stopPropagation();};document.body.append(root);j.root=root;L.watch(root);([...root.querySelectorAll('[data-flow]')].find(button=>button.dataset.flow===focusKey)??root.querySelector('[data-flow=start-level]')??root.querySelector('[data-flow=next-level]')??root.querySelector('[aria-pressed=true]')??root.querySelector('button'))?.focus({preventScroll:true});L.presentModal(root,{animate:!wasOpen,swap:snapshot});
}
j.open=kind=>{if(!j.stack.length){j.savedModal=ui.modal;j.returnFocus=document.activeElement;}j.stack.push(kind);render();};
if(!j.nav){const nav=document.createElement('div');nav.id='cr-navigation';nav.innerHTML='<style>#cr-navigation{position:fixed;z-index:9500;left:max(12px,env(safe-area-inset-left));top:max(12px,env(safe-area-inset-top));display:flex;align-items:center;gap:8px;pointer-events:none}#cr-navigation[hidden]{display:none}#cr-navigation[data-paused=true]{top:auto;left:50%;transform:translateX(-50%);bottom:max(12px,env(safe-area-inset-bottom))}#cr-navigation button{pointer-events:auto;touch-action:manipulation;width:52px;height:52px;padding:0;border:0;background:transparent;cursor:pointer}#cr-navigation img{width:100%;height:100%;object-fit:contain;image-rendering:pixelated}#cr-navigation span{font:13px system-ui;color:#e5f7ff;text-shadow:1px 1px #000;background:#071d2dcc;padding:4px}#cr-navigation button:focus-visible{outline:2px solid #ffd47a}</style>';for(const[kind,file,label]of [['language','navigation/language.png','Language'],['levels','navigation/level-list.png','Level List']]){const b=document.createElement('button');b.type='button';b.dataset.nav=kind;b.title=label;b.setAttribute('aria-label',label);b.append(image(file));b.onclick=()=>j.open(kind);nav.append(b);}const languageStatus=document.createElement('span');languageStatus.dataset.languageStatus='';nav.append(languageStatus);document.body.append(nav);j.nav=nav;L.watch(nav);}
j.nav.hidden=!!j.stack.length||ui.transitioning||level>0&&ui.modal!=='pause';j.nav.dataset.paused=String(level>0);j.nav.querySelector('[data-language-status]').textContent=L.language.toUpperCase();
if(level>0&&!j.introShown&&game&&game.state==='playing'&&!ui.modal){j.introShown=true;j.open('intro');}
if(level>0&&game?.state==='won'&&!j.completionShown){j.completionShown=true;j.completed.add(level);journeyGame.getVariables().get('CRResumeLevel').setNumber(level<8?level+1:1);try{localStorage.setItem('cr-completed-levels',JSON.stringify([...j.completed]));}catch{}j.stack=[];j.savedModal='';j.open('complete');}
if(j.request){const route=j.request;j.request=null;j.root?.remove();j.root=null;j.stack=[];j.nav.hidden=true;ui.modal='';ui.transitioning=true;journeyGame.__crTouch?.clear();journeyGame.getInputManager().releaseAllPressedKeys();runtimeScene.getTimeManager().setTimeScale(1);if(route.reset)journeyGame.getVariables().get('CRScore').setNumber(0);const selected=route.scene==='permainan'?1:Number(route.scene.replace('sector',''));if(selected>=1&&selected<=8)journeyGame.getVariables().get('CRResumeLevel').setNumber(selected);if(route.scene==='winner')journeyGame.getVariables().get('CRResumeLevel').setNumber(1);gdjs.evtTools.runtimeScene.replaceScene(runtimeScene,route.scene,false);}
L.frame(runtimeScene);
