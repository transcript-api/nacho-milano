/* Editorial lookbook: depth from orbit projection, silhouettes from four genuine
   angles. The individual photographs are sprites, not rotated rectangles. */
(() => {
'use strict';
const TAU=Math.PI*2,QUARTER=Math.PI/2,DOLLY=.22,ASPECT=420/880,BASELINE=.97;
const views=['front','right','back','left']; // screen direction, not the model's anatomical side
const mod=(x,n)=>((x%n)+n)%n;
const clamp=(x,min,max)=>Math.min(max,Math.max(min,x));
const smooth=x=>{const s=clamp(x,0,1);return s*s*(3-2*s)};
const fmt=n=>Number(n.toFixed(4));
function project(slot, count, w, h, focus=0){
  const t=TAU*slot/count, x=Math.sin(t), z=Math.cos(t);
  const perspective=(1-DOLLY)/(1-DOLLY*z);
  const tight=clamp((w-380)/450,0,1);
  const ringY=h*(.181-.159*focus),floorMid=h*(.669+.164*focus);
  const figureHeight=h*(.674+.104*focus+.025*tight),figureWidth=figureHeight*ASPECT;
  const edge=(w/2-5)/(1-DOLLY);
  // Bound the widest projected silhouette at every angle, not only at the
  // cardinal positions. This keeps a narrow portrait screen from cropping.
  const maxRadius=Math.sqrt(Math.max(1,(edge-figureWidth/2)**2-(edge*DOLLY)**2));
  const ringX=Math.min(w*(.453-.035*focus),maxRadius);
  // Camera bearing from each mark differs from its bearing at the origin.
  // The dancer at the rear has a 180° viewing angle and shows the back plate.
  const yaw=mod(t+Math.atan2(DOLLY*x,1-DOLLY*z),TAU)/QUARTER;
  const angle=Math.floor(yaw),blend=smooth((yaw-angle-.31)/.38);
  return {
    x:w/2+x*ringX*perspective, y:floorMid+z*ringY*perspective,
    scale:perspective, z, figureHeight,figureWidth,
    weights:views.map((_,i)=>i===angle?1-blend:i===(angle+1)%views.length?blend:0),
    rx:ringX*Math.sqrt((1-DOLLY)/(1+DOLLY)),
    ry:ringY/(1+DOLLY),
    cy:floorMid+ringY*DOLLY/(1+DOLLY)
  };
}
function mount(o){
  const {stage,scene,port,pins,info,all,previous,next,counter,looks,quiet,gesture,el,btn,image,link,selectProduct,productAction,launchZoom,outfitDrawer,refresh}=o;
  const n=looks.length;if(!n)return;
  const deep=Number(new URLSearchParams(location.search).get('look'));
  const chosen=Number.isInteger(deep)&&deep>0&&deep<=n;
  let ix=chosen?deep-1:0, phase=ix, aimed=phase, detailed=chosen, focusMix=Number(chosen), changePhase=null, changeFocus=null;
  let dragFrom=null, raf=0,w=0,h=0, points=[], touchOrigin=0, clickMute=0;
  const pathFor=(look,angle)=>'assets/looks-orbita/'+look.photo.slice(look.photo.lastIndexOf('/')+1)+'-'+angle+'.webp';
  const original=look=>'assets/'+look.photo+'.webp';
  const native=(look,angle)=>pathFor(look,angle).replace('looks-orbita/','looks-orbita-hd/');
  const activeFronts=[];
  function preferFront(fig){
    if(!fig.hd.src&&!('orbitFailed' in fig.hd.dataset)){fig.hd.src=fig.high;}
    if('orbitFailed' in fig.hd.dataset)return;
    const at=activeFronts.indexOf(fig);if(at!==-1)activeFronts.splice(at,1);
    activeFronts.push(fig);
    // Only selected looks request a larger portrait. Keep the two most recent
    // as well, so swipe and backtracking do not decode eight large portraits.
    if(activeFronts.length>3){
      const old=activeFronts.shift();old.hd.hidden=true;old.hd.style.opacity='0';old.hd.removeAttribute('src');
    }
  }

  stage.classList.add('orbitStage');scene.classList.add('orbitScene');port.classList.add('orbitModels');
  stage.setAttribute('role','region');stage.setAttribute('aria-roledescription','carrusel');
  const floor=el('div',undefined,'orbitFloor');floor.setAttribute('aria-hidden','true');
  const shadows=el('div',undefined,'orbitShadows');shadows.setAttribute('aria-hidden','true');
  stage.prepend(floor,shadows);
  const figures=looks.map((look,i)=>{
    const node=btn('',e=>{
      if((e?.detail||0)>0&&(performance.now()<clickMute||dragFrom!==null))return;
      if(i!==ix||Math.abs(phase-aimed)>.025){select(i);return}
      if(!detailed){focus(true);return}
      doZoom(node);
    },'model orbitModel');
    node.setAttribute('aria-label','Elegir look '+look.name);
    const sprite=el('span',undefined,'orbitSprite'),hit=el('span',undefined,'orbitHit'),shadow=el('span',undefined,'orbitShadow');
    sprite.setAttribute('aria-hidden','true');hit.setAttribute('aria-hidden','true');
    const art=views.map(key=>{
      const im=image(key==='front'?pathFor(look,key):native(look,key),'',true);im.draggable=false;im.width=420;im.height=880;im.dataset.orbitView=key;
      im.style.opacity='0';im.addEventListener('load',requestDraw,{once:true});
      im.addEventListener('error',()=>{
       if(key!=='front'&&!('orbitFallbackTried' in im.dataset)){im.dataset.orbitFallbackTried='';im.src=pathFor(look,key);return}
       im.dataset.orbitFailed='';requestDraw();
      });
      sprite.append(im);return im;
    });
    const hd=el('img');hd.alt='';hd.decoding='async';hd.draggable=false;hd.hidden=true;hd.style.opacity='0';hd.dataset.orbitHigh='front';
    hd.addEventListener('load',()=>{hd.hidden=false;requestDraw()});
    hd.addEventListener('error',()=>{hd.dataset.orbitFailed='';hd.hidden=true;requestDraw()});
    sprite.append(hd);
    const fallback=el('img');fallback.alt='';fallback.decoding='async';fallback.draggable=false;fallback.className='orbitFallback';fallback.hidden=true;
    sprite.append(fallback);node.append(sprite,hit);port.append(node);shadows.append(shadow);
    return {node,art,hd,high:native(look,'front'),fallback,shadow};
  });
  function doZoom(trigger){
    if(dragFrom!==null||changePhase)return;
    const look=looks[ix],fig=figures[ix];
    preferFront(fig);
    const pt=document.documentElement.lang.toLowerCase().startsWith('pt');
    const src=fig.high,alt=look.name+' · Frente';
    const views=[{src,alt,name:'Look',fallback:original(look)}];
    for(const item of look.items){
      const product=selectProduct(item.id), color=product?.colors.find(c=>c.name===item.color), texture=color?.photos?.texture;
      if(!texture)continue;
      const type=item.id.includes('camisa')?'Camisa':item.id.includes('calca')?(pt?'Calça':'Pantalón'):'Short';
      views.push({src:texture,name:type+' · textura',alt:product.name+' · '+color.name+' · Textura'});
    }
    launchZoom(src,alt,trigger,{views});
  }
  const step=()=>clamp(w*.305,91,245);
  const closest=i=>i+Math.round((phase-i)/n)*n;
  const active=m=>m&&m.duration>0;
  function tween(from,to,duration){
    return from===to||quiet.matches?null:{from,to,duration,at:performance.now()};
  }
  function sample(t,k){
    const x=clamp((t-k.at)/k.duration,0,1);
    return [k.from+(k.to-k.from)*(1-(1-x)**3),x===1];
  }
  function requestDraw(){if(!raf)raf=requestAnimationFrame(draw)}
  function dimensions(){
    const r=stage.getBoundingClientRect();w=r.width||stage.clientWidth;h=r.height||stage.clientHeight;
    requestDraw();
  }
  function paintImage(fig,p,isCurrent){
    if(isCurrent&&p.weights[0]>.80&&!fig.hd.src)preferFront(fig);
    const sharp=Boolean(fig.hd.src&&fig.hd.complete&&fig.hd.naturalWidth>0&&!('orbitFailed' in fig.hd.dataset));
    const loaded=fig.art.map((im,i)=>(i===0&&sharp)||(im.complete&&im.naturalWidth>0&&!('orbitFailed' in im.dataset)));
    const a=p.weights.map((v,i)=>loaded[i]?v:0);let total=a.reduce((s,v)=>s+v,0);
    if(total===0&&loaded.some(Boolean)){
      const idx=p.weights.indexOf(Math.max(...p.weights));
      const order=[idx,mod(idx-1,4),mod(idx+1,4),mod(idx+2,4)];
      a[order.find(i=>loaded[i])]=1;total=1;
    }
    // A missing whole set does not replace a partial view with a fake back.
    // Retain the old editorial photo only as an emergency front fallback.
    const substitute=total===0&&isCurrent&&fig.art.every(im=>('orbitFailed' in im.dataset));
    fig.fallback.hidden=!substitute;
    if(substitute&&!fig.fallback.getAttribute('src'))fig.fallback.src=original(looks[ix]);
    fig.art.forEach((im,i)=>{
      const opacity=String(fmt(i===0&&sharp?0:total?a[i]/total:0));if(im.style.opacity!==opacity)im.style.opacity=opacity;
    });
    const opacity=String(fmt(sharp&&total?a[0]/total:0));
    if(fig.hd.style.opacity!==opacity)fig.hd.style.opacity=opacity;
  }
  function draw(t=performance.now()){
    raf=0;if(!w||!h)return;
    if(active(changePhase)){
      let done;[phase,done]=sample(t,changePhase);if(done)changePhase=null;
    }
    if(active(changeFocus)){
      let done;[focusMix,done]=sample(t,changeFocus);if(done)changeFocus=null;
    }
    if(!changePhase&&dragFrom===null&&Math.abs(phase)>n*2){phase=mod(phase,n);aimed=phase}
    const spinning=dragFrom!==null||!!changePhase, busy=spinning||!!changeFocus;
    stage.toggleAttribute('data-orbit-busy',busy);stage.toggleAttribute('data-orbit-drag',dragFrom!==null);
    // During a drag out of close-up temporarily reveal the other orbit marks
    // rather than making a hidden model suddenly replace the selected body.
    const blend=focusMix*(1-.72*smooth(Math.abs(phase-aimed)*1.65));
    const ground=project(0,n,w,h,blend);
    floor.style.cssText='width:'+fmt(ground.rx*2)+'px;height:'+fmt(ground.ry*2)+'px;left:'+fmt(w/2-ground.rx)+'px;top:'+fmt(ground.cy-ground.ry)+'px;opacity:'+fmt(1-blend);
    const order=looks.map((_,i)=>[i,Math.cos(TAU*(i-phase)/n)]).sort((a,b)=>a[1]-b[1]||a[0]-b[0]);
    const rank=Array(n);order.forEach(([i],v)=>rank[i]=1+v);
    for(let i=0;i<n;i++){
      const f=figures[i],p=project(i-phase,n,w,h,blend),current=i===ix;
      points[i]=p;
      const visible=current?1:1-smooth((blend-.07)/.85);
      const shadowSize=p.figureWidth*p.scale*(.29+.1*(1-Math.abs(p.z)));
      f.node.style.transform='translate3d('+fmt(p.x-p.figureWidth/2)+'px,'+fmt(p.y-p.figureHeight+(1-BASELINE)*p.figureHeight*p.scale)+'px,0) scale('+fmt(p.scale)+')';
      f.node.style.width=fmt(p.figureWidth)+'px';f.node.style.height=fmt(p.figureHeight)+'px';
      f.node.style.zIndex=String(rank[i]);f.node.style.opacity=String(fmt(visible));
      f.node.style.setProperty('--orbit-hit',Math.round(17+19*(p.weights[1]+p.weights[3]))+'%');
      f.node.toggleAttribute('data-orbit-inactive',visible<.24);
      f.shadow.style.transform='translate3d('+fmt(p.x-shadowSize/2)+'px,'+fmt(p.y-4*p.scale)+'px,0)';
      f.shadow.style.width=fmt(shadowSize)+'px';f.shadow.style.height=fmt(Math.max(7,12*p.scale))+'px';
      f.shadow.style.opacity=String(fmt(visible*(.36+.3*p.scale)));
      paintImage(f,p,current);
    }
    if(changePhase||changeFocus)requestDraw();else if(detailed&&!busy)placePins();
  }
  function placePins(){
    const p=points[ix];if(!p)return;
    const height=p.figureHeight*p.scale,width=p.figureWidth*p.scale,off=height===0?0:p.y-height*BASELINE;
    [...pins.children].forEach((pin,j)=>{
      const item=looks[ix].items[j],x=(item.x??50)/100,y=(item.y??(34+j*26))/100;
      pin.style.left=clamp(p.x+(x-.5)*width,25,w-25)+'px';
      pin.style.top=clamp(off+y*height,30,h-74)+'px';
    });
  }
  function content(){
    const look=looks[ix],list=el('ul');counter.textContent=String(ix+1).padStart(2,'0')+' / '+String(n).padStart(2,'0');
    counter.setAttribute('aria-live','polite');
    scene.dataset.focus=String(detailed);all.hidden=!detailed;
    pins.replaceChildren();pins.setAttribute('aria-hidden',String(!detailed));
    figures.forEach(({node},i)=>{
      const current=i===ix;node.tabIndex=current?0:-1;node.setAttribute('aria-current',String(current));
      node.setAttribute('aria-label',(current&&detailed?'Ampliar foto de ':'Elegir look ')+looks[i].name);
      if(current&&detailed)node.setAttribute('aria-haspopup','dialog');else node.removeAttribute('aria-haspopup');
    });
    for(const item of look.items){
      const p=selectProduct(item.id),row=el('li');if(!p)continue;
      const index=p.colors.findIndex(c=>c.name===item.color);
      if(!p.draft||index<0){
        row.append(productAction(p));list.append(row);
        if(detailed){const pin=btn(String(pins.children.length+1),()=>productAction(p).click(),'pin');pin.setAttribute('aria-label','Ver '+p.name);pins.append(pin)}
        continue;
      }
      const color=p.colors[index], href='producto-'+p.id+'.html?color='+encodeURIComponent(color.name);
      const anchor=link('',href,'lookItem lookItemLink');
      if(color?.photos?.front)anchor.append(image(color.photos.front,''));
      anchor.append(el('span',p.name),el('span','↗'));anchor.setAttribute('aria-label','Ver '+p.name+' · '+color.name);row.append(anchor);list.append(row);
      if(detailed){const pin=link(String(pins.children.length+1),href,'pin');pin.setAttribute('aria-label','Ver '+p.name+' · '+color.name);pins.append(pin)}
    }
    info.replaceChildren(el('span',look.label,'smallCaps'),el('h3',look.name),el('p',look.copy),list);
    if(!detailed)info.append(btn('Ver prendas del look →',()=>{focus(true);figures[ix].node.focus({preventScroll:true})},'textLink'));
    else {
      const zoom=btn('Ampliar foto',()=>doZoom(zoom),'textLink orbitZoom');zoom.setAttribute('aria-haspopup','dialog');info.append(zoom);
    }
    if(!look.draft)info.append(btn('Armar el look',()=>outfitDrawer(look),'buy buildLook'));
    refresh();
  }
  function select(to,duration=450){
    ix=mod(to,n);aimed=closest(ix);
    dragFrom=null;
    changePhase=tween(phase,aimed,duration);if(!changePhase)phase=aimed;
    content();requestDraw();
  }
  function snap(to,duration=420){
    ix=mod(to,n);aimed=to;dragFrom=null;
    changePhase=tween(phase,to,duration);if(!changePhase)phase=to;
    content();requestDraw();
  }
  function focus(on){
    detailed=on;changeFocus=tween(focusMix,Number(on),332);
    if(!changeFocus)focusMix=Number(on);
    content();requestDraw();
    if(on){
      const r=stage.getBoundingClientRect();
      if(r.top<70||r.bottom>window.innerHeight)stage.scrollIntoView({block:'start',behavior:'instant'});
    }
  }
  gesture(stage,{
    accept:e=>!e.target.closest('.orbitZoom'),enabled:()=>n>1,
    move:dx=>{
      if(dragFrom===null){dragFrom=phase;touchOrigin=aimed;changePhase=null}
      const amount=clamp(-dx/step(),-3.25,3.25);
      phase=quiet.matches?dragFrom+Math.round(amount):dragFrom+amount;
      requestDraw();
    },
    release:(dir,dx,v)=>{
      if(dragFrom===null)return;
      const travel=(phase-dragFrom);
      const carry=quiet.matches?0:clamp(-v*.16,-.7,.7);
      const desired=dragFrom+travel+carry;
      const abs=Math.abs(dx), flick=Math.abs(v)>.34&&abs>32;
      // A quick short flick is one look; a slow partial movement settles back.
      let target=Math.round(desired);
      if(flick&&target===Math.round(dragFrom))target+=dir;
      clickMute=performance.now()+400;snap(target,clamp(340+Math.abs(target-phase)*145,340,530));
    },
    cancel:()=>{
      if(dragFrom===null)return;
      clickMute=performance.now()+400;snap(touchOrigin,285);
    }
  });
  stage.addEventListener('keydown',e=>{
    if(e.target.closest('.runControls,.pin,#allLooks')||e.altKey||e.ctrlKey||e.metaKey||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
    e.preventDefault();const moveFocus=figures.some(f=>f.node===document.activeElement);
    if(e.key==='Home'||e.key==='End')select(e.key==='Home'?0:n-1);else snap(aimed+(e.key==='ArrowRight'?1:-1),435);
    if(moveFocus)figures[ix].node.focus({preventScroll:true});
  });
  previous.onclick=()=>snap(aimed-1,435);next.onclick=()=>snap(aimed+1,435);
  all.onclick=()=>{focus(false);figures[ix].node.focus({preventScroll:true})};
  scene.closest('#looks')?.addEventListener('keydown',e=>{if(e.key==='Escape'&&detailed){focus(false);figures[ix].node.focus({preventScroll:true})}});
  quiet.addEventListener('change',()=>{
    if(quiet.matches){phase=aimed;focusMix=Number(detailed);dragFrom=null;changePhase=changeFocus=null;requestDraw()}
  });
  if(typeof ResizeObserver==='function')new ResizeObserver(dimensions).observe(stage);
  window.addEventListener('resize',dimensions,{passive:true});dimensions();content();
  if(chosen&&location.hash==='#looks')requestAnimationFrame(()=>focus(true));
}
window.NM_ORBIT=Object.freeze({mount,project});
})();
