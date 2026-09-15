(function(){
  'use strict';
  if(window.__KA_HOME_LOGO_DIRECT__) return;
  window.__KA_HOME_LOGO_DIRECT__=true;

  function getLogo(){
    const s=(window.state&&window.state.siteSettings)||{};
    return s.logoUrl||window.KA_DEFAULT_LOGO||window.KA_DEFAULT_LOGO_URL||'';
  }

  function fix(){
    const header=document.querySelector('header');
    if(!header) return;
    const img=header.querySelector('img.ka-final-logo');
    if(!img) return;

    const logo=getLogo()||img.getAttribute('src')||'';
    if(!logo) return;

    const row=img.closest('.flex.items-center.gap-3');
    if(!row) return;

    // Remove the legacy decorative logo holder completely.
    const fresh=document.createElement('img');
    fresh.className='ka-home-logo-direct';
    fresh.src=logo;
    fresh.alt=((window.state&&window.state.siteSettings&&window.state.siteSettings.institutionName)||'কোরআনের আলো');
    fresh.decoding='async';
    fresh.loading='eager';
    fresh.setAttribute('draggable','false');
    fresh.style.cssText='display:block!important;width:72px!important;height:72px!important;object-fit:contain!important;background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;padding:0!important;margin:0!important;outline:0!important;flex:0 0 72px!important;';

    const oldHolder=img.closest('div.w-14.h-14');
    if(oldHolder){
      oldHolder.parentNode.insertBefore(fresh,oldHolder);
      oldHolder.remove();
    }else{
      img.parentNode.insertBefore(fresh,img);
      img.remove();
    }

    row.querySelectorAll('.ka-home-logo-direct').forEach((x,i)=>{if(i>0)x.remove();});
    row.style.setProperty('gap','14px','important');
    row.style.setProperty('align-items','center','important');
    const brand=header.querySelector('h1')?.parentElement;
    if(brand) brand.style.setProperty('background','transparent','important');
  }

  function boot(){
    fix();
    setTimeout(fix,200);
    setTimeout(fix,700);
    setTimeout(fix,1400);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else setTimeout(boot,100);
  window.addEventListener('load',()=>setTimeout(fix,120));
  window.addEventListener('koraner-auth-ready',()=>setTimeout(fix,250));
})();
