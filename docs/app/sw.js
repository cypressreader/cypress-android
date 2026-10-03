/* CyPress web app: keeps the app itself available offline. Feeds are never cached here. */
const V = 'cyp-web-1';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || !u.pathname.startsWith('/app/')) return;
  e.respondWith(fetch(r).then(res => { if (res.ok) { const k = res.clone(); caches.open(V).then(c => c.put(r, k)); } return res; }).catch(() => caches.match(r).then(m => m || caches.match('index.html'))));
});
