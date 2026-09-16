(() => {
  const assetUrl = 'assets/logo.b64';

  fetch(assetUrl, { cache: 'no-cache' })
    .then((response) => {
      if (!response.ok) throw new Error(`Logo asset request failed: ${response.status}`);
      return response.text();
    })
    .then((base64) => {
      const cleanBase64 = base64.replace(/\s+/g, '');
      const logoUrl = `data:image/webp;base64,${cleanBase64}`;

      document.querySelectorAll('[data-brand-logo]').forEach((img) => {
        img.src = logoUrl;
        img.onerror = () => console.error('QURANER ALO logo image decode failed.');
      });

      const favicon = document.querySelector('link[data-brand-favicon]');
      if (favicon) favicon.href = logoUrl;
    })
    .catch((error) => {
      console.error('QURANER ALO logo could not be loaded.', error);
    });
})();
