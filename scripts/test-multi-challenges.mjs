import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../src/events/campaign.js',import.meta.url),'utf8');
function controller(level){const vars=new Map();const v=n=>({getAsNumber:()=>n==='CampaignLevel'?level:vars.get(n)??0,setNumber:x=>vars.set(n,x)});const scene={getVariables:()=>({get:v}),getObjects:()=>[],getGame:()=>({getVariables:()=>({get:v}),getInputManager:()=>({isKeyPressed:()=>false})}),getTimeManager:()=>({isFirstFrame:()=>false})};vm.runInNewContext('(function(runtimeScene){'+source+'})',{})(scene);return scene.__campaign;}
const expected={not:a=>1-a,and:(a,b)=>a&b,or:(a,b)=>a|b,xor:(a,b)=>a^b,nand:(a,b)=>1-(a&b),nor:(a,b)=>1-(a|b),combined:(a,b)=>a&b,'nand-only-and':(a,b)=>a&b};
function solution(c,id){const s=c.getChallengeSpec(id),m=c.createCircuit(id);m.set(34,['combined','nand-only-and'].includes(s.type)?'nand':s.type);const wire=s.unary?[31,32,33,35,36,37,38]:[11,12,13,23,33,51,52,53,54,44];if(!s.unary){if(s.type==='combined'){m.set(37,'not');wire.push(35,36,38);}else if(s.type==='nand-only-and'){m.set(37,'nand');wire.push(35,36,46,47,38);}else wire.push(35,36,37,38);}for(const n of wire)assert.equal(m.set(n,'wire'),true);return m;}
let cases=0,predictions=0,builds=0;
for(let level=1;level<=8;level++){const c=controller(level);assert.equal(c.tasks.length,3);assert.equal(c.completed.filter(Boolean).length,0);
 for(let id=0;id<3;id++){const s=c.getChallengeSpec(id);assert.equal(s.task.requiredParts,id+1);const m=s.task.kind==='predict'?null:solution(c,id);if(m)builds++;else predictions++;
  for(const a of [0,1])for(const b of s.unary?[0]:[0,1])for(const z of s.task.three?[0,1]:[0]){const answer=s.task.three?(a===1&&b===1&&z===0?1:0):expected[s.type](a,b);assert.equal(s.expected(a,b,z),answer,'target '+level+'/'+id);if(m){const r=m.evaluate(a,b);assert.equal(r.error,'','wiring '+level+'/'+id);assert.equal(r.value,answer,'output '+level+'/'+id);}cases++;}
 }
}
const c=controller(2),short=solution(c,2);short.set(43,'wire');assert.match(short.evaluate(1,0).error,/Short circuit/);const missing=solution(c,2);missing.set(33,'erase');assert.match(missing.evaluate(1,1).error,/disconnected/);
const restricted=controller(5).createCircuit(2);assert.equal(restricted.set(34,'and'),false);assert.equal(restricted.set(37,'not'),false);assert.equal(restricted.set(39,'wire'),false);assert.equal(restricted.set(34,'wire'),false);
const shape=solution(controller(1),2);assert.equal(shape.mask(32),10);assert.equal(shape.mask(33),10);
console.log('Circuit model OK: '+cases+' input cases across 24 challenges ('+predictions+' prediction quizzes, '+builds+' repair/build circuits), restricted chips, invalid networks and auto-connect masks.');
