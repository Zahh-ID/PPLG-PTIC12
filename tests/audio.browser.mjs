import assert from 'node:assert/strict';
import {gameBrowser} from './helpers/game-browser.mjs';
const fixture=await gameBrowser();const {page,ready,level,errors,missing}=fixture;
const track=async(name,loop)=>{await page.waitForFunction((expected,looping)=>{const g=window.__testGame,m=g?.getSoundManager().getMusicOnChannel(1);return g?.__crMusicTrack===expected&&m?.isLoaded()&&m.playing()&&m.getLoop()===looping;},{timeout:30000},name,loop);};
const navigate=async(name)=>{await page.evaluate(target=>{window.__testGame.__crJourney.request={scene:target,reset:false};},name);await page.waitForFunction(target=>window.__testGame.getSceneStack().getCurrentScene()?.getName()===target,{},name);};
try{
 await ready(1);await track('CR_music_game',true);await page.evaluate(()=>window.__originalMusic=window.__testGame.getSoundManager().getMusicOnChannel(1));console.log('PASS gameplay music loads and loops');
 await level(2);await track('CR_music_game',true);assert.equal(await page.evaluate(()=>window.__originalMusic===window.__testGame.getSoundManager().getMusicOnChannel(1)),true);console.log('PASS gameplay music continues between levels');
 await navigate('game over');await track('CR_music_game_over',false);console.log('PASS defeat replaces gameplay music with game over audio');
 await level(8);await track('CR_music_game',true);await navigate('winner');await track('CR_music_winner',false);console.log('PASS victory replaces previous music with winner audio');
 await navigate('opening');await track('CR_music_game',true);console.log('PASS menu music replaces result music and loops');
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);console.log('PASS no browser errors or missing audio assets');
}finally{await fixture.close();}
const menu=await gameBrowser('opening');
try{
 await menu.page.waitForFunction(()=>window.__testGame?.getSceneStack().getCurrentScene()?.getName()==='opening');
 await menu.page.waitForSelector('#cr-enable-audio');await menu.page.evaluate(()=>{const g=window.__testGame,sm=g.getSoundManager(),old=sm.playSound.bind(sm);window.__soundClicks=0;sm.playSound=(name,...args)=>{if(name==='CR_ui_click')window.__soundClicks++;return old(name,...args)};Howler.mute(true);});await menu.page.waitForSelector('#cr-enable-audio',{visible:true});await menu.page.click('#cr-enable-audio');
 await menu.page.waitForFunction(()=>window.__soundClicks>0);
 await menu.page.waitForFunction(()=>{const g=window.__testGame,m=g?.getSoundManager().getMusicOnChannel(1);return g?.__crMusicTrack==='CR_music_game'&&m?.isLoaded()&&m.playing()&&m.getLoop();},{timeout:30000});
 assert.equal(await menu.page.evaluate(()=>Howler._muted),false);assert.equal(await menu.page.evaluate(()=>window.__testGame.getSoundManager().getMusicOnChannel(1).getVolume()),.65);await menu.page.waitForFunction(()=>document.getElementById('cr-enable-audio').hidden);
 await menu.page.evaluate(()=>{window.__menuMusic=window.__testGame.getSoundManager().getMusicOnChannel(1);window.__testGame.__crJourney.request={scene:'permainan',reset:true};});
 await menu.page.waitForSelector('[data-screen=intro]',{visible:true});
 assert.equal(await menu.page.evaluate(()=>{const m=window.__testGame.getSoundManager().getMusicOnChannel(1);return m===window.__menuMusic&&m.playing();}),true,'Music continues while the introduction is open');
 console.log('PASS music continues during the level introduction before gameplay');
 assert.deepEqual(menu.errors,[]);assert.deepEqual(menu.missing,[]);console.log('PASS original music starts at the opening and continues into gameplay');
}finally{await menu.close();}
