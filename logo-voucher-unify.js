(function(){
  'use strict';
  if(window.__KA_LOGO_VOUCHER_UNIFY__) return;
  window.__KA_LOGO_VOUCHER_UNIFY__=true;

  const $all=s=>[...document.querySelectorAll(s)];
  const state=()=>window.state||{};

  function css(){
    if(document.getElementById('ka-logo-voucher-unify-style')) return;
    const s=document.createElement('style');
    s.id='ka-logo-voucher-unify-style';
    s.textContent=`
      /* Match the clean logo treatment used by Other Expense vouchers. */
      header .ka-final-logo,
      #printable-area .ka-final-logo{
        background:transparent!important;
        border:0!important;
        border-radius:0!important;
        padding:0!important;
        box-shadow:none!important;
      }
      header .ka-final-logo{object-fit:contain!important;}
      #printable-area .ka-final-logo{object-fit:contain!important;}

      /* Remove the decorative box that previously wrapped the logo image. */
      header:has(.ka-final-logo) .ka-final-logo,
      #printable-area .ka-final-logo{position:relative;}
      header:has(.ka-final-logo) .ka-final-logo:is(img){background:transparent!important;}
      header .ka-final-logo:is(img){margin:0!important;}

      /* The actual wrapper created by the legacy header/receipt template. */
      header .ka-final-logo:is(img) { }
    `;
    document.head.appendChild(s);
  }

  function unwrapLogoHolder(root){
    if(!root) return;
    $all(root+' .ka-final-logo').forEach(img=>{
      const holder=img.parentElement;
      if(!holder || holder===document.body) return;
      const cs=getComputedStyle(holder);
      const hasOnlyLogo=holder.children.length<=1;
      if(hasOnlyLogo){
        holder.style.setProperty('background','transparent','important');
        holder.style.setProperty('border','0','important');
        holder.style.setProperty('border-radius','0','important');
        holder.style.setProperty('padding','0','important');
        holder.style.setProperty('box-shadow','none','important');
        holder.style.setProperty('overflow','visible','important');
      }
    });
  }

  function logo(){
    unwrapLogoHolder('header');
    unwrapLogoHolder('#printable-area');
  }

  function nextExpenseNo(used){
    let n=3001;
    while(used.has('EXP-'+n)) n++;
    return 'EXP-'+n;
  }

  function normalizeExpenseNumbers(save){
    const s=state();
    if(!Array.isArray(s.expenses)||!s.expenses.length) return false;
    const used=new Set();
    let changed=false;

    // Preserve already-standard numbers and determine the next sequence number.
    s.expenses.forEach(x=>{
      const v=String(x?.expenseNo||'').trim();
      if(/^EXP-\d+$/.test(v)) used.add(v);
    });

    // Legacy/random numbers are replaced in creation order, starting from EXP-3001.
    const legacy=s.expenses.filter(x=>!/^EXP-\d+$/.test(String(x?.expenseNo||'').trim()))
      .sort((a,b)=>String(a?.createdAt||a?.date||'').localeCompare(String(b?.createdAt||b?.date||'')));
    legacy.forEach(x=>{
      const v=nextExpenseNo(used);
      if(x.expenseNo!==v){x.expenseNo=v;changed=true;}
      used.add(v);
    });

    // Persist only when something actually changed.
    if(changed && save){
      try{save();}catch(e){console.warn('expense number save',e)}
    }
    return changed;
  }

  function patchSaveData(){
    if(window.__KA_EXPENSE_NO_SAVE_PATCHED||typeof window.saveData!=='function') return;
    const original=window.saveData;
    window.saveData=function(){
      normalizeExpenseNumbers(false);
      return original.apply(this,arguments);
    };
    window.__KA_EXPENSE_NO_SAVE_PATCHED=true;
  }

  function boot(){
    css();
    logo();
    patchSaveData();
    normalizeExpenseNumbers(false);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,150),{once:true});
  else setTimeout(boot,150);
  window.addEventListener('load',()=>setTimeout(boot,200));
  window.addEventListener('koraner-auth-ready',()=>setTimeout(boot,300));
  if(window.MutationObserver)new MutationObserver(()=>requestAnimationFrame(()=>{logo();patchSaveData();})).observe(document.body,{childList:true,subtree:true});
})();
