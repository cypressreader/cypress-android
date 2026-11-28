/* A reader in the middle of a story is never thrown out of it.
 *
 * David's friend, 2026-11-28, on a phone: "she was on a story and suddenly it kicked her back to the cover."
 * The cause: the story's pages are pages of the book. With a story open, another story fails to load in the
 * background and is dropped; that changes the book, and the next redraw of the screen for any reason rebuilt
 * every page - the open story among them. 1.418 landed her on the cover. 1.419 kept the place for the book's
 * own pages and still threw the story away, which is why this guard exists: that fix was tested on a section
 * page and never with a story open.
 *
 *   node tests/we_story_kick.js
 */
const { openApp } = require('../scripts/edition/app');
const BODY = '<p>' + Array.from({ length: 14 }, (_, i) => 'The decision landed late in the day, and the people who had pressed for it for years were not in the room to hear it. Paragraph ' + (i + 1) + '.').join('</p><p>') + '</p>';
(async () => {
  let fails = 0; const bad = m => { fails++; console.log('FAIL ' + m) }, ok = m => console.log('ok   ' + m);
  for (const w of [{ name: 'phone', width: 412, height: 915 }, { name: 'fold', width: 884, height: 1104 }]) {
    const app = await openApp({ viewport: { width: w.width, height: w.height }, wake: false }); const p = app.page;
    try {
      await p.waitForTimeout(1200); await p.click('text=Get started', { timeout: 1500 }).catch(() => {});
      await p.evaluate(() => { document.querySelectorAll('dialog[open]').forEach(d => d.close()); S.sel = 'we'; render() });
      await p.waitForSelector('.we-sc .we-pg', { timeout: 30000 }); await p.waitForTimeout(3000);
      const st = () => p.evaluate(() => { const sc = document.querySelector('.we-sc'), pg = sc.children[WE.pg | 0]; return { open: WE.sp != null, pages: document.querySelectorAll('.we-sp').length, on: (pg && pg.getAttribute('aria-label') || ''), n: sc.children.length } });
      const sec = await p.evaluate(B => { const sc = document.querySelector('.we-sc'), from = [...sc.children].findIndex(x => x.id === 'we-s4'), link = sc.children[from].querySelector('a[data-we]'), i = +link.dataset.we; WE.go(from, 1); acPut(WE.cur[i].link, B); weRead(i, from); return sc.children[from].getAttribute('aria-label') }, BODY);
      await p.waitForTimeout(2500);
      const a = await st();
      if (!a.open || !a.pages) { bad(w.name + ': the story did not open, so nothing was tested'); await app.close(); continue }
      /* a story elsewhere in the issue fails to load and is dropped, then the screen is redrawn */
      const gone = await p.evaluate(() => { const l = WE.cur[WE.cur.length - 1].link; WE.gone = WE.gone || new Set(); WE.gone.add(l); render(); return l });
      await p.waitForTimeout(2500);
      const b = await st();
      if (!b.pages) bad(w.name + ': a redraw threw the reader out of the story and onto "' + b.on + '"');
      else if (b.on !== a.on) bad(w.name + ': a redraw moved the reader from "' + a.on + '" to "' + b.on + '"');
      else ok(w.name + ': the story stays open through a redraw');
      /* and the rebuild that was put off happens once the story is closed, leaving the reader in the same section */
      await p.evaluate(() => weRdClose()); await p.waitForTimeout(2500);
      const c = await st();
      /* by the story itself, not by a page count: a dropped "Also in" line takes no page with it */
      /* "still there" only counts while the app still holds it as dropped. A story that loads on its second
         chance is rightly put back (tests/we_dropped.js); on a clean issue that happens here, and this guard
         failed on 28 November for exactly that reason, not for a fault. What must be true is that the
         postponed rebuild RAN: nothing is left waiting, and the book agrees with the dropped list. */
      const still = await p.evaluate(l => WE.redo || ((WE.gone || new Set()).has(l) && [...document.querySelectorAll('.we-sc a[data-we]')].some(x => x.getAttribute('href') === l)), gone);
      if (c.open || c.pages) bad(w.name + ': the story did not close');
      else if (still) bad(w.name + ': the dropped story is still in the book after the story was closed');
      else if (c.on.indexOf(sec) !== 0) bad(w.name + ': closing the story left the reader on "' + c.on + '", not in ' + sec);
      else ok(w.name + ': the postponed rebuild runs when the story closes, and the reader is still in ' + sec);
    } catch (e) { bad(w.name + ': we_story_kick threw: ' + (e && e.message || e)) }
    await app.close();
  }
  console.log(fails ? '\n' + fails + ' FAIL' + (fails > 1 ? 'S' : '') : '\nall ok'); process.exit(fails ? 1 : 0);
})();
