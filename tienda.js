'use strict';
(function(){
 const s=document.querySelector('#shopSearch'), guide=document.querySelector('#sizeGuide');
 if(!s||!guide)return;
 const q=s.querySelector('input'), results=s.querySelector('#shopResults');
 const canon=x=>x.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 function paint(){
  const value=q.value.trim(), terms=canon(value).split(/\s+/).filter(Boolean);
  const found=terms.length?shopProducts.filter(p=>terms.every(t=>canon([p.name,p.category,p.line,...p.colors.map(displayColor)].filter(Boolean).map(t=>window.NM_LANG?.aliases(t)??t).join(' ')).includes(t))).slice(0,5):[];
  results.replaceChildren();
  if(!terms.length){results.append(el('p','Probá con el nombre de una prenda o un color.'));return}
  if(!found.length){results.append(el('p','No encontramos prendas con ese nombre.'));return}
  found.forEach(p=>{const i=p.colors.findIndex(c=>terms.some(t=>canon(window.NM_LANG?.aliases(displayColor(c))??displayColor(c)).includes(t))),color=Math.max(0,i);
   const a=link('',url(p,color),'shopHit'), name=el('span',p.name+(i>=0?' · '+displayColor(p.colors[i]):''));const c=p.colors[color],f=p.draft?draftPhoto(c):src(c[1]);a.append(f?image(f,''):draftPlaceholder(),name);results.append(a)});
 }
 document.querySelectorAll('[data-search]').forEach(b=>b.addEventListener('click',()=>{s.showModal();paint();q.focus()}));
 q.addEventListener('input',paint);
 document.addEventListener('nm:size-guide',({detail:p})=>{
   if(!p||!Array.isArray(p.sizes))return;
   const b=guide.querySelector('#sizeGuideBody'), labels=p.category==='Pantalones'?['Cintura: medí de lado a lado a la altura de la pretina.','Largo: medí desde la cintura hasta el ruedo.']:['Ancho: medí de axila a axila.','Largo: medí desde el hombro hasta el borde inferior.'];
   const list=el('ul');labels.forEach(x=>list.append(el('li',x)));
   b.replaceChildren(el('p',p.name+' · Talles de muestra: '+p.sizes.join(', ')+'.'),el('p','Para comparar cuando estén las medidas, apoyá una prenda que te quede bien sobre una superficie plana, sin estirarla.'),list,el('p','Las medidas de esta prenda todavía no están publicadas.','quiet'));guide.showModal();
 });
 const header=document.getElementById('bar');
 if(header){
  const reveal=()=>{header.dataset.tucked='false'};
  let last=window.scrollY,direction=0,travel=0,queued=false;
  const threshold=()=>{const intro=document.getElementById('primera-coleccion');return intro?Math.max(header.offsetHeight,intro.getBoundingClientRect().top+scrollY-header.offsetHeight):100};
  function scrolled(){
   queued=false;const y=Math.max(0,scrollY),delta=y-last;last=y;
   if(y<=threshold()){travel=0;direction=0;reveal();return}
   if(Math.abs(delta)<.5)return;
   const d=Math.sign(delta);
   if(d!==direction){direction=d;travel=0}
   travel+=Math.abs(delta);
   const focused=header.contains(document.activeElement)&&document.activeElement.matches(':focus-visible');
   if(d<0&&travel>=9||focused)reveal();
   else if(d>0&&travel>=16)header.dataset.tucked='true';
  }
  window.addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(scrolled)}},{passive:true});
  header.addEventListener('focusin',reveal);reveal()
 }
 const help=['#talles','#envios','#cambios','#pedidos'].includes(location.hash)?document.querySelector(location.hash):null;
 if(help?.tagName==='DETAILS')help.open=true;
})();
