import{createClient}from'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';import{getAccess}from'./authz.js';
const c=window.QURANER_ALO_CONFIG,supabase=createClient(c.supabaseUrl,c.supabasePublishableKey,{auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:true}}),$=id=>document.getElementById(id);
const qs=new URLSearchParams(location.search),type=qs.get('type')==='teacher'?'teacher':'helper',id=qs.get('id');let access=null,row=null,editing=false;
const msg=(t,k='')=>{$('message').textContent=t;$('message').className=`message-inline ${k}`.trim()};
const canView=()=>access?.can(type==='teacher'?'teachers.view':'staff.view');
const canManage=()=>access?.can(type==='teacher'?'teachers.manage':'staff.manage');
function setInputs(on){['fullName','fullNameBn','phone','email','specialization','joiningDate','active','notes','fatherName','motherName','nidNumber','address'].forEach(x=>{if($(x))$(x).disabled=!on})}
function updateContext(){
  const teacher=type==='teacher';
  $('topBack').href=`staff.html#${teacher?'teachers':'helpers'}`;
  $('topBack').textContent=teacher?'Teacher List':'Helper List';
  $('backBtn').href=`staff.html#${teacher?'teachers':'helpers'}`;
  $('title').textContent=teacher?'Teacher Profile':'Helper Profile';
  $('modeBadge').textContent='View mode';
  $('specialWrap').classList.toggle('hidden',!teacher);
  $('bnWrap').classList.toggle('hidden',!teacher);
}
function fill(){
  const teacher=type==='teacher';
  $('code').value=teacher?row.teacher_code:row.staff_code;
  $('fullName').value=row.full_name||'';
  $('fullNameBn').value=row.full_name_bn||'';
  $('phone').value=row.phone||'';
  $('email').value=row.email||'';
  $('specialization').value=teacher?row.specialization||'':'';
  $('fatherName').value=row.father_name||'';
  $('motherName').value=row.mother_name||'';
  $('nidNumber').value=row.nid_number||'';
  $('address').value=row.address||'';
  $('joiningDate').value=row.joining_date||'';
  $('active').value=String(row.active!==false);
  $('notes').value=row.notes||'';
  $('subtitle').textContent=`${teacher?'Teacher':'Helper'} ID: ${teacher?row.teacher_code:row.staff_code}`;
}
function syncMode(){
  const canEdit=editing&&canManage();
  setInputs(canEdit);
  $('modeBadge').textContent=canEdit?'Edit mode':'View mode';
  $('editBtn').classList.toggle('hidden',editing||!canManage());
  $('removeBtn').classList.toggle('hidden',editing||!canManage());
  $('saveBtn').classList.toggle('hidden',!editing);
  $('cancelBtn').classList.toggle('hidden',!editing);
}
async function load(){
  if(!id)throw Error('Profile ID সঠিক নয়।');
  updateContext();
  const table=type==='teacher'?'qa_teachers':'qa_staff';
  const fields=type==='teacher'
    ?'teacher_id,teacher_code,full_name,full_name_bn,phone,email,specialization,joining_date,active,notes,user_id'
    :'staff_id,staff_code,full_name,phone,email,joining_date,active,notes,user_id';
  const{data,error}=await supabase.from(table).select(fields).eq(type==='teacher'?'teacher_id':'staff_id',id).maybeSingle();
  if(error)throw error;
  if(!data)throw Error('Profile পাওয়া যায়নি।');
  row=data;
  fill();
  syncMode();
}
$('editBtn').onclick=()=>{editing=true;msg('');syncMode()};
$('cancelBtn').onclick=async()=>{editing=false;msg('');await load()};
$('form').onsubmit=async e=>{
  e.preventDefault();
  if(!canManage())return msg(`${type==='teacher'?'Teacher':'Helper'} edit permission নেই।`,'error');
  $('saveBtn').disabled=true;msg('Saving…');
  const payload={full_name:$('fullName').value.trim(),phone:$('phone').value.trim(),email:$('email').value.trim(),father_name:$('fatherName').value.trim(),mother_name:$('motherName').value.trim(),nid_number:$('nidNumber').value.trim(),address:$('address').value.trim(),joining_date:$('joiningDate').value||null,active:$('active').value==='true',notes:$('notes').value.trim()};
  if(type==='teacher'){payload.full_name_bn=$('fullNameBn').value.trim();payload.specialization=$('specialization').value.trim()||null}
  try{
    const{error}=await supabase.from(type==='teacher'?'qa_teachers':'qa_staff').update(payload).eq(type==='teacher'?'teacher_id':'staff_id',id);
    if(error)throw error;
    editing=false;await load();msg('Profile updated successfully.','success');
  }catch(e){console.error(e);msg(e.message||'Profile update করা যায়নি।','error')}finally{$('saveBtn').disabled=false}
};
$('removeBtn').onclick=async()=>{
  if(!canManage()){msg(`${type==='teacher'?'Teacher':'Helper'} remove permission নেই।`,'error');return}
  const name=row?.full_name|| (type==='teacher'?row?.teacher_code:row?.staff_code)||'এই profile';
  const label=type==='teacher'?'Teacher':'Helper';
  const ok=window.confirm(`আপনি কি "${name}"-এর ${label} profile remove করতে চান?\n\nProfile স্থায়ীভাবে delete করা হবে না। Record-এর Active status বন্ধ করা হবে, ফলে এটি list-এ আর দেখাবে না। পুরোনো payroll, portal এবং অন্যান্য history database-এ সংরক্ষিত থাকবে।\n\nনিশ্চিত করতে OK চাপুন।`);
  if(!ok)return;
  $('removeBtn').disabled=true;msg('Removing profile…');
  try{
    const{error}=await supabase.from(type==='teacher'?'qa_teachers':'qa_staff').update({active:false}).eq(type==='teacher'?'teacher_id':'staff_id',id);
    if(error)throw error;
    location.replace(`staff.html#${type==='teacher'?'teachers':'helpers'}`);
  }catch(e){console.error(e);msg(e?.message||'Profile remove করা যায়নি।','error');$('removeBtn').disabled=false}
};
$('signOut').onclick=async()=>{await supabase.auth.signOut();location.replace('./')};
(async()=>{
  try{
    access=await getAccess(supabase);
    if(!access){await supabase.auth.signOut();return location.replace('./')}
    if(!canView()&&!canManage())throw Error('Profile দেখার permission নেই।');
    $('loading').classList.add('hidden');$('app').classList.remove('hidden');await load();
  }catch(e){console.error(e);$('loading').classList.add('hidden');$('errorBox').textContent=e.message||'Profile load করা যায়নি।';$('errorBox').classList.remove('hidden')}
})();