import { existsSync, readFileSync, writeFileSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const file = item => new URL(item, root);
const read = item => readFileSync(file(item), 'utf8');
const get = name => JSON.parse(read(name));
const esc = value => String(value).replace(/[&<>"']/g, c => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
})[c]);
const rack = get('perchero.json');
const products = get('catalogo-real.json');
const ids = new Set();
const allowed = new Set(['Camisas', 'Polos', 'Remeras', 'Buzos']);
const exists = value => typeof value === 'string' && /^[a-z0-9_./-]+$/i.test(value) && !value.includes('..') && existsSync(file(value));
if (!rack.piezas.length || !rack.piezas.some(p => p.prenda === rack.inicial)) throw Error('Prenda inicial inválida');
const markup = rack.piezas.map((piece,index) => {
  const p = products.find(row => row.id === piece.prenda);
  const c = p?.colors.find(color => color.name === piece.color);
  if (!c || !allowed.has(p.category) || ids.has(p.id)) throw Error('Prenda o color inválidos: '+piece.prenda);
  ids.add(p.id);
  if (![piece.frente, piece.perfil].every(exists)) throw Error('Falta foto del perchero: '+p.id);
  for (const media of [c.photos?.front, c.photos?.back].filter(Boolean)) if (!exists(media)) throw Error('Falta foto de la ficha: '+media);
  const name = p.name+' · '+c.name, url='producto-'+p.id+'.html';
  if (!exists(url)) throw Error('Falta ficha: '+url);
  const photo = (view,src,alt) => '<img class="nmRail__photo nmRail__photo--'+view+'" src="'+esc(src)+'" width="380" height="512" alt="'+esc(alt)+'" loading="'+(index<7?'eager':'lazy')+'" decoding="async" draggable="false">';
  const ficha = url+'?color='+encodeURIComponent(c.name);
  const attrs = {'name':name, description:p.description||'',tag:c.name,url:ficha,large:c.photos?.front||piece.frente};
  if(c.photos?.back) attrs.back=c.photos.back;
  const data = Object.entries(attrs).map(([k,v])=>'data-'+k+'="'+esc(v)+'"').join(' ');
  return '<div class="nmRail__item" data-side data-hanger="none" '+data+(p.id===rack.inicial?' data-active':'')+'><button type="button" class="nmRail__piece" aria-label="'+esc(name)+'" aria-haspopup="dialog"><span class="nmRail__shape"><span class="nmRail__rotation">'+photo('front',piece.frente,name)+photo('side',piece.perfil,'')+'</span></span><span class="nmRail__tag">'+esc(c.name)+'</span></button><a class="nmRail__fallback" href="'+url+'">Ver prenda</a></div>';
});
const existing=read('index.html');
const identity='<!-- nm-rail:start -->';
if(existing.split(identity).length!==2) throw Error('Bloque de perchero no encontrado');
const [pre,fromStart]=existing.split(identity);
const [section,after]=fromStart.split('<!-- nm-rail:end -->');
if(after===undefined) throw Error('Falta cierre de perchero');
const opening='<!-- nm-rail:pieces -->',closing='<!-- /nm-rail:pieces -->';
if(section.split(opening).length!==2||section.split(closing).length!==2)throw Error('Marcadores de prendas incorrectos');
const html=pre+identity+section.replace(/data-feature="\d+"/,'data-feature="'+rack.piezas.findIndex(p=>p.prenda===rack.inicial)+'"').replace(/<!-- nm-rail:pieces -->[\s\S]*?<!-- \/nm-rail:pieces -->/,()=>opening+'\n'+markup.join('\n')+'\n'+closing)+'<!-- nm-rail:end -->'+after;
if(process.argv.includes('--check')){
  if(html!==existing){console.error('El perchero no coincide con perchero.json. Ejecutá node scripts/build-perchero.mjs.');process.exit(1);}
  console.log(markup.length+' enlaces y pares de fotos verificados');
}else writeFileSync(file('index.html'),html);
