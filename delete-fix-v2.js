(function(){
  'use strict';
  if(window.__KA_DELETE_FIX_V2__) return;
  window.__KA_DELETE_FIX_V2__=true;

  const C=window.KORANER_ALO_CONFIG||{};
  const U=(C.supabaseUrl||'').replace(/\/$/,'');
  const K=C.supabaseAnonKey||'';
  const WORKSPACE=C.workspaceId||'koraner-alo';
  const token=()=>window.KORANER_ACCESS_TOKEN||'';
  const headers=()=>({apikey:K,Authorization:'Bearer '+token(),'Content-Type':'application/json'});
  const isAdmin=()=>window.KA_MEMBER?.status==='active'&&window.KA_MEMBER?.role==='admin';

  async function readCloud(){
    const r=await fetch(U+'/rest/v1/app_state?id=eq.'+encodeURIComponent(WORKSPACE)+'&select=state',{headers:headers()});
    if(!r.ok) throw new Error('Cloud data পড়া যায়নি');
    const rows=await r.json();
    if(!rows?.[0]?.state) throw new Error('Cloud data পাওয়া যায়নি');
    return rows[0].state;
  }

  async function writeCloud(state){
    const r=await fetch(U+'/rest/v1/app_state?on_conflict=id',{method:'POST',headers:Object.assign(headers(),{Prefer:'resolution=merge-duplicates,return=minimal'}),body:JSON.stringify({id:WORKSPACE,state,updated_at:new Date().toISOString()})});
    if(!r.ok) throw new Error(await r.text());
  }

  async function audit(action,detail){
    try{
      const u=await fetch(U+'/auth/v1/user',{headers:headers()});
      if(!u.ok)return;
      const user=await u.json();
      if(!user?.id)return;
      await fetch(U+'/rest/v1/audit_logs',{method:'POST',headers:Object.assign(headers(),{Prefer:'return=minimal'}),body:JSON.stringify({workspace_id:WORKSPACE,user_id:user.id,email:window.KA_MEMBER?.email||user.email||'',action,detail})});
    }catch(e){}
  }

  async function performDelete(kind,id){
    if(!isAdmin()){
      window.showToast?.('শুধু Super Admin ডিলিট করতে পারবেন।',false);
      return;
    }
    if(!id)return;
    try{
      const cloud=await readCloud();
      const next=Object.assign({},cloud);
      if(kind==='student'){
        const before=Array.isArray(cloud.students)?cloud.students.length:0;
        next.students=(cloud.students||[]).filter(x=>String(x?.id||'')!==String(id));
        next.studentPayments=(cloud.studentPayments||[]).filter(x=>String(x?.studentId||'')!==String(id));
        if(next.students.length===before){window.showToast?.('স্টুডেন্টটি ক্লাউডে পাওয়া যায়নি।',false);return;}
      }else{
        const before=Array.isArray(cloud.staffs)?cloud.staffs.length:0;
        next.staffs=(cloud.staffs||[]).filter(x=>String(x?.id||'')!==String(id));
        next.salaryPayments=(cloud.salaryPayments||[]).filter(x=>String(x?.staffId||'')!==String(id));
        if(next.staffs.length===before){window.showToast?.('শিক্ষক/স্টাফটি ক্লাউডে পাওয়া যায়নি।',false);return;}
      }

      // Keep the current cloud record as the single source for deletion so the integrity merger cannot re-add the deleted row.
      window.state=next;
      try{localStorage.setItem('koraner_alo_db_v2',JSON.stringify(next));}catch(e){}
      await writeCloud(next);
      try{window.refreshUIViews?.();}catch(e){}
      window.showToast?.((kind==='student'?'স্টুডেন্ট':'শিক্ষক/স্টাফ')+' স্থায়ীভাবে মুছে ফেলা হয়েছে!');
      await audit('ডিলিট',(kind==='student'?'স্টুডেন্ট':'শিক্ষক/স্টাফ')+' আইডি '+id+' স্থায়ীভাবে ডিলিট করা হয়েছে');
    }catch(e){
      console.error('delete-fix-v2',e);
      window.showToast?.('ডিলিট ব্যর্থ: '+(e.message||'অজানা সমস্যা'),false);
    }
  }

  function bind(){
    if(window.__KA_DELETE_DELEGATED__)return;
    window.__KA_DELETE_DELEGATED__=true;
    document.addEventListener('click',function(ev){
      const btn=ev.target.closest?.('#students-table-body button, #staffs-table-body button');
      if(!btn)return;
      if(!btn.querySelector?.('.fa-trash'))return;
      ev.preventDefault();
      ev.stopPropagation();
      const tr=btn.closest('tr');
      if(!tr)return;
      const cells=tr.querySelectorAll('td');
      const id=String(cells[0]?.textContent||'').trim();
      if(!id)return;
      const kind=tr.closest('#students-table-body')?'student':'staff';
      const msg=kind==='student'?`আপনি কি স্টুডেন্ট আইডি ${id} স্থায়ীভাবে ডিলিট করতে চান?`:`আপনি কি শিক্ষক/স্টাফ আইডি ${id} স্থায়ীভাবে ডিলিট করতে চান?`;
      const ok=()=>performDelete(kind,id);
      if(typeof window.showConfirm==='function') window.showConfirm(msg,ok); else if(window.confirm(msg)) ok();
    },true);
  }

  window.KA_FORCE_DELETE=performDelete;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
  window.addEventListener('load',()=>setTimeout(bind,250));
})();
