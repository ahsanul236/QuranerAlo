(function(){
  'use strict';
  if(window.__KA_VOUCHER_LINE_FIX__) return;
  window.__KA_VOUCHER_LINE_FIX__=true;

  function hideExtraDivider(){
    const area=document.getElementById('printable-area');
    if(!area) return;

    // The voucher template has one extra gold divider above the actual receipt header.
    // Remove only that divider; keep the intended bottom/green separator intact.
    const hrs=[...area.querySelectorAll('hr')];
    if(hrs.length){
      hrs[0].style.setProperty('display','none','important');
      return;
    }

    const candidates=[...area.querySelectorAll('*')].filter(el=>{
      if(el===area) return false;
      const cs=getComputedStyle(el);
      const rect=el.getBoundingClientRect();
      const top=parseFloat(cs.borderTopWidth||'0');
      if(!top||top<1||rect.width<240||rect.height>8) return false;
      const c=(cs.borderTopColor||'').replace(/\s/g,'');
      // Gold/golden divider only, not the green bottom line.
      return /rgb\((?:1[2-9]\d|2\d\d),(?:8\d|9\d|1\d\d),(?:0|[1-7]\d)\)/i.test(c) || /#d4af37|#b8860b/i.test(c);
    }).sort((a,b)=>a.getBoundingClientRect().top-b.getBoundingClientRect().top);

    if(candidates[0]) candidates[0].style.setProperty('display','none','important');
  }

  function boot(){
    hideExtraDivider();
    setTimeout(hideExtraDivider,250);
    setTimeout(hideExtraDivider,700);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else setTimeout(boot,100);
  window.addEventListener('load',()=>setTimeout(hideExtraDivider,150));
  if(window.MutationObserver) new MutationObserver(()=>requestAnimationFrame(hideExtraDivider)).observe(document.body,{childList:true,subtree:true});
})();
