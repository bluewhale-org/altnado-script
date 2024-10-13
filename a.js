function runAltnado() {
  console.log('(Altnado) Adding alt text to images')

  const images = document.querySelectorAll('img')
  images.forEach((img) => {
    if (img.naturalWidth > 100 && img.naturalHeight > 100) {
      processImage(img)
    }
  })
}

function getFullImagePath(src) {
  if (src.startsWith('http')) {
    return src
  }
  return new URL(src, window.location.origin).href
}

function processImage(img, pageUrl) {
  const imageSrc = getFullImagePath(img.src)

  console.debug('(Altnado) Processing image:', imageSrc)

  fetch(
    'https://www.altnado.com/api/images?url=' + encodeURIComponent(imageSrc),
  )
    .then((response) => {
      console.debug('(Altnado) Received response from API for image:', imageSrc)
      return response.json()
    })
    .then((data) => {
      console.debug('(Altnado) Parsed JSON data for image:', imageSrc, data)
      updateAltText(img, data)
    })
    .catch((error) =>
      console.debug('(Altnado) Error processing image:', imageSrc, error),
    )
}

function updateAltText(img, data) {
  if (data.alt !== null) {
    console.debug('(Altnado) Updating alt text for image:', img.src)
    img.alt = data.alt
  } else {
    console.debug('(Altnado) No alt text update needed for image:', img.src)
  }
}

if (document.readyState === 'loading') {
  console.log('(Altnado) Page is still loading, adding listener')
  document.addEventListener('DOMContentLoaded', runAltnado)
} else {
  console.log('(Altnado) Page already loaded, running immediately')
  runAltnado()
}
