// CyPress site worker, served at cypressreader.com
//   /s/<payload>   a shared story page with its own preview card (the story travels inside the link)
//   /s/<code>      the same page from a short link; needs the optional SHORT storage binding (see docs/worker/SHORT-LINKS.md)
//   POST /api/short  turns a long link's payload into a short code (stores it in SHORT; answers 501 if SHORT is not set up)
//   /get           the latest Android download
//   /feed?u=<url>  fetches a feed or article for the web app (same-site requests only, plain text out)
//   everything else is the CyPress site and web app, served from GitHub Pages under this address
const PAGES = 'https://cypressreader.github.io/cypress-android/';
const APK = 'https://github.com/cypressreader/cypress-android/releases/latest/download/cypress.apk';
const MAXB = 3 * 1024 * 1024;
const SHORT_TTL = 60 * 60 * 24 * 400; // short links stay valid for about 13 months
const ALLOWED_ORIGINS = ['https://cypressreader.com', 'https://www.cypressreader.com', 'https://localhost', 'capacitor://localhost', 'http://localhost'];

const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const okUrl = (u, https) => { try { const x = new URL(String(u)); return (https ? x.protocol === 'https:' : /^https?:$/.test(x.protocol)) ? x.href : ''; } catch (e) { return ''; } };

function bytes(t) {
  t = t.replace(/-/g, '+').replace(/_/g, '/');
  while (t.length % 4) t += '=';
  const b = atob(t), u = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
  return u;
}

