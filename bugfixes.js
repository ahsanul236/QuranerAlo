(function(){
  'use strict';
  if(window.__KA_BUGFIXES_V2__) return;
  window.__KA_BUGFIXES_V2__=true;

  const C=window.KORANER_ALO_CONFIG||{};
  const U=(C.supabaseUrl||'').replace(/\/$/,'');
  const K=C.supabaseAnonKey||'';
  const WORKSPACE=C.workspaceId||'koraner-alo';
  const token=()=>window.KORANER_ACCESS_TOKEN||'';
  const headers=extra=>Object.assign({apikey:K,Authorization:'Bearer '+token(),'Content-Type':'application/json'},extra||{});
  const active=()=>window.KA_MEMBER?.status==='active';
  const admin=()=>active()&&window.KA_MEMBER?.role==='admin';
  const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));

  async function authUserId(){
    if(!U||!K||!token()) return null;
    try{
      const r=await fetch(U+'/auth/v1/user',{headers:headers()});
      if(!r.ok) return null;
      const j=await r.json();
      return j?.id||null;
    }catch(e){return null;}
  }

  async function auditServer(action,detail){
    if(!active()||!U||!K||!token()) return;
    try{
      const uid=await authUserId();
      if(!uid) return;
      await fetch(U+'/rest/v1/audit_logs',{method:'POST',headers:headers({Prefer:'return=minimal'}),body:JSON.stringify({workspace_id:WORKSPACE,user_id:uid,email:window.KA_MEMBER?.email||'',action:String(action||''),detail:String(detail||'')})});
    }catch(e){console.warn('Audit log write skipped',e);}
  }

  function preserveState(){
    const s=window.state||{};
    s.siteSettings=s.siteSettings||{};
    s.students=Array.isArray(s.students)?s.students:[];
    s.studentPayments=Array.isArray(s.studentPayments)?s.studentPayments:[];
    s.staffs=Array.isArray(s.staffs)?s.staffs:[];
    s.salaryPayments=Array.isArray(s.salaryPayments)?s.salaryPayments:[];
    s.expenses=Array.isArray(s.expenses)?s.expenses:[];
    s.auditLogs=Array.isArray(s.auditLogs)?s.auditLogs:[];
    window.state=s;
    try{localStorage.setItem('koraner_alo_db_v2',JSON.stringify(s));}catch(e){}
    return s;
  }

  function patchSaveData(){
    if(window.__KA_SAVE_DATA_PRESERVE_PATCHED || typeof window.saveData!=='function') return;
    window.saveData=function(){
      const s=preserveState();
      try{ window.pushStateToCloud?.(); }catch(e){ console.warn('Cloud save skipped',e); }
      if(active()) auditServer('ডেটা সংরক্ষণ','একটি ডেটা পরিবর্তন সংরক্ষণ করা হয়েছে');
    };
    window.__KA_SAVE_DATA_PRESERVE_PATCHED=true;
  }

  async function fetchCloud(){
    if(!U||!K||!token()) throw new Error('Cloud session পাওয়া যায়নি');
    const r=await fetch(U+'/rest/v1/app_state?id=eq.'+encodeURIComponent(WORKSPACE)+'&select=state',{headers:headers()});
    if(!r.ok) throw new Error('Cloud data পড়া যায়নি');
    const rows=await r.json();
    if(!rows?.[0]?.state) throw new Error('Cloud data পাওয়া যায়নি');
    return rows[0].state;
  }

  function mergeArray(localArr,cloudArr){
    const map=new Map();
    (Array.isArray(cloudArr)?cloudArr:[]).forEach(x=>{if(x&&x.id!=null) map.set(String(x.id),x);});
    (Array.isArray(localArr)?localArr:[]).forEach(x=>{if(x&&x.id!=null) map.set(String(x.id),x);});
    return [...map.values(),...(Array.isArray(localArr)?localArr.filter(x=>!x||x.id==null):[]),...(Array.isArray(cloudArr)?cloudArr.filter(x=>!x||x.id==null):[])];
  }

  async function writeCloud(state){
    const r=await fetch(U+'/rest/v1/app_state?on_conflict=id',{method:'POST',headers:headers({Prefer:'resolution=merge-duplicates,return=minimal'}),body:JSON.stringify({id:WORKSPACE,state,updated_at:new Date().toISOString()})});
    if(!r.ok) throw new Error(await r.text());
  }

  async function performDelete(kind,id){
    if(!admin()) throw new Error('শুধু Super Admin ডিলিট করতে পারবেন।');
    const label=kind==='student'?'স্টুডেন্ট':'শিক্ষক/স্টাফ';
    const local=preserveState();
    const cloud=await fetchCloud();
    const merged=Object.assign({},cloud,local,{
      siteSettings:Object.assign({},cloud.siteSettings||{},local.siteSettings||{}),
      students:mergeArray(local.students,cloud.students),
      studentPayments:mergeArray(local.studentPayments,cloud.studentPayments),
      staffs:mergeArray(local.staffs,cloud.staffs),
      salaryPayments:mergeArray(local.salaryPayments,cloud.salaryPayments),
      expenses:mergeArray(local.expenses,cloud.expenses),
      auditLogs:mergeArray(local.auditLogs,cloud.auditLogs)
    });
    if(kind==='student'){
      merged.students=(merged.students||[]).filter(x=>String(x?.id||'')!==String(id));
      merged.studentPayments=(merged.studentPayments||[]).filter(x=>String(x?.studentId||x?.student_id||'')!==String(id));
    }else{
      merged.staffs=(merged.staffs||[]).filter(x=>String(x?.id||'')!==String(id));
      merged.salaryPayments=(merged.salaryPayments||[]).filter(x=>String(x?.staffId||x?.staff_id||'')!==String(id));
    }
    window.state=merged;
    preserveState();
    await writeCloud(window.state);
    await auditServer('ডিলিট',`${label} আইডি ${id} ডিলিট করা হয়েছে`);
    window.showToast?.(`${label} ডাটা মুছে ফেলা হয়েছে!`);
    setTimeout(()=>location.reload(),350);
  }

  function askDelete(kind,id){
    if(!admin()){window.showToast?.('শুধু Super Admin ডিলিট করতে পারবেন।',false);return;}
    const text=kind==='student'?`আপনি কি স্টুডেন্ট আইডি ${id} স্থায়ীভাবে ডিলিট করতে চান?`:`আপনি কি শিক্ষক/স্টাফ আইডি ${id} স্থায়ীভাবে ডিলিট করতে চান?`;
    const go=()=>performDelete(kind,id).catch(e=>{console.error(e);window.showToast?.('ডিলিট ব্যর্থ হয়েছে: '+(e.message||'অজানা সমস্যা'),false);});
    if(typeof window.showConfirm==='function') window.showConfirm(text,go); else if(window.confirm(text)) go();
  }

  function patchDeleteFunctions(){
    window.deleteStudent=function(id){askDelete('student',id);};
    window.deleteStaff=function(id){askDelete('staff',id);};
  }

  function deleteButton(btn){
    if(!btn) return false;
    const s=((btn.getAttribute('onclick')||'')+' '+(btn.getAttribute('title')||'')+' '+(btn.getAttribute('aria-label')||'')+' '+(btn.textContent||'')+' '+(btn.innerHTML||'')).toLowerCase();
    return /trash|delete|ডিলিট|মুছ/.test(s);
  }

  function extractId(btn,view){
    const re=/(QAS-\d{2}-\d{3}|QAT-\d{2}-\d{2}|QAH-\d{2}-\d{2})/i;
    const probes=[];
    const onclick=btn.getAttribute('onclick')||'';
    probes.push(onclick,btn.getAttribute('data-id')||'',btn.dataset?.studentId||'',btn.dataset?.staffId||'',btn.textContent||'');
    const row=btn.closest('tr,[data-id],[data-student-id],[data-staff-id],.glass-panel');
    if(row){probes.push(row.getAttribute('data-id')||'',row.getAttribute('data-student-id')||'',row.getAttribute('data-staff-id')||'',row.textContent||'');}
    for(const p of probes){const m=String(p||'').match(re);if(m)return m[1];}
    return null;
  }

  function patchDeleteClicks(){
    if(window.__KA_DELETE_CLICK_CAPTURE__) return;
    document.addEventListener('click',function(e){
      if(!admin()) return;
      const btn=e.target?.closest?.('button,a,[role="button"]');
      if(!btn||!deleteButton(btn)) return;
      const studentView=btn.closest('#view-students');
      const staffView=btn.closest('#view-staffs');
      if(!studentView&&!staffView) return;
      const view=studentView||staffView;
      if(view.classList.contains('hidden')) return;
      const id=extractId(btn,view);
      if(!id) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      askDelete(studentView?'student':'staff',id);
    },true);
    window.__KA_DELETE_CLICK_CAPTURE__=true;
  }

  async function loadServerAudit(){
    if(!admin()||!U||!K||!token()) return;
    const box=document.getElementById('ka-audit-list');
    if(!box) return;
    try{
      const r=await fetch(U+'/rest/v1/audit_logs?workspace_id=eq.'+encodeURIComponent(WORKSPACE)+'&select=created_at,email,action,detail&order=created_at.desc&limit=500',{headers:headers()});
      if(!r.ok) return;
      const rows=await r.json();
      box.innerHTML=rows.length?rows.map(x=>'<tr><td>'+esc(new Date(x.created_at).toLocaleString('bn-BD'))+'</td><td>'+esc(x.email)+'</td><td>'+esc(x.action)+'</td><td>'+esc(x.detail)+'</td></tr>').join(''):'<tr><td colspan="4" style="text-align:center;padding:24px;color:#94a3b8">এখনও কোনো audit event নেই।</td></tr>';
    }catch(e){console.warn('Audit log read skipped',e);}
  }

  function patchAuditUI(){
    const btn=document.getElementById('ka-audit-refresh');
    if(btn&&!btn.dataset.kaServerAudit){btn.dataset.kaServerAudit='1';btn.addEventListener('click',()=>setTimeout(loadServerAudit,50));}
    const tab=document.getElementById('tab-audit-logs');
    if(tab&&!tab.dataset.kaServerAudit){tab.dataset.kaServerAudit='1';tab.addEventListener('click',()=>setTimeout(loadServerAudit,150));}
    if(document.getElementById('ka-audit-view')&&!document.getElementById('ka-audit-view').classList.contains('hidden')) loadServerAudit();
  }

  function boot(){
    patchSaveData();
    patchDeleteFunctions();
    patchDeleteClicks();
    patchAuditUI();
    setTimeout(patchSaveData,300);setTimeout(patchDeleteFunctions,300);setTimeout(patchAuditUI,400);
  }
  window.addEventListener('load',()=>setTimeout(boot,700));
  window.addEventListener('koraner-auth-ready',()=>setTimeout(boot,500));
  setInterval(boot,2500);
})();
