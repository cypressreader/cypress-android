/* Runs before the app inside docs/demo.html. It makes the app a self-contained sample:
   everything stays in memory (nothing touches the visitor's own CyPress Reader data),
   the network is switched off, and the stories come from the made-up sample edition. */
(function () {
  var D = /*DATA*/null;
  var root = document.documentElement;
  root.classList.add('demo');

  /* 1. memory-only storage, and a hard stop if that could not be set up */
  function Mem() {
    var m = {};
    return {
      __mem: true,
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null; },
      setItem: function (k, v) { m[k] = String(v); },
      removeItem: function (k) { delete m[k]; },
      clear: function () { m = {}; },
      key: function (i) { return Object.keys(m)[i] || null; },
      get length() { return Object.keys(m).length; }
    };
  }
  ['localStorage', 'sessionStorage'].forEach(function (n) {
    try { Object.defineProperty(window, n, { configurable: true, value: Mem() }); } catch (e) {}
  });
  ['indexedDB', 'caches'].forEach(function (n) {
    try { Object.defineProperty(window, n, { configurable: true, value: undefined }); } catch (e) {}
  });
  try { delete Navigator.prototype.serviceWorker; } catch (e) {}
  try { if ('serviceWorker' in navigator) Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: undefined }); } catch (e) {}
  var ok = false;
  try { ok = window.localStorage && window.localStorage.__mem === true; } catch (e) {}
  if (!ok) {
    document.documentElement.innerHTML = '<body style="font:16px system-ui;padding:24px">The demo is not available in this browser.</body>';
    throw new Error('demo: memory storage could not be set up');
  }

  /* 2. the sample edition, served through the app's normal feed route */
  var NOW = Date.now();
  var AUTH = ['Mara Quill', 'Tom Ashby', 'Ines Varga', 'Leo Marsh', 'Priya Nand', 'Jonas Reed'];
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function body(f, i) {
    var st = f.stories[i], n = st[2], out = [], off = i * 3;
    for (var k = 0; k < n; k++) {
      out.push('<p>' + esc(f.paras[(off + k) % f.paras.length]) + '</p>');
      if (k === 1 && n >= 5) out.push('<blockquote>' + esc(f.quote) + '</blockquote>');
    }
    return out.join('');
  }
  /* pictures are small abstract SVGs kept next to the demo (docs/demo/art-0.svg and so on) */
  function artUrl(n) { return new URL('/demo/art-' + n + '.svg', location.href).href; }
  function hasImg(fi, i) { return (i + fi) % 5 !== 4; }
  function feedXml(f, fi) {
    var items = f.stories.map(function (st, i) {
      var when = new Date(NOW - (i * 95 + fi * 31 + 18) * 60000).toUTCString();
      var link = 'https://' + f.id + '.demo.invalid/a/' + i;
      var art = hasImg(fi, i) ? '<media:content url="' + artUrl((i + fi * 2) % 6) + '" medium="image" type="image/svg+xml" width="1600" height="1000"/>' : '';
      return '<item><title>' + esc(st[0]) + '</title><link>' + link + '</link><guid>' + link + '</guid><pubDate>' + when + '</pubDate>' +
        '<dc:creator>' + AUTH[(i + fi) % AUTH.length] + '</dc:creator><category>' + esc(st[3]) + '</category>' +
        '<description>' + esc(st[1]) + '</description>' + art + '</item>';
    }).join('');
    return '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><title>' + f.name + '</title><link>https://' + f.id + '.demo.invalid/</link><description>' + f.cat + ' sample stories</description>' + items + '</channel></rss>';
  }
  function articleHtml(f, i) {
    var t = esc(f.stories[i][0]);
    return '<!doctype html><html><head><title>' + t + '</title></head><body><article><h1>' + t + '</h1>' + body(f, i) + '</article></body></html>';
  }
  function respond(host, path) {
    var fi = -1;
    D.feeds.forEach(function (f, k) { if (f.id === host) fi = k; });
    if (fi < 0) return new Response('', { status: 404 });
    var f = D.feeds[fi], m = path.match(/^a\/(\d+)/);
    if (m && f.stories[+m[1]]) return new Response(articleHtml(f, +m[1]), { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } });
    return new Response(feedXml(f, fi), { status: 200, headers: { 'content-type': 'application/rss+xml; charset=utf-8' } });
  }
  var realFetch = window.fetch ? window.fetch.bind(window) : null;
  window.fetch = function (input, init) {
    var u = typeof input === 'string' ? input : (input && input.url) || '';
    var d = u; try { d = decodeURIComponent(u); } catch (e) {}
    var m = d.match(/https?:\/\/([a-z]+)\.demo\.invalid\/([^\s&"]*)/);
    if (m) return Promise.resolve(respond(m[1], m[2]));
    if (realFetch && (u.charAt(0) === '/' || u.indexOf(location.origin) === 0 || u.indexOf('data:') === 0 || u.indexOf('blob:') === 0)) return realFetch(input, init);
    return Promise.reject(new TypeError('The demo works offline'));
  };

  /* 3. the starting state: opens on The Daily, no setup screens */
  var seed = {
    feeds: D.feeds.map(function (f, i) { return { id: 'f' + i, title: f.name, url: 'https://' + f.id + '.demo.invalid/feed', folder: '' }; }),
    folders: [], sel: 'today', scroll: 'pages', ver: D.ver, smn: 1, intro: false, setall: 1, theme: 'halcyon', cvs: 'auto', tips: {}
  };
  (D.tipKeys || []).forEach(function (k) { seed.tips[k] = 1; });
  window.localStorage.setItem('folio', JSON.stringify(seed));

  /* 4. nothing leaves the demo: outside links and windows just explain that this is a demo */
  function note() { try { if (window.toast) window.toast('This is a demo. Get CyPress Reader to read the real thing.'); } catch (e) {} }
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var h = a.getAttribute('href') || '';
    if (/^(https?:|mailto:|tel:)/i.test(h) && h.indexOf(location.origin) !== 0) { e.preventDefault(); e.stopPropagation(); note(); }
  }, true);
  window.open = function () { note(); return null; };
})();
