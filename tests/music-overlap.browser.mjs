import assert from 'node:assert/strict';import {gameBrowser} from './helpers/game-browser.mjs';const f=await gameBrowser();try{
 await f.ready(1);await f.page.waitForFunction(()=>window.__testGame.getSoundManager().getMusicOnChannel(1)?.isLoaded());
 const pending=await f.page.evaluate(()=>{const g=window.__testGame,old=g.getSoundManager().getMusicOnChannel(1);old._howl.stop();old._id=null;old._howl._state='loading';old.play();window.__delayedMusic=old;const count=old._howl._onload.length;g.getSceneStack().getCurrentScene().__islandGame.state='won';return count});assert.ok(pending>0,'simulated slow file must have a pending play callback');
 await f.page.waitForSelector('[data-screen=complete]',{visible:true});await f.page.waitForFunction(()=>window.__testGame.__crMusicTrack==='CR_music_winner');
 const left=await f.page.evaluate(()=>{const h=window.__delayedMusic._howl,n=h._onload.length;h._state='loaded';h._emit('load');return n});assert.equal(left,0,'previous pending playback must be cancelled');
 await new Promise(r=>setTimeout(r,500));assert.equal(await f.page.evaluate(()=>window.__delayedMusic._howl.playing()),false,'a late load must not restart gameplay music');console.log('PASS late-loading gameplay audio cannot restart over victory audio');
 assert.deepEqual(f.errors,[]);assert.deepEqual(f.missing,[]);
}finally{await f.close()}
const loss=await gameBrowser();try{
 await loss.ready(1);await loss.page.waitForFunction(()=>window.__testGame.getSoundManager().getMusicOnChannel(1)?.isLoaded());
 await loss.page.evaluate(()=>{const g=window.__testGame,old=g.getSoundManager().getMusicOnChannel(1);old._howl.stop();old._id=null;old._howl._state='loading';old.play();window.__delayedMusic=old;g.getSceneStack().getCurrentScene().__islandGame.state='gameover'});
 await loss.page.waitForFunction(()=>window.__testGame.getSceneStack().getCurrentScene()?.getName()==='game over'&&window.__testGame.__crMusicTrack==='CR_music_game_over');
 const left=await loss.page.evaluate(()=>{const h=window.__delayedMusic._howl,n=h._onload.length;h._state='loaded';h._emit('load');return n});assert.equal(left,0);await new Promise(r=>setTimeout(r,500));assert.equal(await loss.page.evaluate(()=>window.__delayedMusic._howl.playing()),false);console.log('PASS late-loading gameplay audio cannot restart over game over audio');assert.deepEqual(loss.errors,[]);assert.deepEqual(loss.missing,[]);
}finally{await loss.close()}
