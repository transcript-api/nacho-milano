/* Display-only localization boundary for both the static and progressively rendered storefront.
   Source text stays canonical so language changes never affect variant identities or commerce state. */
(() => {
'use strict';
const es='es-UY', pt='pt-BR', key='nm-language-choice-v1', geoKey='nm-market-brief-v1';
const supported=v=>v===es||v===pt;
const rows=window.NM_COPY||[], index=new Map(), norm=v=>v.trim().replace(/\s+/g,' ').toLocaleLowerCase();
for(const row of rows)for(const spelling of row)index.set(norm(spelling),row);
const browser=ls=>(ls||[]).map(v=>String(v).split('-')[0].toLowerCase()).map(v=>v==='pt'?pt:v==='es'?es:null).find(Boolean)||es;
const langIndex=l=>l===pt?1:0;
const sgPl=(n,singular,plural)=>Number(n)===1?singular:plural;
const pref=(value,src,to,loc)=>value.slice(0,src.length).toLowerCase()===src.toLowerCase()?to+translate(value.slice(src.length),loc):null;
function translate(value,loc,depth=0){
 if(typeof value!=='string'||!value||depth>8)return value;
 const padding=value.match(/^(\s*)([\s\S]*?)(\s*)$/);
 const str=padding[2];if(!str||!/[\p{L}]/u.test(str))return value;
 const one=(v)=>translate(v,loc,depth+1);
 const e=loc===es;
 let out, m, row=index.get(norm(str));
 if(row)out=row[langIndex(loc)];
 else if(str.includes(' | ')||str.includes(' · ')){const sep=str.includes(' | ')?' | ':' · ';out=str.split(sep).map(one).join(sep);}
 else if((m=str.match(/^([^\s].*?)\s*([→↗])$/u)))out=one(m[1])+' '+m[2];
 else if(str.startsWith('← '))out='← '+one(str.slice(2));
 else if((m=str.match(/^Maniquí con (.+?), (.+?), y (.+?), (.+?)\.$/)))out=(e?'Maniquí con ':'Manequim com ')+one(m[1])+', '+one(m[2])+(e?', y ':' e ')+one(m[3])+', '+one(m[4])+'.';
 else if((m=str.match(/^Carrito, (\d+) prendas?$/)))out=(e?'Carrito, ':'Carrinho, ')+m[1]+' '+(e?sgPl(m[1],'prenda','prendas'):sgPl(m[1],'peça','peças'));
 else if((m=str.match(/^(\d+) (PRENDAS?|colores?)$/)))out=m[1]+' '+(e?m[2]:m[2].startsWith('P')?sgPl(m[1],'PEÇA','PEÇAS'):sgPl(m[1],'cor','cores'));
 else if((m=str.match(/^(.+) en (el carrito|la bolsa)$/)))out=(/^\d+ prendas?$/.test(m[1])&&!e?m[1].replace(/prenda(s?)/,'peça$1'):one(m[1]))+(e?' en '+m[2]:m[2]==='el carrito'?' no carrinho':' na sacola');
 else if((m=str.match(/^Agregamos (\d+) prendas?\.$/)))out=e?str:'Adicionamos '+m[1]+' '+sgPl(m[1],'peça.','peças.');
 else if((m=str.match(/^Agregaste (\d+) unidades a tu bolsa\.$/)))out=e?str:'Você adicionou '+m[1]+' unidades à sua sacola.';
 else if((m=str.match(/^(.+), (.+)$/))&&!str.includes('. ')&&(index.has(norm(m[1]))||str.startsWith('Ver ')))out=one(m[1])+', '+one(m[2]);
 else if((m=str.match(/^En (.+)$/))&&index.has(norm(m[1])))out=(e?'En ':'Em ')+one(m[1]).toLocaleLowerCase(loc);
 else {
  const prefixes=[
    ['Agregar al carrito: ','Adicionar ao carrinho: '],['Quitar de guardados: ','Remover dos favoritos: '],
    ['Ampliar foto de ','Ampliar foto de '],['Abrir ficha de ','Abrir página de '],['Ver foto: ','Ver foto: '],
    ['Ampliar: ','Ampliar: '],['Elegir look ','Escolher look '],['Talle de ','Tamanho de '],['Color de ','Cor de '],
    ['Aumentar ','Aumentar '],['Reducir ','Diminuir '],['Quitar ','Remover '],['Guardar ','Salvar '],['Ver ','Ver ']
  ];
  for(const [source,target] of prefixes){const t=pref(str,source,e?source:target,loc);if(t!==null){out=t;break;}}
 }
 return padding[1]+(out??str)+padding[3];
}
const aliases=s=>[...new Set([s,translate(s,es),translate(s,pt)])].join(' ');
let choice='',country='',current=es,request=0;
try{const saved=localStorage.getItem(key);if(supported(saved))choice=saved;}catch{}
try{const c=JSON.parse(sessionStorage.getItem(geoKey)||'null');if(c&&supported(c.l)&&Number.isFinite(c.t)&&Date.now()>=c.t&&Date.now()-c.t<5*60*1000)country=c.l;}catch{}
const inferred=()=>choice||country||browser(navigator.languages?.length?navigator.languages:[navigator.language]);
current=inferred();document.documentElement.lang=current;
const texts=new WeakMap(),attrs=new WeakMap(),attrsList=['alt','title','aria-label','aria-roledescription','placeholder','content'];
const ignore='script,style,noscript,textarea,[data-nm-locale],code,pre,[contenteditable="true"]';
function liveText(n){
 const val=n.nodeValue;if(!val||!val.trim())return;
 let rec=texts.get(n);
 if(!rec||rec.shown!==val)rec={source:val};
 const next=translate(rec.source,current);rec.shown=next;texts.set(n,rec);
 if(next!==val)n.nodeValue=next;
}
function attr(el,key){
 if(key==='content'&&!(el.tagName==='META'&&el.name==='description'))return;
 const val=el.getAttribute(key);if(!val)return;
 let mp=attrs.get(el);if(!mp){mp=new Map();attrs.set(el,mp);}
 let rec=mp.get(key);if(!rec||rec.shown!==val)rec={source:val};
 const next=translate(rec.source,current);rec.shown=next;mp.set(key,rec);
 if(next!==val)el.setAttribute(key,next);
}
function walk(n){
 if(n.nodeType===3){if(!n.parentElement?.closest(ignore))liveText(n);return;}
 if(n.nodeType!==1&&n.nodeType!==9&&n.nodeType!==11)return;
 if(n.nodeType===1&&(n.matches(ignore)||n.closest('[data-nm-locale]')))return;
 const st=[n];while(st.length){const t=st.pop();
  if(t.nodeType===3){liveText(t);continue;}
  if(t.nodeType===1){
   if(t.matches(ignore))continue;
   if(t.matches('.productDesc[lang]'))t.lang=current;
   for(const name of attrsList)if(t.hasAttribute(name))attr(t,name);
  }
  for(let x=t.lastChild;x;x=x.previousSibling)st.push(x);
 }
}
const widgets=[];
function sync(){
 document.documentElement.lang=current;
 for(const {select,hint,summary} of widgets){
  select.value=choice||'auto';
  select.setAttribute('aria-label',current===pt?'Idioma da loja':'Idioma de la tienda');
  hint.textContent='Automático'+(choice?'':' · '+(current===pt?'PT':'ES'));
  summary.textContent=current===pt?'PT':'ES';
 }
 walk(document.documentElement);
}
function selectChoice(v,write=true){
 if(v!=='auto'&&!supported(v))return;
 choice=v==='auto'?'':v;
 if(write)try{if(choice)localStorage.setItem(key,choice);else localStorage.removeItem(key);}catch{}
 current=inferred();sync();
 document.dispatchEvent(new CustomEvent('nm:idioma',{detail:{locale:current}}));
 if(!choice)locate();
}
function picker(slot,short=false){
 if(!slot)return;
 const wrap=document.createElement('label');wrap.className='nmLang'+(short?' nmLang--short':'');wrap.dataset.nmLocale='1';
 const summary=document.createElement('span');summary.className='nmLang__current';summary.setAttribute('aria-hidden','true');
 const arrow=document.createElement('span');arrow.className='nmLang__arrow';arrow.setAttribute('aria-hidden','true');
 const select=document.createElement('select');select.className='nmLang__select';select.setAttribute('dir','ltr');
 const hint=new Option('Automático','auto');select.append(hint,new Option('Español','es-UY'),new Option('Português','pt-BR'));
 select.options[1].lang=es;select.options[2].lang=pt;
 select.addEventListener('change',()=>selectChoice(select.value));
 wrap.append(summary,arrow,select);slot.append(wrap);widgets.push({select,hint,summary});
}
function mount(){
 picker(document.querySelector('#bar nav'),true);
 picker(document.querySelector('.nmMobileMenu__links'));
 picker(document.querySelector('.nmServiceFoot__bottom'));
 sync();
 const observer=new MutationObserver(records=>{
  const added=new Set();
  for(const r of records){
   if(r.type==='childList')for(const n of r.addedNodes)added.add(n);
   else if(r.type==='characterData')added.add(r.target);
   else if(r.type==='attributes'&&!r.target.closest(ignore))attr(r.target,r.attributeName);
  }
  for(const n of added)if(n.isConnected&&!n.parentElement?.closest(ignore))walk(n);
 });
 observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:attrsList});
}
async function locate(){
 const token=++request;if(choice||!/^https?:$/.test(location.protocol))return;
 // A short cached hint prevents language flicker across pages. Recheck on every page when on auto.
 try{
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),2500);
  let data;
  try{const r=await fetch('/api/market',{method:'GET',credentials:'omit',cache:'no-store',signal:controller.signal});
   if(!r.ok||!r.headers.get('content-type')?.includes('application/json'))return;data=await r.json();
  }finally{clearTimeout(timer);}
  if(token!==request||choice||!data||!('locale' in data)||!(supported(data.locale)||data.locale===null))return;
  country=data.locale||'';
  try{if(country)sessionStorage.setItem(geoKey,JSON.stringify({l:country,t:Date.now()}));else sessionStorage.removeItem(geoKey);}catch{}
  const next=inferred();if(next!==current){current=next;sync();document.dispatchEvent(new CustomEvent('nm:idioma',{detail:{locale:current}}));}
 }catch{} // Static hosting, offline or unsupported country: use browser locale.
}
window.NM_LANG=Object.freeze({get locale(){return current;},t:(v,l=current)=>translate(v,l),aliases});
addEventListener('storage',evt=>{if(evt.key===key||evt.key===null)selectChoice(supported(evt.newValue)?evt.newValue:'auto',false);});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
locate();
})();
