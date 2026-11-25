import fs from 'node:fs';
import assert from 'node:assert/strict';
const p=JSON.parse(fs.readFileSync('Animal Hunter.json')),rows=[];
const value=(i,name)=>i.initialVariables.find(v=>v.name===name)?.value;
const baseline=(i,y)=>assert.ok(Math.abs(i.y+i.height*y/128-Number(value(i,'FloorY')))<.01,'Visible floor anchor: '+i.name+' '+JSON.stringify(i));
for(const s of p.layouts.filter(s=>s.variables.some(v=>v.name==='CampaignLevel'&&+v.value>0))){
 const O=name=>s.instances.filter(i=>i.name===name),defs=name=>s.objects.find(o=>o.name===name);
 assert.equal(O('MissionDevice').length,3);assert.ok(new Set(O('MissionDevice').map(i=>value(i,'Kind'))).size>=2);
 for(const d of O('MissionDevice')){baseline(d,122);assert.equal(d.width,d.height);assert.ok(d.width>=96&&d.width<=104);for(const state of ['Off','On'])assert.ok(defs('MissionDevice').animations.some(a=>a.name===value(d,'Kind')+state));}
 for(const part of O('Coin')){assert.equal(part.width,44);assert.equal(part.height,44);baseline(part,112);}
 assert.equal(new Set(O('Coin').map(i=>value(i,'Material'))).size,3);
 for(const [name,bottom]of [['LocationProp0',119],['HealthPickup',103],['Ammo',122],['Checkpoint',122],['ExitDoor',122],['ArenaCover',122]])for(const i of O(name))baseline(i,bottom);
 for(const i of O('Crab')){assert.equal(i.width,96);assert.equal(i.height,96);}
 for(const name of ['FireRange','DetectionRange'])assert.ok(defs('Crab').variables.find(v=>v.name===name)?.value>0);
 const mecha=Number(s.variables.find(v=>v.name==='CampaignLevel').value)>=6,half=mecha?60:19,body=mecha?138:80;
 for(const rail of O('ClimbRail')){const x=rail.x+rail.width/2,top=Number(value(rail,'UpperFloor'))-body-8,bottom=Number(value(rail,'LowerFloor'));for(const beam of O('Bulkhead'))assert.ok(!(beam.x<x+half+4&&beam.x+beam.width>x-half-4&&beam.y<bottom&&beam.y+beam.height>top),'Shaft blocked by a lintel in '+s.name);}
 assert.equal(O('RepairLift').length,0);
 rows.push({scene:s.name,devices:O('MissionDevice').map(i=>value(i,'Kind')),materials:O('Coin').map(i=>value(i,'Material')),rails:O('ClimbRail').length,bulkheads:O('Bulkhead').length});
}
fs.mkdirSync('.local/reports',{recursive:true});fs.writeFileSync('.local/reports/world-placement.json',JSON.stringify(rows,null,2));
console.log('World placements OK: 24 varied devices, 24 materials, fixed visible floor anchors/scales, jump-through lifts and clear native climbing shafts.');
