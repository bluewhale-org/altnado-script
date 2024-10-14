function runAltnado() {
  console.log('(Altnado) Adding alt text to images')

  const images = Array.from(document.querySelectorAll('img'))
    .filter(img => img.naturalWidth > 100 && img.naturalHeight > 100)

  const siteId = getSiteId()
  processImages(images, siteId)
}

function getSiteId() {
  const script = document.querySelector('script[src*="s.altnado.com/a.js"]')
  return script ? script.getAttribute('site-id') : null
}

function getFullImagePath(src) {
  if (src.startsWith('http')) {
    return src
  }
  return new URL(src, window.location.origin).href
}

function processImages(images, siteId) {
  const imageSrcs = images.map(img => getFullImagePath(img.src))
  console.debug('(Altnado) Processing images:', imageSrcs)

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
      console.debug('(Altnado) Received response from API')
      return response.json()
    })
    .then((data) => {
      console.debug('(Altnado) Parsed JSON data:', data)
      updateAltTexts(images, data)
    })
    .catch((error) =>
      console.debug('(Altnado) Error processing images:', error)
    )
}

function updateAltTexts(images, data) {
  images.forEach((img) => {
    const imageSrc = getFullImagePath(img.src)
    if (data[imageSrc] && data[imageSrc].alt !== null) {
      console.debug('(Altnado) Updating alt text for image:', imageSrc)
      img.alt = data[imageSrc].alt
    } else {
      console.debug('(Altnado) No alt text update needed for image:', imageSrc)
    }
  })
}

if (document.readyState === 'loading') {
  console.log('(Altnado) Page is still loading, adding listener')
  document.addEventListener('DOMContentLoaded', runAltnado)
} else {
  console.log('(Altnado) Page already loaded, running immediately')
  runAltnado()
}
