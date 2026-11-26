(() => {
  'use strict';
  const menu=document.getElementById('nmMobileMenu'),bar=document.getElementById('bar');
  const trigger=bar?.querySelector('.nmMenuTrigger');
  if(!menu||!trigger)return;
  const page=document.documentElement;
  function close(){if(menu.open)menu.close()}
  trigger.addEventListener('click',()=>{
    if(menu.open)return;
    menu.showModal();
    page.classList.add('nmMenuOpen');
    trigger.setAttribute('aria-expanded','true');
    menu.scrollTop=0;
    menu.querySelector('.nmMobileMenu__products').scrollLeft=0;
  });
  menu.addEventListener('close',()=>{
    page.classList.remove('nmMenuOpen');
    trigger.setAttribute('aria-expanded','false');
    trigger.focus({preventScroll:true});
  });
  menu.addEventListener('click',e=>{
    const a=e.target.closest('a[href]');
    if(a&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey)close();
  });
  addEventListener('pageshow',close);
})();
