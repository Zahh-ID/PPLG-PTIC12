import fs from 'node:fs';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

// Decode PNG pixels without a Python/Pillow dependency. No image rewriting or screenshots.
function rgba(file){
 const bytes=fs.readFileSync(file);assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 const w=bytes.readUInt32BE(16),h=bytes.readUInt32BE(20),depth=bytes[24],type=bytes[25],bpp=type===6?4:type===2?3:0;
 assert.equal(depth,8,file+' needs an 8-bit source');assert.ok(bpp,file+' uses an unsupported actor PNG encoding');assert.equal(bytes[28],0,'Interlaced actor source');
 const chunks=[];for(let i=8;i<bytes.length;){const length=bytes.readUInt32BE(i);if(bytes.toString('ascii',i+4,i+8)==='IDAT')chunks.push(bytes.subarray(i+8,i+8+length));i+=length+12;}
 const packed=zlib.inflateSync(Buffer.concat(chunks)),stride=w*bpp,data=Buffer.alloc(stride*h),paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
 let offset=0;for(let y=0;y<h;y++){const filter=packed[offset++];for(let x=0;x<stride;x++){const i=y*stride+x,a=x>=bpp?data[i-bpp]:0,b=y?data[i-stride]:0,c=y&&x>=bpp?data[i-stride-bpp]:0;data[i]=(packed[offset++]+(filter===0?0:filter===1?a:filter===2?b:filter===3?Math.floor((a+b)/2):paeth(a,b,c)))&255;}}
 return{w,h,data,bpp,hash:crypto.createHash('sha256').update(bytes).digest('hex')};
}
const p=JSON.parse(fs.readFileSync('Animal Hunter.json')),resources=new Map(p.resources.resources.map(r=>[r.name,r.file])),pixels=new Map(),silhouettes=new Map(),clips=new Map(),actors=new Set(['Player','Crab','CoreBoss','MenuHero','HangarMecha']);
function inspect(file){if(pixels.has(file))return pixels.get(file);const image=rgba(file),{w,h,data,bpp}=image,visible=new Uint8Array(w*h),seen=new Uint8Array(w*h);let count=0,sx=0,sy=0,minX=w,minY=h,maxX=-1,maxY=-1,edge=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x,a=bpp===4?data[i*bpp+3]:255;if(a<32)continue;visible[i]=1;count++;sx+=x;sy+=y;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);if(x===0||y===0||x===w-1||y===h-1)edge++;}
 const components=[];for(let i=0;i<visible.length;i++){if(!visible[i]||seen[i])continue;const queue=[i];seen[i]=1;let edgePixels=0;for(let k=0;k<queue.length;k++){const n=queue[k],x=n%w,y=Math.floor(n/w);if(x===0||x===w-1||y===0||y===h-1)edgePixels++;for(const next of [x?n-1:-1,x<w-1?n+1:-1,y?n-w:-1,y<h-1?n+w:-1])if(next>=0&&visible[next]&&!seen[next]){seen[next]=1;queue.push(next);}}components.push({pixels:queue.length,edgePixels});}
 components.sort((a,b)=>b.pixels-a.pixels);assert.ok(count>100,'Blank actor frame: '+file);assert.ok(count<w*h*.98,'Opaque actor matte: '+file);
 const result={file,width:w,height:h,hash:image.hash,visiblePixels:count,bounds:[minX,minY,maxX+1,maxY+1],centroid:[sx/count,sy/count].map(n=>+n.toFixed(2)),edgePixels:edge,mainComponentEdgePixels:components[0].edgePixels,detachedEdgePixels:edge-components[0].edgePixels,components:components.filter(c=>c.pixels>=8)};
 silhouettes.set(file,{visible,w,h});pixels.set(file,result);return result;
}
function bodyMetrics(file,mask){if(!mask?.length)return null;const {visible,w,h}=silhouettes.get(file),points=mask.flat(),left=Math.floor(Math.min(...points.map(p=>p.x))),right=Math.ceil(Math.max(...points.map(p=>p.x))),top=Math.floor(Math.min(...points.map(p=>p.y))),bottom=Math.ceil(Math.max(...points.map(p=>p.y)));let body=0,foot=0;for(let y=Math.max(0,top);y<Math.min(h,bottom);y++)for(let x=Math.max(0,left);x<Math.min(w,right);x++){const value=visible[y*w+x];body+=value;if(y>=bottom-4)foot+=value;}return{bounds:[left,top,right,bottom],visibleCoverage:+(body/((right-left)*(bottom-top))).toFixed(3),footBandVisiblePixels:foot};}
for(const scene of p.layouts)for(const object of scene.objects.filter(o=>actors.has(o.name)))for(const action of object.animations??[])for(const [direction,d]of action.directions.entries()){
 const signature=object.name+'/'+action.name+'/'+direction+'/'+d.sprites.map(f=>f.image).join(','),existing=clips.get(signature);
 if(existing){existing.scenes.push(scene.name);continue;}
 const rows=d.sprites.map((f,index)=>{assert.equal(f.originPoint.x,0);if(action.name==='MechaLand')assert.ok(f.originPoint.y<=0&&f.originPoint.y>=-40);else assert.equal(f.originPoint.y,0);const file=resources.get(f.image),stats=inspect(file);const mask=f.customCollisionMask;
  if(object.name!=='MenuHero')assert.ok(f.hasCustomCollisionMask,'Actor body needs a stable explicit mask: '+object.name);
  if(mask?.length){for(const polygon of mask)for(const point of polygon)assert.ok(point.x>=0&&point.y>=0&&point.x<=stats.width&&point.y<=stats.height,'Body mask outside frame');}
  const effectiveBodyMask=mask?.map(points=>points.map(point=>({x:point.x-f.originPoint.x,y:point.y-f.originPoint.y})));
  const renderedBounds=stats.bounds.map((n,i)=>n-(i%2?f.originPoint.y:f.originPoint.x));
  return{frame:index+1,image:f.image,...stats,renderedBounds,renderedCentroid:[stats.centroid[0]-f.originPoint.x,stats.centroid[1]-f.originPoint.y],bodyMask:mask,effectiveBodyMask,bodyMetrics:bodyMetrics(file,mask),origin:f.originPoint};
 });
 assert.equal(new Set(rows.map(r=>r.width+'x'+r.height)).size,1);assert.equal(new Set(rows.map(r=>JSON.stringify(r.effectiveBodyMask))).size,1,'Frame-dependent collision body in '+object.name+'/'+action.name);
 const transitions=rows.slice(1).map((r,i)=>({from:i+1,to:i+2,centroidShift:+Math.hypot(r.centroid[0]-rows[i].centroid[0],r.centroid[1]-rows[i].centroid[1]).toFixed(2),visibleAreaRatio:+(r.visiblePixels/rows[i].visiblePixels).toFixed(3)}));
 clips.set(signature,{object:object.name,action:action.name,direction,scenes:[scene.name],fps:1/d.timeBetweenFrames,loop:d.looping,frames:rows,transitions});
}
const report={method:'Numeric, per-frame PNG alpha/component, origin, mask, size, timing and adjacent-frame audit. No visual review.',sceneFrameReferences:[...clips.values()].reduce((n,c)=>n+c.frames.length*c.scenes.length,0),uniqueFrames:pixels.size,clips:[...clips.values()],edgeCandidates:[...pixels.values()].filter(r=>r.edgePixels).map(({file,edgePixels,mainComponentEdgePixels,detachedEdgePixels})=>({file,edgePixels,mainComponentEdgePixels,detachedEdgePixels}))};
fs.mkdirSync('.local/reports',{recursive:true});fs.writeFileSync('.local/reports/actor-frame-audit.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({sceneFrameReferences:report.sceneFrameReferences,uniqueFrames:report.uniqueFrames,uniqueClips:report.clips.length,edgeCandidates:report.edgeCandidates},null,2));
