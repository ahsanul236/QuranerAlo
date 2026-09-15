(function(){
  'use strict';
  if(window.__KA_SPEED_FIX__)return;window.__KA_SPEED_FIX__=true;
  const s=document.createElement('style');s.id='ka-speed-fix';s.textContent=`
    main>section{contain:layout style;}
    main>section.hidden{display:none!important;}
    .ka-new-section,.ka-merged-report-shell{contain:content;}
    #view-report-merged{content-visibility:auto;contain:layout paint style;}
    table{contain:layout style;}
    img{content-visibility:auto;}
    .ka-data-field{margin-top:8px}
    .ka-data-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
    .ka-data-label{display:block;font-size:12px;font-weight:600;color:#64748b;margin-bottom:5px}
    @media(max-width:640px){.ka-data-grid{grid-template-columns:1fr}}
  `;document.head.appendChild(s);
  function trim(){const nav=document.querySelector('header .max-w-7xl.mx-auto.flex.gap-2.text-sm');if(nav)nav.style.willChange='auto';document.querySelectorAll('svg').forEach(x=>{if(!x.getAttribute('aria-hidden')&&!x.closest('button'))x.setAttribute('aria-hidden','true');});}
  const val=id=>document.getElementById(id)?.value||'';
  function addStudentFields(){
    const name=document.getElementById('form-student-name'),phone=document.getElementById('form-phone');
    if(!name||!phone||document.getElementById('form-student-name-bn'))return;
    const holder=name.parentElement;holder.classList.add('hidden');holder.insertAdjacentHTML('afterend','<div class="ka-data-grid">'+
      '<div><label class="ka-data-label">নাম (বাংলা) *</label><input type="text" id="form-student-name-bn" required placeholder="পূর্ণ নাম বাংলায়" class="glass-input w-full p-2.5 rounded-xl outline-none"></div>'+
      '<div>'+ '<label class="ka-data-label">নাম (English)</label><input type="text" id="form-student-name-en" placeholder="Full name in English" class="glass-input w-full p-2.5 rounded-xl outline-none"></div></div>');
    name.required=false;name.tabIndex=-1;
    phone.parentElement.insertAdjacentHTML('beforebegin','<div class="ka-data-field"><label class="ka-data-label">জন্মনিবন্ধন নং</label><input type="text" id="form-student-birth-reg" placeholder="জন্মনিবন্ধন নম্বর" class="glass-input w-full p-2.5 rounded-xl outline-none"></div>');
  }
  function addStaffFields(){
    const name=document.getElementById('form-staff-name'),father=document.getElementById('form-staff-father');
    if(!name||!father||document.getElementById('form-staff-name-bn'))return;
    const holder=name.parentElement;holder.classList.add('hidden');holder.insertAdjacentHTML('afterend','<div class="ka-data-grid">'+
      '<div><label class="ka-data-label">নাম (বাংলা) *</label><input type="text" id="form-staff-name-bn" required placeholder="পূর্ণ নাম বাংলায়" class="glass-input w-full p-2.5 rounded-xl outline-none"></div>'+
      '<div><label class="ka-data-label">নাম (English)</label><input type="text" id="form-staff-name-en" placeholder="Full name in English" class="glass-input w-full p-2.5 rounded-xl outline-none"></div></div>');
    name.required=false;name.tabIndex=-1;
    father.parentElement.insertAdjacentHTML('beforebegin','<div class="ka-data-field"><label class="ka-data-label">জাতীয় পরিচয় পত্র নং</label><input type="text" id="form-staff-nid" placeholder="NID নম্বর" class="glass-input w-full p-2.5 rounded-xl outline-none"></div>');
  }
  function studentNames(){return{bn:val('form-student-name-bn').trim(),en:val('form-student-name-en').trim()};}
  function staffNames(){return{bn:val('form-staff-name-bn').trim(),en:val('form-staff-name-en').trim()};}
  function syncLegacy(id,bnId,enId){const e=document.getElementById(id);if(e)e.value=val(bnId).trim()||val(enId).trim();}
  function patchStudentHandler(){if(window.__KA_STUDENT_FIELDS_PATCHED||typeof window.handleStudentFormSubmit!=='function')return;const orig=window.handleStudentFormSubmit;window.handleStudentFormSubmit=function(e){syncLegacy('form-student-name','form-student-name-bn','form-student-name-en');const id=val('form-student-id'),editId=val('form-student-edit-id');orig.apply(this,arguments);const r=(window.state?.students||[]).find(x=>x.id===(editId||id));if(r){const n=studentNames();r.nameBn=n.bn;r.nameEn=n.en;r.name=n.bn||n.en;r.birthRegNo=val('form-student-birth-reg').trim();window.saveData?.();window.refreshUIViews?.();}};window.__KA_STUDENT_FIELDS_PATCHED=true;}
  function patchStaffHandler(){if(window.__KA_STAFF_FIELDS_PATCHED||typeof window.handleStaffFormSubmit!=='function')return;const orig=window.handleStaffFormSubmit;window.handleStaffFormSubmit=function(e){syncLegacy('form-staff-name','form-staff-name-bn','form-staff-name-en');const id=val('form-staff-id'),editId=val('form-staff-edit-id');orig.apply(this,arguments);const r=(window.state?.staffs||[]).find(x=>x.id===(editId||id));if(r){const n=staffNames();r.nameBn=n.bn;r.nameEn=n.en;r.name=n.bn||n.en;r.nidNo=val('form-staff-nid').trim();r.staffType=val('form-staff-type')||((r.id||'').startsWith('QAH-')?'QAH':'QAT');window.saveData?.();window.refreshUIViews?.();}};window.__KA_STAFF_FIELDS_PATCHED=true;}
  function patchStudentModal(){if(typeof window.openStudentModal!=='function'||window.__KA_STUDENT_MODAL_PATCHED)return;const orig=window.openStudentModal;window.openStudentModal=function(editId){addStudentFields();const r=orig.apply(this,arguments);setTimeout(()=>{const x=editId?(window.state?.students||[]).find(s=>s.id===editId):null;document.getElementById('form-student-name-bn').value=x?.nameBn||x?.name||'';document.getElementById('form-student-name-en').value=x?.nameEn||'';document.getElementById('form-student-birth-reg').value=x?.birthRegNo||'';},0);return r;};window.__KA_STUDENT_MODAL_PATCHED=true;}
  function patchStaffModal(){if(typeof window.openStaffModal!=='function'||window.__KA_STAFF_MODAL_PATCHED)return;const orig=window.openStaffModal;window.openStaffModal=function(editId){addStaffFields();const r=orig.apply(this,arguments);setTimeout(()=>{const x=editId?(window.state?.staffs||[]).find(s=>s.id===editId):null;document.getElementById('form-staff-name-bn').value=x?.nameBn||x?.name||'';document.getElementById('form-staff-name-en').value=x?.nameEn||'';document.getElementById('form-staff-nid').value=x?.nidNo||'';const sel=document.getElementById('form-staff-type');if(sel){sel.value=x?.staffType||((x?.id||'').startsWith('QAH-')?'QAH':'QAT');sel.disabled=!!editId;}},0);return r;};window.__KA_STAFF_MODAL_PATCHED=true;}
  function staffType(){
    if(document.getElementById('form-staff-type'))return document.getElementById('form-staff-type');
    const id=document.getElementById('form-staff-id');if(!id)return null;const row=id.closest('.grid')||id.parentElement?.parentElement;if(!row)return null;
    row.insertAdjacentHTML('afterend','<div class="ka-data-field"><label class="ka-data-label">কর্মীর ধরন *</label><select id="form-staff-type" class="glass-input w-full p-2.5 rounded-xl outline-none"><option value="QAT">শিক্ষক — QAT</option><option value="QAH">স্টাফ — QAH</option></select></div>');
    const sel=document.getElementById('form-staff-type');return sel;
  }
  function bootFields(){addStudentFields();addStaffFields();patchStudentHandler();patchStaffHandler();staffType();patchStudentModal();patchStaffModal();}
  function ready(){trim();bootFields();setTimeout(bootFields,500);setTimeout(bootFields,1200);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(ready,250),{once:true});else setTimeout(ready,250);
})();