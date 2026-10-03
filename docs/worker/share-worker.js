// CyPress share worker.
// A link like  https://YOUR-WORKER/s/zABC...  carries the story inside the address.
// This worker reads it and returns the CyPress share page with the story's own title, photo
// and description in the preview tags, so chat apps show a rich card. Nothing is stored.
const PAGES = 'https://davealmaguer-hub.github.io/cypress-android/';

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

export default {
  async fetch(req) {
    const u = new URL(req.url);
    if (u.pathname === '/' || u.pathname === '') return Response.redirect(PAGES, 302);
    const m = u.pathname.match(/^\/s\/([zp][A-Za-z0-9_-]{1,4000})$/);
    if (!m) return new Response('Not found', { status: 404 });

    let o = null;
    try { o = await decode(m[1]); } catch (e) { o = null; }

    const page = await fetch(PAGES + 's.html', { cf: { cacheTtl: 300, cacheEverything: true } });
    if (!page.ok) return Response.redirect(PAGES + 's.html', 302);
    let html = await page.text();

    const title = (o && typeof o.t === 'string' && o.t.trim()) ? o.t.trim().slice(0, 160) : 'A story shared from CyPress';
    const source = (o && typeof o.s === 'string') ? o.s.slice(0, 60) : '';
    const desc = (o && typeof o.x === 'string' && o.x.trim())
      ? o.x.trim().slice(0, 200)
      : 'Open it to read, and see how news looks in CyPress.';
    const img = o ? okUrl(o.i, true) : '';
    const image = img || PAGES + 'logo.png';

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
      '<script>window.__CYP="' + m[1] + '"</script>';

    html = html
      .replace(/<meta property="og:[^>]*>\s*/g, '')
      .replace(/<meta name="description"[^>]*>\s*/g, '')
      .replace(/<title>[\s\S]*?<\/title>/, '<title>' + esc(title) + ' · CyPress</title>')
      .replace('<head>', '<head><base href="' + PAGES + '">')
      .replace('</head>', tags + '</head>');

    return new Response(html, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=300',
        'x-robots-tag': 'noindex'
      }
    });
  }
};
