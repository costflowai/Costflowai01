const CACHE_NAME = 'costflowai-calculators-v1';
const ASSETS = [
  '/assets/js/calculator-suite.9f1c3d.js',
  '/css/calculators.9f1c3d.css'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).catch(() => null)
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;
  if (!ASSETS.includes(url.pathname)) return;
  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cached = await cache.match(request);
      const network = fetch(request).then(response => {
        cache.put(request, response.clone());
        return response;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
