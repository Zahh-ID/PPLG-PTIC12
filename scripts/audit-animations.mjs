import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const project=JSON.parse(fs.readFileSync('Animal Hunter.json','utf8'));
const resources=new Map(project.resources.resources.map(r=>[r.name,r]));
const rows=[],hashes=new Map();
for(const scene of project.layouts)for(const object of scene.objects??[])for(const animation of object.animations??[])for(const [directionIndex,direction] of animation.directions.entries()){
 assert.ok(direction.sprites.length,`${scene.name}/${object.name}/${animation.name}: empty animation`);
 assert.ok(Number.isFinite(direction.timeBetweenFrames)&&direction.timeBetweenFrames>0,'Invalid frame duration');
 const frames=direction.sprites.map(frame=>{const r=resources.get(frame.image);assert.ok(r&&fs.existsSync(r.file),`Missing frame ${frame.image}`);const b=fs.readFileSync(r.file);if(!hashes.has(r.file))hashes.set(r.file,crypto.createHash('sha256').update(b).digest('hex'));return {image:frame.image,file:r.file,width:b.readUInt32BE(16),height:b.readUInt32BE(20),hash:hashes.get(r.file)};});
 if(frames.length>1)assert.equal(new Set(frames.map(f=>`${f.width}x${f.height}`)).size,1,'Frame canvas changes within an action');
 rows.push({scene:scene.name,object:object.name,action:animation.name,direction:directionIndex,frames:frames.length,unique:new Set(frames.map(f=>f.hash)).size,seconds:direction.sprites.length*direction.timeBetweenFrames,loop:direction.looping,files:frames.map(f=>f.file)});
}
fs.mkdirSync('.local/reports',{recursive:true});fs.writeFileSync('.local/reports/animation-inventory.json',JSON.stringify(rows,null,2));
console.log(`Animation inventory: ${project.layouts.length} scenes, ${rows.length} object/action/direction definitions, ${hashes.size} referenced images; no empty animations, missing frames, invalid timing or mixed canvases.`);
console.log('This structural inventory does not certify visual smoothness; review motion and adjacent-cell contamination separately.');
