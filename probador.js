/* Photo plates share a 960×1500 coordinate space. Calibrate to the same neckline,
   hip and floor, not their independent bounding boxes. A length correction affects
   only the torso, and each bottom family keeps its own silhouette. */
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
      ['nm-calca-de-linho-com-elastano', [['Preto', 'calca-preto', '#252527'], ['Branco', 'calca-branco', '#f6f4ef'], ['Bege', 'calca-bege', '#cabba4']]],
      ['nm-short-linho-ultra-premium', [['Natural', 'short-natural', '#dacebc']]],
      ['nm-bermuda-champy', [['Branco', 'champy-branco', '#f6f4ee']]]
    ]
  };
  const parts = ['top', 'bottom'];
  const openingPair={top:'rustic-safari',bottom:'short-natural'};
  const compactNames={'nm-calca-de-linho-com-elastano':'Pantalón de lino','nm-short-linho-ultra-premium':'Short de lino'};
  const plateFile=key=>key.startsWith('calca-')?key+'-lino-cordon':key.startsWith('rustic-')?key+'-trama':key;
  const lists = {};
  for (const p of parts) {
    lists[p] = garments[p].flatMap(([id, variants]) => {
      const item = catalog.get(id); if (!item) return [];
      const colors=new Map(item.colors.map(c=>[c.name,c]));
      return variants.filter(([name]) => colors.has(name))
        .map(([color,key,swatch])=>({id,name:item.name,label:item.shortName||compactNames[id]||item.name,color,key,swatch,
          front:colors.get(color).photos?.front||null,texture:colors.get(color).photos?.texture||null,src:'assets/probador/'+plateFile(key)+'.webp'}));
    });
    if (!lists[p].length) return;
  }
  const memoryKey = 'nm-probador-v1';
  let saved = {};
  try { saved = JSON.parse(sessionStorage.getItem(memoryKey) || '{}') || {}; } catch {}
  const selection = Object.fromEntries(parts.map(p => [p, lists[p].find(v => v.key === saved[p]) || lists[p].find(v=>v.key===openingPair[p]) || lists[p][0]]));
  const normalSelection={...selection}, pending={top:false,bottom:false};
  const seedKey=window.location?new URLSearchParams(window.location.search).get('vestuario'):null;
  const firstSeed=seedKey?window.NM_VESTUARIO?.resolve(seedKey):null;
  const seedPlate=firstSeed&&lists[firstSeed.part]?.find(v=>v.id===firstSeed.id&&v.color===firstSeed.color);
  let seed=seedPlate?firstSeed:null;
  const otherPart=()=>seed?.part==='top'?'bottom':'top';
  if(seed){
    selection[seed.part]=seedPlate;
    selection[otherPart()]=lists[otherPart()].find(v=>v.key===openingPair[otherPart()])||lists[otherPart()][0];
  }
  function removeSeedQuery(){
    try {
      const u=new URL(window.location.href);if(!u.searchParams.has('vestuario'))return;
      u.searchParams.delete('vestuario');window.history.replaceState(window.history.state,'',u);
    } catch {}
  }
  if(seedKey!==null&&!seed)removeSeedQuery();
  const make = (tag, cl, txt) => { const e = document.createElement(tag); if (cl) e.className = cl; if (txt != null) e.textContent = txt; return e; };
  const block=make('div','nmFitting__layout'), title=make('h2','nmFitting__title','Probador');
  const intro=make('p','nmFitting__intro','Arrastrá una prenda al maniquí o tocala para probártela.');
  title.id='nmFittingTitle'; intro.id='nmFittingInstructions';
  host.setAttribute('aria-labelledby',title.id);
  host.setAttribute('aria-describedby',intro.id);
  const stage=make('div','nmFitting__stage'), photo=make('div','nmFitting__photo');
  const center=make('div','nmFitting__center');
  const pairButton=make('button','buy nmFitting__pair','Agregar las dos prendas');
  pairButton.type='button';pairButton.setAttribute('aria-haspopup','dialog');pairButton.hidden=true;
  center.append(stage,pairButton);
  const pairLook=()=>({name:'Tu look',label:'NACHO MILANO',items:parts.map(p=>({id:selection[p].id,color:selection[p].color}))});
  function paintPair(){
    const api=window.NM_LOOK_CART;
    pairButton.hidden=Boolean(seed)||typeof api?.open!=='function'||!api.can?.(pairLook());
    pairButton.disabled=pending.top||pending.bottom;
  }
  const guide=make('p','nmFitting__guide'); guide.setAttribute('aria-hidden','true');
  const visual=make('div','nmFitting__render');visual.setAttribute('role','img');
  const side=make('div','nmFitting__controls'), notice=make('p','nmFitting__notice');
  notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');notice.setAttribute('aria-atomic','true');
  const baseCard=make('div','nmFitting__base'),baseTag=make('span','nmFitting__baseTag','Ya está en tu carrito');
  const baseName=make('strong','nmFitting__baseName'),baseVariant=make('span','nmFitting__baseVariant');
  const basePhoto=make('img','nmFitting__basePhoto');basePhoto.alt='';basePhoto.decoding='async';
  baseCard.append(baseTag,basePhoto,baseName,baseVariant);
  const action=make('div','nmFitting__wardrobeActions'),candidate=make('p','nmFitting__candidate');
  const add=make('button','buy nmFitting__add','Sumar esta prenda al carrito');
  const reset=make('button','textLink nmFitting__reset','Probar sin prenda base');
  add.type='button';reset.type='button';action.append(candidate,add,reset);
  const layers={}, previews={}, zones={}, widgets={}, tokens={top:0,bottom:0}, cache=new Map();
  const plateHD=new Set(["calca-bege", "calca-branco", "calca-preto", "champy-branco", "rustic-areia", "rustic-azul", "rustic-branco", "rustic-safari", "short-natural", "swell-mascavo", "swell-off", "swell-preto", "swell-verde"]);
  const highPlate=v=>'assets/probador-hd/'+plateFile(v.key)+'.webp';
  const nativePlates=new Set(['swell-off','swell-preto','rustic-safari','rustic-azul','rustic-areia','rustic-branco','calca-preto','calca-branco','short-natural']);
  const nativePlate=v=>'assets/probador-native/'+plateFile(v.key)+'.webp';
  // Tighten only the portion of the trouser waistband covered by the shirt.
  // The thighs, hems, fabric and seams below this transition stay intact.
  const pantWaist=[[.35,0],[.65,0],[.65,.414],[.683,.454],[1,.483],[1,1],[0,1],[0,.483],[.317,.454],[.35,.414]];
  const calibration={
    rustic:[.94,.906,.5,.03],swell:[.943,.918,.5,.03],
    calca:[1.14,1,.5,.97],short:[1.087,1,.5,.97],champy:[1.09,1,.5,.97]
  };
  function fitFor(v){return calibration[v.key.split('-')[0]]||[1,1,.5,.5];}
  const boundVariants=new WeakMap();
  function platePaths(v){
    const rendered=(photo.clientWidth||Math.min(innerWidth*.6176,412))*(window.devicePixelRatio||1)*fitFor(v)[0];
    const urls=[v.src];
    if(rendered>610&&plateHD.has(v.key))urls.unshift(highPlate(v));
    if(rendered>920&&nativePlates.has(v.key))urls.unshift(nativePlate(v));
    return urls;
  }
  function setPlate(img,v){
    const [x,y,a,b]=fitFor(v);
    if(img.classList.contains('nmFitting__plate')){
      img.style.setProperty('--plate-origin',(a*100)+'% '+(b*100)+'%');
      img.style.setProperty('--plate-scale',x+', '+y);
      img.style.clipPath=v.key.startsWith('calca-')
        ?'polygon('+pantWaist.map(([l,t])=>(l*100)+'% '+(t*100)+'%').join(',')+')':'';

    }
    boundVariants.set(img,v);
    const urls=platePaths(v);
    if(img.getAttribute('src')!==urls[0])img.src=urls[0];
  }
  function nextPlate(img,v){
    if(!v)return false;
    const urls=platePaths(v), i=urls.indexOf(img.getAttribute('src'));
    if(i!==-1&&i+1<urls.length){img.src=urls[i+1];return true;}
    return false;
  }
  function plate(p, preview){
    const im=make('img','nmFitting__plate nmFitting__plate--'+p+(preview?' nmFitting__preview':''));
    im.alt='';im.width=640;im.height=1000;im.decoding='async';im.setAttribute('draggable','false');
    if(preview)im.hidden=true;
    else im.loading='lazy';
    im.addEventListener('error',()=>{
      if(!nextPlate(im,boundVariants.get(im))&&!preview)notice.textContent='No se pudo cargar la vista de esta prenda.';
    });
    return im;
  }
  for (const p of ['bottom','top']) {
    layers[p]=plate(p,false);previews[p]=plate(p,true);visual.append(layers[p],previews[p]);
    const zone=make('div','nmFitting__zone nmFitting__zone--'+p);
    zone.dataset.fitZone=p;zone.setAttribute('aria-hidden','true');zones[p]=zone;
  }
  photo.append(visual,zones.top,zones.bottom);stage.append(photo,guide);
  // Pixel-faithful close-up of the selected combination, using both large masters
  // even when the inline scene has chosen a smaller source. No separate layout.
  const zoomButton=make('button','nmFitting__zoom');
  zoomButton.type='button';
  zoomButton.setAttribute('aria-label','Ampliar conjunto');
  zoomButton.setAttribute('aria-haspopup','dialog');
  const zoomIcon=document.createElementNS('http://www.w3.org/2000/svg','svg');
  zoomIcon.setAttribute('viewBox','0 0 24 24');zoomIcon.setAttribute('aria-hidden','true');
  const zoomPath=document.createElementNS('http://www.w3.org/2000/svg','path');
  zoomPath.setAttribute('d','M9 4H4v5m11-5h5v5m0 6v5h-5M4 15v5h5');
  zoomIcon.append(zoomPath);zoomButton.append(zoomIcon);stage.append(zoomButton);
  const resizePlates=()=>{
    for(const p of parts){
      setPlate(layers[p],selection[p]);
      const shown=boundVariants.get(previews[p]);if(shown&&!previews[p].hidden)setPlate(previews[p],shown);
    }
  };
  if(window.ResizeObserver)new ResizeObserver(resizePlates).observe(photo);
  else window.addEventListener('resize',resizePlates,{passive:true});
  function fullPlate(v){
    return new Promise((resolve,reject)=>{
      const im=new Image(), sources=[v.src];
      if(plateHD.has(v.key))sources.unshift(highPlate(v));
      if(nativePlates.has(v.key))sources.unshift(nativePlate(v));
      const load=()=>{if(sources.length)im.src=sources.shift();else reject(new Error('Plate not available'));};
      im.onload=()=>resolve(im);im.onerror=load;load();
    });
  }
  let zooming=false;
  zoomButton.addEventListener('click',async()=>{
    if(zooming||drag?.active||pending.top||pending.bottom||!document.querySelector('#zoom'))return;
    const pair=[selection.bottom,selection.top];
    zooming=true;zoomButton.setAttribute('aria-busy','true');
    try{
      const rasters=await Promise.all(pair.map(fullPlate));
      if(pair[0]!==selection.bottom||pair[1]!==selection.top||drag?.active)return;
      const canvas=document.createElement('canvas'), width=Math.max(...rasters.map(im=>im.naturalWidth));
      const height=Math.round(width*1500/960);
      canvas.width=width;canvas.height=height;
      const ctx=canvas.getContext('2d');if(!ctx)return;
      ctx.imageSmoothingQuality='high';
      const light=ctx.createRadialGradient(.473*width,.353*height,.073*width,.5*width,.497*height,.833*width);
      light.addColorStop(0,'#faf9f6');light.addColorStop(1,'#ebe8e1');
      ctx.fillStyle=light;ctx.fillRect(0,0,width,height);
      ctx.save();ctx.translate(width/2,height*.965);ctx.scale(.157*width,.018*height);
      const floor=ctx.createRadialGradient(0,0,0,0,0,1);
      floor.addColorStop(0,'#34302c45');floor.addColorStop(1,'#34302c00');
      ctx.fillStyle=floor;ctx.fillRect(-1,-1,2,2);ctx.restore();
      for(let i=0;i<rasters.length;i++){
        const [sx,sy,ax,ay]=fitFor(pair[i]);
        if(i===1){ctx.shadowColor='rgba(44,37,30,.24)';ctx.shadowOffsetY=height*.0033;ctx.shadowBlur=height*.006;}
        ctx.save();
        if(pair[i].key.startsWith('calca-')){
          ctx.beginPath();
          pantWaist.forEach(([x,y],j)=>ctx[j?'lineTo':'moveTo'](width*(ax+(x-ax)*sx),height*(ay+(y-ay)*sy)));
          ctx.closePath();ctx.clip();
        }
        ctx.drawImage(rasters[i],width*ax*(1-sx),height*ay*(1-sy),width*sx,height*sy);
        ctx.restore();
      }
      const blob=await new Promise(done=>canvas.toBlob(done,'image/png'));
      if(!blob||!zoomButton.isConnected||pair[0]!==selection.bottom||pair[1]!==selection.top||drag?.active)return;
      const dialog=document.querySelector('#zoom');
      if(!dialog||dialog.open)return;
      const imageURL=URL.createObjectURL(blob);
      const alt=visual.getAttribute('aria-label'), pt=document.documentElement.lang.toLowerCase().startsWith('pt');
      const views=[{name:pt?'Combinação':'Conjunto',src:imageURL,alt}];
      for(const [i,v] of [pair[1],pair[0]].entries())if(v.texture)views.push({
        name:i===0?(pt?'Tecido da camisa':'Tela de la camisa'):(pt?'Tecido da parte de baixo':'Tela de abajo'),
        src:v.texture,alt:v.name+' · '+v.color
      });
      zoomButton.focus({preventScroll:true});
      document.dispatchEvent(new CustomEvent('nm:zoom-photo',{detail:{
        src:imageURL,alt,opener:zoomButton,options:{views}
      }}));
      if(dialog.open)dialog.addEventListener('close',()=>URL.revokeObjectURL(imageURL),{once:true});
      else URL.revokeObjectURL(imageURL);
    }catch{
      notice.textContent='No se pudo cargar la vista de esta prenda.';
    }finally{
      zooming=false;zoomButton.removeAttribute('aria-busy');
    }
  });
  function updateText(){
    const {top:t,bottom:b}=selection;
    visual.setAttribute('aria-label','Maniquí con '+t.name+', '+t.color+', y '+b.name+', '+b.color+'.');
  }
  function paintVestuario(){
    baseCard.hidden=action.hidden=!seed;
    if(seed){
      host.dataset.fitWardrobe=seed.part;
      title.textContent='Vestuario';intro.textContent='Combiná tu prenda con otra y agregá solo la nueva.';
      const base=selection[seed.part], next=selection[otherPart()];
      if(baseCard.parentElement!==widgets[seed.part].rail)widgets[seed.part].rail.append(baseCard);
      basePhoto.hidden=!base.front;if(base.front)basePhoto.src=base.front;
      baseName.textContent=base.name;baseVariant.textContent=base.color+(seed.size?' · '+seed.size:'');
      candidate.textContent=next.name+' · '+next.color;
      add.disabled=pending[otherPart()];
      for(const p of parts)widgets[p].area.hidden=p===seed.part;
    }else{
      delete host.dataset.fitWardrobe;title.textContent='Probador';intro.textContent='Arrastrá una prenda al maniquí o tocala para probártela.';
      for(const p of parts)widgets[p].area.hidden=false;
    }
    paintPair();
  }
  function prefetch(v){
    const source=platePaths(v)[0];
    let slot=cache.get(source);if(slot)return slot;
    const im=new Image();slot={ready:false,promise:null};cache.set(source,slot);
    slot.promise=new Promise((resolve,reject)=>{
      const done=()=>{slot.ready=true;resolve();};
      im.onload=()=>{
        if(!im.decode){done();return;}
        // Some low-power/embedded webviews hold decode() until the next paint. The bytes are
        // already loaded; never leave a fitting or the cart CTA waiting indefinitely on paint.
        const fallback=setTimeout(done,240);
        const decoded=()=>{clearTimeout(fallback);done();};
        im.decode().then(decoded,decoded);
      };
      im.onerror=()=>{if(!nextPlate(im,v)){cache.delete(source);reject(new Error('Plate not available'));}};
      setPlate(im,v);
    });
    return slot;
  }
  // Only swap a visible plate once the next has decoded; ignore stale taps/drops.
  function select(p,v,byDrop=false){
    if(!v||p===seed?.part)return;
    const token=++tokens[p];
    const done=()=>{
      if(tokens[p]!==token)return;
      pending[p]=false;selection[p]=v;setPlate(layers[p],v);widgets[p].update();updateText();
      if(seed)paintVestuario();else paintPair();
      notice.textContent=byDrop?'Prenda colocada.':'';
      if(!seed)try{sessionStorage.setItem(memoryKey,JSON.stringify({top:selection.top.key,bottom:selection.bottom.key}));}catch{}
    };
    if(v===selection[p]){done();return;}
    const slot=prefetch(v);
    if(slot.ready)done();else{
      pending[p]=true;if(seed)paintVestuario();else paintPair();
      slot.promise.then(done,()=>{
        if(tokens[p]!==token)return;
        pending[p]=false;if(seed)paintVestuario();else paintPair();
        notice.textContent='No se pudo cargar esa variante. Probá de nuevo.';
      });
    }
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
      const layer=previews[d.part];setPlate(layer,d.v);layer.hidden=false;layers[d.part].hidden=true;
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
    dragGhost.dataset.fitGhost=d.part;ghostPhoto.src=d.v.src;dragGhost.hidden=false;resizePlates();
    position(d.x,d.y);stateAt(d);prefetch(d.v).promise.catch(()=>{});
    frame=requestAnimationFrame(autoScroll);
    if(d.kind==='pointer')try{d.button.setPointerCapture(d.id);}catch{}
  }
  function arm(button,kind,id,x,y,immediate){
    const option=options.get(button);
    if(!option||option.part===seed?.part||button.hidden||drag)return;
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
    if(e.pointerType==='touch'&&!e.target.closest('.nmFitting__grip')&&!b.className.includes('nmFitting__swatch'))return;
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
    const prime=()=>{if(part!==seed?.part)prefetch(get()).promise.catch(()=>{});};
    b.addEventListener('pointerenter',prime,{passive:true});b.addEventListener('focus',prime);
  }
  for(const part of parts){
    const rail=make('div','nmFitting__rail nmFitting__rail--'+part),area=make('fieldset','nmFitting__part');
    const legend=make('legend','nmFitting__legend',part==='top'?'Camisas':'Pantalones y shorts');
    const choices=make('div','nmFitting__choices'),cards=[],remember=new Map();
    const link=make('a','nmFitting__link','Ver prenda'),arrow=make('span',null,'↗');arrow.setAttribute('aria-hidden','true');link.append(arrow);
    const groups=new Map();
    for(const v of lists[part]){if(!groups.has(v.id))groups.set(v.id,[]);groups.get(v.id).push(v);}
    for(const [id,variants] of groups){
      const first=variants[0], card=make('div','nmFitting__card'),b=make('button','nmFitting__choice');
      const thumb=make('img','nmFitting__thumb'),grip=make('span','nmFitting__grip'),badge=make('span');
      const caption=make('span','nmFitting__caption'),name=make('span','nmFitting__choiceName',first.label),color=make('span','nmFitting__colorName');
      thumb.alt='';thumb.decoding='async';thumb.loading='lazy';thumb.setAttribute('draggable','false');
      badge.setAttribute('aria-hidden','true');grip.append(badge);grip.setAttribute('aria-hidden','true');
      caption.append(name,color);b.append(thumb,grip,caption);b.type='button';b.dataset.fitProduct=id;
      const get=()=>remember.get(id)||first;
      addOption(b,part,get);
      card.dataset.fitCard=id;card.append(b);
      const swatches=new Map();
      if(variants.length===1){b.dataset.fitColor=first.key;}
      else{
        card.dataset.fitMulti='';
        const colors=make('div','nmFitting__colors');colors.dataset.fitCount=String(variants.length);
        colors.setAttribute('role','group');colors.setAttribute('aria-label','Color de '+first.name);
        for(const v of variants){
          const dotButton=make('button','nmFitting__swatch');dotButton.type='button';dotButton.dataset.fitColor=v.key;
          dotButton.title=v.color;dotButton.setAttribute('aria-label',v.name+', '+v.color);
          const dot=make('span');dot.style.setProperty('--nm-fit-swatch',v.swatch);dot.setAttribute('aria-hidden','true');dotButton.append(dot);
          swatches.set(v,dotButton);colors.append(dotButton);addOption(dotButton,part,()=>v);
        }
        card.append(colors);
      }
      cards.push({id,card,b,thumb,color,get,swatches});choices.append(card);
    }
    area.append(legend,choices,link);rail.append(area);
    widgets[part]={area,rail,update(){
      const cur=selection[part];remember.set(cur.id,cur);
      for(const {id,card,b,thumb,color,get,swatches} of cards){
        const shown=get(),active=id===cur.id;
        card.dataset.fitActive=String(active);b.setAttribute('aria-pressed',String(active));b.setAttribute('aria-label',shown.name+', '+shown.color);
        // Reuse the *same* source nodes across interactions: do not break capture or keyboard focus.
        if(card.dataset.fitVariant!==shown.key){
          card.dataset.fitVariant=shown.key;color.textContent=shown.color;
          thumb.hidden=!shown.front;if(shown.front)thumb.src=shown.front;
        }
        for(const [v,button] of swatches){button.setAttribute('aria-pressed',String(v===cur));button.dataset.fitShown=String(v===shown);}
      }
      link.href='producto-'+cur.id+'.html?color='+encodeURIComponent(cur.color)+(seed?.part===part&&seed.size?'&talle='+encodeURIComponent(seed.size):'');
      link.setAttribute('aria-label','Ver '+cur.name+', '+cur.color);
    }};widgets[part].update();
  }
  pairButton.addEventListener('click',()=>{
    if(seed||pairButton.hidden||pending.top||pending.bottom||drag?.active||zooming)return;
    const api=window.NM_LOOK_CART,look=pairLook();
    if(api?.can?.(look))api.open(look,pairButton);
  });
  document.addEventListener('nm:look-cart-ready',paintPair);
  add.addEventListener('click',()=>{
    if(!seed||pending[otherPart()])return;
    const next=selection[otherPart()];
    if(!window.NM_VESTUARIO?.open(seed.key,next.id,next.color,add))notice.textContent='La prenda base ya no está en el carrito.';
  });
  reset.addEventListener('click',()=>{
    if(!seed)return;
    finish(false);seed=null;removeSeedQuery();notice.textContent='';
    for(const p of parts){
      ++tokens[p];pending[p]=false;
      selection[p]=normalSelection[p];setPlate(layers[p],selection[p]);widgets[p].update();
    }
    updateText();paintVestuario();title.focus({preventScroll:true});
  });
  updateText();paintVestuario();side.append(action,notice);block.append(widgets.top.rail,center,widgets.bottom.rail);
  title.tabIndex=-1;
  host.append(title,intro,block,side);document.body.append(dragGhost);host.dataset.mounted='yes';host.hidden=false;resizePlates();
  // Warm only this fitting when it comes into view. Never compete with the homepage hero.
  if('IntersectionObserver' in window){
    const lookAhead=new IntersectionObserver(entries=>{
      if(!entries.some(e=>e.isIntersecting))return;
      lookAhead.disconnect();
      if(window.navigator?.connection?.saveData||window.navigator?.connection?.effectiveType?.includes('2g'))return;
      const queue=parts.flatMap(p=>lists[p]),warm=async()=>{
        for(const v of queue){try{await prefetch(v).promise;}catch{}}
      };
      if(window.requestIdleCallback)window.requestIdleCallback(warm,{timeout:900});else setTimeout(warm,100);
    },{rootMargin:'180px 0px'});
    lookAhead.observe(host);
  }
  if(seed&&window.location?.hash==='#probador')requestAnimationFrame(()=>{
    host.scrollIntoView({block:'start',behavior:'instant'});title.focus({preventScroll:true});
  });
  if(seedKey&&!seed)notice.textContent='La prenda elegida no está disponible en el vestuario.';
})();
