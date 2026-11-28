import assert from 'node:assert/strict';import {gameBrowser} from './helpers/game-browser.mjs';const f=await gameBrowser();try{
 await f.ready(1);await f.page.waitForFunction(()=>window.__testGame.getSoundManager().getMusicOnChannel(1)?.getVolume()>=.62,{timeout:30000});
 for(const [target,label] of [['CR_music_winner','game to win'],['CR_music_game','win to next level or menu'],['CR_music_game_over','game to game over'],['CR_music_game','game over to menu']]){
  const before=await f.page.evaluate(track=>{const g=window.__testGame,m=g.getSoundManager().getMusicOnChannel(1);window.__previousFadeMusic=m;const volume=m.getVolume();g.__crSetMusic(track);return volume},target);
  await new Promise(r=>setTimeout(r,180));const outgoing=await f.page.evaluate(()=>window.__previousFadeMusic.getVolume());assert.ok(outgoing<before,'old volume should fade: '+label+' '+outgoing+'/'+before);
  await f.page.waitForFunction(track=>{const g=window.__testGame,m=g.getSoundManager().getMusicOnChannel(1);return g.__crMusicTrack===track&&m?.isLoaded()&&m.playing()&&m._id!==null},{timeout:30000},target);
  const initial=await f.page.evaluate(()=>({volume:window.__testGame.getSoundManager().getMusicOnChannel(1).getVolume(),oldPlaying:window.__previousFadeMusic._howl.playing()}));assert.ok(initial.volume<.45,'new music must start quietly: '+label+' '+initial.volume);assert.equal(initial.oldPlaying,false,'old track must stop before new music: '+label);
  await f.page.waitForFunction(()=>window.__testGame.getSoundManager().getMusicOnChannel(1)?.getVolume()>=.62,{timeout:10000});console.log('PASS gradual transition: '+label);
 }
 assert.deepEqual(f.errors,[]);assert.deepEqual(f.missing,[]);
}finally{await f.close()}
