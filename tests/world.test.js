import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, example, editable } from '../shared/world.js';
const circuit=kind=>example().map((d,i)=>({...d,id:String(i),kind:d.kind==='and'?kind:d.kind,on:false}));
for(const kind of ['and','or','not'])test(`${kind.toUpperCase()} truth table through connected wires and door`,()=>{
  for(const a of [false,true])for(const b of [false,true]){
    const devices=circuit(kind), switches=devices.filter(d=>d.kind==='switch');switches[0].on=a;switches[1].on=b;
    const result=evaluate(devices), door=devices.find(d=>d.kind==='door');
    assert.equal(result[door.id],kind==='and'?a&&b:kind==='or'?a||b:!a);
  }
});
test('removing an input wire disconnects AND signal',()=>{
  const devices=circuit('and').filter(d=>!(d.kind==='wire'&&d.x===29&&d.y===23));
  devices.filter(d=>d.kind==='switch').forEach(d=>d.on=true);
  assert.equal(evaluate(devices)[devices.find(d=>d.kind==='door').id],false);
});
test('feedback loop rejected instead of hanging',()=>{
  const devices=[{id:'g',kind:'not',x:20,y:20}];
  for(const [x,y] of [[19,20],[19,19],[20,19],[21,19],[22,19],[22,20]])devices.push({id:`${x},${y}`,kind:'wire',x,y});
  assert.throws(()=>evaluate(devices),/feedback loop/);
});
test('every occupied cell must be in editable workshop',()=>{
  assert.equal(editable({kind:'door',x:30,y:26}),false);
  assert.equal(editable({kind:'and',x:109,y:20}),false);
  assert.equal(editable({kind:'door',x:38,y:25}),true);
});
