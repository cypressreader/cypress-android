/* World Edition layout check (issue 50). Opens the REAL edition (www/world-edition.json, the real headlines, decks and
   photo picks) at phone width (412x915) and Fold width (884x1104), walks every page / spread, screenshots each one and
   checks, on the page as drawn:
     1. text-on-text overlap  (line boxes of two different pieces of text that intersect)
     2. blank / near-empty pages (almost no text, no picture, no drawn art)
     3. truncation (a headline / cover line clipped, ellipsised, line-clamped or broken mid-word; cover lines vs the data)
     4. NEXT SECTION labels vs the section that actually follows, and Contents rows vs the page they point to
     5. (issue 53) TURNS: at each width it turns forward through the whole edition, back again, and in a rapid sequence, with the page's own
        swipe/turn code. After every turn it waits, screenshots, and at 1 s and again 5 s runs the ghost scan: no copy of a page left in the DOM
        (the old curl built the turn from copies), nothing from outside the current page painting over it and text of two
        DIFFERENT pages overlapping (a ghost IS text over text). Mid-turn it also requires that no page copy exists at all.
     6. every story ends with the 'End of the story' mark, and its folio never prints over a line of body text at any scroll position
     7. (issue 47) PICTURES: a story whose photo or drawing the app accepts must actually show it - a figure in the page, visible, with a
        box of its own. Served over HTTPS with a throwaway certificate for exactly this reason: both picture gates in the app require
        https, so for three months on plain http every picture was refused inside the harness and the check reported '0 problems' on
        pages it had never seen carrying one. A picture the app refuses is reported as a note, with the reason.
   Run: node tests/layout/check.js      Env: OUT=dir (default layout-out)  URL=<app url> (default: serves www/)
        SELFTEST=1 injects known defects and proves each detector fires (exit 0 only if all do).  WIDTHS=phone,fold
   Exit 1 on any failure. Screenshots + report.json + report.md land in OUT. Text over a photo is fine; text over text is not. */
const fs = require('fs'), path = require('path'), https = require('https');
const PW = require('child_process').execSync('npm root -g').toString().trim() + '/playwright';
const { chromium } = require(PW);
const ROOT = path.resolve(__dirname, '../../www'), OUT = path.resolve(process.env.OUT || 'layout-out');
/* 'cover' is the Fold folded - about 320 CSS pixels wide, and the size three passes of this check never
   looked at while every section label on David's cover screen had a headline lying across it. A phone at
   412 did not show it; 320 did. Anything that only breaks when the type has to wrap breaks here first. */
const SIZES = { cover: [320, 720], phone: [412, 915], fold: [884, 1104] };
const WANT = (process.env.WIDTHS || 'cover,phone,fold').split(',');
const SELF = !!process.env.SELFTEST;
fs.mkdirSync(OUT, { recursive: true });

const MIME = { '.html': 'text/html', '.json': 'application/json', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
/* a throwaway certificate, made once per OUT: the app only shows a picture whose address is https (weArtPass / wePhotoOk), so a
   harness on plain http can never see one. The browser is told to accept it (ignoreHTTPSErrors) and nothing leaves the machine. */
const cert = () => { const d = path.join(OUT, 'tls'), k = path.join(d, 'key.pem'), c = path.join(d, 'cert.pem'); fs.mkdirSync(d, { recursive: true });
  if (!fs.existsSync(k) || !fs.existsSync(c)) require('child_process').execSync(`openssl req -x509 -newkey rsa:2048 -nodes -keyout "${k}" -out "${c}" -days 365 -subj /CN=127.0.0.1 -addext subjectAltName=IP:127.0.0.1`, { stdio: 'ignore' });
  return { key: fs.readFileSync(k), cert: fs.readFileSync(c) } };
const serve = () => new Promise(res => { const s = https.createServer(cert(), (q, r) => { let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html';
  /* THE DRAWINGS ARE NOT IN www/. They are served from the site (docs/app/we-art/) and never bundled, and an
     edition names them relative to itself - so here, with www/ as the whole site, every drawing was a 404, the
     app dropped the figure, and the check reported "the page draws no figure at all" for every reviewed
     edition whose drawing sat on a story with no photograph (found 2026-11-28: three false failures on an
     edition whose four drawings all answer on the live site). The one folder is answered from where it lives. */
  if (!fs.existsSync(f) && /^\/we-art\/[\w.-]+$/.test(q.url.split('?')[0])) f = path.join(ROOT, '../docs/app', q.url.split('?')[0]);
  if (!(f.startsWith(ROOT) || f.startsWith(path.join(ROOT, '../docs/app/we-art'))) || !fs.existsSync(f)) { r.writeHead(404); return r.end() } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r) });
  s.listen(0, '127.0.0.1', () => res(s)) });

