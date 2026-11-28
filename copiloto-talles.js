((root) => {
  'use strict';
  // Short Linho Ultra Premium / Natural: supplier image 5178.
  // Width is measured flat without stretching. Length is the total garment length.
  const reference = Object.freeze([['P',40,42],['M',42,43],['G',45,44],['GG',48,45]].map(Object.freeze));
  const shortId = 'nm-short-linho-ultra-premium';
  function measure(value, height = false) {
    const str = String(value ?? '').trim().toLowerCase().replace(',', '.');
    const m = /^(\d{1,3}(?:\.\d{1,2})?)\s*(cm|m)?$/.exec(str);
    if (!m) return null;
    const n = Number(m[1]);
    const cm = height && (m[2] === 'm' || (!m[2] && n < 3)) ? n * 100 : n;
    if ((!height && m[2] === 'm') || cm < (height ? 100 : 15) || cm > (height ? 230 : 180)) return null;
    return Math.round(cm * 100) / 100;
  }
  function assess(ctx, {height, waist, mode} = {}) {
    const h = measure(height, true);
    if (String(height ?? '').trim() && h === null) return {kind:'heightError'};
    const hasChart = ctx?.productId === shortId && ctx.color === 'Natural';
    if (!hasChart) return {kind:'unverified', height:h};
    if (!String(waist ?? '').trim()) return {kind:'ask', height:h};
    const w = measure(waist);
    if (w === null) return {kind:'waistError', height:h};
    const flat = mode === 'flat';
    const width = flat ? w : w / 2;
    if (width < reference[0][1] || width > reference[3][1]) return {kind:'outside', height:h, flat};
    const max = reference.findIndex(row => row[1] >= width);
    if (reference[max][1] === width) return {kind:'match', row:reference[max], height:h, flat};
    const adjacent = [reference[max - 1],reference[max]];
    if (!flat) return {kind:'compare', row:adjacent[1], neighbor:adjacent[0], height:h, flat};
    const d0 = Math.round((width-adjacent[0][1])*100), d1 = Math.round((adjacent[1][1]-width)*100);
    if (d0 === d1) return {kind:'between', rows:adjacent, height:h, flat};
    return {kind:'compare', row:adjacent[d0<d1?0:1], neighbor:adjacent[d0<d1?1:0], height:h, flat};
  }
  if (typeof module === 'object' && module.exports) module.exports = {assess,measure,reference};
  const doc = root?.document;
  if (!doc || !doc.querySelector('[data-product]')) return;
  const readContext = () => root.NM_PRODUCT_CONTEXT?.current();
  const pt = () => doc.documentElement.lang.toLowerCase().startsWith('pt');
  const language = () => pt() ? 'pt-BR' : 'es-UY';
  const t = (es,br) => pt() ? br : es;
  const n = v => new Intl.NumberFormat(language(),{maximumFractionDigits:2}).format(v);
  const h = (tag, attrs={}, text='') => {
    const e=doc.createElement(tag);
    for (const [k,v] of Object.entries(attrs)) e.setAttribute(k,v);
    e.textContent=text;
    return e;
  };
  const trigger=h('button',{type:'button',class:'nmFitTrigger','aria-haspopup':'dialog','aria-controls':'nmFitCopilot','data-nm-locale':'1'});
  const icon=doc.createElementNS('http://www.w3.org/2000/svg','svg');
  icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('aria-hidden','true');
  const path=doc.createElementNS(icon.namespaceURI,'path');
  path.setAttribute('d','M5 19l14-14 3 3L8 22zM8 16l2 2m1-5 2 2m1-5 2 2m1-5 2 2');
  icon.append(path);
  const triggerText=h('span');trigger.append(icon,triggerText);
  const dialog=h('dialog',{id:'nmFitCopilot',class:'nmFitDialog','aria-labelledby':'nmFitTitle','data-nm-locale':'1'});
  const header=h('header');const title=h('h2',{id:'nmFitTitle'});
  const close=h('button',{type:'button',class:'nmFitClose'},'×');header.append(title,close);
  const context=h('p',{class:'nmFitContext'});const intro=h('p',{class:'nmFitIntro'});
  const form=h('form',{novalidate:''});const height=h('input',{id:'nmFitHeight',type:'text',inputmode:'decimal',autocomplete:'off',maxlength:'10',placeholder:'1,78'});
  const heightLabel=h('label',{for:height.id});
  const waist=h('input',{id:'nmFitWaist',type:'text',inputmode:'decimal',autocomplete:'off',maxlength:'10','aria-describedby':'nmFitHint'});
  const waistLabel=h('label',{for:waist.id});
  const mode=h('select',{id:'nmFitMode'});
  mode.append(h('option',{value:'body'}),h('option',{value:'flat'}));
  const modeLabel=h('label',{for:mode.id});
  const measureGroup=h('div',{class:'nmFitMeasure'});
  const hint=h('p',{id:'nmFitHint'});
  measureGroup.append(modeLabel,mode,waistLabel,waist,hint);
  const submit=h('button',{type:'submit',class:'nmFitSubmit'});
  const answer=h('p',{class:'nmFitAnswer',role:'status','aria-live':'polite','aria-atomic':'true'});
  const details=h('details');const summary=h('summary');const list=h('ul');
  details.append(summary,list);form.append(heightLabel,height,measureGroup,submit,answer,details);
  dialog.append(header,context,intro,form);doc.body.append(trigger,dialog);
  let ctx=null;
  const hasTable=()=>ctx?.productId===shortId&&ctx.color==='Natural';
  const lower=()=>/(short|calca|bermuda)/.test(ctx?.productId??'');
  const rowText=([size,w,len])=>t(size+': '+n(w)+' cm de cintura en plano y '+n(len)+' cm de largo.',size+': '+n(w)+' cm de cós com a peça estendida e '+n(len)+' cm de comprimento.');
  function paint() {
    ctx=readContext();
    const p=(root.NM_DRAFT??[]).find(x=>x.id===ctx?.productId);
    const local=s=>root.NM_LANG?.t(s,language())??s;
    triggerText.textContent=t('¿Qué talle me queda?', 'Qual é o meu tamanho?');
    title.textContent=t('Ayuda con el talle','Ajuda com o tamanho');
    close.setAttribute('aria-label',t('Cerrar','Fechar'));
    context.textContent=p ? local(p.name)+(ctx.color?' · '+local(ctx.color):'') : '';
    intro.textContent=t('La altura ayuda a pensar en el largo. Para elegir talle también importa cómo te queda de ancho.','A altura ajuda a avaliar o comprimento. Para escolher o tamanho, a largura também importa.');
    heightLabel.textContent=t('Tu altura (opcional)', 'Sua altura (opcional)');
    modeLabel.textContent=t('¿Qué podés medir?', 'O que você pode medir?');
    mode.options[0].textContent=t('Mi cintura','Minha cintura');
    mode.options[1].textContent=t('Un short que me queda bien','Um short que já veste bem');
    const flat=mode.value==='flat';
    waistLabel.textContent=flat?t('Cintura del short, de lado a lado (cm)','Largura do cós do short (cm)'):t('Contorno de tu cintura (cm)','Circunferência da sua cintura (cm)');
    hint.textContent=flat?t('Apoyalo en plano y medí sin estirar el elástico.','Estenda a peça e meça sem esticar o elástico.'):t('Rodeá con la cinta la parte donde te queda el short, sin apretar.','Passe a fita na altura do cós, sem apertar.');
    waist.placeholder=flat?'42':'84';
    submit.textContent=t('Orientame','Quero uma orientação');
    measureGroup.hidden=!hasTable();
    details.hidden=!hasTable();
    summary.textContent=t('Medidas de esta prenda', 'Medidas desta peça');
    list.replaceChildren(...reference.map(row=>h('li',{},rowText(row))));
  }
  function respond(result){
    const {kind,flat,row,rows,neighbor,height:stature}=result;
    const lengthTip=stature?t('Para tu altura de '+n(stature)+' cm, medí desde donde usás la cintura hasta donde querés que termine el short. Compará ese largo con el de la tabla.','Com '+n(stature)+' cm de altura, meça do ponto onde usa o cós até onde quer que termine o short. Compare esse comprimento com a tabela.'):'';
    if(kind==='heightError')return t('Revisá la altura. Podés escribir 178 cm, 1,78 o dejarla en blanco.','Confira a altura. Você pode escrever 178 cm, 1,78 ou deixar em branco.');
    if(kind==='unverified'){
      const labels=(ctx?.sizes??[]).join(', ');
      const measures=lower()?t('cintura y largo','cós e comprimento'):t('ancho de pecho y largo','largura do peito e comprimento');
      return (stature?t('Con '+n(stature)+' cm de altura todavía falta una medida de ancho. ','Com '+n(stature)+' cm de altura, ainda falta uma medida de largura. '):'')+(labels?t('Este modelo tiene '+labels+'. ','Este modelo tem '+labels+'. '):'')+
        t('No tenemos las medidas verificadas de este modelo. Para orientarte mejor, compará '+measures+' con una prenda que ya te quede bien; no te asigno un talle por altura sola.','Ainda não temos as medidas confirmadas deste modelo. Para avaliar melhor, compare '+measures+' com uma peça que já veste bem; a altura sozinha não determina o tamanho.');
    }
    if(kind==='ask')return t('Pasame tu cintura o el ancho de un short que te queda bien. La altura sola no distingue entre estos talles.','Informe sua cintura ou a largura de um short que já veste bem. A altura sozinha não diferencia estes tamanhos.')+(lengthTip?' '+lengthTip:'');
    if(kind==='waistError')return t('Ingresá la medida de cintura en centímetros.','Informe a medida do cós em centímetros.');
    if(kind==='outside')return flat?t('Las medidas verificadas van de 40 a 48 cm en plano. No te recomendaría un talle sin otra referencia.','As medidas confirmadas vão de 40 a 48 cm com a peça estendida. Não recomendo um tamanho sem outra referência.'):t('Tu medida queda fuera de la referencia. Medí un short que te quede bien en plano para comparar.','Sua medida fica fora da referência. Para comparar, meça um short que já veste bem com a peça estendida.');
    if(kind==='between')return t('Quedás entre dos talles. Si preferís más espacio, mirá primero el mayor. ','Você fica entre dois tamanhos. Se preferir mais folga, veja primeiro o maior. ')+rows.map(rowText).join(' ')+(lengthTip?' '+lengthTip:'');
    return t('Empezá comparando con '+row[0]+'. ','Comece comparando com '+row[0]+'. ')+rowText(row)+(neighbor?' '+t('También podés comparar ','Você também pode comparar ')+rowText(neighbor):'')+' '+(flat?t('Para el largo, comparalo con tu short puesto o medido desde la cintura hasta el borde.','Para avaliar o comprimento, compare com seu short, do cós à barra.'):t('Es una referencia sin estirar el elástico. Para afinar el calce y el largo, comparalo con un short tuyo.','É uma referência com o elástico sem esticar. Para avaliar o caimento e o comprimento, compare com um short seu.'))+(lengthTip?' '+lengthTip:'');
  }
  trigger.addEventListener('click',()=>{if(!readContext()||dialog.open)return;form.reset();answer.textContent='';paint();dialog.showModal();height.focus();});
  close.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>trigger.focus());
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  mode.addEventListener('change',()=>{waist.value='';answer.textContent='';paint();});
  form.addEventListener('input',()=>{answer.textContent='';});
  form.addEventListener('submit',e=>{e.preventDefault();paint();const r=assess(ctx,{height:height.value,waist:waist.value,mode:mode.value});answer.textContent=respond(r);if(r.kind==='heightError')height.focus();if(r.kind==='waistError')waist.focus();});
  doc.addEventListener('nm:idioma',()=>{answer.textContent='';paint();});
  paint();
})(typeof window==='undefined'?null:window);
