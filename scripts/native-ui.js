// Scene-authoring helpers. These create editable native GDevelop objects/events.
export function addNativeUI(mission,{object,instance,addResource,asset}){
  const layer=structuredClone(mission.layers.find(l=>l.name===''));layer.name='HUD';mission.layers.push(layer);
  mission.variables=[{name:'UIAction',type:'string',value:''}];
  const group=(name,events)=>({type:'BuiltinCommonInstructions::Group',name,events,source:'',colorR:40,colorG:100,colorB:110,creationTime:0});
  const condition=(type,parameters)=>({type:{value:type,inverted:false},parameters});
  const buttons=[['UIPause','pause','pause',824,16,48],['UIHelp','help','help',888,16,48],['UIStart','play','start',400,356,56],['UIResume','resume','pause',400,356,56],['UIRetry','retry','retry',400,356,56],['UIModalHelp','help','help',496,356,56],['UICloseHelp','close','closeHelp',448,356,56]];
  for(const [name,icon,,x,y,size]of buttons){object(name,[{name:'normal',files:[asset('ui_'+icon)]}]);instance(name,x,y,size,size,112,'HUD');}
  const clicks=buttons.map(([name,,action])=>({type:'BuiltinCommonInstructions::Standard',conditions:[condition('Visible',[name]),condition('SourisSurObjet',[name,'','no','']),condition('MouseButtonReleased',['','Left'])],actions:[{type:{value:'ModVarSceneTxt'},parameters:['UIAction','=',JSON.stringify(action)]}],events:[]}));
  mission.events.unshift(group('00 · Native icon-button click events',clicks));
  const panel=(name,x,y,w,h,z=100)=>{mission.objects.push({name,type:'PanelSpriteObject::PanelSprite',texture:addResource(asset('ui_panel')),leftMargin:16,rightMargin:16,topMargin:12,bottomMargin:12,tiled:false,width:w,height:h,variables:[],behaviors:[],effects:[]});instance(name,x,y,w,h,z,'HUD');};
  const sprite=(name,id,x,y,w,h,z=101)=>{object(name,[{name:'normal',files:[asset(id)]}]);instance(name,x,y,w,h,z,'HUD');};
  const text=(name,value,x,y,w,size=14,color='242;230;203',z=103,layer='HUD')=>{
    mission.objects.push({name,type:'TextObject::Text',variables:[],behaviors:[],effects:[],content:{bold:false,italic:false,smoothed:false,underlined:false,text:value,font:'',characterSize:size,color,textAlignment:'left',verticalTextAlignment:'top',isOutlineEnabled:layer===''||name==='HUDZone',outlineThickness:1,outlineColor:'16;27;42',isShadowEnabled:false}});
    instance(name,x,y,w,Math.ceil(size*1.5),z,layer);
  };
  panel('HUDVitalsPlate',16,16,232,64);panel('HUDClockPlate',400,16,160,64);
  text('HUDCallsign','RELAY-7 / 01',40,26,180,12,'166;216;219');
  for(let i=0;i<5;i++){object('HUDShield'+i,[{name:'full',files:[asset('ui_shield_full')]},{name:'empty',files:[asset('ui_shield_empty')]}]);instance('HUDShield'+i,40+i*30,46,24,24,102,'HUD');}
  sprite('HUDTimerIcon','ui_timer',420,34,24,24);text('HUDClock','06:00',455,33,90,23);
  panel('HUDObjectivePlate',16,458,616,64);text('HUDObjective','Establishing uplink…',40,472,560,15);text('HUDCircuit','A 0   AND   B 0    →    SAFE 0',208,496,392,12,'166;216;219');
  text('HUDZone','BROKEN LOADING DOCK',32,88,560,11,'166;216;219');
  panel('HUDFusePlate',664,458,104,64);sprite('HUDFuseIcon','ui_fuse',680,472,32,32);text('HUDFuse','FUSE',718,482,48,10);
  sprite('UIDefuseProgress','ui_fill',40,516,560,3,104);
  sprite('ModalShade','ui_shade',0,0,960,540,108);
  panel('ModalFrame',160,100,640,340,109);
  text('ModalEyebrow','PROTOCOL ZERO / 01',208,126,544,12,'82;201;217',110);
  text('ModalTitle','TWIN POWER',208,150,544,27,'242;230;203',110);
  text('ModalBody','Connecting…',208,198,544,16,'193;211;220',110);
  text('ModalFoot','Waiting for mission server',208,414,544,11,'166;216;219',110);
  text('WorldPrompt','',0,0,200,11,'242;230;203',40,'');
  for(const [name,source,x,y,w,h]of [['UIHeroPreview','MissionPlayer',668,212,64,128],['UIRiflePreview','MissionRifle',686,246,80,48]]){
    const definition=structuredClone(mission.objects.find(o=>o.name===source));definition.name=name;mission.objects.push(definition);instance(name,x,y,w,h,111,'HUD');
  }
  mission.objectsFolderStructure={folderName:'__ROOT',children:[
    {folderName:'Characters and weapons',children:mission.objects.filter(o=>/^Mission(Player|Enemy|Rifle|Muzzle|Pulse)$/.test(o.name)).map(o=>({objectName:o.name}))},
    {folderName:'HUD and dialogs',children:mission.objects.filter(o=>/^(HUD|UI|Modal|WorldPrompt)/.test(o.name)).map(o=>({objectName:o.name}))},
    {folderName:'Map and puzzle props',children:mission.objects.filter(o=>!(/^(HUD|UI|Modal|WorldPrompt)/.test(o.name)||/^Mission(Player|Enemy|Rifle|Muzzle|Pulse)$/.test(o.name))).map(o=>({objectName:o.name}))},
  ]};
}
