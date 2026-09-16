import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const config = window.QURANER_ALO_CONFIG;
const supabase = createClient(config.supabaseUrl, config.supabasePublishableKey, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
});

const $ = (id) => document.getElementById(id);
const ROLE_OPTIONS = ['owner','admin','accounts','teacher','helper','parent','student','viewer'];

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>\"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
}
function redirectToLogin() { window.location.replace('./'); }
async function currentProfile(session) {
  const { data, error } = await supabase.from('qa_users').select('user_id,email,full_name,role,active').eq('user_id', session.user.id).maybeSingle();
  if (error) throw error;
  return data;
}
async function logEvent(action, targetUserId = null, meta = {}) {
  const actor = (await supabase.auth.getUser()).data.user?.id;
  const { error } = await supabase.from('qa_audit_log').insert({
    actor_user_id: actor,
    action,
    entity_type: targetUserId ? 'qa_users' : 'dashboard',
    entity_id: targetUserId,
    metadata: meta
  });
  if (error) console.error(error);
}
function roleSelect(role) {
  return `<select data-role>${ROLE_OPTIONS.map((r) => `<option value="${r}" ${r === role ? 'selected' : ''}>${r}</option>`).join('')}</select>`;
}
async function loadUsers() {
  const { data, error } = await supabase.from('qa_users').select('user_id,email,full_name,role,active').order('created_at', { ascending: true });
  if (error) throw error;
  const tbody = $('userRows');
  tbody.innerHTML = data.map((u) => `<tr data-id="${escapeHtml(u.user_id)}"><td>${escapeHtml(u.email)}</td><td><input data-name value="${escapeHtml(u.full_name)}"></td><td>${roleSelect(u.role)}</td><td><select data-active><option value="true" ${u.active ? 'selected' : ''}>Active</option><option value="false" ${!u.active ? 'selected' : ''}>Inactive</option></select></td><td><button class="save-btn" data-save type="button">Save</button></td></tr>`).join('');
  tbody.querySelectorAll('[data-save]').forEach((button) => button.addEventListener('click', saveUser));
}
async function saveUser(event) {
  const row = event.currentTarget.closest('tr');
  const userId = row.dataset.id;
  const fullName = row.querySelector('[data-name]').value.trim();
  const role = row.querySelector('[data-role]').value;
  const active = row.querySelector('[data-active]').value === 'true';
  const button = event.currentTarget;
  button.disabled = true;
  button.textContent = 'Saving…';
  const { error } = await supabase.from('qa_users').update({ full_name: fullName, role, active, updated_at: new Date().toISOString() }).eq('user_id', userId);
  if (error) {
    alert('এই user update করা যায়নি। Security policy অনুযায়ী অনুমতি না থাকলে পরিবর্তনটি বাতিল হবে।');
    button.disabled = false;
    button.textContent = 'Save';
  } else {
    await logEvent('user.profile_updated', userId, { role, active });
    button.textContent = 'Saved';
    setTimeout(() => { button.textContent = 'Save'; button.disabled = false; }, 900);
  }
}
async function init() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return redirectToLogin();
  const profile = await currentProfile(session);
  if (!profile || profile.active === false) { await supabase.auth.signOut(); return redirectToLogin(); }
  $('rolePill').textContent = (profile.role || 'viewer').toUpperCase();
  $('userEmail').textContent = profile.email || session.user.email || '';
  $('loading').classList.add('hidden');
  $('app').classList.remove('hidden');
  const canManageUsers = profile.role === 'owner' || profile.role === 'admin';
  if (canManageUsers) {
    $('userManagement').classList.remove('hidden');
    try { await loadUsers(); } catch (error) { console.error(error); }
  }
}
$('signOut').addEventListener('click', async () => { await supabase.auth.signOut(); redirectToLogin(); });
supabase.auth.onAuthStateChange((event, session) => { if ((event === 'SIGNED_OUT' || !session) && document.visibilityState !== 'hidden') redirectToLogin(); });
init().catch((error) => { console.error(error); $('loading').textContent = 'Dashboard load করা যায়নি। আবার login করুন।'; });
