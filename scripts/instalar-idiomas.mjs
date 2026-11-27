import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
import vm from 'node:vm';
const root=resolve(process.argv[2]||dirname(dirname(fileURLToPath(import.meta.url))));
const read=f=>readFileSync(join(root,f),'utf8'), write=(f,s)=>writeFileSync(join(root,f),s);
const ctx={window:{}};vm.runInNewContext(read('idioma-data.js'),ctx);
const map=new Map();
for(const [es,pt,...rest] of ctx.window.NM_COPY)for(const v of [es,pt,...rest])map.set(v,es);
const get=v=>map.get(v)??v;
function edits(f,changes){
 let s=read(f);
 for(const [old,newText] of changes){if(s.includes(newText))continue;if(!s.includes(old))throw Error(f+': no se encontró el ancla '+old.slice(0,120));s=s.replace(old,newText);}
 write(f,s);
}
const include='<link rel="stylesheet" href="idioma.css?v=uybr1"><script src="idioma-data.js?v=uybr1" defer></script><script src="idioma.js?v=uybr1" defer></script>';
for(const f of readdirSync(root).filter(n=>n.endsWith('.html'))){
 let s=read(f);
 s=s.replaceAll('placeholder="Polo, marfil, pantalón…"','placeholder="Camisa, negro, pantalón…"').replaceAll('placeholder="Polo, camisas, marino…"','placeholder="Camisa, lino, negro…"');
 if(!s.includes('idioma-data.js?'))s=s.replace('<meta charset="utf-8">','<meta charset="utf-8">'+include);
 // Always ship readable Spanish on product pages even if JS or the country endpoint is unavailable.
 s=s.replace(/(<p\b[^>]*\bclass="productDesc"[^>]*>)([^<]*)(<\/p>)/g,(_,tag,desc,end)=>tag.replace(/lang="pt-BR"/,'lang="es-UY"')+get(desc)+end);
 s=s.replace(/(<meta name="description" content=")([^"]*)(")/g,(_,a,d,z)=>a+get(d)+z);
 // Touch only text and accessible naming, never URLs, data or canonical selector values.
 s=s.replace(/(>)(Short Linho Ultra Premium|Calça de Linho com Elastano)(?=[<| ])/g,(_,a,k)=>a+get(k));
 s=s.replace(/(aria-label="Guardar )(Short Linho Ultra Premium|Calça de Linho com Elastano)(")/g,(_,a,k,z)=>a+get(k)+z);
 // Bust the search scripts even if another feature has also versioned them.
 s=s.replace(/(src="(?:atelier|tienda|nm-clothing-rail)\.js(?:\?[^"]*)?)"/g,(m,url)=>url.includes('lang=1')?m:url+(url.includes('?')?'&amp;':'?')+'lang=1"');
 if(!s.includes('idioma.js?'))throw Error('No se pudo instalar en '+f);
 write(f,s);
}
const list="[p.name,p.category,p.line,...p.colors.map(displayColor)].join(' ')";
const l10n="[p.name,p.category,p.line,...p.colors.map(displayColor)].filter(Boolean).map(t=>window.NM_LANG?.aliases(t)??t).join(' ')";
edits('atelier.js',[[list,l10n],["a.name.localeCompare(b.name,'es')","(window.NM_LANG?.t(a.name)??a.name).localeCompare(window.NM_LANG?.t(b.name)??b.name,window.NM_LANG?.locale??'es-UY')"],["label+' '+p.name+' '+s","label+' '+p.name+(s?' '+s:'')"],["grid.append(fragment);refreshSaved()}\n draw()","grid.append(fragment);refreshSaved()}\n document.addEventListener?.('nm:idioma',()=>{if(sort!=='featured')draw()});\n draw()"]]);
edits('tienda.js',[[list,l10n],["canon(displayColor(c)).includes(t)","canon(window.NM_LANG?.aliases(displayColor(c))??displayColor(c)).includes(t)"]]);
edits('nm-clothing-rail.js',[["if(activeText.textContent!==name)activeText.textContent=name;","if(activeText.textContent!==name&&activeText.textContent!==(window.NM_LANG?.t(name)??name))activeText.textContent=name;"]]);
