/* Two independently registered photographic plates, not a sizing/fit predictor.
   New pieces: add an aligned transparent 640×1000 plate and list its exact catalog color here. */
(() => {
  'use strict';
  const host = document.querySelector('[data-nm-probador]');
  if (!host || host.dataset.mounted === 'yes') return;
  const catalog = new Map((window.NM_DRAFT || []).map(p => [p.id, p]));
  const garments = {
    top: [
      ['nm-camisa-rustic', [['Safari', 'rustic-safari', '#bda791'], ['Azul Claro', 'rustic-azul', '#9fc1d5']]],
      ['nm-camisa-swell', [['OFF', 'swell-off', '#eae5d8'], ['Preto', 'swell-preto', '#282629']]]
    ],
    bottom: [
      ['nm-short-linho-ultra-premium', [['Natural', 'short-natural', '#dacebc']]],
      ['nm-calca-de-linho-com-elastano', [['Preto', 'calca-preto', '#252527'], ['Branco', 'calca-branco', '#f6f4ef']]]
    ]
  };
  const parts = ['top', 'bottom'];
  const lists = {};
  for (const part of parts) {
    lists[part] = garments[part].flatMap(([id, variants]) => {
      const p = catalog.get(id); if (!p) return [];
      return variants.filter(([c]) => p.colors.some(color => color.name === c))
        .map(([color, key, swatch]) => ({id, name:p.name, color, key, swatch, src:'assets/probador/'+key+'.webp'}));
    });
    if (!lists[part].length) return;
  }
  const memoryKey = 'nm-probador-v1';
  let saved = {};
  try { saved = JSON.parse(sessionStorage.getItem(memoryKey) || '{}') || {}; } catch {}
  const selection = Object.fromEntries(parts.map(p => [p, lists[p].find(v => v.key === saved[p]) || lists[p][0]]));
  const make = (tag, cl, txt) => { const e = document.createElement(tag); if (cl) e.className = cl; if (txt != null) e.textContent = txt; return e; };
  const block = make('div','nmFitting__layout');
  const title = make('h2','nmFitting__title','Probador');
  title.id='nmFittingTitle'; host.setAttribute('aria-labelledby',title.id);
  const stage = make('div','nmFitting__stage');
  const photo = make('div','nmFitting__photo');
  photo.setAttribute('role','img');
  const layers = {};
  for (const p of ['bottom','top']) {
    const im=make('img','nmFitting__plate nmFitting__plate--'+p);
    im.alt=''; im.width=640; im.height=1000; im.loading='lazy'; im.decoding='async';
    im.src=selection[p].src; im.setAttribute('draggable','false');
    im.addEventListener('error', () => { if(!im.naturalWidth) notice.textContent='No se pudo cargar la vista de esta prenda.'; });
    layers[p]=im; photo.append(im);
  }
  stage.append(photo);
  const side = make('div','nmFitting__controls');
  const widgets={}, tokens={top:0,bottom:0}, tmp={};
  const notice=make('p','nmFitting__notice'); notice.setAttribute('role','status'); notice.setAttribute('aria-live','polite');notice.setAttribute('aria-atomic','true');
  function updateText(){
    const {top:t,bottom:b}=selection;
    photo.setAttribute('aria-label','Maniquí con '+t.name+', '+t.color+', y '+b.name+', '+b.color+'.');
  }
  // Only swap a visible plate once the next has decoded; ignore stale fast taps.
  function select(p, v) {
    if(!v) return;
    const token=++tokens[p];
    if(v===selection[p]) {tmp[p]=null;return;}
    const pic=new Image(); tmp[p]=pic;
    const ready=() => {
      if(tokens[p]!==token||tmp[p]!==pic) return;
      tmp[p]=null; selection[p]=v; layers[p].src=v.src;
      widgets[p].update(); updateText(); notice.textContent='';
      try{sessionStorage.setItem(memoryKey,JSON.stringify({top:selection.top.key,bottom:selection.bottom.key}));}catch{}
    };
    pic.onload=()=>{if(pic.decode)pic.decode().then(ready,ready); else ready();};
    pic.onerror=()=>{if(tokens[p]===token) {tmp[p]=null;notice.textContent='No se pudo cargar esa variante. Probá de nuevo.';}};
    pic.src=v.src;
  }
  for (const part of parts) {
    const area=make('fieldset','nmFitting__part');
    const legend=make('legend','nmFitting__legend',part==='top'?'Camisa':'Pantalón o short');
    const choices=make('div','nmFitting__choices'); const names=[];
    const colorRow=make('div','nmFitting__colorRow'); const colors=make('div','nmFitting__colors'); colors.setAttribute('role','group');colors.setAttribute('aria-label','Color de '+legend.textContent);
    const colorName=make('span','nmFitting__colorName');
    const link=make('a','nmFitting__link','Ver prenda'); const linkArrow=make('span',null,'↗');linkArrow.setAttribute('aria-hidden','true');link.append(linkArrow);
    colorRow.append(colors,colorName,link);
    for (const id of [...new Set(lists[part].map(v=>v.id))]) {
      const variants=lists[part].filter(v=>v.id===id),first=variants[0];
      const b=make('button','nmFitting__choice',first.name); b.type='button';
      b.dataset.fitProduct=id;
      b.addEventListener('click',()=>select(part,selection[part].id===id?selection[part]:variants.find(v=>v.color===selection[part].color)||first));
      names.push([b,id]);choices.append(b);
    }
    const swatches = new Map();
    for(const v of lists[part]){
      const b=make('button','nmFitting__swatch'); b.type='button';
      b.dataset.fitColor=v.key;b.title=v.color;b.setAttribute('aria-label',v.color);
      const dot=make('span');dot.style.setProperty('--nm-fit-swatch',v.swatch);dot.setAttribute('aria-hidden','true');b.append(dot);
      b.addEventListener('click',()=>select(part,v));colors.append(b);swatches.set(v,b);
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
  host.append(title,block);host.dataset.mounted='yes';host.hidden=false;
})();
