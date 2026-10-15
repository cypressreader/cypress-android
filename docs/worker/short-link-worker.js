// CyPress short links: a small Cloudflare Worker with one KV namespace.
//   POST /api/shorten   body: the long CyPress share link (plain text, or JSON {"url": "..."})
//                       -> {"id":"aB3xK9","url":"https://cypressreader.com/s/aB3xK9"}
//   GET  /s/:id         -> 302 to the long link (an unknown id goes to the home page)
// KV binding name: CYPRESS_SHARE_LINKS
// Only CyPress's own share page (https://cypressreader.com/s.html#...) can be stored, so this can never
// be used to redirect people to somebody else's site. Old long links like /s/<long payload> keep working.

const SITE = 'https://cypressreader.com';
const TTL = 60 * 60 * 24 * 400;          // links stay valid for about 13 months
const MAX_URL = 8 * 1024;                // the longest link accepted
const ID_LEN = 6;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const ALLOWED_ORIGINS = [
  'https://cypressreader.com', 'https://www.cypressreader.com',
  'https://cypressreader.github.io',                       // the preview web app
  'https://localhost', 'http://localhost', 'capacitor://localhost' // the Android app
];

const cors = req => {
  const o = req.headers.get('origin') || '';
  const h = { 'vary': 'origin' };
  if (ALLOWED_ORIGINS.includes(o)) {
    h['access-control-allow-origin'] = o;
    h['access-control-allow-methods'] = 'POST, OPTIONS';
    h['access-control-allow-headers'] = 'content-type';
    h['access-control-max-age'] = '86400';
  }
  return h;
};

const json = (req, status, body) =>
  new Response(JSON.stringify(body), { status, headers: Object.assign({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }, cors(req)) });

// only our own share page may be stored
function cleanTarget(raw) {
  try {
    const u = new URL(String(raw).trim());
    if (u.protocol !== 'https:') return '';
    if (u.hostname !== 'cypressreader.com' && u.hostname !== 'www.cypressreader.com') return '';
    if (u.pathname !== '/s.html' && !u.pathname.startsWith('/s/')) return '';
    return u.href;
  } catch (e) { return ''; }
}

function newId() {
  const b = crypto.getRandomValues(new Uint8Array(ID_LEN));
  let s = '';
  for (let i = 0; i < ID_LEN; i++) s += ALPHABET[b[i] % ALPHABET.length];
  return s;
}

async function digest(text) {
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
  let s = '';
  for (let i = 0; i < 12; i++) s += d[i].toString(16).padStart(2, '0');
  return s;
}

async function shorten(req, env) {
  if (!env.CYPRESS_SHARE_LINKS) return json(req, 501, { error: 'The CYPRESS_SHARE_LINKS binding is missing' });
  const len = +req.headers.get('content-length') || 0;
  if (len > MAX_URL * 2) return json(req, 413, { error: 'Too large' });
  let text = '';
  try { text = await req.text(); } catch (e) { return json(req, 400, { error: 'Bad request' }); }
  if (text.length > MAX_URL * 2) return json(req, 413, { error: 'Too large' });
  if (/^\s*\{/.test(text)) { try { text = JSON.parse(text).url || ''; } catch (e) { text = ''; } }
  const target = cleanTarget(text);
  if (!target || target.length > MAX_URL) return json(req, 400, { error: 'Not a CyPress share link' });

  const kv = env.CYPRESS_SHARE_LINKS;
  // the same link always gets the same short one (fewer writes, and a re-share does not make a new code)
  const hk = 'h:' + await digest(target);
  let id = await kv.get(hk);
  if (id && await kv.get('s:' + id)) return json(req, 200, { id, url: SITE + '/s/' + id });

  for (let i = 0; i < 5; i++) {
    const c = newId();
    if (await kv.get('s:' + c)) continue;                // taken: try another
    await kv.put('s:' + c, target, { expirationTtl: TTL });
    await kv.put(hk, c, { expirationTtl: TTL });
    return json(req, 200, { id: c, url: SITE + '/s/' + c });
  }
  return json(req, 503, { error: 'Try again' });
}

async function open(req, env, rest) {
  const home = Response.redirect(SITE + '/', 302);
  if (/^[A-Za-z0-9]{6}$/.test(rest) && env.CYPRESS_SHARE_LINKS) {
    const t = await env.CYPRESS_SHARE_LINKS.get('s:' + rest);
    if (t && cleanTarget(t)) return new Response(null, { status: 302, headers: { 'location': t, 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' } });
    return home;
  }
  // an older long link, /s/<packed story>: the share page reads the story from after the #
  if (/^[pz][A-Za-z0-9_-]{20,}$/.test(rest)) return new Response(null, { status: 302, headers: { 'location': SITE + '/s.html#' + rest, 'cache-control': 'no-store' } });
  return home;
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/api/shorten') {
      if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req) });
      if (req.method !== 'POST') return json(req, 405, { error: 'POST only' });
      return shorten(req, env);
    }
    const m = url.pathname.match(/^\/s\/([^/]+)\/?$/);
    if (m && (req.method === 'GET' || req.method === 'HEAD')) return open(req, env, m[1]);
    return fetch(req);   // anything else goes on to the site as usual
  }
};