/* ---- runs inside the page: everything measured on the page as drawn ---- */
function inPage(opts) {
  const sc = document.querySelector('.we-sc'); const pages = [...sc.children].filter(x => !x.classList.contains('we-cp') && (opts.only ? x.classList.contains(opts.only) : !x.classList.contains('we-sp')));
  const HEAD = 'h1,h2,h3,.we-h,.we-cls li,.we-cls span,.we-cls b,.we-pzs,.we-tl button span,.we-lead,.we-hd h2';
  /* deliberate, asked-for clamps: the phone Contents row carries its section lead's headline on two lines (issue 47), so a row that runs past two lines is the design, not a fault. Nothing else is exempt. */
  const CLAMPED = '.we-th';
  /* a page the reader scrolls: on a phone a story is ONE page and reading scrolls it (David's reading model, issue 33), so type below the fold is not cut off - it is the rest of the story. The page edge only means something on a page that cannot move. */
  const SCROLLS = '.we-sx';
  const pname = pg => (pg.getAttribute('aria-label') || '').trim() || pg.className;
  const clipOf = el => { /* the visible box of a text rect: the page, the screen and every overflow-hidden ancestor */
    const pg = el.closest('.we-pg'); const pr = pg.getBoundingClientRect();
    let L = Math.max(pr.left, 0), T = Math.max(pr.top, 0), R = Math.min(pr.right, innerWidth), B = Math.min(pr.bottom, innerHeight);
    for (let e = el; e && e !== pg; e = e.parentElement) { const cs = getComputedStyle(e); const CX = /hidden|clip|auto|scroll/.test(cs.overflowX), CY = /hidden|clip|auto|scroll/.test(cs.overflowY); if (CX || CY) { const b = e.getBoundingClientRect(); if (CX) { L = Math.max(L, b.left); R = Math.min(R, b.right) } if (CY) { T = Math.max(T, b.top); B = Math.min(B, b.bottom) } } }
    return [L, T, R, B] };
  /* the nearest ancestor that actually scrolls vertically, up to the page */
  const scrollerUnder = el => { const pg = el.closest('.we-pg');
    for (let e = el.parentElement; e && e !== pg; e = e.parentElement) { const cs = getComputedStyle(e);
      if (/auto|scroll/.test(cs.overflowY) && e.scrollHeight > e.clientHeight + 1) return e } return null };
  const ink = (el) => { let o = 1; for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return 0; o *= +cs.opacity; if (cs.clip === 'rect(0px, 0px, 0px, 0px)') return 0 } return o };
  const out = [];
  pages.forEach((pg, pi) => {
    const pr = pg.getBoundingClientRect(), items = [], fails = [], P = { i: pi, name: pname(pg), cls: pg.className.replace(/\bwe-pg\b\s*/, '') };
    let chars = 0, media = 0;
    const w = document.createTreeWalker(pg, NodeFilter.SHOW_TEXT); let n, id = 0;
    while ((n = w.nextNode())) {
      const el = n.parentElement, txt = n.nodeValue.replace(/\s+/g, ' ').trim();
      if (!txt || el.closest('script,style,option,select,.we-fo:empty')) continue;
      if (ink(el) < .15) continue;
      const r = document.createRange(); r.selectNodeContents(n);
      const clip = clipOf(el), nodeId = id++;
      [...r.getClientRects()].forEach((q, qi, qa) => {
        if (el.classList.contains('we-dc') && qi === 0 && !el.dataset.dcSeen) { el.dataset.dcSeen = '1'; return } /* the drop cap's tall first-letter box is not a line of text */
        if (q.width < 2 || q.height < 3 || el.closest(CLAMPED) || el.closest(SCROLLS)) return;
        const L = Math.max(q.left, clip[0]), T = Math.max(q.top, clip[1]), R = Math.min(q.right, clip[2]), B = Math.min(q.bottom, clip[3]);
        const vis = Math.max(0, R - L) * Math.max(0, B - T), full = q.width * q.height;
        if (vis < full * .5) { if (vis <= 0 || (q.right - q.left) < 1) return; } /* wholly hidden: not text on the page */
        /* A PART-SHOWN ROW AT THE FOOT OF A SCROLLER IS THE DESIGN, NOT A FAULT: it is what tells a reader
           there is more below (the Contents, 2026-11-27). Only forgiven while there IS more to scroll to,
           and only for the rect hanging off the bottom - a row cut at the top, or cut with nothing below it,
           is still a fault. */
        const sc = scrollerUnder(el);
        const atFoot = sc && sc.scrollHeight - sc.clientHeight - sc.scrollTop > 2 && q.bottom > sc.getBoundingClientRect().bottom - 1;
        if (!atFoot && vis > 0 && vis < full * .72 && q.bottom - q.top > 6) fails.push({ kind: 'trunc', what: 'text cut off by its box or the page edge', text: txt.slice(0, 60), el: el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0], lost: Math.round(100 - 100 * vis / full) + '%' });
        if (vis <= 0) return;
        const ih = B - T; items.push({ id: nodeId, el, txt, r: [L, T + ih * .18, R, B - ih * .12] }); /* a line box is taller than the letters: keep the band the glyphs really fill */
      });
      chars += txt.length;
    }
    /* media: pictures and drawn art that really show */
    pg.querySelectorAll('img,svg,canvas,figure').forEach(m => { if (ink(m) < .15) return; const b = m.getBoundingClientRect(); const a = Math.max(0, Math.min(b.right, pr.right) - Math.max(b.left, pr.left)) * Math.max(0, Math.min(b.bottom, pr.bottom) - Math.max(b.top, pr.top));
      if (m.tagName === 'IMG' && !(m.complete && m.naturalWidth)) return; if (m.tagName === 'FIGURE' && !m.querySelector('img,svg')) return; if (m.tagName !== 'FIGURE' && m.closest('figure')) return; if (m.tagName === 'SVG' && m.closest('button,.we-top')) return; media = Math.max(media, a) });
    const parea = pr.width * pr.height;
    P.chars = chars; P.mediaPct = Math.round(100 * media / parea);
    /* 1. text over text */
    for (let a = 0; a < items.length; a++) for (let b = a + 1; b < items.length; b++) {
      const A = items[a], B = items[b]; if (A.id === B.id) continue;
      const w = Math.min(A.r[2], B.r[2]) - Math.max(A.r[0], B.r[0]), h = Math.min(A.r[3], B.r[3]) - Math.max(A.r[1], B.r[1]);
      if (w < 2 || h <= 0) continue;
      const mh = Math.min(A.r[3] - A.r[1], B.r[3] - B.r[1]);
      if (h < mh * (opts.ov || .4)) continue;
      const nm = i => i.el.tagName.toLowerCase() + '.' + String(i.el.className).split(' ')[0] + ' "' + i.txt.slice(0, 40) + '"';
      fails.push({ kind: 'overlap', a: nm(A), b: nm(B), at: [Math.round(Math.max(A.r[0], B.r[0])), Math.round(Math.max(A.r[1], B.r[1])), Math.round(w), Math.round(h)] });
    }
    /* 2. a blank / near-empty page: almost no type and nothing drawn */
    if (chars < opts.minChars && media < parea * .12) fails.push({ kind: 'blank', what: 'near-empty page: ' + chars + ' characters of text, ' + P.mediaPct + '% picture/art', text: [...pg.querySelectorAll('*')].filter(x => !x.children.length && x.textContent.trim()).map(x => x.textContent.trim()).join(' | ').slice(0, 80) });
    /* 3. truncation: ellipsis, line clamp, clipped box, a word broken across lines, a line ending on a hyphen */
    pg.querySelectorAll('*').forEach(el => { if (!el.textContent.trim() || ink(el) < .15 || el.matches(CLAMPED)) return; const cs = getComputedStyle(el);
      const nm = el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0];
      const clipX = /hidden|clip/.test(cs.overflowX), clipY = /hidden|clip/.test(cs.overflowY), clamp = cs.webkitLineClamp && cs.webkitLineClamp !== 'none';
      if (cs.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 1) fails.push({ kind: 'trunc', what: 'ellipsis cuts the text', el: nm, text: el.textContent.trim().slice(0, 60) });
      if (clamp && el.scrollHeight > el.clientHeight + 1) fails.push({ kind: 'trunc', what: 'line clamp cuts the text', el: nm, text: el.textContent.trim().slice(0, 60) });
      else if ((clipX || clipY) && el.matches(HEAD) && !el.closest('.we-fg')) { if ((clipX && el.scrollWidth > el.clientWidth + 1) || (clipY && el.scrollHeight > el.clientHeight + 1)) fails.push({ kind: 'trunc', what: 'a headline is clipped by its own box', el: nm, text: el.textContent.trim().slice(0, 60) }) } });
    pg.querySelectorAll(HEAD).forEach(el => { if (ink(el) < .15) return; const lw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let t;
      while ((t = lw.nextNode())) { const re = /\S+/g; let m; while ((m = re.exec(t.nodeValue))) { if (m[0].length < 4 || /[-\u2010-\u2014\/]/.test(m[0])) continue; /* a line may end after a hyphen or dash */ const r = document.createRange(); r.setStart(t, m.index); r.setEnd(t, m.index + m[0].length);
        const q = [...r.getClientRects()].filter(x => x.width > 1); if (q.length > 1 && Math.abs(q[0].top - q[q.length - 1].top) > q[0].height * .5) fails.push({ kind: 'trunc', what: 'a word is broken across lines (mid-word)', el: el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0], text: m[0] }) } }
      if (/(…|\.\.\.|-)$/.test(el.textContent.trim()) && !/^\W*$/.test(el.textContent)) fails.push({ kind: 'trunc', what: 'headline ends on an ellipsis or hyphen', el: el.tagName.toLowerCase(), text: el.textContent.trim().slice(0, 60) }) });
    /* cover lines against the data: what is printed must be the whole headline */
    if (pg.classList.contains('we-cv') && window.WE && WE.d) { const e = weEd(WE.d), want = [].concat(...e.sections.map(s => s.stories.slice(0, 1).map(st => (st.h || st.t))));
      pg.querySelectorAll('.we-cls li span').forEach(s => { const got = s.textContent.trim(); if (!want.includes(got)) fails.push({ kind: 'trunc', what: 'cover line is not a whole headline from the edition data', text: got.slice(0, 80), el: 'we-cls span' }) }) }
    /* 4a. NEXT SECTION leaf vs the section that actually follows */
    if (pg.classList.contains('we-pz')) { const lab = (pg.querySelector('.we-pzk') || {}).textContent || '', named = (pg.querySelector('.we-pzs') || {}).textContent || '';
      const nx = pages.slice(pi + 1).find(x => x.classList.contains('we-op')); const real = nx ? pname(nx) : '', no = nx && (nx.querySelector('.we-hd i') || {}).textContent;
      const shown = named.trim(), want = ((no || '') + real).trim();
      if (!nx) fails.push({ kind: 'label', what: 'NEXT SECTION leaf with no section after it', shown });
      else if (shown !== want) fails.push({ kind: 'label', what: 'NEXT SECTION says "' + shown + '" but the next section is "' + want + '"', shown, actual: want });
      if (nx && pages[pi + 1] !== nx) fails.push({ kind: 'label', what: 'NEXT SECTION leaf is not directly before its section (' + pname(pages[pi + 1]) + ' comes between)', shown });
      if (!/next section/i.test(lab)) fails.push({ kind: 'label', what: 'leaf label reads "' + lab + '"', shown }) }
    /* 4b. Contents rows: the section they name, and the page number they claim, against the page they open */
    if (pg.classList.contains('we-toc')) pg.querySelectorAll('button[data-wej]').forEach(b => { const tg = document.getElementById(b.getAttribute('data-wej')); const al = b.getAttribute('aria-label') || '';
      const m = al.match(/^(.*?): .*, page (\d+)$/); if (!tg) return fails.push({ kind: 'label', what: 'Contents row points at a page that does not exist', shown: al });
      const fo = tg.querySelector('.we-fo'), real = fo && fo.getAttribute('data-n');
      if (m && m[1] !== pname(tg)) fails.push({ kind: 'label', what: 'Contents row names "' + m[1] + '" but opens "' + pname(tg) + '"', shown: al });
      if (m && real && m[2] !== real) fails.push({ kind: 'label', what: 'Contents says page ' + m[2] + ' but "' + pname(tg) + '" is printed as page ' + real, shown: al }) });
    /* 4c. inside a story: "Next section . X" / "Next story" at its end must match the story that really follows in the book */
    /* the cover is not a page of the book: it NAMES the lead story, the way a magazine cover does, so its link must be
       left out of the running order. Counting it put the lead at the front and shifted the expectation by one on either
       side of it - 4 false failures on 2026-11-26, when the lead moved to World/3. The story itself is bound exactly
       once, in its own section (measured: page order 0..17, no key twice). */
    pg.querySelectorAll('.we-nu').forEach(u => { const order = [], seenL = new Set(); sc.querySelectorAll('.we-pg:not(.we-sp):not(.we-cp):not(.we-cv) a[data-we]').forEach(a => { const k = a.getAttribute('data-we'); if (!seenL.has(k)) { seenL.add(k); order.push(+k) } });
      const cur = WE.cur, here = cur.findIndex(x => x.link === WE.rd), want = order[order.indexOf(here) + 1], shown = u.querySelector('small').textContent.replace(/\s+/g, ' ').trim(), title = (u.querySelector('b') || {}).textContent;
      if (here < 0 || want == null) return; const nx = cur[want], exp = nx.wsec !== cur[here].wsec ? 'Next section \u00b7 ' + nx.wsec : 'Next story';
      if (shown !== exp || title !== nx.title) fails.push({ kind: 'label', what: 'story ends with "' + shown + ' / ' + title + '" but the next story in the book is "' + exp + ' / ' + nx.title + '"', shown }) });
    out.push(Object.assign(P, { fails }));
  });
  return out;
}


