(function(){
  'use strict';
  if(window.__KA_DELETE_FIX_V3__) return;
  window.__KA_DELETE_FIX_V3__=true;

  const C=window.KORANER_ALO_CONFIG||{};
  const U=(C.supabaseUrl||'').replace(/\/$/,'');
  const K=C.supabaseAnonKey||'';
  const WORKSPACE=C.workspaceId||'koraner-alo';
  const token=()=>window.KORANER_ACCESS_TOKEN||'';
  const hdr=(extra)=>Object.assign({apikey:K,Authorization:'Bearer '+token(),'Content-Type':'application/json'},extra||{});

  async function currentAdmin(){
    if(!U||!K||!token()) return false;
    try{
      const ur=await fetch(U+'/auth/v1/user',{headers:hdr()});
      if(!ur.ok) return false;
      const user=await ur.json();
      if(!user?.id) return false;
      const mr=await fetch(U+'/rest/v1/app_members?id=eq.'+encodeURIComponent(user.id)+'&select=role,status&limit=1',{headers:hdr()});
      if(!mr.ok) return false;
      const rows=await mr.json();
      return rows?.[0]?.status==='active' && rows?.[0]?.role==='admin';
    }catch(e){console.warn('admin check failed',e);return false;}
  }

  async function cloudState(){
    const r=await fetch(U+'/rest/v1/app_state?id=eq.'+encodeURIComponent(WORKSPACE)+'&select=state',{headers:hdr()});
    if(!r.ok) throw new Error('ক্লাউড ডাটা পড়া যায়নি');
    const rows=await r.json();
    if(!rows?.[0]?.state) throw new Error('ক্লাউড ডাটা পাওয়া যায়নি');
    return rows[0].state;
  }

  async function saveCloud(state){
    const r=await fetch(U+'/rest/v1/app_state?on_conflict=id',{method:'POST',headers:hdr({Prefer:'resolution=merge-duplicates,return=minimal'}),body:JSON.stringify({id:WORKSPACE,state,updated_at:new Date().toISOString()})});
    if(!r.ok) throw new Error(await r.text());
  }

  async function writeAudit(action,detail){
    try{
      const ur=await fetch(U+'/auth/v1/user',{headers:hdr()});
      if(!ur.ok) return;
      const u=await ur.json();
      if(!u?.id) return;
      await fetch(U+'/rest/v1/audit_logs',{method:'POST',headers:hdr({Prefer:'return=minimal'}),body:JSON.stringify({workspace_id:WORKSPACE,user_id:u.id,email:u.email||window.KA_MEMBER?.email||'',action,detail})});
    }catch(e){}
  }

  async function doDelete(kind,id){
    if(!(await currentAdmin())){
      window.showToast?.('ডিলিট করার জন্য Super Admin অনুমোদন প্রয়োজন।',false);
      return;
    }
    const label=kind==='student'?'স্টুডেন্ট':'শিক্ষক/স্টাফ';
    const text=kind==='student'?('স্টুডেন্ট '+id+' স্থায়ীভাবে ডিলিট করবেন?'):('শিক্ষক/স্টাফ '+id+' স্থায়ীভাবে ডিলিট করবেন?');
    if(!window.confirm(text)) return;
    try{
      const cloud=await cloudState();
      const next=Object.assign({},cloud);
      next.students=Array.isArray(cloud.students)?cloud.students.slice():[];
      next.studentPayments=Array.isArray(cloud.studentPayments)?cloud.studentPayments.slice():[];
      next.staffs=Array.isArray(cloud.staffs)?cloud.staffs.slice():[];
      next.salaryPayments=Array.isArray(cloud.salaryPayments)?cloud.salaryPayments.slice():[];
      const before=kind==='student'?next.students.length:next.staffs.length;
      if(kind==='student'){
        next.students=next.students.filter(x=>String(x?.id??'')!==String(id));
        next.studentPayments=next.studentPayments.filter(x=>String(x?.studentId??'')!==String(id));
      }else{
        next.staffs=next.staffs.filter(x=>String(x?.id??'')!==String(id));
        next.salaryPayments=next.salaryPayments.filter(x=>String(x?.staffId??'')!==String(id));
      }
      const after=kind==='student'?next.students.length:next.staffs.length;
      if(after===before){
        window.showToast?.(label+' আইডি '+id+' ক্লাউডে পাওয়া যায়নি।',false);
        return;
      }
      await saveCloud(next);
      window.state=Object.assign({},window.state||{},next);
      try{localStorage.setItem('koraner_alo_db_v2',JSON.stringify(window.state));}catch(e){}
      if(typeof window.refreshUIViews==='function') window.refreshUIViews();
      await writeAudit('ডিলিট',label+' আইডি '+id+' স্থায়ীভাবে ডিলিট করা হয়েছে');
      window.showToast?.(label+' '+id+' ডিলিট হয়েছে।');
    }catch(e){
      console.error('KA delete v3',e);
      window.showToast?.('ডিলিট ব্যর্থ: '+(e?.message||'অজানা সমস্যা'),false);
    }
  }

  function bindButtons(){
    document.querySelectorAll('#students-table-body button, #staffs-table-body button').forEach(btn=>{
      if(btn.dataset.kaDeleteV3==='1') return;
      if(!btn.querySelector('.fa-trash')) return;
      const tr=btn.closest('tr');
      const cells=tr?.querySelectorAll('td');
      const id=String(cells?.[0]?.textContent||'').trim();
      const student=!!btn.closest('#students-table-body');
      if(!id) return;
      btn.dataset.kaDeleteV3='1';
      btn.removeAttribute('onclick');
      btn.addEventListener('click',function(ev){
        ev.preventDefault();
        ev.stopImmediatePropagation();
        doDelete(student?'student':'staff',id);
      },true);
    });
  }

  function boot(){
    bindButtons();
    setTimeout(bindButtons,250);
    setTimeout(bindButtons,800);
    setTimeout(bindButtons,1600);
  }

  window.KA_FORCE_DELETE_V3=doDelete;
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
  window.addEventListener('load',boot);
  window.addEventListener('koraner-auth-ready',()=>setTimeout(boot,400));
  if(window.MutationObserver) new MutationObserver(()=>bindButtons()).observe(document.body,{childList:true,subtree:true});
})();
