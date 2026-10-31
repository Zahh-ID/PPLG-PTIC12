// Isolated art-review sandbox, not a campaign attempt or persistent save format.
export const PROOF_LAYOUT={width:2240,floorY:432,body:{w:32,h:64},spawnX:96,
  switch:{id:'power-a',x:352,y:400},fuse:{id:'fuse-a',x:672,y:410},socket:{id:'socket-a',x:992,y:400},console:{id:'console-a',x:1312,y:400},patrol:{id:'patrol-a',x:1760,y:384}};
export function createAssetProof(){return{time:0,x:96,facing:1,moving:false,shooting:false,paused:false,shotAt:-1,shots:0,power:false,fuse:false,installed:false,solved:false,transition:{},patrolHp:3,patrolFlash:0,projectiles:[],nextShot:0,message:'Activate the power switch, collect the fuse, then restore the console.'};}
export function proofNear(s,point,range=78){return Math.hypot(s.x+16-point.x,PROOF_LAYOUT.floorY-32-point.y)<range;}
export function proofAction(s){
  if(s.paused)return;
  const l=PROOF_LAYOUT;
  if(proofNear(s,l.switch)){s.power=!s.power;s.transition.switch=s.time;s.message=s.power?'Power feed active. Find the fuse.':'Power feed switched off.';return 'switch';}
  if(proofNear(s,l.socket)){
    if(!s.fuse){s.message='Socket locked: collect the copper fuse.';return 'locked';}
    if(!s.installed){s.installed=true;s.transition.socket=s.time;s.message='Fuse installed. Both inputs can now authorize the console.';return 'socket';}
    s.message='Fuse already fitted.';return 'complete';
  }
  if(proofNear(s,l.console)){
    if(!s.power||!s.installed){s.message='Console locked: power A and the fitted fuse are both required.';return 'locked';}
    s.solved=true;s.transition.console=s.time;s.message='AND lock accepted. Shared interaction kit proof complete.';return 'console';
  }
}
export function advanceAssetProof(s,input,seconds){
  if(s.paused)return;
  const dt=Math.min(.05,Math.max(0,seconds));s.time+=dt;
  const dir=Number(!!input.right)-Number(!!input.left);s.moving=!!dir;s.shooting=!!input.shoot;
  if(dir)s.facing=dir;s.x=Math.max(16,Math.min(PROOF_LAYOUT.width-48,s.x+dir*180*dt));
  if(!s.fuse&&proofNear(s,PROOF_LAYOUT.fuse,42)){s.fuse=true;s.message='Fuse collected. Fit it in the marked socket.';}
  if(input.shoot&&s.time-s.shotAt>=.35){
    s.shotAt=s.time;s.shots++;s.projectiles.push({id:s.nextShot++,x:s.x+(s.facing>0?44:-12),y:PROOF_LAYOUT.floorY-36,dir:s.facing,life:1});
  }
  for(const p of s.projectiles){p.x+=p.dir*600*dt;p.life-=dt;if(s.patrolHp>0&&p.x>=PROOF_LAYOUT.patrol.x-16&&p.x<=PROOF_LAYOUT.patrol.x+48){p.life=0;s.patrolHp--;s.patrolFlash=s.time;}}
  s.projectiles=s.projectiles.filter(p=>p.life>0&&p.x>=0&&p.x<=PROOF_LAYOUT.width);
}
export function proofParallax(camera,ratio,width){return ((camera*ratio)%width+width)%width;}