/* ---- issue 53: runs inside the page, after a turn has settled. A ghost is a page that is still painted after the turn: a copy of the old page left over the new one. ---- */
function ghostScan(opts) {
  const host = document.querySelector('.we'), sc = document.querySelector('.we-sc'), f = [];
  if (!host || !sc) return [{ kind: 'ghost', what: 'the edition is not on screen' }];
  /* 1. no copy of any page, in any form, anywhere in the edition (the curl's strips, leaf, under-page and copies) */
  const copies = host.querySelectorAll('.we-tn,.we-cp,.we-lf,.we-un,.we-sl,.we-fc,.tl,.tl-leaf,.we-slide');
  if (copies.length) f.push({ kind: 'ghost', what: copies.length + ' page copies in the DOM after the turn (' + [...new Set([...copies].map(e => String(e.className).split(' ')[0]))].join(', ') + ')' });
  if (opts && opts.mid) return f;
  /* 1b. (issue 54) THE REAL GHOST. Issue 53 removed every page copy and the Fold still showed the old page over the new one, so a copy was never the whole story:
     the edition kept ALL its pages laid out and painted side by side in one scroller, and the Fold's compositor left stale tiles of the pages it had just scrolled past.
     A browser cannot show that stale paint, but it can prove its precondition: at rest, no page other than the one(s) on screen may be painted at all, and the scroller
     must rest exactly on a page (never between two). This FAILS on build 480 (every one of its other pages is visibility:visible) and passes once off-screen pages are not painted. */
  {const R0 = sc.getBoundingClientRect(), painted = [...sc.children].filter(p => { const b = p.getBoundingClientRect(), cs = getComputedStyle(p);
      return (b.right <= R0.left + 2 || b.left >= R0.right - 2) && cs.display !== 'none' && cs.visibility !== 'hidden' && p.textContent.trim().length > 0 });
   if (painted.length) f.push({ kind: 'ghost', what: painted.length + ' pages that are not on screen are still painted (' + painted.slice(0, 3).map(p => (p.getAttribute('aria-label') || p.className).slice(0, 24)).join(', ') + (painted.length > 3 ? ', ...' : '') + ') - the Fold\u2019s compositor leaves these behind as a ghost' });
   const u = sc.clientWidth, off = sc.scrollLeft % u; if (Math.min(off, u - off) > 2 && !(opts && opts.mid)) f.push({ kind: 'ghost', what: 'the pages came to rest between two pages (' + Math.round(off) + ' px into one)' });
   const share = [...sc.children].filter(p => p.querySelectorAll('.we-hd:not(.we-hc)').length > 1 || p.querySelectorAll('.we-op, .we-ld').length > 1 || p.querySelectorAll('.we-ld').length > 1);
   if (share.length) f.push({ kind: 'ghost', what: share.length + ' pages carry more than one section opener' })}
  const sc2 = sc.getBoundingClientRect(), L = Math.max(sc2.left, 0), T = Math.max(sc2.top, 0), R = Math.min(sc2.right, innerWidth), Bt = Math.min(sc2.bottom, innerHeight);
  /* 2. text of two different pages on the same spot */
  const items = [], w = document.createTreeWalker(host, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) {
    const el = n.parentElement, txt = n.nodeValue.replace(/\s+/g, ' ').trim(); if (!txt || el.closest('script,style,.we-fo')) continue;
    let o = 1, hid = false; for (let e = el; e && e !== host; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') { hid = true; break } o *= +cs.opacity } if (hid || o < .15) continue;
    const r = document.createRange(); r.selectNodeContents(n);
    [...r.getClientRects()].forEach(q => { if (q.width < 2 || q.height < 3) return; let l = Math.max(q.left, L), t = Math.max(q.top, T), rr = Math.min(q.right, R), b = Math.min(q.bottom, Bt);
      for (let e = el; e && e !== host; e = e.parentElement) { const cs = getComputedStyle(e); if (/hidden|clip/.test(cs.overflowX + cs.overflowY)) { const c = e.getBoundingClientRect(); l = Math.max(l, c.left); t = Math.max(t, c.top); rr = Math.min(rr, c.right); b = Math.min(b, c.bottom) } }
      if ((rr - l) * (b - t) < q.width * q.height * .5) return; const ih = b - t; items.push({ txt, el, pg: el.closest('.we-pg') || el.closest('.we-tn') || host, r: [l, t + ih * .18, rr, b - ih * .12] }) });
  }
  const seen = new Set();
  for (let a = 0; a < items.length; a++) for (let c = a + 1; c < items.length; c++) { const A = items[a], C = items[c]; if (A.pg === C.pg) continue;
    const ww = Math.min(A.r[2], C.r[2]) - Math.max(A.r[0], C.r[0]), hh = Math.min(A.r[3], C.r[3]) - Math.max(A.r[1], C.r[1]); if (ww < 2 || hh <= 0) continue;
    if (hh < Math.min(A.r[3] - A.r[1], C.r[3] - C.r[1]) * .4) continue;
    const nm = i => '"' + i.txt.slice(0, 40) + '" (' + ((i.pg.getAttribute && i.pg.getAttribute('aria-label')) || String(i.pg.className).split(' ')[0]) + ')', k = nm(A) + nm(C); if (seen.has(k)) continue; seen.add(k);
    f.push({ kind: 'ghost', what: 'text of two different pages on the same spot (a ghost): ' + nm(A) + ' over ' + nm(C), at: [Math.round(Math.max(A.r[0], C.r[0])), Math.round(Math.max(A.r[1], C.r[1]))] }) }
  return f;
}
/* the folio against body text, at every scroll position of every scrolling story page; and the end mark of every story */
function storyScan() {
  const sc = document.querySelector('.we-sc'), sp = [...sc.children].filter(x => x.classList.contains('we-sp')), f = [];
  sp.forEach(pg => { const fo = pg.querySelector('.we-fo'); if (!fo || !pg.classList.contains('we-sx')) return;
    const fs = parseFloat(getComputedStyle(fo).fontSize) || 9, H = pg.scrollHeight - pg.clientHeight;
    for (let y = 0; y <= Math.max(0, H); y += 80) { pg.scrollTop = y; const q = fo.getBoundingClientRect(), fb = { l: q.left, r: q.right, t: q.top, b: q.top + (q.height > fs ? q.height : fs) };
      const w = document.createTreeWalker(pg, NodeFilter.SHOW_TEXT); let n, hit = null;
      while ((n = w.nextNode()) && !hit) { if (!n.nodeValue.trim() || n.parentElement.closest('.we-fo')) continue; const r = document.createRange(); r.selectNodeContents(n);
        for (const c of r.getClientRects()) if (c.width > 2 && c.bottom > fb.t && c.top < fb.b && c.right > fb.l && c.left < fb.r) { hit = n.nodeValue.trim().slice(0, 40); break } }
      if (hit) { f.push({ kind: 'folio', what: 'the page number prints over body text at scroll ' + y + ' px: "' + hit + '"', text: hit }); break } }
    pg.scrollTop = 0 });
  /* A paragraph that runs on across a page break is not a duplicate: the first part ends one page and the
     continuation (.we-ct) opens the next, which is what print does. Two continuations can even carry the same
     words when the stories repeat a sentence, as the stand-in article does, so they are left out of this scan
     entirely. Whole paragraphs printed twice - the fault this is here to catch - are still caught. */
  { const seenT = new Map(); sp.forEach((pg, i) => pg.querySelectorAll('.we-bd p:not(.we-ct)').forEach(q => { const t = q.textContent.replace(/\s+/g, ' ').trim(); if (t.length < 40) return; if (seenT.has(t) && seenT.get(t) !== i) f.push({ kind: 'dup', what: 'the same paragraph is printed on two pages of one story: "' + t.slice(0, 40) + '"', text: t.slice(0, 40) }); else seenT.set(t, i) })) }
  if (sp.length) { const fin = sp[sp.length - 1].querySelector('.we-fin'); if (!fin || !/end of the story/i.test(fin.textContent)) f.push({ kind: 'endmark', what: 'the story does not end with the "End of the story" mark' }); else if (!fin.querySelector('.we-mk')) f.push({ kind: 'endmark', what: 'the end mark has no rule/mark glyph' }) }
  return f;
}

const LEDE = 'The decision landed late in the day, and the people who had pressed for it for years were not in the room to hear it read out. What follows is an account of how it came about, drawn from the documents and from the people who wrote them.';
const STANDIN = '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>A stand-in article for the layout check</title>'
  + '<meta property="og:title" content="A stand-in article for the layout check"></head><body><article><h1>A stand-in article for the layout check</h1>'
  + Array.from({ length: 22 }, (_, i) => '<p>' + LEDE + ' Paragraph ' + (i + 2) + ' carries the same weight of text as the one above it, so a page fills the way a real story fills it.</p>').join('') + '</article></body></html>';
/* the page measures every page, on screen or not; pages that are off screen are not painted any more (issue 54), so they are shown for the measurement only */
const shown = async (page, fn, opts) => { const h = await page.addStyleTag({ content: '.we-sc>.we-pg{visibility:visible!important}' }); const r = await page.evaluate(fn, opts); await h.evaluate(e => e.remove()); return r };
const measure = (page, opts) => shown(page, inPage, opts);
async function open(browser, url, w, h) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: false, hasTouch: false, ignoreHTTPSErrors: true }), page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  /* publishers are unreachable from a cloud runner, so without this only one story in eighteen ever loads and the check measures empty pages.
     A stand-in article answers every off-site page fetch, so the pages carry the type a reader would see. Pictures are left alone. STANDIN=0 turns it off. */
  if (process.env.STANDIN !== '0') await ctx.route(u => !/^(127\.0\.0\.1|localhost)$/.test(u.hostname), (r, q) =>
    /^(document|fetch|xhr)$/.test(q.resourceType()) ? r.fulfill({ contentType: 'text/html', body: STANDIN }) : r.continue().catch(() => {}));
  await page.addInitScript(() => { try { localStorage.setItem('cy_tip_seen', '1') } catch (e) {} });
  await page.goto(url, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(1500);
  await page.click('text=Get started', { timeout: 1500 }).catch(() => {});
  await page.evaluate(() => { document.querySelectorAll('dialog[open]').forEach(d => d.close()); S.sel = 'we'; render() });
  await page.waitForSelector('.we-sc .we-pg', { timeout: 30000 });
  await page.evaluate(() => document.fonts && document.fonts.ready); await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(3500); /* photographs, the cover art and the fit pass settle */
  /* the real article text: the edition fetches each story and prints its teaser / body into the pages (the ready line on Contents).
     Measure only after that, so the check sees the pages as a reader sees them - not the empty skeleton. Stops when all are ready or nothing new arrives for 30 s. */
  const ready = []; let last = '', still = 0;
  for (let t = 0; t < +(process.env.READY_WAIT || 120); t += 5) {
    const r = await page.evaluate(() => { const e = document.querySelector('.we-rdy'); return { t: e ? e.textContent : '', all: !!(e && e.classList.contains('we-all')) } });
    if (r.t !== last) { last = r.t; still = 0; ready.push(t + 's ' + r.t) } else still += 5;
    if (r.all || still >= 30) break; await page.waitForTimeout(5000);
  }
  await page.waitForTimeout(2500);
  await page.addStyleTag({ content: '.we-sc{scroll-behavior:auto!important}' });
  return { ctx, page, errs, ready };
}

