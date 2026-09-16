import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const config = window.QURANER_ALO_CONFIG;
const supabase = createClient(config.supabaseUrl, config.supabasePublishableKey, { auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:true} });
const $=id=>document.getElementById(id);
let mode='teacher';
function msg(text,type=''){ $('formMessage').textContent=text; $('formMessage').className=`message-inline ${type}`.trim(); }
function esc(v){return String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));}
function activationBadge(userId){return userId?'<span class="active-badge on">Activated</span>':'<span class="active-badge off">Not activated</span>';}
async function ensureAccess(){const {data:{session}}=await supabase.auth.getSession();if(!session){location.replace('./');return null;}const {data,error}=await supabase.from('qa_users').select('role,active').eq('user_id',session.user.id).maybeSingle();if(error||!data||!data.active){await supabase.auth.signOut();location.replace('./');return null;}if(!['owner','admin'].includes(data.role)){msg('এই অংশের management permission আপনার account-এ নেই।','error');return null;}return session;}
async function load(){
 const table=mode==='teacher'?'qa_teachers':'qa_staff';
 const fields=mode==='teacher'?'teacher_id,teacher_code,full_name,full_name_bn,phone,email,specialization,joining_date,active,user_id':'staff_id,staff_code,full_name,phone,email,staff_type,joining_date,active,user_id';
 const {data,error}=await supabase.from(table).select(fields).order('created_at',{ascending:false});
 if(error) throw error;
 $('listTitle').textContent=mode==='teacher'?'Teacher List':'Helper / Staff List'; $('countLabel').textContent=`${data.length} record${data.length===1?'':'s'}`;
 $('staffRows').innerHTML=data.map(r=>`<tr><td><strong>${esc(mode==='teacher'?r.teacher_code:r.staff_code)}</strong></td><td>${esc(r.full_name)}${mode==='teacher'&&r.full_name_bn?`<div class="muted">${esc(r.full_name_bn)}</div>`:''}</td><td>${esc(r.phone)}</td><td>${esc(r.email)}</td><td>${esc(mode==='teacher'?(r.specialization||'—'):(r.staff_type||'helper'))}</td><td><span class="active-badge ${r.active?'on':'off'}">${r.active?'Active':'Inactive'}</span></td><td>${activationBadge(r.user_id)}</td></tr>`).join('');
}
function switchMode(next){mode=next;$('staffForm').mode.value=mode;$('formMessage').textContent='';document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('is-active',b.dataset.tab===mode));document.querySelectorAll('.teacher-only').forEach(el=>el.classList.toggle('hidden',mode!=='teacher'));document.querySelectorAll('.helper-only').forEach(el=>el.classList.toggle('hidden',mode!=='helper'));load().catch(e=>console.error(e));}
$('staffForm').addEventListener('submit',async e=>{e.preventDefault();msg('Saving…');const f=new FormData(e.currentTarget);if(mode==='teacher'){const {data,error}=await supabase.from('qa_teachers').insert({full_name:f.get('full_name').trim(),full_name_bn:f.get('full_name_bn')?.trim()||null,phone:f.get('phone').trim(),email:f.get('email').trim(),specialization:f.get('specialization')?.trim()||null,joining_date:f.get('joining_date')||null,notes:f.get('notes').trim()}).select('teacher_code,full_name').single();if(error){msg('Teacher record save করা যায়নি।','error');return;}msg(`${data.teacher_code} — ${data.full_name} সফলভাবে যুক্ত হয়েছে। Portal activation: Not activated.`,'success');}else{const {data,error}=await supabase.from('qa_staff').insert({full_name:f.get('full_name').trim(),staff_type:f.get('staff_type'),phone:f.get('phone').trim(),email:f.get('email').trim(),joining_date:f.get('joining_date')||null,notes:f.get('notes').trim()}).select('staff_code,full_name').single();if(error){msg('Helper/Staff record save করা যায়নি।','error');return;}msg(`${data.staff_code} — ${data.full_name} সফলভাবে যুক্ত হয়েছে। Portal activation: Not activated.`,'success');}e.currentTarget.reset();e.currentTarget.mode.value=mode;await load();});
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>switchMode(b.dataset.tab)));
$('signOut').addEventListener('click',async()=>{await supabase.auth.signOut();location.replace('./');});
const session=await ensureAccess();if(session){$('loading').classList.add('hidden');$('app').classList.remove('hidden');await load();}