async function decode(p) {
  const u = bytes(p.slice(1));
  let txt;
  if (p[0] === 'z') {
    const st = new Blob([u]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    txt = await new Response(st).text();
  } else txt = new TextDecoder().decode(u);
  const o = JSON.parse(txt);
  return o && typeof o === 'object' ? o : null;
}

function publicHost(h) {
  h = h.toLowerCase();
  if (!h || h === 'localhost' || /\.(local|localhost|internal|lan|home|test|invalid)$/.test(h) || h.indexOf('.') < 0 && h.indexOf(':') < 0) return false;
  if (/^\[/.test(h) || h.indexOf(':') >= 0) return false;
  const m = h.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (m) { const a = +m[1], b = +m[2]; if (a === 10 || a === 127 || a === 0 || a >= 224 || (a === 169 && b === 254) || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31) || (a === 100 && b >= 64 && b <= 127)) return false; }
  else if (/^[\d.]+$/.test(h)) return false;
  return true;
}

async function feed(req, u) {
  const bad = (s, m) => new Response(m, { status: s, headers: { 'content-type': 'text/plain; charset=utf-8', 'x-content-type-options': 'nosniff' } });
  if (req.method !== 'GET') return bad(405, 'GET only');
  const site = req.headers.get('sec-fetch-site'), mode = req.headers.get('sec-fetch-mode');
  const ref = (req.headers.get('origin') || req.headers.get('referer') || '');
  const fromHere = ref.indexOf(u.origin + '/') === 0 || ref === u.origin;
  if (mode === 'navigate' || mode === 'nested-navigate' || !(site === 'same-origin' || fromHere)) return bad(403, 'This is the CyPress web app’s feed fetcher.');
  const t = okUrl(u.searchParams.get('u'), false);
  if (!t) return bad(400, 'Bad address');
  const tu = new URL(t);
  if (!publicHost(tu.hostname) || (tu.port && tu.port !== '80' && tu.port !== '443') || tu.username || tu.password) return bad(400, 'That address can’t be fetched');
  if (tu.hostname === u.hostname || /(^|\.)cypressreader\.com$/.test(tu.hostname)) return bad(400, 'That address can’t be fetched');
  let r;
  try {
    r = await fetch(t, {
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; CyPressReader/1.0; +https://cypressreader.com)', 'accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.9, */*;q=0.5', 'accept-language': 'en' },
      redirect: 'follow', signal: AbortSignal.timeout(10000), cf: { cacheTtl: 120, cacheEverything: true }
    });
  } catch (e) { return bad(502, 'Couldn’t reach that site'); }
  if (!r.ok) return bad(r.status === 404 || r.status === 410 ? r.status : 502, 'The site answered with ' + r.status);
  const len = +r.headers.get('content-length') || 0;
  if (len > MAXB) return bad(413, 'Too large');
  const buf = await r.arrayBuffer();
  if (buf.byteLength > MAXB) return bad(413, 'Too large');
  const cs = ((r.headers.get('content-type') || '').match(/charset=["']?([\w-]+)/i) || [])[1];
  return new Response(buf, {
    status: 200,
    headers: {
      'content-type': 'text/plain; charset=' + (cs || 'utf-8'),
      'x-content-type-options': 'nosniff',
      'content-security-policy': "sandbox; default-src 'none'",
      'cache-control': 'public, max-age=120'
    }
  });
}

const cors = o => ({ 'access-control-allow-origin': o, 'vary': 'origin', 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type', 'access-control-max-age': '86400' });

async function shorten(req, env) {
  const origin = req.headers.get('origin') || '';
  const okOrigin = ALLOWED_ORIGINS.indexOf(origin) >= 0;
  const h = okOrigin ? cors(origin) : {};
  const out = (s, body) => new Response(JSON.stringify(body), { status: s, headers: Object.assign({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }, h) });
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
  if (req.method !== 'POST') return out(405, { error: 'POST only' });
  if (origin && !okOrigin) return out(403, { error: 'Not allowed' });
  if (!env || !env.SHORT) return out(501, { error: 'Short links are not set up' });
  const payload = (await req.text()).trim();
  if (!/^[zp][A-Za-z0-9_-]{20,4000}$/.test(payload)) return out(400, { error: 'Bad link' });
  let o = null;
  try { o = await decode(payload); } catch (e) { o = null; }
  if (!o || typeof o.t !== 'string' || !okUrl(o.l, false)) return out(400, { error: 'Bad link' });
  // the code comes from a hash of the story, so sharing the same story twice gives the same short link
  const dig = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload)));
  let b = ''; for (let i = 0; i < 12; i++) b += String.fromCharCode(dig[i]);
  const id = btoa(b).replace(/\+/g, 'x').replace(/\//g, 'y').replace(/=+$/, '');
  for (const n of [7, 9, 12]) {
    const code = id.slice(0, n);
    const have = await env.SHORT.get(code);
    if (have === payload) return out(200, { code });
    if (have === null) {
      await env.SHORT.put(code, payload, { expirationTtl: SHORT_TTL });
      return out(200, { code });
    }
  }
  return out(500, { error: 'Try again' });
}

async function lookup(env, code) {
  if (!env || !env.SHORT) return null;
  try { return await env.SHORT.get(code); } catch (e) { return null; }
}

async function story(u, payload) {
  let o = null;
  try { o = await decode(payload); } catch (e) { o = null; }
  const page = await fetch(PAGES + 's.html', { cf: { cacheTtl: 300, cacheEverything: true } });
  if (!page.ok) return new Response('Try again in a moment', { status: 502 });
  let html = await page.text();

  const title = (o && typeof o.t === 'string' && o.t.trim()) ? o.t.trim().slice(0, 160) : 'A story shared from CyPress';
  const source = (o && typeof o.s === 'string') ? o.s.slice(0, 60) : '';
  const desc = (o && typeof o.x === 'string' && o.x.trim())
    ? o.x.trim().slice(0, 200)
    : 'Open it to read, and see how news looks in CyPress.';
  const img = o ? okUrl(o.i, true) : '';
  const image = img || u.origin + '/logo.png';

  const tags =
    '<meta property="og:type" content="article">' +
    '<meta property="og:site_name" content="CyPress' + (source ? ' · ' + esc(source) : '') + '">' +
    '<meta property="og:title" content="' + esc(title) + '">' +
    '<meta property="og:description" content="' + esc(desc) + '">' +
    '<meta property="og:image" content="' + esc(image) + '">' +
    '<meta property="og:url" content="' + esc(u.origin + u.pathname) + '">' +
    '<meta name="twitter:card" content="' + (img ? 'summary_large_image' : 'summary') + '">' +
    '<meta name="twitter:title" content="' + esc(title) + '">' +
    '<meta name="twitter:description" content="' + esc(desc) + '">' +
    '<meta name="twitter:image" content="' + esc(image) + '">' +
    '<meta name="description" content="' + esc(desc) + '">' +
    '<script>window.__CYP="' + payload + '"</script>';

  html = html
    .replace(/<meta property="og:[^>]*>\s*/g, '')
    .replace(/<meta name="description"[^>]*>\s*/g, '')
    .replace(/<title>[\s\S]*?<\/title>/, '<title>' + esc(title) + ' · CyPress</title>')
    .replace('<head>', '<head><base href="' + u.origin + '/">')
    .replace('</head>', tags + '</head>');

  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300', 'x-robots-tag': 'noindex' }
  });
}

async function site(req, u) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return new Response('Not found', { status: 404 });
  let p = u.pathname;
  if (p === '/app') return Response.redirect(u.origin + '/app/', 301);
  if (/^\/worker(\/|$)/.test(p) || p.indexOf('..') >= 0) return new Response('Not found', { status: 404 });
  const r = await fetch(PAGES + p.replace(/^\//, ''), { redirect: 'manual', cf: { cacheTtl: 60, cacheEverything: true } });
  if (r.status >= 300 && r.status < 400) {
    const l = r.headers.get('location') || '';
    const m = l.match(/\/cypress-android(\/.*)$/);
    return m ? Response.redirect(u.origin + m[1], 301) : new Response('Not found', { status: 404 });
  }
  const h = new Headers();
  for (const k of ['content-type', 'etag', 'last-modified']) if (r.headers.get(k)) h.set(k, r.headers.get(k));
  h.set('cache-control', /^\/app\/(index\.html|sw\.js)?$/.test(p) ? 'no-cache' : 'public, max-age=300');
  h.set('x-content-type-options', 'nosniff');
  return new Response(r.body, { status: r.status, headers: h });
}

export default {
  async fetch(req, env) {
    const u = new URL(req.url);
    if (u.pathname === '/feed') return feed(req, u);
    if (u.pathname === '/get') return Response.redirect(APK, 302);
    if (u.pathname === '/api/short') return shorten(req, env);
    // a short link: /s/<6 to 12 letters or digits>, looked up in storage
    const sc = u.pathname.match(/^\/s\/([A-Za-z0-9_-]{6,12})$/);
    if (sc) {
      const p = await lookup(env, sc[1]);
      if (p && /^[zp][A-Za-z0-9_-]{1,4000}$/.test(p)) return story(u, p);
      return new Response('This short link has expired or was never created. Ask whoever sent it to share the story again.', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } });
    }
    const m = u.pathname.match(/^\/s\/([zp][A-Za-z0-9_-]{1,4000})$/);
    if (m) return story(u, m[1]);
    if (/^\/s(\/|$)/.test(u.pathname)) return new Response('Not found', { status: 404 });
    return site(req, u);
  }
};
