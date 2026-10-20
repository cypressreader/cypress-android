/* CyPress web app: keeps the app itself available offline. Feeds are never cached here. */
const V = 'cyp-web-8';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || !u.pathname.startsWith('/app/')) return;
  /* every shortcut (?view=today, ?view=brief…) is the same page: keep one cached copy of it */
  const k0 = (r.mode === 'navigate' && (u.pathname === '/app/' || u.pathname === '/app/index.html')) ? new Request(u.origin + '/app/') : r;
  e.respondWith(fetch(r).then(res => { if (res.ok) { const k = res.clone(); caches.open(V).then(c => c.put(k0, k)); } return res; }).catch(() => caches.match(k0).then(m => m || caches.match('./')).then(m => m || caches.match('index.html'))));
});
