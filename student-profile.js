import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import {getAccess} from './authz.js';

const c=window.QURANER_ALO_CONFIG;
const supabase=createClient(c.supabaseUrl,c.supabasePublishableKey,{auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const studentId=new URLSearchParams(location.search).get('id');
let access=null,student=null,guardians=[],editing=false;

const esc=v=>String(v??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[x]));
const login=()=>location.replace('./');
const msg=(t,type='')=>{$('saveMessage').textContent=t;$('saveMessage').className=`message-inline ${type}`.trim();};

function fillStudent(){
  $('studentCode').value=student.student_code||'';
  $('fullName').value=student.full_name||'';
  $('gender').value=['male','female','unspecified'].includes(student.gender)?student.gender:'unspecified';
  $('dateOfBirth').value=student.date_of_birth||'';
  $('email').value=student.email||'';
  $('admissionDate').value=student.admission_date||'';
  $('status').value=['active','inactive','graduated','suspended','withdrawn'].includes(student.status)?student.status:'active';
  $('notes').value=student.notes||'';
  $('profileTitle').textContent=student.full_name||'শিক্ষার্থী প্রোফাইল';
  $('profileSubtitle').textContent=`Student ID: ${student.student_code||'—'} · Status: ${String(student.status||'').replaceAll('_',' ')}`;
}

function guardianHtml(g){
  const dis=!(editing&&access?.can('guardians.manage'));
  return `<div class="guardian-card"><div class="guardian-title"><strong>${g.is_primary?'প্রধান Guardian':'Guardian'}</strong><span class="readonly-badge">${esc(g.relation||'Guardian')}</span></div><div class="profile-fields">
  <div class="profile-field"><label>পূর্ণ নাম</label><input data-g-field="full_name" data-g-id="${esc(g.guardian_id)}" value="${esc(g.full_name)}" ${dis?'disabled':''}></div>
  <div class="profile-field"><label>সম্পর্ক</label><select data-g-field="relation" data-g-id="${esc(g.guardian_id)}" ${dis?'disabled':''}><option value="">নির্বাচন করুন</option><option value="Father" ${g.relation==='Father'?'selected':''}>Father</option><option value="Mother" ${g.relation==='Mother'?'selected':''}>Mother</option><option value="Guardian" ${g.relation==='Guardian'?'selected':''}>Guardian</option><option value="Other" ${g.relation==='Other'?'selected':''}>Other</option></select></div>
  <div class="profile-field"><label>ফোন</label><input data-g-field="phone" data-g-id="${esc(g.guardian_id)}" value="${esc(g.phone)}" ${dis?'disabled':''}></div>
  <div class="profile-field"><label>Email</label><input data-g-field="email" data-g-id="${esc(g.guardian_id)}" type="email" value="${esc(g.email)}" ${dis?'disabled':''}></div>
  <div class="profile-field full"><label>ঠিকানা</label><textarea data-g-field="address" data-g-id="${esc(g.guardian_id)}" rows="2" ${dis?'disabled':''}>${esc(g.address)}</textarea></div>
  </div></div>`;
}
function renderGuardians(){
  $('guardianList').innerHTML=guardians.length?guardians.map(guardianHtml).join(''):'<p class="profile-note">Guardian তথ্য পাওয়া যায়নি।</p>';
}
function mode(){
  const se=editing&&access?.can('students.manage'), ge=editing&&access?.can('guardians.manage');
  ['fullName','gender','dateOfBirth','email','admissionDate','status','notes'].forEach(id=>$(id).disabled=!se);
  $('editBadge').textContent=se?'Edit mode':'View mode';
  $('guardianPermissionBadge').textContent=ge?'Edit mode':'View mode';
  $('editBtn').classList.toggle('hidden',editing||!access?.can('students.manage'));
  $('saveBtn').classList.toggle('hidden',!editing);
  $('cancelBtn').classList.toggle('hidden',!editing);
  $('guardianNote').textContent=ge?'Guardian তথ্যও এখান থেকে edit করা যাবে।':'Guardian তথ্য দেখা যাবে; edit করতে guardians.manage permission প্রয়োজন।';
  renderGuardians();
}

async function load(){
  if(!studentId)throw new Error('Student ID সঠিক নয়।');
  const {data:s,error}=await supabase.from('qa_students').select('student_id,student_code,full_name,gender,date_of_birth,email,admission_date,status,notes,user_id,created_at,updated_at').eq('student_id',studentId).maybeSingle();
  if(error)throw error;if(!s)throw new Error('Student profile পাওয়া যায়নি।');student=s;
  const {data:links,error:le}=await supabase.from('qa_student_guardians').select('guardian_id,is_primary').eq('student_id',studentId);
  if(le)throw le;
  guardians=[];
  if(links?.length){
    const {data:gs,error:ge}=await supabase.from('qa_guardians').select('guardian_id,full_name,relation,phone,email,address').in('guardian_id',links.map(x=>x.guardian_id));
    if(ge)throw ge;
    const map=Object.fromEntries((gs||[]).map(x=>[x.guardian_id,x]));
    guardians=links.map(x=>({...map[x.guardian_id],is_primary:x.is_primary})).filter(x=>x.guardian_id).sort((a,b)=>Number(b.is_primary)-Number(a.is_primary));
  }
  fillStudent();mode();
}

async function save(){
  if(!access?.can('students.manage'))throw new Error('Student edit permission নেই।');
  const payload={full_name:$('fullName').value.trim(),gender:$('gender').value,date_of_birth:$('dateOfBirth').value||null,email:$('email').value.trim(),admission_date:$('admissionDate').value||null,status:$('status').value,notes:$('notes').value.trim()};
  if(!payload.full_name)throw new Error('Student-এর নাম দিতে হবে।');
  const {data,error}=await supabase.from('qa_students').update(payload).eq('student_id',studentId).select('student_id,student_code,full_name,gender,date_of_birth,email,admission_date,status,notes,user_id,created_at,updated_at').single();
  if(error)throw error;student=data;
  if(access.can('guardians.manage'))for(const g of guardians){
    const q=s=>document.querySelector(`[data-g-field="${s}"][data-g-id="${CSS.escape(g.guardian_id)}"]`);
    const update={full_name:q('full_name')?.value.trim()||'',relation:q('relation')?.value||'',phone:q('phone')?.value.trim()||'',email:q('email')?.value.trim()||'',address:q('address')?.value.trim()||''};
    if(!update.full_name||!update.relation)throw new Error('Guardian-এর নাম ও সম্পর্ক পূরণ করতে হবে।');
    const {error:ge}=await supabase.from('qa_guardians').update(update).eq('guardian_id',g.guardian_id);if(ge)throw ge;
  }
  editing=false;await load();
}

$('editBtn').onclick=()=>{editing=true;msg('');mode();};
$('cancelBtn').onclick=async()=>{editing=false;msg('');await load();};
$('profileForm').onsubmit=async e=>{e.preventDefault();$('saveBtn').disabled=true;msg('Saving changes…');try{await save();msg('Student profile updated successfully.','success');}catch(err){console.error(err);msg(err?.message||'Profile update করা যায়নি।','error');}finally{$('saveBtn').disabled=false;}};
$('signOut').onclick=async()=>{await supabase.auth.signOut();login();};

(async()=>{try{access=await getAccess(supabase);if(!access){await supabase.auth.signOut();return login();}if(!access.can('students.view')&&!access.can('students.manage'))throw new Error('Student profile দেখার permission নেই।');$('loading').classList.add('hidden');$('app').classList.remove('hidden');await load();}catch(e){console.error(e);$('loading').classList.add('hidden');$('errorBox').textContent=e.message||'Profile load করা যায়নি।';$('errorBox').classList.remove('hidden');}})();