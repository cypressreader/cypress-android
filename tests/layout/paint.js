/* World Edition paint check (issue 54, item 2: the ghost in 480).
   WHY THIS EXISTS. In 480 every page but three paints NO background of its own: the paper you see is one
   background on `.we`, behind a strip 18 pages (7,956 px, ~20,700 device px) wide that the WebView has to
   rasterise in tiles. A page with no paper of its own cannot hide what is behind it, so anything the
   compositor still holds there - a tile raster of a DIFFERENT page - reads straight through the new page as
   text over text. That is the ghost David filmed on the Fold, and no page copy is involved, which is why the
   copy scan in check.js reports 0 problems on 480.
   HOW IT IS CAUGHT WITHOUT A PIXEL LIBRARY. Each spread is screenshotted twice, once with `.we`'s background
   forced magenta and once cyan. A page that paints its own paper hides the change: the two shots are
   byte-identical. A transparent page lets it through and the bytes differ - the page is see-through, and a
   stale tile can show through it exactly the same way.
   It also runs the screen-level cross-page scan the copy scan cannot do: text belonging to a page OUTSIDE the
   spread on screen, painting inside the viewport (a real ghost sighting, which only a device compositor
   produces - it passes here on any build and is there for the device run).
   Run: node tests/layout/paint.js    Env: OUT=dir (default paint-out)  URL=<app url>  WIDTHS=phone,fold
        SELFTEST=1 makes one page see-through on purpose and requires the detector to fire.
   Exit 1 on any failure. */
const fs = require('fs'), path = require('path'), http = require('http');
const PW = require('child_process').execSync('npm root -g').toString().trim() + '/playwright';
const { chromium } = require(PW);
const ROOT = path.resolve(__dirname, '../../www'), OUT = path.resolve(process.env.OUT || 'paint-out');
const SIZES = { phone: [412, 915], fold: [884, 1104] };
const WANT = (process.env.WIDTHS || 'phone,fold').split(',');
const SELF = !!process.env.SELFTEST;
fs.mkdirSync(OUT, { recursive: true });

const MIME = { '.html': 'text/html', '.json': 'application/json', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const serve = () => new Promise(res => { const s = http.createServer((q, r) => { let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html';
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { r.writeHead(404); return r.end() } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r) });
  s.listen(0, '127.0.0.1', () => res(s)) });

/* a stand-in article for every publisher URL: the cloud cannot reach them, and an empty edition proves nothing */
const STANDIN = '<html><head><title>Stand-in</title></head><body><article><h1>Stand-in article</h1>' +
  '<p>' + 'The decision landed late in the day, and the people who had been waiting for it said very little at first. '.repeat(70) + '</p></article></body></html>';

/* every text line on screen must belong to a page in the spread on screen */
function strayScan() {
  const sc = document.querySelector('.we-sc'), pw = sc.clientWidth / (sc.clientWidth >= 600 ? 2 : 1);
  const at = Math.round(sc.scrollLeft / pw), two = sc.clientWidth >= 600;
  const mine = new Set([at, two ? at + 1 : at]);
  const pages = [...sc.children];
  const out = [];
  pages.forEach((pg, i) => {
    if (mine.has(i)) return;
    const w = document.createTreeWalker(pg, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) {
      const el = n.parentElement, txt = n.nodeValue.replace(/\s+/g, ' ').trim();
      if (!txt || el.closest('script,style,option,select')) continue;
      const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < .15) continue;
      const r = document.createRange(); r.selectNodeContents(n);
      for (const q of r.getClientRects()) {
        if (q.width < 2 || q.height < 3) continue;
        if (q.right <= 0 || q.left >= innerWidth || q.bottom <= 0 || q.top >= innerHeight) continue;
        out.push({ kind: 'stray', what: `text of page ${i + 1} paints inside the spread showing pages ${[...mine].map(x => x + 1).join('-')}`, text: txt.slice(0, 60), at: [Math.round(q.left), Math.round(q.top)] });
        return;
      }
    }
  });
  return out;
}

