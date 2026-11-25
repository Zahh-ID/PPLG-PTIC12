import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir=new URL('../assets/circuit-rescue-v1/vector-ui/',import.meta.url);
const manifest=JSON.parse(fs.readFileSync(new URL('manifest.json',dir),'utf8'));
const project=JSON.parse(fs.readFileSync(new URL('../Animal Hunter.json',import.meta.url),'utf8'));
let bytes=0,references=0;
for(const [id,icon] of Object.entries(manifest.icons)){
 const svg=fs.readFileSync(new URL(id+'.svg',dir),'utf8');bytes+=Buffer.byteLength(svg);
 assert.match(svg,/<svg[^>]+viewBox="0 0 128 128"/);
 assert.doesNotMatch(svg,/<(?:script|image|foreignObject)\b|\bon\w+=|(?:href|src)\s*=|data:/i,'SVG must be self-contained geometry');
 for(const name of icon.resources){assert.equal(project.resources.resources.find(r=>r.name===name)?.file,'assets/circuit-rescue-v1/vector-ui/'+id+'.svg');references++;}
}
assert.ok(bytes<32000,'Vector UI unexpectedly exceeds its 32KB icon budget');
const logo=fs.readFileSync(new URL(manifest.brand.file,dir),'utf8');
assert.ok(logo.includes(`viewBox="0 0 ${manifest.brand.width} ${manifest.brand.height}"`));
assert.doesNotMatch(logo,/<(?:script|image|foreignObject)\b|\bon\w+=|(?:href|src)\s*=|data:/i);
const lottieIndex=JSON.parse(fs.readFileSync(new URL('lottie/index.json',dir),'utf8'));
assert.deepEqual(lottieIndex.icons,Object.keys(manifest.icons));let animationBytes=0;
for(const id of [...lottieIndex.icons,lottieIndex.logo,lottieIndex.button]){
 const json=fs.readFileSync(new URL('lottie/'+id+'.json',dir),'utf8'),animation=JSON.parse(json);animationBytes+=Buffer.byteLength(json);
 if(id==='logo'){
  assert.equal(animation.assets.length,1);assert.equal(animation.assets[0].p,manifest.brand.file);assert.equal(animation.assets[0].u,'');
  assert.equal(animation.layers.length,1);assert.equal(animation.layers[0].ty,2);
  assert.ok(animation.layers[0].ks.r.a===1,'The emblem must rotate');
 }else{
  assert.equal(animation.assets.length,0,'Icon Lottie files must contain vector shapes without external images');
  assert.ok(animation.layers.length&&animation.layers.every(layer=>layer.ty===4));
 }
 assert.equal(animation.op,12);assert.equal(animation.fr,30);
}
assert.ok(animationBytes<100000,'Lottie vector definitions exceed their 100KB budget');
const theme=fs.readFileSync(new URL('theme.css',dir),'utf8');assert.doesNotMatch(theme,/\{\{/);
assert.ok(theme.includes(`--cr-ui-enter: ${manifest.motion.enterMs}ms`));
assert.ok(theme.includes('prefers-reduced-motion'));
for(const scene of project.layouts.filter(s=>['opening','winner','game over'].includes(s.name))){
 const animations=scene.objects.find(o=>o.name==='MenuHero').animations;
 assert.deepEqual(animations.map(a=>a.name),[scene.name==='game over'?'Death':'Idle']);
}
console.log(`SVG UI OK: ${Object.keys(manifest.icons).length} symbols, ${references} mapped resources, ${bytes} icon bytes; brand mark and 31 vector Lottie files (${animationBytes} bytes), timing, reduced motion and lean menu animations verified.`);
