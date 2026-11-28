import assert from 'node:assert/strict';import {gameBrowser} from './helpers/game-browser.mjs';const f=await gameBrowser('opening');try{
 await f.page.waitForFunction(()=>window.__testGame?.getSceneStack().getCurrentScene()?.__animalUI);
 await f.page.evaluate(()=>{const sm=window.__testGame.getSoundManager(),old=sm.playSound.bind(sm);window.clickCount=0;sm.playSound=(name,...args)=>{if(name==='CR_ui_click')window.clickCount++;return old(name,...args)}});
 const pos=await f.page.evaluate(()=>{const s=window.__testGame.getSceneStack().getCurrentScene(),button=s.getObjects('BtnHelp')[0],r=document.querySelector('canvas').getBoundingClientRect();return{x:r.left+(button.getX()+button.getWidth()/2)*r.width/1280,y:r.top+(button.getY()+button.getHeight()/2)*r.height/720}});
 await f.page.mouse.click(pos.x,pos.y,{delay:120});await f.page.waitForFunction(()=>window.clickCount===1);assert.equal(await f.page.evaluate(()=>window.__testGame.getSceneStack().getCurrentScene().__animalUI.modal),'help');console.log('PASS native menu button plays exactly one click');
 await f.page.keyboard.press('Escape',{delay:120});await f.page.waitForFunction(()=>!window.__testGame.getSceneStack().getCurrentScene().__animalUI.modal);await f.page.click('[data-nav=language]');await f.page.waitForFunction(()=>window.clickCount===2);console.log('PASS HTML interface button plays exactly one click');
 assert.deepEqual(f.errors,[]);assert.deepEqual(f.missing,[]);
}finally{await f.close()}
const editor=await gameBrowser();try{
 await editor.ready(1);await editor.page.evaluate(()=>{const s=window.__testGame.getSceneStack().getCurrentScene();s.__islandGame.coins=3;s.__campaign.openMission(1);const sm=window.__testGame.getSoundManager(),old=sm.playSound.bind(sm);window.clickCount=0;sm.playSound=(name,...args)=>{if(name==='CR_ui_click')window.clickCount++;return old(name,...args)}});
 await editor.page.waitForSelector('[data-action=start-challenge]',{visible:true});await editor.page.click('[data-action=start-challenge]');await editor.page.waitForSelector('[data-tool=wire]',{visible:true});await editor.page.click('[data-tool=wire]');await editor.page.waitForFunction(()=>window.clickCount>=2);
 const before=await editor.page.evaluate(()=>window.clickCount);await editor.page.click('[data-port="A.out"]');await editor.page.waitForFunction(n=>window.clickCount>n,{},before);console.log('PASS challenge controls and circuit ports play click sounds');
 assert.deepEqual(editor.errors,[]);assert.deepEqual(editor.missing,[]);
}finally{await editor.close()}
