// Foundation build only.
// Authentication and Supabase integration will be added in a dedicated phase.
(() => {
  const ready = document.querySelector('.status');
  if (ready) ready.title = 'Foundation only — no backend is connected yet.';
})();
