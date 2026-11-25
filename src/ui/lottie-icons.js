(() => {
  const base=new URL('.',document.currentScript.src),preference=matchMedia('(prefers-reduced-motion: reduce)');
  const cache=new Map(),active=new Set(),playing=new WeakMap(),lastPlayed=new WeakMap();
  let feedbackEpoch=0;
  const scope='#cr-journey,#cr-workbench,#cr-navigation,#cr-touch-controls';
  const data=id=>{
    if(!cache.has(id))cache.set(id,fetch(new URL('lottie/'+id+'.json',base)).then(response=>{
      if(!response.ok)throw Error('Lottie asset unavailable');return response.json();
    }).catch(()=>null));
    return cache.get(id);
  };
  const catalog=fetch(new URL('lottie/index.json',base)).then(r=>r.ok?r.json():null).catch(()=>null);
  if(!preference.matches)void data('logo');
  function mount(container,id,fallback,floating=false,direction=1){
    if(preference.matches||!window.lottie){container.remove();return {ready:Promise.resolve(false),finished:Promise.resolve(false),play(){},destroy(){}};}
    if(fallback)playing.get(fallback)?.destroy();
    const previousOpacity=fallback?.style.opacity;
    let resolveReady,resolveFinished;const ready=new Promise(resolve=>{resolveReady=resolve;}),finished=new Promise(resolve=>{resolveFinished=resolve;});
    const state={container,fallback,floating,ready,finished,animation:null,dead:false,play(speed=1){if(!state.dead){state.animation?.setSpeed(speed);state.animation?.setDirection(direction);state.animation?.goToAndStop(direction<0?state.animation.totalFrames-1:0,true);state.animation?.play();}},destroy(){
      if(state.dead)return;state.dead=true;state.animation?.destroy();container.remove();active.delete(state);
      resolveReady(false);resolveFinished(false);
      if(fallback&&playing.get(fallback)===state){fallback.style.opacity=previousOpacity;playing.delete(fallback);}
    }};
    if(fallback)playing.set(fallback,state);
    active.add(state);
    void data(id).then(animationData=>{
      if(state.dead||!container.isConnected||!animationData){state.destroy();return;}
      const animation=state.animation=lottie.loadAnimation({container,renderer:'svg',loop:false,autoplay:false,assetsPath:base.href,animationData:structuredClone(animationData),rendererSettings:{preserveAspectRatio:id==='button-feedback'?'none':'xMidYMid meet',progressiveLoad:false}});
      let started=false;
      const start=()=>{
        if(state.dead||started)return;started=true;
        if(id==='logo'&&direction<0)animation.goToAndStop(animation.totalFrames-1,true);
        if(fallback)fallback.style.opacity='0';container.dataset.lottieReady='true';resolveReady(true);if(id!=='logo')animation.play();
      };
      animation.addEventListener('DOMLoaded',start);if(animation.isLoaded)start();
      animation.addEventListener('complete',()=>{resolveFinished(true);if(id!=='logo')state.destroy();});animation.addEventListener('data_failed',()=>state.destroy());
    }).catch(()=>state.destroy());
    return state;
  }
  function overlay(target,id,fallback){
    if(!target.isConnected||preference.matches||target.closest('[inert]')||getComputedStyle(target).visibility==='hidden')return;
    const button=target.closest('button');if(!button)return;
    const box=target.getBoundingClientRect(),bounds=button.getBoundingClientRect();if(!box.width||!box.height)return;
    if(getComputedStyle(button).position==='static')button.style.position='relative';
    const layer=document.createElement('span');layer.className='cr-lottie-overlay';layer.dataset.lottieIcon=id;layer.setAttribute('aria-hidden','true');
    Object.assign(layer.style,{position:'absolute',left:box.left-bounds.left-button.clientLeft+'px',top:box.top-bounds.top-button.clientTop+'px',width:box.width+'px',height:box.height+'px',zIndex:'1',pointerEvents:'none'});
    button.append(layer);const state=mount(layer,id,fallback,true);state.target=target;state.button=button;
  }
  async function interact(event){
    if(preference.matches)return;
    const button=event.target.closest?.('button');if(!button||button.disabled||button.closest('[inert]')||!button.closest(scope))return;
    if(event.pointerType!=='mouse'||button.contains(event.relatedTarget)||button.closest('.cr-editor-toolbar,.cr-utility-actions,.challenge-steps'))return;
    const now=performance.now();if(now-(lastPlayed.get(button)??-1000)<180)return;lastPlayed.set(button,now);
    const image=button.querySelector('img');
    const epoch=feedbackEpoch;
    if(image){
      const id=new URL(image.src,location.href).pathname.split('/').pop().replace(/\.svg$/,'');
      const index=await catalog;
      if(epoch!==feedbackEpoch||!button.isConnected||preference.matches||!button.matches(':hover'))return;
      if(index?.icons.includes(id)){overlay(image,id,image);return;}
    }
  }
  const cancelFeedback=root=>{feedbackEpoch++;for(const state of [...active])if(state.floating&&(!root||root.contains(state.target)))state.destroy();};
  document.addEventListener('pointerover',interact,{passive:true});
  document.addEventListener('pointerdown',()=>cancelFeedback(),{capture:true,passive:true});
  document.addEventListener('pointerout',event=>{const button=event.target.closest?.('button');if(button&&!button.contains(event.relatedTarget))cancelFeedback(button);},{passive:true});
  const finish=()=>{feedbackEpoch++;for(const state of [...active])state.destroy();};
  addEventListener('resize',finish);
  addEventListener('scroll',()=>{for(const state of [...active])if(state.floating)state.destroy();},true);
  preference.addEventListener('change',()=>{if(preference.matches)finish();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)finish();});
  new MutationObserver(()=>{for(const state of active)if(!state.container.isConnected||state.target&&(!state.target.isConnected||state.target.closest('[inert]')))state.destroy();}).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['inert','hidden']});
  window.__crLottie={cancelFeedback,playLogo(parent,reverse=false){
    const layer=document.createElement('span');layer.className='cr-lottie-logo';layer.setAttribute('aria-hidden','true');parent.append(layer);
    return mount(layer,'logo',parent.querySelector('img'),false,reverse?-1:1);
  }};
})();
