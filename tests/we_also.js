/* "Also in Tech": a section's leftover headlines at the foot of its opener, not each on a page of its own.
 *
 * Before this, a section with one or two stories after its lead gave each of them a whole page holding a
 * headline, an outlet and nothing between - six of the 26 pages of issue No. 3. The rule now lives in one
 * place, weSplit(), because the contents' PAGE NUMBERS and the pages themselves both read it: when that
 * rule lived in two places they disagreed and every number past the first short section was wrong.
 *
 * What this guards, at both widths:
 *   1. a section with 1-2 leftovers has NO continued page, and its opener prints every one of them, linked
 *   2. a section with 3+ leftovers still keeps its continued page
 *   3. every contents row's printed page number IS the page its section opener sits on
 *   4. no story is dropped: every leftover is still reachable from somewhere
 *
 *   node tests/we_also.js
 */
const { openApp } = require('../scripts/edition/app');
const WIDTHS = [{ name: 'phone', width: 412, height: 915 }, { name: 'fold', width: 884, height: 1104 }];
(async () => {
  let fails = 0;
  const bad = m => { fails++; console.log('FAIL ' + m) }, ok = m => console.log('ok   ' + m);
  for (const w of WIDTHS) {
    const app = await openApp({ viewport: { width: w.width, height: w.height }, wake: false });
    const p = app.page;
    try {
      await p.waitForTimeout(1200);
      await p.click('text=Get started', { timeout: 1500 }).catch(() => {});
      await p.evaluate(() => { document.querySelectorAll('dialog[open]').forEach(d => d.close()); S.sel = 'we'; render() });
      await p.waitForSelector('.we-sc .we-pg', { timeout: 30000 }); await p.waitForTimeout(2500);

      const r = await p.evaluate(() => {
        const sc = document.querySelector('.we-sc'), pages = [...sc.children];
        const lab = x => x.getAttribute('aria-label') || '';
        const secs = pages.map((x, i) => ({ i, id: x.id })).filter(x => /^we-s\d+$/.test(x.id));
        const rows = [...document.querySelectorAll('.we-toc .we-tl li button')].map(b => ({
          to: b.dataset.wej, num: +(b.querySelector('i:not(.we-tmin)') || {}).textContent
        }));
        return {
          secs: secs.map(s => {
            const pg = pages[s.i], next = pages[s.i + 1];
            const als = pg.querySelector('.we-als');
            return {
              id: s.id, idx: s.i, name: lab(pg),
              als: als ? [...als.querySelectorAll('li')].map(li => ({
                link: !!li.querySelector('a[data-we]'),
                /* must NOT carry data-wel: wePQ fills anything with that attribute with body paragraphs,
                   and these entries are headlines in a list, not openers with a page to fill */
                wel: li.hasAttribute('data-wel')
              })) : null,
              cont: !!(next && /, continued$/.test(lab(next)) && lab(next).indexOf(lab(pg)) === 0)
            }
          }),
          rows, total: pages.length
        }
      });

      /* the edition's own shape, read straight off the file the app rendered */
      const shape = await p.evaluate(() => {
        const e = (WE.d.editions || []).find(x => x.id === (WE.ed || (WE.d.editions[0] || {}).id)) || WE.d.editions[0];
        return (e.sections || []).filter(s => (s.stories || []).length).map(s => ({
          name: s.name, left: s.stories.length - 1,
          big: !!(wePhotoOk(s.stories[0].photo, false, s.stories[0].t) && weBigPic(s.stories[0].photo))
        }))
      });

      let merged = 0, kept = 0;
      shape.forEach((s, k) => {
        const got = r.secs[k]; if (!got) { bad(w.name + ': no opener rendered for ' + s.name); return }
        /* THE TWO WIDTHS WANT DIFFERENT THINGS, AND THAT IS THE DESIGN (David, 2026-11-28).
           On the PHONE one page is one screen, so one or two leftover headlines go to the foot of the
           opener and the page they used to have is saved.
           On the FOLD two pages are always on screen together, and a section must take an EVEN number of
           pages for every section to start on a left-hand page - so the leftovers stay on the facing page,
           and a section with no leftovers at all spreads its opener over the two. */
        const fold = w.name === 'fold';
        const shouldSplit = fold ? s.left > 0 : (s.left > 2 || (s.left > 0 && s.big));
        const shouldSpread = fold && s.left === 0;
        if (shouldSplit) {
          kept++;
          if (!got.cont) bad(w.name + ': ' + s.name + ' has ' + s.left + ' leftover stories and lost its continued page');
          if (got.als) bad(w.name + ': ' + s.name + ' keeps a continued page AND prints "Also in" on its opener');
        } else if (s.left > 0) {
          merged++;
          if (got.cont) bad(w.name + ': ' + s.name + ' still spends a page on ' + s.left + ' leftover stor' + (s.left > 1 ? 'ies' : 'y'));
          if (!got.als) bad(w.name + ': ' + s.name + ' dropped its ' + s.left + ' leftover stories entirely');
          else if (got.als.length !== s.left) bad(w.name + ': ' + s.name + ' prints ' + got.als.length + ' of its ' + s.left + ' leftover stories');
          else if (got.als.some(x => !x.link)) bad(w.name + ': ' + s.name + ' prints a leftover headline that cannot be opened');
          else if (got.als.some(x => x.wel)) bad(w.name + ': ' + s.name + " has an 'Also in' entry carrying data-wel - wePQ will pour body text into it");
        } else if (shouldSpread) {
          if (!got.cont) bad(w.name + ': ' + s.name + ' has one story and did not spread its opener, so every section after it starts on the wrong page');
        } else if (got.als) bad(w.name + ': ' + s.name + ' prints "Also in" with nothing to put in it');
      });
      if (merged) ok(w.name + ': ' + merged + ' sections print their leftovers on the opener (' + merged + ' pages saved)');
      if (kept) ok(w.name + ': ' + kept + ' sections still keep a page of their own');

      /* 3. the contents' numbers against the pages they point at - the thing weSplit exists to keep true */
      let wrong = 0;
      r.rows.forEach(row => {
        const s = r.secs.find(x => x.id === row.to);
        if (!s) { wrong++; bad(w.name + ': a contents row points at ' + row.to + ', which is not a page'); return }
        if (row.num !== s.idx + 1) { wrong++; bad(w.name + ': contents prints page ' + row.num + ' for ' + s.name + ', which is page ' + (s.idx + 1)) }
      });
      if (!wrong && r.rows.length) ok(w.name + ': all ' + r.rows.length + ' contents numbers match the page they point to');
      if (w.name === 'fold') {
        const right = r.secs.filter(x => x.idx % 2);
        if (right.length) bad('fold: ' + right.length + ' section(s) start on a right-hand page: ' + right.map(x => x.name).join(', '));
        else ok('fold: all ' + r.secs.length + ' sections start on a left-hand page');
      }
      if (!r.rows.length) bad(w.name + ': the contents printed no rows at all');
    } catch (e) { bad(w.name + ': we_also threw: ' + (e && e.message || e)) }
    await app.close();
  }
  console.log(fails ? '\n' + fails + ' FAIL' + (fails > 1 ? 'S' : '') : '\nall ok');
  process.exit(fails ? 1 : 0);
})();
