import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const c = window.QURANER_ALO_CONFIG;
const supabase = createClient(c.supabaseUrl, c.supabasePublishableKey, {
  auth: { autoRefreshToken: true, persistSession: true }
});
const $ = (id) => document.getElementById(id);

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (ch) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#039;'
}[ch]));

function statusClass(value) {
  const v = String(value || '').toLowerCase();
  if (['active', 'present', 'paid', 'scheduled', 'completed'].includes(v)) return 'on';
  if (['absent', 'inactive', 'overdue', 'cancelled'].includes(v)) return 'off';
  return '';
}

function money(value) {
  return `৳${Number(value || 0).toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function formatDate(value) {
  return value
    ? new Date(`${value}T00:00:00`).toLocaleDateString('en-GB')
    : '—';
}

function formatDateTime(value) {
  return value
    ? new Date(value).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
    : '—';
}

function safeLink(url, label = 'Join class') {
  if (!url) return '';
  try {
    const u = new URL(url);
    if (!['http:', 'https:'].includes(u.protocol)) return '';
    return `<a class="quick-link" href="${esc(u.href)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;
  } catch {
    return '';
  }
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

async function resolveStudent(session) {
  const previewId = new URLSearchParams(window.location.search).get('preview_student');
  const viewer = await getViewerProfile(session);

  if (previewId) {
    if (!viewer || !viewer.active || viewer.role !== 'owner') {
      throw new Error('PREVIEW_NOT_ALLOWED');
    }

    const { data, error } = await supabase.functions.invoke('portal-preview', {
      body: { entityType: 'student', entityId: previewId }
    });

    if (error) throw error;
    if (!data?.ok || data.entityType !== 'student' || !data.entity) {
      throw new Error(data?.error || 'PREVIEW_NOT_FOUND');
    }

    const previewStudent = data.entity;
    $('previewBanner').classList.remove('hidden');
    $('previewText').textContent =
      `Read-only preview · ${previewStudent.student_code} · ${previewStudent.full_name}`;
    $('loginId').textContent = previewStudent.student_code;
    $('signOut').textContent = 'Exit Preview';
    return previewStudent;
  }

  const { data, error } = await supabase
    .from('qa_students')
    .select('student_id,student_code,full_name,status,phone,email')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (error || !data) {
    throw error || new Error('STUDENT_PROFILE_NOT_FOUND');
  }

  return data;
}

