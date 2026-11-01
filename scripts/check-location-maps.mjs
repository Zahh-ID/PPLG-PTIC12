import fs from 'node:fs';import assert from 'node:assert/strict';
const p=JSON.parse(fs.readFileSync(new URL('../Animal Hunter.json',import.meta.url),'utf8')),backgrounds=new Set(),dimensions=new Set();
for(let level=1;level<=8;level++){
 const scene=p.layouts.find(s=>s.name===(level===1?'permainan':'sector'+level));const value=n=>Number(scene.variables.find(v=>v.name===n)?.value);const w=value('WorldWidth'),h=value('WorldHeight');assert.ok(w>=2000&&h>720);dimensions.add(w+'x'+h);
 const objects=n=>scene.instances.filter(i=>i.name===n),terminals=objects('MissionTerminal');assert.equal(terminals.length,3);assert.deepEqual(terminals.map(i=>Number(i.initialVariables.find(v=>v.name==='TerminalId')?.value)).sort(),[0,1,2]);assert.ok(new Set(terminals.map(i=>i.y)).size>=2);assert.equal(objects('Coin').length,3);
 const platforms=scene.instances.filter(i=>['Ground','Ledge'].includes(i.name)),player=objects('Player')[0],spawnFeet=player.y+(level>=7?168:112);const supports=(a,x,y,width)=>Math.abs(a.y-y)<.01&&x+width>a.x&&x<a.x+a.width;
 const reached=new Set(platforms.map((a,i)=>supports(a,player.x,spawnFeet,player.width)?i:-1).filter(i=>i>=0));assert.ok(reached.size,'supported spawn in '+scene.name);
 // Conservative jump graph: <=155 upward rise and <=180 horizontal gap. Downward routes may descend farther.
 for(let changed=true;changed;){changed=false;for(const i of [...reached])for(let j=0;j<platforms.length;j++){if(reached.has(j))continue;const a=platforms[i],b=platforms[j],gap=Math.max(0,a.x-(b.x+b.width),b.x-(a.x+a.width)),rise=a.y-b.y;if(gap<=180&&rise<=155&&rise>=-900){reached.add(j);changed=true;}}}
 for(const terminal of terminals)assert.ok([...reached].some(i=>supports(platforms[i],terminal.x,terminal.y+terminal.height,terminal.width)),'reachable terminal in '+scene.name);
 const exit=objects('ExitDoor')[0];assert.ok([...reached].some(i=>supports(platforms[i],exit.x,exit.y+exit.height,exit.width)),'reachable exit in '+scene.name);
 assert.equal(scene.objects.find(o=>o.name==='Ledge').behaviors.find(b=>b.name==='Platform').platformType,'Jumpthru');assert.equal(objects('RepairLift').length,1);assert.equal(objects('RouteGate').length,1);
 const image=scene.objects.find(o=>o.name==='IslandBackground').animations[0].directions[0].sprites[0].image;backgrounds.add(image);
}
assert.equal(backgrounds.size,8);assert.equal(dimensions.size,8);console.log('Location maps OK: 8 unique backgrounds and world sizes; 24 reachable terminals, supported spawns/exits, native one-way routes, lifts and barriers.');
