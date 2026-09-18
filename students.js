import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { getAccess } from './authz.js';

const config = window.QURANER_ALO_CONFIG;
const supabase = createClient(config.supabaseUrl, config.supabasePublishableKey, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
});

const $ = (id) => document.getElementById(id);
let allStudents = [];
let canManage = false;
let canManagePortal = false;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>\"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#039;'
  }[c]));
}

function redirectToLogin() { window.location.replace('./'); }

function setMessage(text, type = '') {
  $('message').textContent = text;
  $('message').style.color = type === 'error' ? '#b33b3b' : '';
}

function setFormMessage(text, type = '') {
  $('formMessage').textContent = text;
  $('formMessage').className = `message-inline ${type}`.trim();
}

function activationBadge(userId) {
  return userId
    ? '<span class="active-badge on">Activated</span>'
    : '<span class="active-badge off">Not activated</span>';
}

function portalAction(student) {
  if (!canManagePortal) return '';
  if (student.user_id) {
    return `<div class="action-stack"><button class="save-btn secondary portal-disable" data-id="${escapeHtml(student.student_id)}" type="button">Disable</button><button class="save-btn portal-reset" data-id="${escapeHtml(student.student_id)}" type="button">Reset access</button></div>`;
  }
  return '<span class="muted">User activates with ID + registered phone</span>';
}

function renderStudents(list) {
  $('countLabel').textContent = `${list.length} জন`;
  $('studentRows').innerHTML = list.map((s) => `
    <tr>
      <td class="student-code"><a class="student-id-link" href="student-profile.html?id=${encodeURIComponent(s.student_id)}">${escapeHtml(s.student_code)}</a></td>
      <td>${escapeHtml(s.full_name)}</td>
      <td>${escapeHtml(s.admission_date || '')}</td>
      <td><span class="active-badge ${s.status === 'active' ? 'on' : 'off'}">${escapeHtml(s.status)}</span></td>
      <td>${activationBadge(s.user_id)}</td>
      <td>${portalAction(s)}</td>
    </tr>`).join('') || '<tr><td colspan="6">কোনো শিক্ষার্থী পাওয়া যায়নি।</td></tr>';
  bindPortalActions();
}

async function loadStudents() {
  const { data, error } = await supabase
    .from('qa_students')
    .select('student_id,student_code,full_name,admission_date,status,user_id,email')
    .order('created_at', { ascending: false });
  if (error) throw error;
  allStudents = data || [];
  renderStudents(allStudents);
}

function getGuardianFromForm(prefix) {
  return {
    full_name: $(prefix + 'Name').value.trim(),
    relation: $(prefix + 'Relation').value.trim(),
    phone: $(prefix + 'Phone').value.trim(),
    email: $(prefix + 'Email').value.trim(),
    address: $(prefix + 'Address').value.trim()
  };
}

function resetGuardianForm() {
  $('guardian1Name').value = '';
  $('guardian1Relation').value = '';
  $('guardian1Phone').value = '';
  $('guardian1Email').value = '';
  $('guardian1Address').value = '';
  $('guardian2Enabled').checked = false;
  $('guardian2Fields').classList.add('hidden');
  $('guardian2Name').value = '';
  $('guardian2Relation').value = '';
  $('guardian2Phone').value = '';
  $('guardian2Email').value = '';
  $('guardian2Address').value = '';
}

function friendlyRpcError(error) {
  const code = String(error?.message || '');
  if (code.includes('STUDENTS_MANAGE_REQUIRED')) return 'Student create permission নেই।';
  if (code.includes('STUDENT_NAME_REQUIRED')) return 'Student-এর নাম দিন।';
  if (code.includes('AT_LEAST_ONE_GUARDIAN_REQUIRED')) return 'কমপক্ষে একজন guardian-এর তথ্য দিন।';
  if (code.includes('GUARDIAN_NAME_REQUIRED')) return 'Guardian-এর নাম দিন।';
  if (code.includes('GUARDIAN_RELATION_REQUIRED')) return 'Guardian-এর সম্পর্ক নির্বাচন করুন।';
  return 'Student ও guardian তথ্য save করা যায়নি। আবার চেষ্টা করুন।';
}

