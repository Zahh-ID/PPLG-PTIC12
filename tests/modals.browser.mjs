import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
const base=path.resolve('dist'),errors=[],passed=[];
const server=http.createServer((req,res)=>{
 const file=path.resolve(base,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname).replace(/\/$/,'/index.html'));
 if(!file.startsWith(base+path.sep)||!fs.existsSync(file)){res.writeHead(404).end();return;}
 res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.json':'application/json'})[path.extname(file)]??'application/octet-stream');
 let data=fs.readFileSync(file);
 if(file.endsWith('.html'))data=data.toString().replace('var game = new gdjs.RuntimeGame(gdjs.projectData, {});',"localStorage.setItem('cr-language','en');var game=window.__testGame=new gdjs.RuntimeGame(gdjs.projectData, {});");
 res.end(data);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await puppeteer.launch({headless:true,executablePath:process.env.PUPPETEER_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
const page=await browser.newPage();page.setDefaultTimeout(30000);await page.setViewport({width:1280,height:720});
page.on('pageerror',e=>errors.push(e.message));
const wait=(f,...args)=>page.waitForFunction(f,{},...args),pass=text=>{passed.push(text);console.log('PASS '+text);};
async function settled(){await wait(()=>[...document.querySelectorAll('#cr-journey .cr-flow-panel,#cr-workbench .cr-window')].every(el=>!['opening','swapping'].includes(el.closest('[role=dialog]').dataset.motion)&&el.getAnimations().every(a=>a.playState==='finished')));}
try{
 await page.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'domcontentloaded'});
 await page.waitForSelector('[data-nav=levels]',{visible:true});assert.equal(await page.evaluate(()=>typeof anime.createTimeline),'function');
 const opening=await page.$eval('[data-nav=levels]',button=>{
  window.__openingSample=new Promise(resolve=>{const started=performance.now();function sample(){
   const image=document.querySelector('.cr-lottie-logo svg > g image'),matrix=image?.getCTM(),layer=document.querySelector('.cr-reveal');
   if(layer&&matrix&&Math.atan2(matrix.b,matrix.a)>.4){resolve({asset:image.getAttribute('href')||image.getAttribute('xlink:href'),compactWidth:new DOMMatrix(getComputedStyle(layer.querySelector('.cr-reveal-shell')).transform).a*layer.getBoundingClientRect().width,badgeWidth:layer.querySelector('.cr-reveal-badge').getBoundingClientRect().width,clip:getComputedStyle(layer.querySelector('.cr-reveal-badge')).clipPath,logoSize:parseFloat(getComputedStyle(layer.querySelector('.cr-reveal-emblem')).width),locked:document.querySelector('.cr-flow-panel').inert});return;}
   if(performance.now()-started>2500){resolve({error:'Emblem did not turn before revealing the modal'});return;}requestAnimationFrame(sample);
  }requestAnimationFrame(sample);});button.click();return{motion:document.getElementById('cr-journey').dataset.motion,locked:document.querySelector('.cr-flow-panel').inert};
 });assert.equal(opening.motion,'opening');assert.equal(opening.locked,true);
 const turning=await page.evaluate(()=>window.__openingSample);assert.equal(turning.error,undefined,JSON.stringify(turning));assert.ok(turning.asset.endsWith('/circuit-rescue-mark.svg'));
 assert.ok(Math.abs(turning.compactWidth-turning.badgeWidth)<=2,JSON.stringify(turning));assert.ok(turning.clip.startsWith('polygon(')&&turning.clip.split(',').length===6,JSON.stringify(turning));assert.ok(turning.logoSize>=220,JSON.stringify(turning));assert.equal(turning.locked,true);
 await settled();assert.equal(await page.$('.cr-reveal'),null);assert.equal(await page.$('.cr-lottie-logo'),null);await page.$eval('.cr-modal-brand',img=>img.decode());pass('Only the generated emblem turns before the modal expands, with input locked and temporary players removed');
 const renderResults=await page.evaluate(async()=>{
  const index=await fetch('vector-ui/lottie/index.json').then(r=>r.json());
  return Promise.all([...index.icons,'button-feedback'].map(async id=>{
   const animationData=await fetch('vector-ui/lottie/'+id+'.json').then(r=>r.json()),container=document.createElement('div');container.style.cssText='position:fixed;left:-1000px;width:128px;height:128px';document.body.append(container);
   const result=await new Promise((resolve,reject)=>{const player=lottie.loadAnimation({container,renderer:'svg',loop:false,autoplay:false,animationData});const timer=setTimeout(()=>reject(Error('Lottie did not render: '+id)),3000);player.addEventListener('DOMLoaded',()=>{player.goToAndStop(5,true);clearTimeout(timer);resolve({id,paths:container.querySelectorAll('svg path').length,frames:player.totalFrames});player.destroy();});});
   container.remove();return result;
  }));
 });
 assert.ok(renderResults.every(r=>r.paths>0&&r.frames===12),JSON.stringify(renderResults));pass('Every generated Lottie icon and text-button feedback file renders as local vector paths');
 await page.hover('[data-flow=back]');assert.equal(await page.$('.cr-lottie-overlay[data-lottie-icon=button-feedback]'),null);pass('Text navigation stays quiet on hover without adding arrow icons or blocking input');
 assert.equal(await page.$eval('#cr-journey',el=>el.getAttribute('aria-labelledby')),'cr-journey-heading');
 assert.equal(await page.$eval('.cr-flow-panel',el=>getComputedStyle(el).borderImageSource),'none');pass('Shared vector theme overrides the legacy modal borders and supplies an accessible heading');
 await page.click('[data-level="1"]');await page.waitForSelector('[data-flow=start-level]');await settled();
 const tutorial=await page.$eval('.cr-flow-content',e=>e.textContent);assert.doesNotMatch(tutorial,/[←→↶↷⇒=]/);assert.ok(tutorial.includes('When the switch is off, the lamp is on.'));pass('Tutorials use plain-language examples without equation or arrow glyphs');
 await page.hover('[data-flow=start-level]');await page.waitForSelector('.cr-lottie-overlay[data-lottie-icon=play][data-lottie-ready=true] svg');await wait(()=>!document.querySelector('.cr-lottie-overlay'));assert.equal(await page.$eval('[data-flow=start-level] img',img=>img.style.opacity),'');pass('Icon feedback restores its SVG fallback after one play');
 await page.mouse.move(0,0);await page.hover('[data-flow=start-level]');await page.waitForSelector('.cr-lottie-overlay[data-lottie-ready=true]');
 const closing=await page.$eval('[data-flow=start-level]',el=>{
  const root=document.getElementById('cr-journey');window.__closingSample=new Promise(resolve=>{let folded=false,hex=false,group=null;const began=performance.now();function sample(){
   const layer=root.querySelector('.cr-reveal');if(layer){const shell=layer.querySelector('.cr-reveal-shell'),badge=layer.querySelector('.cr-reveal-badge');folded ||=new DOMMatrix(getComputedStyle(shell).transform).a<.7;hex ||=+getComputedStyle(badge).opacity>.7;group=layer.querySelector('.cr-lottie-logo svg > g > g')||group;}
   if(!root.isConnected){const matrix=group?.getAttribute('transform');resolve({folded,hex,angle:matrix?Math.atan2(new DOMMatrix(matrix).b,new DOMMatrix(matrix).a):null});return;}
   if(performance.now()-began>2500){resolve({error:'Closing did not finish'});return;}requestAnimationFrame(sample);
  }requestAnimationFrame(sample);});el.click();return{paused:window.__testGame.getSceneStack().getCurrentScene().getTimeManager().getTimeScale(),locked:root.inert,motion:root.dataset.motion,effects:document.querySelectorAll('.cr-lottie-overlay').length};
 });
 assert.equal(closing.paused,0);assert.equal(closing.locked,true);
 assert.equal(closing.motion,'closing');assert.equal(closing.effects,0);
 const folded=await page.evaluate(()=>window.__closingSample);assert.equal(folded.error,undefined,JSON.stringify(folded));assert.ok(folded.folded&&folded.hex,JSON.stringify(folded));assert.ok(folded.angle===null||folded.angle<.4,JSON.stringify(folded));
 await wait(()=>!document.getElementById('cr-journey'));await wait(()=>window.__testGame.getSceneStack().getCurrentScene().__islandGame?.time>.2);
 pass('Closing the introduction keeps gameplay paused until the exit transition completes');
 await page.evaluate(()=>{const s=window.__testGame.getSceneStack().getCurrentScene();s.__islandGame.coins=3;s.__campaign.openMission(2);});
 await page.waitForSelector('#cr-workbench');await settled();
 assert.equal(await page.$eval('#cr-workbench',el=>el.getAttribute('aria-labelledby')),'cr-workbench-heading');
 await page.waitForSelector('[data-action=start-challenge]',{visible:true});await page.click('[data-action=start-challenge]');await page.waitForFunction(()=>document.querySelector('#cr-workbench')?.dataset.motion==='ready');
 assert.equal(await page.$eval('.feedback',el=>el.hidden),true);assert.equal(await page.$('.wiring-guide'),null);assert.equal(await page.$('.wire-status'),null);
 assert.equal(await page.$eval('[data-action=undo]',el=>!!el.closest('.cr-editor-toolbar')),true);
 assert.equal(await page.$eval('[data-tool=wire]',el=>!!el.closest('.cr-editor-toolbar')),true);
 await page.hover('[data-action=close]');await page.waitForSelector('.cr-lottie-overlay[data-lottie-ready=true]');
 const swapped=await page.$eval('[data-action=brief]',button=>{button.click();return{motion:document.getElementById('cr-workbench').dataset.motion,effects:document.querySelectorAll('.cr-lottie-overlay').length,clones:document.querySelectorAll('.cr-swap-outgoing').length};});assert.equal(swapped.motion,'swapping');assert.equal(swapped.effects,0);assert.equal(swapped.clones,1);await settled();assert.equal(await page.$('.cr-swap-outgoing'),null);
 await page.click('[data-action=start-challenge]');await settled();pass('View swaps animate without replaying the logo or carrying icon effects into the next view');
 await page.click('[data-action=hint]');assert.equal(await page.$eval('#cr-context-hint',el=>el.hidden),false);assert.equal(await page.$eval('[data-action=hint]',el=>el.getAttribute('aria-expanded')),'true');assert.equal(await page.$eval('.feedback',el=>el.hidden),true);
 await page.click('[data-action=help]');assert.equal(await page.$eval('#cr-context-hint',el=>el.hidden),true);assert.equal(await page.$eval('#cr-context-help',el=>el.hidden),false);
 await page.keyboard.press('Escape');assert.equal(await page.$eval('#cr-context-help',el=>el.hidden),true);assert.equal(await page.evaluate(()=>window.__testGame.getSceneStack().getCurrentScene().getTimeManager().getTimeScale()),0);
 pass('Hints and help open on demand, close independently and keep validation feedback separate');
 const gatePoint=await page.$eval('[data-tool=not]',button=>{const b=button.getBoundingClientRect();return{x:b.left+b.width/2,y:b.top+b.height/2};});
 await page.mouse.move(gatePoint.x,gatePoint.y);await page.mouse.down();await page.mouse.move(gatePoint.x+30,gatePoint.y+30,{steps:3});await page.waitForSelector('.gate-drag-ghost');
 await page.$eval('[data-action=brief]',button=>button.click());assert.equal(await page.$('.gate-drag-ghost'),null);await page.mouse.up();await settled();await page.click('[data-action=start-challenge]');await settled();pass('Changing views cancels an active gate drag without leaving a floating preview');
 await page.click('[data-tool=not]');await page.click('[data-cell="34"]');await page.click('[data-tool=wire]');
 await page.click('[data-port="A.out"]');await page.click('[data-port="g34.a"]');await wait(()=>window.__testGame.getSceneStack().getCurrentScene().__campaign.board.links.length===1);assert.equal(await page.$eval('.feedback',el=>el.hidden),true);
 await page.click('[data-action=undo]');await wait(()=>window.__testGame.getSceneStack().getCurrentScene().__campaign.board.links.length===0);
 await page.click('[data-action=redo]');await wait(()=>window.__testGame.getSceneStack().getCurrentScene().__campaign.board.links.length===1);
 pass('Port connections preserve editing and undo/redo without repeated instruction banners');
 for(const width of [1280,900,390]){
  await page.setViewport({width,height:844});await settled();
  const data=await page.$eval('.cr-window',el=>{const r=el.getBoundingClientRect(),board=el.querySelector('.cr-grid').getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,boardLeft:board.left,boardRight:board.right};});
  assert.ok(data.left>=0&&data.right<=width+1&&data.top>=0&&data.bottom<=844,JSON.stringify(data));
  assert.ok(data.boardLeft>=data.left&&data.boardRight<=data.right+1,JSON.stringify(data));
 }
 pass('Modal and full circuit board fit desktop, medium and portrait viewports');
 await page.focus('[data-action=close]');await page.keyboard.down('Shift');await page.keyboard.press('Tab');await page.keyboard.up('Shift');
 assert.equal(await page.evaluate(()=>document.getElementById('cr-workbench').contains(document.activeElement)),true);
 await page.keyboard.press('Escape');await page.keyboard.press('Escape');await wait(()=>!document.getElementById('cr-workbench'));
 assert.equal(await page.evaluate(()=>window.__testGame.getSceneStack().getCurrentScene().__animalUI.modal),'');pass('Keyboard focus stays in the challenge and repeated close input resumes only once');
 await page.evaluate(()=>window.__testGame.getSceneStack().getCurrentScene().__campaign.openMission(2));
 assert.equal(await page.$eval('#cr-workbench',el=>el.dataset.motion),'opening');
 const portraitBadge=await page.$eval('.cr-reveal-badge',el=>{const b=el.getBoundingClientRect();return{left:b.left,right:b.right,top:b.top,bottom:b.bottom};});assert.ok(portraitBadge.left>=0&&portraitBadge.right<=390&&portraitBadge.top>=0&&portraitBadge.bottom<=844,JSON.stringify(portraitBadge));
 await page.setViewport({width:844,height:390});await settled();
 assert.equal(await page.$('.cr-reveal'),null);assert.equal(await page.$eval('.cr-window',el=>el.inert),false);
 await page.click('[data-action=close]');await wait(()=>!document.getElementById('cr-workbench'));
 pass('Resizing during a reveal leaves the dialog visible and usable without stale layers');
 await page.evaluate(()=>window.__testGame.getSceneStack().getCurrentScene().__campaign.openMission(2));
 await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
 await settled();assert.equal(await page.$('.cr-reveal'),null);
 assert.equal(await page.$eval('.cr-window',el=>el.inert),false);
 assert.equal(await page.$('.cr-lottie-overlay'),null);
 pass('Enabling reduced motion during a reveal immediately unlocks the dialog');
 await page.click('[data-action=close]');assert.equal(await page.$('#cr-workbench'),null);
 await page.evaluate(()=>window.__testGame.getSceneStack().getCurrentScene().__campaign.openMission(2));await page.waitForSelector('#cr-workbench');
 assert.equal(await page.$eval('.cr-window',el=>getComputedStyle(el).animationName),'none');
 await page.click('[data-action=close]');assert.equal(await page.$('#cr-workbench'),null);pass('Reduced motion removes entrance and exit movement without delaying controls');
 await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'no-preference'}]);
 await page.evaluate(()=>{const player=window.__crLottie;try{delete window.__crLottie;window.__testGame.getSceneStack().getCurrentScene().__campaign.openMission(2);}finally{window.__crLottie=player;}});await settled();assert.equal(await page.$eval('.cr-window',el=>el.inert),false);
 await page.click('[data-action=close]');await wait(()=>!document.getElementById('cr-workbench'));pass('The SVG animation fallback opens and dismisses safely when the Lottie controller is unavailable');
 await page.setViewport({width:1280,height:720});
 await page.keyboard.press('h',{delay:80});await wait(()=>window.__testGame.getSceneStack().getCurrentScene().__animalUI.modal==='help');
 assert.ok(await page.evaluate(()=>window.__testGame.getSceneStack().getCurrentScene().getObjects('HelpText')[0].getString().includes('Collect three materials')));
 await page.keyboard.press('Escape',{delay:80});await wait(()=>!window.__testGame.getSceneStack().getCurrentScene().__animalUI.modal);
 await page.keyboard.press('p',{delay:80});await wait(()=>window.__testGame.getSceneStack().getCurrentScene().__animalUI.modal==='pause');
 await page.evaluate(()=>window.__testGame.getVariables().get('AHCreditsReady').setBoolean(true));
 await wait(()=>!window.__testGame.getSceneStack().getCurrentScene().getObjects('ModalCredits')[0].isHidden());
 const creditsPoint=await page.evaluate(()=>{const s=window.__testGame.getSceneStack().getCurrentScene(),o=s.getObjects('ModalCredits')[0],c=s.getGame().getRenderer().getCanvas().getBoundingClientRect();return{x:c.left+(o.getX()+o.getWidth()/2)*c.width/1280,y:c.top+(o.getY()+o.getHeight()/2)*c.height/720};});
 await page.mouse.move(creditsPoint.x,creditsPoint.y);await page.mouse.down();await wait(()=>window.__testGame.getSceneStack().getCurrentScene().__animalUI.pressed==='ModalCredits');await page.mouse.up();await wait(()=>window.__testGame.getSceneStack().getCurrentScene().__animalUI.modal==='credits');
 const names=await page.evaluate(()=>{const s=window.__testGame.getSceneStack().getCurrentScene();return ['CreditNameProgrammer','CreditNameArtist','CreditNameLevelDesign'].map(n=>s.getObjects(n)[0].getString());});assert.deepEqual(names,['Syahruzzahid','Nazwa Hilmia Zida','Syarifatus Sholihah']);
 await page.keyboard.press('Escape',{delay:80});await wait(()=>window.__testGame.getSceneStack().getCurrentScene().__animalUI.modal==='pause');
 await page.keyboard.press('p',{delay:80});await wait(()=>!window.__testGame.getSceneStack().getCurrentScene().__animalUI.modal);pass('Native help, pause and developer credits preserve their return paths and resume safely');
 await page.evaluate(()=>window.__testGame.getSceneStack().replace('game over',false));await wait(()=>window.__testGame.getSceneStack().getCurrentScene().getName()==='game over');
 await wait(()=>window.__testGame.getSceneStack().getCurrentScene().getObjects('ResultTitle')[0].getString()==='MISSION FAILED');
 const homePoint=await page.evaluate(()=>{const s=window.__testGame.getSceneStack().getCurrentScene(),o=s.getObjects('BtnHome')[0],c=s.getGame().getRenderer().getCanvas().getBoundingClientRect();return{x:c.left+(o.getX()+o.getWidth()/2)*c.width/1280,y:c.top+(o.getY()+o.getHeight()/2)*c.height/720};});
 await page.mouse.move(homePoint.x,homePoint.y);await page.mouse.down();await wait(()=>window.__testGame.getSceneStack().getCurrentScene().__animalUI.pressed==='BtnHome');await page.mouse.up();await wait(()=>window.__testGame.getSceneStack().getCurrentScene().getName()==='opening');pass('The native loss screen returns to the opening menu through its Home control');
 assert.deepEqual(errors,[]);pass('No modal runtime errors');
}finally{
 fs.mkdirSync('.local/reports',{recursive:true});fs.writeFileSync('.local/reports/modal-results.json',JSON.stringify({passed,errors},null,2));
 await browser.close();server.close();
}
