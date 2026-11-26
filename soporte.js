(() => {
  'use strict';
  const c=window.NM_SUPPORT_CONFIG;
  if(!c)return;
  const exact=(value,kind)=>{
    if(typeof value!=='string'||!value.trim())return null;
    if(kind==='email')return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)?'mailto:'+value:null;
    try{const u=new URL(value,location.origin);return u.protocol==='https:'&&(!u.username&&!u.password)?u.href:null}catch{return null}
  };
  const links={email:exact(c.email,'email'),whatsapp:exact(c.whatsappUrl),instagram:exact(c.instagramUrl),tiktok:exact(c.tiktokUrl),account:exact(c.accountUrl),tracking:exact(c.orderStatusEntryUrl),map:exact(c.mapUrl),dac:exact(c.dacTrackingUrl)};
  document.querySelectorAll('[data-nm-link]').forEach(link=>{const u=links[link.dataset.nmLink];if(u){link.href=u;link.hidden=false;}});
  document.querySelectorAll('[data-nm-pending]').forEach(el=>{if(links[el.dataset.nmPending])el.hidden=true;});
  const strings={email:c.email,address:c.storeAddress,hours:c.storeHours};
  document.querySelectorAll('[data-nm-text]').forEach(el=>{const s=strings[el.dataset.nmText];if(typeof s==='string'&&s.trim())el.textContent=s.trim();});
  document.querySelectorAll('[data-nm-policy]').forEach(el=>{const s=c.policies?.[el.dataset.nmPolicy];if(typeof s==='string'&&s.trim())el.textContent=s.trim();});
  const form=document.querySelector('#nmNewsletter'),result=form?.querySelector('[data-subscription-result]');
  if(!form||typeof c.newsletterEndpoint!=='string'||!c.newsletterEndpoint.startsWith('/')||c.newsletterEndpoint.startsWith('//'))return;
  const endpoint=new URL(c.newsletterEndpoint,location.origin);
  if(endpoint.origin!==location.origin||!endpoint.pathname.startsWith('/api/'))return;
  const pending=document.querySelector('[data-newsletter-pending]');
  form.hidden=false;pending.hidden=true;
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    if(!form.reportValidity())return;
    const req=new FormData(form),button=form.querySelector('button');
    button.disabled=true;result.textContent='Enviando…';
    try{
      const r=await fetch(endpoint.href,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:req.get('email'),consent:req.get('consent')==='yes'})});
      const data=await r.json();
      if(!r.ok||data.accepted!==true)throw Error();
      form.reset();result.textContent='Revisá tu correo para confirmar la suscripción.';
    }catch{result.textContent='No pudimos registrar tu solicitud. Probá de nuevo más tarde.'}
    finally{button.disabled=false}
  });
})();
