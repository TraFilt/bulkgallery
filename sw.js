/* Minimal service worker for bulkgallery.com
   Caches the app shell (HTML/CSS/JS, already inlined in index.html)
   plus the external font/library files, so repeat visits load
   instantly from the local cache instead of the network. */

const CACHE_NAME = 'bulkgallery-v1';
const CORE_ASSETS = [
  './',
  './index.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache-first for same-origin and known CDN assets; network otherwise.
self.addEventListener('fetch', (event) => {
  if(event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if(cached) return cached;
      return fetch(event.request)
        .then((response) => {
          // Only cache successful, basic/CORS-opaque responses.
          if(response && (response.status === 200 || response.type === 'opaque')){
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});
