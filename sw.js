const CACHE = 'feitjeskeizer-v1';
const ASSETS = ['./index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Cache-first voor de app shell
  if (e.request.url.includes('index.html') || e.request.url.endsWith('/')) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    );
  }
  // Externe requests (fonts, API, Wikipedia) gewoon doorlaten
});
