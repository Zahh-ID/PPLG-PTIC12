import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import {addNativeUI} from './native-ui.js';
const root=path.resolve(import.meta.dirname,'..');
const project=JSON.parse(await readFile(path.join(root,'LogicGate.json'),'utf8'));
const scene=JSON.parse(await readFile(path.join(root,'layouts/sandbox.json'),'utf8'));
scene.events=[{type:'BuiltinCommonInstructions::JsCode',inlineCode:(await readFile(path.join(root,'src/events/workshop.js'),'utf8')).split('\n'),parameterObjects:'',useStrict:true,eventsSheetExpanded:false}];
await writeFile(path.join(root,'layouts/sandbox.json'),JSON.stringify(scene,null,2)+'\n');
const mission=structuredClone(scene);
mission.name='Mission01';mission.mangledName='Mission01';mission.instances=[];mission.objects=[];mission.r=16;mission.v=27;mission.b=42;
mission.events=[];
for(const [file,name]of [['mission-network.js','01 · Server connection and input'],['mission-world.js','02 · World sprites and animation'],['mission-hud.js','03 · Native HUD snapshot binding']])mission.events.push({type:'BuiltinCommonInstructions::Group',name,events:[{type:'BuiltinCommonInstructions::JsCode',inlineCode:(await readFile(path.join(root,'src/events',file),'utf8')).split('\n'),parameterObjects:'',useStrict:true,eventsSheetExpanded:false}],source:'',colorR:40,colorG:100,colorB:110,creationTime:0});
project.resources.resources=project.resources.resources.filter(r=>!r.file.startsWith('assets/runtime/'));
const manifest=JSON.parse(await readFile(path.join(root,'assets/runtime/manifest.json'),'utf8'));
const art=new Map(manifest.assets.map(a=>[a.id,a]));
const asset=(id,frame)=>{const a=art.get(id);if(!a)throw new Error('Missing manifest asset '+id);return `assets/runtime/${a.directory}/${id}${frame===undefined?'':'_'+frame}.png`;};
const addResource=file=>{if(!project.resources.resources.some(r=>r.name===file))project.resources.resources.push({kind:'image',name:file,file,userAdded:true});return file;};
function object(name,animations){
  const o={name,type:'Sprite',tags:'',variables:[],behaviors:[],effects:[],adaptCollisionMaskAutomatically:true,updateIfNotVisible:false,animations:[]};
  for(const a of animations){o.animations.push({name:a.name,useMultipleDirections:false,directions:[{looping:a.loop??true,timeBetweenFrames:1/(a.fps||8),sprites:a.files.map(file=>({image:addResource(file),originPoint:{name:'origin',x:0,y:0},centerPoint:{name:'center',x:0,y:0,automatic:true},points:[],hasCustomCollisionMask:false,customCollisionMask:[]}))}]});}
  mission.objects.push(o);
}
object('MissionPlayer',['idle','run','jump','fall','land','interact','build','hurt','shoot','dash','defeat'].map(name=>({name,files:Array.from({length:8},(_,i)=>asset('cyborg_'+name,i)),fps:name==='run'?10:name==='idle'?5:12,loop:['idle','run'].includes(name)})));
object('MissionEnemy',['idle','walk','windup','attack','hurt','defeat'].map(name=>({name,files:Array.from({length:4},(_,i)=>asset('patrol_'+name,i)),fps:({windup:7,attack:16,hurt:18,defeat:8})[name]||8,loop:name==='walk'||name==='idle'})));
for(const [name,files]of Object.entries({MissionGround:['lab_floor'],MissionSwitch:['switch_off','switch_on'],MissionFuse:['fuse'],MissionConsole:['console'],MissionCharge:['charge_on','charge_off'],MissionDoor:['door_closed','door_open'],MissionLift:['lift'],MissionLog:['log'],MissionPulse:['pulse']}))object(name,files.map((file,i)=>({name:String(i),files:[asset(file)]})));
for(const [name,id]of [['MissionRifle','rifle_ready'],['MissionMuzzle','muzzle_flash']])object(name,[{name:'normal',files:Array.from({length:8},(_,i)=>asset(id,i)),fps:name==='MissionRifle'?8:70}]);
const {LEVEL_ONE}=await import('../shared/mission.js');
function instance(name,x,y,w,h,z=0,layer=''){mission.instances.push({name,x,y,angle:0,zOrder:z,layer,customSize:!!w,width:w||0,height:h||0,persistentUuid:`${name}-${x}-${y}-${z}`,numberProperties:[],stringProperties:[],initialVariables:[]});}
const backdrop=structuredClone(mission.layers[0]);backdrop.name='Backdrop';mission.layers.unshift(backdrop);
for(const [name,file]of Object.entries({BackWall:'wall_panel',CopperWall:'copper_panel',DockWindow:'glass_panel',GantryFloor:'gantry_tile',WarningBand:'hazard_tile'}))mission.objects.push({name,type:'TiledSpriteObject::TiledSprite',texture:addResource(asset(file)),width:64,height:64,variables:[],behaviors:[],effects:[]});
for(const name of ['dock_habitat','dock_roof','dock_sign','tech_lantern','dock_fence','spawn_beacon','cargo_crate','antenna','solar_panel','lab_pillar','pipe_straight','pipe_elbow','wall_console','ruined_gear','hazard_sign','lab_vent','broken_monitor','server_rack','lab_desk','pipe_valve','lab_canister'])object('Decor_'+name,[{name:'0',files:[asset(name)]}]);
// Distant repeating architecture lives on a slower camera layer.
for(let x=-640;x<=1280;x+=320){instance('DockWindow',x,160,224,112,-30,'Backdrop');instance('Decor_dock_habitat',x+32,240,160,160,-25,'Backdrop');instance('Decor_antenna',x+240,180,48,96,-25,'Backdrop');}
// Material and architecture change by zone; decorative props never define physics.
for(const [name,x,y,w,h]of [['CopperWall',0,304,320,160],['BackWall',496,256,112,208],['BackWall',640,208,464,256],['BackWall',1120,272,288,192],['BackWall',1440,288,448,176]])instance(name,x,y,w,h,-20);
for(const platform of LEVEL_ONE.platforms){
  for(let x=platform.x;x<platform.x+platform.w;x+=16)for(let y=platform.y;y<platform.y+platform.h;y+=16)instance(platform.y===464?'MissionGround':'GantryFloor',x,y,16,16,0);
  if(platform.y<464)for(let x=platform.x+8;x<platform.x+platform.w;x+=48)instance('Decor_lab_pillar',x,platform.y+16,16,Math.min(464-platform.y-16,80),-4);
}
for(const [name,x,y,w,h]of [
 ['spawn_beacon',16,400,32,64],['dock_sign',176,352,40,80],['cargo_crate',256,432,32,32],['cargo_crate',288,400,48,64],['ruined_gear',368,432,32,32],
 ['hazard_sign',384,448,16,16],['hazard_sign',480,448,16,16],['dock_fence',80,432,96,32],['antenna',48,288,48,96],
 ['pipe_straight',512,304,96,24],['pipe_elbow',592,304,16,48],['tech_lantern',576,336,16,32],
 ['lab_vent',672,256,48,48],['pipe_straight',720,256,192,16],['pipe_valve',912,248,32,24],['broken_monitor',800,400,48,32],['tech_lantern',960,288,16,32],
 ['server_rack',1088,400,32,64],['lab_canister',1200,416,24,48],['lab_pillar',1392,336,24,128],['wall_console',1328,352,48,64],['lab_vent',1168,304,48,48],
 ['lab_pillar',1440,352,16,112],['lab_pillar',1600,352,16,112],['dock_roof',1456,320,144,32],['tech_lantern',1520,352,16,32],['lab_desk',1616,432,48,32],
 ['server_rack',1744,368,32,96],['lab_pillar',1792,320,16,144],['lab_pillar',1888,320,16,144],['dock_roof',1792,288,112,32]
])instance('Decor_'+name,x,y,w,h,-3);
instance('WarningBand',1088,448,320,16,-1);instance('WarningBand',1808,448,80,16,-1);
addNativeUI(mission,{object,instance,addResource,asset});
await writeFile(path.join(root,'layouts/mission01.json'),JSON.stringify(mission,null,2)+'\n');
project.firstLayout='Mission01';project.properties.description='Protocol Zero — Level 01 solo mission prototype';
project.layouts=[{__REFERENCE_TO_SPLIT_OBJECT:true,referenceTo:'/layouts/mission01'},{__REFERENCE_TO_SPLIT_OBJECT:true,referenceTo:'/layouts/sandbox'}];
await writeFile(path.join(root,'LogicGate.json'),JSON.stringify(project,null,2)+'\n');
// The MCP exporter/validator expects a single-file project. The editor keeps
// its native split layout; generated files and exports never enter source control.
project.layouts=[mission,scene];project.properties.folderProject=false;
for(const r of project.resources.resources)r.file=path.resolve(root,r.file);
await mkdir(path.join(root,'.cache'),{recursive:true});
await writeFile(path.join(root,'.cache/preview.json'),JSON.stringify(project,null,2));
project.firstLayout='Sandbox';await writeFile(path.join(root,'.cache/workshop-preview.json'),JSON.stringify(project,null,2));
console.log('Updated mission/workshop scene events and resolved preview projects.');
