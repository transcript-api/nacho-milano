'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const el=(tag,txt,cl)=>{const x=document.createElement(tag);if(txt!==undefined)x.textContent=txt;if(cl)x.className=cl;return x};
const btn=(txt,fn,cl='control')=>{const x=el('button',txt,cl);x.type='button';x.addEventListener('click',fn);return x};
const image=(url,alt='',lazy=true)=>{const x=el('img');x.src=url;x.alt=alt;x.decoding='async';if(lazy)x.loading='lazy';return x};
const link=(txt,href,cl)=>{const x=el('a',txt,cl);x.href=href;return x};
const {products,looks:rawLooks}=window.NM_BUILD;
const draftProducts=window.NM_DRAFT||[];
const shopProducts=draftProducts.length?draftProducts:products;
const byId=new Map([...products,...draftProducts].map(p=>[p.id,p])), looks=rawLooks.filter(l=>l.items.every(i=>byId.has(i.id)));
const src=(id,view='frente')=>'assets/'+id+'-'+view+'.webp', url=(p,c=0)=>'producto-'+p.id+'.html'+(c?'?color='+encodeURIComponent(p.colors[c].name??p.colors[c][1]):'');
const displayColor=c=>c.name??c[0];
const draftPhoto=(c,view='front')=>c?.photos?.[view]||null;
const draftPlaceholder=()=>el('div','Fotos pendientes','draftBlank');
const num=(n)=>String(n).padStart(2,'0'), clamp=(x,a,z)=>Math.max(a,Math.min(x,z)), period=(x,n)=>((x%n)+n)%n;
const quiet=matchMedia('(prefers-reduced-motion: reduce)'), touch=matchMedia('(max-width:650px)');
const money=new Intl.NumberFormat('es-UY',{style:'currency',currency:'UYU',maximumFractionDigits:0});
const variantKey=(p,c,s)=>JSON.stringify([p.id,p.colors[c][1],s]);
const draftKey=(p,c)=>JSON.stringify([p.id,p.colors[c].name,null]);
const valid=new Map(), choices=new Map();
for(const p of products){p.colors.forEach((c,i)=>p.sizes.forEach(s=>valid.set(variantKey(p,i,s),{p,c,i,s})))}
for(const p of draftProducts)p.colors.forEach((c,i)=>valid.set(draftKey(p,i),{p,c,i,s:null}));
let saved=new Set();
try{saved=new Set(JSON.parse(localStorage.getItem('nm-saved-v3')||'[]').filter(id=>byId.has(id)))}catch{}
try{for(const [id,q] of JSON.parse(sessionStorage.getItem('nm-choices-v3')||'[]')){const p=byId.get(id);if(p&&p.colors[q.color]&&(q.size==null||p.sizes?.includes(q.size)))choices.set(id,{color:q.color,size:q.size,view:0})}}catch{}
const saveChoice=(p,s)=>{choices.set(p.id,{...s});try{sessionStorage.setItem('nm-choices-v3',JSON.stringify([...choices]))}catch{}};
function toggleSaved(p){saved.has(p.id)?saved.delete(p.id):saved.add(p.id);try{localStorage.setItem('nm-saved-v3',JSON.stringify([...saved]))}catch{};refreshSaved()}
function cardGlyph(kind){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');
 const paths=kind==='star'?['m12 2.75 2.78 5.65 6.22.9-4.5 4.38 1.07 6.19L12 16.95l-5.57 2.92 1.07-6.19L3 9.3l6.22-.9Z']:['M13 20.5H6a2.5 2.5 0 0 1-2.5-2.5V9.1h15.4v3.1','M7.2 9.1V6.6a3.3 3.3 0 0 1 6.6 0v2.5','M18.9 14.7v6.2M15.8 17.8h6.2'];
 for(const d of paths){const p=document.createElementNS(ns,'path');p.setAttribute('d',d);svg.append(p)}return svg;
}
function refreshSaved(){const n=$('#savedCount');if(n)n.textContent=saved.size;$$('[data-save]').forEach(x=>{const has=saved.has(x.dataset.save);x.setAttribute('aria-pressed',String(has));if(!x.classList.contains('cardSave'))x.textContent=x.classList.contains('productSave')&&!x.closest('.manlyProduct')?(has?'Guardado en favoritos':'Guardar en favoritos'):(has?'♥':'♡');x.setAttribute('aria-label',(has?'Quitar de guardados: ':'Guardar ')+byId.get(x.dataset.save).name)})}
let cart=new Map(), toastTimer, muteClick=0, lastDialogTrigger, dialogBack=null;
try{for(const [id,q] of JSON.parse(localStorage.getItem('nm-preview-v3')||'[]'))if(valid.has(id)&&Number.isInteger(q)&&q>0)cart.set(id,clamp(q,1,9))}catch{}
const drawer=$('#drawer'), body=$('#drawerBody');
function announce(t){$('#toast').textContent=t;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').textContent='',2700)}
function refresh(){try{localStorage.setItem('nm-preview-v3',JSON.stringify([...cart]))}catch{}const count=$('#bagCount'),qty=[...cart.values()].reduce((a,b)=>a+b,0);count.textContent=qty;count.hidden=!qty;count.parentElement.setAttribute('aria-label',qty?'Carrito, '+qty+(qty===1?' prenda':' prendas'):'Carrito, vacío');const added=new Set([...cart.keys()].map(id=>valid.get(id).p.id));$$('[data-mark]').forEach(x=>x.textContent=added.has(x.dataset.mark)?'✓':'+')}
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
 const ids=new Set(),frag=document.createDocumentFragment();let total=0;
 for(const [k,q] of cart){const {p,c,s}=valid.get(k);ids.add(p.id);if(p.price!=null)total+=p.price*q;
 const row=el('div',undefined,'lineItem'),copy=el('div');const photo=p.draft?draftPhoto(c):src(c[1],'rack');row.append(photo?image(photo,''):draftPlaceholder(),copy);copy.append(el('strong',p.name),el('p',(p.draft?c.name:c[0]+' · '+s)+' · '+q+(p.price!=null?' · '+money.format(p.price*q):'')));for(const [name,label,d] of [['−','Reducir',-1],['+','Aumentar',1],['Quitar','Quitar',-q]]){const x=btn(name,()=>{change(k,d);showBag([k,label],full)});x.dataset.k=k;x.dataset.op=label;x.setAttribute('aria-label',label+' '+p.name+' '+s);x.disabled=q>=9&&d>0;copy.append(x)}frag.append(row)}
 target.append(frag);if(total)target.append(el('p','Subtotal: '+money.format(total),'statusText'));target.append(actions);
 const matches=[...new Set(looks.filter(l=>l.items.some(i=>ids.has(i.id))).flatMap(l=>l.items.map(i=>i.id)))].filter(id=>!ids.has(id)).slice(0,2);
 if(matches.length){const more=el('section',undefined,'bagRelated');more.append(el('h3','Completá el look'));for(const id of matches){const p=byId.get(id);if(p.draft){more.append(link(p.name,url(p),'textLink'));continue}const x=makeLookRow(p,()=>quickDrawer(p,full?()=>{drawer.close();showBag(null,true)}:()=>showBag()));more.append(x)}target.append(more)}
 if(focus)([...target.querySelectorAll('[data-k]')].find(x=>x.dataset.k===focus[0]&&x.dataset.op===focus[1]&&!x.disabled)||actions.querySelector('a')).focus();refresh()
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
function addDraft(p,index){
 const key=draftKey(p,index);if(!change(key,1))return false;announce(p.name+' en el carrito');return true;
}
function quickDraft(p){
 openDrawer(p.name,'ELEGÍ EL COLOR');let i=readChoice(p).color;
 const media=el('div'),detail=link('Ver ficha →',url(p,i),'textLink');
 const status=el('p','','statusText');status.setAttribute('role','status');
 const paint=()=>{const photo=draftPhoto(p.colors[i]),img=photo?image(photo,p.name,false):draftPlaceholder();if(photo)img.className='drawerPhoto';media.replaceChildren(img);detail.href=url(p,i);status.textContent=''};
 const colors=selector('Color',p.colors.map(c=>[c.name]),()=>i,n=>{i=n;saveChoice(p,{color:i,size:null,view:0});colors.update();paint()});
 const add=btn('Agregar al carrito',()=>{if(addDraft(p,i))showBag();else status.textContent='Ya llegaste al máximo de unidades de este color.'},'buy');
 body.append(media,colors.field,add,status,detail);paint();
}
const zoom=$('#zoom');function openZoom(url,alt){const im=$('#zoomImage');im.src=url;im.alt=alt;zoom.showModal()}
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
function startCover(){const cover=$('#cover');if(!cover)return;const skip=$('#skipCover');let t,done,was;
 const show=()=>{clearTimeout(t);clearTimeout(done);was=document.activeElement;cover.hidden=false;cover.classList.remove('exiting');$('.bar').inert=true;$('main').querySelectorAll('section:not(.opening)').forEach(x=>x.inert=true);$('.hero').inert=true;$('.foot').inert=true;document.documentElement.classList.add('coverOpen');t=setTimeout(exit,1000)};
 const exit=()=>{if(cover.hidden||cover.classList.contains('exiting'))return;clearTimeout(t);cover.classList.add('exiting');done=setTimeout(()=>{const used=cover.contains(document.activeElement);cover.hidden=true;$('.bar').inert=false;$('main').querySelectorAll('section:not(.opening)').forEach(x=>x.inert=false);$('.hero').inert=false;$('.foot').inert=false;document.documentElement.classList.remove('coverOpen');if(used)(was===document.body?$('.heroLink'):was)?.focus({preventScroll:true});try{sessionStorage.setItem('nm-v3-seen','1')}catch{}},885)};
 skip.onclick=exit;$('#replay').onclick=()=>{window.scrollTo(0,0);show();skip.focus({preventScroll:true})};document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!cover.hidden)exit()});try{if(!quiet.matches&&!sessionStorage.getItem('nm-v3-seen')&&!location.hash)show()}catch{}
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
function outfitDrawer(look){
 openDrawer('Armá tu look',look.label);
 const selections=look.items.map(i=>({p:byId.get(i.id),state:{color:0,size:null,view:0}}));
 const summary=el('p','Elegí un talle por cada prenda que quieras agregar.','quiet');body.append(summary);
 const confirm=btn('Agregar a la bolsa',()=>{let n=0;for(const {p,state} of selections){if(state.size){const k=variantKey(p,state.color,state.size),d=change(k,1);if(d){n+=d;saveChoice(p,state)}}}if(n){const f=selections.find(s=>s.state.size);fly(confirm,f.p,f.state.color);announce(n===1?'1 prenda en la bolsa':n+' prendas en la bolsa');summary.textContent=n===1?'Agregamos 1 prenda.':'Agregamos '+n+' prendas.';confirm.disabled=true}else{summary.textContent='Ya llegaste al máximo de unidades para estos talles.'}},'buy');confirm.disabled=true;
 for(const {p,state} of selections){const row=el('section',undefined,'outfitRow'),heading=el('h3',p.name);const pic=image(src(p.colors[0][1],'rack'),'',false);const side=el('div');const each=selector('Talle de '+p.name,[['Sin elegir'],...p.sizes.map(s=>[s])],()=>state.size?p.sizes.indexOf(state.size)+1:0,i=>{state.size=i?p.sizes[i-1]:null;each.update();confirm.disabled=!selections.some(s=>s.state.size);summary.textContent='Elegí un talle por cada prenda que quieras agregar.'});
 side.append(heading,each.field);row.append(pic,side);body.append(row)}
 body.append(confirm);const status=summary;status.setAttribute('role','status')
}
function startRunway(){
 const stage=$('#runwayStage'),scene=$('#runwayScene'),port=$('#models'),pins=$('#pins'),info=$('#lookInfo'),all=$('#allLooks');let ix=0,focus=false;
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
 function place(){if(!focus)return;const fig=buttons[ix],p=stage.getBoundingClientRect();const baseW=fig.offsetWidth*1.075, baseH=fig.offsetHeight*1.075;const left=(p.width-baseW)/2,top=p.height*.86-baseH;[...pins.children].forEach((pin,n)=>{const [x,y]=anchors[ix]?.[n]||[.5,.3+n*.16];const offset=touch.matches&&n===1&&pins.children.length>2?20:0;pin.style.left=clamp(left+baseW*x+offset,24,p.width-24)+'px';pin.style.top=clamp(top+baseH*y,24,p.height-77)+'px'})}
 new ResizeObserver(place).observe(stage);
 function render(){const look=looks[ix];if(!look)return;scene.dataset.focus=String(focus);all.hidden=!focus;$('#lookIndex').textContent=num(ix+1)+' / '+num(looks.length);pins.replaceChildren();pins.setAttribute('aria-hidden',String(!focus));const list=el('ul');
 look.items.forEach((i,n)=>{const p=byId.get(i.id),row=el('li');if(p.draft){const a=link('',url(p),'lookItem lookItemLink');const photo=draftPhoto(p.colors[0]);a.append(photo?image(photo,''):draftPlaceholder(),el('span',p.name),el('span','↗'));row.append(a)}else row.append(makeLookRow(p,()=>quickDrawer(p)));list.append(row);if(focus){const pin=p.draft?link(String(n+1),url(p),'pin'):btn(String(n+1),()=>goTo(p),'pin');pin.setAttribute('aria-label','Ver '+p.name);pins.append(pin)}});
 info.replaceChildren(el('span',look.label,'smallCaps'),el('h3',look.name),el('p',look.copy),list);if(!focus)info.append(btn('Ver prendas del look →',()=>{setFocus(true);buttons[ix].focus({preventScroll:true})},'textLink'));if(!look.draft)info.append(btn('Armar el look',()=>outfitDrawer(look),'buy buildLook'));requestAnimationFrame(place);refresh()}
 all.onclick=()=>{setFocus(false);buttons[ix].focus({preventScroll:true})};$('#lookPrev').onclick=()=>select(ix-1);$('#lookNext').onclick=()=>select(ix+1);$('#looks').addEventListener('keydown',e=>{if(e.key==='Escape'&&focus){setFocus(false);buttons[ix].focus({preventScroll:true})}});render();
 const requested=Number(new URLSearchParams(location.search).get('look'))-1;
 if(Number.isInteger(requested)&&requested>=0&&requested<looks.length){select(requested);requestAnimationFrame(()=>setFocus(true))}
}
function startCatalog(){const filters=$('#filter'),grid=$('#grid');let active='Todo',opened=null,onlySaved=false,sort='featured';
 const search=$('#catalogSearch'),toggleSavedFilter=$('#savedFilter'),sorter=$('#sortCatalog'),letters=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const cats=['Todo',...new Set(shopProducts.map(p=>p.category))], preview=$('#catalogo').dataset.preview==='true';
 if(!preview)try{const stored=JSON.parse(sessionStorage.getItem('nm-catalog-filter-v3')||'{}');if(cats.includes(stored.active))active=stored.active;search.value=typeof stored.q==='string'?stored.q:'';onlySaved=stored.onlySaved===true;if(['az','za'].includes(stored.sort))sort=stored.sort}catch{}
 if(!preview){const params=new URLSearchParams(location.search);if(params.has('categoria')||params.has('q')){active=cats.includes(params.get('categoria'))?params.get('categoria'):'Todo';search.value=params.get('q')||'';onlySaved=false;sort='featured';try{history.replaceState(null,'',location.pathname)}catch{}}sorter.value=sort}
 const persist=()=>{if(!preview)try{sessionStorage.setItem('nm-catalog-filter-v3',JSON.stringify({active,q:search.value,onlySaved,sort}))}catch{}};
 search.addEventListener('input',()=>{opened=null;persist();draw()});toggleSavedFilter.onclick=()=>{opened=null;onlySaved=!onlySaved;persist();draw()};
 sorter.onchange=()=>{sort=sorter.value;opened=null;persist();draw()};$('#resetCatalog').onclick=()=>{active='Todo';onlySaved=false;search.value='';sort='featured';sorter.value=sort;opened=null;persist();draw();search.focus()};if(!preview)persist();
 const keys=cats.map(cat=>{const b=btn(cat,()=>{active=cat;opened=null;persist();draw()},'');filters.append(b);return b});
 function draw(){toggleSavedFilter.setAttribute('aria-pressed',String(onlySaved));keys.forEach((b,i)=>b.setAttribute('aria-pressed',String(cats[i]===active)));const q=letters(search.value.trim());const featured=['tejido','polo','pantalon','chaleco'].map(id=>byId.get(id)).filter(Boolean);const result=draftProducts.length?draftProducts:preview?[...featured,...products.filter(p=>!featured.includes(p))]:products;const shown=result.filter(p=>(active==='Todo'||p.category===active)&&(!onlySaved||saved.has(p.id))&&(!q||q.split(/\s+/).every(t=>letters([p.name,p.category,p.line,...p.colors.map(displayColor)].join(' ')).includes(t))));if(sort!=='featured')shown.sort((a,b)=>a.name.localeCompare(b.name,'es')*(sort==='za'?-1:1));$('#noMatches').hidden=shown.length!==0;$('#catalogCount').textContent=shown.length+(shown.length===1?' PRENDA':' PRENDAS');grid.replaceChildren();const fragment=document.createDocumentFragment();
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
  if(p.price!=null)line.append(el('p','$'+new Intl.NumberFormat('es-UY').format(p.price)+' UYU','cardPrice'));
  if(p.colors.length>1)line.append(el('p',p.colors.length+' colores','colorNote'));
  visual.prepend(pic);visual.append(save);card.append(visual,line);fragment.append(card)
 }
 grid.append(fragment);refreshSaved()}
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
 for(const [look,i] of pairs){const a=link('','index.html?look='+(i+1)+'#looks');const info=el('div');info.append(el('span',look.name));if(p.colors.length>1)info.append(el('small','En '+displayColor(p.colors[0]).toLocaleLowerCase('es-UY')));a.append(image('assets/'+look.photo+'.webp',''),info);row.append(a)}
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
 const params=new URLSearchParams(location.search), requested=params.get('color');
 const media=$('#productMedia'), choice=$('#productChoice'), save=$('#productSave');
 let index=Math.max(0,p.colors.findIndex(c=>c.name===requested));
 save.dataset.save=p.id;save.onclick=()=>toggleSaved(p);
 const wrap=el('div',undefined,'buyForm draftChoice');
 const colors=selector('Colores del catálogo',p.colors.map(c=>[c.name]),()=>index,i=>{
   index=i;colors.update();paint();
   try{const u=new URL(location.href);u.searchParams.set('color',p.colors[index].name);history.replaceState(null,'',u)}catch{}
 });
 const status=el('p','','statusText');status.setAttribute('role','status');
 const add=btn('Agregar al carrito',()=>{if(addDraft(p,index))showBag();else status.textContent='Ya llegaste al máximo de unidades de este color.'},'buy');
 const row=el('div',undefined,'purchaseRow');row.append(add,save);wrap.append(colors.field,row,status);choice.append(wrap);showProductLooks(p);refreshSaved();
 function paint(){
   const c=p.colors[index];const views=[['front','Frente'],['back','Espalda'],['texture','Textura']].filter(([k])=>draftPhoto(c,k));
   if(!views.length){media.replaceChildren(draftPlaceholder());return}
   const group=el('div',undefined,'draftGallery'),track=el('div',undefined,'productGalleryTrack'),thumbs=el('div',undefined,'productThumbs draftThumbs');
   track.tabIndex=0;track.setAttribute('aria-label','Fotos del producto');track.setAttribute('role','region');
   const go=i=>track.scrollTo({left:i*track.clientWidth,behavior:quiet.matches?'instant':'smooth'});
   for (const [i,[k,name]] of views.entries()){
     const path=draftPhoto(c,k), alt=p.name+' · '+c.name+' · '+name+(c.illustration?' · Imagen ilustrativa':'');
     const big=btn('',()=>openZoom(path,alt),'productGallerySlide');big.append(image(path,alt,i!==0));big.setAttribute('aria-label','Ampliar: '+name);track.append(big);
     const thumb=btn('',()=>go(i),'productThumb');thumb.setAttribute('aria-label','Ver foto: '+name);thumb.setAttribute('aria-current',String(i===0));thumb.append(image(path));thumbs.append(thumb);
   }
   track.addEventListener('scroll',()=>{const cur=Math.round(track.scrollLeft/(track.clientWidth||1));[...thumbs.children].forEach((t,i)=>t.setAttribute('aria-current',String(i===cur)))},{passive:true});
   track.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();go(clamp(Math.round(track.scrollLeft/(track.clientWidth||1))+(e.key==='ArrowRight'?1:-1),0,views.length-1))});
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
