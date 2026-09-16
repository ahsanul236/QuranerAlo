// Foundation UI only.
(() => {
  const ready = document.querySelector('.status');
  if (ready) ready.title = 'Foundation only — authentication and management modules are being added in phases.';

  const target = document.getElementById('backendStatus');
  if (target) target.textContent = 'Backend foundation: ready';
})();
