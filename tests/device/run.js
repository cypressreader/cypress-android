/* Device test: drives the REAL Android app (debug APK) on an Android emulator, through adb and the WebView's debug port.
   Run by .github/workflows/device-test.yml (needs a booted emulator with the app installed; it cannot run in a cloud session: no KVM).
   Real taps/swipes/back/rotation go through `adb shell input`; page checks go through Playwright's Android WebView support.
   Every step leaves real-screen screenshots (status bar and system bars included) and a line in report.json:
   ok/error, page errors, main-thread stalls of 200 ms or more, and the step's own facts.
   STEPS=story,sizes runs only the named steps (first-run and feed always run: the others need them).
   Add a step: one `await step('name', async s => {...})` block below; call shot(s,'label') wherever a picture helps. */
const { execSync } = require('child_process'), fs = require('fs'), path = require('path');
const PW = require(execSync('npm root -g').toString().trim() + '/playwright');
const PKG = 'com.cypress.reader', OUT = process.env.OUT || 'device-out';
/* a line STEPS=covers,sizes in tests/device/RUN does the same for a run started by a push */
/* nodynx switches off the Dynamic look (tints, palettes, special openings) but keeps the Dynamic theme. rl:wide (or rl:hero, rl:plate, rl:classic) sets the story-opening setting, to tell the Dynamic covers apart from the rest of the Dynamic look. a line COVERFIX=nowc (or nosync, or both: nowc,nosync) in tests/device/RUN switches off one part of the sliding cover in the covers step, to find which part the emulator cannot survive */
const COVERFIX = ((fs.readFileSync(path.join(__dirname, 'RUN'), 'utf8').match(/^COVERFIX=(.*)$/m) || [])[1] || '').split(',').map(x => x.trim()).filter(Boolean);
const ONLY = (process.env.STEPS || (fs.readFileSync(path.join(__dirname, 'RUN'), 'utf8').match(/^STEPS=(.*)$/m) || [])[1] || '').split(',').map(x => x.trim()).filter(Boolean);
const APPVER = (fs.readFileSync(path.resolve(__dirname, '../../www/index.html'), 'utf8').match(/const APP_VERSION='([^']+)'/) || [])[1] || '';
const sleep = ms => new Promise(r => setTimeout(r, ms));
/* real public feeds: the app fetches them itself through the phone's network stack, which a page-level mock cannot fake */
const SEED = { feeds: [['BBC News', 'https://feeds.bbci.co.uk/news/rss.xml'], ['NPR', 'https://feeds.npr.org/1001/rss.xml'], ['The Verge', 'https://www.theverge.com/rss/index.xml'], ['Ars Technica', 'https://feeds.arstechnica.com/arstechnica/index']].map(([title, url], i) => ({ id: 'f' + i, title, url, folder: '' })), folders: [], sel: 'all', scroll: 'pages', ver: APPVER, smn: 1, intro: false, setall: 1, theme: 'dynamic' };
const WATCH = () => { if (!window.__lto) { window.__lt = []; try { window.__lto = new PerformanceObserver(l => l.getEntries().forEach(e => window.__lt.push(Math.round(e.duration)))); window.__lto.observe({ entryTypes: ['longtask'] }) } catch (e) {} } };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const [dev] = await PW._android.devices();
  if (!dev) throw new Error('No Android device found by adb.');
  dev.setDefaultTimeout(90000);
  const sx = async c => (await dev.shell(c)).toString().trim();
  const R = { sha: process.env.GITHUB_SHA || '', branch: process.env.GITHUB_REF_NAME || '', app: APPVER, android: await sx('getprop ro.build.version.release'), sdk: await sx('getprop ro.build.version.sdk'), model: dev.model(), steps: [] };
  let page, n = 0; const errs = [];
  const shot = async (s, label) => { await sleep(800); const f = String(++n).padStart(2, '0') + '-' + s.name + (label ? '-' + label : '') + '.png'; await dev.screenshot({ path: path.join(OUT, f) }); s.shots.push(f) };
  const attach = async () => {
    const wv = await dev.webView({ pkg: PKG }); page = await wv.page(); page.setDefaultTimeout(30000);
    page.on('pageerror', e => errs.push(String(e.message).slice(0, 300)));
    page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 300)) });
    await page.waitForLoadState('domcontentloaded'); await page.evaluate(WATCH);
  };
  let dn = 0;
  const launch = async () => { await sx(`monkey -p ${PKG} -c android.intent.category.LAUNCHER 1`); await sleep(1500) };
  /* a phone setting that rebuilds the screen (text size, dark phone) closes the page handle: start the app again and take a new one */
  const restart = async () => { await sx(`am force-stop ${PKG}`); await sleep(800); await launch(); await attach(); await page.waitForSelector('#grid .card', { timeout: 60000 }); await sleep(2500) };
  /* runs 4 and 6: a swipe sometimes opened a story or the picture viewer. Record who called, and the touch events just before */
  const TRACE = `(() => { if (window.__tr) return; const tr = window.__tr = { ev: [], calls: [] }; let moves = 0; const push = s => { tr.ev.push(Math.round(performance.now()) + ' ' + s); if (tr.ev.length > 60) tr.ev.shift() }; for (const k of ['pointerdown', 'pointerup', 'pointercancel', 'touchstart', 'touchend', 'touchcancel', 'click', 'popstate']) addEventListener(k, e => { const t = e.target, p = e.changedTouches ? e.changedTouches[0] : e; push(k + ' ' + (p && p.clientX != null ? Math.round(p.clientX) + ',' + Math.round(p.clientY) : '') + ' ' + (t && t.tagName ? t.tagName + '.' + String(t.className || '').slice(0, 30) : '') + (e.isTrusted ? '' : ' SYNTH')) }, true); addEventListener('touchstart', () => { moves = 0 }, { capture: true, passive: true }); addEventListener('touchmove', () => { moves++; if (moves % 5 === 1) push('touchmove x' + moves) }, { capture: true, passive: true }); for (const f of ['openReader', 'openGal']) { const o = window[f]; if (typeof o !== 'function') continue; window[f] = function (a) { tr.calls.push({ f, t: Math.round(performance.now()), what: String(a && (a.title || a.src) || '').slice(0, 60), stack: String(new Error().stack).split('\\n').slice(2, 8).map(x => x.trim().slice(0, 90)), ev: tr.ev.slice(-25) }); return o.apply(this, arguments) } } })()`;
  const trace = () => page.evaluate(() => { const c = (window.__tr || { calls: [] }).calls.slice(); if (window.__tr) window.__tr.calls = []; return c }).catch(() => []);
  const note = x => { (R.extra = R.extra || []).push(x) };
  const facts = () => page.evaluate(() => ({ w: innerWidth, h: innerHeight, dpr: devicePixelRatio, sideways: document.documentElement.scrollWidth > innerWidth + 1, cards: document.querySelectorAll('#grid .card').length, theme: document.documentElement.getAttribute('data-theme') || '', reader: !!document.querySelector('#rd.on') }));
  const swipe = async (x1, y1, x2, y2, ms = 220) => { const [w, h] = await page.evaluate(() => [innerWidth * devicePixelRatio, innerHeight * devicePixelRatio]); /* run 7 proved it: on the slow emulator `input swipe` sometimes arrives as finger down + finger up with no movement, which Android reads as a tap (it opened a story from the list and the picture viewer from a page). When that happens, undo what the tap opened and swipe again */ const st = () => page.evaluate(() => { const g = document.querySelector('#gal'); return { rd: !!document.querySelector('#rd.on'), gal: !!g && !g.hidden } }); for (let k = 0; k < 3; k++) { await page.evaluate(TRACE).catch(() => {}); const b = await st(); await sx(`input swipe ${Math.round(w * x1)} ${Math.round(h * y1)} ${Math.round(w * x2)} ${Math.round(h * y2)} ${Math.max(ms, 300)}`); await sleep(3100); const miss = await page.evaluate(() => { const ev = (window.__tr || { ev: [] }).ev; let i = ev.length - 1; while (i >= 0 && !/ touchstart /.test(ev[i])) i--; return i >= 0 && !ev.slice(i).some(x => /touchmove/.test(x)) }).catch(() => false); if (!miss) return; note({ swipeArrivedAsTap: k + 1 }); const a = await st(); if ((a.gal && !b.gal) || (a.rd && !b.rd)) { await sx('input keyevent 4'); await sleep(1500) } } };
  const openStory = async (i = 0) => { await page.locator('#grid .card').nth(i).click({ timeout: 15000 }); await page.waitForSelector('#rd.on', { timeout: 15000 }); await sleep(6000); /* the first-story tip covers the page: dismiss it */ await page.evaluate(() => { const b = document.querySelector('[data-gestx]'); if (b) b.click() }).catch(() => {}) ; /* run 18's pictures showed leftovers in story text (a site's programme list, 'hide caption', a follow box) on sites the cloud cannot fetch: keep the start of each opened story's cleaned text so the leftovers can be traced */ try { fs.writeFileSync(path.join(OUT, 'story-' + String(++dn).padStart(2, '0') + '.html'), await page.evaluate(() => { const b = [...document.querySelectorAll('#rd .body')].find(x => !x.closest('.tl,.tl-leaf')); return JSON.stringify({ link: curA && curA.link, title: curA && curA.title, np: R.np }) + '\n' + (b ? b.innerHTML.replace(/ (style|data-[a-z-]+)="[^"]*"/g, '').slice(0, 14000) : '') })) } catch (e) {} };
  const back = async () => { for (let i = 0; i < 3; i++) { await sx('input keyevent 4'); try { await page.waitForFunction(() => !document.querySelector('#rd.on'), null, { timeout: 4000 }); return } catch (e) { note({ backDidNotClose: i + 1, viewerOpen: await page.evaluate(() => { const g = document.querySelector('#gal'); return !!g && !g.hidden }).catch(() => null) }) } } throw new Error('Back did not close the story after 3 presses') };
  const storyTour = async (s, turns = 2, i = 0) => { await openStory(i); await page.evaluate(TRACE); await trace(); await shot(s, 'story'); const pg = () => page.evaluate(() => { const b = document.querySelector('.book'), im = [...document.querySelectorAll('#rd .body img')].filter(x => !x.closest('.tl,.tl-leaf')); return { pg: R.pg, np: R.np, busy: R.busy, web: R.web, cls: b ? b.className : '', imgs: im.length, loaded: im.filter(x => x.complete && x.naturalWidth).length } }).catch(e => ({ err: String(e.message).slice(0, 80) }));
    /* run 17: some stories (all from one site) stayed on page 1 through every swipe although the swipes arrived as real movement. Record the page before and after each swipe, and the last touch events when the page did not move */
    for (let i = 1; i <= turns; i++) { const b4 = await pg(); await swipe(.85, .5, .15, .5); const af = await pg(); await shot(s, 'turn' + i); if (b4.pg === af.pg) note({ noTurn: s.name, swipe: i, before: b4, after: af, ev: await page.evaluate(() => (window.__tr || { ev: [] }).ev.slice(-14)).catch(() => []) }) } const f = await facts(); { const tc = await trace(); if (tc.length) note({ tour: s.name, trace: tc }) } await back(); return f };
  const step = async (name, fn, always) => {
    if (!always && ONLY.length && !ONLY.includes(name)) return;
    const s = { name, ok: true, shots: [] }, t = Date.now(), e0 = errs.length;
    try { if (page && page.isClosed()) await restart(); if (page) await page.evaluate(() => { window.__lt = [] }).catch(() => {}); const info = await fn(s); if (info) s.info = info }
    catch (e) { s.ok = false; s.error = String(e && e.message || e).split('\n')[0].slice(0, 400); try { await shot(s, 'FAILED') } catch (_) {} }
    s.ms = Date.now() - t; s.errors = errs.slice(e0);
    try { s.stalls = await page.evaluate(() => (window.__lt || []).filter(d => d >= 200)) } catch (_) {}
    R.steps.push(s); console.log((s.ok ? 'ok   ' : 'FAIL ') + name + ' ' + s.ms + ' ms' + (s.error ? ' : ' + s.error : '') + (s.errors.length ? ' [' + s.errors.length + ' page errors]' : '') + (s.stalls && s.stalls.length ? ' [stalls ' + s.stalls.join(',') + ' ms]' : ''));
    fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(R, null, 1));
  };

  await step('first-run', async s => {
    await sx(`pm clear ${PKG}`); await sx(`pm grant ${PKG} android.permission.POST_NOTIFICATIONS`).catch(() => {});
    await launch(); await attach(); await sleep(4000); await shot(s);
    R.webview = await page.evaluate(() => (navigator.userAgent.match(/Chrome\/[\d.]+/) || [''])[0]);
    return Object.assign(await facts(), { native: await page.evaluate(() => typeof NATIVE !== 'undefined' && NATIVE) });
  }, true);

  await step('feed', async s => {
    /* 1.377: a setup that was started and not finished comes back on the next launch ('cyob'); the seeded library stands for a finished setup */
    await page.evaluate(seed => { localStorage.setItem('folio', JSON.stringify(Object.assign({ onboarded: 1 }, seed))); localStorage.removeItem('cyob') }, SEED);
    const t = Date.now(); await page.reload(); await page.evaluate(WATCH);
    await page.waitForSelector('#grid .card', { timeout: 90000 }); const first = Date.now() - t;
    await sleep(6000); await page.click('text=Dismiss', { timeout: 2000 }).catch(() => {}); await shot(s);
    return Object.assign(await facts(), { firstCardMs: first });
  }, true);

  await step('story', async s => storyTour(s, 3));

  await step('scroll', async s => { /* run 4 ended this step with a story open: record when that happens, then close it so later steps can go on */ const rd = () => page.evaluate(() => !!document.querySelector('#rd.on')), log = [(await page.evaluate(TRACE), await trace(), await rd())]; for (let i = 0; i < 3; i++) { await swipe(.5, .8, .5, .25, 160); log.push(await rd()) } await shot(s); const f = await facts(); f.readerAfterEachSwipe = log; f.trace = await trace(); if (f.reader) { s.ok = false; s.error = 'a story was open after scrolling the list: ' + JSON.stringify(log); await back().catch(() => {}) } return f });

  /* 2026-11-23: on a friend's Pixel 6 (Android 17, Press theme, light, type cover) The Daily snaps back up 600 to 900 px while a finger scrolls it down; the app's own log shows no redraw and no height change. This scrolls the Daily with real finger swipes in her look and in Halcyon, records every backward move of the list frame by frame, and names any code that moved it */
  await step('daily-jump', async s => {
    const out = {};
    const HOOK = String.raw`(() => { if (window.__dj) return; const m = document.querySelector('main'), dj = window.__dj = { back: [], code: [], ev: [], max: 0 }; const T = () => Math.round(performance.now()); const st = k => { dj.code.push(T() + ' ' + k + ' y=' + Math.round(m.scrollTop) + ' ' + String(new Error().stack).split('\n').slice(2, 6).map(x => x.trim().replace(/https?:\/\/[^/]+\//, '').slice(0, 70)).join(' < ')); if (dj.code.length > 40) dj.code.shift() };
      const d = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollTop'); Object.defineProperty(m, 'scrollTop', { get() { return d.get.call(this) }, set(v) { st('scrollTop=' + Math.round(v)); d.set.call(this, v) }, configurable: true });
      for (const k of ['scrollTo', 'scrollBy', 'scroll']) { const f = m[k]; m[k] = function () { st(k + '(' + JSON.stringify(arguments[0]).slice(0, 60) + ')'); return f.apply(this, arguments) } }
      for (const k of ['scrollIntoView', 'focus']) { const f = Element.prototype[k] || HTMLElement.prototype[k], P = k === 'focus' ? HTMLElement.prototype : Element.prototype; P[k] = function () { if (m.contains(this) || this === m) st(k + ' ' + this.tagName + '.' + String(this.className).slice(0, 30) + ' ' + JSON.stringify(arguments[0] || '')); return f.apply(this, arguments) } }
      let touch = 0; for (const k of ['touchstart', 'touchend', 'touchcancel', 'pointercancel', 'scrollend', 'resize']) addEventListener(k, e => { if (k === 'touchstart') touch = 1; if (k === 'touchend' || k === 'touchcancel') touch = 0; dj.ev.push(T() + ' ' + k + ' y=' + Math.round(d.get.call(m))); if (dj.ev.length > 80) dj.ev.shift() }, true);
      new MutationObserver(l => { const c = [...new Set(l.map(x => x.type === 'attributes' ? (x.target.tagName + '.' + x.attributeName + '=' + String(x.target.getAttribute(x.attributeName)).slice(0, 50)) : ''))].filter(Boolean).slice(0, 4); if (c.length) { dj.ev.push(T() + ' attr ' + c.join(' | ')); if (dj.ev.length > 80) dj.ev.shift() } }).observe(document.documentElement, { attributes: true, subtree: false }); new MutationObserver(() => { dj.ev.push(T() + ' body.' + document.body.className.slice(0, 60)); if (dj.ev.length > 80) dj.ev.shift() }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
      let ly = d.get.call(m), lh = m.scrollHeight, lt = T(); const f = () => { const y = d.get.call(m), t = T(); if (y > dj.max) dj.max = Math.round(y); if (y < ly - 80) { const h = m.scrollHeight; dj.back.push({ t, from: Math.round(ly), to: Math.round(y), gap: t - lt, touch, h0: lh, h1: h, vh: m.clientHeight, tuck: document.body.classList.contains('tabtuck'), ev: dj.ev.slice(-8), code: dj.code.slice(-3) }); lh = h } ly = y; lt = t; requestAnimationFrame(f) }; requestAnimationFrame(f) })()`;
    for (const [name, t] of [['press', 'press'], ['halcyon', 'halcyon']]) {
      await page.evaluate(t => { S.theme = t; S.sch = 'light'; S.cvs = 'type'; applyTheme(); S.sel = 'today'; render(); document.querySelector('main').scrollTop = 0 }, t); await sleep(7000);
      await page.evaluate(() => { delete window.__dj }); await page.evaluate(HOOK); await page.evaluate(TRACE).catch(() => {});
      const [w, h] = await page.evaluate(() => [innerWidth * devicePixelRatio, innerHeight * devicePixelRatio]), X = Math.round(w * .5);
      await shot(s, name + '-top');
      /* finger moves up the screen (list goes down): slow drags, quick flicks, and flicks one straight after another, like her recording */
      const sw = (a, b, ms) => sx(`input swipe ${X} ${Math.round(h * a)} ${X} ${Math.round(h * b)} ${ms}`);
      for (const [a, b, ms, wait] of [[.75, .35, 600, 1500], [.75, .3, 350, 400], [.75, .3, 350, 400], [.8, .25, 200, 300], [.8, .25, 200, 300], [.8, .25, 200, 2500], [.7, .4, 900, 200], [.7, .4, 900, 200], [.8, .2, 150, 150], [.8, .2, 150, 150], [.8, .2, 150, 3000]]) { await sw(a, b, ms); await sleep(wait) }
      await shot(s, name + '-after');
      out[name] = await page.evaluate(() => { const m = document.querySelector('main'), dj = window.__dj; return { theme: document.documentElement.dataset.theme, cover: (document.querySelector('.dcov') || {}).className || '', y: Math.round(m.scrollTop), max: dj.max, height: m.scrollHeight, backward: dj.back.slice(0, 12), backwardCount: dj.back.length, codeMoves: dj.code.slice(-12), lastEvents: dj.ev.slice(-30) } });
      if (await page.evaluate(() => !!document.querySelector('#rd.on'))) { out[name].storyOpened = true; await back().catch(() => {}) }
      await page.evaluate(() => { document.querySelector('main').scrollTop = 0 }); await sleep(800);
    }
    await page.evaluate(() => { S.theme = 'dynamic'; delete S.sch; delete S.cvs; applyTheme(); S.sel = 'all'; render() }).catch(() => {});
    return out;
  });

  await step('themes', async s => {
    const out = {};
    for (const t of ['halcyon', 'press', 'oled']) {
      await page.evaluate(t => { S.theme = t; applyTheme(); render() }, t); await sleep(1500);
      await page.evaluate(() => scrollTo(0, 0)); await shot(s, t); out[t] = await storyTour({ name: s.name + '-' + t, shots: s.shots }, 1, 1);
    }
    await page.evaluate(() => { S.theme = 'dynamic'; applyTheme(); render() }); return out;
  });

  /* other screens on the same emulator: Fold cover (411x902), Fold open (884x1104), then the open Fold turned sideways */
  await step('big-text', async s => {
    try { await sx('settings put system font_scale 1.3'); await restart(); await shot(s); return await storyTour(s, 1) }
    finally { await sx('settings put system font_scale 1.0'); await restart() }
  });

  await step('dark-phone', async s => {
    try { await sx('cmd uimode night yes'); await sleep(2500); await shot(s); return await facts() }
    finally { await sx('cmd uimode night no'); await sleep(1500) }
  });

  await step('leave-and-return', async s => {
    await openStory(); await sx('input keyevent 3'); await sleep(4000); await launch(); await sleep(2500); await shot(s);
    const f = await facts(); if (!f.reader) throw new Error('The open story was gone after leaving the app and coming back.');
    await back(); return f;
  });

  await step('share-in', async s => {
    await sx(`am start -a android.intent.action.SEND -t text/plain --es android.intent.extra.TEXT https://www.theverge.com/rss/index.xml -p ${PKG}`);
    await sleep(4000); await shot(s); await sx('input keyevent 4'); return facts();
  });

  await step('cold-start', async s => {
    await sx(`am force-stop ${PKG}`); await sleep(1000);
    const act = (await sx(`cmd package resolve-activity --brief ${PKG}`)).split('\n').pop().trim();
    const o = await sx(`am start -W -n ${act}`); const t = Date.now();
    await attach(); await page.waitForSelector('#grid .card', { timeout: 60000 }); const cards = Date.now() - t;
    await shot(s); return { androidStartMs: +(o.match(/TotalTime:\s*(\d+)/) || [])[1] || null, cardsAfterMs: cards };
  });

  /* runs 17-20: the emulator itself stops (no message, no memory shortage) around the 2nd or 3rd change of screen size. So the two steps that change it run last: when it stops, only they are lost */
  await step('sizes', async s => {
    const out = {};
    try {
      for (const [name, w, h, d] of [['foldcover', 904, 1984, 352], ['foldopen', 884, 1104, 160]]) {
        await sx(`wm size ${w}x${h}`); await sx(`wm density ${d}`); await sleep(3500);
        await page.evaluate(() => scrollTo(0, 0)); await shot(s, name); out[name] = await storyTour({ name: s.name + '-' + name, shots: s.shots }, 2, 2); out[name + '2'] = await storyTour({ name: s.name + '-' + name + '-b', shots: s.shots }, 2, 3);
      }
      await sx('settings put system accelerometer_rotation 0'); await sx('settings put system user_rotation 1'); await sleep(3500);
      await shot(s, 'sideways'); out.sideways = await storyTour({ name: s.name + '-sideways', shots: s.shots }, 2);
    } finally { await sx('settings put system user_rotation 0'); await sx('wm size reset'); await sx('wm density reset'); await sleep(9000) }
    return out;
  });

  /* the open Fold, story by story: which cover each one opens with, and how long the main thread stops on its first two turns (run 8: the first turn from a whole-screen picture cover hung the app) */
  await step('covers', async s => {
    const out = [], seen = {}; s.info = out; /* kept even when a turn kills the step */
    try {
      /* runs 10 and 11: the emulator itself died at the Fold's real 1768x2208 (software drawing). Half the pixels each way at half the density gives the app the very same page size (884x1104), a quarter of the drawing work */
      /* runs 17-19: alone this step survives, after the other steps the emulator dies in it: start the app afresh so it begins with empty memory */
      await restart();
      /* run 29: the emulator's log stopped inside the resize itself, before any story: nosize leaves the screen alone */ if (!COVERFIX.includes('nosize')) { await sx('wm size 884x1104'); await sx('wm density 160'); await sleep(3500) } await page.evaluate(() => scrollTo(0, 0));
      /* run 12: three stories turned with the curl, then the emulator died again. So: a feed with large pictures (whole-screen covers need 1600px+), its first five stories turned flat first (curl off), then the same five with the curl. If only the curl half kills the emulator, the strip copies are the heavy part */
      /* run 23: this step ran in the Halcyon theme (an earlier step's restart brought back a stored theme), so no story opened with a whole-screen or sliding cover: those belong to Dynamic */ /* theme:halcyon is the control: the same stories outside Dynamic */ await page.evaluate(t => { S.theme = t; applyTheme(); render() }, (COVERFIX.find(x => x.startsWith('theme:')) || 'theme:dynamic').slice(6)); await sleep(1500); s.coverfix = COVERFIX; await page.evaluate(fx => { { const rl = fx.find(x => x.startsWith('rl:')); if (rl) { S.rl = rl.slice(3); render() } } if (fx.includes('nodynx')) { S.dynx = false; applyTheme(); render() } /* runs 28, 30, 33 all died inside one story (2000x1390 cover): nohero leaves its pictures undrawn */ if (fx.includes('nohero')) { const st = document.createElement('style'); st.textContent = '#rd img{display:none!important}'; document.head.append(st) } if (fx.includes('nowc')) { const st = document.createElement('style'); st.textContent = '#rd .cols img.hero{will-change:auto!important}'; document.head.append(st) } if (fx.includes('nosync')) new MutationObserver(() => document.querySelectorAll('#rd img.hero[decoding=sync]').forEach(i => { i.decoding = 'async' })).observe(document.getElementById('rd'), { childList: true, subtree: true }) }, COVERFIX);
      s.feedPicked = await page.evaluate(() => { const f = S.feeds.find(f => /verge/i.test(JSON.stringify(f))); if (!f) return null; S.sel = 's:' + f.id; render(); scrollTo(0, 0); return f.id }); await sleep(2500);
      /* runs 28-31: Dynamic dies at a different point each time, Halcyon survives. stages: the list alone first, 45 s with the Dynamic look off, then 45 s with it on, scrolling so the tint changes; the last mark in the report says how far it got */
      if (COVERFIX.includes('stages')) { for (const on of [false, true]) { await page.evaluate(v => { S.dynx = v; applyTheme(); render() }, on); for (let k = 0; k < 9; k++) { await page.evaluate(k => scrollTo(0, (k % 3) * 1500), k); await sleep(5000) } out.push({ stage: 'list 45 s, Dynamic look ' + (on ? 'on' : 'off') }) } await page.evaluate(() => scrollTo(0, 0)); await sleep(1000) }
      for (let n = 0; n < 10; n++) { const i = n % 5, curl = n >= 5; await page.evaluate(c => { S.curl = c }, curl);
        try { await openStory(i) } catch (e) { out.push({ i, err: String(e.message).split('\n')[0].slice(0, 120) }); if (await page.evaluate(() => !!document.querySelector('#rd.on')).catch(() => false)) await back(); continue }
        const m = await page.evaluate(() => { const h = document.querySelector('.cols>.hsf'), im = h && h.querySelector('img.hero'), t = document.querySelector('.cols .tt'); window.__lt = []; return { m: h ? h.dataset.m : '', pic: im ? im.naturalWidth + 'x' + im.naturalHeight : '', title: t ? t.textContent.slice(0, 50) : '' } });
        const o = { i, curl, ...m, turns: [] }, first = !seen[m.m + curl]; seen[m.m + curl] = 1; out.push(o);
        for (let k = 1; k <= 2; k++) {
          await swipe(.85, .5, .15, .5);
          const r = await Promise.race([page.evaluate(() => { const l = (window.__lt || []).slice(); window.__lt = []; return { pg: typeof R !== 'undefined' ? R.pg : null, stalls: l.filter(d => d >= 100), turn: typeof curlLog !== 'undefined' ? curlLog[curlLog.length - 1] : '' } }), sleep(20000).then(() => ({ hung: true }))]);
          o.turns.push(r); if (first || r.hung || /cov/.test(m.m)) await shot(s, (m.m || 'plain') + '-' + i + (curl ? '-curl' : '-flat') + '-turn' + k); if (r.hung) break;
        }
        await back();
      }
    } finally { await sx('wm size reset'); await sx('wm density reset'); await sleep(3000) }
    return out;
  });

  /* the home-screen widgets, drawn by the app itself (widgetProbe) in three themes: Halcyon keeps the widgets' own look */
  /* 1.377 report from David's Fold: a playing podcast episode has no notification. Plays a one-minute silent episode and records what Android itself shows: the notification, the media session, who holds the sound (audio focus), and whether the episode is still running after a few seconds and after Home */
  await step('podcast', async s => {
    const sys = async () => ({ notif: await sx(`dumpsys notification --noredact | grep -A6 "pkg=${PKG}" | head -40`).catch(e => 'ERR ' + e), session: await sx(`dumpsys media_session | grep -B2 -A14 "${PKG}" | head -70`).catch(e => 'ERR ' + e), focus: await sx(`dumpsys audio | grep -A12 "Audio Focus stack" | head -24`).catch(e => 'ERR ' + e), service: await sx(`dumpsys activity services ${PKG} | grep -c CyMediaService`).catch(e => 'ERR ' + e), perm: await sx(`dumpsys package ${PKG} | grep -m2 "POST_NOTIFICATIONS"`).catch(e => 'ERR ' + e) });
    const st = () => page.evaluate(() => ({ paused: EPA ? EPA.paused : null, t: EPA ? Math.round(EPA.currentTime * 10) / 10 : null, eps: typeof EPS === 'string' ? EPS : null, on: typeof epOn === 'function' ? epOn() : null, media: (() => { try { return { feat: nFeat('media'), start: !!(CyX() && CyX().mediaStart), update: !!(CyX() && CyX().mediaUpdate), mperm: S.mperm || 0, native: NATIVE } } catch (e) { return String(e) } })(), log: window.__ml || [] }));
    await page.evaluate(async () => {
      document.querySelectorAll('dialog[open]').forEach(d => d.close()); if (document.querySelector('#rd.on')) closeRd();
      const sr = 8000, n = sr * 60, ab = new ArrayBuffer(44 + n), v = new DataView(ab), ws = (o, t) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)) }; ws(0, 'RIFF'); v.setUint32(4, 36 + n, true); ws(8, 'WAVE'); ws(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, sr, true); v.setUint32(28, sr, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); ws(36, 'data'); v.setUint32(40, n, true); for (let i = 0; i < n; i++) v.setUint8(44 + i, 128 + Math.round(20 * Math.sin(i / 6)));
      const url = URL.createObjectURL(new Blob([ab], { type: 'audio/wav' }));
      const f = S.feeds[0]; const a = { feedId: f.id, title: 'Device test episode', link: 'https://device.test/ep/1', date: Date.now(), summary: 'An episode.', img: '', audio: url, dur: '1 min', html: '<p>' + 'Show notes. '.repeat(40) + '</p>' }; (items[f.id] = items[f.id] || []).unshift(a);
      /* record every call the page makes to the phone's media notification */
      window.__ml = []; try { const x = CyX(); for (const k of ['mediaStart', 'mediaUpdate', 'mediaStop']) { const o = x[k]; if (typeof o === 'function') x[k] = function (m) { window.__ml.push(k + ' ' + JSON.stringify({ playing: m && m.playing }) + ' @' + Math.round(performance.now()) + (m && m.playing === false || k === 'mediaStop' ? ' paused=' + (window.EPA ? EPA.paused : '?') + ' eps=' + (typeof EPS === 'string' ? EPS : '?') + ' via ' + (new Error().stack || '').split('\n').slice(2, 6).map(x => x.trim().replace(/\(?https?:\/\/[^ )]*\/([^\/ )]*)\)?/, '$1').replace(/^at /, '')).join(' < ').slice(0, 260) : '')); let r; try { r = o.apply(this, arguments) } catch (e) { window.__ml.push(k + ' THREW ' + e); throw e } if (r && r.catch) r.catch(e => window.__ml.push(k + ' REJECTED ' + (e && e.message || e))); return r } } } catch (e) { window.__ml.push('wrap failed ' + e) }
      try { CyX().addListener('mediaAction', r => window.__ml.push('FROM ANDROID ' + (r && r.action) + ' @' + Math.round(performance.now()))) } catch (e) {}
      await openReader(a);
      try { epInit(); for (const ev of ['play', 'pause', 'playing', 'waiting', 'error', 'ended']) EPA.addEventListener(ev, () => window.__ml.push('audio ' + ev + ' @' + Math.round(performance.now()))) } catch (e) { window.__ml.push('no epInit ' + e) }
    });
    await sleep(5000); await page.evaluate(() => document.querySelectorAll('[data-tipx]').forEach(b => b.click())).catch(() => {});
    await page.locator('#rd .cols .aud [data-ap="play"]').first().click({ timeout: 15000 });
    await sleep(6000); await shot(s, 'playing'); const a1 = await st(), s1 = await sys();
    note({ podcastAfter6s: a1.log, state: (s1.session.match(/state=\w+/) || [''])[0] });
    await sx('cmd statusbar expand-notifications'); await shot(s, 'shade'); await sx('cmd statusbar collapse');
    await sleep(6000); const a2 = await st().catch(e => ({ log: ['st failed ' + e] }));
    /* opening another story while the episode plays must not take the notification away */
    await page.evaluate(async () => { closeRd(); await new Promise(r => setTimeout(r, 800)); const o = cur.find(x => !x.audio); if (o) await openReader(o) }).catch(e => note({ otherStoryFailed: String(e).slice(0, 200) })); await sleep(4000); const a2b = await st().catch(e => ({ log: ['st failed ' + e] })), s2b = await sys();
    await sx('input keyevent 3'); await sleep(8000); const a3 = await st().catch(e => String(e)), s3 = await sys();
    await sx('cmd statusbar expand-notifications'); await shot(s, 'shade-home'); await sx('cmd statusbar collapse');
    await launch(); await sleep(2500); const a4 = await st().catch(e => String(e));
    await page.evaluate(() => { try { EPA.pause() } catch (e) {} try { closeRd() } catch (e) {} }).catch(() => {});
    note({ podcastCalls: a4.log || a2b.log });
    const playingIn = y => /state=PLAYING/.test(y.session || '');
    if (!playingIn(s1) || !playingIn(s2b) || !playingIn(s3)) throw new Error('Android does not show the episode as playing: after 6 s ' + playingIn(s1) + ', with another story open ' + playingIn(s2b) + ', at Home ' + playingIn(s3) + ' | calls: ' + (a2b.log || []).join(' ; ').slice(0, 300));
    return { after6s: a1, after12s: a2, otherStory: a2b, home8s: a3, back: a4, sys6s: s1, sysOther: s2b, sysHome: s3 };
  });

  await step('widgets', async s => {
    const out = {};
    for (const t of ['halcyon', 'rosewood', 'oled']) {
      const r = await page.evaluate(async t => { S.theme = t; applyTheme(); await new Promise(r => setTimeout(r, 600)); const x = CyX(), top = widgetList(), th = widgetTheme(), br = widgetBreaking(); /* show each new sign once: a saved lead, a new-story dot, a Breaking label */ if (top[0]) top[0].sv = true; if (top[1]) top[1].nw = true; if (br[0]) Object.assign(br[0], { brk: true, n: 4 }); await x.widgetUpdate({ headlines: top, breaking: br, edition: 'Morning edition', theme: th, daily: widgetDaily() }); return { n: top.length, pics: top.filter(a => a.img).length, theme: th, shown: document.documentElement.dataset.theme, p: await x.widgetProbe({}) } }, t);
      out[t] = { stories: r.n, withPicture: r.pics, colors: r.theme, shown: r.shown, errors: {} };
      for (const [k, v] of Object.entries(r.p || {})) {
        if (/_error$/.test(k)) { out[t].errors[k] = v; continue }
        const f = String(++n).padStart(2, '0') + '-widgets-' + t + '-' + k + '.jpg'; fs.writeFileSync(path.join(OUT, f), Buffer.from(v, 'base64')); s.shots.push(f);
      }
      if (Object.keys(out[t].errors).length) throw new Error('widget could not be drawn: ' + JSON.stringify(out[t].errors).slice(0, 300));
    }
    await page.evaluate(() => { S.theme = 'halcyon'; applyTheme() });
    return out;
  });

  /* ---- The World Edition (issues 38, 39) ----------------------------------------------------------
     The edition is a magazine inside the app: a cover you swipe, a contents you tap, section pages, and
     stories that open as pages of the edition itself. The phone saw stubs where a desk saw bodies, and the
     cloud cannot reach a single publisher, so this is the only place the real fetch path can be watched. */
  /* run 59: a real tap cannot reach the drawer - on a phone it is off-canvas, so Playwright waits for a
     visible target and times out. The entry goes through the app's own handler all the same (a DOM click
     on the drawer row), and only falls back to setting the view if the row is not there at all. */
  const weOpen = async () => {
    let how = 'drawer-click';
    /* WELITE=1: the edition without its cover art or photographs. Run 61's render thread segfaulted on the
       emulator's software renderer right after the cover, so a lite pass separates a paint crash from a code fault. */
    if (process.env.WELITE) { how = 'lite+drawer-click'; await page.evaluate(() => { WE.lite = true; document.documentElement.classList.add('welite'); try { localStorage.setItem('welite', '1') } catch (e) {} }).catch(() => {}) }
    const did = await page.evaluate(() => { const n = document.querySelector('.nav[data-sel="we"]'); if (!n) return false; n.click(); return true });
    if (!did) { how = 'state'; await page.evaluate(() => { S.sel = 'we'; render() }) }
    try { await page.waitForSelector('.we-sc', { timeout: 40000 }) }
    catch (e) { how += '+state'; await page.evaluate(() => { S.sel = 'we'; render() }); await page.waitForSelector('.we-sc', { timeout: 40000 }) }
    await sleep(2500); return how;
  };
  /* why a story did not arrive: the app keeps its own line per try (route, time, what came back) */
  const weWatch = () => page.evaluate(() => { if (window.__weW) return; const w = window.__weW = { flips: 0 };
    new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.classList && n.classList.contains('we-tn')) w.flips++ }))).observe(document.body, { childList: true, subtree: true }) }).catch(() => {});
  const weDiag = () => page.evaluate(() => ({ log: (WE.lg || []).slice(-40), tries: WE.try || {}, flips: (window.__weW || {}).flips,
    stored: WE.cur.filter(a => acHas(a.link)).length, slow: WE.slow ? WE.slow.size : 0, on: !!WE.on, online: navigator.onLine,
    conn: (navigator.connection || {}).type || '', save: !!(navigator.connection || {}).saveData, dp: typeof dpOk === 'function' ? dpOk(1) : null })).catch(e => ({ err: String(e.message).slice(0, 80) }));
  /* the ready line is the whole of item 1: watched on the real device, on the real network */
  const weReady = async (s, limit = 150) => {
    const series = []; let green = false;
    for (let t = 0; t <= limit; t += 10) {
      const r = await page.evaluate(() => { const e = document.querySelector('.we-rdy'); return { t: e ? e.textContent : '', g: !!(e && e.classList.contains('we-all')) } });
      series.push(t + 's ' + r.t); if (r.g) { green = true; break }
      /* run 61 died mid-wait and took the log with it: each poll leaves what it knows on the step itself,
         so a crash still reports how far the fetches got and why */
      s.live = { series: series.slice(), diag: await weDiag() };
      await sleep(10000);
    }
    await shot(s, green ? 'ready' : 'NOT-READY');
    return { green, series, diag: await weDiag() };
  };
  const weLeave = async () => { await page.evaluate(() => { if (typeof weExit === 'function' && S.sel === 'we') weExit() }).catch(() => {}); await sleep(1500) };
  const weFacts = () => page.evaluate(() => {
    const sc = document.querySelector('.we-sc'); if (!sc) return { err: 'no edition' };
    const two = sc.clientWidth >= 600, pw = sc.clientWidth / (two ? 2 : 1), i = Math.round(sc.scrollLeft / pw);
    const rdy = document.querySelector('.we-rdy'), pg = sc.children[i], nx = sc.children[i + 1], sp = document.querySelector('.we-sp');
    const lab = x => x ? (x.getAttribute('aria-label') || '') : null, fo = x => x && x.querySelector('.we-fo') ? x.querySelector('.we-fo').getAttribute('data-n') : null;
    return { w: innerWidth, two, pages: sc.children.length, base: WE.base, i, pw: Math.round(pw * 10) / 10,
      off: Math.round((sc.scrollLeft - i * pw) * 10) / 10, label: sc.getAttribute('aria-label') || '',
      left: lab(pg), right: two ? lab(nx) : null, folio: fo(pg), folioRight: two ? fo(nx) : null,
      ready: rdy ? rdy.textContent : '', green: !!(rdy && rdy.classList.contains('we-all')),
      photos: document.querySelectorAll('.we-fg.we-ok').length, figures: document.querySelectorAll('.we-fg').length,
      story: sp ? { paras: sp.querySelectorAll('.we-bd > *').length, text: (sp.querySelector('.we-bd') || {}).textContent ? sp.querySelector('.we-bd').textContent.replace(/\s+/g, ' ').trim().slice(0, 90) : '',
        by: (sp.querySelector('.we-by') || {}).textContent || '', deck: !!sp.querySelector('.we-ss'), quote: !!sp.querySelector('.we-pq2'), drop: !!sp.querySelector('.we-dc') } : null };
  });
  /* a story opens by a real tap on its headline; the wait is for the body, not for the page */
  const weRead1 = async (ms = 45000) => {
    await page.evaluate(() => { const a = document.querySelector('.we-pg.we-op .we-ld a[data-we]') || document.querySelector('.we-pg .we-st a[data-we]'); if (a) a.click() });
    await page.waitForFunction(() => { const b = document.querySelector('.we-sp .we-bd'); return b && !/Opening the story/.test(b.textContent) }, null, { timeout: ms }).catch(() => {});
    await sleep(1200);
  };

  await step('world', async s => {
    const how = await weOpen(); await weWatch(); await shot(s, 'cover'); const cover = await weFacts();
    const ready = await weReady(s);
    await swipe(.85, .5, .15, .5); await shot(s, 'contents'); const contents = await weFacts();
    const jumped = await page.evaluate(() => { const b = [...document.querySelectorAll('.we-toc .we-tl button')].find(x => /tech/i.test(x.textContent)); if (!b) return false; b.click(); return true });
    await sleep(2500); await shot(s, 'section'); const section = await weFacts();
    await weRead1(); await shot(s, 'story'); const story = await weFacts();
    for (let i = 1; i <= 2; i++) { await swipe(.85, .5, .15, .5); await shot(s, 'turn' + i) }
    const turned = await weFacts();
    /* two quick swipes in a row: the second used to be dropped, so only one page turned */
    const b4 = await weFacts(); await swipe(.85, .5, .15, .5, 120); await sleep(120); await swipe(.85, .5, .15, .5, 120); await sleep(3000);
    const rapid = await weFacts(); await shot(s, 'rapid');
    await sx('input keyevent 4'); await sleep(2000); await shot(s, 'back');
    const diag = await weDiag();
    const out = { how, jumped, ready, cover, contents, section, story, turned, diag,
      rapid: { from: b4.i, to: rapid.i, moved: rapid.i - b4.i }, after: await weFacts() };
    await weLeave();
    const why = JSON.stringify((diag.log || []).slice(0, 6));
    if (!ready.green) throw new Error('the ready line never went green in ' + ready.series.length * 10 + 's (' + ready.series.slice(-1) + '). Tries: ' + why);
    if (story.story && story.story.paras < 2) throw new Error('the story opened with no body on the device. Tries: ' + why);
    if (!diag.flips) throw new Error('no page turn drew a curl (no .we-tn appeared in ' + (turned.i - cover.i) + ' turns)');
    if (rapid.i - b4.i < (b4.two ? 4 : 2)) throw new Error('two quick swipes moved ' + (rapid.i - b4.i) + ' page(s), not two');
    return out;
  });

  /* Issue 39: returning from a story landed on a mismatched spread at 1919 px but never at 1280. 1919 is odd,
     so each page of a spread is 959.5 px wide: this checks the landing is exact at odd and even widths.
     MJ's three: Microsoft from Tech, the rebel story from Around the world, the turkey story from Sport. */
  await step('we-widths', async s => {
    const out = {}; let bad = 0;
    try {
      for (const w of [1280, 1365, 1919, 1921]) {
        await sx(`wm size ${w}x998`); await sx('wm density 160'); await sleep(4000);
        if (!page || page.isClosed()) await restart();
        await weOpen();
        for (const sec of ['Tech', 'World', 'Sport']) {
          const went = await page.evaluate(n => { const sc = document.querySelector('.we-sc');
            const k = [...sc.children].findIndex(x => (x.getAttribute('aria-label') || '') === n); if (k < 0) return null; WE.go(k, 1); return k }, sec);
          const key = w + '-' + sec;
          if (went == null) { out[key] = 'no section page'; continue }
          await sleep(2200); const before = await weFacts();
          await weRead1(25000);
          await sx('input keyevent 4'); await sleep(2500);
          if (await page.evaluate(() => !!document.querySelector('.we-sp'))) { await page.evaluate(() => weRdClose()).catch(() => {}); await sleep(1800) }
          const after = await weFacts();
          const okLanding = Math.abs(after.off) <= 1, okPair = !after.two || after.i % 2 === 0, okSame = after.i === before.i;
          out[key] = { before: before.i, after: after.i, off: after.off, pw: after.pw, left: after.left, right: after.right, okLanding, okPair, okSame };
          if (!(okLanding && okPair && okSame)) { bad++; await shot(s, key + '-MISMATCH'); note({ spreadMismatch: { width: w, from: sec, before, after } }) }
        }
        await shot(s, 'w' + w); await weLeave();
      }
    } finally { await sx('wm size reset'); await sx('wm density reset'); await sleep(3000); if (!page || page.isClosed()) await restart().catch(() => {}) }
    if (bad) throw new Error(bad + ' return(s) landed on the wrong spread');
    return out;
  });

  R.crashes = (await sx('logcat -d -b crash -t 300').catch(() => '')).split('\n').filter(l => /cypress|FATAL|AndroidRuntime/i.test(l)).slice(0, 40);
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(R, null, 1));
  const bad = R.steps.filter(s => !s.ok).length;
  console.log(bad ? 'FAILED ' + bad + ' of ' + R.steps.length : 'all ' + R.steps.length + ' steps ok');
  await dev.close(); process.exit(bad || R.crashes.length ? 1 : 0);
})().catch(e => { console.error('FAIL device run: ' + (e && e.stack || e)); process.exit(1) });
