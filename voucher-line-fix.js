(function(){
  'use strict';
  if(window.__KA_VOUCHER_LINE_FIX__) return;
  window.__KA_VOUCHER_LINE_FIX__=true;

  function hideExtraDivider(area){
    if(!area) return;
    const hrs=[...area.querySelectorAll('hr')];
    if(hrs.length){
      hrs[0].style.setProperty('display','none','important');
      return;
    }
    const candidates=[...area.querySelectorAll('*')].filter(el=>{
      if(el===area) return false;
      const cs=getComputedStyle(el), rect=el.getBoundingClientRect();
      const top=parseFloat(cs.borderTopWidth||'0');
      if(!top||top<1||rect.width<240||rect.height>8) return false;
      const c=(cs.borderTopColor||'').replace(/\s/g,'');
      return /rgb\((?:1[2-9]\d|2\d\d),(?:8\d|9\d|1\d\d),(?:0|[1-7]\d)\)/i.test(c) || /#d4af37|#b8860b/i.test(c);
    }).sort((a,b)=>a.getBoundingClientRect().top-b.getBoundingClientRect().top);
    if(candidates[0]) candidates[0].style.setProperty('display','none','important');
  }

  const visible=el=>{if(!el)return false;const r=el.getBoundingClientRect();const cs=getComputedStyle(el);return r.width>24&&r.height>24&&cs.display!=='none'&&cs.visibility!=='hidden'};
  const text=el=>(el?.textContent||'').replace(/\s+/g,' ').trim();

  function hideDuplicateLogoBlock(area){
    if(!area) return;
    const logos=[...area.querySelectorAll('img,svg')].filter(visible);
    if(logos.length<2) return; // Other-expense voucher normally reaches here with one logo only.

    const marked=[...area.querySelectorAll('img.ka-final-logo')].filter(visible);
    let keep=marked[marked.length-1]||null;

    // Identify the actual receipt/salary voucher header.
    const anchor=[...area.querySelectorAll('h1,h2,h3,h4,p,span,div')].find(el=>{
      const t=text(el);
      return t.length<120 && /অফিসিয়াল\s*(পেমেন্ট\s*)?(রিসিপ্ট|ভাউচার)|পেমেন্ট\s*রিসিপ্ট|স্যালারি\s*ভাউচার|বেতন\s*ভাউচার/i.test(t);
    });

    function headerRootFrom(node){
      if(!node)return null;
      let n=node;
      for(let i=0;i<8 && n && n!==area;i++,n=n.parentElement){
        if([...n.querySelectorAll('img,svg')].some(visible)) return n;
      }
      return null;
    }

    const keepRoot=headerRootFrom(anchor);
    if(!keep && keepRoot){
      const inRoot=[...keepRoot.querySelectorAll('img,svg')].filter(visible);
      keep=inRoot[inRoot.length-1]||null;
    }

    if(!keep){
      // Fallback for the legacy template: keep the later of two visible logo blocks.
      const blocks=[];
      logos.forEach(logo=>{
        const b=logo.closest('.flex.items-center')||logo.parentElement;
        if(b&&b!==area&&!blocks.includes(b))blocks.push(b);
      });
      if(blocks.length>=2){blocks.slice(0,-1).forEach(b=>b.style.setProperty('display','none','important'));}
      return;
    }

    // Hide only logo-bearing blocks outside the real voucher header.
    logos.forEach(logo=>{
      if(logo===keep || (keepRoot&&keepRoot.contains(logo))) return;
      if(logo.closest('[data-keep-voucher-logo]')) return;
      let block=logo.closest('.flex.items-center')||logo.parentElement;
      if(!block||block===area) return;
      // Do not hide a container that actually contains the receipt title.
      if(anchor && block.contains(anchor)) return;
      block.style.setProperty('display','none','important');
    });
  }

  function clean(){
    const area=document.getElementById('printable-area');
    if(!area) return;
    hideExtraDivider(area);
    hideDuplicateLogoBlock(area);
  }

  function boot(){
    clean();
    setTimeout(clean,250);
    setTimeout(clean,700);
    setTimeout(clean,1400);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else setTimeout(boot,100);
  window.addEventListener('load',()=>setTimeout(clean,150));
  if(window.MutationObserver) new MutationObserver(()=>requestAnimationFrame(clean)).observe(document.body,{childList:true,subtree:true});
})();
