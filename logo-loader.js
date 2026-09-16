(() => {
  const logoUrl = 'assets/logo.b64';

  const base64ToBlobUrl = (base64) => {
    const binary = atob(base64.trim());
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return URL.createObjectURL(new Blob([bytes], { type: 'image/webp' }));
  };

  fetch(logoUrl, { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) throw new Error(`Logo asset request failed: ${response.status}`);
      return response.text();
    })
    .then((base64) => {
      const url = base64ToBlobUrl(base64);
      document.querySelectorAll('[data-brand-logo]').forEach((img) => {
        img.src = url;
        img.removeAttribute('aria-hidden');
      });

      let favicon = document.querySelector('link[data-brand-favicon]');
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        favicon.dataset.brandFavicon = 'true';
        document.head.appendChild(favicon);
      }
      favicon.href = url;
    })
    .catch((error) => {
      console.error('QURANER ALO logo could not be loaded.', error);
    });
})();
