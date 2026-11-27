/* One row per design, with color as the presentation and purchase unit. */
(() => {
'use strict';
const cleanups=new WeakMap();
const pairedShorts=new Set(['nm-short-linho-ultra-premium','nm-bermuda-champy']);
const svg=(glyph)=>{
  const ns='http://www.w3.org/2000/svg',s=document.createElementNS(ns,'svg'),p=document.createElementNS(ns,'path');
  const paths={pause:'M9 6v12m6-12v12',play:'m9 5 11 7-11 7Z',detail:'M7 11V7h4m2 10h4v-4M7 7l4 4m6 6-4-4'};
  s.setAttribute('viewBox','0 0 24 24');s.setAttribute('aria-hidden','true');s.setAttribute('focusable','false');p.setAttribute('d',paths[glyph]);s.append(p);return s;
};
function motion(track,original,button){
  const abort=new AbortController(),l=(node,type,fn,opts={})=>node.addEventListener(type,fn,{signal:abort.signal,...opts});
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const SPEED=64; // CSS px/s, equal for the 3- and 4-color rows
  let ordered=false,inside=!('IntersectionObserver' in window),explicitPause=false,hold=null,draggedUntil=0;
  let loop=0,previous=0,cursor=null,timer=0,until=0,raf=0,lap=0;
  const earlier=original.previousElementSibling;
  const wrap=x=>lap+((x-lap)%lap+lap)%lap;
  const keyboard=()=>!!track.querySelector(':focus-visible')||track.matches(':focus-visible');
  function stop(){if(raf)cancelAnimationFrame(raf);raf=0;previous=0;cursor=null}
  function onTime(now){
    raf=0;
    if(!shouldMove()){arm();return}
    if(cursor===null)cursor=wrap(track.scrollLeft);
    if(previous)cursor=wrap(cursor+SPEED*Math.min(55,now-previous)/1000);
    previous=now;track.scrollLeft=cursor;raf=requestAnimationFrame(onTime);
  }
  function shouldMove(){return ordered&&inside&&!document.hidden&&!hold&&!explicitPause&&!reduce.matches&&!keyboard()&&!document.querySelector('dialog[open]')&&performance.now()>=until;}
  function arm(){
    clearTimeout(timer);timer=0;
    if(shouldMove()){
      if(!raf)raf=requestAnimationFrame(onTime);
    }else{
      stop();
      if(inside&&!hold&&!explicitPause&&!reduce.matches&&performance.now()<until)timer=setTimeout(arm,Math.ceil(until-performance.now())+15);
    }
  }
  function cool(ms=1300){until=performance.now()+ms;arm();}
  function measure(){
    const prior=lap,phase=ordered&&prior?((track.scrollLeft%prior+prior)%prior)/prior:0;
    lap=original.getBoundingClientRect().left-earlier.getBoundingClientRect().left;
    if(lap<=1)return;
    if(!ordered||Math.abs(lap-prior)>.25){
      stop();ordered=true;
      if(!hold)track.scrollLeft=lap*(1+phase);
    }
    arm();
  }
  function updateButton(){
    button.hidden=reduce.matches;
    button.setAttribute('aria-label',explicitPause?'Activar avance automático':'Pausar avance automático');
    button.replaceChildren(svg(explicitPause?'play':'pause'));
  }
  l(button,'click',()=>{
    explicitPause=!explicitPause;until=0;updateButton();arm();
  });
  l(reduce,'change',()=>{updateButton();arm()});
  // Do not pause merely because a desktop cursor is hovering.
  l(track,'focusin',arm);l(track,'focusout',()=>queueMicrotask(arm));
  l(track,'keydown',e=>{
    if(e.target!==track||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
    e.preventDefault();cool(1600);
    const delta=(original.firstElementChild?.getBoundingClientRect().width||160)+(original.children.length>1?(original.children[1].getBoundingClientRect().left-original.firstElementChild.getBoundingClientRect().right):0);
    const pos=e.key==='Home'?lap:e.key==='End'?2*lap-delta:wrap(track.scrollLeft)+(e.key==='ArrowRight'?delta:-delta);
    track.scrollLeft=pos;
  });
  l(track,'wheel',e=>{if(Math.abs(e.deltaX)>0||e.shiftKey)cool(1400)},{passive:true});
  l(track,'pointerdown',e=>{
    if(!e.isPrimary||e.button!==0||hold)return;
    // Copy cards are hit-testable but stay out of the keyboard/AT tab order.
    if(e.pointerType==='mouse'&&e.target.closest('[data-variant-copy]'))e.preventDefault();
    hold={id:e.pointerId,x:e.clientX,y:e.clientY,scroll:track.scrollLeft,mouse:e.pointerType==='mouse',active:false};
    stop();arm();
  });
  l(window,'pointermove',e=>{
    if(!hold||e.pointerId!==hold.id||!hold.mouse)return;
    const x=e.clientX-hold.x,y=e.clientY-hold.y;
    if(!hold.active&&Math.abs(x)>8&&Math.abs(x)>Math.abs(y)){
      hold.active=true;track.dataset.variantDragging='';try{track.setPointerCapture(e.pointerId)}catch{}
    }
    if(hold.active){if(e.cancelable)e.preventDefault();track.scrollLeft=hold.scroll-x}
  },{passive:false});
  const finish=e=>{
    if(!hold||e.pointerId!==hold.id)return;
    const moved=hold.active||Math.abs(e.clientX-hold.x)>8||Math.abs(e.clientY-hold.y)>8;
    if(hold.active||e.type==='pointercancel')draggedUntil=performance.now()+410;
    hold=null;delete track.dataset.variantDragging;cool(moved?1350:360);
  };
  l(window,'pointerup',finish);l(window,'pointercancel',finish);
  l(track,'lostpointercapture',e=>{if(e.target===track&&hold?.active)finish(e)});
  l(track,'click',e=>{if(e.detail&&performance.now()<draggedUntil){e.preventDefault();e.stopImmediatePropagation()}},true);
  l(track,'dragstart',e=>e.preventDefault());
  // Follow native touch momentum; resume only after it goes quiet. Automatic
  // scroll events never reset this timeout because its RAF is still running.
  l(track,'scroll',()=>{if(!raf&&!hold&&until&&performance.now()<=until+90)cool(1300)},{passive:true});
  l(document,'visibilitychange',arm);l(document,'close',arm,true);
  l(window,'pageshow',arm);
  const io=typeof IntersectionObserver==='function'?new IntersectionObserver(([entry])=>{inside=entry.isIntersecting;arm()},{threshold:.06}):null;
  io?.observe(track);
  const ro=typeof ResizeObserver==='function'?new ResizeObserver(()=>{cancelAnimationFrame(loop);loop=requestAnimationFrame(measure)}):null;
  ro?.observe(track);l(window,'resize',measure,{passive:true});
  measure();updateButton();arm();
  return ()=>{stop();abort.abort();io?.disconnect();ro?.disconnect();clearTimeout(timer);cancelAnimationFrame(loop);hold=null};
}
// A small, square sample is enough in the grid; the original macro is reserved for zoom.
const textureKeys=new Set('swell-off swell-preto swell-verde swell-mascavo rustic-safari rustic-areia rustic-branco rustic-azul calca-preto calca-bege calca-branco short-natural champy-branco'.split(' '));
function textureImage(full,el,image){
  const key=/^assets\/coleccion-detalles\/([a-z0-9-]+)-textura\.webp$/.exec(full)?.[1];
  if(!textureKeys.has(key))return image(full); // Future or remote catalog photos still work.
  const prefix='assets/mini-texturas/'+key+'-',im=el('img');
  im.alt='';im.decoding='async';im.loading='lazy';im.width=96;im.height=96;im.dataset.fullTexture=full;
  // All swatches are 48–80 CSS px. Density descriptors avoid selecting the 96px tier on a 3× phone.
  im.srcset=prefix+'96.webp 1x, '+prefix+'240.webp 2x';im.src=prefix+'96.webp';return im;
}
function recoverTexture(e){
  const im=e.target;if(!im.matches?.('img[data-full-texture]'))return;
  const full=im.dataset.fullTexture;delete im.dataset.fullTexture;im.removeAttribute('srcset');im.removeAttribute('sizes');im.src=full;
}
function render(host,products,api){
  (cleanups.get(host)||[]).forEach(f=>f());
  const {el,btn,image,link,glyph,photo,placeholder,quickDraft,openZoom,onSave}=api;
  const fragment=document.createDocumentFragment(),rails=[];let shortPair=null;
  for(const product of products){
    const {id,name,colors}=product;if(!colors?.length)continue;
    const count=colors.length,moving=count>=3,paired=count===1&&pairedShorts.has(id);
    const row=el('section',undefined,'variantRow');row.dataset.variantProduct=id;row.dataset.variantCount=String(count);
    const head=el('header',undefined,'variantRowHead'),copy=el('div',undefined,'variantRowHeading'),title=el('h3',name);
    title.id='variant-title-'+id;row.setAttribute('aria-labelledby',title.id);
    copy.append(title,el('span',count+(count===1?' color':' colores'),'variantCount'));
    const actions=el('div',undefined,'variantRowActions');
    const save=btn('',()=>onSave(product),'cardSave variantSave');save.dataset.save=id;save.append(glyph('star'));actions.append(save);
    const play=moving?btn('',()=>{},'variantPlay'):null;
    if(play){play.setAttribute('aria-controls','variant-track-'+id);actions.prepend(play)}
    head.append(copy,actions);row.append(head);
    const track=el('div',undefined,'variantTrack'),original=el('div',undefined,'variantGroup');
    if(moving){
      track.id='variant-track-'+id;track.tabIndex=0;track.setAttribute('role','region');
      track.setAttribute('aria-roledescription','carrusel');track.setAttribute('aria-label','Colores del catálogo');
    }
    colors.forEach((variant,i)=>{
      const color=variant.name, identity=name+' · '+color, href='producto-'+id+'.html?color='+encodeURIComponent(color);
      const card=el('article',undefined,'variantCard');card.dataset.variantIndex=String(i);
      const visual=el('div',undefined,'cardVisual variantVisual'),face=link('',href,'variantFace');
      face.setAttribute('aria-label','Abrir ficha de '+identity);
      const fronte=photo(variant),macro=photo(variant,'texture');
      const img=fronte?image(fronte,identity):placeholder();if(fronte)img.draggable=false;face.append(img);visual.append(face);
      if(macro){
        const texture=btn('',()=>{},'variantTexture');texture.dataset.variantAction='texture';
        const img=count===1&&!paired?image(macro):textureImage(macro,el,image);img.draggable=false;
        texture.setAttribute('aria-label','Ampliar: Primer plano · '+identity);texture.setAttribute('aria-haspopup','dialog');
        texture.append(img,svg('detail'));visual.append(texture);
      }
      const add=btn('',()=>{},'cardAdd');add.dataset.variantAction='add';add.append(glyph('bag'));
      add.setAttribute('aria-label','Agregar al carrito: '+identity);add.setAttribute('aria-haspopup','dialog');visual.append(add);
      const caption=link(color,href,'variantCaption');caption.setAttribute('aria-label','Abrir ficha de '+identity);
      card.append(visual,caption);original.append(card);
    });
    track.addEventListener('error',recoverTexture,true); // Captures errors from cloned carousel cards, too.
    track.addEventListener('click',e=>{
      const action=e.target.closest('[data-variant-action]');if(!action)return;
      const target=action.closest('.variantCard'), index=Number(target?.dataset.variantIndex);
      const variant=colors[index];if(!variant)return;
      if(action.dataset.variantAction==='add')quickDraft(product,index,action.closest('[data-variant-copy]')?track:action);
      else if(action.dataset.variantAction==='texture')openZoom(photo(variant,'texture'),product.name+' · '+variant.name+' · Primer plano');
    });
    if(moving){
      const repeat=()=>{
        const copy=original.cloneNode(true);copy.dataset.variantCopy='';copy.setAttribute('aria-hidden','true');
        copy.querySelectorAll('a,button').forEach(x=>x.tabIndex=-1);
        return copy;
      };
      track.append(repeat(),original,repeat());rails.push([track,original,play]);
    }else track.append(original);
    row.append(track);
    if(paired){
      if(!shortPair){shortPair=el('div',undefined,'variantPair');fragment.append(shortPair)}
      row.dataset.variantPaired='';shortPair.append(row);
    }else fragment.append(row);
  }
  host.dataset.variantRows='';host.replaceChildren(fragment);cleanups.set(host,rails.map(args=>motion(...args)));
}
window.NM_VARIANTS=Object.freeze({render});
})();