(async () => {
  let srv = null, base = process.env.URL; if (!base) { srv = await serve(); base = 'http://127.0.0.1:' + srv.address().port + '/index.html' }
  const browser = await chromium.launch();
  const report = { date: new Date().toISOString(), url: base, selftest: SELF, widths: {}, failures: [] };
  for (const name of WANT) {
    const [W, H] = SIZES[name];
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.route('**/*', r => r.request().url().includes('127.0.0.1') ? r.continue() : r.fulfill({ status: 200, contentType: 'text/html', body: STANDIN }));
    await page.goto(base);
    await page.evaluate(() => { S.sel = 'we'; render() }).catch(() => {});
    await page.waitForSelector('.we-sc', { timeout: 30000 });
    await page.waitForFunction(() => /ready to read/.test(document.querySelector('.we-rdy')?.textContent || ''), null, { timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(2500);
    if (SELF) await page.evaluate(() => { const p = [...document.querySelector('.we-sc').children].find(x => x.classList.contains('we-toc')); if (p) p.style.background = 'transparent' });
    const two = await page.evaluate(() => document.querySelector('.we-sc').clientWidth >= 600);
    const total = await page.evaluate(() => [...document.querySelector('.we-sc').children].length);
    const step = two ? 2 : 1;
    const tint = c => page.evaluate(c => { const w = document.querySelector('.we'); w.dataset.paintWas = w.dataset.paintWas || getComputedStyle(w).backgroundColor; w.style.background = c }, c);
    const clip = await page.evaluate(() => { const r = document.querySelector('.we-sc').getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) } });
    for (let i = 0; i < total; i += step) {
      await page.evaluate(i => { const sc = document.querySelector('.we-sc'), pw = sc.clientWidth / (sc.clientWidth >= 600 ? 2 : 1); sc.scrollLeft = i * pw }, i);
      await page.waitForTimeout(220);
      const label = `page${two ? 's' : ''} ${i + 1}${two && i + 1 < total ? '-' + (i + 2) : ''}`;
      report.failures.push(...(await page.evaluate(strayScan)).map(f => Object.assign(f, { width: name, pageName: label })));
      await tint('#ff00ff'); await page.waitForTimeout(120); const a = await page.screenshot({ clip });
      await tint('#00ffff'); await page.waitForTimeout(120); const b = await page.screenshot({ clip });
      await page.evaluate(() => { const w = document.querySelector('.we'); w.style.background = '' });
      if (!a.equals(b)) {
        const shot = `${name}-seethrough-${String(i / step + 1).padStart(2, '0')}.png`;
        fs.writeFileSync(path.join(OUT, shot), a);
        const who = await page.evaluate(i => { const sc = document.querySelector('.we-sc'), two = sc.clientWidth >= 600; const op = s => { const m = /rgba?\(([^)]+)\)/.exec(s); if (!m) return false; const p = m[1].split(',').map(Number); return p.length < 4 || p[3] >= 1 };
          return [i, two ? i + 1 : i].filter((x, k, l) => l.indexOf(x) === k).filter(x => sc.children[x]).filter(x => !op(getComputedStyle(sc.children[x]).backgroundColor)).map(x => (sc.children[x].getAttribute('aria-label') || sc.children[x].className) + ' (page ' + (x + 1) + ')') }, i);
        report.failures.push({ kind: 'seethrough', width: name, pageName: label, shot,
          what: `what is behind the page shows through it, so a stale tile of another page can too${who.length ? ': ' + who.join(', ') : ''}` });
      }
    }
    report.widths[name] = { size: [W, H], spread: two, pages: total };
    await ctx.close();
  }
  await browser.close(); if (srv) srv.close();
  const by = {}; report.failures.forEach(f => { by[f.kind] = (by[f.kind] || 0) + 1 }); report.summary = by;
  const bad = report.failures.length;
  const md = ['# World Edition paint check', '', `${SELF ? '**SELF-TEST** (a page made see-through on purpose). ' : ''}${bad ? 'FAIL' : 'PASS'}: ${bad} problem(s) ${JSON.stringify(by)}`, ''];
  for (const f of report.failures) md.push(`- **${f.kind}** · ${f.width} · ${f.pageName} · ${f.what || ''}${f.text ? ` → "${f.text}"` : ''} [${f.shot || ''}]`);
  for (const [n, v] of Object.entries(report.widths)) md.push('', `${n} ${v.size.join('x')}: ${v.pages} pages${v.spread ? ' (two per spread)' : ''}`);
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 1));
  fs.writeFileSync(path.join(OUT, 'report.md'), md.join('\n') + '\n');
  console.log(md.join('\n'));
  if (SELF) { console.log(by.seethrough ? 'SELFTEST ok: the see-through detector fired' : 'SELFTEST FAILED: the see-through detector never fired'); process.exit(by.seethrough ? 0 : 1) }
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error('FAIL paint check: ' + (e && e.stack || e)); process.exit(2) });
