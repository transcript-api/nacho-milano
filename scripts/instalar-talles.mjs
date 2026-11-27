import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const args=process.argv.slice(2), root=resolve(args.find(a=>a!=='--check')||resolve(dirname(fileURLToPath(import.meta.url)),'..'));
const check=args.includes('--check');
const ids=['nm-camisa-swell','nm-camisa-rustic','nm-calca-de-linho-com-elastano','nm-bermuda-champy','nm-short-linho-ultra-premium'];
const tags='<!-- nm-size:assets --><link rel="stylesheet" href="talles.css?v=1"><script src="talles.js?v=1" defer></script><!-- /nm-size:assets -->';
const start='<!-- nm-size:start -->',end='<!-- /nm-size:end -->';
const marked=/<!-- nm-size:start -->[\s\S]*?<!-- \/nm-size:end -->\n?\s*/g;
const original=/\s*<details class="garmentMeasure">(<summary>[\s\S]+?)<\/details>\s*(?=<div id="productChoice">)/;
const assetTags=/<!-- nm-size:assets -->[\s\S]*?<!-- \/nm-size:assets -->/g;
function markup(chart){
 const title=chart?'Encontrá tu talle':'Guía de talles';
 const copy=chart?'Con una sola medida podés ver qué talle te conviene comparar primero.':'Todavía no tenemos una tabla de medidas confirmada para este modelo.';
 const cta=chart?'':'<a class="nmSize__contact" href="contacto.html">Consultar por este modelo</a>';
 const details=chart?'<details class="garmentMeasure nmSize__chart">'+chart+'</details>':'';
 return start+'<section id="talles" class="nmSize" aria-labelledby="nmSizeTitle" data-nm-size><h2 id="nmSizeTitle" data-nm-size-title>'+title+'</h2><p class="nmSize__instruction" data-nm-size-copy>'+copy+'</p>'+cta+'<div data-nm-size-app hidden></div>'+details+'</section>'+end+'\n    ';
}
let altered=0;
for(const id of ids){
 const file=resolve(root,'producto-'+id+'.html');
 if(!existsSync(file))throw Error('Falta la ficha '+id);
 const html=readFileSync(file,'utf8');
 let base=html.replace(assetTags,'');
 const old=base.match(original);
 const known=id==='nm-short-linho-ultra-premium';
 let chart=known?(base.match(/<details class="garmentMeasure nmSize__chart">(<summary>[\s\S]+?)<\/details>/)?.[1]||old?.[1]):'';
 if(known&&(!chart||!chart.includes('<table>')||!chart.includes('<th scope="row">GG</th>')))throw Error('La tabla verificada no está en la ficha del short');
 base=base.replace(marked,'');
 if(old)base=base.replace(original,'\n    ');
 if(!base.includes('<div id="productChoice">')||!base.includes('</head>'))throw Error('No se pudo localizar la ficha '+id);
 const next=base.replace('</head>',tags+'</head>').replace('<div id="productChoice">',markup(chart)+'<div id="productChoice">');
 if(html!==next){altered++;if(!check)writeFileSync(file,next)}
}
if(check&&altered)throw Error('Hay '+altered+' fichas pendientes de instalar');
console.log(check?'5 fichas sincronizadas':altered+' fichas actualizadas');
