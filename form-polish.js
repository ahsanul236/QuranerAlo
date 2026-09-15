(function(){
'use strict';
if(window.__KA_FORM_POLISH_V2__)return;window.__KA_FORM_POLISH_V2__=true;
const $=s=>document.querySelector(s);
function modalFor(el){
  if(!el)return null;
  let n=el.closest('.fixed,[role="dialog"],.modal');
  if(n)return n;
  return [...document.querySelectorAll('.fixed,[role="dialog"],.modal')].find(x=>getComputedStyle(x).display!=='none'&&x.offsetWidth>0&&x.offsetHeight>0)||null;
}
function labelFor(form,el){return form.querySelector('label[for="'+CSS.escape(el.id||'')+'"]')||el.closest('div')?.querySelector('label')||null}
function enhance(modal,type){
  if(!modal||modal.dataset.kaV2==='1')return;
  const form=modal.querySelector('form')||modal;
  const controls=[...form.querySelectorAll('input,select,textarea')].filter(x=>x.type!=='hidden');
  if(!controls.length)return;
  modal.classList.add('ka-v2-modal');
  const title=modal.querySelector('h2,h3');
  if(title)title.classList.add('ka-v2-title');
  const overlay=modal.parentElement;
  if(overlay?.classList.contains('fixed'))overlay.classList.add('ka-v2-overlay');
  const body=controls[0].closest('.space-y-4,.space-y-5,.p-6,.p-5,.p-4')||form;
  body.classList.add('ka-v2-body');
  // Normalize controls while preserving existing field wrappers/handlers.
  controls.forEach(el=>{
    el.classList.add('ka-v2-control');
    const lab=labelFor(form,el); if(lab)lab.classList.add('ka-v2-label');
    if(el.type==='date')el.classList.add('ka-v2-date');
  });
  // Add compact section dividers once, using the existing field order.
  if(!form.querySelector('.ka-v2-divider')){
    const groups=[];
    controls.forEach((el)=>{
      const txt=(labelFor(form,el)?.innerText||el.name||el.id||'').toLowerCase();
      let group='';
      if(/id|আইডি|কর্মীর ধরন|type/.test(txt))group='পরিচয় ও আইডি';
      else if(/নাম|name|father|বাবা|mother|মা|guardian|অভিভাবক/.test(txt))group='ব্যক্তিগত তথ্য';
      else if(/জন্ম|birth|nid|জাতীয়|নিবন্ধন|identity/.test(txt))group='পরিচয়পত্র ও জন্ম তথ্য';
      else if(/mobile|phone|email|মোবাইল|ফোন|ইমেইল|address|ঠিকানা/.test(txt))group='যোগাযোগ';
      else if(/salary|fee|বেতন|ফি|amount|টাকা/.test(txt))group='আর্থিক তথ্য';
      if(group&&!groups.includes(group))groups.push(group);
    });
    // Only show a top-level helper strip; do not rearrange the existing fields, avoiding function breakage.
    const strip=document.createElement('div');strip.className='ka-v2-helper';strip.innerHTML='<span><i class="fa-solid fa-circle-info"></i> তথ্যগুলো সঠিকভাবে পূরণ করুন</span><small>'+(type==='student'?'স্টুডেন্ট তথ্য ও পরিচয়':'শিক্ষক/স্টাফ তথ্য ও চাকরি সংক্রান্ত তথ্য')+'</small>';
    body.insertBefore(strip,body.firstChild);
  }
  // Make footer buttons visually distinct.
  modal.querySelectorAll('button').forEach(b=>b.classList.add('ka-v2-btn'));
  const selects=form.querySelectorAll('select');
  selects.forEach(s=>s.classList.add('ka-v2-select'));
  modal.dataset.kaV2='1';
}
function scan(){
  const sid=document.getElementById('form-student-id');
  const tid=document.getElementById('form-staff-id');
  if(sid)enhance(modalFor(sid),'student');
  if(tid)enhance(modalFor(tid),'staff');
}
function css(){
 if($('#ka-form-polish-v2'))return;
 const s=document.createElement('style');s.id='ka-form-polish-v2';s.textContent=`
 .ka-v2-overlay{backdrop-filter:blur(4px)!important;background:rgba(15,23,42,.48)!important}
 .ka-v2-modal{width:min(760px,calc(100vw - 28px))!important;max-width:760px!important;max-height:90vh!important;overflow:auto!important;border-radius:24px!important;background:#fff!important;border:1px solid #e2e8f0!important;box-shadow:0 28px 80px rgba(15,23,42,.22)!important;color:#0f172a!important}
 .ka-v2-modal form,.ka-v2-modal>div{background:#fff!important;color:#0f172a!important}
 .ka-v2-title{font-size:22px!important;font-weight:800!important;letter-spacing:-.02em!important;color:#0f172a!important}
 .ka-v2-body{padding:4px!important}
 .ka-v2-helper{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;margin:2px 0 16px!important;padding:10px 12px!important;border:1px solid #dbeafe!important;background:#eff6ff!important;border-radius:14px!important;color:#1e3a8a!important}
 .ka-v2-helper span{font-size:12px!important;font-weight:700!important}.ka-v2-helper i{margin-right:6px!important}.ka-v2-helper small{font-size:11px!important;color:#64748b!important}
 .ka-v2-label{display:block!important;margin:0 0 6px!important;font-size:12px!important;font-weight:700!important;color:#334155!important}
 .ka-v2-control{width:100%!important;min-height:46px!important;padding:10px 12px!important;border:1px solid #d6dee8!important;border-radius:12px!important;background:#fff!important;color:#0f172a!important;box-shadow:0 1px 2px rgba(15,23,42,.03)!important;outline:none!important}
 .ka-v2-control:focus{border-color:#0f766e!important;box-shadow:0 0 0 3px rgba(15,118,110,.10)!important}
 .ka-v2-control[readonly],.ka-v2-control:disabled{background:#f8fafc!important;color:#64748b!important}
 .ka-v2-select{cursor:pointer!important}
 .ka-v2-modal textarea.ka-v2-control{min-height:92px!important;resize:vertical!important}
 .ka-v2-modal button{border-radius:12px!important;min-height:42px!important;font-weight:700!important}
 .ka-v2-btn{transition:none!important}
 .ka-v2-modal .grid{gap:14px 16px!important}
 .ka-v2-modal .border-t{border-color:#e5e7eb!important}
 @media(max-width:700px){
   .ka-v2-modal{width:calc(100vw - 16px)!important;max-height:92vh!important;border-radius:20px!important}
   .ka-v2-title{font-size:19px!important}.ka-v2-helper{align-items:flex-start!important;flex-direction:column!important}
   .ka-v2-modal .grid{grid-template-columns:1fr!important}
 }
 `;document.head.appendChild(s);
}
function boot(){css();scan();setTimeout(scan,250);setTimeout(scan,700);setTimeout(scan,1400);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,120),{once:true});else setTimeout(boot,120);
new MutationObserver(()=>requestAnimationFrame(scan)).observe(document.body,{childList:true,subtree:true});
})();