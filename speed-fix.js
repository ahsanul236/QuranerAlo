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

  function trim(){
    const nav=document.querySelector('header .max-w-7xl.mx-auto.flex.gap-2.text-sm');
    if(nav)nav.style.willChange='auto';
    document.querySelectorAll('svg').forEach(x=>{if(!x.getAttribute('aria-hidden')&&!x.closest('button'))x.setAttribute('aria-hidden','true');});
  }

  const val=id=>document.getElementById(id)?.value||'';
  function field(id,label,type='text',placeholder='',attrs=''){
    return '<div class="ka-data-field"><label class="ka-data-label">'+label+'</label><input id="'+id+'" type="'+type+'" class="glass-input w-full p-2.5 rounded-xl outline-none" placeholder="'+placeholder+'" '+attrs+'></div>';
  }
  function addStudentFields(){
    const name=document.getElementById('form-student-name'), phone=document.getElementById('form-phone');
    if(!name||!phone||document.getElementById('form-student-name-bn'))return;
    name.parentElement.innerHTML='<label class="block font-semibold text-slate-300 mb-1">নাম (বাংলা) *</label><input type="text" id="form-student-name-bn" required placeholder="পূর্ণ নাম বাংলায়" class="glass-input w-full p-2.5 rounded-xl outline-none">'+field('form-student-name-en','নাম (English)','text','Full name in English');
    const birth=field('form-student-birth-reg','জন্মনিবন্ধন নং','text','জন্মনিবন্ধন নম্বর');
    phone.parentElement.insertAdjacentHTML('beforebegin',birth);
  }
  function addStaffFields(){
    const name=document.getElementById('form-staff-name'), id=document.getElementById('form-staff-id'), father=document.getElementById('form-staff-father');
    if(!name||!id||document.getElementById('form-staff-name-bn'))return;
    name.parentElement.innerHTML='<label class="block font-semibold text-slate-300 mb-1">নাম (বাংলা) *</label><input type="text" id="form-staff-name-bn" required placeholder="পূর্ণ নাম বাংলায়" class="glass-input w-full p-2.5 rounded-xl outline-none">'+field('form-staff-name-en','নাম (English)','text','Full name in English');
    const nid=field('form-staff-nid','জাতীয় পরিচয় পত্র নং','text','NID নম্বর');
    father.parentElement.insertAdjacentHTML('beforebegin',nid);
  }
  function readStudentNames(){return{bn:val('form-student-name-bn').trim(),en:val('form-student-name-en').trim()};}
  function readStaffNames(){return{bn:val('form-staff-name-bn').trim(),en:val('form-staff-name-en').trim()};}
  function syncLegacyStudentName(){const e=document.getElementById('form-student-name');if(e)e.value=val('form-student-name-bn').trim()||val('form-student-name-en').trim();}
  function syncLegacyStaffName(){const e=document.getElementById('form-staff-name');if(e)e.value=val('form-staff-name-bn').trim()||val('form-staff-name-en').trim();}
  function patchStudentHandler(){
    if(window.__KA_STUDENT_FIELDS_PATCHED||typeof window.handleStudentFormSubmit!=='function')return;
    const orig=window.handleStudentFormSubmit;
    window.handleStudentFormSubmit=function(e){
      syncLegacyStudentName();
      const id=val('form-student-id'), editId=val('form-student-edit-id');
      orig.apply(this,arguments);
      const s=(window.state?.students||[]).find(x=>x.id===(editId||id));
      if(s){const n=readStudentNames();s.nameBn=n.bn;s.nameEn=n.en;s.name=n.bn||n.en;s.birthRegNo=val('form-student-birth-reg').trim();window.saveData?.();window.refreshUIViews?.();}
    };
    window.__KA_STUDENT_FIELDS_PATCHED=true;
  }
  function patchStaffHandler(){
    if(window.__KA_STAFF_FIELDS_PATCHED||typeof window.handleStaffFormSubmit!=='function')return;
    const orig=window.handleStaffFormSubmit;
    window.handleStaffFormSubmit=function(e){
      syncLegacyStaffName();
      const id=val('form-staff-id'), editId=val('form-staff-edit-id');
      orig.apply(this,arguments);
      const st=(window.state?.staffs||[]).find(x=>x.id===(editId||id));
      if(st){const n=readStaffNames();st.nameBn=n.bn;st.nameEn=n.en;st.name=n.bn||n.en;st.nidNo=val('form-staff-nid').trim();st.staffType=val('form-staff-type')||((st.id||'').startsWith('QAH-')?'QAH':'QAT');window.saveData?.();window.refreshUIViews?.();}
    };
    window.__KA_STAFF_FIELDS_PATCHED=true;
  }
  function patchStudentModal(){
    if(typeof window.openStudentModal!=='function'||window.__KA_STUDENT_MODAL_PATCHED)return;
    const orig=window.openStudentModal;
    window.openStudentModal=function(editId){
      addStudentFields();
      const r=orig.apply(this,arguments);
      setTimeout(()=>{
        const s=editId?(window.state?.students||[]).find(x=>x.id===editId):null;
        if(s){document.getElementById('form-student-name-bn').value=s.nameBn||s.name||'';document.getElementById('form-student-name-en').value=s.nameEn||'';document.getElementById('form-student-birth-reg').value=s.birthRegNo||'';}
        else{document.getElementById('form-student-name-bn').value='';document.getElementById('form-student-name-en').value='';document.getElementById('form-student-birth-reg').value='';}
      },0);
      return r;
    };
    window.__KA_STUDENT_MODAL_PATCHED=true;
  }
  function patchStaffModal(){
    if(typeof window.openStaffModal!=='function'||window.__KA_STAFF_MODAL_PATCHED)return;
    const orig=window.openStaffModal;
    window.openStaffModal=function(editId){
      addStaffFields();
      const r=orig.apply(this,arguments);
      setTimeout(()=>{
        const st=editId?(window.state?.staffs||[]).find(x=>x.id===editId):null;
        const sel=document.getElementById('form-staff-type');
        if(st){document.getElementById('form-staff-name-bn').value=st.nameBn||st.name||'';document.getElementById('form-staff-name-en').value=st.nameEn||'';document.getElementById('form-staff-nid').value=st.nidNo||'';if(sel){sel.value=st.staffType||((st.id||'').startsWith('QAH-')?'QAH':'QAT');sel.disabled=true;}}
        else if(sel){sel.disabled=false;sel.value='QAT';}
      },0);
      return r;
    };
    window.__KA_STAFF_MODAL_PATCHED=true;
  }
  function patchStaffType(){
    if(document.getElementById('form-staff-type'))return;
    const id=document.getElementById('form-staff-id');if(!id)return;
    const row=id.closest('div.grid')||id.parentElement?.parentElement;if(!row)return;
    const holder=document.createElement('div');holder.innerHTML='<label class="block font-semibold text-slate-300 mb-1">কর্মীর ধরন *</label><select id="form-staff-type" class="glass-input w-full p-2.5 rounded-xl outline-none"><option value="QAT">শিক্ষক — QAT</option><option value="QAH">স্টাফ — QAH</option></select>';row.appendChild(holder.firstElementChild);
    const sel=document.getElementById('form-staff-type'), idInput=document.getElementById('form-staff-id');
    sel.addEventListener('change',()=>{if(window.__KA_STAFF_MODAL_OPEN_NEW){idInput.value=(sel.value==='QAH'?'QAH-':'QAT-')+String(new Date().getFullYear()).slice(-2)+'-01';}});
  }
  function bootFields(){
    addStudentFields();addStaffFields();patchStudentHandler();patchStaffHandler();patchStaffType();patchStudentModal();patchStaffModal();
  }
  function ready(){trim();bootFields();setTimeout(bootFields,500);setTimeout(bootFields,1200);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(ready,250),{once:true});else setTimeout(ready,250);
})();