(function(){
  'use strict';
  if(window.__KA_LOGO_EXPENSE_FINAL_FIX__)return;
  window.__KA_LOGO_EXPENSE_FINAL_FIX__=true;

  const expenseNoRe=/^EXP-\d+$/;
  const pad=n=>String(n).padStart(4,'0');
  const normalizeDigits=v=>String(v??'').replace(/[^0-9]/g,'');

  function cleanHomeLogo(){
    const header=document.querySelector('header');
    if(!header)return;
    const img=header.querySelector('img.ka-final-logo');
    if(!img)return;
    const holder=img.parentElement;
    if(holder){
      // The original header wrapped the real logo in a decorative rounded box.
      // Make that wrapper layout-transparent so only the actual logo is visible.
      holder.style.setProperty('display','contents','important');
      holder.style.setProperty('background','transparent','important');
      holder.style.setProperty('border','0','important');
      holder.style.setProperty('box-shadow','none','important');
      holder.style.setProperty('padding','0','important');
      holder.style.setProperty('margin','0','important');
      holder.style.setProperty('border-radius','0','important');
      holder.style.setProperty('width','auto','important');
      holder.style.setProperty('height','auto','important');
      holder.style.setProperty('overflow','visible','important');
    }
    img.style.setProperty('display','block','important');
    img.style.setProperty('width','68px','important');
    img.style.setProperty('height','68px','important');
    img.style.setProperty('padding','0','important');
    img.style.setProperty('margin','0','important');
    img.style.setProperty('background','transparent','important');
    img.style.setProperty('border','0','important');
    img.style.setProperty('border-radius','0','important');
    img.style.setProperty('box-shadow','none','important');
    img.style.setProperty('object-fit','contain','important');
  }

  function nextExpenseNo(used){
    let n=1001;
    while(used.has('EXP-'+n))n++;
    return 'EXP-'+n;
  }

  function normalizeExpenseNumbers(){
    const s=window.state;
    if(!s||!Array.isArray(s.expenses)||!s.expenses.length)return false;
    const used=new Set();
    s.expenses.forEach(x=>{
      const v=String(x?.expenseNo||'').trim();
      if(expenseNoRe.test(v))used.add(v);
    });
    let changed=false;
    const legacy=s.expenses
      .filter(x=>!expenseNoRe.test(String(x?.expenseNo||'').trim()))
      .sort((a,b)=>String(a?.createdAt||a?.date||'').localeCompare(String(b?.createdAt||b?.date||'')));
    legacy.forEach(x=>{
      const v=nextExpenseNo(used);
      if(x.expenseNo!==v){x.expenseNo=v;changed=true;}
      used.add(v);
    });
    return changed;
  }

  function persist(){
    try{localStorage.setItem('koraner_alo_db_v2',JSON.stringify(window.state));}catch(e){}
    try{if(typeof window.saveData==='function')window.saveData();else if(typeof window.pushStateToCloud==='function')window.pushStateToCloud();}catch(e){console.warn('expense number persist failed',e)}
  }

  function refreshExpenseList(){
    try{
      const month=document.getElementById('ka-exp-month');
      if(month)month.dispatchEvent(new Event('change',{bubbles:true}));
    }catch(e){}
  }

  function normalizeAndPersist(){
    if(normalizeExpenseNumbers()){
      persist();
      refreshExpenseList();
    }
  }

  function patchExpenseForm(){
    const form=document.getElementById('ka-exp-form');
    if(!form||form.dataset.kaFinalNumberPatch==='1')return;
    form.addEventListener('submit',()=>setTimeout(normalizeAndPersist,60));
    form.dataset.kaFinalNumberPatch='1';
  }

  function patchExpensePrintPopup(){
    if(window.__KA_EXPENSE_NO_PRINT_PATCH__)return;
    const nativeOpen=window.open;
    if(typeof nativeOpen!=='function')return;
    window.open=function(){
      const popup=nativeOpen.apply(this,arguments);
      if(!popup)return popup;
      try{
        const doc=popup.document;
        if(doc&&!doc.__kaExpenseNoPrintPatched){
          const nativeWrite=doc.write.bind(doc);
          doc.write=function(html){
            let out=String(html||'');
            if(/EXPENSE INVOICE|অন্যান্য ব্যয়ের ভাউচার/.test(out)){
              out=out.replace(/ভাউচার নং:<\/b>\s*([^<]+)/,function(_m,n){return 'ভাউচার নং:</b> #'+String(n).replace(/^#/,'');});
            }
            return nativeWrite(out);
          };
          doc.__kaExpenseNoPrintPatched=true;
        }
      }catch(e){}
      return popup;
    };
    window.__KA_EXPENSE_NO_PRINT_PATCH__=true;
  }

  function boot(){
    cleanHomeLogo();
    patchExpenseForm();
    patchExpensePrintPopup();
    normalizeAndPersist();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,250),{once:true});
  else setTimeout(boot,250);
  window.addEventListener('load',()=>setTimeout(boot,300));
  window.addEventListener('koraner-auth-ready',()=>setTimeout(boot,500));
  setTimeout(patchExpenseForm,700);
  setTimeout(patchExpenseForm,1500);
  setInterval(()=>{cleanHomeLogo();patchExpenseForm();},1200);
})();
