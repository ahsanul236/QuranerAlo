(function(){
  'use strict';
  if(window.__KA_SYNC_DELETE_CONFLICT_FIX__) return;
  window.__KA_SYNC_DELETE_CONFLICT_FIX__=true;

  const C=window.KORANER_ALO_CONFIG||{};
  const U=(C.supabaseUrl||'').replace(/\/$/,'');
  const K=C.supabaseAnonKey||'';
  const WORKSPACE=C.workspaceId||'koraner-alo';
  const token=()=>window.KORANER_ACCESS_TOKEN||'';
  const hdr=(extra)=>Object.assign({apikey:K,Authorization:'Bearer '+token(),'Content-Type':'application/json'},extra||{});
  const active=()=>window.KA_MEMBER?.status==='active';
  const admin=()=>active()&&window.KA_MEMBER?.role==='admin';

  async function authUser(){
    const r=await fetch(U+'/auth/v1/user',{headers:hdr()});
    if(!r.ok) throw new Error('সেশন পাওয়া যায়নি');
    return await r.json();
  }
  async function memberIsAdmin(){
    try{
      const u=await authUser();
      const r=await fetch(U+'/rest/v1/app_members?id=eq.'+encodeURIComponent(u.id)+'&select=role,status&limit=1',{headers:hdr()});
      if(!r.ok) return false;
      const rows=await r.json();
      return rows?.[0]?.status==='active'&&rows?.[0]?.role==='admin';
    }catch(e){ return false; }
  }
  async function readCloud(){
    const r=await fetch(U+'/rest/v1/app_state?id=eq.'+encodeURIComponent(WORKSPACE)+'&select=state',{headers:hdr()});
    if(!r.ok) throw new Error('ক্লাউড ডাটা পড়া যায়নি');
    const rows=await r.json();
    if(!rows?.[0]?.state) throw new Error('ক্লাউড ডাটা পাওয়া যায়নি');
    return rows[0].state;
  }
  async function writeCloud(state){
    const r=await fetch(U+'/rest/v1/app_state?on_conflict=id',{method:'POST',headers:hdr({Prefer:'resolution=merge-duplicates,return=minimal'}),body:JSON.stringify({id:WORKSPACE,state,updated_at:new Date().toISOString()})});
    if(!r.ok) throw new Error(await r.text());
  }
  async function writeAudit(action,detail){
    try{
      const u=await authUser();
      await fetch(U+'/rest/v1/audit_logs',{method:'POST',headers:hdr({Prefer:'return=minimal'}),body:JSON.stringify({workspace_id:WORKSPACE,user_id:u.id,email:u.email||'',action,detail})});
    }catch(e){}
  }

  function arr(v){return Array.isArray(v)?v:[];}
  function mergeById(localArr,cloudArr){
    const map=new Map();
    arr(cloudArr).forEach(x=>{if(x&&x.id!=null)map.set(String(x.id),x);});
    arr(localArr).forEach(x=>{if(x&&x.id!=null)map.set(String(x.id),x);});
    return [...map.values(),...arr(localArr).filter(x=>!x||x.id==null),...arr(cloudArr).filter(x=>!x||x.id==null)];
  }
  function tombSet(cloud,local,key){
    return new Set([...arr(cloud[key]),...arr(local[key])].map(x=>String(x)));
  }
  function applyTombs(s){
    const ds=new Set(arr(s.deletedStudents).map(String));
    const dt=new Set(arr(s.deletedStaffs).map(String));
    s.students=arr(s.students).filter(x=>!ds.has(String(x?.id??'')));
    s.studentPayments=arr(s.studentPayments).filter(x=>!ds.has(String(x?.studentId??'')));
    s.staffs=arr(s.staffs).filter(x=>!dt.has(String(x?.id??'')));
    s.salaryPayments=arr(s.salaryPayments).filter(x=>!dt.has(String(x?.staffId??'')));
    s.deletedStudents=[...ds];
    s.deletedStaffs=[...dt];
    return s;
  }

  async function conflictSafePush(){
    if(!active()||window.__KA_FINAL_SYNC_RUNNING)return;
    window.__KA_FINAL_SYNC_RUNNING=true;
    try{
      const local=window.state||{};
      const cloud=await readCloud();
      const merged=Object.assign({},cloud,local);
      ['students','studentPayments','staffs','salaryPayments','expenses'].forEach(k=>{merged[k]=mergeById(local[k],cloud[k]);});
      merged.deletedStudents=tombSet(cloud,local,'deletedStudents');
      merged.deletedStaffs=tombSet(cloud,local,'deletedStaffs');
      applyTombs(merged);
      window.state=merged;
      try{localStorage.setItem('koraner_alo_db_v2',JSON.stringify(merged));}catch(e){}
      await writeCloud(merged);
    }catch(e){console.warn('Final conflict-safe sync skipped',e);}
    finally{window.__KA_FINAL_SYNC_RUNNING=false;}
  }

  async function hardDelete(kind,id){
    if(!(await memberIsAdmin())){
      window.showToast?.('শুধু Super Admin ডিলিট করতে পারবেন।',false);return;
    }
    const label=kind==='student'?'স্টুডেন্ট':'শিক্ষক/স্টাফ';
    if(!window.confirm((kind==='student'?'স্টুডেন্ট ':'শিক্ষক/স্টাফ ')+id+' স্থায়ীভাবে ডিলিট করবেন?'))return;
    try{
      const cloud=await readCloud();
      const next=Object.assign({},cloud);
      next.deletedStudents=Array.from(new Set(arr(cloud.deletedStudents).map(String)));
      next.deletedStaffs=Array.from(new Set(arr(cloud.deletedStaffs).map(String)));
      if(kind==='student'){
        if(!arr(cloud.students).some(x=>String(x?.id??'')===String(id))){window.showToast?.('এই স্টুডেন্টটি ইতোমধ্যে ডিলিট করা হয়েছে।',false);return;}
        next.deletedStudents.push(String(id));
        next.students=arr(cloud.students).filter(x=>String(x?.id??'')!==String(id));
        next.studentPayments=arr(cloud.studentPayments).filter(x=>String(x?.studentId??'')!==String(id));
      }else{
        if(!arr(cloud.staffs).some(x=>String(x?.id??'')===String(id))){window.showToast?.('এই শিক্ষক/স্টাফ ইতোমধ্যে ডিলিট করা হয়েছে।',false);return;}
        next.deletedStaffs.push(String(id));
        next.staffs=arr(cloud.staffs).filter(x=>String(x?.id??'')!==String(id));
        next.salaryPayments=arr(cloud.salaryPayments).filter(x=>String(x?.staffId??'')!==String(id));
      }
      applyTombs(next);
      await writeCloud(next);
      window.state=Object.assign({},window.state||{},next);
      try{localStorage.setItem('koraner_alo_db_v2',JSON.stringify(window.state));}catch(e){}
      window.refreshUIViews?.();
      await writeAudit('ডিলিট',label+' আইডি '+id+' স্থায়ীভাবে ডিলিট করা হয়েছে');
      window.showToast?.(label+' '+id+' স্থায়ীভাবে ডিলিট হয়েছে।');
    }catch(e){
      console.error('Final delete failed',e);
      window.showToast?.('ডিলিট ব্যর্থ: '+(e?.message||'অজানা সমস্যা'),false);
    }
  }

  function bindDeleteButtons(){
    document.querySelectorAll('#students-table-body button, #staffs-table-body button').forEach(btn=>{
      if(!btn.querySelector('.fa-trash'))return;
      if(btn.dataset.kaFinalDelete==='1')return;
      const tr=btn.closest('tr');
      const cells=tr?.querySelectorAll('td');
      const id=String(cells?.[0]?.textContent||'').trim();
      if(!id)return;
      btn.dataset.kaFinalDelete='1';
      btn.removeAttribute('onclick');
      btn.addEventListener('click',function(ev){
        ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
        hardDelete(btn.closest('#students-table-body')?'student':'staff',id);
      },true);
    });
  }

  function patchPush(){
    window.pushStateToCloud=conflictSafePush;
  }
  function boot(){
    patchPush();bindDeleteButtons();
    setTimeout(bindDeleteButtons,300);setTimeout(bindDeleteButtons,900);setTimeout(bindDeleteButtons,1800);
  }
  window.KA_FINAL_HARD_DELETE=hardDelete;
  window.addEventListener('koraner-auth-ready',()=>setTimeout(boot,300));
  window.addEventListener('load',()=>setTimeout(boot,500));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  if(window.MutationObserver)new MutationObserver(()=>bindDeleteButtons()).observe(document.body,{childList:true,subtree:true});
})();
