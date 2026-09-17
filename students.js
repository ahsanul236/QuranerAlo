import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { getAccess } from './authz.js';
const config = window.QURANER_ALO_CONFIG;
const supabase = createClient(config.supabaseUrl, config.supabasePublishableKey, { auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true } });
const $ = (id) => document.getElementById(id);
let allStudents = [];
let guardians = [];
let guardianLinks = [];
let access = null;
let canManage = false;
let canManagePortal = false;
let canViewGuardians = false;
let canManageGuardians = false;
let canLinkGuardians = false;
function escapeHtml(value) { return String(value ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c])); }
function redirectToLogin(){ window.location.replace('./'); }
function setMessage(text, type=''){ $('message').textContent = text; $('message').style.color = type === 'error' ? '#b33b3b' : ''; }
function messageInline(id,text,type=''){ const node=$(id); if(!node) return; node.textContent=text; node.className=`message-inline ${type}`.trim(); }
function setFormEnabled(id, enabled){ const form=$(id); if(!form) return; form.querySelectorAll('input,select,textarea,button[type="submit"]').forEach(x=>x.disabled=!enabled); }
function activationBadge(userId){ return userId ? '<span class="active-badge on">Activated</span>' : '<span class="active-badge off">Not activated</span>'; }
function portalAction(student){ if(!canManagePortal) return ''; if(student.user_id) return `<div class="action-stack"><button class="save-btn secondary portal-disable" data-id="${escapeHtml(student.student_id)}" type="button">Disable</button><button class="save-btn portal-reset" data-id="${escapeHtml(student.student_id)}" type="button">Reset access</button></div>`; return '<span class="muted">User activates with ID + registered phone</span>'; }
function renderStudents(list){ $('countLabel').textContent = `${list.length} জন`; $('studentRows').innerHTML = list.map(s => `<tr><td class="student-code">${escapeHtml(s.student_code)}</td><td>${escapeHtml(s.full_name)}</td><td>${escapeHtml(s.phone)}</td><td>${escapeHtml(s.admission_date || '')}</td><td><span class="active-badge ${s.status==='active'?'on':'off'}">${escapeHtml(s.status)}</span></td><td>${activationBadge(s.user_id)}</td><td>${portalAction(s)}</td></tr>`).join('') || '<tr><td colspan="7">কোনো শিক্ষার্থী পাওয়া যায়নি।</td></tr>'; bindPortalActions(); }
function populateStudentSelect(){ if(!$('studentSelect')) return; $('studentSelect').innerHTML='<option value="">Student নির্বাচন করুন</option>'+allStudents.map(s=>`<option value="${escapeHtml(s.student_id)}">${escapeHtml(s.student_code)} · ${escapeHtml(s.full_name)}</option>`).join(''); }
async function loadStudents(){ const {data,error}=await supabase.from('qa_students').select('student_id,student_code,full_name,phone,admission_date,status,user_id,email').order('created_at',{ascending:false}); if(error) throw error; allStudents=data||[]; renderStudents(allStudents); populateStudentSelect(); }
async function loadGuardianData(){
  if(!canViewGuardians) return;
  const {data,error}=await supabase.from('qa_guardians').select('guardian_id,full_name,relation,phone,email,address').order('full_name');
  if(error) throw error;
  guardians=data||[];
  const {data:links,error:linkError}=await supabase.from('qa_student_guardians').select('student_id,guardian_id,is_primary');
  if(linkError) throw linkError;
  guardianLinks=links||[];
  const names=Object.fromEntries(allStudents.map(s=>[s.student_id,`${s.student_code} · ${s.full_name}`]));
  $('guardianSelect').innerHTML='<option value="">Guardian নির্বাচন করুন</option>'+guardians.map(g=>`<option value="${escapeHtml(g.guardian_id)}">${escapeHtml(g.full_name)} · ${escapeHtml(g.relation)}</option>`).join('');
  $('guardianRows').innerHTML=guardians.map(g=>{
    const mine=guardianLinks.filter(x=>x.guardian_id===g.guardian_id);
    const text=mine.map(x=>`${escapeHtml(names[x.student_id]||x.student_id)}${x.is_primary?' ★':''}`).join('<br>')||'—';
    return `<tr><td><strong>${escapeHtml(g.full_name)}</strong></td><td>${escapeHtml(g.relation)}</td><td>${escapeHtml(g.phone)}</td><td>${escapeHtml(g.email)}</td><td class="guardian-link-list">${text}</td></tr>`;
  }).join('')||'<tr><td colspan="5">কোনো guardian নেই।</td></tr>';
  $('guardianCountLabel').textContent=`${guardians.length} records`;
}
function configureGuardianManagement(){
  canViewGuardians=access.can('guardians.view')||access.can('guardians.manage');
  canManageGuardians=access.can('guardians.manage');
  canLinkGuardians=canManageGuardians&&access.can('students.manage');
  if(!canViewGuardians){ $('guardianManagementPanel').classList.add('hidden'); return; }
  $('guardianManagementPanel').classList.remove('hidden');
  $('guardianPermission').textContent=canManageGuardians?'GUARDIANS.MANAGE': 'GUARDIANS.VIEW';
  setFormEnabled('guardianForm',canManageGuardians);
  setFormEnabled('linkForm',canLinkGuardians);
  if(!canManageGuardians) messageInline('formMessage','Guardian create করার permission নেই।','error');
  if(!canLinkGuardians) messageInline('linkMessage','Guardian link করতে guardian ও student দুইটির manage permission প্রয়োজন।','error');
}
async function portalAdminAction(action, entityId){ const session=(await supabase.auth.getSession()).data.session; if(!session){redirectToLogin();return;} const response=await fetch(`${config.supabaseUrl}/functions/v1/portal-admin`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${session.access_token}`,'apikey':config.supabasePublishableKey},body:JSON.stringify({action,entityType:'student',entityId})}); const body=await response.json().catch(()=>({})); if(!response.ok) throw new Error(body.error||'PORTAL_ADMIN_FAILED'); return body; }
function bindPortalActions(){ document.querySelectorAll('.portal-disable').forEach(button=>button.addEventListener('click',async()=>{ const student=allStudents.find(x=>x.student_id===button.dataset.id); if(!student||!confirm(`${student.student_code} portal access disable করবেন?`)) return; button.disabled=true; try{await portalAdminAction('disable',student.student_id);setMessage(`${student.student_code} portal access disabled.`);await loadStudents();}catch(error){console.error(error);setMessage('Portal access disable করা যায়নি।','error');button.disabled=false;} })); document.querySelectorAll('.portal-reset').forEach(button=>button.addEventListener('click',async()=>{ const student=allStudents.find(x=>x.student_id===button.dataset.id); if(!student||!confirm(`${student.student_code} portal account reset করবেন? এতে পুরনো login account বাতিল হবে এবং student আবার phone দিয়ে activate করতে পারবে।`)) return; button.disabled=true; try{await portalAdminAction('reset',student.student_id);setMessage(`${student.student_code} portal access reset হয়েছে।`);await loadStudents();}catch(error){console.error(error);setMessage('Portal access reset করা যায়নি।','error');button.disabled=false;} })); }
$('newStudent').addEventListener('click',()=>{ if(canManage) $('studentFormPanel').classList.toggle('hidden'); });
$('cancelStudent').addEventListener('click',()=>{ $('studentForm').reset(); $('studentFormPanel').classList.add('hidden'); });
$('search').addEventListener('input',()=>{ const q=$('search').value.trim().toLowerCase(); if(!q) return renderStudents(allStudents); renderStudents(allStudents.filter(s => [s.student_code,s.full_name,s.phone,s.email].join(' ').toLowerCase().includes(q))); });
$('studentForm').addEventListener('submit', async (event)=>{ event.preventDefault(); if(!canManage){setMessage('Student create permission নেই।','error');return;} const form=new FormData(event.currentTarget); const payload={ full_name:String(form.get('full_name')||'').trim(), full_name_bn:String(form.get('full_name_bn')||'').trim()||null, gender:String(form.get('gender')||'unspecified'), date_of_birth:form.get('date_of_birth')||null, phone:String(form.get('phone')||'').trim(), email:String(form.get('email')||'').trim(), admission_date:form.get('admission_date')||new Date().toISOString().slice(0,10), status:String(form.get('status')||'active'), notes:String(form.get('notes')||'').trim() }; const {data,error}=await supabase.from('qa_students').insert(payload).select('student_id,student_code,full_name,phone,admission_date,status,user_id').single(); if(error){ console.error(error); setMessage('Student save করা যায়নি।','error'); return; } await supabase.from('qa_audit_log').insert({actor_user_id:(await supabase.auth.getUser()).data.user?.id,action:'student.created',entity_type:'qa_students',entity_id:data.student_id,metadata:{student_code:data.student_code}}); event.currentTarget.reset(); $('studentFormPanel').classList.add('hidden'); setMessage(`শিক্ষার্থী ${data.student_code} সফলভাবে যুক্ত হয়েছে। Portal activation: Not activated.`); await loadStudents(); });
$('guardianForm').addEventListener('submit',async event=>{ event.preventDefault(); if(!canManageGuardians){return messageInline('formMessage','Guardians manage permission নেই।','error');} const row={full_name:$('fullName').value.trim(),relation:$('relation').value.trim(),phone:$('guardianPhone').value.trim(),email:$('guardianEmail').value.trim(),address:$('guardianAddress').value.trim()}; const {error}=await supabase.from('qa_guardians').insert(row); if(error){console.error(error);return messageInline('formMessage','Guardian save করা যায়নি।','error');} messageInline('formMessage','Guardian সফলভাবে যুক্ত হয়েছে।','success'); event.currentTarget.reset(); await loadGuardianData(); });
$('linkForm').addEventListener('submit',async event=>{ event.preventDefault(); if(!canLinkGuardians){return messageInline('linkMessage','Guardian + Student manage permission দুটিই প্রয়োজন।','error');} const row={guardian_id:$('guardianSelect').value,student_id:$('studentSelect').value,is_primary:$('isPrimary').value==='true'}; if(!row.guardian_id||!row.student_id)return messageInline('linkMessage','Guardian এবং Student নির্বাচন করুন।','error'); const {error}=await supabase.from('qa_student_guardians').upsert(row,{onConflict:'student_id,guardian_id'}); if(error){console.error(error);return messageInline('linkMessage','Student link save করা যায়নি।','error');} messageInline('linkMessage','Guardian-Student link সফল হয়েছে।','success'); await loadGuardianData(); });
$('signOut').addEventListener('click', async()=>{ await supabase.auth.signOut(); redirectToLogin(); });
async function init(){
  access=await getAccess(supabase);
  if(!access){ await supabase.auth.signOut(); return redirectToLogin(); }
  if(!access.can('students.view')&&!access.can('students.manage')){ $('loading').textContent='এই module দেখার permission আপনার account-এ নেই।'; return; }
  canManage=access.can('students.manage');
  canManagePortal=access.profile.role==='owner';
  $('loading').classList.add('hidden');
  $('app').classList.remove('hidden');
  if(canManage) $('newStudent').classList.remove('hidden'); else $('newStudent').classList.add('hidden');
  configureGuardianManagement();
  try{ await loadStudents(); }catch(e){ console.error(e); setMessage('Student list load করা যায়নি।','error'); }
  if(canViewGuardians){ try{ await loadGuardianData(); }catch(e){ console.error(e); messageInline('formMessage','Guardian data load করা যায়নি।','error'); } }
}
init().catch(e=>{ console.error(e); $('loading').textContent='Page load করা যায়নি।'; });
