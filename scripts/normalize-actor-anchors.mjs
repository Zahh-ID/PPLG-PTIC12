import fs from 'node:fs';
import './audit-actor-frames.mjs';
// Normalize rendering through native sprite metadata; PNG pixels/poses stay intact.
const file='Animal Hunter.json',p=JSON.parse(fs.readFileSync(file)),report=JSON.parse(fs.readFileSync('.local/reports/actor-frame-audit.json'));
const images=new Map(report.clips.flatMap(c=>c.frames).map(f=>[f.image,f])),body=[[{x:48,y:40},{x:208,y:40},{x:208,y:224},{x:48,y:224}]];
let changed=0;
for(const scene of p.layouts){const land=scene.objects.find(o=>o.name==='Player')?.animations.find(a=>a.name==='MechaLand');if(!land)continue;
 for(const direction of land.directions)for(const frame of direction.sprites){const bottom=images.get(frame.image).bounds[3],shift=224-bottom,mask=body.map(points=>points.map(point=>({x:point.x,y:point.y-shift})));
  if(frame.originPoint.y!==-shift||JSON.stringify(frame.customCollisionMask)!==JSON.stringify(mask)||frame.points.find(point=>point.name==='ArtFoot')?.y!==bottom){frame.originPoint.y=-shift;frame.customCollisionMask=mask;frame.points=frame.points.filter(point=>point.name!=='ArtFoot');frame.points.push({name:'ArtFoot',x:128,y:bottom});changed++;}
 }
}
if(changed){fs.mkdirSync('.local/backups/actor-anchors',{recursive:true});fs.copyFileSync(file,'.local/backups/actor-anchors/before-'+Date.now()+'.json');fs.writeFileSync(file,JSON.stringify(p,null,2)+'\n');}
console.log('Normalized '+changed+' mecha landing frame definitions. Drawing origins and masks compensate together; the effective physics body stays fixed.');
