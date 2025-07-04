// Basic service worker for PWA
const CACHE_NAME = 'lux-libris-v1'
const urlsToCache = [
  '/',
  '/role-selector',
  '/images/lux_libris_logo.png'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response
        }
        return fetch(event.request)
      })
  )
})