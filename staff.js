import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { getAccess } from './authz.js';

const config = window.QURANER_ALO_CONFIG;
const supabase = createClient(config.supabaseUrl, config.supabasePublishableKey, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
});
const $ = (id) => document.getElementById(id);
let mode = location.hash === '#helpers' ? 'helper' : 'teacher';
let rows = [];
let access = null;
let canManage = false;
let canManagePortal = false;

function msg(text, type='') {
  $('message').textContent = text;
  $('message').className = `message-inline ${type}`.trim();
}
function formMsg(text, type='') {
  $('formMessage').textContent = text;
  $('formMessage').className = `message-inline ${type}`.trim();
}
function esc(v) {
  return String(v ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
}
function activationBadge(userId) {
  return userId
    ? '<span class="active-badge on">Activated</span>'
    : '<span class="active-badge off">Not activated</span>';
}
function portalAction(r) {
  if (!canManagePortal) return '';
  if (!r.user_id) return '<span class="muted">User activates with ID + registered phone</span>';
  const id = mode === 'teacher' ? r.teacher_id : r.staff_id;
  return `<div class="action-stack"><button class="save-btn secondary portal-disable" data-id="${esc(id)}" type="button">Disable</button><button class="save-btn portal-reset" data-id="${esc(id)}" type="button">Reset access</button></div>`;
}
function setFormEnabled(enabled) {
  $('staffForm').querySelectorAll('input,textarea,button[type="submit"]').forEach(el => { el.disabled = !enabled; });
}
function resetForm() {
  $('staffForm').reset();
}
function updatePageContext() {
  const teacher = mode === 'teacher';
  $('brandSubtitle').textContent = teacher ? 'Teacher Management' : 'Helper Management';
  $('pageEyebrow').textContent = teacher ? 'TEACHER MANAGEMENT' : 'HELPER MANAGEMENT';
  $('pageTitle').textContent = teacher ? 'শিক্ষক ব্যবস্থাপনা' : 'হেল্পার ব্যবস্থাপনা';
  $('pageSubtitle').textContent = teacher
    ? 'Teacher profile, portal access এবং নতুন teacher যোগ করার ব্যবস্থাপনা।'
    : 'Helper profile, portal access এবং নতুন helper যোগ করার ব্যবস্থাপনা।';
  $('newRecord').textContent = teacher ? '+ নতুন Teacher' : '+ নতুন Helper';
  $('formTitle').textContent = teacher ? 'নতুন Teacher তথ্য' : 'নতুন Helper তথ্য';
  $('saveRecord').textContent = teacher ? 'Save Teacher' : 'Save Helper';
  $('listTitle').textContent = teacher ? 'Teacher List' : 'Helper List';
  $('detailHead').textContent = teacher ? 'Specialization' : 'Joining date';
  $('specializationWrap').classList.toggle('hidden', !teacher);
  $('fullNameBn').closest('label').classList.toggle('hidden', !teacher);
  $('recordFormPanel').classList.add('hidden');
  formMsg('');
}
async function load() {
  const permission = mode === 'teacher' ? 'teachers' : 'staff';
  if (!access?.can(`${permission}.view`) && !access?.can(`${permission}.manage`)) {
    msg(`এই ${mode === 'teacher' ? 'Teacher' : 'Helper'} module-এর permission আপনার account-এ নেই।`, 'error');
    $('staffRows').innerHTML = '<tr><td colspan="8">No permission.</td></tr>';
    $('newRecord').classList.add('hidden');
    return;
  }
  canManage = access.can(`${permission}.manage`);
  setFormEnabled(canManage);
  $('newRecord').classList.toggle('hidden', !canManage);

  const table = mode === 'teacher' ? 'qa_teachers' : 'qa_staff';
  const fields = mode === 'teacher'
    ? 'teacher_id,teacher_code,full_name,full_name_bn,phone,email,specialization,father_name,mother_name,nid_number,address,joining_date,active,user_id'
    : 'staff_id,staff_code,full_name,phone,email,father_name,mother_name,nid_number,address,joining_date,active,user_id';

  const query = supabase.from(table).select(fields).eq('active', true).order('created_at', { ascending: false });
  const { data, error } = await query;
  if (error) throw error;
  rows = data || [];

  const list = rows;
  $('countLabel').textContent = `${list.length} record${list.length === 1 ? '' : 's'}`;
  $('staffRows').innerHTML = list.map(r => {
    const id = mode === 'teacher' ? r.teacher_id : r.staff_id;
    const code = mode === 'teacher' ? r.teacher_code : r.staff_code;
    const detail = mode === 'teacher' ? (r.specialization || '—') : (r.joining_date || '—');
    const subtitle = mode === 'teacher' && r.full_name_bn ? `<div class="muted">${esc(r.full_name_bn)}</div>` : '';
    return `<tr>
      <td><a class="staff-id-link" href="staff-profile.html?type=${mode}&id=${encodeURIComponent(id)}"><strong>${esc(code)}</strong></a></td>
      <td>${esc(r.full_name)}${subtitle}</td>
      <td>${esc(r.phone)}</td>
      <td>${esc(r.email)}</td>
      <td>${esc(detail)}</td>
      <td><span class="active-badge on">Active</span></td>
      <td>${activationBadge(r.user_id)}</td>
      <td>${portalAction(r)}</td>
    </tr>`;
  }).join('') || `<tr><td colspan="8">${mode === 'teacher' ? 'কোনো teacher পাওয়া যায়নি।' : 'কোনো helper পাওয়া যায়নি।'}</td></tr>`;

  bindPortalActions();
}
async function portalAdminAction(action, entityId) {
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) { location.replace('./'); return; }
  const response = await fetch(`${config.supabaseUrl}/functions/v1/portal-admin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': config.supabasePublishableKey
    },
    body: JSON.stringify({ action, entityType: mode, entityId })
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'PORTAL_ADMIN_FAILED');
  return body;
}
function bindPortalActions() {
  document.querySelectorAll('.portal-disable').forEach(button => button.addEventListener('click', async () => {
    const id = button.dataset.id;
    const r = rows.find(x => (mode === 'teacher' ? x.teacher_id : x.staff_id) === id);
    if (!r || !confirm(`${mode === 'teacher' ? r.teacher_code : r.staff_code} portal access disable করবেন?`)) return;
    button.disabled = true;
    try {
      await portalAdminAction('disable', id);
      msg(`${mode === 'teacher' ? r.teacher_code : r.staff_code} portal access disabled.`, 'success');
      await load();
    } catch (error) {
      console.error(error);
      msg('Portal access disable করা যায়নি।', 'error');
      button.disabled = false;
    }
  }));

  document.querySelectorAll('.portal-reset').forEach(button => button.addEventListener('click', async () => {
    const id = button.dataset.id;
    const r = rows.find(x => (mode === 'teacher' ? x.teacher_id : x.staff_id) === id);
    if (!r || !confirm(`${mode === 'teacher' ? r.teacher_code : r.staff_code} portal account reset করবেন? পুরনো login account বাতিল হবে এবং আবার registered phone দিয়ে activate করতে হবে।`)) return;
    button.disabled = true;
    try {
      await portalAdminAction('reset', id);
      msg(`${mode === 'teacher' ? r.teacher_code : r.staff_code} portal access reset হয়েছে।`, 'success');
      await load();
    } catch (error) {
      console.error(error);
      msg('Portal access reset করা যায়নি।', 'error');
      button.disabled = false;
    }
  }));
}
$('newRecord').addEventListener('click', () => {
  if (!canManage) return;
  $('recordFormPanel').classList.toggle('hidden');
  formMsg('');
  $('fullName').focus();
});
$('cancelRecord').addEventListener('click', () => {
  resetForm();
  $('recordFormPanel').classList.add('hidden');
  formMsg('');
});
$('search').addEventListener('input', () => {
  const q = $('search').value.trim().toLowerCase();
  if (!q) {
    document.querySelectorAll('#staffRows tr').forEach(row => row.classList.remove('hidden'));
    return;
  }
  document.querySelectorAll('#staffRows tr').forEach(row => {
    const match = row.textContent.toLowerCase().includes(q);
    row.classList.toggle('hidden', !match);
  });
});
$('staffForm').addEventListener('submit', async event => {
  event.preventDefault();
  if (!canManage) {
    formMsg(`এই ${mode === 'teacher' ? 'Teacher' : 'Helper'}-এর তথ্য সংযুক্ত করার permission নেই।`, 'error');
    return;
  }
  formMsg('Saving…');
  const form = new FormData(event.currentTarget);
  try {
    if (mode === 'teacher') {
      const { data, error } = await supabase.from('qa_teachers').insert({
        full_name: String(form.get('full_name') || '').trim(),
        full_name_bn: String(form.get('full_name_bn') || '').trim() || null,
        phone: String(form.get('phone') || '').trim(),
        email: String(form.get('email') || '').trim(),
        specialization: String(form.get('specialization') || '').trim() || null,
        father_name: String(form.get('father_name') || '').trim(),
        mother_name: String(form.get('mother_name') || '').trim(),
        nid_number: String(form.get('nid_number') || '').trim(),
        address: String(form.get('address') || '').trim(),
        joining_date: form.get('joining_date') || null,
        notes: String(form.get('notes') || '').trim()
      }).select('teacher_code,full_name').single();
      if (error) throw error;
      formMsg(`${data.teacher_code} — ${data.full_name} সফলভাবে যুক্ত হয়েছে।`, 'success');
    } else {
      const { data, error } = await supabase.from('qa_staff').insert({
        full_name: String(form.get('full_name') || '').trim(),
        staff_type: 'helper',
        phone: String(form.get('phone') || '').trim(),
        email: String(form.get('email') || '').trim(),
        father_name: String(form.get('father_name') || '').trim(),
        mother_name: String(form.get('mother_name') || '').trim(),
        nid_number: String(form.get('nid_number') || '').trim(),
        address: String(form.get('address') || '').trim(),
        joining_date: form.get('joining_date') || null,
        notes: String(form.get('notes') || '').trim()
      }).select('staff_code,full_name').single();
      if (error) throw error;
      formMsg(`${data.staff_code} — ${data.full_name} সফলভাবে যুক্ত হয়েছে।`, 'success');
    }
    resetForm();
    $('recordFormPanel').classList.add('hidden');
    msg(`${mode === 'teacher' ? 'Teacher' : 'Helper'} সফলভাবে যুক্ত হয়েছে।`, 'success');
    await load();
  } catch (error) {
    console.error(error);
    formMsg(error?.code === '23505' ? 'এই ID/record আগেই আছে।' : `${mode === 'teacher' ? 'Teacher' : 'Helper'} তথ্য save করা যায়নি।`, 'error');
  }
});
$('signOut').addEventListener('click', async () => {
  await supabase.auth.signOut();
  location.replace('./');
});
async function init() {
  access = await getAccess(supabase);
  if (!access) {
    await supabase.auth.signOut();
    location.replace('./');
    return;
  }
  updatePageContext();
  $('loading').classList.add('hidden');
  $('app').classList.remove('hidden');
  canManagePortal = access.profile.role === 'owner';
  try {
    await load();
  } catch (error) {
    console.error(error);
    msg('Data load করা যায়নি।', 'error');
  }
}
window.addEventListener('hashchange', async () => {
  const next = location.hash === '#helpers' ? 'helper' : 'teacher';
  if (next === mode) return;
  mode = next;
  updatePageContext();
  try { await load(); } catch (error) { console.error(error); msg('Data load করা যায়নি।', 'error'); }
});
init().catch(error => {
  console.error(error);
  $('loading').textContent = 'Page load করা যায়নি।';
});
