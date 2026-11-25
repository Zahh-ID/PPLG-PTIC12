import svgpath from 'svgpath';

const prop=k=>({a:0,k});
const color=hex=>[...hex.replace('#','').matchAll(/../g)].map(v=>parseInt(v[0],16)/255).concat(1);
const transform=()=>({ty:'tr',p:prop([0,0]),a:prop([0,0]),s:prop([100,100]),r:prop(0),o:prop(100),sk:prop(0),sa:prop(0)});
export function tween(points){
 return {a:1,k:points.map(([t,value],index)=>{
  const frame={t,s:Array.isArray(value)?value:[value]};
  if(index<points.length-1){frame.e=Array.isArray(points[index+1][1])?points[index+1][1]:[points[index+1][1]];frame.i={x:.65,y:1};frame.o={x:.25,y:0};}
  return frame;
 })};
}
function paths(data){
 const result=[];let current,x=0,y=0;
 const push=(px,py,incoming=[0,0])=>{current.v.push([px,py]);current.i.push(incoming);current.o.push([0,0]);x=px;y=py;};
 svgpath(data).unarc().abs().unshort().iterate(segment=>{
  const [command,...v]=segment;
  if(command==='M'){current={v:[],i:[],o:[],c:false};result.push(current);push(v[0],v[1]);}
  else if(command==='L')push(v[0],v[1]);
  else if(command==='H')push(v[0],y);
  else if(command==='V')push(x,v[0]);
  else if(command==='C'){current.o[current.o.length-1]=[v[0]-x,v[1]-y];push(v[4],v[5],[v[2]-v[4],v[3]-v[5]]);}
  else if(command==='Z'||command==='z'){current.c=true;[x,y]=current.v[0];}
  else throw Error('Unsupported logo/icon path command: '+command);
 });
 return result.map(k=>({ty:'sh',ks:prop(k)}));
}
export function shapes(body,defaults={},trace=false){
 const groups=[];
 for(const tag of body.matchAll(/<(path|circle|ellipse|rect)\b([^>]*)\/?\s*>/g)){
  const attrs={...defaults,...Object.fromEntries([...tag[2].matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]))};
  let geometry=[];
  if(tag[1]==='path')geometry=paths(attrs.d);
  else if(tag[1]==='rect')geometry=[{ty:'rc',d:1,p:prop([+attrs.x+(+attrs.width)/2,+attrs.y+(+attrs.height)/2]),s:prop([+attrs.width,+attrs.height]),r:prop(+(attrs.rx||0))}];
  else geometry=[{ty:'el',d:1,p:prop([+attrs.cx,+attrs.cy]),s:prop([2*+(attrs.rx||attrs.r),2*+(attrs.ry||attrs.r)])}];
  const it=[...geometry];
  if(attrs.fill&&attrs.fill!=='none')it.push({ty:'fl',c:prop(color(attrs.fill)),o:prop(100),r:1});
  if(attrs.stroke&&attrs.stroke!=='none'){
   it.push({ty:'st',c:prop(color(attrs.stroke)),o:prop(100),w:prop(+(attrs['stroke-width']||1)),lc:attrs['stroke-linecap']==='round'?2:3,lj:attrs['stroke-linejoin']==='round'?2:1,ml:4});
   if(trace)it.push({ty:'tm',s:prop(0),e:tween([[0,0],[9,100]]),o:prop(0),m:1});
  }
  it.push(transform());groups.push({ty:'gr',it});
 }
 return groups;
}
function layer(name,groups,size,ks={}){
 return {ddd:0,ind:1,ty:4,nm:name,sr:1,ks:{o:prop(100),r:prop(0),p:prop([size/2,size/2,0]),a:prop([size/2,size/2,0]),s:prop([100,100,100]),...ks},ao:0,shapes:groups,ip:0,op:12,st:0,bm:0};
}
function composition(name,size,layers){return {v:'5.13.0',fr:30,ip:0,op:12,w:size,h:size,nm:name,ddd:0,assets:[],layers};}
export function iconAnimation(id,body,frame,palette){
 const glyph=shapes(body,{fill:palette.foreground,stroke:palette.foreground,'stroke-width':7});
 const ks={s:tween([[0,[100,100,100]],[3,[106,106,100]],[11,[100,100,100]]])};
 if(['next','back','jump'].includes(id)){
  const dx=id==='next'?6:id==='back'?-6:0,dy=id==='jump'?-6:0;
  ks.p=tween([[0,[64,64,0]],[3,[64+dx,64+dy,0]],[11,[64,64,0]]]);
 }
 if(id==='replay')ks.r=tween([[0,0],[4,-24],[11,0]]);
 const layers=[layer(id,glyph,128,ks)];
 if(frame){const border=layer('frame',shapes(frame),128);border.ind=2;layers.push(border);}
 return composition(id,128,layers);
}
export function brandAnimation(file,width,height){
 const size=Math.ceil(Math.max(width,height)*1.3);
 const emblem=layer('Emblem quarter-turn',[],size,{a:prop([width/2,height/2,0]),r:tween([[0,-18],[2,-24],[8,70],[10,64],[12,64]])});
 emblem.ty=2;emblem.refId='emblem-vector';delete emblem.shapes;
 const animation=composition('Circuit Rescue emblem — wrench turn',size,[emblem]);
 animation.assets=[{id:'emblem-vector',w:width,h:height,u:'',p:file,e:0}];
 return animation;
}
export function buttonAnimation(palette){
 const groups=shapes('<rect x="4" y="4" width="120" height="120" rx="18"/>',{fill:'none',stroke:palette.accent,'stroke-width':2},true);
 return composition('Button confirmation',128,[layer('outline',groups,128,{o:tween([[0,90],[7,90],[11,0]])})]);
}
