// Apply the official embedded QURANER ALO logo directly to the page.
(() => {
  if (typeof QURANER_ALO_LOGO !== 'string' || !QURANER_ALO_LOGO.startsWith('data:image/')) return;

  document.querySelectorAll('[data-brand-logo]').forEach((img) => {
    img.src = QURANER_ALO_LOGO;
    img.removeAttribute('aria-hidden');
  });

  let favicon = document.querySelector('link[data-brand-favicon]');
  if (!favicon) {
    favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.dataset.brandFavicon = 'true';
    document.head.appendChild(favicon);
  }
  favicon.href = QURANER_ALO_LOGO;
})();