async function portalAdminAction(action, entityId) {
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) { redirectToLogin(); return; }
  const response = await fetch(`${config.supabaseUrl}/functions/v1/portal-admin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': config.supabasePublishableKey
    },
    body: JSON.stringify({ action, entityType: 'student', entityId })
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'PORTAL_ADMIN_FAILED');
  return body;
}

function bindPortalActions() {
  document.querySelectorAll('.portal-disable').forEach((button) => button.addEventListener('click', async () => {
    const student = allStudents.find((x) => x.student_id === button.dataset.id);
    if (!student || !confirm(`${student.student_code} portal access disable করবেন?`)) return;
    button.disabled = true;
    try {
      await portalAdminAction('disable', student.student_id);
      setMessage(`${student.student_code} portal access disabled.`);
      await loadStudents();
    } catch (error) {
      console.error(error);
      setMessage('Portal access disable করা যায়নি।', 'error');
      button.disabled = false;
    }
  }));

  document.querySelectorAll('.portal-reset').forEach((button) => button.addEventListener('click', async () => {
    const student = allStudents.find((x) => x.student_id === button.dataset.id);
    if (!student || !confirm(`${student.student_code} portal account reset করবেন? এতে পুরনো login account বাতিল হবে এবং student আবার phone দিয়ে activate করতে পারবে।`)) return;
    button.disabled = true;
    try {
      await portalAdminAction('reset', student.student_id);
      setMessage(`${student.student_code} portal access reset হয়েছে।`);
      await loadStudents();
    } catch (error) {
      console.error(error);
      setMessage('Portal access reset করা যায়নি।', 'error');
      button.disabled = false;
    }
  }));
}

$('newStudent').addEventListener('click', () => {
  if (canManage) {
    $('studentFormPanel').classList.toggle('hidden');
    setFormMessage('');
  }
});

$('cancelStudent').addEventListener('click', () => {
  $('studentForm').reset();
  resetGuardianForm();
  $('studentFormPanel').classList.add('hidden');
  setFormMessage('');
});

$('guardian2Enabled').addEventListener('change', () => {
  $('guardian2Fields').classList.toggle('hidden', !$('guardian2Enabled').checked);
});

$('search').addEventListener('input', () => {
  const q = $('search').value.trim().toLowerCase();
  if (!q) return renderStudents(allStudents);
  renderStudents(allStudents.filter((s) =>
    [s.student_code, s.full_name, s.email].join(' ').toLowerCase().includes(q)
  ));
});

$('studentForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!canManage) {
    setFormMessage('Student create permission নেই।', 'error');
    return;
  }

  setFormMessage('Student ও guardian তথ্য save হচ্ছে…');
  const form = new FormData(event.currentTarget);
  const guardians = [getGuardianFromForm('guardian1')];

  if ($('guardian2Enabled').checked) {
    const guardian2 = getGuardianFromForm('guardian2');
    if (!guardian2.full_name || !guardian2.relation) {
      setFormMessage('দ্বিতীয় guardian যোগ করলে নাম ও সম্পর্ক দিতে হবে।', 'error');
      return;
    }
    guardians.push(guardian2);
  }

  try {
    const { data, error } = await supabase.rpc('qa_create_student_with_guardian', {
      p_student: {
        full_name: String(form.get('full_name') || '').trim(),
        gender: String(form.get('gender') || 'unspecified'),
        date_of_birth: form.get('date_of_birth') || '',
        email: String(form.get('email') || '').trim(),
        admission_date: form.get('admission_date') || new Date().toISOString().slice(0, 10),
        status: String(form.get('status') || 'active'),
        notes: String(form.get('notes') || '').trim()
      },
      p_guardians: guardians
    });

    if (error) throw error;
    event.currentTarget.reset();
    resetGuardianForm();
    $('studentFormPanel').classList.add('hidden');
    const guardianCount = Number(data?.guardians_created || guardians.length);
    setMessage(`শিক্ষার্থী ${data?.student_code || ''} সফলভাবে যুক্ত হয়েছে। ${guardianCount} জন guardian তথ্যও সংরক্ষণ করা হয়েছে।`);
    setFormMessage('');
    await loadStudents();
  } catch (error) {
    console.error(error);
    setFormMessage(friendlyRpcError(error), 'error');
  }
});

$('signOut').addEventListener('click', async () => {
  await supabase.auth.signOut();
  redirectToLogin();
});

async function init() {
  const access = await getAccess(supabase);
  if (!access) {
    await supabase.auth.signOut();
    return redirectToLogin();
  }

  if (!access.can('students.view') && !access.can('students.manage')) {
    $('loading').textContent = 'এই module দেখার permission আপনার account-এ নেই।';
    return;
  }

  canManage = access.can('students.manage');
  canManagePortal = access.profile.role === 'owner';
  $('loading').classList.add('hidden');
  $('app').classList.remove('hidden');
  $('newStudent').classList.toggle('hidden', !canManage);

  try {
    await loadStudents();
  } catch (error) {
    console.error(error);
    setMessage('Student list load করা যায়নি।', 'error');
  }
}

init().catch((error) => {
  console.error(error);
  $('loading').textContent = 'Page load করা যায়নি।';
});
