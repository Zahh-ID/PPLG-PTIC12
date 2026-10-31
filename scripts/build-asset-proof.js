import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';

export async function buildAssetProof(project,template,root){
  let manifest;try{manifest=JSON.parse(await readFile(path.join(root,'assets/manifests/v2/proof.json'),'utf8'));}catch(e){if(e.code==='ENOENT')return null;throw e;}
  const scene=structuredClone(template);Object.assign(scene,{name:'AssetProof',mangledName:'AssetProof',title:'Protocol Zero — V2 connected art proof',objects:[],instances:[],events:[],variables:[{name:'ProofReset',type:'boolean',value:false}],r:9,v:18,b:31});
  const baseLayer=template.layers.find(l=>l.name==='');scene.layers=['Far','Mid','Near','','HUD'].map(name=>({...structuredClone(baseLayer),name}));
  const arts=new Map(manifest.assets.map(a=>[a.id,a]));
  const resource=file=>{if(!project.resources.resources.some(r=>r.name===file))project.resources.resources.push({kind:'image',name:file,file,userAdded:true});return file;};
  const sprite=(name,ids,mask=false)=>{
    scene.objects.push({name,type:'Sprite',variables:[],behaviors:[],effects:[],adaptCollisionMaskAutomatically:false,updateIfNotVisible:false,animations:ids.map(id=>{const a=arts.get(id);return{name:id,useMultipleDirections:false,directions:[{looping:a.loop??false,timeBetweenFrames:1/(a.fps||12),sprites:(a.files||[a.file]).map((file,index)=>({image:resource(file),originPoint:{name:'origin',x:0,y:0},centerPoint:{name:'center',automatic:true,x:0,y:0},points:a.family==='player'?[{name:'Muzzle',x:a.muzzles[index][0],y:a.muzzles[index][1]},{name:'Feet',x:48,y:72}]:[],hasCustomCollisionMask:mask,customCollisionMask:mask?[[{x:32,y:8},{x:64,y:8},{x:64,y:72},{x:32,y:72}]]:[]}))}]};})});
  };
  const instance=(name,x,y,w,h,z=0,layer='')=>scene.instances.push({name,x,y,width:w||0,height:h||0,customSize:!!w,angle:0,zOrder:z,layer,persistentUuid:`proof-${name}-${x}-${y}`,numberProperties:[],stringProperties:[],initialVariables:[]});
  const text=(name,value,x,y,w,size=12,layer='',color='233;223;200')=>{scene.objects.push({name,type:'TextObject::Text',variables:[],behaviors:[],effects:[],content:{text:value,font:'',characterSize:size,color,bold:false,italic:false,smoothed:false,underlined:false,textAlignment:'center',verticalTextAlignment:'top',isOutlineEnabled:layer==='',outlineThickness:1,outlineColor:'9;18;31',isShadowEnabled:false}});instance(name,x,y,w,size*1.5,60,layer);};
  sprite('P_Player',['player_idle','player_run','player_fire','player_run_fire'],true);instance('P_Player',80,360,0,0,30);
  for(const [name,id]of [['P_Switch','power_switch'],['P_Socket','fuse_socket'],['P_Console','logic_console'],['P_Fuse','fuse_available'],['P_Beacon','interact_beacon'],['P_Patrol','patrol_walk']])sprite(name,[id,...(name==='P_Patrol'?['patrol_telegraph']:[])]);
  for(const [name,x,y]of [['P_Switch',320,368],['P_Fuse',656,400],['P_Socket',960,368],['P_Console',1280,352],['P_Patrol',1728,372]])instance(name,x,y,0,0,20);
  for(const [id,x,y]of [['power',352,332],['fuse',672,364],['socket',992,332],['console',1312,316]]){instance('P_Beacon',x-16,y,0,0,50);text('Label_'+id,'',x-100,y-22,200,11);}
  text('InteractionPrompt','',0,0,260,12);
  text('PatrolCaption','PATROL / 3 HITS',1660,340,200,11);
  for(const [id,name,layer]of [['dock_far','P_Far','Far'],['dock_mid','P_Mid','Mid'],['dock_near','P_Near','Near']]){sprite(name,[id]);for(let i=-2;i<=5;i++)instance(name,i*768,48,768,384,-20,layer);}
  sprite('P_Floor',['dock_floor']);for(let x=0;x<2240;x+=96)instance('P_Floor',x,432,96,32,10);
  const panel=arts.get('hud_panel');
  for(const [name,x,y,w,h]of [['ProofTitlePanel',16,14,700,64],['ProofMessagePanel',192,478,752,48]]){scene.objects.push({name,type:'PanelSpriteObject::PanelSprite',texture:resource(panel.file),leftMargin:12,rightMargin:12,topMargin:12,bottomMargin:12,tiled:false,width:w,height:h,variables:[],behaviors:[],effects:[]});instance(name,x,y,w,h,0,'HUD');}
  text('ProofTitle','V2 / DOCK PROOF',32,28,220,17,'HUD');text('ProofControls','A D move · J / mouse fire · E interact · Esc pause · R reset',258,31,430,12,'HUD');
  text('ProofMessage','',212,492,712,13,'HUD');
  text('ProofStatus','POWER 0 / FUSE MISSING / LOCKED',24,86,550,12,'HUD','131;230;229');
  text('ProofPause','',744,34,180,15,'HUD');
  // Reuse the existing native replay control while the full V2 UI kit is pending.
  arts.set('replay',{file:'assets/runtime/ui/ui_retry.png'});sprite('ProofReplay',['replay']);instance('ProofReplay',888,16,48,48,10,'HUD');
  arts.set('pulse',{file:'assets/runtime/effects/pulse.png'});sprite('P_Pulse',['pulse']);
  const nativeClick={type:'BuiltinCommonInstructions::Standard',conditions:[{type:{value:'SourisSurObjet'},parameters:['ProofReplay','','no','']},{type:{value:'MouseButtonReleased'},parameters:['','Left']}],actions:[{type:{value:'SetSceneVariableAsBoolean'},parameters:['ProofReset','True']}],events:[]};
  const model=(await readFile(path.join(root,'shared/asset-proof.js'),'utf8')).replace(/^export /gm,'');
  const runtime=await readFile(path.join(root,'src/events/asset-proof.js'),'utf8');
  scene.events=[{type:'BuiltinCommonInstructions::Group',name:'00 · Native replay button',events:[nativeClick],source:'',colorR:40,colorG:100,colorB:110,creationTime:0},{type:'BuiltinCommonInstructions::Group',name:'01 · Isolated V2 asset proof',events:[{type:'BuiltinCommonInstructions::JsCode',inlineCode:(model+'\n'+runtime).split('\n'),parameterObjects:'',useStrict:true,eventsSheetExpanded:false}],source:'',colorR:40,colorG:100,colorB:110,creationTime:0}];
  scene.objectsFolderStructure={folderName:'__ROOT',children:[{folderName:'Integrated player and patrol',children:scene.objects.filter(o=>['P_Player','P_Patrol','P_Pulse'].includes(o.name)).map(o=>({objectName:o.name}))},{folderName:'Reusable interactions and markers',children:scene.objects.filter(o=>/^P_(Switch|Socket|Console|Fuse|Beacon)$|^Label_|^InteractionPrompt$|^PatrolCaption$/.test(o.name)).map(o=>({objectName:o.name}))},{folderName:'Parallax and floor',children:scene.objects.filter(o=>/^P_(Far|Mid|Near|Floor)$/.test(o.name)).map(o=>({objectName:o.name}))},{folderName:'Native HUD',children:scene.objects.filter(o=>o.name.startsWith('Proof')).map(o=>({objectName:o.name}))}]};
  await writeFile(path.join(root,'layouts/asset-proof.json'),JSON.stringify(scene,null,2)+'\n');return scene;
}
