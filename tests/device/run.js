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
    await page.evaluate(seed => localStorage.setItem('folio', JSON.stringify(seed)), SEED);
    const t = Date.now(); await page.reload(); await page.evaluate(WATCH);
    await page.waitForSelector('#grid .card', { timeout: 90000 }); const first = Date.now() - t;
    await sleep(6000); await page.click('text=Dismiss', { timeout: 2000 }).catch(() => {}); await shot(s);
    return Object.assign(await facts(), { firstCardMs: first });
  }, true);

  await step('story', async s => storyTour(s, 3));

  await step('scroll', async s => { /* run 4 ended this step with a story open: record when that happens, then close it so later steps can go on */ const rd = () => page.evaluate(() => !!document.querySelector('#rd.on')), log = [(await page.evaluate(TRACE), await trace(), await rd())]; for (let i = 0; i < 3; i++) { await swipe(.5, .8, .5, .25, 160); log.push(await rd()) } await shot(s); const f = await facts(); f.readerAfterEachSwipe = log; f.trace = await trace(); if (f.reader) { s.ok = false; s.error = 'a story was open after scrolling the list: ' + JSON.stringify(log); await back().catch(() => {}) } return f });

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
      await sx('wm size 884x1104'); await sx('wm density 160'); await sleep(3500); await page.evaluate(() => scrollTo(0, 0));
      /* run 12: three stories turned with the curl, then the emulator died again. So: a feed with large pictures (whole-screen covers need 1600px+), its first five stories turned flat first (curl off), then the same five with the curl. If only the curl half kills the emulator, the strip copies are the heavy part */
      /* run 23: this step ran in the Halcyon theme (an earlier step's restart brought back a stored theme), so no story opened with a whole-screen or sliding cover: those belong to Dynamic */ await page.evaluate(() => { S.theme = 'dynamic'; applyTheme(); render() }); await sleep(1500);
      s.feedPicked = await page.evaluate(() => { const f = S.feeds.find(f => /verge/i.test(JSON.stringify(f))); if (!f) return null; S.sel = 's:' + f.id; render(); scrollTo(0, 0); return f.id }); await sleep(2500);
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

  R.crashes = (await sx('logcat -d -b crash -t 300').catch(() => '')).split('\n').filter(l => /cypress|FATAL|AndroidRuntime/i.test(l)).slice(0, 40);
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(R, null, 1));
  const bad = R.steps.filter(s => !s.ok).length;
  console.log(bad ? 'FAILED ' + bad + ' of ' + R.steps.length : 'all ' + R.steps.length + ' steps ok');
  await dev.close(); process.exit(bad || R.crashes.length ? 1 : 0);
})().catch(e => { console.error('FAIL device run: ' + (e && e.stack || e)); process.exit(1) });
