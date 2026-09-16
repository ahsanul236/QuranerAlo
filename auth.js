import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const config = window.QURANER_ALO_CONFIG;
const supabase = createClient(config.supabaseUrl, config.supabasePublishableKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

const $ = (id) => document.getElementById(id);
const loginTab = $('loginTab');
const setupTab = $('setupTab');
const loginForm = $('loginForm');
const setupForm = $('setupForm');
const recoveryBox = $('recoveryBox');
const recoveryForm = $('recoveryForm');
const authPanel = $('authPanel');
const signedInPanel = $('signedInPanel');
const message = $('message');

function setMessage(text, type = '') {
  message.textContent = text;
  message.className = `message ${type}`.trim();
}

function showTab(tab) {
  const login = tab === 'login';
  loginForm.classList.toggle('hidden', !login);
  setupForm.classList.toggle('hidden', login);
  loginTab.classList.toggle('is-active', login);
  setupTab.classList.toggle('is-active', !login);
  loginTab.setAttribute('aria-selected', String(login));
  setupTab.setAttribute('aria-selected', String(!login));
  if (login) setupForm.reset();
  else loginForm.reset();
  setMessage('');
}

function showSignedIn(user, role) {
  authPanel.classList.add('hidden');
  signedInPanel.classList.remove('hidden');
  $('signedInEmail').textContent = user.email || '';
  $('signedInRole').textContent = role ? role.toUpperCase() : 'AUTHENTICATED';
}

async function getProfile(user) {
  const { data, error } = await supabase
    .from('qa_users')
    .select('email, full_name, role, active')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function renderSession(session) {
  if (!session?.user) return;
  try {
    const profile = await getProfile(session.user);
    if (profile && profile.active === false) {
      await supabase.auth.signOut();
      setMessage('এই account বর্তমানে inactive করা আছে।', 'error');
      return;
    }
    showSignedIn(session.user, profile?.role || 'viewer');
  } catch (error) {
    console.error(error);
    setMessage('Profile load করা যায়নি।', 'error');
  }
}

loginTab.addEventListener('click', () => showTab('login'));
setupTab.addEventListener('click', () => showTab('setup'));

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setMessage('Login হচ্ছে…');
  const email = $('loginEmail').value.trim();
  const password = $('loginPassword').value;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    setMessage('Login করা যায়নি। Email/password যাচাই করুন অথবা password reset করুন।', 'error');
    return;
  }
  if (data.session) await renderSession(data.session);
});

$('forgotPassword').addEventListener('click', async () => {
  const email = $('loginEmail').value.trim();
  if (!email) {
    setMessage('প্রথমে আপনার email লিখুন, তারপর password reset চাপুন।', 'error');
    $('loginEmail').focus();
    return;
  }
  setMessage('Password reset email পাঠানো হচ্ছে…');
  const redirectTo = `${window.location.origin}${window.location.pathname}`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) {
    setMessage('Password reset request পাঠানো যায়নি।', 'error');
    return;
  }
  setMessage('যদি এই email-এর account থাকে, password reset email পাঠানো হয়েছে।', 'success');
});

setupForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = $('setupEmail').value.trim().toLowerCase();
  const fullName = $('setupName').value.trim();
  const password = $('setupPassword').value;
  const password2 = $('setupPassword2').value;
  if (email !== 'ahsanul236@outlook.com') {
    setMessage('এই Super Admin setup শুধু নির্ধারিত owner email-এর জন্য।', 'error');
    return;
  }
  if (password !== password2) {
    setMessage('দুইটি password একই নয়।', 'error');
    return;
  }
  setMessage('Super Admin account তৈরি হচ্ছে…');
  const redirectTo = `${window.location.origin}${window.location.pathname}`;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: redirectTo
    }
  });
  if (error) {
    setMessage('Account তৈরি করা যায়নি। Email confirmation বা existing account-এর অবস্থা যাচাই করুন।', 'error');
    return;
  }
  if (data.session) {
    await renderSession(data.session);
    return;
  }
  setMessage('Account তৈরি হয়েছে। আপনার email inbox থেকে confirmation link খুলে তারপর login করুন।', 'success');
});

recoveryForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const password = $('recoveryPassword').value;
  const password2 = $('recoveryPassword2').value;
  if (password !== password2) {
    setMessage('দুইটি নতুন password একই নয়।', 'error');
    return;
  }
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    setMessage('Password update করা যায়নি।', 'error');
    return;
  }
  recoveryBox.classList.add('hidden');
  setMessage('Password সফলভাবে পরিবর্তন হয়েছে।', 'success');
});

$('signOut').addEventListener('click', async () => {
  await supabase.auth.signOut();
  signedInPanel.classList.add('hidden');
  authPanel.classList.remove('hidden');
  showTab('login');
  setMessage('আপনি sign out করেছেন।', 'success');
});

supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'PASSWORD_RECOVERY') {
    recoveryBox.classList.remove('hidden');
    authPanel.classList.remove('hidden');
    signedInPanel.classList.add('hidden');
    setMessage('নতুন password সেট করুন।');
  } else if (session && event !== 'INITIAL_SESSION') {
    await renderSession(session);
  }
});

const { data: initialSession } = await supabase.auth.getSession();
if (initialSession.session) {
  await renderSession(initialSession.session);
}
