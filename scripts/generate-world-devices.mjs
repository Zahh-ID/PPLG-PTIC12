import fs from 'node:fs';
import path from 'node:path';
const out=path.resolve('assets/circuit-rescue-v1/world-devices');fs.mkdirSync(out,{recursive:true});
const kinds=['relay','fan','lever','scanner','winch','signal','pump','valve','reactor','coupler','shield','weapon'];
const rect=(x,y,w,h,fill,stroke='#101c2b')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="4"/>`;
for(const kind of kinds)for(const on of [false,true]){
 const steel='#456079',dark='#1b2c40',light='#8fa8b9',live=on?'#55e2db':'#bd8c4a';
 let shapes=rect(20,112,88,8,dark)+rect(28,104,16,8,steel)+rect(84,104,16,8,steel);
 if(['relay','scanner','signal'].includes(kind)){
  shapes+=rect(30,24,68,80,steel)+rect(38,32,52,40,dark)+rect(40,80,48,16,light);
  if(kind==='relay')shapes+=rect(44,40,12,24,live)+rect(64,40,12,24,live)+rect(48,84,24,8,live);
  if(kind==='scanner')shapes+=`<circle cx="64" cy="52" r="14" fill="${live}" stroke="${light}" stroke-width="4"/>`+rect(44,48,40,4,light);
  if(kind==='signal')shapes+=rect(44,40,12,12,live)+rect(66,40,12,12,on?'#89eb84':'#5f727b')+rect(48,60,28,4,light)+rect(60,8,8,16,light);
 }else if(kind==='fan'){
  shapes+=rect(24,24,80,80,steel)+`<circle cx="64" cy="64" r="30" fill="${dark}" stroke="${light}" stroke-width="4"/><path d="M64 36v28l24 14M88 48 64 64 40 82M38 50l26 14v28" fill="none" stroke="${live}" stroke-width="12"/><circle cx="64" cy="64" r="8" fill="${light}"/>`;
 }else if(['pump','valve'].includes(kind)){
  shapes+=rect(8,68,112,20,steel)+rect(36,40,56,64,steel)+rect(46,48,36,16,dark)+`<circle cx="64" cy="82" r="20" fill="${dark}" stroke="${live}" stroke-width="6"/><path d="M44 82h40M64 62v40" stroke="${light}" stroke-width="6"/>`;
  if(kind==='pump')shapes+=rect(16,44,16,32,light)+rect(96,40,16,36,light);
 }else if(kind==='winch'){
  shapes+=rect(12,32,12,80,steel)+rect(104,32,12,80,steel)+rect(12,24,104,16,steel)+rect(40,44,48,28,dark)+rect(46,48,36,20,live)+`<path d="M64 72v18h12v12H60" fill="none" stroke="${light}" stroke-width="8"/>`;
 }else if(kind==='lever'){
  shapes+=rect(28,80,72,24,steel)+rect(44,72,40,12,dark)+`<path d="M64 78 ${on?'84 36':'40 36'}" fill="none" stroke="${light}" stroke-width="8"/>`+rect(on?76:32,28,16,16,live);
 }else if(['reactor','shield'].includes(kind)){
  shapes+=rect(32,20,64,84,steel)+rect(40,28,48,68,dark)+`<path d="m64 32 20 24-8 32H52l-8-32z" fill="${live}" stroke="${light}" stroke-width="4"/>`+rect(20,40,12,48,light)+rect(96,40,12,48,light);
 }else if(kind==='coupler'){
  shapes+=rect(24,40,80,64,steel)+rect(36,48,56,44,dark)+rect(42,56,16,28,live)+rect(70,56,16,28,live)+rect(8,72,16,20,light)+rect(104,72,16,20,light);
 }else{
  shapes+=rect(24,32,80,72,steel)+rect(32,40,64,56,dark)+rect(40,48,12,40,light)+rect(60,48,12,40,live)+rect(80,48,12,40,light);
 }
 shapes+=rect(30,108,8,4,live)+rect(90,108,8,4,live);
 fs.writeFileSync(path.join(out,kind+'-'+(on?'on':'off')+'.svg'),`<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" shape-rendering="crispEdges">${shapes}</svg>\n`);
}
fs.writeFileSync(path.join(out,'anchor.svg'),'<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"/>\n');
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({canvas:128,floorBaseline:122,kinds,states:['off','on'],purpose:'Floor-anchored mission machinery; native vector assets, no raster atlas download.'},null,2)+'\n');
console.log('Generated 24 compact machinery SVGs with a common floor anchor.');
