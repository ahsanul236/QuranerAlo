(() => {
  const config = window.QURANER_ALO_CONFIG;
  const $ = (id) => document.getElementById(id);
  const login = () => window.location.replace('./');
  const client = window.supabase?.createClient(config?.supabaseUrl, config?.supabasePublishableKey, {
    auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
  });
  const roles = ['admin', 'sub_admin', 'accounts', 'teacher', 'helper', 'parent', 'student', 'viewer'];
  const permissions = [
    ['students.view','Students view'],['students.manage','Students manage'],
    ['guardians.view','Guardians view'],['guardians.manage','Guardians manage'],
    ['enrollments.view','Enrollments view'],['enrollments.manage','Enrollments manage'],
    ['teachers.view','Teachers view'],['teachers.manage','Teachers manage'],
    ['staff.view','Helpers/Staff view'],['staff.manage','Helpers/Staff manage'],
    ['attendance.view','Attendance view'],['attendance.manage','Attendance manage'],
    ['quran.view','Quran progress view'],['quran.manage','Quran progress manage'],
    ['fees.view','Fees view'],['fees.manage','Fees manage'],
    ['payments.view','Payments view'],['payments.manage','Payments manage'],
    ['payroll.view','Payroll view'],['payroll.manage','Payroll manage'],
    ['finance.view','Finance view'],['finance.manage','Finance manage'],
    ['accounting.view','Accounting view'],['accounting.manage','Accounting manage'],
    ['vouchers.view','Vouchers view'],['vouchers.manage','Vouchers manage'],
    ['reports.view','Reports view']
  ];
  const manageToView = {
    'students.manage':'students.view','guardians.manage':'guardians.view','enrollments.manage':'enrollments.view',
    'teachers.manage':'teachers.view','staff.manage':'staff.view','attendance.manage':'attendance.view',
    'quran.manage':'quran.view','fees.manage':'fees.view','payments.manage':'payments.view',
    'payroll.manage':'payroll.view','finance.manage':'finance.view','accounting.manage':'accounting.view',
    'vouchers.manage':'vouchers.view'
  };
  const esc = (v) => String(v ?? '').replace(/[&<>\"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  let access = null;

  const show = (id) => $(id)?.classList.remove('hidden');
  const hide = (id) => $(id)?.classList.add('hidden');
  const message = (id, text, type = '') => {
    const el = $(id);
    if (!el) return;
    el.textContent = text;
    el.className = `message-inline${type ? ` ${type}` : ''}`;
  };

  async function profileFor(session) {
    const { data, error } = await client.from('qa_users')
      .select('user_id,email,full_name,role,active')
      .eq('user_id', session.user.id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async function buildAccess(session, profile) {
    if (profile.role === 'owner') {
      return { session, profile, permissions: new Set(), can: () => true };
    }
    const [u, r] = await Promise.all([
      client.from('qa_user_permissions').select('permission_code').eq('user_id', session.user.id).eq('allowed', true),
      client.from('qa_role_permissions').select('permission_code').eq('role', profile.role)
    ]);
    if (u.error) throw u.error;
    if (r.error) throw r.error;
    const perms = new Set([...(u.data || []), ...(r.data || [])].map((x) => x.permission_code));
    return { session, profile, permissions: perms, can: (p) => perms.has(p) };
  }

  function normalize(name) {
    document.querySelectorAll(`input[name="${name}"]`).forEach((input) => {
      const viewCode = manageToView[input.value];
      if (input.checked && viewCode) {
        const view = document.querySelector(`input[name="${name}"][value="${viewCode}"]`);
        if (view) view.checked = true;
      }
      const manageCode = Object.keys(manageToView).find((k) => manageToView[k] === input.value);
      if (!input.checked && manageCode) {
        const manage = document.querySelector(`input[name="${name}"][value="${manageCode}"]`);
        if (manage) manage.checked = false;
      }
    });
  }

  function permissionCheckboxes(name, selected = []) {
    return permissions.map(([code, label]) =>
      `<label><input type="checkbox" name="${name}" value="${code}" ${selected.includes(code) ? 'checked' : ''}> ${label}</label>`
    ).join('');
  }

  function fillPermissionPanels() {
    $('subAdminPermissions').innerHTML = permissionCheckboxes('subPerm');
    document.querySelectorAll('input[name="subPerm"]').forEach((x) => x.addEventListener('change', () => normalize('subPerm')));
  }

  function selectedPermissions(name) {
    normalize(name);
    return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map((x) => x.value);
  }

  async function countRows(table, fn) {
    let q = client.from(table).select('*', { count: 'exact', head: true });
    if (fn) q = fn(q);
    const { count, error } = await q;
    if (error) throw error;
    return count || 0;
  }

  async function loadMetrics() {
    const today = new Date().toISOString().slice(0, 10);
    const [s, sa, t, ta, h, ha, a, d] = await Promise.all([
      countRows('qa_students'), countRows('qa_students', (q) => q.not('user_id', 'is', null)),
      countRows('qa_teachers'), countRows('qa_teachers', (q) => q.not('user_id', 'is', null)),
      countRows('qa_staff', (q) => q.eq('staff_type', 'helper')),
      countRows('qa_staff', (q) => q.eq('staff_type', 'helper').not('user_id', 'is', null)),
      countRows('qa_attendance', (q) => q.gte('attendance_date', today)),
      client.from('qa_fee_charges').select('current_payable').neq('status', 'paid')
    ]);
    if (d.error) throw d.error;
    $('studentCount').textContent = s;
    $('teacherCount').textContent = t;
    $('helperCount').textContent = h;
    $('attendanceCount').textContent = a;
    $('feesDue').textContent = `৳ ${(d.data || []).reduce((sum, row) => sum + Number(row.current_payable || 0), 0).toLocaleString('en-BD', { maximumFractionDigits: 0 })}`;
    $('portalActivatedCount').textContent = sa + ta + ha;
    $('portalActivationMeta').textContent = `Student ${sa}/${s} · Teacher ${ta}/${t} · Helper ${ha}/${h}`;
    $('studentActivationSummary').textContent = `${sa} / ${s}`;
    $('studentActivationHint').textContent = s ? `${s - sa} জন এখনো activate করেনি` : 'কোনো student নেই';
    $('teacherActivationSummary').textContent = `${ta} / ${t}`;
    $('teacherActivationHint').textContent = t ? `${t - ta} জন এখনো activate করেনি` : 'কোনো teacher নেই';
    $('helperActivationSummary').textContent = `${ha} / ${h}`;
    $('helperActivationHint').textContent = h ? `${h - ha} জন এখনো activate করেনি` : 'কোনো helper নেই';
  }

  function addReports() {
    if (!access.can('reports.view')) return;
    const box = document.querySelector('.quick-links');
    if (!box || box.querySelector('[href="reports.html"]')) return;
    const a = document.createElement('a');
    a.className = 'quick-link';
    a.href = 'reports.html';
    a.textContent = 'Reports';
    box.appendChild(a);
  }

  async function loadPreview() {
    const box = $('portalPreview');
    if (!box || access.profile.role !== 'owner') return;
    box.classList.remove('hidden');
    const [students, teachers] = await Promise.all([
      client.from('qa_students').select('student_id,student_code,full_name').eq('status', 'active').order('student_code'),
      client.from('qa_teachers').select('teacher_id,teacher_code,full_name').eq('active', true).order('teacher_code')
    ]);
    if (students.error) throw students.error;
    if (teachers.error) throw teachers.error;
    $('studentPreviewSelect').innerHTML = '<option value="">Student নির্বাচন করুন</option>' + (students.data || []).map((x) => `<option value="${esc(x.student_id)}">${esc(x.student_code)} · ${esc(x.full_name)}</option>`).join('');
    $('teacherPreviewSelect').innerHTML = '<option value="">Teacher নির্বাচন করুন</option>' + (teachers.data || []).map((x) => `<option value="${esc(x.teacher_id)}">${esc(x.teacher_code)} · ${esc(x.full_name)}</option>`).join('');
    message('previewMessage', (students.data || []).length || (teachers.data || []).length ? '' : 'এখনো কোনো active Student/Teacher পাওয়া যায়নি।');
  }

  function openPreview(kind) {
    const id = kind === 'student' ? $('studentPreviewSelect').value : $('teacherPreviewSelect').value;
    if (!id) {
      message('previewMessage', kind === 'student' ? 'একজন Student নির্বাচন করুন।' : 'একজন Teacher নির্বাচন করুন.', 'error');
      return;
    }
    window.location.href = `${kind === 'student' ? 'student-portal.html?preview_student=' : 'teacher-portal.html?preview_teacher='}${encodeURIComponent(id)}`;
  }

  function roleSelect(role) {
    return `<select data-role>${roles.map((r) => `<option value="${r}" ${r === role ? 'selected' : ''}>${r}</option>`).join('')}</select>`;
  }

  async function loadUsers() {
    const { data, error } = await client.from('qa_users').select('user_id,email,full_name,role,active').order('created_at');
    if (error) throw error;
    const body = $('userRows');
    body.innerHTML = (data || []).map((u) => `<tr data-id="${esc(u.user_id)}"><td>${esc(u.email)}</td><td><input data-name value="${esc(u.full_name)}"></td><td>${roleSelect(u.role)}</td><td><select data-active><option value="true" ${u.active ? 'selected' : ''}>Active</option><option value="false" ${!u.active ? 'selected' : ''}>Inactive</option></select></td><td><div class="action-stack"><button class="save-btn" data-save type="button">Save</button>${u.role === 'sub_admin' ? '<button class="save-btn secondary" data-permissions type="button">Permissions</button>' : ''}</div></td></tr>`).join('');
    body.querySelectorAll('[data-save]').forEach((b) => b.addEventListener('click', saveUser));
    body.querySelectorAll('[data-permissions]').forEach((b) => b.addEventListener('click', editPermissions));
  }

  async function saveUser(event) {
    const row = event.currentTarget.closest('tr');
    const button = event.currentTarget;
    const id = row.dataset.id;
    const role = row.querySelector('[data-role]').value;
    const active = row.querySelector('[data-active]').value === 'true';
    const full_name = row.querySelector('[data-name]').value.trim();
    if (!full_name) { button.textContent = 'Name required'; setTimeout(() => button.textContent = 'Save', 1200); return; }
    if (id === access.profile.user_id && (role !== access.profile.role || !active)) {
      button.textContent = 'Use account safety';
      setTimeout(() => button.textContent = 'Save', 1400);
      return;
    }
    button.disabled = true;
    const { error } = await client.from('qa_users').update({ full_name, role, active, updated_at: new Date().toISOString() }).eq('user_id', id);
    button.disabled = false;
    button.textContent = error ? 'Failed' : 'Saved';
    setTimeout(() => { button.textContent = 'Save'; }, 1000);
    if (!error) await client.from('qa_audit_log').insert({ actor_user_id: access.profile.user_id, action: 'user.updated', entity_type: 'qa_users', entity_id: id, metadata: { role, active } });
  }

  async function editPermissions(event) {
    const row = event.currentTarget.closest('tr');
    const id = row.dataset.id;
    const { data, error } = await client.from('qa_user_permissions').select('permission_code').eq('user_id', id).eq('allowed', true);
    if (error) { message('existingPermissionMessage', 'Permissions load করা যায়নি।', 'error'); return; }
    $('existingPermissionTitle').textContent = `Sub Admin permissions — ${row.querySelector('[data-name]').value}`;
    $('existingPermissions').innerHTML = permissionCheckboxes('existingPerm', (data || []).map((x) => x.permission_code));
    $('existingPermissionPanel').dataset.userId = id;
    show('existingPermissionPanel');
    message('existingPermissionMessage', '');
    document.querySelectorAll('input[name="existingPerm"]').forEach((x) => x.addEventListener('change', () => normalize('existingPerm')));
  }

  async function saveExistingPermissions() {
    const panel = $('existingPermissionPanel');
    const userId = panel.dataset.userId;
    if (!userId) return;
    const button = $('saveExistingPermissions');
    const perms = selectedPermissions('existingPerm');
    button.disabled = true;
    message('existingPermissionMessage', 'Permissions saving হচ্ছে…');
    const del = await client.from('qa_user_permissions').delete().eq('user_id', userId);
    if (del.error) { button.disabled = false; message('existingPermissionMessage', 'Existing permissions clear করা যায়নি।', 'error'); return; }
    if (perms.length) {
      const ins = await client.from('qa_user_permissions').insert(perms.map((permission_code) => ({ user_id: userId, permission_code, allowed: true })));
      if (ins.error) { button.disabled = false; message('existingPermissionMessage', 'নতুন permissions save করা যায়নি।', 'error'); return; }
    }
    await client.from('qa_audit_log').insert({ actor_user_id: access.profile.user_id, action: 'subadmin.permissions_updated', entity_type: 'qa_users', entity_id: userId, metadata: { permissions: perms } });
    button.disabled = false;
    message('existingPermissionMessage', 'Permissions সফলভাবে save হয়েছে।', 'success');
    await loadUsers();
  }

  async function createSubAdmin(event) {
    event.preventDefault();
    if (access.profile.role !== 'owner') return;
    const email = $('subAdminEmail').value.trim().toLowerCase();
    const fullName = $('subAdminName').value.trim();
    const password = $('subAdminPassword').value;
    const password2 = $('subAdminPassword2').value;
    const perms = selectedPermissions('subPerm');
    if (!email || !fullName) { message('subAdminMessage', 'Email এবং Full Name দিন।', 'error'); return; }
    if (password.length < 10) { message('subAdminMessage', 'Password কমপক্ষে ১০ অক্ষরের হতে হবে।', 'error'); return; }
    if (password !== password2) { message('subAdminMessage', 'দুইটি password একই নয়।', 'error'); return; }
    const button = event.currentTarget.querySelector('button[type="submit"]');
    button.disabled = true;
    message('subAdminMessage', 'Sub Admin account তৈরি হচ্ছে…');
    try {
      const { data, error } = await client.functions.invoke('admin-provision', { body: { email, fullName, password, permissions: perms } });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'PROVISION_FAILED');
      event.currentTarget.reset();
      document.querySelectorAll('input[name="subPerm"]').forEach((x) => { x.checked = false; });
      message('subAdminMessage', `Sub Admin তৈরি হয়েছে: ${data.email}`, 'success');
      await loadUsers();
    } catch (error) {
      console.error(error);
      message('subAdminMessage', error?.message === 'OWNER_ONLY' ? 'শুধু Super Admin এই account তৈরি করতে পারবেন।' : 'Sub Admin account তৈরি করা যায়নি। Email আগে থেকে ব্যবহৃত হতে পারে বা provisioning ব্যর্থ হয়েছে।', 'error');
    } finally {
      button.disabled = false;
    }
  }

  function bindUI() {
    $('openStudentPreview')?.addEventListener('click', () => openPreview('student'));
    $('openTeacherPreview')?.addEventListener('click', () => openPreview('teacher'));
    $('selectAllPermissions')?.addEventListener('click', () => {
      document.querySelectorAll('input[name="subPerm"]').forEach((x) => { x.checked = true; });
      normalize('subPerm');
    });
    $('closePermissionEditor')?.addEventListener('click', () => hide('existingPermissionPanel'));
    $('saveExistingPermissions')?.addEventListener('click', saveExistingPermissions);
    $('subAdminForm')?.addEventListener('submit', createSubAdmin);
    document.querySelectorAll('input[name="subPerm"]').forEach((x) => x.addEventListener('change', () => normalize('subPerm')));
    if (!window.__qaSignoutBound) {
      $('signOut')?.addEventListener('click', async () => { try { await client.auth.signOut(); } finally { login(); } });
    }
  }

  async function init() {
    if (!client) throw new Error('Supabase client initialize হয়নি।');
    const { data: { session } } = await client.auth.getSession();
    if (!session) return login();
    const profile = await profileFor(session);
    if (!profile || !profile.active) {
      await client.auth.signOut();
      return login();
    }
    access = await buildAccess(session, profile);
    $('rolePill').textContent = (profile.role || 'viewer').toUpperCase();
    $('userEmail').textContent = profile.email || session.user.email || '';
    hide('loading');
    show('app');
    bindUI();
    addReports();

    const optional = async (fn, target, label) => {
      try { await fn(); }
      catch (error) { console.error(label, error); if (target) message(target, `${label} load করা যায়নি।`, 'error'); }
    };
    void optional(loadMetrics, null, 'Dashboard metrics');
    if (profile.role === 'owner') {
      show('userManagement');
      show('subAdminPanel');
      fillPermissionPanels();
      void optional(loadPreview, 'previewMessage', 'Portal preview');
      void optional(loadUsers, null, 'User management');
    } else if (profile.role === 'admin') {
      show('userManagement');
      void optional(loadUsers, null, 'User management');
    }
  }

  window.addEventListener('error', (event) => console.error('Dashboard runtime error', event.error || event.message));
  window.addEventListener('unhandledrejection', (event) => console.error('Dashboard promise error', event.reason));
  init().catch((error) => {
    console.error('Dashboard init failed', error);
    const loading = $('loading');
    if (loading) {
      loading.innerHTML = `Dashboard load করা যায়নি। ${esc(error?.message || 'অনুগ্রহ করে আবার login করুন।')}<br><a href="./">Login page-এ ফিরুন</a>`;
      loading.classList.add('error');
    }
  });
})();