async function init() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    location.replace('./');
    return;
  }

  const student = await resolveStudent(session);

  if (student.status !== 'active') {
    await supabase.auth.signOut();
    location.replace('./');
    return;
  }

  $('loginId').textContent = student.student_code;
  $('studentName').textContent = student.full_name;
  $('studentCode').textContent = student.student_code;
  $('studentStatus').textContent = student.status;

  const [
    enrollmentResult,
    guardianLinkResult,
    feeChargeResult,
    feePaymentResult
  ] = await Promise.all([
    supabase
      .from('qa_enrollments')
      .select('course_code,start_date,end_date,status,teacher_user_id,notes')
      .eq('student_id', student.student_id)
      .order('start_date', { ascending: false }),
    supabase
      .from('qa_student_guardians')
      .select('guardian_id,is_primary')
      .eq('student_id', student.student_id),
    supabase
      .from('qa_fee_charges')
      .select('billing_month,expected_amount,discount,previous_due,current_payable,due_date,status')
      .eq('student_id', student.student_id)
      .order('billing_month', { ascending: false })
      .limit(12),
    supabase
      .from('qa_fee_payments')
      .select('receipt_no,paid_at,amount,payment_method')
      .eq('student_id', student.student_id)
      .order('paid_at', { ascending: false })
      .limit(12)
  ]);

  for (const result of [
    enrollmentResult,
    guardianLinkResult,
    feeChargeResult,
    feePaymentResult
  ]) {
    if (result.error) throw result.error;
  }

  const enrollments = enrollmentResult.data || [];
  const guardianLinks = guardianLinkResult.data || [];
  const charges = feeChargeResult.data || [];
  const payments = feePaymentResult.data || [];

  const guardianIds = guardianLinks.map((x) => x.guardian_id).filter(Boolean);
  let guardianMap = {};

  if (guardianIds.length) {
    const { data, error } = await supabase
      .from('qa_guardians')
      .select('guardian_id,full_name,relation,phone,email,address')
      .in('guardian_id', guardianIds);

    if (error) throw error;
    guardianMap = Object.fromEntries((data || []).map((x) => [x.guardian_id, x]));
  }

  const teacherUserIds = [
    ...new Set(enrollments.map((x) => x.teacher_user_id).filter(Boolean))
  ];
  let teacherMap = {};

  if (teacherUserIds.length) {
    const { data, error } = await supabase
      .from('qa_teachers')
      .select('user_id,teacher_code,full_name,full_name_bn,phone,specialization')
      .in('user_id', teacherUserIds);

    if (error) throw error;
    teacherMap = Object.fromEntries((data || []).map((x) => [x.user_id, x]));
  }

  let sessionRows = [];
  const courseCodes = [
    ...new Set(
      enrollments
        .filter((x) => x.status === 'active')
        .map((x) => x.course_code)
        .filter(Boolean)
    )
  ];

  if (courseCodes.length) {
    const { data, error } = await supabase
      .from('qa_class_sessions')
      .select('session_id,teacher_id,course_code,session_date,starts_at,ends_at,mode,meeting_link,topic,quran_portion,homework,status,notes')
      .in('course_code', courseCodes)
      .order('session_date', { ascending: true })
      .limit(20);

    if (error) throw error;
    sessionRows = data || [];
  }

  $('guardians').innerHTML = guardianLinks.map((link) => {
    const guardian = guardianMap[link.guardian_id];
    if (!guardian) return '';

    return `
      <div class="portal-stat">
        <small>${esc(guardian.relation || 'Guardian')}${link.is_primary ? ' · Primary' : ''}</small>
        <strong>${esc(guardian.full_name)}</strong>
        <span class="muted">${esc(guardian.phone || '')}</span>
        ${guardian.email ? `<span class="muted">${esc(guardian.email)}</span>` : ''}
        ${guardian.address ? `<span class="muted">${esc(guardian.address)}</span>` : ''}
      </div>
    `;
  }).join('') || '<p class="portal-note">Guardian information has not been added yet.</p>';

  $('enrollments').innerHTML = enrollments.map((item) => {
    const teacher = teacherMap[item.teacher_user_id];

    return `
      <div class="portal-stat">
        <small>
          ${esc(item.course_code)}
          · <span class="active-badge ${statusClass(item.status)}">${esc(item.status)}</span>
        </small>
        <strong>${esc(teacher?.full_name || 'Teacher not assigned')}</strong>
        ${teacher?.specialization ? `<span class="muted">${esc(teacher.specialization)}</span>` : ''}
        <span class="muted">Start: ${esc(item.start_date || '—')} · End: ${esc(item.end_date || '—')}</span>
        ${item.notes ? `<span class="muted">${esc(item.notes)}</span>` : ''}
      </div>
    `;
  }).join('') || '<p class="portal-note">No enrollment found.</p>';

  const upcoming = sessionRows
    .filter((item) => {
      if (item.status === 'cancelled') return false;
      if (item.starts_at) return new Date(item.starts_at) >= new Date();
      return new Date(`${item.session_date}T23:59:59`) >= new Date();
    })
    .slice(0, 6);

  $('scheduleRows').innerHTML = upcoming.map((item) => {
    const endTime = item.ends_at
      ? ` – ${new Date(item.ends_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
      : '';

    return `
      <tr>
        <td>${esc(formatDate(item.session_date))}</td>
        <td>${esc(item.starts_at ? formatDateTime(item.starts_at).split(', ').pop() : '—')}${esc(endTime)}</td>
        <td>${esc(item.course_code)}</td>
        <td>${esc(item.topic || 'Class')}</td>
        <td>${esc(item.mode || 'online')}</td>
        <td>${safeLink(item.meeting_link)}</td>
      </tr>
    `;
  }).join('') || '<tr><td colspan="6">No upcoming class scheduled.</td></tr>';

  const totalDue = charges.reduce(
    (sum, item) => sum + Math.max(0, Number(item.current_payable || 0)),
    0
  );
  const openCharges = charges.filter((item) => item.status !== 'paid').length;
  const totalPaid = payments.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  $('totalDue').textContent = money(totalDue);
  $('openChargeCount').textContent = String(openCharges);
  $('totalPaid').textContent = money(totalPaid);

  $('fees').innerHTML = charges.slice(0, 6).map((item) => `
    <li>
      <b>${esc(item.billing_month)}</b><br>
      Payable: ${esc(money(item.current_payable))}
      · <span class="active-badge ${statusClass(item.status)}">${esc(item.status)}</span>
      ${item.due_date ? `<br><span class="muted">Due: ${esc(formatDate(item.due_date))}</span>` : ''}
    </li>
  `).join('') || '<li>No fee record yet.</li>';

  $('paymentRows').innerHTML = payments.map((item) => `
    <tr>
      <td>${esc(item.receipt_no)}</td>
      <td>${esc(item.paid_at ? new Date(item.paid_at).toLocaleDateString('en-GB') : '')}</td>
      <td>${esc(money(item.amount))}</td>
      <td>${esc(item.payment_method)}</td>
    </tr>
  `).join('') || '<tr><td colspan="4">No payment record.</td></tr>';

  const notes = [];
  enrollments
    .filter((item) => item.notes)
    .slice(0, 3)
    .forEach((item) => notes.push(`${item.course_code}: ${item.notes}`));

  sessionRows
    .filter((item) => item.homework)
    .slice(0, 3)
    .forEach((item) => notes.push(`Homework (${item.course_code}): ${item.homework}`));

  $('notes').innerHTML = notes.length
    ? notes.map((note) => `<div>${esc(note)}</div>`).join('')
    : 'No new notes.';

  $('exitPreview')?.addEventListener('click', () => {
    location.href = 'dashboard.html';
  });

  $('signOut').addEventListener('click', async () => {
    await supabase.auth.signOut();
    location.replace('./');
  });

  await setSchoolWhatsApp();
  await setSchoolWhatsApp();
  $('loading').classList.add('hidden');
  $('app').classList.remove('hidden');
}

init().catch((error) => {
  console.error('student portal error', error);

  if (error.message === 'PREVIEW_NOT_ALLOWED') {
    location.replace('./');
    return;
  }

  $('loading').textContent = 'Portal load করা যায়নি।';
});
