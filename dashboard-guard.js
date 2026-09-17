(() => {
  const $ = (id) => document.getElementById(id);
  const login = () => window.location.replace('./');
  const bind = () => {
    const button = $('signOut');
    if (!button || !window.supabase || !window.QURANER_ALO_CONFIG || window.__qaSignoutBound) return;
    window.__qaSignoutBound = true;
    const client = window.supabase.createClient(window.QURANER_ALO_CONFIG.supabaseUrl, window.QURANER_ALO_CONFIG.supabasePublishableKey, {
      auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
    });
    button.addEventListener('click', async () => {
      button.disabled = true;
      button.textContent = 'Signing out…';
      try { await client.auth.signOut(); } catch (error) { console.error('Dashboard sign-out failed', error); }
      finally { login(); }
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true });
  else bind();
  window.setTimeout(() => {
    const loading = $('loading');
    const app = $('app');
    if (loading && app && app.classList.contains('hidden') && loading.textContent.includes('Dashboard load')) {
      loading.innerHTML = 'Dashboard initialize হতে সময় লাগছে। <a href="./">Login page-এ ফিরুন</a> এবং আবার চেষ্টা করুন।';
      loading.classList.add('error');
    }
  }, 10000);
})();
