/* CyPress web app: keeps the app itself available offline. Feeds are never cached here. */
const V = 'cyp-web-12';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'icon-mono-512.png'];
/* one missing icon must not stop the offline copy from installing */
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => Promise.all(FILES.map(f => c.add(f).catch(() => {})))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url), base = new URL(self.registration.scope).pathname;
  /* the bundled fonts never change: answer from the phone, fetch only the first time
     (the app no longer asks Google for site icons, so that cache is gone; the old one is deleted on activate) */
  if (r.method === 'GET' && u.origin === location.origin && u.pathname.startsWith(base + 'fonts/')) {
    e.respondWith(caches.open(V).then(c => c.match(r).then(m => m || fetch(r).then(res => { if (res.ok) c.put(r, res.clone()).catch(() => {}); return res; }))));
    return;
  }
  if (r.method !== 'GET' || u.origin !== location.origin || !u.pathname.startsWith(base)) return;
  /* every shortcut (?view=today, ?view=brief…) is the same page, and query strings never change a file: one cached copy per path */
  const k0 = (r.mode === 'navigate' && (u.pathname === base || u.pathname === base + 'index.html')) ? new Request(u.origin + base) : new Request(u.origin + u.pathname);
  const cached = () => caches.match(k0).then(m => m || caches.match('./')).then(m => m || caches.match('index.html'));
  const net = fetch(r).then(res => { if (!res.ok) throw 0; const k = res.clone(); caches.open(V).then(c => c.put(k0, k)).catch(() => {}); return res; });
  /* a slow, half-working connection falls back to the saved copy after 4 s; the network answer still refreshes the cache */
  const slow = new Promise(ok => setTimeout(() => cached().then(m => m && ok(m)), 4000));
  e.respondWith(Promise.race([net, slow]).catch(() => cached()));
  e.waitUntil(net.catch(() => {}));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const u = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    for (const c of cs) if ('focus' in c) return c.focus();
    return self.clients.openWindow ? self.clients.openWindow(u) : null;
  }));
});
