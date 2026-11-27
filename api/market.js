// No account, address lookup, coordinates, analytics, raw IP handling, or writes.
// https://vercel.com/docs/headers/request-headers#x-vercel-ip-country
module.exports = function market(req,res) {
  res.setHeader('Cache-Control','private, no-store, max-age=0');
  res.setHeader('Vercel-CDN-Cache-Control','no-store');
  res.setHeader('Vary','x-vercel-ip-country');
  if(req.method!=='GET' && req.method!=='HEAD'){res.setHeader('Allow','GET, HEAD');return res.status(405).end();}
  const cc=req.headers['x-vercel-ip-country'];
  const locale=cc==='BR'?'pt-BR':cc==='UY'?'es-UY':null;
  if(req.method==='HEAD')return res.status(200).end();
  return res.status(200).json({locale});
};
