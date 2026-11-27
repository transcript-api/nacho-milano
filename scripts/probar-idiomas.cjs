'use strict';
// Offline regression suite. Tests the actual runtime, including its DOM observation boundary, without a DOM dependency.
const fs=require('node:fs'),path=require('node:path'), vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'..')), code=f=>fs.readFileSync(path.join(root,f),'utf8');
const market=require(path.join(root,'api','market.js'));
for(const [region,locale] of [['BR','pt-BR'],['UY','es-UY'],['US',null],['br',null],[undefined,null]])for(const method of ['GET','POST','HEAD']){
 const res={headers:{},setHeader(n,v){this.headers[n]=v},status(n){this.code=n;return this},json(v){this.data=v},end(){}};
 market({method,headers:{'x-vercel-ip-country':region}},res);
 assert.equal(res.code,method==='POST'?405:200);assert.deepEqual(res.data,method==='GET'?{locale}:undefined);assert.match(res.headers['Cache-Control'],/private, no-store/);assert.equal(res.headers['Vercel-CDN-Cache-Control'],'no-store');
}
class N{
 constructor(tag,txt){this.nodeType=tag==='#'?3:1;this.tagName=tag.toUpperCase();this.nodeValue=txt;this.children=[];this.parentElement=null;this.dataset={};this.handlers={};this.at=new Map();this.isConnected=true}
 append(...nodes){nodes.forEach(n=>{n.parentElement=this;n.previousSibling=this.lastChild;this.children.push(n)})}
 get lastChild(){return this.children.at(-1)||null}
 get options(){return this.children}
 get textContent(){return this.nodeType===3?this.nodeValue:this.children.map(n=>n.textContent).join('')}
 set textContent(v){this.children=[];this.append(new N('#',v))}
 setAttribute(k,v){this.at.set(k,v);if(k==='name')this.name=v}
 getAttribute(k){return this.at.get(k)??null}hasAttribute(k){return this.at.has(k)}
 matches(sel){return Boolean(sel.includes('[data-nm-locale]')&&this.dataset.nmLocale||sel==='.productDesc[lang]'&&this.className==='productDesc'&&this.lang||sel.includes('script,')&&['SCRIPT','STYLE','NOSCRIPT','TEXTAREA','PRE','CODE'].includes(this.tagName))}
 closest(sel){for(let n=this;n;n=n.parentElement)if(n.matches(sel))return n;return null}
 addEventListener(type,f){this.handlers[type]=f}
}
class Opt extends N{constructor(label,value){super('option');this.value=value;this.textContent=label}}
const sleep=()=>new Promise(r=>setImmediate(r));
const store=(s={})=>({getItem:k=>s[k]??null,setItem:(k,v)=>s[k]=String(v),removeItem:k=>delete s[k]});
function page({local={},session={},langs=['es-UY']}={}){
 const doc=new N('html'), label=new N('#','Agregar al carrito'), color=new N('#','Mascavo'), meta=new N('meta'), a=new N('a'),p=new N('p');
 meta.setAttribute('name','description');meta.setAttribute('content','Explorá las prendas de Nacho Milano por categoría.');
 a.setAttribute('aria-label','Ver Calça de Linho com Elastano, Bege');a.setAttribute('href','producto-nm-calca-de-linho-com-elastano.html?color=Bege');a.dataset.fitColor='calca-bege';
 p.className='productDesc';p.lang='pt-BR';p.textContent='Bermuda com textura canelada vertical e cordão de ajuste na cintura.';
 const slots={'#bar nav':new N('nav'),'.nmMobileMenu__links':new N('nav'),'.nmServiceFoot__bottom':new N('div')};doc.append(meta,label,color,p,a,...Object.values(slots));
 const docEvents={},events={},req=[];let observer;
 const document={documentElement:doc,readyState:'interactive',querySelector:s=>slots[s],createElement:t=>new N(t),addEventListener(t,f){docEvents[t]=f},dispatchEvent(e){docEvents[e.type]?.(e)}};
 const context={window:{},document,navigator:{languages:langs,language:langs[0]},localStorage:store(local),sessionStorage:store(session),location:{protocol:'https:'},Option:Opt,MutationObserver:class{constructor(cb){observer=cb}observe(){}},CustomEvent:class{constructor(t,o){this.type=t;this.detail=o.detail}},addEventListener:(t,cb)=>events[t]=cb,fetch:(url,init)=>new Promise(res=>{assert.equal(url,'/api/market');assert.equal(init.cache,'no-store');req.push(res)}),AbortController,setTimeout,clearTimeout};
 for(const f of ['idioma-data.js','idioma.js'])vm.runInNewContext(code(f),context);
 const answer=async(locale,i=req.length-1,ok=true)=>{req[i]({ok,headers:{get:()=>'application/json'},json:async()=>({locale})});await sleep()};
 const switcher=slot=>slots[slot].children[0].children[2];const pick=(v,slot='.nmMobileMenu__links')=>{const sel=switcher(slot);sel.value=v;sel.handlers.change()};
 return {lang:context.window.NM_LANG,doc,label,color,meta,a,p,req,answer,pick,switcher,events,local:context.localStorage,session:context.sessionStorage,change:(target,type)=>observer([type==='attribute'?{type:'attributes',target,attributeName:'aria-label'}:{type:'characterData',target}])};
}
(async()=>{
 const key='nm-language-choice-v1',geoKey='nm-market-brief-v1',x=page();
 const{t,aliases}=x.lang;
 assert.equal(x.doc.lang,'es-UY');assert.equal(x.color.nodeValue,'Marrón');assert(!x.p.textContent.includes('cordão'));assert.equal(x.p.lang,'es-UY');
 await x.answer('pt-BR');assert.equal(x.lang.locale,'pt-BR');assert.equal(x.label.nodeValue,'Adicionar ao carrinho');assert.equal(x.color.nodeValue,'Mascavo');assert.equal(x.p.lang,'pt-BR');assert.equal(x.a.getAttribute('aria-label'),'Ver Calça de linho com elastano, Bege');assert.match(x.meta.getAttribute('content'),/^Explore as peças/);
 for(const slot of ['#bar nav','.nmMobileMenu__links','.nmServiceFoot__bottom'])assert.equal(x.switcher(slot).getAttribute('aria-label'),'Idioma da loja');
 x.pick('es-UY');assert.equal(x.local.getItem(key),'es-UY');assert.equal(x.p.lang,'es-UY');assert.match(x.p.textContent,/Bermuda de textura/);assert.equal(x.a.getAttribute('href'),'producto-nm-calca-de-linho-com-elastano.html?color=Bege');assert.equal(x.a.dataset.fitColor,'calca-bege');assert.equal(x.a.getAttribute('aria-label'),'Ver Pantalón de lino con elastano, Beige');
 x.color.nodeValue='Areia';x.change(x.color);assert.equal(x.color.nodeValue,'Arena');x.pick('pt-BR','#bar nav');assert.equal(x.color.nodeValue,'Areia');
 x.a.setAttribute('aria-label','Carrito, 3 prendas');x.change(x.a,'attribute');assert.equal(x.a.getAttribute('aria-label'),'Carrinho, 3 peças');
 x.pick('auto');assert.equal(x.local.getItem(key),null);await x.answer('es-UY');assert.equal(x.lang.locale,'es-UY');assert.equal(x.color.nodeValue,'Arena');
 const br=page({langs:['pt-BR'],local:{[key]:'es-UY'}});assert.equal(br.req.length,0);assert.equal(br.lang.locale,'es-UY');
 const race=page({langs:['pt-BR']});race.pick('pt-BR');await race.answer('es-UY');assert.equal(race.lang.locale,'pt-BR');race.events.storage({key,newValue:'es-UY'});assert.equal(race.lang.locale,'es-UY');
 const uy=page({langs:['pt-BR']});await uy.answer('es-UY');assert.equal(uy.lang.locale,'es-UY');
 const us=page({langs:['fr','pt-BR'],session:{[geoKey]:JSON.stringify({l:'es-UY',t:Date.now()})}});assert.equal(us.lang.locale,'es-UY');await us.answer(null);assert.equal(us.lang.locale,'pt-BR');assert.equal(us.session.getItem(geoKey),null);
 const fail=page({langs:['en-US']});await fail.answer(null,0,false);assert.equal(fail.lang.locale,'es-UY');
 const keep=page({langs:['es'],local:{[key]:'pt-BR'}});assert.equal(keep.p.lang,'pt-BR');assert.equal(keep.req.length,0);
 assert.match(aliases('Mascavo'),/Marrón/);assert.match(aliases('Bege'),/Beige/);assert.match(aliases('Areia'),/Arena/);assert.match(aliases('OFF'),/Blanco roto/);
 assert.equal(t('Maniquí con Camisa Swell, Preto, y Calça de Linho com Elastano, Bege.','pt-BR'),'Manequim com Camisa Swell, Preto e Calça de linho com elastano, Bege.');
 for(const [s,pt] of [['Guía de medidas','Guia de medidas'],['Cintura (ancho)','Cintura (largura)'],['Medidas de la prenda en plano (cm)','Medidas da peça estendida (cm)'],['Guardados','Favoritos'],['Deslizá para ver más prendas','Deslize para ver mais peças'],['Pantalones','Calças'],['Precio y disponibilidad pendientes de confirmación.','Preço e disponibilidade a confirmar.'],['tu@email.com','voce@email.com']])assert.equal(t(s,'pt-BR'),pt);
 const pages=fs.readdirSync(root).filter(n=>n.endsWith('.html'));for(const f of pages){const s=code(f);assert.equal(s.split('idioma-data.js?').length,2,f);assert.equal(s.split('idioma.js?').length,2,f);assert(!s.includes('placeholder="Polo, marfil, pantalón…"'),f)}
 console.log('OK: '+pages.length+' páginas, UY/BR/otro país, caída de API, preferencia persistente, carrera de red, 3 selectores, a11y, contenido dinámico, búsqueda, talles y URLs/identidades de variante.');
})().catch(e=>{console.error(e);process.exitCode=1});
