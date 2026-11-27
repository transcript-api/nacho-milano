'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const el=(tag,txt,cl)=>{const x=document.createElement(tag);if(txt!==undefined)x.textContent=txt;if(cl)x.className=cl;return x};
const btn=(txt,fn,cl='control')=>{const x=el('button',txt,cl);x.type='button';x.addEventListener('click',fn);return x};
const image=(url,alt='',lazy=true)=>{const x=el('img');x.src=url;x.alt=alt;x.decoding='async';if(lazy)x.loading='lazy';return x};
const link=(txt,href,cl)=>{const x=el('a',txt,cl);x.href=href;return x};
const {products,looks:rawLooks}=window.NM_BUILD;
const draftProducts=window.NM_DRAFT||[];
const shopProducts=draftProducts;
const byId=new Map(shopProducts.map(p=>[p.id,p])), looks=rawLooks.filter(l=>Array.isArray(l?.items)&&l.items.every(i=>byId.get(i?.id)?.colors.some(c=>c.name===i.color)));
const src=(id,view='frente')=>'assets/'+id+'-'+view+'.webp', url=(p,c=0)=>'producto-'+p.id+'.html'+(c?'?color='+encodeURIComponent(p.colors[c].name??p.colors[c][1]):'');
const displayColor=c=>c.name??c[0];
const lookColor=(p,i)=>Math.max(0,p.colors.findIndex(c=>displayColor(c)===i?.color));
const draftPhoto=(c,view='front')=>c?.photos?.[view]||null;
const draftPlaceholder=()=>el('div','Fotos pendientes','draftBlank');
const num=(n)=>String(n).padStart(2,'0'), clamp=(x,a,z)=>Math.max(a,Math.min(x,z)), period=(x,n)=>((x%n)+n)%n;
const quiet=matchMedia('(prefers-reduced-motion: reduce)'), touch=matchMedia('(max-width:650px)');
const money=new Intl.NumberFormat('es-UY',{style:'currency',currency:'UYU',minimumFractionDigits:0,maximumFractionDigits:0});
// Storefront-only samples: never populate p.price, totals, order or checkout.
const demoDigits=new Intl.NumberFormat('es-UY',{maximumFractionDigits:0});
function demoPrice(p){
 const demo=p?.demoPricing;
 if(!p?.draft||demo?.currency!=='UYU'||!Number.isSafeInteger(demo.amount)||demo.amount<=0)return null;
 const out=el('div',undefined,'demoPrice');out.dataset.priceMode='demo';
 const current=el('p',undefined,'demoPrice__current');
 current.append(el('strong','$ '+demoDigits.format(demo.amount)),el('span','UYU','demoPrice__currency'));
 const note=el('p','Precio de muestra','demoPrice__note');
 const offers=el('div',undefined,'demoPrice__offers');
 const previous=el('del',undefined,'demoPrice__previous'),badge=el('span',undefined,'demoPrice__discount');
 const prior=demo.promo?.compareAt;
 const validDemoPromo=demo.promo?.enabled===true&&Number.isSafeInteger(prior)&&prior>demo.amount;
 offers.hidden=!validDemoPromo;
 if(validDemoPromo){
  previous.textContent='$ '+demoDigits.format(prior)+' UYU';
  const percent=Math.floor((prior-demo.amount)/prior*100);
  badge.textContent=percent>0?'−'+percent+'%':'Promo de muestra';
 }
 offers.append(previous,badge);out.append(current,note,offers);
 return out;
}
const variantKey=(p,c,s)=>JSON.stringify([p.id,p.colors[c][1],s]);
const draftSizes=(p,c)=>p.colors[c]?.sizes||[];
const draftKey=(p,c,s=null)=>JSON.stringify([p.id,p.colors[c].name,s]);
const draftVariant=(p,c,s)=>draftSizes(p,c).includes(s);
const valid=new Map(), choices=new Map(), draftSizeChoices=new Map();
for(const p of draftProducts)p.colors.forEach((c,i)=>{
 // Keep old carts intact. A null size is preserved as unknown, never relabeled.
 valid.set(draftKey(p,i),{p,c,i,s:null});
 for(const s of draftSizes(p,i))valid.set(draftKey(p,i,s),{p,c,i,s});
});
try{
 const stored=JSON.parse(sessionStorage.getItem('nm-size-choice-v1')||'[]');
 for(const [id,color,size] of stored){
  const p=byId.get(id), i=p?.colors.findIndex(c=>c.name===color)??-1;
  if(i>=0&&draftVariant(p,i,size))draftSizeChoices.set(draftKey(p,i),size);
 }
}catch{}
const preferredDraftSize=(p,c)=>draftSizeChoices.get(draftKey(p,c))||null;
function rememberDraftSize(p,c,s){
 if(!draftVariant(p,c,s))return;
 draftSizeChoices.set(draftKey(p,c),s);
 try{sessionStorage.setItem('nm-size-choice-v1',JSON.stringify([...draftSizeChoices].map(([key,size])=>[...JSON.parse(key).slice(0,2),size])))}catch{}
}
let saved=new Set();
try{saved=new Set(JSON.parse(localStorage.getItem('nm-saved-v3')||'[]').filter(id=>byId.has(id)));localStorage.setItem('nm-saved-v3',JSON.stringify([...saved]))}catch{}
try{for(const [id,colorKey] of JSON.parse(sessionStorage.getItem('nm-color-choice-v1')||'[]')){const p=byId.get(id), index=p?.colors.findIndex(c=>c.name===colorKey)??-1;if(index>=0)choices.set(id,{color:index,size:null,view:0})}}catch{}
const saveChoice=(p,s)=>{choices.set(p.id,{...s});try{sessionStorage.setItem('nm-color-choice-v1',JSON.stringify([...choices].map(([id,q])=>[id,byId.get(id)?.colors[q.color]?.name]).filter(([,color])=>color)))}catch{}};
function toggleSaved(p){saved.has(p.id)?saved.delete(p.id):saved.add(p.id);try{localStorage.setItem('nm-saved-v3',JSON.stringify([...saved]))}catch{};refreshSaved()}
function cardGlyph(kind){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');
 const paths=kind==='star'?['m12 2.75 2.78 5.65 6.22.9-4.5 4.38 1.07 6.19L12 16.95l-5.57 2.92 1.07-6.19L3 9.3l6.22-.9Z']:['M13 20.5H6a2.5 2.5 0 0 1-2.5-2.5V9.1h15.4v3.1','M7.2 9.1V6.6a3.3 3.3 0 0 1 6.6 0v2.5','M18.9 14.7v6.2M15.8 17.8h6.2'];
 for(const d of paths){const p=document.createElementNS(ns,'path');p.setAttribute('d',d);svg.append(p)}return svg;
}
function refreshSaved(){const n=$('#savedCount');if(n)n.textContent=saved.size;$$('[data-save]').forEach(x=>{const has=saved.has(x.dataset.save);x.setAttribute('aria-pressed',String(has));if(!x.classList.contains('cardSave'))x.textContent=x.classList.contains('productSave')&&!x.closest('.manlyProduct')?(has?'Guardado en favoritos':'Guardar en favoritos'):(has?'♥':'♡');x.setAttribute('aria-label',(has?'Quitar de guardados: ':'Guardar ')+byId.get(x.dataset.save).name)})}
const cartStorageKey='nm-preview-v3';
function readCartSnapshot(){
 try{
  const data=JSON.parse(localStorage.getItem(cartStorageKey)||'[]');if(!Array.isArray(data))return null;
  const next=new Map();
  for(const pair of data){
   if(!Array.isArray(pair)||pair.length!==2)continue;
   const [id,q]=pair;if(valid.has(id)&&Number.isInteger(q)&&q>0)next.set(id,clamp(q,1,9));
  }
  return next;
 }catch{return null}
}
let cart=readCartSnapshot()||new Map(), toastTimer, muteClick=0, lastDialogTrigger, dialogBack=null;
const drawer=$('#drawer'), body=$('#drawerBody');
const fitSide=p=>p.category==='Camisas'?'top':['Shorts','Pantalones'].includes(p.category)?'bottom':null;
function vestuarioLine(key,snapshot=readCartSnapshot()||cart){
 if(typeof key!=='string'||key.length>250||!snapshot.has(key))return null;
 const line=valid.get(key),part=line&&fitSide(line.p);
 return part?{key,part,id:line.p.id,color:line.c.name,size:line.s}:null;
}
window.NM_VESTUARIO=Object.freeze({
 resolve:key=>vestuarioLine(key),
 open(seedKey,newId,newColor,origin){
  const seed=vestuarioLine(seedKey),p=byId.get(newId),part=p&&fitSide(p);
  if(!seed||!part||seed.part===part)return false;
  const index=p.colors.findIndex(c=>c.name===newColor);if(index<0)return false;
  quickDraft(p,index,origin,{fixedColor:true,beforeAdd(state){
   const current=readCartSnapshot();
   if(!current||!vestuarioLine(seedKey,current))return 'La prenda base ya no está en el carrito.';
   const sizes=draftSizes(p,index);
   if((!sizes.length||draftVariant(p,index,state.size))&&current.has(draftKey(p,index,sizes.length?state.size:null)))return 'Esa variante ya está en tu carrito.';
   // Adopt the current bag, then add exactly one counterpart through the normal tally.
   cart=current;return '';
  }});
  return true;
 }
});
function announce(t){$('#toast').textContent=t;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').textContent='',2700)}
function refresh(persist=true){if(persist)try{localStorage.setItem(cartStorageKey,JSON.stringify([...cart]))}catch{}const count=$('#bagCount'),qty=[...cart.values()].reduce((a,b)=>a+b,0);count.textContent=qty;count.hidden=!qty;count.parentElement.setAttribute('aria-label',qty?'Carrito, '+qty+(qty===1?' prenda':' prendas'):'Carrito, vacío');const added=new Set([...cart.keys()].map(id=>valid.get(id).p.id));$$('[data-mark]').forEach(x=>x.textContent=added.has(x.dataset.mark)?'✓':'+')}
function change(k,d){if(!valid.has(k))return 0;const old=cart.get(k)||0,n=clamp(old+d,0,9);n?cart.set(k,n):cart.delete(k);refresh();return n-old}
function readChoice(p,startColor=null){const s={...(choices.get(p.id)||{color:0,size:null,view:0})};if(startColor!==null&&p.colors[startColor])s.color=startColor;return s}
function fly(from,p,c){const to=$('[data-bag]');if(!from||!to||quiet.matches||!Element.prototype.animate)return;const a=from.getBoundingClientRect(),z=to.getBoundingClientRect(),im=image(src(p.colors[c][1],'rack'),'',false);im.style.cssText='position:fixed;z-index:60;pointer-events:none;object-fit:contain;width:65px;height:74px;left:0;top:0';document.body.append(im);const s=[a.left+a.width/2-32,a.top+a.height/2-37],e=[z.left+z.width/2-32,z.top+z.height/2-37];const anim=im.animate([{transform:'translate('+s[0]+'px,'+s[1]+'px) scale(1)',opacity:.95},{transform:'translate('+e[0]+'px,'+e[1]+'px) scale(.22)',opacity:.1}],{duration:520,easing:'cubic-bezier(.32,.04,.2,1)'});anim.finished.then(()=>im.remove(),()=>im.remove())}
function order(p,s,from,qty=1){if(!s.size)return '';const k=variantKey(p,s.color,s.size);if((cart.get(k)||0)+qty>9)return 'El máximo es de 9 unidades por color y talle.';const added=change(k,qty);if(added){fly(from,p,s.color);announce(p.name+' · '+s.size+' en la bolsa')}return added===1?'Agregado a tu bolsa.':'Agregaste '+added+' unidades a tu bolsa.'}
function openDrawer(title,tag){delete drawer.dataset.cart;$('#drawerTitle').textContent=title;$('#drawerTag').textContent=tag;body.replaceChildren();if(!drawer.open){lastDialogTrigger=document.activeElement;drawer.showModal();document.documentElement.classList.add('dialogOpen')}drawer.scrollTop=0}
drawer.addEventListener('close',()=>{document.documentElement.classList.remove('dialogOpen');lastDialogTrigger?.focus({preventScroll:true});dialogBack=null});
$$('[data-bag]').forEach(x=>x.onclick=()=>showBag());
function showBag(focus=null,full=false){
 const target=full?$('#fullBag'):body;
 if(full){if(!target)return;target.replaceChildren()}else{openDrawer(document.body.classList.contains('refShop')?'Tu carrito':'Tu bolsa','NACHO MILANO');drawer.dataset.cart='true'}
 target.append(el('p','Todavía no hay compra en línea.','quiet'));
 const actions=el('div',undefined,'bagActions');actions.append(link('Seguir comprando','coleccion.html','textLink'));
 if(!full&&cart.size)actions.prepend(link(document.body.classList.contains('refShop')?'Ver carrito':'Ver bolsa','bolsa.html','buy'));
 if(!cart.size){target.append(el('p','La bolsa está vacía.'),actions);if(focus)actions.querySelector('a').focus();return}
 const frag=document.createDocumentFragment();let total=0;
 for(const [k,q] of cart){const {p,c,i,s}=valid.get(k);if(p.price!=null)total+=p.price*q;
 const row=el('div',undefined,'lineItem'),copy=el('div');const photo=p.draft?draftPhoto(c):src(c[1],'rack');row.append(photo?image(photo,''):draftPlaceholder(),copy);copy.append(el('strong',p.name),el('p',(p.draft?c.name+(s?' · '+s:draftSizes(p,i).length?' · Talle por confirmar':''):c[0]+' · '+s)+' · '+q+(p.price!=null?' · '+money.format(p.price*q):'')));for(const [name,label,d] of [['−','Reducir',-1],['+','Aumentar',1],['Quitar','Quitar',-q]]){const x=btn(name,()=>{change(k,d);showBag([k,label],full)});x.dataset.k=k;x.dataset.op=label;x.setAttribute('aria-label',label+' '+p.name+(s?' '+s:''));x.disabled=q>=9&&d>0;copy.append(x)}frag.append(row)}
 target.append(frag);if(total)target.append(el('p','Subtotal: '+money.format(total),'statusText'));target.append(actions);
 const fitting=[...cart.keys()].map(k=>vestuarioLine(k,cart)).filter(Boolean);
 if(fitting.length){
  const entry=el('section',undefined,'bagVestuario'),title=el('h3','Vestuario'),items=el('ul',undefined,'bagVestuario__lines');
  title.id=full?'fullBagVestuario':'drawerBagVestuario';entry.setAttribute('aria-labelledby',title.id);
  entry.append(title,el('p',fitting.length===1?'Probá cómo combinar esta prenda.':'Elegí con qué prenda querés armar el look.','bagVestuario__hint'));
  for(const line of fitting){
   const {key,id,color,size}=line,p=byId.get(id),rec=el('li'),a=link('', 'index.html?'+new URLSearchParams({vestuario:key})+'#probador','bagVestuario__link');
   const label=el('span',undefined,'bagVestuario__variant');
   label.append(el('strong',p.name),el('small',color+(size?' · '+size:draftSizes(p,p.colors.findIndex(c=>c.name===color)).length?' · Talle por confirmar':'')));
   const arrow=el('span','↗');arrow.setAttribute('aria-hidden','true');a.append(label,arrow);
   rec.append(a);items.append(rec);
  }
  entry.append(items);target.append(entry);
 }
 if(focus)([...target.querySelectorAll('[data-k]')].find(x=>x.dataset.k===focus[0]&&x.dataset.op===focus[1]&&!x.disabled)||actions.querySelector('a')).focus();refresh(false)
}
function selector(title,options,active,pick,swatch=false){const field=el('fieldset');field.append(el('legend',title));const list=options.map(([t,hex],i)=>{const x=btn(t,()=>pick(i));if(swatch){x.classList.add('swatch');x.style.setProperty('--swatch',hex)}field.append(x);return x});const update=()=>list.forEach((x,i)=>x.setAttribute('aria-pressed',String(i===active())));update();return {field,update}}
function formFor(p,state,changeColor=()=>{},compact=false,onAdd=null,full=false){let qty=1;const box=el('div',undefined,'buyForm'),cs=selector('Color',p.colors.map(c=>[c[0],c[2]]),()=>state.color,i=>{state.color=i;saveChoice(p,state);status.textContent='';update();changeColor(i)},true),ss=selector('Talle',p.sizes.map(s=>[s]),()=>p.sizes.indexOf(state.size),i=>{state.size=p.sizes[i];saveChoice(p,state);status.textContent='';update()});
 const add=btn(full?'Agregar al carrito':compact?'Agregar':'Agregar a la bolsa',()=>{const before=cart.get(variantKey(p,state.color,state.size))||0;status.textContent=order(p,state,add,qty);if((cart.get(variantKey(p,state.color,state.size))||0)>before)onAdd?.()},'buy');const status=el('p','','statusText');status.setAttribute('role','status');
 const update=()=>{cs.update();ss.update();add.disabled=!state.size;add.title=state.size?'':'Elegí un talle antes de agregar'};box.append(cs.field,ss.field);
 if(full){
  const activeColor=el('output',p.colors[state.color][0],'activeColor');activeColor.setAttribute('aria-label','Color seleccionado');cs.field.querySelector('legend').append(' · ',activeColor);
  cs.field.addEventListener('click',()=>activeColor.value=p.colors[state.color][0]);
  const q=el('div',undefined,'quantityControl'),value=el('output','1');value.setAttribute('aria-label','Cantidad elegida');
  const adjust=d=>{qty=clamp(qty+d,1,9);value.value=qty;minus.disabled=qty<=1;plus.disabled=qty>=9;status.textContent=''},minus=btn('−',()=>adjust(-1),''),plus=btn('+',()=>adjust(1),'');
  minus.setAttribute('aria-label','Reducir cantidad');plus.setAttribute('aria-label','Aumentar cantidad');minus.disabled=true;q.append(el('span','Cantidad'),minus,value,plus);box.append(q);
  const row=el('div',undefined,'purchaseRow');row.append(add);const save=$('#productSave');if(save)row.append(save);box.append(row,status)
 }else box.append(add,status);
 update();return box
}
function quickDrawer(p,back,onAdd=null){const state=readChoice(p),img=image(src(p.colors[state.color][1]),p.name,false);img.className='drawerPhoto';openDrawer(p.name,'ELEGÍ EL TALLE');dialogBack=back;const form=formFor(p,state,()=>{img.src=src(p.colors[state.color][1]);detail.href=url(p,state.color)},false,onAdd);if(onAdd)form.querySelector('.buy').textContent='Agregar al carrito';body.append(img,form,el('p','Producto de muestra. No está a la venta.','quiet'));const detail=link('Ver ficha →',url(p,state.color),'textLink');body.append(detail);if(back)body.append(btn('Volver a la bolsa',()=>dialogBack?.(),'control'))}
const draftChips=Object.freeze({'OFF':'#eae4d7','Preto':'#252522','Mascavo':'#855945','Verde':'#757e69','Safari':'#c6a987','Azul Claro':'#afc6d6','Areia':'#d7c5a8','Branco':'#fff','Natural':'#ded1b9','Bege':'#bca88d'});
function draftColorDots(p,current,choose){
 const field=el('div',undefined,'draftColorDots');
 field.setAttribute('role','group');field.setAttribute('aria-label','Color');
 const options=p.colors.map((c,i)=>{
  const x=btn('',()=>choose(i),'draftColorDot');
  x.style.setProperty('--dot',draftChips[c.name]||'#d3d0c9');
  x.setAttribute('aria-label',c.name);field.append(x);return x;
 });
 const update=()=>options.forEach((x,i)=>x.setAttribute('aria-pressed',String(i===current())));
 update();return {field,update};
}
function draftSizeUI(p,state,host,onSelect){
 const options=draftSizes(p,state.color);
 if(!options.length){host.replaceChildren(el('p','Talle por confirmar','draftSizePending'));return}
 const group=selector('Talle',options.map(t=>[t]),()=>options.indexOf(state.size),i=>{
  state.size=options[i];rememberDraftSize(p,state.color,state.size);group.update();onSelect();
 });
 host.replaceChildren(group.field);
}
function draftBuy(p,state,status){
 const options=draftSizes(p,state.color);
 if(options.length&&!draftVariant(p,state.color,state.size)){
  status.textContent='Elegí un talle antes de agregar';return;
 }
 if(addDraft(p,state.color,state.size))showBag();
 else status.textContent='Ya llegaste al máximo de unidades de esta variante.';
}
function addDraft(p,index,size){
 const options=draftSizes(p,index);
 if(options.length&&!draftVariant(p,index,size))return false;
 const key=draftKey(p,index,options.length?size:null);
 if(!change(key,1))return false;
 announce(p.name+(size?' · '+size:'')+' en el carrito');return true;
}
function quickDraft(p,start=null,origin=null,options={}){
 openDrawer(p.name,'NACHO MILANO');if(origin)lastDialogTrigger=origin;
 const state=readChoice(p,start);state.size=options.fixedColor?null:preferredDraftSize(p,state.color);
 const draftUrl=()=>{
  const q=new URLSearchParams({color:p.colors[state.color].name});
  if(state.size)q.set('talle',state.size);
  return 'producto-'+p.id+'.html?'+q;
 };
 const media=el('div'),detail=link('Ver ficha →',draftUrl(),'textLink');
 const status=el('p','','statusText'),sizes=el('div',undefined,'draftSizeArea');status.setAttribute('role','status');
 const sizeChanged=()=>{detail.href=draftUrl();status.textContent=''};
 const paint=()=>{
  const photo=draftPhoto(p.colors[state.color]),img=photo?image(photo,p.name,false):draftPlaceholder();
  if(photo)img.className='drawerPhoto';
  media.replaceChildren(img);draftSizeUI(p,state,sizes,sizeChanged);sizeChanged();
 };
 let colorsUI;
 if(options.fixedColor){
  colorsUI=el('p',undefined,'quiet');
  colorsUI.append(el('span','Color elegido:'),' ',el('strong',p.colors[state.color].name));
 }else{
  const colors=draftColorDots(p,()=>state.color,n=>{
   state.color=n;state.size=preferredDraftSize(p,n);saveChoice(p,state);colors.update();paint();
  });
  colorsUI=colors.field;
 }
 const add=btn('Agregar al carrito',()=>{
  const blocked=options.beforeAdd?.(state);
  if(blocked){status.textContent=blocked;return}
  draftBuy(p,state,status);
 },'buy');
 body.append(media,colorsUI,sizes,add,status,detail);paint();
}
const zoom=$('#zoom');
const zoomMasters=new Set('calca-preto-frente-cordon calca-branco-frente-cordon calca-bege-frente-cordon calca-bege-frente-v2 calca-bege-textura calca-branco-frente calca-branco-textura calca-preto-frente-v2 calca-preto-textura champy-branco-frente champy-branco-textura look-azul-front look-campana-areia-front look-campana-champy-front look-campana-crema-front look-campana-verde-front look-off-front look-rustic-front look-swell-front rustic-areia-frente rustic-areia-textura rustic-azul-frente rustic-azul-textura rustic-branco-frente rustic-branco-textura rustic-safari-frente rustic-safari-textura short-natural-frente short-natural-textura swell-mascavo-frente swell-mascavo-textura swell-off-frente swell-off-textura swell-preto-frente swell-preto-textura swell-verde-frente swell-verde-textura'.split(' '));
function zoomMaster(src){
 const name=/^assets\/(?:coleccion-detalles|looks-orbita(?:-hd)?)\/([a-z0-9-]+)\.webp$/.exec(src)?.[1];
 return zoomMasters.has(name)?'assets/foto-zoom/'+name+'.webp':src;
}
let zoomView;
function openZoom(src,alt,opener=document.activeElement,options={}){
 if(!zoom||!src)return;
 if(!zoomView){
  const im=$('#zoomImage'), view=el('div',undefined,'nmZoomViewport'), form=zoom.querySelector('form'), close=form.querySelector('button');
  const tools=el('div',undefined,'nmZoomTools'), tabs=el('div',undefined,'nmZoomTabs');
  const status=el('p',undefined,'nmZoomStatus'), change=btn('',()=>setZoom(!enlarged),'nmZoomToggle');
  const pt=()=>document.documentElement.lang.toLowerCase().startsWith('pt');
  view.tabIndex=0;view.setAttribute('role','region');
  tabs.setAttribute('role','group');status.setAttribute('role','status');status.hidden=true;
  close.setAttribute('type','submit');im.draggable=false;im.decoding='async';im.hidden=true;
  im.before(tabs,view);view.append(im,status);tools.append(change);form.prepend(tools);zoom.classList.add('nmZoom');
  let enlarged=false,possible=false, returnFocus=null, active=null, choices=[], tried=[], position=0;
  const label=pt, density=()=>Math.max(1,window.devicePixelRatio||1)*Math.max(1,window.visualViewport?.scale||1);
  function controls(){
   const line=enlarged?(label()?'Ajustar à tela':'Ajustar a la pantalla')
    : possible?(label()?'Tamanho nativo':'Tamaño nativo'):(label()?'Nitidez máxima':'Máxima nitidez');
   change.textContent=line;change.setAttribute('aria-label',line);
   change.setAttribute('aria-pressed',String(enlarged));
   change.disabled=!possible;
   zoom.toggleAttribute('data-enlarged',enlarged);
  }
  function fit(reset=false){
   if(!zoom.open||im.hidden||!im.naturalWidth||!im.naturalHeight)return;
   const cap=1/density();
   const fitFactor=Math.min(view.clientWidth/im.naturalWidth,view.clientHeight/im.naturalHeight,cap);
   if(!(fitFactor>0))return;
   possible=cap>fitFactor*1.015;
   if(!possible)enlarged=false;
   const value=enlarged?cap:fitFactor;
   // DPR and page magnification matter: 1 source pixel per physical screen pixel.
   im.style.width=Math.max(1,Math.floor(im.naturalWidth*value))+'px';
   im.style.height=Math.max(1,Math.floor(im.naturalHeight*value))+'px';
   controls();
   if(reset){view.scrollLeft=(view.scrollWidth-view.clientWidth)/2;view.scrollTop=(view.scrollHeight-view.clientHeight)/2}
  }
  function setZoom(next){if(!possible)return;enlarged=!!next;fit(true)}
  function showChoice(i){
   const next=choices[i];if(!next||(active===next&&!im.hidden))return;
   position=i;active=next;enlarged=false;possible=false;controls();
   [...tabs.children].forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));
   im.hidden=true;status.hidden=true;im.alt=next.alt||'';
   tried=[...new Set([zoomMaster(next.src),next.src,next.fallback].filter(Boolean))];
   im.src=tried.shift();
  }
  view.addEventListener('dblclick',()=>setZoom(!enlarged));
  zoom.addEventListener('keydown',e=>{
   if(e.altKey||e.ctrlKey||e.metaKey)return;
   if(e.key==='+'||e.key==='='){e.preventDefault();setZoom(true)}
   else if(e.key==='-'||e.key==='0'){e.preventDefault();setZoom(false)}
  });
  tabs.addEventListener('keydown',e=>{
   if(!['ArrowRight','ArrowLeft','Home','End'].includes(e.key)||e.altKey||e.ctrlKey||e.metaKey)return;
   e.preventDefault();
   const i=e.key==='Home'?0:e.key==='End'?choices.length-1:(position+(e.key==='ArrowRight'?1:-1)+choices.length)%choices.length;
   showChoice(i);tabs.children[i]?.focus();
  });
  im.addEventListener('load',()=>{if(!active||!zoom.open)return;im.hidden=false;fit(true)});
  im.addEventListener('error',()=>{
   if(!active||!zoom.open)return;
   if(tried.length){im.src=tried.shift();return}
   status.textContent=label()?'Foto indisponível.':'Foto no disponible.';status.hidden=false;
  });
  const resize=()=>fit(false);
  window.addEventListener('resize',resize,{passive:true});window.visualViewport?.addEventListener('resize',resize,{passive:true});
  zoom.addEventListener('click',e=>{
   if(e.target!==zoom)return;
   const r=zoom.getBoundingClientRect();
   if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)zoom.close();
  });
  zoom.addEventListener('close',()=>{
   const trigger=returnFocus;returnFocus=null;active=null;choices=[];tried=[];
   im.hidden=true;im.removeAttribute('src');trigger?.focus?.({preventScroll:true});
  });
  zoomView={show(path,label,trigger,opts){
   returnFocus=trigger;
   tabs.setAttribute('aria-label',pt()?'Vistas da foto':'Vistas de la foto');
   view.setAttribute('aria-label',pt()?'Foto ampliável':'Foto ampliable');
   const primary={src:path,alt:label,fallback:opts.fallback};
   choices=(opts.views?.length?opts.views:[primary]).filter(v=>v?.src);
   let i=choices.findIndex(v=>v.src===path);
   if(i<0){choices.unshift(primary);i=0}
   tabs.hidden=choices.length<2;
   tabs.replaceChildren(...(tabs.hidden?[]:choices.map((v,j)=>btn(v.name,()=>showChoice(j),'nmZoomTab'))));
   if(!zoom.open)zoom.showModal();
   showChoice(i);close.focus({preventScroll:true});
  }};
 }
 zoomView.show(src,alt,opener,options);
}
if(zoom)document.addEventListener('nm:zoom-photo',e=>{const get=e.detail;if(get)openZoom(get.src,get.alt,get.opener,get.options)});
function galleryFor(p,state,{media,edition,inline=false}){
 const views=[['Frente','frente'],['Espalda','espalda'],['Detalle','detalle']];if(edition&&!inline)views.push([p.colors.length>1?'Puesto · '+p.colors[0][0]:'Puesto','puesto']);if(state.view>=views.length)state.view=0;
 const photo=btn('',()=>{if(performance.now()>=muteClick)openZoom(pic.src,pic.alt)},'detailPhoto'),pic=image(src(p.colors[state.color][1]),p.name,false);photo.setAttribute('aria-label','Ampliar foto de '+p.name);photo.append(pic);const bar=el('div',undefined,'viewbar');
 const thumbs=[];
 const arrows=views.map(([label,type],i)=>{const x=btn(label,()=>{state.view=i;update()});if(!inline){const t=image(type==='puesto'?'assets/'+edition.photo+'.webp':src(p.colors[state.color][1],type));x.prepend(t);thumbs.push([t,type])}return x});bar.classList.toggle('withThumbs',!inline);bar.append(...arrows);media.replaceChildren(photo,bar);
 function update(){const [name,code]=views[state.view];const c=p.colors[state.color],worn=code==='puesto';const next=worn?'assets/'+edition.photo+'.webp':src(c[1],code);if(pic.getAttribute('src')!==next){const nextImage=new Image();nextImage.src=next;const wanted=next;pic.dataset.next=wanted;nextImage.decode().catch(()=>{}).then(()=>{if(pic.dataset.next===wanted){pic.src=wanted;if(!quiet.matches&&pic.animate)pic.animate([{opacity:.34},{opacity:1}],{duration:260})}})}else pic.dataset.next=next;
 pic.alt=worn?'En el look '+edition.name+' (color de campaña)':p.name+' · '+c[0]+' · '+name;pic.classList.toggle('worn',worn);thumbs.forEach(([t,type])=>{if(type!=='puesto'){const next=src(c[1],type);if(t.getAttribute('src')!==next)t.src=next}});arrows.forEach((x,j)=>x.setAttribute('aria-pressed',String(j===state.view)))}
 const step=d=>{state.view=period(state.view+d,views.length);update()};photo.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();step(e.key==='ArrowRight'?1:-1)}});if(!inline)gesture(photo,{release:(d)=>step(d)});update();return ()=>{if(state.view===3)state.view=0;update()}
}
function gesture(node,{enabled=()=>true,accept=()=>true,move=()=>{},release=()=>{},cancel=()=>{}}){
 let g=null;
 node.addEventListener('pointerdown',e=>{
  if(g||!enabled()||!accept(e)||!e.isPrimary||(e.pointerType!=='touch'&&e.button!==0)||e.target.closest('.pin,.runControls,.viewbar,#allLooks,.heroControls'))return;
  g={id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now(),dx:0,on:false,kind:e.pointerType}
 });
 function handleMove(e){
  if(!g||g.id!==e.pointerId)return;
  const dx=e.clientX-g.x,dy=e.clientY-g.y,ax=Math.abs(dx),ay=Math.abs(dy);
  if(!g.on){
   if(ay>11&&ay>ax*1.1){g=null;return}
   if(ax<8||ax<ay*1.08)return;
   g.on=true;node.classList.add('moving');
   // Touch has implicit capture on the pressed child (often a garment button).
   // Transferring that capture bubbles lostpointercapture from the child.
   if(g.kind!=='touch')try{node.setPointerCapture(e.pointerId)}catch{}
  }
  g.dx=dx;move(dx)
 }
 function end(e,ok){
  if(!g||g.id!==e.pointerId)return;
  const data=g;g=null;node.classList.remove('moving');if(!data.on)return;
  muteClick=performance.now()+360;const velocity=data.dx/Math.max(30,performance.now()-data.t);
  if(ok&&Math.abs(data.dx)>22)release(data.dx<0?1:-1,data.dx,velocity);else cancel()
 }
 // Window observes the original event even when the pressed child keeps capture
 // or a browser rolls off the edge; only the stage's own capture loss ends it.
 window.addEventListener('pointermove',handleMove,{capture:true,passive:true});
 window.addEventListener('pointerup',e=>end(e,true),true);
 window.addEventListener('pointercancel',e=>end(e,false),true);
 node.addEventListener('lostpointercapture',e=>{if(e.target===node)end(e,false)});
 node.addEventListener('dragstart',e=>e.preventDefault())
}
function rail(node,buttons,{stepWidth,style,current,select,enabled=()=>true,maxJump=2}){
 let dx=0,rf=0,W=1;
 const draw=()=>{rf=0;const n=buttons.length;const step=stepWidth(W);buttons.forEach((x,i)=>{let slot=i-current();const relative=slot+dx/step;const off=relative-Math.round(relative/n)*n;style(x,off,i,i===current(),step,dx!==0)})};
 const queue=()=>{if(!rf)rf=requestAnimationFrame(draw)};
 const ro=new ResizeObserver(es=>{W=es[0].contentRect.width;queue()});ro.observe(node);W=node.getBoundingClientRect().width||1;
 gesture(node,{enabled,move:d=>{dx=clamp(d,-W,W);queue()},release:(dir,d,v)=>{dx=0;const jump=clamp(Math.round((Math.abs(d)+Math.abs(v)*95)/stepWidth(W)),1,maxJump);select(current()+dir*jump);queue()},cancel:()=>{dx=0;queue()}});
 node.addEventListener('keydown',e=>{if(!enabled()||e.target.closest('.runControls')||!/^(ArrowLeft|ArrowRight|Home|End)$/.test(e.key))return;e.preventDefault();const wasButton=buttons.includes(document.activeElement);select(e.key==='Home'?0:e.key==='End'?buttons.length-1:current()+(e.key==='ArrowRight'?1:-1));queue();if(wasButton)buttons[current()]?.focus({preventScroll:true})});
 queue();return queue
}
function startCover(){
 const cover=$('#cover');if(!cover)return;
 const skip=$('#skipCover'),word=cover.querySelector('.nmPenWordmark'),editorial=cover.hasAttribute('data-nm-logo-reveal');
 const ink=word?.querySelector('[data-pen-image]'),tip=word?.querySelector('[data-pen-tip]');
 const lastInk=word?[...word.querySelectorAll('[data-pen-finishes] rect')]:[];
 let t,done,was,penFrame=0;
 function finishInk(){
  if(penFrame)cancelAnimationFrame(penFrame);penFrame=0;
  ink?.removeAttribute('mask');tip?.setAttribute('opacity','0');
 }
 function writeInk(){
  finishInk();
  if(!ink||!tip||quiet.matches)return;
  const entries=[];let total=0;
  try{
   for(const group of word.querySelectorAll('[data-pen-letter]')){
    const strokes=[...group.querySelectorAll('path')];
    strokes.forEach((path,i)=>{
     const length=path.getTotalLength(),span=length+15;
     path.style.strokeDasharray=length+' '+length;path.style.strokeDashoffset=String(length);
     path.setAttribute('stroke-opacity','0');
     const letter=Number(group.dataset.penLetter),last=i===strokes.length-1;
     if(last)lastInk[letter].setAttribute('opacity','0');
     entries.push({path,length,start:total,letter,last,done:false});total+=span;
    });
    total+=8;
   }
  }catch{return}
  if(!entries.length||!total)return;
  ink.setAttribute('mask','url(#nmPenInk)');
  const start=performance.now()+48;
  const run=now=>{
   penFrame=0;
   if(cover.hidden||cover.classList.contains('exiting')||quiet.matches){finishInk();return}
   const elapsed=Math.max(0,now-start)/1290;
   if(elapsed>=1){finishInk();return}
   const at=elapsed*total;
   let visible=false;
   for(const item of entries){
    if(item.done||at<=item.start)continue;
    if(!item.started){item.started=true;item.path.setAttribute('stroke-opacity','1');}
    const distance=Math.min(item.length,at-item.start);
    item.path.style.strokeDashoffset=String(item.length-distance);
    if(distance>=item.length){
     if(item.last)lastInk[item.letter].setAttribute('opacity','1');
     item.done=true;continue;
    }
    const pos=item.path.getPointAtLength(distance);
    tip.setAttribute('transform','translate('+pos.x.toFixed(2)+' '+pos.y.toFixed(2)+')');visible=true;break;
   }
   tip.setAttribute('opacity',visible?'1':'0');penFrame=requestAnimationFrame(run);
  };
  penFrame=requestAnimationFrame(run);
 }
 const show=()=>{
  clearTimeout(t);clearTimeout(done);was=document.activeElement;cover.hidden=false;cover.classList.remove('exiting');
  $('.bar').inert=true;$('main').querySelectorAll('section:not(.opening)').forEach(x=>x.inert=true);$('.hero').inert=true;$('.foot').inert=true;
  document.documentElement.classList.add('coverOpen');writeInk();t=setTimeout(exit,quiet.matches?140:editorial?1450:1000)
 };
 const exit=()=>{
  if(cover.hidden||cover.classList.contains('exiting'))return;
  clearTimeout(t);finishInk();cover.classList.add('exiting');
  done=setTimeout(()=>{
   const used=cover.contains(document.activeElement);cover.hidden=true;
   $('.bar').inert=false;$('main').querySelectorAll('section:not(.opening)').forEach(x=>x.inert=false);$('.hero').inert=false;$('.foot').inert=false;document.documentElement.classList.remove('coverOpen');
   if(used)(was===document.body?$('.heroLink'):was)?.focus({preventScroll:true});
   try{sessionStorage.setItem('nm-logo-pluma-v1-seen','1')}catch{}
  },quiet.matches?0:editorial?480:885)
 };
 skip.onclick=exit;$('#replay').onclick=()=>{window.scrollTo(0,0);show();skip.focus({preventScroll:true})};
 quiet.addEventListener('change',()=>{if(quiet.matches&&!cover.hidden)exit()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!cover.hidden)exit()});
 try{if(!quiet.matches&&!sessionStorage.getItem('nm-logo-pluma-v1-seen')&&!location.hash)show()}catch{}
 let scrollTick=0;const update=()=>{scrollTick=0;const track=$('.heroTrack'),hero=$('.hero');const p=clamp(-track.getBoundingClientRect().top+$('#bar').offsetHeight,0,track.offsetHeight-hero.offsetHeight)/Math.max(1,track.offsetHeight-hero.offsetHeight);hero.style.setProperty('--hero-progress',p.toFixed(3))};const request=()=>{if(!scrollTick)scrollTick=requestAnimationFrame(update)};window.addEventListener('scroll',request,{passive:true});window.addEventListener('resize',request,{passive:true});request();
 startHeroSwipe();

}
function startHeroSwipe(){
 const hero=$('.hero'),slideCount=hero.querySelector('.heroSlides')?.children.length||0;if(slideCount<2)return;let index=0;
 const paint=d=>{hero.style.setProperty('--hero-offset',(-index*100)+'%');hero.style.setProperty('--hero-dx',d.toFixed(1)+'px');hero.dataset.slide=String(index)};
 const select=i=>{index=clamp(i,0,slideCount-1);paint(0)};
 gesture(hero,{
  move:d=>{const w=hero.clientWidth;const edge=(index===0&&d>0)||(index===slideCount-1&&d<0);paint(edge?clamp(d*.14,-45,45):clamp(d,-w,w))},
  release:(dir,d,speed)=>{const threshold=Math.min(90,hero.clientWidth*.17);if(Math.abs(d)>threshold||(Math.abs(d)>30&&Math.abs(speed)>.28))select(index+dir);else paint(0)},
  cancel:()=>paint(0)
 });
 hero.addEventListener('keydown',e=>{if(e.target.closest('.heroLink,.nmCampaignNav a'))return;if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();select(e.key==='Home'?0:e.key==='End'?slideCount-1:index+(e.key==='ArrowRight'?1:-1))});
 hero.addEventListener('click',e=>{if(e.detail&&performance.now()<muteClick&&e.target.closest('.heroLink,.nmCampaignNav a')){e.preventDefault();e.stopImmediatePropagation()}},true);
 select(0)
}
function startRack(){
 const scene=$('#rackScene'),canvas=$('#rackCanvas'),rack=$('#rack'),detail=$('#rackDetail'),media=$('#rackDetailMedia'),rotation=$('#rackAuto'),counter=$('#rackIndex');
 const seq=['tejido','polo','pantalon','chaleco','cuello-navy','oxford','remera'].map(id=>byId.get(id)).filter(Boolean);let ix=0,detailId=null,timer=0,visible=false,hold=null,paused=quiet.matches;
 if(!seq.length)return;
 const interval=4000;
 function repaintRotation(){
  rotation.dataset.paused=String(paused);
  rotation.setAttribute('aria-label',paused?'Activar avance automático':'Pausar avance automático')
 }
 const keyboardFocus=()=>scene.contains(document.activeElement)&&document.activeElement.matches(':focus-visible')&&document.activeElement!==rotation;
 function arm(){
   clearTimeout(timer);timer=0;
   if(paused||!visible||document.hidden||detailId||hold!==null||keyboardFocus()||drawer.open||zoom.open||!$('#cover').hidden||seq.length<2)return;
   timer=setTimeout(()=>{if(!paused&&visible&&!document.hidden&&!detailId&&hold===null&&!keyboardFocus()&&!drawer.open&&!zoom.open&&$('#cover').hidden)select(ix+1);else arm()},interval)
 }
 function releaseHold(e){if(hold===e.pointerId){hold=null;arm()}}
 canvas.addEventListener('pointerdown',e=>{if(e.isPrimary&&e.button===0){hold=e.pointerId;arm()}});
 for(const type of ['pointerup','pointercancel'])window.addEventListener(type,releaseHold);
 canvas.addEventListener('lostpointercapture',e=>{if(e.target===canvas)releaseHold(e)});
 scene.addEventListener('focusin',arm);scene.addEventListener('focusout',()=>queueMicrotask(arm));
 document.addEventListener('visibilitychange',arm);drawer.addEventListener('close',arm);zoom.addEventListener('close',arm);
 new MutationObserver(arm).observe($('#cover'),{attributes:true,attributeFilter:['hidden']});
 quiet.addEventListener('change',()=>{paused=quiet.matches;repaintRotation();arm()});
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting&&entries[0].intersectionRatio>=.5;arm()},{threshold:[0,.5]}).observe(canvas);
 rotation.onclick=()=>{paused=!paused;repaintRotation();arm()};
 repaintRotation();
 const buttons=seq.map((p,i)=>{const x=btn('',()=>{if(performance.now()<muteClick)return;if(ix!==i)select(i);else show(p)},'piece');x.setAttribute('aria-label',p.name);x.append(image(src(p.colors[0][1],'rack'),'',true));rack.append(x);return x});
 const rerender=rail(canvas,buttons,{current:()=>ix,stepWidth:w=>w*(touch.matches?.33:.226),maxJump:1,select,style:(x,off,i,focus,step)=>{const abs=Math.abs(off),faded=abs>2.43;x.style.transform='translate3d(calc(-50% + '+(off*step).toFixed(2)+'px),calc(-50% + '+Math.min(31,abs*13).toFixed(2)+'px),0) rotate('+(off*2.4).toFixed(2)+'deg) scale('+clamp(1.09-abs*.19,.49,1.09).toFixed(3)+')';x.style.opacity=faded?'0':String(clamp(1-abs*.18,.24,1));x.style.zIndex=String(22-Math.round(abs*6));x.style.pointerEvents=faded?'none':'';x.setAttribute('aria-current',String(focus));x.firstElementChild.style.setProperty('--yaw',clamp(off*-12,-18,18)+'deg');x.tabIndex=focus&&!detailId?0:-1}});
 function select(i){ix=period(i,seq.length);const p=seq[ix];$('#sceneNumber').textContent=num(ix+1);counter.textContent=num(ix+1)+' / '+num(seq.length);$('#rackName').textContent=p.name;if(detailId)show(p,false);rerender();arm()}
 function show(p,focus=true){const x=buttons[ix],before=x.getBoundingClientRect();detailId=p.id;scene.dataset.mode='detail';rack.inert=true;arm();detail.hidden=false;media.hidden=false;const state=readChoice(p),refreshPhoto=galleryFor(p,state,{media,inline:true});
 const back=btn('← Ver otras prendas',()=>leave(),'textLink'), heading=el('h3',p.name),page=link('Ver ficha →',url(p,state.color),'textLink');
 detail.replaceChildren(back,heading,el('p',p.description),formFor(p,state,()=>{refreshPhoto();page.href=url(p,state.color)}),page);$('#rackOpen').textContent='Cerrar detalle →';rerender();
 if(focus){back.focus({preventScroll:true});const elImg=media.querySelector('img');if(elImg&&!quiet.matches&&elImg.animate){const b=elImg.getBoundingClientRect();if(b.width&&before.width)elImg.animate([{transform:'translate('+(before.x+before.width*.5-b.x-b.width*.5)+'px,0) scale(.73)',opacity:.4},{transform:'none',opacity:1}],{duration:530,easing:'cubic-bezier(.22,.72,.19,1)'})}}
 }
 function leave(){detailId=null;scene.dataset.mode='rail';rack.inert=false;detail.hidden=true;media.hidden=true;$('#rackOpen').textContent='Ver prenda →';rerender();$('#rackOpen').focus({preventScroll:true});arm()}
 media.hidden=true;$('#rackPrev').onclick=()=>select(ix-1);$('#rackNext').onclick=()=>select(ix+1);$('#rackOpen').onclick=()=>detailId?leave():show(seq[ix]);select(0)
}
function makeLookRow(p,act){const x=btn('',act,'lookItem'),mark=el('span','+');mark.dataset.mark=p.id;mark.setAttribute('aria-hidden','true');x.append(image(src(p.colors[0][1],'rack')),el('span',p.name),mark);return x}
// Editorial works may have any number of pieces. Only two exact catalog
// identities form a complete look that this preview bag may add.
function lookCartRows(look){
 if(!Array.isArray(look?.items)||look.items.length!==2)return null;
 const rows=look.items.map(item=>{
  const p=byId.get(item?.id),index=p?.colors.findIndex(c=>c.name===item?.color)??-1;
  if(!p?.draft||index<0)return null;
  return {p,index};
 });
 return rows.every(Boolean)&&rows[0].p.id!==rows[1].p.id?rows:null;
}
const canBagLook=look=>lookCartRows(look)!==null;
function commitLook(look,selections){
 const rows=lookCartRows(look);
 if(!rows)return 'Este look no está disponible completo.';
 const keys=[];
 for(const {p,index} of rows){
  const sizes=draftSizes(p,index), size=selections.get(p.id)??null;
  if(sizes.length&&!draftVariant(p,index,size))return 'Elegí el talle de cada prenda que lo requiere.';
  if(!sizes.length&&size!==null)return 'Este look no está disponible completo.';
  const key=draftKey(p,index,size);
  if(!valid.has(key))return 'Este look no está disponible completo.';
  keys.push(key);
 }
 const latest=readCartSnapshot();
 if(!latest)return 'No pudimos guardar el look. Probá de nuevo.';
 if(keys.some(key=>(latest.get(key)||0)>=9))return 'No se agregó el look: una de las prendas ya tiene 9 unidades en el carrito.';
 const next=new Map(latest);
 for(const key of keys)next.set(key,(next.get(key)||0)+1);
 // No per-line change(): one guarded write for the whole outfit, or none.
 try{localStorage.setItem(cartStorageKey,JSON.stringify([...next]));}catch{return 'No pudimos guardar el look. Probá de nuevo.'}
 cart=next;return '';
}
function outfitDrawer(look,opener){
 const rows=lookCartRows(look);
 openDrawer(look?.name||'Armá tu look',look?.label||'NACHO MILANO');
 if(opener)lastDialogTrigger=opener;
 const title=$('#drawerTitle');title.tabIndex=-1;title.focus({preventScroll:true});
 if(!rows){const note=el('p','Este look no está disponible completo.','statusText');note.setAttribute('role','status');body.append(note);return}
 const sizesByProduct=new Map();
 const needSizes=rows.some(({p,index})=>draftSizes(p,index).length>0);
 const hint=el('p',needSizes?'Elegí el talle de cada prenda que lo requiere.':'Se agregan las dos prendas en los colores de este look.','quiet');
 const status=el('p','','statusText');status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');
 body.append(hint);
 let done=false;
 const confirm=btn('Agregar las dos prendas',()=>{
  if(done)return;
  const failure=commitLook(look,sizesByProduct);
  if(failure){status.textContent=failure;return}
  done=true;confirm.disabled=true;
  showBag();
  const notice=el('p','Agregamos las dos prendas del look.','statusText');
  notice.setAttribute('role','status');body.prepend(notice);
  title.focus({preventScroll:true});
 },'buy');
 const update=()=>confirm.disabled=done||rows.some(({p,index})=>draftSizes(p,index).length>0&&!draftVariant(p,index,sizesByProduct.get(p.id)));
 for(const {p,index} of rows){
  const color=p.colors[index],row=el('section',undefined,'outfitRow outfitBagRow'),side=el('div');
  const path=draftPhoto(color),photo=path?image(path,'',false):draftPlaceholder();
  const size=el('div',undefined,'draftSizeArea'),state={color:index,size:null};
  side.append(el('h3',p.name),el('p',color.name,'outfitBagRow__color'),size);row.append(photo,side);body.append(row);
  draftSizeUI(p,state,size,()=>{sizesByProduct.set(p.id,state.size);status.textContent='';update();});
 }
 body.append(confirm,status);update();
}
// Probador and the Shopify theme share the same exact-variant bridge.
window.NM_LOOK_CART=Object.freeze({
 can:canBagLook,
 open(look,opener){
  if(drawer.open||!canBagLook(look))return false;
  outfitDrawer(look,opener);return true;
 }
});
function lookBagButton(look){
 const action=btn('Agregar look al carrito',()=>outfitDrawer(look,action),'buy buildLook');
 action.setAttribute('aria-haspopup','dialog');return action;
}
function startRunway(){
 const stage=$('#runwayStage'),scene=$('#runwayScene'),port=$('#models'),pins=$('#pins'),info=$('#lookInfo'),all=$('#allLooks');let ix=0,focus=false;
 if(window.NM_ORBIT){
  window.NM_ORBIT.mount({stage,scene,port,pins,info,all,previous:$('#lookPrev'),next:$('#lookNext'),counter:$('#lookIndex'),looks,
   quiet,gesture,el,btn,image,link,selectProduct:id=>byId.get(id),productAction:p=>makeLookRow(p,()=>quickDrawer(p)),
   launchZoom:openZoom,outfitDrawer,canBagLook,refresh});
  return;
 }
 const buttons=looks.map((l,i)=>{const x=btn('',()=>{if(performance.now()<muteClick)return;if(i===ix)setFocus(!focus);else select(i)},'model');x.setAttribute('aria-label','Elegir look '+l.name);const fig=image(l.draft?'assets/'+l.photo+'.webp':'assets/runway-'+(i+1)+'.webp',l.name+(l.draft?' · Imagen ilustrativa':''),true);if(!l.draft)fig.onerror=()=>{fig.onerror=null;fig.src='assets/'+l.photo+'.webp';fig.classList.add('boxed')};x.append(fig);port.append(x);return x});
 const rr=rail(stage,buttons,{current:()=>ix,select,maxJump:1,stepWidth:w=>w*(touch.matches?.33:.23),style:(x,d,i,active,step,dragging)=>{const abs=Math.abs(d),y=focus?d*step*1.7:d*step;x.style.transform='translate3d(calc(-50% + '+y.toFixed(2)+'px),0,0) scale('+(focus&&active?1.075:clamp(1-abs*.14,.64,1)).toFixed(3)+')';x.style.opacity=focus&&!active&&!dragging?'0':String(abs>1.48?clamp((1.94-abs)*1.4,0,.65):clamp(1-abs*.22,.28,1));x.style.zIndex=String(20-Math.round(abs*7));x.style.pointerEvents=focus&&!active?'none':'';x.tabIndex=active?0:-1;x.setAttribute('aria-current',String(active));x.setAttribute('aria-pressed',String(focus&&active))}});
 function setFocus(f){focus=f;render();rr();if(f){const y=stage.getBoundingClientRect().top,bottom=stage.getBoundingClientRect().bottom;if(y<70||bottom>innerHeight)stage.scrollIntoView({block:'start',behavior:'instant'})}}
 function select(i){ix=period(i,looks.length);render();rr()}
 const goTo=(p,trigger)=>{if(p.draft){location.href=url(p);return;}quickDrawer(p)};
 const anchors=[
 [[.50,.32],[.59,.60]],
 [[.47,.33],[.69,.43],[.57,.63]],
 [[.56,.35],[.58,.62]],
 [[.67,.46],[.45,.31],[.53,.66]]
 ];
 function place(){if(!focus)return;const fig=buttons[ix],p=stage.getBoundingClientRect();const baseW=fig.offsetWidth*1.075, baseH=fig.offsetHeight*1.075;const left=(p.width-baseW)/2,top=p.height*.86-baseH;[...pins.children].forEach((pin,n)=>{const item=looks[ix]?.items[n];const [x,y]=item?.x&&item?.y?[item.x/100,item.y/100]:anchors[ix]?.[n]||[.5,.3+n*.16];const offset=touch.matches&&n===1&&pins.children.length>2?20:0;pin.style.left=clamp(left+baseW*x+offset,24,p.width-24)+'px';pin.style.top=clamp(top+baseH*y,24,p.height-77)+'px'})}
 new ResizeObserver(place).observe(stage);
 function render(){const look=looks[ix];if(!look)return;scene.dataset.focus=String(focus);all.hidden=!focus;$('#lookIndex').textContent=num(ix+1)+' / '+num(looks.length);pins.replaceChildren();pins.setAttribute('aria-hidden',String(!focus));const list=el('ul');
 look.items.forEach((i,n)=>{const p=byId.get(i.id),row=el('li');if(p.draft){const color=lookColor(p,i),a=link('',url(p,color),'lookItem lookItemLink');const photo=draftPhoto(p.colors[color]);a.append(photo?image(photo,''):draftPlaceholder(),el('span',p.name),el('span','↗'));row.append(a)}else row.append(makeLookRow(p,()=>quickDrawer(p)));list.append(row);if(focus){const pin=p.draft?link(String(n+1),url(p,lookColor(p,i)),'pin'):btn(String(n+1),()=>goTo(p),'pin');pin.setAttribute('aria-label','Ver '+p.name);pins.append(pin)}});
 info.replaceChildren(el('span',look.label,'smallCaps'),el('h3',look.name),el('p',look.copy),list);if(!focus)info.append(btn('Ver prendas del look →',()=>{setFocus(true);buttons[ix].focus({preventScroll:true})},'textLink'));if(canBagLook(look))info.append(lookBagButton(look));requestAnimationFrame(place);refresh()}
 all.onclick=()=>{setFocus(false);buttons[ix].focus({preventScroll:true})};$('#lookPrev').onclick=()=>select(ix-1);$('#lookNext').onclick=()=>select(ix+1);$('#looks').addEventListener('keydown',e=>{if(e.key==='Escape'&&focus){setFocus(false);buttons[ix].focus({preventScroll:true})}});render();
 const requested=Number(new URLSearchParams(location.search).get('look'))-1;
 if(Number.isInteger(requested)&&requested>=0&&requested<looks.length){select(requested);requestAnimationFrame(()=>setFocus(true))}
}
function startCatalog(){const filters=$('#filter'),grid=$('#grid');let active='Todo',onlySaved=false,sort='featured';
 const search=$('#catalogSearch'),toggleSavedFilter=$('#savedFilter'),sorter=$('#sortCatalog'),letters=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const cats=['Todo',...new Set(shopProducts.map(p=>p.category))], preview=$('#catalogo').dataset.preview==='true';
 if(!preview)try{const stored=JSON.parse(sessionStorage.getItem('nm-catalog-filter-v3')||'{}');if(cats.includes(stored.active))active=stored.active;search.value=typeof stored.q==='string'?stored.q:'';onlySaved=stored.onlySaved===true;if(['az','za'].includes(stored.sort))sort=stored.sort}catch{}
 if(!preview){const params=new URLSearchParams(location.search);if(params.has('categoria')||params.has('q')){active=cats.includes(params.get('categoria'))?params.get('categoria'):'Todo';search.value=params.get('q')||'';onlySaved=false;sort='featured';try{history.replaceState(null,'',location.pathname)}catch{}}sorter.value=sort}
 const persist=()=>{if(!preview)try{sessionStorage.setItem('nm-catalog-filter-v3',JSON.stringify({active,q:search.value,onlySaved,sort}))}catch{}};
 search.addEventListener('input',()=>{persist();draw()});toggleSavedFilter.onclick=()=>{onlySaved=!onlySaved;persist();draw()};
 sorter.onchange=()=>{sort=sorter.value;persist();draw()};$('#resetCatalog').onclick=()=>{active='Todo';onlySaved=false;search.value='';sort='featured';sorter.value=sort;persist();draw();search.focus()};if(!preview)persist();
 const keys=cats.map(cat=>{const b=btn(cat,()=>{active=cat;persist();draw()},'');filters.append(b);return b});
 function draw(){toggleSavedFilter.setAttribute('aria-pressed',String(onlySaved));keys.forEach((b,i)=>b.setAttribute('aria-pressed',String(cats[i]===active)));const q=letters(search.value.trim());const result=shopProducts;const shown=result.filter(p=>(active==='Todo'||p.category===active)&&(!onlySaved||saved.has(p.id))&&(!q||q.split(/\s+/).every(t=>letters([p.name,p.category,p.line,...p.colors.map(displayColor)].filter(Boolean).map(t=>window.NM_LANG?.aliases(t)??t).join(' ')).includes(t))));if(sort!=='featured')shown.sort((a,b)=>(window.NM_LANG?.t(a.name)??a.name).localeCompare(window.NM_LANG?.t(b.name)??b.name,window.NM_LANG?.locale??'es-UY')*(sort==='za'?-1:1));$('#noMatches').hidden=shown.length!==0;$('#catalogCount').textContent=shown.length+(shown.length===1?' PRENDA':' PRENDAS');
 if(window.NM_VARIANTS){
  window.NM_VARIANTS.render(grid,shown,{
   el,btn,image,link,glyph:cardGlyph,photo:draftPhoto,placeholder:draftPlaceholder,quickDraft,openZoom,demoPrice,
   onSave:p=>{toggleSaved(p);if(onlySaved){draw();toggleSavedFilter.focus()}}
  });
  refreshSaved();return;
 }
 grid.replaceChildren();const fragment=document.createDocumentFragment();
 for(const p of shown){
  const state=readChoice(p),card=el('article',undefined,'card'),visual=el('div',undefined,'cardVisual'),pic=link('',url(p,state.color),'cardPic');
  const c=p.colors[state.color];pic.setAttribute('aria-label','Abrir ficha de '+p.name);
  if(p.draft){
    const main=draftPhoto(c), rear=draftPhoto(c,'back');pic.append(main?image(main,p.name):draftPlaceholder());
    if(main&&rear){const back=image(rear);back.className='back';pic.append(back)}
  }else{
    const front=image(src(c[1],'rack'),p.name),back=image(src(c[1],'espalda'));back.className='back';pic.append(front,back);
  }
  const add=btn('',()=>p.draft?quickDraft(p):quickDrawer(p,null,()=>showBag()),'cardAdd');add.append(cardGlyph('bag'));add.setAttribute('aria-label','Agregar al carrito: '+p.name);add.setAttribute('aria-haspopup','dialog');visual.append(add);
  const save=btn('',()=>{toggleSaved(p);if(onlySaved){draw();toggleSavedFilter.focus()}},'cardSave');save.dataset.save=p.id;save.append(cardGlyph('star'));
  const line=el('div',undefined,'cardLine'),name=el('h3');name.append(link(p.name,url(p,state.color)));line.append(name);
  const previewPrice=demoPrice(p);if(previewPrice)line.append(previewPrice);
  else if(p.price!=null)line.append(el('p','$'+new Intl.NumberFormat('es-UY').format(p.price)+' UYU','cardPrice'));
  if(p.colors.length>1)line.append(el('p',p.colors.length+' colores','colorNote'));
  visual.prepend(pic);visual.append(save);card.append(visual,line);fragment.append(card)
 }
 grid.append(fragment);refreshSaved()}
 document.addEventListener?.('nm:idioma',()=>{if(sort!=='featured')draw()});
 draw()
}
function productGallery(p,state,media){
 const types=[['Frente','frente'],['Espalda','espalda'],['Textura','detalle']];
 const track=el('div',undefined,'productGalleryTrack'),thumbs=el('div',undefined,'productThumbs');
 track.setAttribute('role','region');track.setAttribute('aria-roledescription','carrusel');track.setAttribute('aria-label','Fotos del producto');track.tabIndex=0;
 thumbs.setAttribute('role','group');thumbs.setAttribute('aria-label','Vistas del producto');
 const index=el('span',undefined,'referenceIndex');index.setAttribute('aria-hidden','true');
 media.replaceChildren(track,index,thumbs);
 let current=0,startX=0,moving=false;
 const width=()=>track.clientWidth||1, bounded=n=>clamp(n,0,2);
 function active(n){current=bounded(n);index.textContent=(current+1)+' / '+types.length;[...thumbs.children].forEach((b,i)=>b.setAttribute('aria-current',String(i===current)))}
 function go(n,instant=false){active(n);track.scrollTo({left:current*width(),behavior:instant||quiet.matches?'instant':'smooth'})}
 track.addEventListener('scroll',()=>{if(!moving)active(Math.round(track.scrollLeft/width()))},{passive:true});
 track.addEventListener('keydown',e=>{const d=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;if(d){e.preventDefault();go(current+d)}});
 let mouseOrigin=0;
 gesture(track,{accept:e=>e.pointerType==='mouse',move:d=>{if(!moving){moving=true;startX=track.scrollLeft;mouseOrigin=current}track.scrollLeft=clamp(startX-d,0,width()*2)},release:d=>{moving=false;go(mouseOrigin+d)},cancel:()=>{if(moving){moving=false;go(mouseOrigin)}}});
 function restore(){const c=p.colors[state.color];const slides=[],tiles=[];
  for(const [i,[label,type]] of types.entries()){const path=src(c[1],type),alt=p.name+' · '+c[0]+' · '+label;
   const s=btn('',()=>{if(performance.now()>=muteClick)openZoom(path,alt)},'productGallerySlide');s.setAttribute('aria-label','Ampliar: '+label);const photo=image(path,alt,i!==0);photo.draggable=false;s.append(photo);slides.push(s);
   const t=btn('',()=>go(i),'productThumb');t.setAttribute('aria-label','Ver foto: '+label);if(type==='detalle')t.dataset.texture='';const mini=image(path,'');mini.draggable=false;t.append(mini);tiles.push(t)
  }
  track.replaceChildren(...slides);thumbs.replaceChildren(...tiles);go(0,true)
 }
 restore();return restore
}
function showProductLooks(p){
 const section=$('#productLooks');if(!section)return;
 const pairs=looks.map((look,i)=>[look,i]).filter(([l])=>l.items.some(it=>it.id===p.id));if(!pairs.length){section.hidden=true;return}
 const title=el('h2','Looks con esta prenda');title.id='productLooksTitle';const row=el('div',undefined,'productLookCards');
 for(const [look,i] of pairs){const a=link('','index.html?look='+(i+1)+'#looks');const info=el('div');info.append(el('span',look.name));if(p.colors.length>1)info.append(el('small','En '+displayColor(p.colors[lookColor(p,look.items.find(it=>it.id===p.id))]).toLocaleLowerCase('es-UY')));const source='assets/'+look.photo+'.webp', pic=image('assets/looks-orbita/'+look.photo.split('/').at(-1)+'-front.webp','');pic.classList.add('lookAlphaBadge');pic.onerror=()=>{pic.onerror=null;pic.src=source};a.append(pic,info);row.append(a)}
 section.replaceChildren(title,row);section.hidden=false
}
function showProductRelated(p){
 const root=$('#productRelated');if(!root)return;
 const order=[...new Set([...looks.filter(l=>l.items.some(i=>i.id===p.id)).flatMap(l=>l.items.map(i=>i.id)),...products.map(q=>q.id)])].filter(id=>id!==p.id).slice(0,6);
 const top=el('div',undefined,'referenceRelatedHead'),h=el('h2','También te puede gustar'),arrows=el('div'),rail=el('div',undefined,'referenceRail');
 const move=d=>rail.scrollBy({left:d*(rail.querySelector('article')?.offsetWidth+16||220),behavior:quiet.matches?'instant':'smooth'});
 const prev=btn('←',()=>move(-1),''),next=btn('→',()=>move(1),'');prev.setAttribute('aria-label','Recomendación anterior');next.setAttribute('aria-label','Recomendación siguiente');arrows.append(prev,next);top.append(h,arrows);
 for(const id of order){const q=byId.get(id),card=el('article'),pic=link('',url(q),'referenceCardPhoto'),imageEl=image(src(q.colors[0][1]),q.name),save=btn('',()=>toggleSaved(q),'referenceSave');save.dataset.save=q.id;pic.append(imageEl);card.append(pic,save,link(q.name,url(q),'referenceCardTitle'));if(q.price!=null)card.append(el('p',money.format(q.price)));
  const colors=el('div',undefined,'referenceCardColors');for(const [i,c] of q.colors.entries()){const a=link('',url(q,i));a.style.setProperty('--chip',c[2]);a.setAttribute('aria-label',q.name+' · '+c[0]);colors.append(a)}card.append(colors);rail.append(card)
 }
 root.replaceChildren(top,rail);root.hidden=false;refreshSaved()
}
function startDraftProduct(p){
 const params=new URLSearchParams(location.search), requested=params.get('color'),requestedSize=params.get('talle');
 const media=$('#productMedia'), colorsHost=$('#productColors'),choice=$('#productChoice'), save=$('#productSave');
 let index=Math.max(0,p.colors.findIndex(c=>c.name===requested));
 const state={color:index,size:draftVariant(p,index,requestedSize)?requestedSize:preferredDraftSize(p,index),view:0};
 if(requestedSize===state.size)rememberDraftSize(p,index,state.size);
 save.dataset.save=p.id;save.onclick=()=>toggleSaved(p);
 const wrap=el('div',undefined,'buyForm draftChoice'),sizes=el('div',undefined,'draftSizeArea');
 const status=el('p','','statusText');status.setAttribute('role','status');
 const syncAddress=()=>{
  saveChoice(p,state);status.textContent='';
  try{const u=new URL(location.href);u.searchParams.set('color',p.colors[index].name);
   if(state.size)u.searchParams.set('talle',state.size);else u.searchParams.delete('talle');
   history.replaceState(null,'',u);
  }catch{}
 };
 const colors=draftColorDots(p,()=>index,i=>{
  index=i;state.color=i;state.size=preferredDraftSize(p,i);
  colors.update();draftSizeUI(p,state,sizes,syncAddress);paint();syncAddress();
 });
 const add=btn('Agregar al carrito',()=>draftBuy(p,state,status),'buy');
 const row=el('div',undefined,'purchaseRow');row.append(add,save);
 const price=demoPrice(p);if(price){row.dataset.pricePreview='';row.prepend(price)}
 if(colorsHost)colorsHost.append(colors.field);else wrap.append(colors.field);
 draftSizeUI(p,state,sizes,syncAddress);wrap.append(sizes,row,status);
 choice.append(wrap);showProductLooks(p);refreshSaved();
 // Read-only context for a future site-wide assistant. No widget, transmission or API.
 window.NM_PRODUCT_CONTEXT=Object.freeze({current:()=>Object.freeze({
  productId:p.id,color:p.colors[state.color].name,size:state.size,sizes:[...draftSizes(p,state.color)],
  locale:document.documentElement.lang==='pt-BR'?'pt-BR':'es-UY'
 })});
 function paint(){
   const c=p.colors[index];const views=[['front','Frente'],['profile','Perfil'],['back','Espalda'],['texture','Textura'],['ambient','Ambientada']].filter(([k])=>draftPhoto(c,k));
   if(!views.length){media.replaceChildren(draftPlaceholder());return}
   const group=el('div',undefined,'draftGallery'),track=el('div',undefined,'productGalleryTrack'),thumbs=el('div',undefined,'productThumbs draftThumbs');
   if(views.some(([k])=>k==='ambient'))thumbs.dataset.ambient='';
   track.tabIndex=0;track.setAttribute('aria-label','Fotos del producto');track.setAttribute('role','region');
   let current=0, settleTimer=0;
   const settled=()=>{current=Math.round(track.scrollLeft/(track.clientWidth||1))};
   const go=i=>{clearTimeout(settleTimer);current=i;track.scrollTo({left:i*track.clientWidth,behavior:quiet.matches?'instant':'smooth'})};
   const zoomViews=views.map(([k,name])=>{
     const pt=document.documentElement.lang.toLowerCase().startsWith('pt');
     return {src:draftPhoto(c,k),name:k==='back'&&pt?'Costas':name,alt:p.name+' · '+c.name+' · '+name};
   });
   for (const [i,[k,name]] of views.entries()){
     const path=draftPhoto(c,k), alt=p.name+' · '+c.name+' · '+name;
     const big=btn('',()=>openZoom(path,alt,big,{views:zoomViews}),'productGallerySlide');big.dataset.view=k;big.append(image(path,alt,i!==0));big.setAttribute('aria-label','Ampliar: '+name);big.setAttribute('aria-haspopup','dialog');big.tabIndex=i===0?0:-1;track.append(big);
     const thumb=btn('',()=>go(i),'productThumb');thumb.dataset.view=k;thumb.setAttribute('aria-label','Ver foto: '+name);thumb.setAttribute('aria-current',String(i===0));thumb.append(image(path),el('span',name,'productThumbLabel'));thumbs.append(thumb);
   }
   track.addEventListener('scroll',()=>{
    const cur=Math.round(track.scrollLeft/(track.clientWidth||1));
    [...thumbs.children].forEach((t,i)=>{t.setAttribute('aria-current',String(i===cur));track.children[i].tabIndex=i===cur?0:-1});
    clearTimeout(settleTimer);settleTimer=setTimeout(settled,150);
   },{passive:true});
   track.addEventListener('scrollend',()=>{clearTimeout(settleTimer);settled()},{passive:true});
   track.addEventListener('keydown',e=>{
    if(e.ctrlKey||e.altKey||e.metaKey||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
    e.preventDefault();const i=e.key==='Home'?0:e.key==='End'?views.length-1:clamp(current+(e.key==='ArrowRight'?1:-1),0,views.length-1);
    go(i);if(e.target.matches('.productGallerySlide'))track.children[i].focus({preventScroll:true});
   });
   group.append(track);if(views.length>1)group.append(thumbs);media.replaceChildren(group);
 }
 paint();
}
function startProduct(){
 const root=$('[data-product]'),p=byId.get(root.dataset.product);if(!p)return;if(p.draft){startDraftProduct(p);return}
 const params=new URLSearchParams(location.search),param=params.get('color'),size=params.get('talle'),state=readChoice(p,param===null?null:Math.max(0,p.colors.findIndex(c=>c[1]===param)));if(size!==null)state.size=p.sizes.includes(size)?size:null;
 const media=$('#productMedia'),re=productGallery(p,state,media);
 const save=$('#productSave');save.dataset.save=p.id;save.onclick=()=>toggleSaved(p);
 const choice=$('#productChoice');choice.append(formFor(p,state,()=>re(),false,()=>showBag(),true));
 $('#productSizeInfo').onclick=()=>document.dispatchEvent(new CustomEvent('nm:size-guide',{detail:p}));
 const sticky=el('div',undefined,'mobileBuy'),text=el('span',p.name),stickyButton=btn('Elegir talle',()=>{const main=choice.querySelector('.buy');if(!main.disabled)main.click();else{choice.scrollIntoView({block:'center',behavior:'instant'});choice.querySelector('fieldset:nth-of-type(2) button')?.focus({preventScroll:true})}},'buy');sticky.append(text,stickyButton);root.append(sticky);
 const sync=()=>stickyButton.textContent=state.size?'Agregar al carrito':'Elegir talle';choice.addEventListener('click',e=>{sync();if(!e.target.closest('fieldset button'))return;const u=new URL(location.href);u.searchParams.set('color',p.colors[state.color][1]);if(state.size)u.searchParams.set('talle',state.size);else u.searchParams.delete('talle');try{history.replaceState(null,'',u)}catch{}});sync();
 showProductLooks(p);showProductRelated(p);refreshSaved()
}
if($('#cover'))startCover();if($('#rack'))startRack();if($('#runwayStage'))startRunway();if($('#grid'))startCatalog();
if($('[data-product]'))startProduct();if($('#fullBag'))showBag(null,true);
refresh();
// A history restore may reopen the preceding bag after one counterpart was added.
window.addEventListener?.('pageshow',event=>{
 if(!event.persisted)return;
 const current=readCartSnapshot();if(!current)return;cart=current;
 if($('#fullBag'))showBag(null,true);
 if(drawer.open&&drawer.dataset.cart)showBag();
 refresh();
});

// The hanger preview supplies its exact variant only after closing its own dialog.
document.addEventListener('nm:cart-quick-add', event=>{
 const d=event.detail,p=byId.get(d?.productId);
 if(!p?.draft)return;
 const index=p.colors.findIndex(c=>c.name===d.color);
 if(index<0)return;
 const opener=d.opener?.isConnected?d.opener:null;
 if(draftSizes(p,index).length){quickDraft(p,index,opener);return}
 if(addDraft(p,index)){showBag();if(opener)lastDialogTrigger=opener;return}
 // At the quantity limit, keep the color selected in the drawer to show its existing feedback.
 quickDraft(p,index,opener);
});
