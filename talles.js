/* Advice compares a flat garment's width against a verified chart, never body or inventory. */
((root)=>{
 'use strict';
 const parseCm=value=>{
  const input=String(value??'').trim();
  if(!/^[0-9]{1,3}(?:[.,][0-9]{1,2})?(?:\s*cm)?$/i.test(input))return null;
  const units=Math.round(Number.parseFloat(input.replace(',','.'))*100);
  return units>0?units:null;
 };
 const toUnits=x=>Math.round(x*100);
 const sortedRows=(rows)=>Array.isArray(rows)?rows.filter(row=>row&&/^[A-Z]{1,4}$/.test(row.size)&&Number.isFinite(row.widthCm)&&row.widthCm>0&&row.widthCm<=999).map(row=>({size:row.size,widthCm:row.widthCm})).sort((a,b)=>a.widthCm-b.widthCm):[];
 function compare(value,chart){
  const rows=sortedRows(chart);
  if(rows.length<2||new Set(rows.map(x=>x.size)).size!==rows.length||new Set(rows.map(x=>toUnits(x.widthCm))).size!==rows.length)return {kind:'no_chart'};
  const units=parseCm(value);
  if(units===null)return {kind:'invalid'};
  const range={min:rows[0].widthCm,max:rows.at(-1).widthCm};
  if(units<toUnits(range.min)||units>toUnits(range.max))return {kind:'outside',range};
  const next=rows.findIndex(r=>toUnits(r.widthCm)>=units);
  const high=rows[next];
  if(toUnits(high.widthCm)===units)return {kind:'exact',best:high,range};
  const low=rows[next-1], lowerDistance=units-toUnits(low.widthCm), upperDistance=toUnits(high.widthCm)-units;
  if(lowerDistance===upperDistance)return {kind:'tie',low,high,range};
  return {kind:'between',best:lowerDistance<upperDistance?low:high,low,high,range};
 }
 function compareBody(value,chart){
  const rows=sortedRows(chart);
  if(compare('',rows).kind==='no_chart')return {kind:'no_chart'};
  const input=parseCm(value);
  if(input===null)return {kind:'invalid'};
  const range={min:2*rows[0].widthCm,max:2*rows.at(-1).widthCm};
  if(input<toUnits(range.min)||input>toUnits(range.max))return {kind:'body_outside',range};
  return {kind:'body_reference',best:rows.find(r=>2*toUnits(r.widthCm)>=input),range};
 }
 if(typeof module==='object'&&module.exports)module.exports={compare,compareBody,parseCm};
 const doc=root?.document;
 if(!doc)return;
 const copy={
  'es-UY':{
   heading:'Encontrá tu talle', guide:'Guía de talles', selected:'Color elegido:', colors:'Otros colores', material:'Tela y detalles',
   oneColor:'Por ahora, este es el único color publicado para este modelo.', notDescribed:'Todavía no tenemos más detalles confirmados para este modelo.',
   instruction:'Con una sola medida podés ver qué talle te conviene comparar primero.',
   modes:'Cómo vas a medir', body:'Mi cintura', flat:'Otro short', button:'Ver mi talle',
   bodyField:'Contorno de cintura (cm)', bodyHint:'Rodeá con la cinta la parte donde te queda la cintura del short, sin apretarla.',
   flatField:'Ancho de cintura del short (cm)', flatHint:'Apoyá un short que te quede bien y medí de lado a lado, sin estirar el elástico.',
   bodyResult:(size,x)=>'Empezá comparando con el talle '+size+'. Su cintura mide '+x+' cm de ancho en plano.',
   bodyOutside:(a,b)=>'Tu contorno está fuera de la referencia de '+a+' a '+b+' cm. Con esta tabla no podemos sugerirte un talle.',
   bodyNote:'Para orientarte duplicamos el ancho de la prenda sin estirar. No es una tabla corporal ni garantiza el calce.',

   missing:'Todavía no tenemos una tabla de medidas confirmada para este modelo.', contact:'Consultar por este modelo',
   variability:'El resultado orienta: el calce también depende de otras medidas. El ancho puede variar según el color y la partida.',
   invalid:'Ingresá un ancho en centímetros. Por ejemplo, 42 o 42,5.',
   outside:(a,b)=>'La tabla va de '+a+' a '+b+' cm de ancho. No alcanza para sugerirte un talle. Revisá que hayas medido el short en plano y no el contorno de tu cintura.',
   exact:(size,x)=>'El talle '+size+' coincide con tu medida: '+x+' cm de ancho.',
   between:(size,x,other,y)=>'El talle más cercano es '+size+' ('+x+' cm). El otro talle cercano es '+other+' ('+y+' cm).',
   tie:(lo,x,hi,y)=>'Tu medida queda justo entre '+lo+' ('+x+' cm) y '+hi+' ('+y+' cm). Si preferís más espacio en la cintura, compará primero con '+hi+'.'
  },
  'pt-BR':{
   heading:'Encontre seu tamanho', guide:'Guia de tamanhos', selected:'Cor escolhida:', colors:'Outras cores', material:'Tecido e detalhes',
   oneColor:'Por enquanto, esta é a única cor publicada para este modelo.', notDescribed:'Ainda não temos mais detalhes confirmados para este modelo.',
   instruction:'Com uma única medida, veja qual tamanho vale comparar primeiro.',
   modes:'Como você vai medir', body:'Minha cintura', flat:'Outro short', button:'Ver meu tamanho',
   bodyField:'Circunferência da cintura (cm)', bodyHint:'Passe a fita ao redor do corpo na altura do cós do short, sem apertar.',
   flatField:'Largura da cintura do short (cm)', flatHint:'Estenda um short que vista bem e meça de um lado ao outro, sem esticar o elástico.',
   bodyResult:(size,x)=>'Comece comparando com o tamanho '+size+'. O cós mede '+x+' cm de largura com a peça estendida.',
   bodyOutside:(a,b)=>'Sua circunferência está fora da referência de '+a+' a '+b+' cm. Com esta tabela, não dá para sugerir um tamanho.',
   bodyNote:'Para orientar, duplicamos a largura da peça sem esticar. Não é uma tabela de medidas do corpo nem uma garantia de caimento.',

   missing:'Ainda não temos uma tabela de medidas confirmada para este modelo.', contact:'Consultar sobre este modelo',
   variability:'Use o resultado como referência: o caimento também depende de outras medidas. A largura pode variar por cor e lote.',
   invalid:'Informe uma largura em centímetros. Por exemplo, 42 ou 42,5.',
   outside:(a,b)=>'A tabela vai de '+a+' a '+b+' cm de largura. Não dá para sugerir um tamanho. Confira se você mediu o short estendido e não a circunferência da cintura.',
   exact:(size,x)=>'O tamanho '+size+' corresponde à sua medida: '+x+' cm de largura.',
   between:(size,x,other,y)=>'O tamanho mais próximo é '+size+' ('+x+' cm). O outro tamanho próximo é '+other+' ('+y+' cm).',
   tie:(lo,x,hi,y)=>'Sua medida fica entre '+lo+' ('+x+' cm) e '+hi+' ('+y+' cm). Se preferir mais folga na cintura, compare primeiro com '+hi+'.'
  }
 };
 const make=(tag,attrs)=>{
  const e=doc.createElement(tag);
  for(const [k,v] of Object.entries(attrs??{}))e.setAttribute(k,v);
  return e;
 };
 function mount(box){
  if(box.dataset.ready)return;
  box.dataset.ready='1';
  const heading=box.querySelector('[data-nm-size-title]'), instruction=box.querySelector('[data-nm-size-copy]');
  const app=box.querySelector('[data-nm-size-app]'), contact=box.querySelector('.nmSize__contact');
  const rows=[...box.querySelectorAll('tbody tr')].map(r=>({size:r.cells[0]?.textContent.trim(),widthCm:Number(r.cells[1]?.textContent.trim())}));
  const known=compare('',rows).kind!=='no_chart';
  const pdp=box.closest('[data-product]'), productId=pdp?.dataset.product;
  const product=(root.NM_DRAFT||[]).find(record=>record.id===productId);
  const choiceControls=pdp?.querySelector('#productChoice');
  const activeColor=()=>{
   const pressed=[...(choiceControls?.querySelectorAll('.draftChoice fieldset button')||[])].findIndex(e=>e.getAttribute('aria-pressed')==='true');
   const fromURL=new URLSearchParams(root.location.search).get('color');
   return product?.colors[pressed]?.name||product?.colors.find(c=>c.name===fromURL)?.name||product?.colors[0]?.name||null;
  };
  // This small widget owns its copy; the site's general translator still handles the static table.
  heading.setAttribute('data-nm-locale','1');instruction.setAttribute('data-nm-locale','1');
  if(contact)contact.setAttribute('data-nm-locale','1');
  app.setAttribute('data-nm-locale','1');
  const form=make('form',{class:'nmSize__form',novalidate:''}), label=make('label',{for:'nmSizeMeasure'});
  const modes=make('div',{class:'nmSize__modes',role:'group'});
  const body=make('button',{type:'button','aria-pressed':'true'}),flat=make('button',{type:'button','aria-pressed':'false'});modes.append(body,flat);
  const input=make('input',{id:'nmSizeMeasure',class:'nmSize__input',type:'text',inputmode:'decimal',autocomplete:'off',spellcheck:'false',maxlength:'14','aria-describedby':'nmSizeHint'});
  const action=make('div',{class:'nmSize__action'}), button=make('button',{type:'submit'}), hint=make('p',{id:'nmSizeHint',class:'nmSize__hint'});
  const answer=make('p',{class:'nmSize__answer',role:'status','aria-live':'polite','aria-atomic':'true'});
  const caveat=make('p',{class:'nmSize__hint nmSize__caveat'});caveat.hidden=true;
  let result=null, mode='body';
  const locale=()=>doc.documentElement.lang==='pt-BR'?'pt-BR':'es-UY';
  const current=()=>Object.freeze({productId,color:activeColor(),locale:locale(),evidenceId:known?'short-linho-flat-waist-v1':null});
  if(product)root.NM_SIZE_CONTEXT=Object.freeze({current});
  const productBox=make('div',{class:'nmSize__product','data-nm-locale':'1'}), selected=make('p',{class:'nmSize__color'});
  const extras=make('div',{class:'nmSize__extras'}), colors=make('button',{type:'button','aria-expanded':'false','aria-controls':'nmSizeProductAnswer'}), material=make('button',{type:'button','aria-expanded':'false','aria-controls':'nmSizeProductAnswer'});
  const detail=make('p',{id:'nmSizeProductAnswer',class:'nmSize__detail'});detail.hidden=true;
  let info=null;
  function paintProduct(){
   if(!product)return;
   const lang=locale(), t=copy[lang], actualColor=activeColor();
   const local=s=>root.NM_LANG?.t(s,lang)??s;
   selected.textContent=actualColor?t.selected+' '+local(actualColor):'';
   colors.textContent=t.colors;material.textContent=t.material;
   colors.setAttribute('aria-expanded',String(info==='colors'));material.setAttribute('aria-expanded',String(info==='material'));
   detail.hidden=!info;
   if(info==='colors'){
    const alternatives=product.colors.filter(c=>c.name!==actualColor).map(c=>local(c.name));
    detail.textContent=alternatives.length?(typeof Intl.ListFormat==='function'?new Intl.ListFormat(lang).format(alternatives):alternatives.join(', ')):t.oneColor;
   } else if(info==='material'){
    detail.textContent=product.description?local(product.description):t.notDescribed;
   } else detail.textContent='';
  }
  if(product){
   extras.append(colors,material);productBox.append(selected,extras,detail);
   app.before(productBox);
   colors.addEventListener('click',()=>{info=info==='colors'?null:'colors';paintProduct()});
   material.addEventListener('click',()=>{info=info==='material'?null:'material';paintProduct()});
   // The PDP updates the accessible pressed state and history synchronously.
   // Observe only the commerce controls; changing the helper cannot feed back.
   if(choiceControls&&typeof MutationObserver==='function'){
    new MutationObserver(paintProduct).observe(choiceControls,{subtree:true,attributes:true,attributeFilter:['aria-pressed']});
   }
   root.addEventListener('popstate',paintProduct);
  }
  const paintResult=()=>{
   const lang=locale(), t=copy[lang], local=new Intl.NumberFormat(lang,{maximumFractionDigits:2}), f=n=>local.format(n);
   caveat.hidden=true;
   if(!result){answer.textContent='';delete answer.dataset.result;input.removeAttribute('aria-invalid');return}
   answer.dataset.result=result.kind;
   input.setAttribute('aria-invalid',String(result.kind==='invalid'));
   if(result.kind==='invalid')answer.textContent=t.invalid;
   else if(result.kind==='outside')answer.textContent=t.outside(f(result.range.min),f(result.range.max));
   else if(result.kind==='body_outside'){answer.textContent=t.bodyOutside(f(result.range.min),f(result.range.max));caveat.hidden=false}
   else if(result.kind==='body_reference'){answer.textContent=t.bodyResult(result.best.size,f(result.best.widthCm));caveat.hidden=false}
   else {
    const {kind,best,low,high}=result;
    if(kind==='exact')answer.textContent=t.exact(best.size,f(best.widthCm));
    else if(kind==='tie')answer.textContent=t.tie(low.size,f(low.widthCm),high.size,f(high.widthCm));
    else if(kind==='between'){
     const other=best===low?high:low;
     answer.textContent=t.between(best.size,f(best.widthCm),other.size,f(other.widthCm));
    }
    caveat.hidden=false;
   }
  };
  const paint=()=>{
   const t=copy[locale()];
   heading.textContent=known?t.heading:t.guide;
   instruction.textContent=known?t.instruction:t.missing;
   if(contact)contact.textContent=t.contact;
   paintProduct();
   if(!known)return;
   const useBody=mode==='body';
   modes.setAttribute('aria-label',t.modes);body.textContent=t.body;flat.textContent=t.flat;
   body.setAttribute('aria-pressed',String(useBody));flat.setAttribute('aria-pressed',String(!useBody));
   label.textContent=useBody?t.bodyField:t.flatField;hint.textContent=useBody?t.bodyHint:t.flatHint;
   button.textContent=t.button;caveat.textContent=useBody?t.bodyNote+' '+t.variability:t.variability;paintResult();
  };
  if(known){
   action.append(input,button);form.append(modes,label,action,hint,answer,caveat);app.append(form);app.hidden=false;
   const setMode=next=>{if(next!==mode){mode=next;input.value='';result=null;paint()}};
   body.addEventListener('click',()=>setMode('body'));flat.addEventListener('click',()=>setMode('flat'));
   form.addEventListener('submit',e=>{e.preventDefault();result=(mode==='body'?compareBody:compare)(input.value,rows);paintResult();if(result.kind==='invalid')input.focus()});
   input.addEventListener('input',()=>{if(result){result=null;paintResult()}});
  }
  paint();doc.addEventListener('nm:idioma',paint);
 }
 for(const box of doc.querySelectorAll('[data-nm-size]'))mount(box);
})(typeof window!=='undefined'?window:null);
