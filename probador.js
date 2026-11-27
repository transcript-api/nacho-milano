/* Turn two independently registered photographic plates into a dressable display.
   To add a garment/color: register a 640×1000 alpha plate and the exact catalog color below. */
(() => {
  'use strict';
  const host = document.querySelector('[data-nm-probador]');
  if (!host || host.dataset.mounted === 'yes') return;
  const catalog = new Map((window.NM_DRAFT || []).map(p => [p.id, p]));
  const garments = {
    top: [
      ['nm-camisa-rustic', [['Safari', 'rustic-safari', '#bda791'], ['Azul Claro', 'rustic-azul', '#9fc1d5'], ['Areia', 'rustic-areia', '#c9ad8f'], ['Branco', 'rustic-branco', '#f6f3ec']]],
      ['nm-camisa-swell', [['OFF', 'swell-off', '#eae5d8'], ['Preto', 'swell-preto', '#282629'], ['Mascavo', 'swell-mascavo', '#93593f'], ['Verde', 'swell-verde', '#6b7866']]]
    ],
    bottom: [
      ['nm-short-linho-ultra-premium', [['Natural', 'short-natural', '#dacebc']]],
      ['nm-calca-de-linho-com-elastano', [['Preto', 'calca-preto', '#252527'], ['Branco', 'calca-branco', '#f6f4ef'], ['Bege', 'calca-bege', '#cabba4']]],
      ['nm-bermuda-champy', [['Branco', 'champy-branco', '#f6f4ee']]]
    ]
  };
  const parts = ['top', 'bottom'];
  const lists = {};
  for (const p of parts) {
    lists[p] = garments[p].flatMap(([id, variants]) => {
      const item = catalog.get(id); if (!item) return [];
      return variants.filter(([c]) => item.colors.some(color => color.name === c))
        .map(([color, key, swatch]) => ({id,name:item.name,color,key,swatch,src:'assets/probador/'+key+'.webp'}));
    });
    if (!lists[p].length) return;
  }
  const memoryKey = 'nm-probador-v1';
  let saved = {};
  try { saved = JSON.parse(sessionStorage.getItem(memoryKey) || '{}') || {}; } catch {}
  const selection = Object.fromEntries(parts.map(p => [p, lists[p].find(v => v.key === saved[p]) || lists[p][0]]));
  const make = (tag, cl, txt) => { const e = document.createElement(tag); if (cl) e.className = cl; if (txt != null) e.textContent = txt; return e; };
  const block=make('div','nmFitting__layout'), title=make('h2','nmFitting__title','Probador');
  const intro=make('p','nmFitting__intro','Arrastrá una prenda al maniquí o tocala para probártela.');
  title.id='nmFittingTitle'; intro.id='nmFittingInstructions';
  host.setAttribute('aria-labelledby',title.id);
  host.setAttribute('aria-describedby',intro.id);
  const stage=make('div','nmFitting__stage'), photo=make('div','nmFitting__photo');
  const guide=make('p','nmFitting__guide'); guide.setAttribute('aria-hidden','true');
  const visual=make('div','nmFitting__render');visual.setAttribute('role','img');
  const side=make('div','nmFitting__controls'), notice=make('p','nmFitting__notice');
  notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');notice.setAttribute('aria-atomic','true');
  const layers={}, previews={}, zones={}, widgets={}, tokens={top:0,bottom:0}, cache=new Map();
  function plate(p, preview){
    const im=make('img','nmFitting__plate nmFitting__plate--'+p+(preview?' nmFitting__preview':''));
    im.alt='';im.width=640;im.height=1000;im.decoding='async';im.setAttribute('draggable','false');
    if(preview)im.hidden=true;
    else{
      im.loading='lazy';im.src=selection[p].src;
      im.addEventListener('error',()=>{ if(!im.naturalWidth) notice.textContent='No se pudo cargar la vista de esta prenda.'; });
    }
    return im;
  }
  for (const p of ['bottom','top']) {
    layers[p]=plate(p,false);previews[p]=plate(p,true);visual.append(layers[p],previews[p]);
    const zone=make('div','nmFitting__zone nmFitting__zone--'+p);
    zone.dataset.fitZone=p;zone.setAttribute('aria-hidden','true');zones[p]=zone;
  }
  photo.append(visual,zones.top,zones.bottom);stage.append(photo,guide);
  function updateText(){
    const {top:t,bottom:b}=selection;
    visual.setAttribute('aria-label','Maniquí con '+t.name+', '+t.color+', y '+b.name+', '+b.color+'.');
  }
  function prefetch(v){
    let slot=cache.get(v.src);if(slot)return slot;
    const im=new Image();slot={ready:false,promise:null};cache.set(v.src,slot);
    slot.promise=new Promise((resolve,reject)=>{
      const done=()=>{slot.ready=true;resolve();};
      im.onload=()=>{ if(im.decode)im.decode().then(done,done); else done(); };
      im.onerror=()=>{cache.delete(v.src);reject(new Error('Plate not available'));};
      im.src=v.src;
    });
    return slot;
  }
  // Only swap a visible plate once the next has decoded; ignore stale taps/drops.
  function select(p,v,byDrop=false){
    if(!v)return;
    const token=++tokens[p];
    const done=()=>{
      if(tokens[p]!==token)return;
      selection[p]=v;layers[p].src=v.src;widgets[p].update();updateText();
      notice.textContent=byDrop?'Prenda colocada.':'';
      try{sessionStorage.setItem(memoryKey,JSON.stringify({top:selection.top.key,bottom:selection.bottom.key}));}catch{}
    };
    if(v===selection[p]){done();return;}
    const slot=prefetch(v);
    if(slot.ready)done();else slot.promise.then(done,()=>{
      if(tokens[p]===token)notice.textContent='No se pudo cargar esa variante. Probá de nuevo.';
    });
  }

  // Pointer Events handle mouse, pen and the touch-safe grip. Touch Events add
  // a press-and-hold anywhere else on a garment while preserving early native scroll.
  const dragGhost=make('div','nmFitting__ghost'), ghostPhoto=make('img');
  ghostPhoto.alt='';ghostPhoto.setAttribute('draggable','false');
  dragGhost.setAttribute('aria-hidden','true');dragGhost.hidden=true;dragGhost.append(ghostPhoto);
  const options=new WeakMap();
  let drag=null, skip=null, armTimer=0, frame=0, effectTimer=0;
  const HOLD_MS=210, PREHOLD_SLOP=9, DRAG_SLOP=6;
  const xy=(e)=>[e.clientX,e.clientY];
  const fitOption=(e)=>e.target.closest?.('[data-fit-option]');
  const contain=(r,x,y)=>x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;
  function zoneAt(x,y){
    // Zones are viewport coordinates; clipping is authoritative (scroll + narrow viewports).
    if(!contain(stage.getBoundingClientRect(),x,y))return null;
    return parts.find(p=>contain(zones[p].getBoundingClientRect(),x,y))||null;
  }
  function position(x,y){
    const width=window.innerWidth, height=window.innerHeight;
    const left=Math.max(5,Math.min(x+(x>width-100?-82:14),width-66));
    const top=Math.max(5,Math.min(y+10,height-82));
    dragGhost.style.transform='translate3d('+left+'px,'+top+'px,0)';
  }
  function clearPreview(){
    for(const p of parts){previews[p].hidden=true;layers[p].hidden=false;}
  }
  function stateAt(d){
    const next=zoneAt(d.x,d.y);
    if(next===d.over)return;
    d.over=next; clearPreview();
    stage.dataset.fitTarget=next||'outside';
    stage.dataset.fitValidity=next ? (next===d.part?'valid':'wrong'):'outside';
    guide.textContent=next===d.part?'Soltá para probar':
      d.part==='top'?'Soltá la camisa en el torso.':'Soltá la prenda en las piernas.';
    if(next!==d.part||d.v===selection[d.part])return;
    const show=()=>{
      if(drag!==d||d.over!==d.part)return;
      const layer=previews[d.part];layer.src=d.v.src;layer.hidden=false;layers[d.part].hidden=true;
    };
    const slot=prefetch(d.v);
    if(slot.ready)show();else slot.promise.then(show,()=>{});
  }
  function autoScroll(){
    frame=0;const d=drag;if(!d?.active)return;
    const rect=host.getBoundingClientRect(),height=window.innerHeight,edge=Math.min(70,height*.16),y=d.y;
    let delta=0;
    if(y<edge&&rect.top<0)delta=-Math.min(-rect.top,Math.max(0,edge-y)*.13,9);
    else if(y>height-edge&&rect.bottom>height)delta=Math.min(rect.bottom-height,(y-height+edge)*.13,9);
    if(delta)window.scrollBy({top:delta,left:0,behavior:'instant'});
    stateAt(d);frame=requestAnimationFrame(autoScroll);
  }
  function activate(d){
    if(drag!==d||d.active)return;
    clearTimeout(armTimer);armTimer=0;
    d.active=true;d.button.dataset.fitLifted='';stage.dataset.fitDragging=d.part;d.over=undefined;
    dragGhost.dataset.fitGhost=d.part;ghostPhoto.src=d.v.src;dragGhost.hidden=false;
    position(d.x,d.y);stateAt(d);prefetch(d.v).promise.catch(()=>{});
    frame=requestAnimationFrame(autoScroll);
    if(d.kind==='pointer')try{d.button.setPointerCapture(d.id);}catch{}
  }
  function arm(button,kind,id,x,y,immediate){
    const option=options.get(button);
    if(!option||button.hidden||drag)return;
    skip=null;
    const {part,get}=option, d={button,kind,id,part,v:get(),x0:x,y0:y,x,y,active:false,over:undefined};
    if(!d.v)return;
    drag=d;
    if(kind==='touch'&&!immediate)armTimer=setTimeout(()=>activate(d),HOLD_MS);
    if(immediate)activate(d);
  }
  function move(d,x,y,e){
    d.x=x;d.y=y;
    const distance=Math.hypot(x-d.x0,y-d.y0);
    if(!d.active){
      if(d.kind==='touch'){if(distance>PREHOLD_SLOP)finish(false);return;}
      if(distance<DRAG_SLOP)return;
      activate(d);
    }
    if(e.cancelable)e.preventDefault();
    position(x,y);stateAt(d);
  }
  function finish(apply,x,y,speak=false){
    const d=drag;if(!d)return;
    drag=null;clearTimeout(armTimer);armTimer=0;
    cancelAnimationFrame(frame);frame=0;
    if(!d.active)return;
    skip={button:d.button,until:performance.now()+550};
    delete d.button.dataset.fitLifted;dragGhost.hidden=true;
    delete stage.dataset.fitDragging;delete stage.dataset.fitTarget;delete stage.dataset.fitValidity;
    if(d.kind==='pointer'&&d.button.hasPointerCapture?.(d.id))try{d.button.releasePointerCapture(d.id);}catch{}
    if(!apply){clearPreview();if(speak)notice.textContent='Arrastre cancelado.';return;}
    const hit=zoneAt(x,y);
    if(hit!==d.part){
      clearPreview();notice.textContent=d.part==='top'?'Soltá la camisa en el torso.':'Soltá la prenda en las piernas.';
      return;
    }
    select(d.part,d.v,true);clearPreview();
    clearTimeout(effectTimer);
    for(const p of parts)delete zones[p].dataset.fitPlaced;
    zones[d.part].dataset.fitPlaced='';
    effectTimer=setTimeout(()=>delete zones[d.part].dataset.fitPlaced,380);
  }
  const touch=(list,id)=>Array.from(list||[]).find(t=>t.identifier===id);
  host.addEventListener('pointerdown',e=>{
    const b=fitOption(e);if(!b||!e.isPrimary||e.button!==0)return;
    if(e.pointerType==='touch'&&!e.target.closest('.nmFitting__grip'))return;
    arm(b,'pointer',e.pointerId,...xy(e),false);
  });
  window.addEventListener('pointermove',e=>{
    const d=drag;if(d?.kind==='pointer'&&d.id===e.pointerId)move(d,...xy(e),e);
  },{passive:false});
  window.addEventListener('pointerup',e=>{
    const d=drag;if(d?.kind==='pointer'&&d.id===e.pointerId)finish(true,...xy(e));
  },true);
  window.addEventListener('pointercancel',e=>{
    if(drag?.kind==='pointer'&&drag.id===e.pointerId)finish(false);
  },true);
  host.addEventListener('lostpointercapture',e=>{
    if(drag?.kind==='pointer'&&drag.id===e.pointerId&&drag.button===e.target)finish(false);
  });
  host.addEventListener('touchstart',e=>{
    if(e.touches.length!==1){if(drag?.kind==='touch')finish(false);return;}
    const b=fitOption(e), t=e.changedTouches[0];
    if(b&&t)arm(b,'touch',t.identifier,...xy(t),false);
  },{passive:true});
  host.addEventListener('touchmove',e=>{
    const d=drag;if(d?.kind!=='touch')return;
    if(e.touches.length!==1){finish(false);return;}
    const t=touch(e.changedTouches,d.id);
    if(t)move(d,...xy(t),e);
  },{passive:false});
  host.addEventListener('touchend',e=>{
    if(drag?.kind!=='touch')return;
    const t=touch(e.changedTouches,drag.id);if(!t)return;
    if(drag.active&&e.cancelable)e.preventDefault();
    finish(true,...xy(t));
  },{passive:false});
  host.addEventListener('touchcancel',e=>{
    if(drag?.kind==='touch'&&touch(e.changedTouches,drag.id))finish(false);
  },{passive:true});
  host.addEventListener('click',e=>{
    const b=fitOption(e);
    if(skip&&e.detail!==0&&skip.button===b&&performance.now()<skip.until){e.preventDefault();e.stopImmediatePropagation();skip=null;}
  },true);
  host.addEventListener('dragstart',e=>{if(fitOption(e))e.preventDefault();});
  host.addEventListener('contextmenu',e=>{if(drag&&fitOption(e))e.preventDefault();});
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&drag?.active){e.preventDefault();finish(false,0,0,true);}
  },true);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)finish(false);});
  window.addEventListener('blur',()=>finish(false));

  function addOption(b,part,get){
    b.dataset.fitOption='';options.set(b,{part,get});b.addEventListener('click',()=>select(part,get()));
  }
  for (const part of parts) {
    const area=make('fieldset','nmFitting__part'),legend=make('legend','nmFitting__legend',part==='top'?'Camisa':'Pantalón o short');
    const choices=make('div','nmFitting__choices'), names=[];
    const colorRow=make('div','nmFitting__colorRow'),colors=make('div','nmFitting__colors');
    colors.setAttribute('role','group');colors.setAttribute('aria-label','Color de '+legend.textContent);
    const colorName=make('span','nmFitting__colorName'),link=make('a','nmFitting__link','Ver prenda'),linkArrow=make('span',null,'↗');
    linkArrow.setAttribute('aria-hidden','true');link.append(linkArrow);colorRow.append(colors,colorName,link);
    for (const id of [...new Set(lists[part].map(v=>v.id))]) {
      const variants=lists[part].filter(v=>v.id===id),first=variants[0],b=make('button','nmFitting__choice');
      const label=make('span','nmFitting__choiceName',first.name),grip=make('span','nmFitting__grip');
      grip.setAttribute('aria-hidden','true');grip.append(make('span'));b.append(label,grip);b.type='button';b.dataset.fitProduct=id;
      addOption(b,part,()=>selection[part].id===id?selection[part]:variants.find(v=>v.color===selection[part].color)||first);
      names.push([b,id]);choices.append(b);
    }
    const swatches=new Map();
    for(const v of lists[part]){
      const b=make('button','nmFitting__swatch');b.type='button';
      b.dataset.fitColor=v.key;b.title=v.color;b.setAttribute('aria-label',v.color);
      const dot=make('span');dot.style.setProperty('--nm-fit-swatch',v.swatch);dot.setAttribute('aria-hidden','true');b.append(dot);
      addOption(b,part,()=>v);colors.append(b);swatches.set(v,b);
    }
    area.append(legend,choices,colorRow);side.append(area);
    widgets[part]={update(){
      const cur=selection[part];for(const [b,id] of names)b.setAttribute('aria-pressed',String(id===cur.id));
      for(const [v,b] of swatches){b.hidden=v.id!==cur.id;b.setAttribute('aria-pressed',String(v===cur));}
      colorName.textContent=cur.color;
      link.href='producto-'+cur.id+'.html?color='+encodeURIComponent(cur.color);
      link.setAttribute('aria-label','Ver '+cur.name+', '+cur.color);
    }};widgets[part].update();
  }
  updateText();side.append(notice);block.append(stage,side);
  host.append(title,intro,block);document.body.append(dragGhost);host.dataset.mounted='yes';host.hidden=false;
})();
