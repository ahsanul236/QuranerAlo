// Official QURANER ALO logo loader.
// The logo is stored in brand.js as base64, but displayed through a same-page
// blob URL so Content Security Policy does not have to permit data: images.
(() => {
  const image = document.querySelector('[data-brand-logo]');
  const source = typeof QURANER_ALO_LOGO === 'string' ? QURANER_ALO_LOGO : '';
  if (!image || !source.startsWith('data:image/')) return;

  try {
    const comma = source.indexOf(',');
    if (comma === -1) throw new Error('Invalid embedded logo data.');

    const header = source.slice(0, comma);
    const payload = source.slice(comma + 1);
    const mime = (header.match(/^data:([^;]+);base64$/i) || [])[1] || 'image/webp';
    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);

    const blobUrl = URL.createObjectURL(new Blob([bytes], { type: mime }));
    image.src = blobUrl;

    image.addEventListener('error', () => {
      console.error('QURANER ALO logo failed to decode from blob URL.');
      URL.revokeObjectURL(blobUrl);
    }, { once: true });

    image.addEventListener('load', () => {
      image.classList.add('is-loaded');
    }, { once: true });

    const favicon = document.querySelector('link[data-brand-favicon]') || document.createElement('link');
    favicon.rel = 'icon';
    favicon.type = mime;
    favicon.dataset.brandFavicon = 'true';
    favicon.href = blobUrl;
    document.head.appendChild(favicon);
  } catch (error) {
    console.error('QURANER ALO logo could not be prepared.', error);
  }
})();
