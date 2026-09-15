(function(){
  'use strict';
  if(window.__KA_EXPENSE_VOUCHER_CONTACT_FIX__)return;
  window.__KA_EXPENSE_VOUCHER_CONTACT_FIX__=true;

  function install(){
    if(window.__KA_EXPENSE_OPEN_PATCHED__)return;
    const nativeOpen=window.open;
    if(typeof nativeOpen!=='function')return;
    window.open=function(){
      const popup=nativeOpen.apply(this,arguments);
      if(!popup)return popup;
      try{
        const doc=popup.document;
        if(!doc||doc.__kaExpenseWritePatched)return popup;
        const nativeWrite=doc.write.bind(doc);
        doc.write=function(html){
          let out=String(html||'');
          if(/EXPENSE INVOICE|অন্যান্য ব্যয়ের ভাউচার/.test(out)){
            out=out.replace(/(\.brand p\{[^}]*\})/, '$1.contact-stack{margin-top:6px;color:#555;font-size:13px;line-height:1.55}.contact-stack div{margin:1px 0}');
            out=out.replace(/<p>([^<]*?)\s*•\s*([^<]*?)\s*•\s*([^<]*?)<\/p>/, '<div class="contact-stack"><div>$1</div><div>$2</div><div>$3</div></div>');
          }
          return nativeWrite(out);
        };
        doc.__kaExpenseWritePatched=true;
      }catch(e){console.warn('expense voucher contact fix',e)}
      return popup;
    };
    window.__KA_EXPENSE_OPEN_PATCHED__=true;
  }

  install();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  window.addEventListener('load',install);
})();
