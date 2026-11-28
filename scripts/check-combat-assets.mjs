import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
// Validate only combat frames that the current project actually loads.
const projectData=JSON.parse(fs.readFileSync(new URL('../Animal Hunter.json',import.meta.url)));
const v2root=new URL('../assets/circuit-rescue-v1/combat-v2/',import.meta.url),v2=JSON.parse(fs.readFileSync(new URL('manifest.json',v2root)));
const used=new Set(projectData.resources.resources.map(r=>r.file));let v2count=0;
for(const asset of v2.assets){
 if(!used.has('assets/circuit-rescue-v1/combat-v2/'+asset.file))continue;
 const bytes=fs.readFileSync(new URL(asset.file,v2root));
 assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),asset.sha256);v2count++;
}
assert.ok(v2count>0,'Expected current boss and projectile frames');
console.log('Current combat v2 resources verified: '+v2count);
const project=JSON.parse(fs.readFileSync(new URL('../Animal Hunter.json',import.meta.url))),sectors=project.layouts.filter(s=>s.variables.some(v=>v.name==='CampaignLevel'&&Number(v.value)>0));
for(const s of sectors){const level=Number(s.variables.find(v=>v.name==='CampaignLevel').value),boss=s.objects.find(o=>o.name==='CoreBoss');if(boss){for(const a of boss.animations)for(const d of a.directions){assert.equal(d.sprites.length,8);for(const f of d.sprites){assert.ok(f.hasCustomCollisionMask);assert.equal(f.customCollisionMask[0][2].y,224);}}}const guard=s.objects.find(o=>o.name==='Crab');assert.deepEqual(guard.animations.map(a=>a.name).sort(),['Death','Hurt','Idle','Melee','Shoot','Walk']);const bolt=s.objects.find(o=>o.name==='EnemyBolt');assert.deepEqual(bolt.animations.map(a=>a.name),['Plasma','Missile','Wave']);if(level>=7)assert.ok(boss.animations[0].directions[0].sprites[0].image.includes('boss'+level));}
const final=project.layouts.find(s=>s.name==='sector8');assert.equal(Number(final.variables.find(v=>v.name==='WorldWidth').value),6000);assert.equal(final.instances.find(i=>i.name==='CoreBoss').width,640);assert.equal(final.instances.filter(i=>i.name==='ArenaCover').length,3);
console.log('Combat layouts OK: fixed body masks, different bosses and a 6000px final arena.');
// Validate the replacement frames selected by runtime resources.
const v3root=new URL('../assets/circuit-rescue-v1/combat-v3/',import.meta.url),v3=JSON.parse(fs.readFileSync(new URL('manifest.json',v3root)));
let v3count=0;
for(const [actor,number] of Object.entries({boss8:12,mecha:9,guard:6})){
 assert.equal(Object.keys(v3.animations[actor]).length,number);
 for(const [action,a] of Object.entries(v3.animations[actor])){
  assert.equal(a.frames.length,8,actor+'/'+action);const unique=new Set();
  for(const file of a.frames){const bytes=fs.readFileSync(new URL(file,v3root)),entry=v3.assets.find(e=>e.file===file);assert.equal(bytes.readUInt32BE(16),a.width);assert.equal(bytes.readUInt32BE(20),a.height);const hash=crypto.createHash('sha256').update(bytes).digest('hex');assert.equal(hash,entry.sha256);unique.add(hash);assert.ok(project.resources.resources.some(r=>r.file==='assets/circuit-rescue-v1/combat-v3/'+file),'Replacement frame is not referenced: '+file);v3count++;}
  assert.equal(unique.size,8,actor+'/'+action+' must retain eight distinct poses');
 }
}
assert.equal(v3count,216);console.log('Combat v3 OK: 216 replacement frames, 27 eight-frame actions, dimensions/hashes and runtime references verified.');
