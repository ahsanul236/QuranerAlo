// Foundation build only.
(() => {
  const ready = document.querySelector('.status');
  if (ready) ready.title = 'Foundation only — authentication and modules are not enabled yet.';

  const cfg = window.QURANER_ALO_CONFIG || {};
  const target = document.getElementById('backendStatus');
  if (!target || !cfg.supabaseUrl || !cfg.supabasePublishableKey) return;

  fetch(`${cfg.supabaseUrl}/rest/v1/qa_workspace?select=code&code=eq.${encodeURIComponent(cfg.workspaceCode)}`, {
    headers: {
      apikey: cfg.supabasePublishableKey,
      Authorization: `Bearer ${cfg.supabasePublishableKey}`
    }
  })
    .then(async (response) => {
      if (!response.ok) throw new Error('Backend request failed');
      const rows = await response.json();
      target.textContent = rows.length ? 'Backend: connected' : 'Backend: connected (workspace not found)';
    })
    .catch(() => {
      target.textContent = 'Backend: not reachable';
    });
})();
