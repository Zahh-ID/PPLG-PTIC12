import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const root=new URL('../assets/circuit-rescue-v1/combat/',import.meta.url),manifest=JSON.parse(fs.readFileSync(new URL('manifest.json',root)));
let count=0;for(const[actor,actions]of Object.entries(manifest.animations)){assert.equal(Object.keys(actions).length,9);for(const[name,a]of Object.entries(actions)){assert.equal(a.frames.length,8,actor+'/'+name);const hashes=new Set();for(const file of a.frames){const b=fs.readFileSync(new URL(file,root));assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(b.readUInt32BE(16),a.width);assert.equal(b.readUInt32BE(20),a.height);const hash=crypto.createHash('sha256').update(b).digest('hex');assert.equal(hash,manifest.assets.find(a=>a.file===file).sha256);hashes.add(hash);count++;}assert.equal(hashes.size,8,actor+'/'+name+' must contain 8 distinct frame files');}}
assert.equal(count,144);console.log('Combat assets OK: 18 actions, 8 unique PNG frames each, 144 total; dimensions and hashes verified.');
const v2root=new URL('../assets/circuit-rescue-v1/combat-v2/',import.meta.url),v2=JSON.parse(fs.readFileSync(new URL('manifest.json',v2root)));
const expected={mecha:9,boss7:9,boss8:12,guard:6,projectiles:4};let total=0;
for(const[actor,number]of Object.entries(expected)){
 const actions=v2.animations[actor];assert.equal(Object.keys(actions).length,number,actor);
 for(const[action,a]of Object.entries(actions)){
  assert.equal(a.frames.length,8,actor+'/'+action);const hashes=new Set();
  for(const file of a.frames){const b=fs.readFileSync(new URL(file,v2root)),entry=v2.assets.find(v=>v.file===file);assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(b.readUInt32BE(16),a.width);assert.equal(b.readUInt32BE(20),a.height);assert.ok(entry.visiblePixels>100);const hash=crypto.createHash('sha256').update(b).digest('hex');assert.equal(hash,entry.sha256);hashes.add(hash);total++;}
  assert.equal(hashes.size,8,actor+'/'+action+' needs eight distinct generated poses');
 }
}
assert.equal(total,320);assert.equal(v2.totalFrames,320);
const project=JSON.parse(fs.readFileSync(new URL('../Animal Hunter.json',import.meta.url))),sectors=project.layouts.filter(s=>s.variables.some(v=>v.name==='CampaignLevel'&&Number(v.value)>0));
for(const s of sectors){const level=Number(s.variables.find(v=>v.name==='CampaignLevel').value),boss=s.objects.find(o=>o.name==='CoreBoss');if(boss){for(const a of boss.animations)for(const d of a.directions){assert.equal(d.sprites.length,8);for(const f of d.sprites){assert.ok(f.hasCustomCollisionMask);assert.equal(f.customCollisionMask[0][2].y,224);}}}const guard=s.objects.find(o=>o.name==='Crab');assert.deepEqual(guard.animations.map(a=>a.name).sort(),['Death','Hurt','Idle','Melee','Shoot','Walk']);const bolt=s.objects.find(o=>o.name==='EnemyBolt');assert.deepEqual(bolt.animations.map(a=>a.name),['Plasma','Missile','Wave']);if(level>=7)assert.ok(boss.animations[0].directions[0].sprites[0].image.includes('boss'+level));}
const final=project.layouts.find(s=>s.name==='sector8');assert.equal(Number(final.variables.find(v=>v.name==='WorldWidth').value),6000);assert.equal(final.instances.find(i=>i.name==='CoreBoss').width,640);assert.equal(final.instances.filter(i=>i.name==='ArenaCover').length,3);
console.log('Combat v2 OK: 36 actor actions + 4 projectile animations, 320 distinct frames, fixed body masks, different bosses and a 6000px final arena.');
