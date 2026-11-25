(() => {
  const states=new WeakMap(),active=new Set();
  const markURL=new URL('circuit-rescue-mark.svg',document.currentScript.src).href;
  const preference=matchMedia('(prefers-reduced-motion: reduce)');
  const panelOf=root=>root.querySelector('.cr-flow-panel,.cr-window');
  const time=(root,name,fallback)=>parseFloat(getComputedStyle(root).getPropertyValue(name))||fallback;
  const clear=state=>{clearTimeout(state.finishTimer);state.animation?.cancel();state.entryAnimation?.cancel();state.logo?.destroy();state.layers?.remove();state.outgoing?.remove();active.delete(state);states.delete(state.root);};
  function makeLayers(root,panel){
    const box=panel.getBoundingClientRect(),layers=document.createElement('div');layers.className='cr-reveal';layers.setAttribute('aria-hidden','true');
    Object.assign(layers.style,{left:box.left+'px',top:box.top+'px',width:box.width+'px',height:box.height+'px'});
    layers.innerHTML='<div class="cr-reveal-shell"></div><div class="cr-reveal-paper"></div><div class="cr-reveal-badge"><div class="cr-reveal-badge-inner"></div></div>';
    const emblem=document.createElement('div');emblem.className='cr-reveal-emblem';const mark=document.createElement('img');mark.src=markURL;mark.alt='';mark.draggable=false;emblem.append(mark);layers.append(emblem);root.append(layers);
    const shell=layers.querySelector('.cr-reveal-shell'),paper=layers.querySelector('.cr-reveal-paper'),badge=layers.querySelector('.cr-reveal-badge'),badgeBox=badge.getBoundingClientRect();
    return {box,layers,emblem,mark,shell,paper,badge,shellX:badgeBox.width/box.width,shellY:badgeBox.height/box.height,paperX:(badgeBox.width-20)/box.width,paperY:(badgeBox.height-20)/box.height};
  }
  function capture(root){
    if(!root?.isConnected||preference.matches||!window.anime?.createTimeline)return null;
    window.__crLottie?.cancelFeedback(root);
    states.get(root)?.finish();const panel=panelOf(root);if(!panel)return null;
    const box=panel.getBoundingClientRect(),outgoing=panel.cloneNode(true);outgoing.classList.add('cr-swap-outgoing');outgoing.inert=true;outgoing.setAttribute('aria-hidden','true');
    for(const el of [outgoing,...outgoing.querySelectorAll('[id]')])el.removeAttribute('id');
    Object.assign(outgoing.style,{position:'fixed',left:box.left+'px',top:box.top+'px',width:box.width+'px',height:box.height+'px',maxHeight:'none',margin:'0',pointerEvents:'none'});
    return {outgoing,box};
  }
  function swap(root,panel,snapshot){
    const box=panel.getBoundingClientRect(),focus=document.activeElement,outgoing=snapshot.outgoing,duration=time(root,'--cr-ui-swap',180);root.append(outgoing);panel.inert=true;root.dataset.motion='swapping';
    const state={root,panel,outgoing,finish(){
      clear(state);panel.style.opacity='';panel.style.transform='';panel.inert=false;root.dataset.motion='ready';
      if(root.isConnected&&focus&&panel.contains(focus))focus.focus({preventScroll:true});
    }};states.set(root,state);active.add(state);
    state.animation=anime.createTimeline({onComplete:()=>state.finish()})
      .add(outgoing,{opacity:[1,0],duration:duration*.55,ease:'in(2)'},0)
      .add(panel,{opacity:[0,1],scaleX:[snapshot.box.width/box.width,1],scaleY:[snapshot.box.height/box.height,1],duration,ease:'out(3)'},0);
  }
  function reveal(root,options={}){
    if(!root?.isConnected)return;
    const panel=panelOf(root);if(!panel)return;
    const header=panel.querySelector('header');
    if(header&&!header.querySelector('.cr-modal-brand')){
      const mark=document.createElement('img');mark.className='cr-modal-brand';mark.src=markURL;mark.alt='';mark.draggable=false;header.prepend(mark);
    }
    const focus=document.activeElement;
    root.dataset.motion='ready';
    if(options.swap&&!preference.matches&&window.anime?.createTimeline){swap(root,panel,options.swap);return;}
    if(options.animate===false||preference.matches||!window.anime?.createTimeline)return;
    const duration=time(root,'--cr-ui-enter',600),pace=duration/600;
    const {layers,emblem,mark,shell,paper,badge,shellX,shellY,paperX,paperY}=makeLayers(root,panel);
    panel.style.visibility='hidden';panel.inert=true;root.dataset.motion='opening';
    const state={root,panel,layers,finish(){
      clear(state);panel.style.visibility='';panel.inert=false;root.dataset.motion='ready';
      if(root.isConnected){const target=focus&&panel.contains(focus)?focus:panel.querySelector('[data-flow=start-level],[data-flow=next-level],[data-action=start-challenge],button');target?.focus({preventScroll:true});}
    }};
    states.set(root,state);active.add(state);
    state.logo=window.__crLottie?.playLogo(emblem);
    shell.style.transform=`scale(${shellX},${shellY})`;paper.style.transform=`scale(${paperX},${paperY})`;shell.style.opacity='0';paper.style.opacity='0';
    state.animation=anime.createTimeline({autoplay:false,onComplete:()=>state.finish()})
      .add(emblem,{opacity:[1,0],scale:[1,.8],duration:84*pace,ease:'in(2)'},0)
      .add(badge,{opacity:[1,0],scale:[1,.9],duration:84*pace,ease:'in(2)'},0)
      .add(shell,{opacity:[0,1],duration:48*pace,ease:'out(2)'},48*pace)
      .add(shell,{scaleX:[shellX,1],scaleY:[shellY,1],duration:152*pace,ease:'out(4)'},48*pace)
      .add(paper,{opacity:[0,1],duration:48*pace,ease:'out(2)'},84*pace)
      .add(paper,{scaleX:[paperX,1],scaleY:[paperY,1],duration:116*pace,ease:'out(3)'},84*pace);
    emblem.style.transform='scale(.85)';
    const expand=()=>{
      if(!active.has(state)||state.expanding)return;state.expanding=true;clearTimeout(state.finishTimer);
      requestAnimationFrame(()=>{if(active.has(state))state.animation.play();});
    };
    let readyTimer;
    Promise.race([state.logo?.ready??Promise.resolve(false),new Promise(resolve=>{readyTimer=setTimeout(()=>resolve(false),500);})]).then(ready=>{
      clearTimeout(readyTimer);if(!active.has(state))return;
      if(ready){
        state.entryAnimation=anime.animate(emblem,{scale:[.85,1],duration:72*pace,ease:'out(3)'});
        state.finishTimer=setTimeout(expand,Math.max(1200*pace,500));state.logo.finished.then(expand);state.logo.play(1/pace);
      }
      else{
        state.logo?.destroy();state.logo=null;mark.style.transform='none';
        state.entryAnimation=anime.createTimeline({onComplete:expand})
          .add(emblem,{scale:[.85,1],duration:72*pace,ease:'out(3)'},0)
          .add(emblem,{rotate:[-18,-24],duration:60*pace,ease:'inOut(2)'},0)
          .add(emblem,{rotate:[-24,70],duration:240*pace,ease:'out(3)'},60*pace)
          .add(emblem,{rotate:[70,64],duration:100*pace,ease:'out(2)'},300*pace);
      }
    });
  }
  function dismiss(root,done){
    window.__crLottie?.cancelFeedback(root);
    states.get(root)?.finish();
    const panel=panelOf(root);
    if(preference.matches||!window.anime?.createTimeline||!panel){done();return;}
    const pace=time(root,'--cr-ui-exit',600)/600;
    const {layers,emblem,mark,shell,paper,badge,shellX,shellY,paperX,paperY}=makeLayers(root,panel);
    root.dataset.motion='closing';panel.inert=true;panel.style.visibility='hidden';badge.style.opacity='0';emblem.style.opacity='0';mark.style.transform='rotate(64deg)';
    const state={root,panel,layers,finish(){if(state.done)return;state.done=true;clear(state);panel.style.visibility='';done();}};
    states.set(root,state);active.add(state);
    state.logo=window.__crLottie?.playLogo(emblem,true);
    const turnBack=()=>{
      let readyTimer;
      Promise.race([state.logo?.ready??Promise.resolve(false),new Promise(resolve=>{readyTimer=setTimeout(()=>resolve(false),500);})]).then(ready=>{
        clearTimeout(readyTimer);if(!active.has(state))return;
        if(ready)state.logo.play(1/pace);
        else{
          state.logo?.destroy();state.logo=null;mark.style.transform='none';
          state.entryAnimation=anime.createTimeline()
            .add(emblem,{rotate:[64,70],duration:100*pace,ease:'out(2)'},0)
            .add(emblem,{rotate:[70,-24],duration:240*pace,ease:'inOut(3)'},100*pace)
            .add(emblem,{rotate:[-24,-18],duration:60*pace,ease:'out(2)'},340*pace);
        }
        state.animation=anime.createTimeline({onComplete:()=>state.finish()})
          .add(emblem,{opacity:[1,0],scale:[1,.85],duration:72*pace,ease:'in(2)'},328*pace)
          .add(badge,{opacity:[1,0],duration:72*pace,ease:'in(2)'},328*pace);
      });
    };
    state.animation=anime.createTimeline({onComplete:turnBack})
      .add(paper,{scaleX:[1,paperX],scaleY:[1,paperY],duration:116*pace,ease:'in(3)'},0)
      .add(shell,{scaleX:[1,shellX],scaleY:[1,shellY],duration:152*pace,ease:'in(4)'},0)
      .add(paper,{opacity:[1,0],duration:48*pace,ease:'in(2)'},68*pace)
      .add(shell,{opacity:[1,0],duration:48*pace,ease:'in(2)'},104*pace)
      .add(emblem,{opacity:[0,1],scale:[.8,1],duration:84*pace,ease:'out(2)'},116*pace)
      .add(badge,{opacity:[0,1],scale:[.9,1],duration:84*pace,ease:'out(2)'},116*pace);
  }
  const finishActive=()=>{for(const state of [...active])state.finish();};
  addEventListener('resize',finishActive);
  preference.addEventListener('change',()=>{if(preference.matches)finishActive();});
  new MutationObserver(()=>{for(const state of [...active])if(!state.root.isConnected)clear(state);}).observe(document.documentElement,{childList:true,subtree:true});
  window.__crModalMotion={enter:reveal,exit:dismiss,capture};
})();
