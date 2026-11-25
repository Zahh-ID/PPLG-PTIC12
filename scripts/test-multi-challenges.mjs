import {circuitPlan} from '../tests/helpers/circuit-plan.mjs';
import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../src/events/campaign.js',import.meta.url),'utf8');
function controller(level){const vars=new Map();const v=n=>({getAsNumber:()=>n==='CampaignLevel'?level:vars.get(n)??0,setNumber:x=>vars.set(n,x)});const scene={getVariables:()=>({get:v}),getObjects:()=>[],getGame:()=>({getVariables:()=>({get:v}),getInputManager:()=>({isKeyPressed:()=>false})}),getTimeManager:()=>({isFirstFrame:()=>false})};vm.runInNewContext('(function(runtimeScene){'+source+'})',{})(scene);return scene.__campaign;}
const expected={not:a=>1-a,and:(a,b)=>a&b,or:(a,b)=>a|b,xor:(a,b)=>a^b,nand:(a,b)=>1-(a&b),nor:(a,b)=>1-(a|b),combined:(a,b)=>a&b,'nand-only-and':(a,b)=>a&b};
function solution(c,id){const spec=c.getChallengeSpec(id),m=c.createCircuit(id),plan=circuitPlan(spec);for(const[n,gate]of plan.gates)assert.equal(m.set(n,gate),true);for(const[from,to]of plan.links)assert.equal(m.connect(from,to),true);return m;}
let cases=0,predictions=0,builds=0;
for(let level=1;level<=8;level++){const c=controller(level);assert.equal(c.tasks.length,3);assert.equal(c.completed.filter(Boolean).length,0);
 for(let id=0;id<3;id++){const s=c.getChallengeSpec(id);assert.equal(s.task.requiredParts,id+1);const m=s.task.kind==='predict'?null:solution(c,id);if(m)builds++;else predictions++;
  for(const a of [0,1])for(const b of s.unary?[0]:[0,1])for(const z of s.task.three?[0,1]:[0]){const answer=s.task.three?(a===1&&b===1&&z===0?1:0):expected[s.type](a,b);assert.equal(s.expected(a,b,z),answer,'target '+level+'/'+id);if(m){const r=m.evaluate(a,b);assert.equal(r.error,'','wiring '+level+'/'+id);assert.equal(r.value,answer,'output '+level+'/'+id);}cases++;}
 }
}
const missing=solution(controller(2),2);missing.disconnect('B.out>g34.b');assert.match(missing.evaluate(1,1).error,/disconnected/);
const restricted=controller(5).createCircuit(2);assert.equal(restricted.set(34,'and'),false);assert.equal(restricted.set(37,'not'),false);assert.equal(restricted.set(39,'wire'),false);assert.equal(restricted.set(34,'wire'),false);
const ports=solution(controller(2),2);assert.ok(ports.ports().filter(p=>p.id==='g34.a'||p.id==='g34.b').every(p=>p.side==='left'));assert.equal(ports.connect('g34.a','B.out'),true);assert.equal(ports.links.filter(l=>l.to==='g34.a').length,1);assert.equal(ports.connect('A.out','B.out'),false);assert.equal(ports.connect('Y.in','g34.a'),false);
const feedback=solution(controller(6),2);feedback.connect('g37.out','g34.a');assert.match(feedback.evaluate(1,1).error,/Feedback loop/);
const fanout=solution(controller(5),2);assert.equal(fanout.links.filter(l=>l.from==='g34.out').length,2);const saved=fanout.snapshot();fanout.set(37,'erase');assert.match(fanout.evaluate(1,1).error,/Place a gate/);fanout.restore(saved);assert.equal(fanout.evaluate(1,1).value,1);
console.log('Circuit ports OK: '+cases+' input cases across 24 challenges ('+predictions+' prediction quizzes, '+builds+' repair/build circuits), left-side inputs, two-way connection gestures, single drivers, fan-out, restricted chips, missing links, cycles and snapshot restore.');
