/* Getting around the magazine on a wide screen, and across a fold.
 *
 * 1.413 made the cover two pages and the contents two pages on a screen 600px wide or more. Three things still
 * assumed the old layout (found in the review of 2026-11-27, the first reproduced before it was fixed):
 *   - every "Contents" button asked for page index 1, which the pager rounds down to the cover;
 *   - folding or unfolding rebuilt the pages but kept the page NUMBER, and the wide layout has two more pages
 *     at the front, so the reader landed two pages from where they were;
 *   - closing a story gave focus to the whole scroller, not to the headline it was opened from.
 *
 *   node tests/we_fold_nav.js
 */
const { openApp } = require('../scripts/edition/app');
const BODY = '<p>' + Array.from({ length: 16 }, (_, i) => 'The decision landed late in the day, and the people who had pressed for it for years were not in the room to hear it. Paragraph ' + (i + 1) + '.').join('</p><p>') + '</p>';
(async () => {
  const app = await openApp({ viewport: { width: 884, height: 1104 }, wake: false });
  const p = app.page; let fails = 0;
  const bad = m => { fails++; console.log('FAIL ' + m) }, ok = m => console.log('ok   ' + m);
  const lab = () => p.evaluate(() => { const sc = document.querySelector('.we-sc'); return (sc.children[WE.pg | 0] || {}).getAttribute ? sc.children[WE.pg | 0].getAttribute('aria-label') : '' });
  try {
    await p.waitForTimeout(1200);
    await p.click('text=Get started', { timeout: 1500 }).catch(() => {});
    await p.evaluate(() => { document.querySelectorAll('dialog[open]').forEach(d => d.close()); S.sel = 'we'; render() });
    await p.waitForSelector('.we-sc .we-pg', { timeout: 30000 }); await p.waitForTimeout(2000);

    /* 1. a Contents button, pressed from a section, lands on the contents */
    await p.evaluate(() => { const sc = document.querySelector('.we-sc'); WE.go([...sc.children].findIndex(x => x.id === 'we-s1'), 1) });
    await p.waitForTimeout(900);
    await p.evaluate(() => document.querySelector('#we-s1 [data-wec]').click()); await p.waitForTimeout(900);
    const a = await lab(); if (a !== 'Contents') bad('the Contents button landed on "' + a + '"'); else ok('the Contents button lands on the contents on a wide screen');

    /* 2. fold shut on a section, then open again: the reader stays on that section */
    await p.evaluate(() => { const sc = document.querySelector('.we-sc'); WE.go([...sc.children].findIndex(x => x.id === 'we-s1'), 1) });
    await p.waitForTimeout(900); const wide = await lab();
    await p.setViewportSize({ width: 412, height: 915 }); await p.waitForTimeout(2500); const narrow = await lab();
    await p.setViewportSize({ width: 884, height: 1104 }); await p.waitForTimeout(2500); const again = await lab();
    if (narrow !== wide) bad('folding moved the reader from "' + wide + '" to "' + narrow + '"'); else ok('folding keeps the reader on "' + wide + '"');
    if (again !== wide) bad('unfolding moved the reader from "' + wide + '" to "' + again + '"'); else ok('unfolding keeps the reader on "' + wide + '"');

    /* 3. a story opened from a headline gives focus back to that headline when it closes */
    const f = await p.evaluate(B => new Promise(res => { const sc = document.querySelector('.we-sc'); const from = [...sc.children].findIndex(x => x.id === 'we-s0');
      WE.go(from, 1); setTimeout(() => { const link = sc.children[from].querySelector('a[data-we]'); link.focus(); acPut(WE.cur[0].link, B); weRead(0, from);
        setTimeout(() => { weRdClose(); setTimeout(() => res({ same: document.activeElement === link, tag: document.activeElement && document.activeElement.tagName }), 400) }, 1500) }, 700) }), BODY);
    if (!f.same) bad('closing a story left focus on ' + f.tag + ', not on the headline it was opened from'); else ok('closing a story returns focus to its headline');
  } catch (e) { bad('we_fold_nav threw: ' + (e && e.message || e)) }
  await app.close();
  console.log(fails ? fails + ' FAIL(s)' : 'we_fold_nav: the wide layout is navigable');
  process.exit(fails ? 1 : 0);
})();
