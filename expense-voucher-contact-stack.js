(function(){
  'use strict';
  if(window.__KA_EXPENSE_CONTACT_STACK__) return;
  window.__KA_EXPENSE_CONTACT_STACK__=true;
  function apply(){
    const area=document.getElementById('printable-area');
    if(!area) return;
    const p=[...area.querySelectorAll('p')].filter(x=>x.innerText&&(/fb\.com|@|\+\d|01\d|phone|email|ঠিকানা|address/i.test(x.innerText)));
    if(!p.length)return;
    // Find the contact/info block near the main institution title, and stack address/email/phone vertically.
    const block=p.find(x=>/fb\.com|@|\+\d|01\d/i.test(x.innerText))?.parentElement;
    if(!block)return;
    const items=[...block.querySelectorAll('p,span,div')].filter(x=>{
      const t=(x.innerText||'').trim();
      return t && x.children.length===0 && (/fb\.com|@|\+\d|01\d|ঠিকানা|address/i.test(t));
    });
    if(items.length<2)return;
    // Prefer explicit brand/contact metadata when available.
    const settings=Object.assign({address:'',email:'',phone:''},window.state&&window.state.siteSettings||{});
    const normalize=t=>String(t||'').replace(/\s+/g,' ').trim();
    const all=items.map(x=>({el:x,t:normalize(x.innerText)}));
    const addr=all.find(x=>settings.address&&x.t.includes(normalize(settings.address)))?.el || all.find(x=>/ঠিকানা|address/i.test(x.t))?.el;
    const email=all.find(x=>settings.email&&x.t.includes(normalize(settings.email)))?.el || all.find(x=>/@/.test(x.t))?.el;
    const phone=all.find(x=>settings.phone&&x.t.includes(normalize(settings.phone)))?.el || all.find(x=>/\+\d|01\d/.test(x.t))?.el;
    const ordered=[addr,email,phone].filter(Boolean);
    if(ordered.length<2)return;
    const host=ordered[0].parentElement;
    if(!host)return;
    host.style.setProperty('display','flex','important');
    host.style.setProperty('flex-direction','column','important');
    host.style.setProperty('align-items','flex-start','important');
    host.style.setProperty('gap','2px','important');
    host.style.setProperty('line-height','1.35','important');
    ordered.forEach(el=>{
      el.style.setProperty('display','block','important');
      el.style.setProperty('margin','0','important');
      el.style.setProperty('padding','0','important');
    });
  }
  function boot(){apply();setTimeout(apply,250);setTimeout(apply,700);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else setTimeout(boot,100);
  window.addEventListener('load',()=>setTimeout(apply,150));
  if(window.MutationObserver)new MutationObserver(()=>requestAnimationFrame(apply)).observe(document.body,{childList:true,subtree:true});
})();
