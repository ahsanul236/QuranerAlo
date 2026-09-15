(function(){
  'use strict';
  if(window.__KA_DELETE_ROOT_FIX__) return;
  window.__KA_DELETE_ROOT_FIX__=true;

  const C=window.KORANER_ALO_CONFIG||{};
  const U=(C.supabaseUrl||'').replace(/\/$/,'');
  const K=C.supabaseAnonKey||'';
  const WORKSPACE=C.workspaceId||'koraner-alo';
  const token=()=>window.KORANER_ACCESS_TOKEN||'';
  const hdr=(extra)=>Object.assign({apikey:K,Authorization:'Bearer '+token(),'Content-Type':'application/json'},extra||{});

  async function adminOK(){
    const a=await fetch(U+'/auth/v1/user',{headers:hdr()});
    if(!a.ok) return false;
    const u=await a.json();
    if(!u?.id) return false;
    const m=await fetch(U+'/rest/v1/app_members?id=eq.'+encodeURIComponent(u.id)+'&select=role,status&limit=1',{headers:hdr()});
    if(!m.ok) return false;
    const rows=await m.json();
    return rows?.[0]?.role==='admin'&&rows?.[0]?.status==='active';
  }

  async function readState(){
    const r=await fetch(U+'/rest/v1/app_state?id=eq.'+encodeURIComponent(WORKSPACE)+'&select=state',{headers:hdr()});
    if(!r.ok) throw new Error('ক্লাউড ডাটা পড়া যায়নি');
    const rows=await r.json();
    if(!rows?.[0]?.state) throw new Error('ক্লাউড ডাটা পাওয়া যায়নি');
    return rows[0].state;
  }

  async function writeState(state){
    const r=await fetch(U+'/rest/v1/app_state?on_conflict=id',{method:'POST',headers:hdr({Prefer:'resolution=merge-duplicates,return=minimal'}),body:JSON.stringify({id:WORKSPACE,state,updated_at:new Date().toISOString()})});
    if(!r.ok) throw new Error(await r.text());
  }

  async function audit(action,detail){
    try{
      const u=await (await fetch(U+'/auth/v1/user',{headers:hdr()})).json();
      if(!u?.id)return;
      await fetch(U+'/rest/v1/audit_logs',{method:'POST',headers:hdr({Prefer:'return=minimal'}),body:JSON.stringify({workspace_id:WORKSPACE,user_id:u.id,email:u.email||'',action,detail})});
    }catch(e){}
  }

  function arr(x){return Array.isArray(x)?x:[];}
  function cleanDeleted(s){
    s.deletedStudents=[...new Set(arr(s.deletedStudents).map(String))];
    s.deletedStaffs=[...new Set(arr(s.deletedStaffs).map(String))];
    const ds=new Set(s.deletedStudents),dt=new Set(s.deletedStaffs);
    s.students=arr(s.students).filter(x=>!ds.has(String(x?.id??'')));
    s.studentPayments=arr(s.studentPayments).filter(x=>!ds.has(String(x?.studentId??'')));
    s.staffs=arr(s.staffs).filter(x=>!dt.has(String(x?.id??'')));
    s.salaryPayments=arr(s.salaryPayments).filter(x=>!dt.has(String(x?.staffId??'')));
    return s;
  }

  async function rootDelete(kind,id){
    if(!(await adminOK())){window.showToast?.('শুধু Super Admin ডিলিট করতে পারবেন।',false);return;}
    const sid=String(id||'').trim();
    if(!sid)return;
    const label=kind==='student'?'স্টুডেন্ট':'শিক্ষক/স্টাফ';
    if(!window.confirm(label+' '+sid+' স্থায়ীভাবে ডিলিট করবেন?'))return;
    try{
      const s=cleanDeleted(await readState());
      if(kind==='student'){
        if(!arr(s.students).some(x=>String(x?.id??'')===sid)){window.showToast?.('স্টুডেন্টটি ক্লাউডে পাওয়া যায়নি।',false);return;}
        s.deletedStudents.push(sid);
      }else{
        if(!arr(s.staffs).some(x=>String(x?.id??'')===sid)){window.showToast?.('শিক্ষক/স্টাফটি ক্লাউডে পাওয়া যায়নি।',false);return;}
        s.deletedStaffs.push(sid);
      }
      cleanDeleted(s);
      await writeState(s);
      window.state=Object.assign({},window.state||{},s);
      try{localStorage.setItem('koraner_alo_db_v2',JSON.stringify(window.state));}catch(e){}
      window.refreshUIViews?.();
      await audit('ডিলিট',label+' আইডি '+sid+' স্থায়ীভাবে ডিলিট করা হয়েছে');
      window.showToast?.(label+' '+sid+' স্থায়ীভাবে ডিলিট হয়েছে।');
    }catch(e){
      console.error('KA delete root',e);
      window.showToast?.('ডিলিট ব্যর্থ: '+(e?.message||'অজানা সমস্যা'),false);
    }
  }

  window.deleteStudent=function(id){rootDelete('student',id);};
  window.deleteStaff=function(id){rootDelete('staff',id);};
  window.KA_ROOT_DELETE=rootDelete;
})();
