/* CyPress web app: keeps the app itself available offline. Feeds are never cached here. */
const V = 'cyp-web-9';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
/* one missing icon must not stop the offline copy from installing */
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => Promise.all(FILES.map(f => c.add(f).catch(() => {})))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || !u.pathname.startsWith('/app/')) return;
  /* every shortcut (?view=today, ?view=brief…) is the same page, and query strings never change a file: one cached copy per path */
  const k0 = (r.mode === 'navigate' && (u.pathname === '/app/' || u.pathname === '/app/index.html')) ? new Request(u.origin + '/app/') : new Request(u.origin + u.pathname);
  const cached = () => caches.match(k0).then(m => m || caches.match('./')).then(m => m || caches.match('index.html'));
  const net = fetch(r).then(res => { if (res.ok) { const k = res.clone(); caches.open(V).then(c => c.put(k0, k)); } return res; });
  /* a slow, half-working connection falls back to the saved copy after 4 s; the network answer still refreshes the cache */
  const slow = new Promise(ok => setTimeout(() => cached().then(m => m && ok(m)), 4000));
  e.respondWith(Promise.race([net, slow]).catch(() => cached()));
  e.waitUntil(net.catch(() => {}));
});