/* ---- runs inside the page: a picture the app accepts must be drawn, and visible ---- */
function picScan(opts) {
  const f = [], pages = [...document.querySelector('.we-sc').children];
  const want = a => !!(a && (wePhotoOk(a.wph, 0, a.title) || weArtPass(a.wart, a.wsec)));
  const why = a => { const p = a.wph, t = a.wart; if (WE.lite) return 'the app is in its light mode';
    if (p && !/^https:\/\//.test(p.url || '')) return 'the photo address is not https: ' + String(p.url).slice(0, 60);
    if (p && !String(p.credit || '').trim()) return 'the photo carries no credit';
    if (p && Math.max(+p.w || 0, +p.h || 0) < 600) return 'the photo is too small (' + p.w + 'x' + p.h + ')';
    if (p) return 'the photo is not cleared, or the story names someone it pictures';
    if (t && !/^https:\/\//.test(weArtUrl(t.url) || '')) return 'the drawing address is not https: ' + String(weArtUrl(t.url)).slice(0, 60);
    if (t) return 'drawings are not allowed in the ' + a.wsec + ' section, or this one is too small';
    return 'no reason found' };
  const one = (a, name, page, fig) => { if (!a) return;
    const ttl = String(a.title || '').slice(0, 60), kind = a.wart && !a.wph ? 'drawing' : 'picture';
    if (!want(a)) { if (a.wph || a.wart) f.push({ kind: 'note', pageName: name, page, what: 'the ' + kind + ' was refused by the app: ' + why(a), text: ttl }); return }
    if (!fig) return f.push({ kind: 'nofig', pageName: name, page, what: 'the story has a ' + kind + ' the app accepts and the page draws no figure at all', text: ttl });
    const cs = getComputedStyle(fig), b = fig.getBoundingClientRect(), img = fig.querySelector('img');
    const gone = cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < .05;
    if (gone || b.width < 40 || b.height < 40) f.push({ kind: 'nofig', pageName: name, page, what: 'the figure is in the page but not visible: ' + Math.round(b.width) + 'x' + Math.round(b.height) + (gone ? ', hidden' : ''), text: ttl });
    else if (!img || !img.naturalWidth) f.push({ kind: 'note', pageName: name, page, what: 'the figure is drawn but its ' + kind + ' did not load (no network in the harness, or a dead address)', text: ttl }) };
  /* the story open in the reader: its pages carry no story index, the reader holds it (WE.rd), and the figure
     weRead puts at the head of the body lives on the first of them. */
  if (opts && opts.only === 'we-sp') { const sp = pages.filter(x => x.classList.contains('we-sp'));
    if (!sp.length) return f;
    const a = (WE.cur || []).find(x => x && x.link === WE.rd);
    /* say so out loud rather than check nothing: a pass that cannot find its story is how this check went blind in the first place */
    if (!a) return f.push({ kind: 'note', pageName: 'as the reader opens it', page: pages.indexOf(sp[0]) + 1, what: 'the check could not tell which story the reader has open (' + (WE.rd || 'nothing') + ')' }), f;
    one(a, 'as the reader opens it', pages.indexOf(sp[0]) + 1, sp.map(x => x.querySelector('figure[data-wepl]')).find(Boolean));
    return f }
  /* the section openers: the lead story is the page's own `.we-ld` article */
  pages.filter(x => x.classList.contains('we-op')).forEach(pg => { const lead = pg.querySelector('[data-wel]');
    if (lead) one(WE.cur[+lead.dataset.wel], (pg.getAttribute('aria-label') || '').trim(), pages.indexOf(pg) + 1, pg.querySelector('figure[data-wepl]')) });
  return f;
}

/* defects for SELFTEST, injected as CSS/DOM after the real edition has drawn: the check must name every one */
const INJECT = () => {
  const pgs = [...document.querySelectorAll('.we-sc>.we-pg')];
  const ops = pgs.filter(x => x.classList.contains('we-op'));
  /* a: text on text, as the Nvidia/World/Business collisions were - pull a headline down over the one beneath it */
  const h = ops[0] && ops[0].querySelector('h2,h3,.we-h'); const tgt = ops[0] && [...ops[0].querySelectorAll('p,h3,small,.we-dk,.we-o')].filter(x => x !== h && x.textContent.trim())[0];
  if (h) h.style.cssText += ';position:relative;top:' + (tgt ? Math.round(tgt.getBoundingClientRect().top - h.getBoundingClientRect().top) : 30) + 'px';
  /* b: a wrong NEXT SECTION label */
  /* (the NEXT SECTION leaf this used to break was removed in issue 49; a Contents row that names the wrong section is the same kind of fault) */
  const z = document.querySelector('.we-toc .we-tl button[aria-label]'); if (z) z.setAttribute('aria-label', z.getAttribute('aria-label').replace(/^.*?: /, 'Nowhere in particular: '));
  /* c: a blank page */
  const b = pgs.find(x => x.classList.contains('we-how')); if (b) b.querySelector('.we-in').innerHTML = '';
  /* d: a truncated cover line */
  const c = document.querySelector('.we-cls li span'); if (c) { c.style.cssText += ';display:block;width:6em;overflow:hidden;white-space:nowrap;text-overflow:ellipsis' }
  /* e: a headline broken mid-word */
  const k = ops[1] && ops[1].querySelector('h2,h3'); if (k) k.style.cssText += ';width:2.2em;overflow-wrap:anywhere;hyphens:auto';
  /* f: a picture the app accepted, drawn and then invisible - the shape of every rendering fault of issue 47 */
  const g = document.querySelector('.we-sc>.we-op figure[data-wepl]'); if (g) g.style.cssText += ';visibility:hidden';
};

(async () => {
  let srv = null, base = process.env.URL; if (!base) { srv = await serve(); base = 'https://127.0.0.1:' + srv.address().port + '/index.html' }
  const browser = await chromium.launch();
  const report = { date: new Date().toISOString(), url: base, selftest: SELF, widths: {}, failures: [] };
  for (const name of WANT) {
    const [W, H] = SIZES[name]; const { ctx, page, errs, ready } = await open(browser, base, W, H);
    if (SELF) { await page.evaluate(INJECT); await page.waitForTimeout(400) }
    const two = await page.evaluate(() => document.querySelector('.we').clientWidth >= 600);
    const total = await page.evaluate(() => [...document.querySelector('.we-sc').children].filter(x => !x.classList.contains('we-cp')).length);
    const step = two ? 2 : 1, all = [];
    for (let i = 0; i < total; i += step) {
      await page.evaluate(i => { const sc = document.querySelector('.we-sc'), pw = sc.clientWidth / (sc.clientWidth >= 600 ? 2 : 1); sc.scrollLeft = i * pw }, i);
      await page.waitForTimeout(250);
      await page.screenshot({ path: path.join(OUT, `${name}-${two ? 'spread' : 'page'}-${String(i / step + 1).padStart(2, '0')}.png`) });
    }
    /* a page's rects are measured where the page sits; bring each into view first so the screen clip does not hide it */
    const per = [];
    for (let i = 0; i < total; i += step) {
      await page.evaluate(i => { const sc = document.querySelector('.we-sc'), pw = sc.clientWidth / (sc.clientWidth >= 600 ? 2 : 1); sc.scrollLeft = i * pw }, i); await page.waitForTimeout(150);
      const m = await measure(page, { minChars: 50, ov: .4 });
      for (let k = 0; k < step && i + k < total; k++) per[i + k] = m[i + k];
    }
    /* (issue 47) the pictures on the section openers */
    { const pf = await shown(page, picScan, {}); pf.forEach(f => report.failures.push(Object.assign({ width: `${name} ${W}x${H}` }, f, { shot: `${name}-${two ? 'spread' : 'page'}-${String(Math.floor((f.page - 1) / step) + 1).padStart(2, '0')}.png` }))) }

    /* ---- issue 53: turn through the edition and scan for ghosts after every turn ---- */
    {
      const flush = (label, fs, shot) => fs.forEach(f => report.failures.push(Object.assign({ width: name, page: 0, pageName: label, shot: shot || '' }, f)));
      const where = () => page.evaluate(() => ({ pg: WE.pg | 0, bz: !!WE.bz }));
      const shotOf = async tag => { const fn = `${name}-turn-${tag}.png`; await page.screenshot({ path: path.join(OUT, fn) }); return fn };
      await page.evaluate(() => { const s = document.querySelector('.we-sc'); s.scrollLeft = 0 }); await page.waitForTimeout(400);
      let lastIx = 0, nt = 0;
      const turn = async (dir, label, long) => {
        const before = (await where()).pg, want = Math.max(0, Math.min((total - 1) - ((total - 1) % step), before + dir * step));
        await page.evaluate(d => WE.turn(d), dir);
        if (long) { await page.waitForTimeout(300); flush(label + ' (mid-turn)', await page.evaluate(ghostScan, { mid: true })) } /* the turn must not build any copy of a page, even while it runs */
        await page.waitForTimeout(long ? 800 : 700);
        const at = (await where()).pg, shot = await shotOf(`${String(++nt).padStart(2, '0')}-${label.replace(/\W+/g, '-')}`);
        if (at !== want) report.failures.push({ kind: 'turn', width: name, page: before + 1, pageName: label, what: `a turn ${dir > 0 ? 'forward' : 'back'} from page ${before + 1} landed on page ${at + 1}, expected ${want + 1}`, shot });
        flush(label + ' (1 s)', await page.evaluate(ghostScan), shot);
        if (long) { await page.waitForTimeout(4200); flush(label + ' (5 s)', await page.evaluate(ghostScan), shot) }
        return at;
      };
      const lastPg = (total - 1) - ((total - 1) % step);
      for (let i = 0, k = 0; i < lastPg; i += step, k++) await turn(1, `forward from page ${i + 1}`, k === 0 || i + step >= lastPg);
      for (let i = lastPg, k = 0; i > 0; i -= step, k++) await turn(-1, `back from page ${i + 1}`, k === 0 || i - step <= 0);
      /* a story opened and closed in the middle of the book, then a turn */
      if (!SELF) { await page.evaluate(() => { WE.go(2, 1) }); await page.waitForTimeout(500); await page.evaluate(() => weRead(0, WE.pg | 0)); await page.waitForSelector('.we-sc .we-sp', { timeout: 12000 }).catch(() => {}); await page.waitForTimeout(900);
        await page.evaluate(() => weRdClose()); await page.waitForTimeout(900); await turn(1, 'forward after a story was opened and closed', true) }
      /* three rapid swipes with the pointer, as a thumb does it */
      await page.evaluate(() => { WE.go(0, -1) }); await page.waitForTimeout(500);
      const bx = await page.evaluate(() => { const r = document.querySelector('.we-sc').getBoundingClientRect(); return [r.left, r.top + r.height / 2, r.width] });
      for (let r = 0; r < 3; r++) { await page.mouse.move(bx[0] + bx[2] * .8, bx[1]); await page.mouse.down(); await page.mouse.move(bx[0] + bx[2] * .2, bx[1] + 4, { steps: 6 }); await page.mouse.up(); await page.waitForTimeout(80) }
      await page.waitForTimeout(1100);
      const rap = (await where()).pg, shotR = await shotOf('rapid-3-swipes');
      if (rap < step || rap > 3 * step) report.failures.push({ kind: 'turn', width: name, page: rap + 1, pageName: 'three rapid swipes', what: `three rapid swipes from page 1 landed on page ${rap + 1} (expected page ${step + 1} to ${3 * step + 1})`, shot: shotR });
      flush('three rapid swipes (1 s)', await page.evaluate(ghostScan), shotR);
      await page.waitForTimeout(4200); flush('three rapid swipes (5 s)', await page.evaluate(ghostScan), shotR);
      /* SELFTEST: leave a copy of the old page over the new one, as the Fold's compositor did - the scan has to name it */
      if (SELF) { await page.evaluate(() => { const sc = document.querySelector('.we-sc'), B = sc.getBoundingClientRect(), at = WE.pg | 0, src = sc.children[Math.max(0, at + 1)] || sc.children[0], c = src.cloneNode(true);
          c.removeAttribute('id'); c.setAttribute('aria-hidden', 'true'); c.style.cssText = `position:fixed;left:${B.left}px;top:${B.top}px;width:${B.width / (B.width >= 600 ? 2 : 1)}px;height:${B.height}px;z-index:9;pointer-events:none;flex:none`; document.querySelector('.we').append(c) });
        await page.waitForTimeout(300); flush('SELFTEST ghost left over the new page', await page.evaluate(ghostScan)) }
    }
    /* every story, opened as a reader opens it, from its own cached real text */
    const stories = await page.evaluate(() => WE.cur.map(a => a.title)); report.stories = report.stories || {}; const stNote = [];
    for (let k = 0; k < stories.length; k++) {
      await page.evaluate(k => { weRead(k, WE.pg | 0) }, k);
      const ok = await page.waitForSelector('.we-sc .we-sp', { timeout: 12000 }).then(() => true).catch(() => false);
      if (!ok) { stNote.push(stories[k]); continue }
      await page.waitForTimeout(1300);
      const idx = await page.evaluate(() => [...document.querySelector('.we-sc').children].map((x, i) => x.classList.contains('we-sp') ? i : -1).filter(i => i >= 0));
      const seenS = new Set();
      for (const i of idx) { const at = two ? i - (i % 2) : i; if (seenS.has(at)) continue; seenS.add(at);
        await page.evaluate(at => { const sc = document.querySelector('.we-sc'), pw = sc.clientWidth / (sc.clientWidth >= 600 ? 2 : 1); sc.scrollLeft = at * pw }, at); await page.waitForTimeout(200);
        await page.screenshot({ path: path.join(OUT, `${name}-story-${String(k + 1).padStart(2, '0')}-${seenS.size}.png`) }) }
      const m = await measure(page, { minChars: 30, ov: .4, only: 'we-sp' });
      m.forEach((p, j) => { p.i = idx[j]; p.name = 'story ' + (k + 1) + ': ' + stories[k].slice(0, 40); p.story = k + 1; p.fails.forEach(f => { f.shot = `${name}-story-${String(k + 1).padStart(2, '0')}-1.png` }); per.push(p) });
      /* the same injected defect on the reader's own page, so the self-test proves THAT pass fires too */
      if (SELF) await page.evaluate(() => { const g = document.querySelector('.we-sc>.we-sp figure[data-wepl]'); if (g) g.style.cssText += ';visibility:hidden' });
      { const pf = await shown(page, picScan, { only: 'we-sp' }); pf.forEach(f => report.failures.push(Object.assign({ width: `${name} ${W}x${H}`, shot: `${name}-story-${String(k + 1).padStart(2, '0')}-1.png` }, f, { pageName: 'story ' + (k + 1) + ': ' + f.pageName }))) }
      { const sf = await page.evaluate(storyScan); sf.forEach(f => report.failures.push(Object.assign({ width: name, page: idx[0] + 1, pageName: 'story ' + (k + 1) + ': ' + stories[k].slice(0, 40), shot: `${name}-story-${String(k + 1).padStart(2, '0')}-1.png` }, f))) }
      await page.evaluate(() => weRdClose()); await page.waitForTimeout(700);
    }
    if (stNote.length) report.failures.push({ kind: 'note', width: name, what: stNote.length + ' stor' + (stNote.length > 1 ? 'ies' : 'y') + ' did not open in 12 s (not prepared yet, or no network): ' + stNote.join(' | ').slice(0, 200), page: 0, pageName: '', shot: '' });
    const seen = new Set(); for (const p of per) { p.fails = p.fails.filter(f => { const k = [f.kind, f.what, f.text, f.a, f.b, f.shown].join('|'); if (seen.has(p.i + k)) return false; seen.add(p.i + k); return true }); p.width = name; p.shot = p.story ? p.fails[0] && p.fails[0].shot : `${name}-${two ? 'spread' : 'page'}-${String(Math.floor(p.i / step) + 1).padStart(2, '0')}.png`; for (const f of p.fails) report.failures.push(Object.assign({ width: `${name} ${W}x${H}`, page: p.i + 1, pageName: p.name }, f, { shot: f.shot || p.shot })) }
    if (errs.length) report.failures.push({ kind: 'error', width: name, what: 'page error: ' + errs[0] });
    report.widths[name] = { ready, size: [W, H], spread: two, pages: total, perPage: per.map(p => ({ i: p.i + 1, name: p.name, chars: p.chars, mediaPct: p.mediaPct, fails: p.fails.length })) };
    await ctx.close();
  }
  await browser.close(); if (srv) srv.close();
  const by = {}; report.failures.forEach(f => { by[f.kind] = (by[f.kind] || 0) + 1 }); report.summary = by;
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 1));
  const md = ['# World Edition layout check', '', `${SELF ? '**SELF-TEST** (defects injected on purpose). ' : ''}${report.failures.some(f => f.kind !== 'note') ? 'FAIL' : 'PASS'}: ${report.failures.filter(f => f.kind !== 'note').length} problem(s) ${JSON.stringify(by)}`, ''];
  for (const f of report.failures) md.push(`- **${f.kind}** · ${f.width} · page ${f.page} (${f.pageName}) · ${f.what || ''} ${f.a ? `"${f.a}" over "${f.b}" at ${JSON.stringify(f.at)}` : ''} ${f.text ? `→ "${f.text}"` : ''} [${f.shot}]`);
  for (const [n, v] of Object.entries(report.widths)) md.push('', `${n} ${v.size.join('x')}: ${v.pages} pages` + (v.spread ? ' (two per spread)' : '') + ` · ready line: ${v.ready.slice(-1)[0] || 'none'}`);
  fs.writeFileSync(path.join(OUT, 'report.md'), md.join('\n') + '\n'); console.log(md.join('\n'));
  if (SELF) { const need = ['overlap', 'blank', 'trunc', 'label', 'ghost', 'nofig']; const miss = need.filter(k => !by[k]); console.log(miss.length ? 'SELFTEST FAILED: never fired: ' + miss.join(', ') : 'SELFTEST ok: every detector fired'); process.exit(miss.length ? 1 : 0) }
  process.exit(report.failures.some(f => f.kind !== 'note') ? 1 : 0);
})().catch(e => { console.error('FAIL layout check: ' + (e && e.stack || e)); process.exit(2) });
