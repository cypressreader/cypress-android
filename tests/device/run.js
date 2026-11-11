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
const ONLY = (process.env.STEPS || '').split(',').map(x => x.trim()).filter(Boolean);
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
  const launch = async () => { await sx(`monkey -p ${PKG} -c android.intent.category.LAUNCHER 1`); await sleep(1500) };
  /* a phone setting that rebuilds the screen (text size, dark phone) closes the page handle: start the app again and take a new one */
  const restart = async () => { await sx(`am force-stop ${PKG}`); await sleep(800); await launch(); await attach(); await page.waitForSelector('#grid .card', { timeout: 60000 }); await sleep(2500) };
  const facts = () => page.evaluate(() => ({ w: innerWidth, h: innerHeight, dpr: devicePixelRatio, sideways: document.documentElement.scrollWidth > innerWidth + 1, cards: document.querySelectorAll('#grid .card').length, theme: document.documentElement.getAttribute('data-theme') || '', reader: !!document.querySelector('#rd.on') }));
  const swipe = async (x1, y1, x2, y2, ms = 220) => { const [w, h] = await page.evaluate(() => [innerWidth * devicePixelRatio, innerHeight * devicePixelRatio]); await sx(`input swipe ${Math.round(w * x1)} ${Math.round(h * y1)} ${Math.round(w * x2)} ${Math.round(h * y2)} ${ms}`); await sleep(1600) };
  const openStory = async (i = 0) => { await page.locator('#grid .card').nth(i).click({ timeout: 15000 }); await page.waitForSelector('#rd.on', { timeout: 15000 }); await sleep(6000) };
  const back = async () => { await sx('input keyevent 4'); await page.waitForFunction(() => !document.querySelector('#rd.on'), null, { timeout: 8000 }) };
  const storyTour = async (s, turns = 2, i = 0) => { await openStory(i); await shot(s, 'story'); for (let i = 1; i <= turns; i++) { await swipe(.85, .5, .15, .5); await shot(s, 'turn' + i) } const f = await facts(); await back(); return f };
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

  await step('scroll', async s => { for (let i = 0; i < 3; i++) await swipe(.5, .8, .5, .25, 160); await shot(s); return facts() });

  await step('themes', async s => {
    const out = {};
    for (const t of ['halcyon', 'press', 'oled']) {
      await page.evaluate(t => { S.theme = t; applyTheme(); render() }, t); await sleep(1500);
      await page.evaluate(() => scrollTo(0, 0)); await shot(s, t); out[t] = await storyTour({ name: s.name + '-' + t, shots: s.shots }, 1, 1);
    }
    await page.evaluate(() => { S.theme = 'dynamic'; applyTheme(); render() }); return out;
  });

  /* other screens on the same emulator: Fold cover (411x902), Fold open (884x1104), then the open Fold turned sideways */
  await step('sizes', async s => {
    const out = {};
    try {
      for (const [name, w, h, d] of [['foldcover', 904, 1984, 352], ['foldopen', 1768, 2208, 320]]) {
        await sx(`wm size ${w}x${h}`); await sx(`wm density ${d}`); await sleep(3500);
        await page.evaluate(() => scrollTo(0, 0)); await shot(s, name); out[name] = await storyTour({ name: s.name + '-' + name, shots: s.shots }, 2, 2); out[name + '2'] = await storyTour({ name: s.name + '-' + name + '-b', shots: s.shots }, 2, 3);
      }
      await sx('settings put system accelerometer_rotation 0'); await sx('settings put system user_rotation 1'); await sleep(3500);
      await shot(s, 'sideways'); out.sideways = await storyTour({ name: s.name + '-sideways', shots: s.shots }, 2);
    } finally { await sx('settings put system user_rotation 0'); await sx('wm size reset'); await sx('wm density reset'); await sleep(3000) }
    return out;
  });

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

  R.crashes = (await sx('logcat -d -b crash -t 300').catch(() => '')).split('\n').filter(l => /cypress|FATAL|AndroidRuntime/i.test(l)).slice(0, 40);
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(R, null, 1));
  const bad = R.steps.filter(s => !s.ok).length;
  console.log(bad ? 'FAILED ' + bad + ' of ' + R.steps.length : 'all ' + R.steps.length + ' steps ok');
  await dev.close(); process.exit(bad || R.crashes.length ? 1 : 0);
})().catch(e => { console.error('FAIL device run: ' + (e && e.stack || e)); process.exit(1) });
