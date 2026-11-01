import fs from 'node:fs';import assert from 'node:assert/strict';import {projectFile,repoRoot,walkEvents} from './check-project.mjs';
const project=JSON.parse(fs.readFileSync(projectFile)),resources=new Map(project.resources.resources.map(r=>[r.name,r]));
const sectors=project.layouts.filter(s=>s.variables.some(v=>v.name==='CampaignLevel'&&Number(v.value)>0));assert.equal(sectors.length,8);
const mask=(l,t,r,b)=>[[{x:l,y:t},{x:r,y:t},{x:r,y:b},{x:l,y:b}]];
for(const scene of sectors){
 const player=scene.objects.find(o=>o.name==='Player'),drone=scene.objects.find(o=>o.name==='Crab');
 for(const a of player.animations)for(const d of a.directions){assert.equal(d.sprites.length,a.name==='Idle'?1:8,a.name+' has an unexpected frame count');if(a.name==='Idle')assert.equal(d.sprites[0].image,'CR_player_idle_03_png');for(const f of d.sprites){assert.equal(f.hasCustomCollisionMask,true);assert.deepEqual(f.customCollisionMask,a.name.startsWith('Mecha')?mask(48,40,208,224):mask(45,32,83,112));const file=resources.get(f.image).file,b=fs.readFileSync(repoRoot+'/'+file),size=a.name.startsWith('Mecha')?256:128;assert.equal(b.readUInt32BE(16),size);assert.equal(b.readUInt32BE(20),size);if(!a.name.startsWith('Mecha'))assert.match(file,/\/player-v3\//);assert.equal(f.originPoint.x,0);assert.equal(f.originPoint.y,0);}}
 for(const a of drone.animations)for(const d of a.directions)for(const f of d.sprites){assert.equal(f.hasCustomCollisionMask,true);assert.deepEqual(f.customCollisionMask,mask(32,26,96,120));}
 for(const i of scene.instances.filter(i=>i.name==='Crab')){assert.equal(i.width,i.height);const feet=i.y+i.height*120/128;assert.ok(scene.instances.some(platform=>['Ground','Ledge'].includes(platform.name)&&Math.abs(platform.y-feet)<.01&&i.x+i.width>platform.x&&i.x<platform.x+platform.width),'Patrol spawn must be supported by its room floor');}
 for(const e of walkEvents(scene.events))for(const a of e.actions??[])assert.ok(!(a.type?.value==='SetAnimationName'&&a.parameters?.[0]==='Player'),'Competing native player animation action in '+scene.name);
}
console.log('Actor definitions OK: 8 sectors, consistent player/drone masks, corrected player frames, square patrol sprites, no competing native animation actions.');
