/* A story the edition could not prepare comes back on the next pass.
 *
 * David, 2026-11-27, minutes after installing 1.407: "I got a new edition but it's much smaller in terms of
 * story count."
 *
 * THE FAULT: the edition drops a story it could not prepare, so a headline never bounces the reader out to
 * the publisher's website (weSettle). That part is right. What was wrong is that the drop was final: WE.try
 * had already reached its three goes, so no later pass ever tried that story again, and WE.gone was only
 * cleared by closing the app. The worst moment for it is the minute after an install - the cache is empty, all
 * eighteen stories are fetched in one burst, and whatever fails in that burst is gone for the session.
 *
 * THE FIX: a pass only happens when the reader refreshes or re-opens the magazine, which is deliberate and
 * exactly when they want the issue whole. So every pass starts the dropped ones from zero; if they fail
 * again they are dropped again.
 *
 *   node tests/we_dropped.js
 */
const path = require('path');
const { openApp } = require('../scripts/edition/app');

/* enough text that acStoreOk keeps it: the gate wants a real article, not a stub */
const BODY = 'The decision landed late in the day, and the people who had pressed for it for years were not in '
  + 'the room to hear it read out. What follows is an account of how it came about, drawn from the documents.';
const PAGE = '<!doctype html><html><head><meta charset="utf-8"><title>A stand-in article</title></head><body><article>'
  + '<h1>A stand-in article</h1>' + Array.from({ length: 14 }, (_, i) => '<p>' + BODY + ' Paragraph ' + (i + 2) + '.</p>').join('')
  + '</article></body></html>';

/* One publisher in three refuses, named up front from the edition itself. It has to be matched against the
   WHOLE address rather than the hostname, because when a publisher refuses the app tries again through its
   relays, and a relay carries the target inside its own URL - the first cut of this test aborted by hostname
   and the app simply routed around it, so nothing was ever dropped and the test proved nothing. */
const ED = require('../www/world-edition.json');
const HOSTS = [...new Set((ED.editions || [ED]).flatMap(e => e.sections.flatMap(s => s.stories.map(t => {
  try { return new URL(t.l).hostname.replace(/^www\./, '') } catch (e) { return '' } }))).filter(Boolean))]
  .filter((h, i) => i % 3 === 0);
const state = { fail: true };
const refuses = u => { let d = u; try { d = decodeURIComponent(u) } catch (e) {} return HOSTS.some(h => d.includes(h)) };

(async () => {
  const app = await openApp({ viewport: { width: 412, height: 915 } });
  const p = app.page; let fails = 0;
  const bad = (m) => { fails++; console.log('FAIL ' + m) };
  try {
    await app.ctx.route(u => !/^(127\.0\.0\.1|localhost)$/.test(u.hostname), (r, q) => {
      if (!/^(document|fetch|xhr)$/.test(q.resourceType())) return r.continue().catch(() => {});
      if (state.fail && refuses(q.url())) return r.abort().catch(() => {});
      return r.fulfill({ contentType: 'text/html', body: PAGE }).catch(() => {});
    });
    await p.waitForTimeout(1200);
    await p.click('text=Get started', { timeout: 1500 }).catch(() => {});
    await p.evaluate(() => { document.querySelectorAll('dialog[open]').forEach(d => d.close()); S.sel = 'we'; render() });
    await p.waitForSelector('.we-sc .we-pg', { timeout: 30000 });

    /* the first pass, with a third of the publishers refusing */
    /* wait for the background pass to have STARTED and then stopped, and for nothing new to be stored.
       Reading WE.on too early is reading it before the pass begins, which is how the first cut of this test
       reported "nothing was dropped" while the app was dropping eleven. */
    const look = () => p.evaluate(() => ({ on: !!WE.on, gone: WE.gone ? WE.gone.size : 0, cur: WE.cur.length,
      stored: WE.cur.filter(a => acHas(a.link)).length }));
    const settled = async () => { let began = false, last = -1, still = 0, r = await look();
      for (let i = 0; i < 60; i++) { await p.waitForTimeout(2500); r = await look();
        if (r.on) began = true;
        if (r.stored === last) still++; else { last = r.stored; still = 0 }
        if (began && !r.on && still >= 1) return r }
      return r };

    const first = await settled();
    if (!first.gone) bad('the harness never dropped a story, so this test proved nothing (network stand-in too kind?)');
    else console.log('ok   a story that cannot be prepared leaves the edition (' + first.gone + ' of ' + first.cur + ')');

    /* the publishers answer again, and the reader refreshes: the next pass must bring them back */
    state.fail = false;
    await p.evaluate(() => { WE.sig = ''; render() });
    const second = await settled();
    if (second.gone >= first.gone) bad('the dropped stories never came back: ' + first.gone + ' before, ' + second.gone + ' after');
    else console.log('ok   the next pass brings them back (' + first.gone + ' dropped, ' + second.gone + ' after)');

    const shown = await p.evaluate(() => document.querySelectorAll('.we-sc .we-pg').length);
    if (!shown) bad('the edition has no pages at all after the second pass');
    else console.log('ok   the edition is on the page afterwards (' + shown + ' pages)');
  } catch (e) { bad('we_dropped threw: ' + (e && e.message || e)) }
  await app.close();
  console.log(fails ? fails + ' FAIL(s)' : 'we_dropped: a dropped story comes back on the next pass');
  process.exit(fails ? 1 : 0);
})();
