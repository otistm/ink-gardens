// Ink Gardens service worker: always tries the network first so updates show up right away,
// and falls back to the last copy it saw so the game still opens with a weak connection.
const CACHE = 'inkgardens-v1';
const CORE = ['/', '/play/', '/play/styles.css', '/play/js/config.js', '/play/js/data.js', '/play/js/core.js', '/play/js/online.js', '/play/js/audio.js',
  '/play/js/draw.js', '/play/js/garden.js', '/play/js/shop.js', '/play/js/screens.js',
  '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return; // fonts go straight to the network
  e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; })
    .catch(() => caches.match(req).then(r => r || caches.match('/play/'))));
});
