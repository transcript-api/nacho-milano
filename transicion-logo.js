(() => {
  'use strict';
  const home=document.body, bar=document.querySelector('#bar'), src=document.querySelector('.campaignWordmark'), destination=bar?.querySelector('.brandMark img'), white=document.querySelector('#perchero');
  if(!home?.classList.contains('nmHome')||!bar||!src||!destination||!white)return;
  const hero=src.closest('.hero'), track=hero.closest('.heroTrack'), media=hero?.querySelector('.heroMedia');
  if(!hero||!track||!media)return;
  const overlay=src.cloneNode(true);
  overlay.classList.remove('campaignWordmark');overlay.classList.add('nmLogoTransit');
  overlay.removeAttribute('role');overlay.removeAttribute('aria-labelledby');overlay.setAttribute('aria-hidden','true');
  overlay.querySelector('title')?.remove();
  const filter=overlay.querySelector('#campaignLogoInvert'),mask=overlay.querySelector('#campaignLogoMask');
  if(!filter||!mask)return;
  filter.id='campaignTransitInvert';mask.id='campaignTransitMask';
  overlay.querySelector('mask image').setAttribute('filter','url(#campaignTransitInvert)');
  const pale=overlay.querySelector('rect');
  pale.setAttribute('mask','url(#campaignTransitMask)');pale.classList.add('nmLogoPale');
  const ink=pale.cloneNode(true);ink.classList.replace('nmLogoPale','nmLogoInk');overlay.append(ink);
  home.append(overlay);
  const quiet=matchMedia('(prefers-reduced-motion: reduce)');
  const clamp=(n,a=0,b=1)=>Math.min(b,Math.max(a,n));
  const smooth=n=>{n=clamp(n);return n*n*(3-2*n)};
  const lerp=(a,b,t)=>a+(b-a)*t;
  let measures=null, tick=0, measured=false, frameTime=0, previousGoal=null, position=0, previousStage='';
  function measure(){
    measured=false;
    const y=Math.max(0,scrollY),origin=src.getBoundingClientRect(),end=destination.getBoundingClientRect(),header=bar.getBoundingClientRect();
    if(!origin.width||!origin.height||!end.width||!end.height)return;
    const edge=white.getBoundingClientRect().top+y,barHeight=bar.offsetHeight;
    const limit=Math.max(145,edge-barHeight-Math.min(116,hero.offsetHeight*.13));
    measures={left:origin.left,top:origin.top-hero.getBoundingClientRect().top+track.getBoundingClientRect().top+y,width:origin.width,height:origin.height,
      endX:end.left,endY:end.top-header.top,rx:end.width/origin.width,ry:end.height/origin.height,barHeight,limit};
    overlay.style.width=origin.width+'px';overlay.style.height=origin.height+'px';
  }
  function setStage(stage){
    if(stage===previousStage)return;
    previousStage=stage;
    if(stage)home.dataset.logoStage=stage;else delete home.dataset.logoStage;
  }
  function render(now){
    tick=0;
    if(measured||!measures)measure();
    const m=measures;
    if(quiet.matches||!m){
      setStage('');destination.style.removeProperty('--logo-dock');
      media.style.removeProperty('transform');previousGoal=null;frameTime=0;return;
    }
    const y=Math.max(0,scrollY),goal=clamp(y,0,m.limit);
    const dt=frameTime?Math.min(33,Math.max(0,now-frameTime)):16;
    frameTime=now;
    if(previousGoal===null||goal===0||goal===m.limit||Math.abs(goal-previousGoal)>112)position=goal;
    else{
      const delta=goal-position;
      position=goal-Math.sign(delta)*Math.min(13,Math.abs(delta)*Math.exp(-dt/21));
      if(Math.abs(position-goal)<.2)position=goal;
    }
    previousGoal=goal;
    const p=clamp(position/m.limit), stage=p===0?'hero':p===1?'header':'voyage';
    setStage(stage);
    const ease=smooth(p);
    media.style.transform=p===0?'':'scale('+(1+ease*.034).toFixed(4)+')';
    if(stage==='voyage'){
      const curveY=p+.12*p*(1-p);
      const softY=smooth(curveY);
      const left=lerp(m.left,m.endX,ease);
      const up=lerp(m.top,m.endY,softY)-Math.sin(Math.PI*softY)*Math.min(27,m.height*.16);
      const sx=Math.pow(m.rx,ease),sy=Math.pow(m.ry,ease),h=m.height*sy;
      const dark=smooth((m.barHeight-(up+h*.62))/Math.max(13,h*.31));
      const dock=smooth((p-.925)/.075);
      overlay.style.transform='translate3d('+left.toFixed(3)+'px,'+up.toFixed(3)+'px,0) scale('+sx.toFixed(6)+','+sy.toFixed(6)+')';
      overlay.style.opacity=(1-dock).toFixed(4);
      ink.style.opacity=dark.toFixed(4);
      destination.style.setProperty('--logo-dock',dock.toFixed(4));
    }else destination.style.setProperty('--logo-dock',p===1?'1':'0');
    if(position!==goal)schedule();
    else frameTime=0;
  }
  function schedule(){if(!tick)tick=requestAnimationFrame(render)}
  function remeasure(){measured=true;schedule()}
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',remeasure,{passive:true});addEventListener('pageshow',remeasure);
  quiet.addEventListener('change',remeasure);destination.addEventListener('load',remeasure);
  if('ResizeObserver' in window){const ro=new ResizeObserver(remeasure);ro.observe(hero);ro.observe(bar);ro.observe(src);ro.observe(track)}
  render(performance.now());
})();
