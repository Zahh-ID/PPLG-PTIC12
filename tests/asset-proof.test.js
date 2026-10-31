import {test} from 'node:test';import assert from 'node:assert/strict';
import {PROOF_LAYOUT as l,createAssetProof,advanceAssetProof,proofAction,proofParallax} from '../shared/asset-proof.js';
const at=(s,p)=>{s.x=p.x-16;};
test('asset proof keeps locked/ready/complete interactions readable and reusable',()=>{
  const s=createAssetProof();at(s,l.console);assert.equal(proofAction(s),'locked');assert.equal(s.solved,false);
  at(s,l.socket);assert.equal(proofAction(s),'locked');at(s,l.switch);assert.equal(proofAction(s),'switch');assert.equal(s.power,true);
  at(s,l.fuse);advanceAssetProof(s,{},.02);assert.equal(s.fuse,true);
  at(s,l.socket);assert.equal(proofAction(s),'socket');assert.equal(proofAction(s),'complete');
  at(s,l.console);assert.equal(proofAction(s),'console');assert.equal(s.solved,true);
});
test('proof pause freezes motion and shots; repeated fire preserves cooldown and facing',()=>{
  const s=createAssetProof();advanceAssetProof(s,{right:true,shoot:true},.05);assert.equal(s.shots,1);assert.equal(s.moving,true);
  for(let i=0;i<5;i++)advanceAssetProof(s,{right:true,shoot:true},.05);assert.equal(s.shots,1);
  for(let i=0;i<3;i++)advanceAssetProof(s,{left:true,shoot:true},.05);assert.equal(s.shots,2);assert.equal(s.facing,-1);
  s.paused=true;const before=structuredClone(s);advanceAssetProof(s,{right:true,shoot:true},.05);assert.deepEqual(s,before);
});
test('parallax wrapping handles both camera directions independently per layer',()=>{
  assert.equal(proofParallax(-20,.5,100),90);assert.equal(proofParallax(220,.5,100),10);
  assert.notEqual(proofParallax(100,.15,768),proofParallax(100,.65,768));
});
