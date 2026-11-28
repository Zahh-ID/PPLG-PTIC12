import assert from 'node:assert/strict';import {gameBrowser} from './helpers/game-browser.mjs';const f=await gameBrowser();try{
 await f.ready(1);
 for(let level=1;level<=8;level++){
  if(level>1)await f.level(level);
  await f.page.evaluate(()=>{window.__testGame.getSceneStack().getCurrentScene().__islandGame.state='gameover'});
  await f.page.waitForFunction(()=>{const g=window.__testGame,m=g.getSoundManager().getMusicOnChannel(1);return g.getSceneStack().getCurrentScene()?.getName()==='game over'&&g.__crMusicTrack==='CR_music_game_over'&&m?.isLoaded()&&m.playing()&&m.getVolume()>.5},{timeout:30000});
  if(level===2){await f.page.evaluate(()=>{const m=window.__testGame.getSoundManager().getMusicOnChannel(1);m.setSeek(m._howl.duration()-.2)});await f.page.waitForFunction(()=>window.__testGame.getSoundManager().getMusicOnChannel(1)?.__crFinished,{timeout:10000});}
  const pos=await f.page.evaluate(()=>{const s=window.__testGame.getSceneStack().getCurrentScene(),o=s.getObjects('BtnReplay')[0],r=document.querySelector('canvas').getBoundingClientRect();return{x:r.left+(o.getX()+o.getWidth()/2)*r.width/1280,y:r.top+(o.getY()+o.getHeight()/2)*r.height/720}});
  await f.page.mouse.click(pos.x,pos.y,{delay:120});await f.page.waitForFunction(n=>window.__testGame.getSceneStack().getCurrentScene()?.__campaign?.level===n,{timeout:30000},level);await f.page.waitForSelector('[data-screen=intro]',{visible:true});
  await f.page.waitForFunction(()=>{const g=window.__testGame,m=g.getSoundManager().getMusicOnChannel(1),node=m?._howl?._soundById(m._id)?._node;return g.__crMusicTrack==='CR_music_game'&&m?.isLoaded()&&m.playing()&&m.getVolume()>.2&&node&&!node.paused&&!node.muted},{timeout:30000});
  const start=await f.page.evaluate(()=>window.__testGame.getSoundManager().getMusicOnChannel(1).getSeek());await f.page.waitForFunction(t=>window.__testGame.getSoundManager().getMusicOnChannel(1).getSeek()>t+.12,{timeout:5000},start);
  console.log('PASS level '+level+': game over and replay resume audible gameplay music');
 }
 assert.deepEqual(f.errors,[]);assert.deepEqual(f.missing,[]);
}finally{await f.close()}
