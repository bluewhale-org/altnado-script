let processedImages = new Set();
let altTexts = {};
let updateCount = new Map();

function runAltnado() {
  console.log('(Altnado) Adding alt text to images');

  const images = Array.from(document.querySelectorAll('img'))
    .filter(img => img.naturalWidth > 100 && img.naturalHeight > 100);

  const siteId = getSiteId();
  processImages(images, siteId);
}

function getSiteId() {
  const script = document.querySelector('script[src*="s.altnado.com/a.js"]');
  return script ? script.getAttribute('site-id') : null;
}

function getFullImagePath(src) {
  if (src.startsWith('http')) {
    return src;
  }
  return new URL(src, window.location.origin).href;
}

function getImageIdentifier(img) {
  return img.src + '|' + (img.getAttribute('data-src') || '');
}

function processImages(images, siteId) {
  const imageSrcs = images
    .filter(img => !processedImages.has(getImageIdentifier(img)))
    .map(img => getFullImagePath(img.src));

  if (imageSrcs.length === 0) {
    console.debug('(Altnado) No new images to process');
    return;
  }

  console.debug('(Altnado) Processing images:', imageSrcs);

  fetch('https://www.altnado.com/api/images', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      images: imageSrcs,
      siteId: siteId
    }),
  })
    .then((response) => {
      console.debug('(Altnado) Received response from API');
      return response.json();
    })
    .then((data) => {
      console.debug('(Altnado) Parsed JSON data:', data);
      altTexts = { ...altTexts, ...data };
      updateAltTexts(images);
      setupMutationObserver();
    })
    .catch((error) =>
      console.debug('(Altnado) Error processing images:', error)
    );
}

function updateAltTexts(images) {
  images.forEach((img) => {
    const imageSrc = getFullImagePath(img.src);
    const imageIdentifier = getImageIdentifier(img);
    if (altTexts[imageSrc] && altTexts[imageSrc].alt !== null) {
      console.debug('(Altnado) Updating alt text for image:', imageSrc);
      img.alt = altTexts[imageSrc].alt;
      processedImages.add(imageIdentifier);
      updateCount.set(imageIdentifier, 1);
    } else {
      console.debug('(Altnado) No alt text update needed for image:', imageSrc);
    }
  });
}

function setupMutationObserver() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && (mutation.attributeName === 'alt' || mutation.attributeName === 'src')) {
        const img = mutation.target;
        const imageSrc = getFullImagePath(img.src);
        const imageIdentifier = getImageIdentifier(img);
        if (altTexts[imageSrc] && altTexts[imageSrc].alt !== null && altTexts[imageSrc].alt !== img.alt) {
          const count = updateCount.get(imageIdentifier) || 0;
          if (count < 2) {
            console.debug('(Altnado) Re-updating alt text for image:', imageSrc);
            img.alt = altTexts[imageSrc].alt;
          } else {
            console.debug('(Altnado) Max updates reached for image:', imageSrc);
          }
        }
      }
    });
  });

  const config = { attributes: true, attributeFilter: ['alt', 'src'], subtree: true };
  observer.observe(document.body, config);
}

if (document.readyState === 'loading') {
  console.log('(Altnado) Page is still loading, adding listener');
  document.addEventListener('DOMContentLoaded', runAltnado);
} else {
  console.log('(Altnado) Page already loaded, running immediately');
  runAltnado();
}
