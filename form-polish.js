(function(){
  'use strict';
  if(window.__KA_FORM_POLISH__)return;window.__KA_FORM_POLISH__=true;
  const $=s=>document.querySelector(s);
  const text=v=>String(v||'').trim().toLowerCase();
  function findModal(root){
    if(!root)return null;
    const all=[...root.querySelectorAll('.fixed,.modal,[role="dialog"]')].filter(e=>getComputedStyle(e).display!=='none'&&e.offsetParent!==null);
    return all.sort((a,b)=>(b.offsetWidth*b.offsetHeight)-(a.offsetWidth*a.offsetHeight))[0]||root;
  }
  function polish(root){
    const m=findModal(root); if(!m||m.dataset.kaFormPolished)return;
    const form=m.querySelector('form')||m;
    const inputs=[...form.querySelectorAll('input,select,textarea')];
    if(!inputs.length)return;
    form.classList.add('ka-form-grid');
    const title=m.querySelector('h2,h3,[class*="text-xl"],[class*="text-2xl"]');
    if(title){title.classList.add('ka-form-title');}
    const labels=[...form.querySelectorAll('label')];
    labels.forEach(l=>l.classList.add('ka-form-label'));
    inputs.forEach(el=>el.classList.add('ka-form-control'));
    // Add concise section headers based on common field labels without changing existing data/functionality.
    const seen=new Set();
    inputs.forEach(el=>{
      const wrap=el.closest('.mb-3,.mb-4,.space-y-3,.space-y-4,.form-group,div');
      const lab=el.id?form.querySelector('label[for="'+CSS.escape(el.id)+'"]'):null;
      const txt=text(lab?.innerText||el.name||el.placeholder||el.id);
      let group='';
      if(/id|আইডি|কর্মীর ধরন|ধরন/.test(txt))group='পরিচয় ও আইডি';
      else if(/নাম|name|father|বাবা|mother|মা/.test(txt))group='ব্যক্তিগত পরিচয়';
      else if(/birth|জন্ম|nid|জাতীয়|জন্মনিবন্ধন/.test(txt))group='পরিচয়পত্র ও জন্ম তথ্য';
      else if(/mobile|phone|email|মোবাইল|ফোন|ইমেইল/.test(txt))group='যোগাযোগ';
      else if(/salary|fee|বেতন|ফি|amount|টাকা/.test(txt))group='আর্থিক তথ্য';
      if(group&&!seen.has(group)){
        seen.add(group);
        const heading=document.createElement('div');heading.className='ka-form-section';heading.textContent=group;
        form.insertBefore(heading,wrap||el.parentElement);
      }
    });
    m.classList.add('ka-form-modal');
    m.dataset.kaFormPolished='1';
  }
  function scan(){
    document.querySelectorAll('form').forEach(f=>{if(f.closest('.hidden'))return;polish(f.closest('.fixed')||f);});
    // Current form containers.
    ['form-student-id','form-staff-id'].forEach(id=>{const e=document.getElementById(id);if(e)polish(e.closest('.fixed')||e.form||e.parentElement);});
  }
  function css(){
    if($('#ka-form-polish-style'))return;
    const s=document.createElement('style');s.id='ka-form-polish-style';s.textContent=`
      .ka-form-modal{border-radius:22px!important;overflow:hidden!important;background:#fff!important;border:1px solid #e5e7eb!important;box-shadow:0 24px 70px rgba(15,23,42,.18)!important}
      .ka-form-modal>div:first-child,.ka-form-modal .modal-header{background:linear-gradient(135deg,#f8fafc,#eefbf5)!important;border-bottom:1px solid #e5e7eb!important}
      .ka-form-title{color:#0f172a!important;font-weight:800!important;letter-spacing:-.01em}
      .ka-form-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 16px!important;align-items:start}
      .ka-form-grid>.ka-form-section{grid-column:1/-1}
      .ka-form-section{font-size:13px;font-weight:800;color:#0f766e;background:#f0fdfa;border:1px solid #ccfbf1;border-radius:12px;padding:8px 11px;margin-top:4px}
      .ka-form-label{display:block!important;margin-bottom:6px!important;color:#334155!important;font-size:12px!important;font-weight:700!important}
      .ka-form-control{width:100%!important;min-height:44px!important;border:1px solid #dbe2ea!important;background:#fff!important;color:#172033!important;border-radius:12px!important;padding:10px 12px!important;outline:none!important;box-shadow:0 1px 2px rgba(15,23,42,.03)!important}
      .ka-form-control:focus{border-color:#14b8a6!important;box-shadow:0 0 0 3px rgba(20,184,166,.12)!important}
      .ka-form-control[readonly],.ka-form-control:disabled{background:#f8fafc!important;color:#64748b!important;cursor:not-allowed!important}
      .ka-form-grid textarea.ka-form-control{min-height:88px!important;resize:vertical!important}
      .ka-form-grid .col-span-2,.ka-form-grid .md\\:col-span-2{grid-column:1/-1!important}
      .ka-form-modal button{border-radius:12px!important;font-weight:700!important;min-height:42px!important}
      .ka-form-modal .form-actions,.ka-form-modal .flex.justify-end{grid-column:1/-1}
      @media(max-width:700px){.ka-form-grid{grid-template-columns:1fr!important;gap:12px!important}.ka-form-grid>.ka-form-section{grid-column:1}.ka-form-modal{width:calc(100vw - 20px)!important;max-width:calc(100vw - 20px)!important;max-height:92vh!important;overflow:auto!important}.ka-form-title{font-size:20px!important}}
    `;document.head.appendChild(s);
  }
  function boot(){css();scan();setTimeout(scan,300);setTimeout(scan,900);setTimeout(scan,1800);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,120),{once:true});else setTimeout(boot,120);
  new MutationObserver(()=>{if(!window.__KA_FORM_POLISH_BUSY){window.__KA_FORM_POLISH_BUSY=true;requestAnimationFrame(()=>{scan();window.__KA_FORM_POLISH_BUSY=false;});}}).observe(document.body,{childList:true,subtree:true});
})();