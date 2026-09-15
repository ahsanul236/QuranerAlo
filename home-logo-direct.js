(function(){
  'use strict';
  if(window.__KA_HOME_LOGO_DIRECT_V2__) return;
  window.__KA_HOME_LOGO_DIRECT_V2__=true;

  function logoSrc(){
    const s=(window.state&&window.state.siteSettings)||{};
    return s.logoUrl||window.KA_DEFAULT_LOGO||window.KA_DEFAULT_LOGO_URL||'';
  }

  function run(){
    const header=document.querySelector('header');
    if(!header)return;
    const row=header.querySelector('div.flex.items-center.gap-3');
    if(!row)return;
    const src=logoSrc();
    if(!src)return;

    // Make the homepage logo identical to the clean voucher logo:
    // one direct image node, with no decorative parent/container.
    const img=document.createElement('img');
    img.className='ka-home-logo-clean';
    img.src=src;
    img.alt=((window.state&&window.state.siteSettings&&window.state.siteSettings.institutionName)||'কোরআনের আলো');
    img.decoding='async';
    img.loading='eager';
    img.draggable=false;
    img.style.cssText=[
      'display:block!important',
      'width:76px!important',
      'height:76px!important',
      'min-width:76px!important',
      'min-height:76px!important',
      'max-width:76px!important',
      'max-height:76px!important',
      'object-fit:contain!important',
      'background:transparent!important',
      'background-image:none!important',
      'border:0!important',
      'border-radius:0!important',
      'box-shadow:none!important',
      'padding:0!important',
      'margin:0!important',
      'outline:0!important',
      'flex:0 0 76px!important'
    ].join(';');

    const current=row.querySelector('.ka-home-logo-clean');
    const oldLogo=row.querySelector('.ka-final-logo');
    const oldHolder=oldLogo ? oldLogo.closest('div.w-14.h-14') : null;

    if(current){
      current.src=src;
    }else if(oldHolder){
      oldHolder.replaceWith(img);
    }else if(oldLogo){
      oldLogo.replaceWith(img);
    }else{
      const first=row.firstElementChild;
      if(first) first.replaceWith(img);
      else row.prepend(img);
    }

    // Remove any remaining legacy logo/image wrappers from the homepage only.
    row.querySelectorAll('svg, .ka-final-logo, .ka-home-logo-direct').forEach(el=>el.remove());
    row.querySelectorAll('img').forEach(el=>{
      if(el!==img && !el.closest('div:not(header .flex.items-center.gap-3)')) el.remove();
    });

    row.style.setProperty('display','flex','important');
    row.style.setProperty('align-items','center','important');
    row.style.setProperty('gap','14px','important');
    row.style.setProperty('background','transparent','important');
    row.style.setProperty('padding','0','important');
    row.style.setProperty('border','0','important');
    row.style.setProperty('box-shadow','none','important');
  }

  function boot(){
    run();
    setTimeout(run,150);
    setTimeout(run,500);
    setTimeout(run,1200);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else setTimeout(boot,100);
  window.addEventListener('load',()=>setTimeout(run,150));
  window.addEventListener('koraner-auth-ready',()=>setTimeout(run,300));
  if(window.MutationObserver){
    let scheduled=false;
    new MutationObserver(()=>{
      if(scheduled)return;
      scheduled=true;
      requestAnimationFrame(()=>{scheduled=false;run();});
    }).observe(document.body,{childList:true,subtree:true});
  }
})();
