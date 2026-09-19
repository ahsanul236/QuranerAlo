import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const c = window.QURANER_ALO_CONFIG;
const supabase = createClient(c.supabaseUrl, c.supabasePublishableKey, {
  auth: { autoRefreshToken: true, persistSession: true }
});
const $ = (id) => document.getElementById(id);

async function setSchoolWhatsApp(){const btn=$('whatsappBtn');if(!btn)return;const{data,error}=await supabase.from('qa_app_settings').select('value').eq('key','school_profile').maybeSingle();if(error)throw error;const phone=data?.value?.phone||'';const digits=String(phone).replace(/[^0-9]/g,'').replace(/^00/,'');if(!digits)return;btn.href='https://wa.me/'+digits;btn.classList.remove('hidden');}


const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (ch) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#039;'
}[ch]));

function formatDate(value) {
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString('en-GB') : '—';
}

function statusClass(value) {
  const v = String(value || '').toLowerCase();

  if (['active', 'scheduled', 'completed'].includes(v)) return 'on';
  if (['inactive', 'cancelled'].includes(v)) return 'off';

  return '';
}

async function getViewerProfile(session) {
  const { data, error } = await supabase
    .from('qa_users')
    .select('role,active')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function resolveTeacher(session) {
  const previewId = new URLSearchParams(window.location.search).get('preview_teacher');
  const viewer = await getViewerProfile(session);

  if (previewId) {
    if (!viewer || !viewer.active || viewer.role !== 'owner') {
      throw new Error('PREVIEW_NOT_ALLOWED');
    }

    const { data, error } = await supabase.functions.invoke('portal-preview', {
      body: { entityType: 'teacher', entityId: previewId }
    });

    if (error) throw error;
    if (!data?.ok || data.entityType !== 'teacher' || !data.entity) {
      throw new Error(data?.error || 'PREVIEW_NOT_FOUND');
    }

    const previewTeacher = data.entity;
    $('previewBanner').classList.remove('hidden');
    $('previewText').textContent =
      `Read-only preview · ${previewTeacher.teacher_code} · ${previewTeacher.full_name}`;
    return previewTeacher;
  }

  const { data, error } = await supabase
    .from('qa_teachers')
    .select('teacher_id,teacher_code,full_name,specialization,active,user_id')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (error || !data) {
    throw error || new Error('TEACHER_PROFILE_NOT_FOUND');
  }

  return data;
}

async function init() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    location.replace('./');
    return;
  }

  const teacher = await resolveTeacher(session);

  if (!teacher.active) {
    await supabase.auth.signOut();
    location.replace('./');
    return;
  }

  $('teacherCode').textContent = teacher.teacher_code;
  $('teacherName').textContent = teacher.full_name;
  $('specialization').textContent = teacher.specialization || '—';
  $('status').textContent = teacher.active ? 'Active' : 'Inactive';

  const { data: enrollmentData, error: enrollmentError } = await supabase
    .from('qa_enrollments')
    .select('student_id,course_code,start_date,end_date,status')
    .eq('teacher_user_id', teacher.user_id)
    .order('start_date', { ascending: false })
    .limit(100);

  if (enrollmentError) throw enrollmentError;

  const enrollments = enrollmentData || [];
  const studentIds = [...new Set(enrollments.map((item) => item.student_id).filter(Boolean))];
  let studentNames = {};

  if (studentIds.length) {
    const { data: students, error: studentsError } = await supabase
      .from('qa_students')
      .select('student_id,student_code,full_name')
      .in('student_id', studentIds);

    if (studentsError) throw studentsError;

    studentNames = Object.fromEntries(
      (students || []).map((student) => [
        student.student_id,
        `${student.student_code} · ${student.full_name}`
      ])
    );
  }

  $('studentRows').innerHTML = enrollments.map((item) => `
    <tr>
      <td>${esc(studentNames[item.student_id] || item.student_id)}</td>
      <td>${esc(item.course_code)}</td>
      <td>${esc(formatDate(item.start_date))}</td>
      <td>
        <span class="active-badge ${statusClass(item.status)}">${esc(item.status)}</span>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="4">No assigned students.</td></tr>';


  $('exitPreview')?.addEventListener('click', () => {
    location.href = 'dashboard.html';
  });

  $('signOut').addEventListener('click', async () => {
    await supabase.auth.signOut();
    location.replace('./');
  });

  await setSchoolWhatsApp();
  $('loading').classList.add('hidden');
  $('app').classList.remove('hidden');
}

init().catch((error) => {
  console.error('teacher portal error', error);

  if (error.message === 'PREVIEW_NOT_ALLOWED') {
    location.replace('./');
    return;
  }

  $('loading').textContent = 'Portal load করা যায়নি।';
});
