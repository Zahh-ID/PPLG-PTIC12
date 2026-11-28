import assert from 'node:assert/strict';
import {gameBrowser} from './helpers/game-browser.mjs';
const f=await gameBrowser();const {page,ready,errors,missing}=f;
try{
 await ready(1);
 await page.waitForFunction(()=>window.__testGame.getSceneStack().getCurrentScene().getObjects('MissionHint').length===3);
 let hints=await page.evaluate(()=>window.__testGame.getSceneStack().getCurrentScene().getObjects('MissionHint').map(o=>o.getString()));
 assert.deepEqual(hints,['CHALLENGE: PARTS 0/1\nCOLLECT PARTS FIRST','CHALLENGE: PARTS 0/2\nCOLLECT PARTS FIRST','CHALLENGE: PARTS 0/3\nCOLLECT PARTS FIRST']);
 await page.evaluate(()=>{const g=window.__testGame,s=g.getSceneStack().getCurrentScene();g.__crLocale.setLanguage('id');s.__campaign.completed[0]=true;});
 await page.waitForFunction(()=>{const s=window.__testGame.getSceneStack().getCurrentScene();return s.getObjects('MissionHint').some(o=>o.getString()==='SELESAI')&&s.getObjects('MissionHint').some(o=>o.getString()==='SOAL: KOMPONEN 0/2\nKUMPULKAN KOMPONEN DAHULU')});
 await page.evaluate(()=>{const s=window.__testGame.getSceneStack().getCurrentScene(),t=s.getObjects('MissionTerminal').find(o=>o.getVariables().get('TerminalId').getAsNumber()===1),p=s.getObjects('Player')[0];p.setPosition(t.getX()-30,t.getY()+t.getHeight()-112);p.getBehavior('Platformer').setCurrentSpeed(0);p.getBehavior('Platformer').setCurrentFallSpeed(0);});
 await page.keyboard.press('e');await page.waitForFunction(()=>window.__testGame.getSceneStack().getCurrentScene().__islandGame.message.includes('2 more components'));assert.equal(await page.$('#cr-workbench'),null);
 await page.evaluate(()=>{const s=window.__testGame.getSceneStack().getCurrentScene();s.__islandGame.coins=2;});await page.waitForFunction(()=>window.__testGame.getSceneStack().getCurrentScene().getObjects('MissionHint').some(o=>o.getString()==='SOAL: E / TOMBOL AKSI'));
 await page.evaluate(()=>{const s=window.__testGame.getSceneStack().getCurrentScene(),r=s.getObjects('ClimbRail')[0],p=s.getObjects('Player')[0];s.__islandGame.invincibleUntil=1e6;p.setPosition(r.getX()+r.getWidth()/2-p.getWidth()/2,r.getVariables().get('LowerFloor').getAsNumber()-112);p.getBehavior('Platformer').setCurrentSpeed(0);p.getBehavior('Platformer').setCurrentFallSpeed(0);});
 await page.keyboard.down('w');await page.waitForFunction(()=>window.__testGame.getSceneStack().getCurrentScene().getObjects('Player')[0].getBehavior('Platformer').isOnLadder());
 await page.waitForFunction(()=>{const s=window.__testGame.getSceneStack().getCurrentScene(),p=s.getObjects('Player')[0],r=s.getObjects('ClimbRail')[0];return p.getY()<r.getVariables().get('LowerFloor').getAsNumber()-220});
 await page.keyboard.up('w');await page.keyboard.down('d');await page.waitForFunction(()=>{const p=window.__testGame.getSceneStack().getCurrentScene().getObjects('Player')[0];return !p.getBehavior('Platformer').isOnLadder()&&p.getBehavior('Platformer').getCurrentFallSpeed()>10&&p.getAnimationName()==='Fall'});await page.keyboard.up('d');
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);console.log('PASS localized challenge labels, repaired state, and gravity after leaving a ladder');
}finally{await f.close()}
