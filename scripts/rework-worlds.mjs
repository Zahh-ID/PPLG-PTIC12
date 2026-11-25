import fs from 'node:fs';
import crypto from 'node:crypto';
import './generate-world-devices.mjs';
const file='Animal Hunter.json',p=JSON.parse(fs.readFileSync(file)),layouts=JSON.parse(fs.readFileSync('docs/location-layouts.json'));
if(!process.argv.includes('--apply')){console.log('Use --apply to rebuild room geometry and placements in all eight sectors. A recovery copy is kept under .local/backups/world-rework.');process.exit(0);}
fs.mkdirSync('.local/backups/world-rework',{recursive:true});fs.copyFileSync(file,'.local/backups/world-rework/rooms-'+Date.now()+'.json');
const resource=(name,file)=>{const r=p.resources.resources.find(r=>r.name===name);if(r)r.file=file;else p.resources.resources.push({kind:'image',name,file,metadata:'',userAdded:true,alwaysLoaded:false,smoothed:false});return name;};
const deviceKinds=[null,['relay','fan','lever'],['scanner','winch','lever'],['signal','lever','relay'],['scanner','relay','signal'],['pump','valve','reactor'],['reactor','coupler','lever'],['shield','weapon','relay'],['shield','reactor','shield']];
const materials=[null,['fuse','wire-coil','battery'],['scrap-gear','wire-coil','battery'],['fuse','scrap-gear','wire-coil'],['battery','wire-coil','fuse'],['energy-orb','wire-coil','battery'],['battery','scrap-gear','wire-coil'],['fuse','battery','scrap-gear'],['energy-orb','battery','wire-coil']];
const materialBounds=JSON.parse(fs.readFileSync('assets/circuit-rescue-v1/materials-v2/manifest.json')).bounds;
const bottoms=Object.fromEntries(Object.keys(materialBounds).map(k=>[k,112]));
const frame=(image)=>({image,hasCustomCollisionMask:false,customCollisionMask:[],points:[],originPoint:{name:'origine',x:0,y:0},centerPoint:{name:'centre',x:64,y:64,automatic:true}});
const animation=(name,image)=>({name,useMultipleDirections:false,directions:[{sprites:[frame(image)],timeBetweenFrames:1,looping:true}]});
const number=(name,value)=>({name,type:'number',value}),string=(name,value)=>({name,type:'string',value});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
for(let level=1;level<=8;level++){
 const s=p.layouts.find(s=>s.name===(level===1?'permainan':'sector'+level)),meta=layouts.find(l=>l.level===level),W=meta.w;
 const old=s.instances,template=s.objects.find(o=>o.name==='Ground'),sprite=s.objects.find(o=>o.name==='Coin');
 function tiled(name,texture,type){let o=s.objects.find(o=>o.name===name);if(!o){o=structuredClone(template);o.name=name;o.persistentUuid=crypto.randomUUID();s.objects.push(o);s.objectsFolderStructure.children[0].children.push({objectName:name});}o.texture=texture;o.behaviors=type?[{name:'Platform',type:'PlatformBehavior::PlatformBehavior',platformType:type,canBeGrabbed:false}]:[];return o;}
 tiled('Bulkhead','CR_terrain_wall_png','Normal');tiled('RoomHull','CR_terrain_hull_png');tiled('ClimbRail','CR_climb_ladder','Ladder');
 tiled('ShortcutGate','CR_terrain_wall_png','Normal');
 let device=s.objects.find(o=>o.name==='MissionDevice');if(!device){device=structuredClone(sprite);device.name='MissionDevice';device.persistentUuid=crypto.randomUUID();device.variables=[];device.behaviors=[];s.objects.push(device);s.objectsFolderStructure.children[0].children.push({objectName:'MissionDevice'});}
 device.animations=[];
 for(const kind of new Set(deviceKinds[level]))for(const state of ['off','on'])device.animations.push(animation(kind+(state==='on'?'On':'Off'),resource('CR_device_'+kind+'_'+state,'assets/circuit-rescue-v1/world-devices-pixel/'+kind+'.png')));
 const anchor=resource('CR_mission_anchor','assets/circuit-rescue-v1/world-devices/anchor.svg');
 s.objects.find(o=>o.name==='MissionTerminal').animations=[animation('Off',anchor),animation('On',anchor)];
 s.objects.find(o=>o.name==='ExitDoor').animations=[animation('Closed','CR_props_airlock_closed_png'),animation('Open','CR_props_airlock_open_png')];
 const cover=s.objects.find(o=>o.name==='ArenaCover');if(cover){cover.animations=['off','on'].map(state=>{const a=animation(state==='on'?'On':'Off','CR_device_shield_'+state),f=a.directions[0].sprites[0];f.hasCustomCollisionMask=true;f.customCollisionMask=[[{x:20,y:20},{x:108,y:20},{x:108,y:122},{x:20,y:122}]];return a;});}
 sprite.animations=materials[level].map((kind,i)=>{const a=animation('Part'+i,'CR_material_v2_'+kind.replaceAll('-','_')),f=a.directions[0].sprites[0],[l,t,r,b]=materialBounds[kind];f.hasCustomCollisionMask=true;f.customCollisionMask=[[{x:l,y:t},{x:r,y:t},{x:r,y:b},{x:l,y:b}]];return a;});
 const guard=s.objects.find(o=>o.name==='Crab');for(const [name,value]of Object.entries({FireRange:440,DetectionRange:560}))if(!guard.variables.some(v=>v.name===name))guard.variables.push(number(name,value));
 s.objects.find(o=>o.name==='Player').behaviors.find(b=>b.name==='Platformer').ladderClimbingSpeed=220;
 s.objects.find(o=>o.name==='Player').behaviors.find(b=>b.name==='Platformer').canGoDownFromJumpthru=true;
 const removed=new Set(['RepairLift','RouteGate','Ground','Ledge','Soil','Bulkhead','RoomHull','ClimbRail','ShortcutGate','RoomLabel','MissionDevice','LocationProp0','LocationProp1','LocationProp2','Coin']);
 s.instances=old.filter(i=>!removed.has(i.name));
 function add(name,x,y,width,height,vars=[],z=3){const i={name,x,y,width,height,customSize:true,angle:0,zOrder:z,layer:'',persistentUuid:crypto.randomUUID(),numberProperties:[],stringProperties:[],initialVariables:vars};s.instances.push(i);return i;}
 const modules=meta.rooms.map(([x,floor],id)=>({id,x:clamp(x-240,16,W-656),floor,width:640,center:x+64}));
 // Distinct shafts and a return loop replace the diagonal staircase chains.
 const shafts=[];
 for(let id=0;id<2;id++){const a=modules[id],b=modules[id+1],x=clamp(Math.round((a.center+b.center)/2),200,W-240);shafts.push({x,top:Math.min(a.floor,b.floor),bottom:Math.max(a.floor,b.floor),from:id,to:id+1});}
 if(level!==3&&level!==6&&modules[0].floor!==modules[2].floor){const a=modules[0],b=modules[2];shafts.push({x:clamp(a.x+100,160,W-240),top:Math.min(a.floor,b.floor),bottom:Math.max(a.floor,b.floor),from:0,to:2,shortcut:true});}
 if(level===7)shafts.push({x:2900,top:1010,bottom:1250,arena:true,balcony:{x:2780,width:650}});
 if(level===8)shafts.push({x:2440,top:1030,bottom:1750,arena:true,return:true},{x:3100,top:1390,bottom:1750,arena:true,balcony:{x:2960,width:1240}},{x:5100,top:1150,bottom:1750,arena:true,balcony:{x:4300,width:1200}});
 const floors=[],ceilings=[],roomHeight=340;
 const floor=(x,y,w,role='deck')=>floors.push({x,y,width:w,height:40,role});
 for(const room of modules){
  floor(room.x,room.floor,room.width,'room');
  add('RoomHull',room.x,room.floor-roomHeight,room.width,roomHeight,[], -3);
  ceilings.push({x:room.x,y:room.floor-roomHeight,width:room.width,height:16});
  // Door lintels frame open, body-height passages instead of floating platforms.
  for(const x of [room.x,room.x+room.width-16])add('Bulkhead',x,room.floor-roomHeight,16,roomHeight-(level>=6?300:224),[],5);
  const label=old.find(i=>i.name==='RoomLabel'&&+i.initialVariables.find(v=>v.name==='RoomId')?.value===room.id);if(label){const copy=structuredClone(label);copy.x=room.x+32;copy.y=room.floor-roomHeight+44;copy.persistentUuid=crypto.randomUUID();s.instances.push(copy);}
  const term=s.instances.find(i=>i.name==='MissionTerminal'&&+i.initialVariables.find(v=>v.name==='TerminalId')?.value===room.id);term.x=meta.rooms[room.id][0];term.y=room.floor-128;
  const size=room.id===1?104:96;add('MissionDevice',term.x+64-size/2,room.floor-size*122/128,size,size,[number('TerminalId',room.id),string('Kind',deviceKinds[level][room.id]),number('FloorY',room.floor)],8);
  // Materials occupy side lofts/bays, with a different physical asset in each room.
  const loft=room.id!==1,partFloor=room.floor-(loft?(level>=6?160:120):0),partX=clamp(room.id===1?term.x+260:term.x-150,room.x+70,room.x+room.width-70);
  if(loft)add('Ledge',partX-90,partFloor,200,24,[string('Role','service-loft')],4);
  if(loft&&level>=6)shafts.push({x:partX,top:partFloor,bottom:room.floor,service:true});
  const material=materials[level][room.id],partSize=44;
  add('Coin',partX-partSize/2,partFloor-bottoms[material]/128*partSize,partSize,partSize,[number('PartId',room.id),string('Material',material),number('FloorY',partFloor)],9);
  // Floor props use visible-image baselines; wall props are mounted to the lintel band.
  const crate=s.objects.find(o=>o.name==='LocationProp0');crate.animations=[animation('Default','CR_props_crate_png')];
  add('LocationProp0',room.x+room.width-100,room.floor-119/128*56,56,56,[string('Anchor','floor'),number('FloorY',room.floor)],6);
  const rack=s.objects.find(o=>o.name==='LocationProp1');rack.animations=[animation('Default','CR_decor_tool_rack_png')];
  add('LocationProp1',room.x+room.width-140,room.floor-roomHeight+100,72,72,[string('Anchor','wall')],2);
 }
 for(const shaft of shafts){
  add('ClimbRail',shaft.x-48,shaft.top-(level>=6?200:144),96,shaft.bottom-shaft.top+(level>=6?212:156),[number('UpperFloor',shaft.top),number('LowerFloor',shaft.bottom)],1);
  add('RoomHull',shaft.x-128,shaft.top-roomHeight,256,shaft.bottom-shaft.top+roomHeight,[],-4);
  if(shaft.arena||shaft.service){if(shaft.balcony)floor(shaft.balcony.x,shaft.top,shaft.balcony.width,'arena-gantry');}
  else for(const id of [shaft.from,shaft.to]){const r=modules[id],left=Math.min(shaft.x,r.center),right=Math.max(shaft.x,r.center);floor(left-96,r.floor,right-left+192,'corridor');}

 }
 // Keep the large, clear guardian floors and add a lower maintenance return gallery.
 if(level>=7)floor(2760,level===7?1250:1750,W-2760,'arena');
 const exit=s.instances.find(i=>i.name==='ExitDoor'),exitFloor=meta.exit[1];floor(Math.min(modules[2].x,exit.x),exitFloor,Math.min(W,exit.x+160)-Math.min(modules[2].x,exit.x),'exit');exit.initialVariables=exit.initialVariables.filter(v=>v.name!=='FloorY');exit.initialVariables.push(number('FloorY',exitFloor));exit.y=exitFloor-122;
 // Carve rail hatches through floor and ceiling solids. Only hatch caps are one-way.
 function carve(rect,cap){let chunks=[rect];for(const shaft of shafts){if(rect.y+rect.height<shaft.top-(cap?1:level>=6?146:88)||rect.y>shaft.bottom+1)continue;const cutL=shaft.x-104,cutR=shaft.x+104,next=[];for(const r of chunks){const l=Math.max(r.x,cutL),right=Math.min(r.x+r.width,cutR);if(l>=right){next.push(r);continue;}if(l>r.x)next.push({...r,width:l-r.x});if(right<r.x+r.width)next.push({...r,x:right,width:r.x+r.width-right});if(cap){const below=shafts.some(s=>right>s.x-48&&l<s.x+48&&s.bottom>r.y+1),atBottom=shafts.some(s=>right>s.x-48&&l<s.x+48&&Math.abs(s.bottom-r.y)<1);add(atBottom&&!below?'Ground':'Ledge',l,r.y,right-l,24,[string('Role',atBottom&&!below?'rail-stop':'rail-hatch')],4);}}chunks=next;}return chunks;}
 const uniqueFloors=new Set();for(const deck of floors)for(const r of carve(deck,true)){const key=[r.x,r.y,r.width].join(':');if(uniqueFloors.has(key))continue;uniqueFloors.add(key);add('Ground',r.x,r.y,r.width,r.height,[string('Role',deck.role)],3);add('Soil',r.x,r.y+r.height,r.width,56,[],0);}
 for(const ceiling of ceilings)for(const r of carve(ceiling,false))add('Bulkhead',r.x,r.y,r.width,r.height,[],4);
 // Door lintels must respect the same shaft clearance as deck/ceiling pieces.
 const bulkheads=s.instances.filter(i=>i.name==='Bulkhead');s.instances=s.instances.filter(i=>i.name!=='Bulkhead');
 for(const beam of bulkheads){let chunks=carve(beam,false);for(const deck of floors){if(beam.y>=deck.y||beam.y+beam.height<=deck.y-(level>=6?146:88))continue;const next=[];for(const r of chunks){const left=Math.max(r.x,deck.x),right=Math.min(r.x+r.width,deck.x+deck.width);if(left>=right){next.push(r);continue;}if(left>r.x)next.push({...r,width:left-r.x});if(right<r.x+r.width)next.push({...r,x:right,width:r.x+r.width-right});}chunks=next;}for(const r of chunks)add('Bulkhead',r.x,r.y,r.width,r.height,[],4);}
 const player=s.instances.find(i=>i.name==='Player'),startFloor=modules[0].floor;player.x=Math.max(32,modules[0].x+48);player.y=startFloor-(level>=7?168:112)-12;
 const checkpoint=s.instances.find(i=>i.name==='Checkpoint'),checkFloor=modules[1].floor;checkpoint.x=modules[1].center+130;checkpoint.y=checkFloor-checkpoint.height;checkpoint.initialVariables=checkpoint.initialVariables.filter(v=>v.name!=='FloorY');checkpoint.initialVariables.push(number('FloorY',checkFloor));
 for(const [n,item]of s.instances.filter(i=>i.name==='HealthPickup').entries()){const floorY=level===8?1750:modules[1].floor;item.x=level===8?[3220,4930][n]:modules[1].center-150;item.y=floorY-103/128*40;item.width=item.height=40;item.initialVariables=[number('FloorY',floorY)];}
 for(const item of s.instances.filter(i=>i.name==='Ammo')){item.x=modules[0].center+110;item.y=modules[0].floor-122/128*40;item.width=item.height=40;item.initialVariables=[number('FloorY',modules[0].floor)];}
 for(const [index,item]of s.instances.filter(i=>i.name==='ArenaCover').entries()){if(index===2)item.x=5300;item.width=item.height=128;item.y=1750-122;item.initialVariables=[number('FloorY',1750)];}
 checkpoint.y=checkFloor-checkpoint.height*122/128;
 const enemies=s.instances.filter(i=>i.name==='Crab');enemies.forEach((i,n)=>{const room=modules[Math.min(n,1)];i.width=i.height=96;i.x=clamp(room.center+220,room.x+80,room.x+room.width-100);i.y=room.floor-90;});

 if(level===6){const mech=s.instances.find(i=>i.name==='HangarMecha');mech.width=mech.height=192;mech.y=modules[2].floor-168;}
 // W is contextual climb/jump now; do not also simulate Jump while climbing.
 const clean=events=>{for(const e of events){if(e.actions&&e.conditions?.some(c=>c.type?.value==='KeyPressed'&&c.parameters?.includes('w')))e.actions=e.actions.filter(a=>a.type?.value!=='PlatformBehavior::SimulateJumpKey');if(e.events)clean(e.events);}};clean(s.events);
 meta.topology={version:2,rooms:modules,shafts,materials:materials[level],devices:deviceKinds[level],roomHeight,description:level===4?'Security tower with switchback shafts and a powered return loop':level===5?'Descending reactor rooms with service lofts and a return shaft':level>=7?'Industrial rooms opening into a broad guardian arena':'Connected machinery rooms, service lofts, climbing shafts and repair-powered return paths'};
 meta.platforms=s.instances.filter(i=>['Ground','Ledge'].includes(i.name)).map(i=>({x:i.x,y:i.y,width:i.width}));meta.spawn=[player.x,startFloor];meta.spawnClearance=12;
 meta.routes=shafts.map(shaft=>({type:'native-rail',...shaft,poweredShortcut:!!shaft.shortcut}));
}
fs.writeFileSync(file,JSON.stringify(p,null,2)+'\n');fs.writeFileSync('docs/location-layouts.json',JSON.stringify(layouts,null,2)+'\n');
console.log('Rebuilt 24 machinery rooms, side lofts, rail shafts, return loops and consistent object anchors across 8 sectors.');
