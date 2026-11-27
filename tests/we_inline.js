/* A long read carries the publisher's own pictures, and only the cleared ones.
 *
 * David, 2026-11-27: "none of the stories we ran had more than one picture in the article itself." They were
 * all being thrown away: the reader rebuilds a story's pages from its TEXT (paragraphs and subheadings), so
 * every picture in the body was discarded and a story showed only the photograph chosen for its opener.
 *
 * What this holds:
 *   1. a cleared picture is put back where the publisher had it;
 *   2. a picture missing any of the six clearance marks is refused, exactly as on an opener - a picture inside
 *      a story is no less printed than one on the front of it;
 *   3. a picture never overflows the page it is on. Its height comes from the file (`w`/`h` -> aspect-ratio)
 *      because the page is paginated BEFORE the image has loaded; a figure of unknown height is measured as
 *      nothing and the page bursts when the picture finally arrives. This is the case that matters on the Fold,
 *      where a story really is paginated.
 *
 *   node tests/we_inline.js          Env: VW/VH (default the Fold, 884x1104, because that is where it paginates)
 */
const { openApp } = require('../scripts/edition/app');

const BODY = 'The decision landed late in the day, and the people who had pressed for it for years were not in the '
  + 'room to hear it read out. What follows is an account of how it came about, drawn from the documents.';
const PAGE = '<!doctype html><html><head><meta charset="utf-8"><title>Stand-in</title></head><body><article><h1>Stand-in</h1>'
  + Array.from({ length: 26 }, (_, i) => '<p>' + BODY + ' Paragraph ' + (i + 2) + '.</p>').join('') + '</article></body></html>';
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const CLEAR = ['logo', 'text', 'child', 'body', 'grief', 'mugshot'];

(async () => {
  const app = await openApp({ viewport: { width: +(process.env.VW || 884), height: +(process.env.VH || 1104) } });
  const p = app.page; let fails = 0;
  const bad = m => { fails++; console.log('FAIL ' + m) };
  try {
    await app.ctx.route(u => !/^(127\.0\.0\.1|localhost)$/.test(u.hostname), (r, q) => {
      if (q.resourceType() === 'image') return r.fulfill({ contentType: 'image/png', body: PNG }).catch(() => {});
      if (!/^(document|fetch|xhr)$/.test(q.resourceType())) return r.continue().catch(() => {});
      return r.fulfill({ contentType: 'text/html', body: PAGE }).catch(() => {});
    });
    await p.waitForTimeout(1200);
    await p.click('text=Get started', { timeout: 1500 }).catch(() => {});
    await p.evaluate(() => { document.querySelectorAll('dialog[open]').forEach(d => d.close()); S.sel = 'we'; render() });
    await p.waitForSelector('.we-sc .we-pg', { timeout: 30000 }); await p.waitForTimeout(2500);

    const put = await p.evaluate(CL => { const e = weEd(WE.d);
      const sec = e.sections.find(s => s.name === 'Long read'); if (!sec) return 'no Long read section in this edition';
      sec.stories[0].inline = [
        { url: 'https://example.com/a.jpg', w: 1600, h: 1000, credit: 'Example Press', clear: CL, after: 3 },
        { url: 'https://example.com/b.jpg', w: 1400, h: 1050, credit: 'Example Press', clear: CL, after: 9 },
        /* no 'grief' mark: this one must never reach the page */
        { url: 'https://example.com/no.jpg', w: 1600, h: 1000, credit: 'Example Press', clear: CL.filter(c => c !== 'grief'), after: 14 },
        /* no credit: same */
        { url: 'https://example.com/nc.jpg', w: 1600, h: 1000, credit: '', clear: CL, after: 18 }];
      WE.sig = ''; render(); return '' }, CLEAR);
    if (put) { bad(put); throw new Error(put) }
    await p.waitForTimeout(2500);

    const k = await p.evaluate(() => WE.cur.findIndex(a => a.wsec === 'Long read'));
    await p.evaluate(k => weRead(k, WE.pg | 0), k);
    await p.waitForSelector('.we-sc .we-sp', { timeout: 15000 }).catch(() => {});
    await p.waitForTimeout(2000);

    const r = await p.evaluate(() => { const sp = [...document.querySelectorAll('.we-sc .we-sp')];
      return { pages: sp.length, figs: [...document.querySelectorAll('.we-sp .we-inl img')].map(i => i.getAttribute('src')),
        over: sp.map(x => { const i = x.querySelector('.we-in'); return i ? Math.max(0, i.scrollHeight - i.clientHeight) : 0 }) } });

    if (r.figs.length !== 2) bad('expected the 2 cleared pictures on the page, got ' + r.figs.length + ': ' + r.figs.join(' '));
    else console.log('ok   the cleared pictures are put back in the story');
    if (r.figs.some(u => /no\.jpg|nc\.jpg/.test(u))) bad('a picture without its clearance marks or its credit reached the page: ' + r.figs.join(' '));
    else console.log('ok   a picture missing a clearance mark or a credit is refused');
    const burst = r.over.filter(n => n > 1);
    if (burst.length) bad('a page overflowed with a picture on it: ' + r.over.join(', ') + ' px over');
    else console.log('ok   no page overflows (' + r.pages + ' pages)');
  } catch (e) { if (!fails) bad('we_inline threw: ' + (e && e.message || e)) }
  await app.close();
  console.log(fails ? fails + ' FAIL(s)' : 'we_inline: a long read carries its own pictures, and only the cleared ones');
  process.exit(fails ? 1 : 0);
})();
