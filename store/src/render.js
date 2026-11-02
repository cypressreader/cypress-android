// Renders the Play Store art from store/src/shot.html into store/play/.
// Run from the repo root: (cd /path/to/repo && python3 -m http.server 8767 &) then node store/src/render.js
const { chromium } = require('playwright');
const path = require('path');
const OUT = path.join(__dirname, '..', 'play');
const B = 'http://localhost:8767/store/src/shot.html?';
const PHONE = [
  ['1-daily', 'Your news, made<br>into a magazine', 'A fresh edition every morning and evening, built from the sites you follow.', 'daily.png'],
  ['2-reader', 'Reading that<br>feels like print', 'Clean pages and beautiful type, with nothing in the way of the story.', 'reader.png'],
  ['3-all', 'Every site you love,<br>one calm place', 'Sorted, grouped and ready whenever you are.', 'phone-feed.jpg'],
  ['4-listen', 'Listen like<br>a podcast', 'Natural voices read any story aloud, with a player you can take anywhere.', 'player-now-playing.jpg'],
  ['5-themes', 'Make it<br>your own', 'Themes for every mood, from deep green to paper white.', 'rosewood.png,daily.png,eink.png'],
  ['6-private', 'Private<br>by design', 'No account and no tracking. Your reading stays on your phone.', 'privacy.png']
];
(async () => {
  const b = await chromium.launch();
  const go = async (w, h, url, file) => {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await p.goto(url); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
    await p.screenshot({ path: path.join(OUT, file) }); await p.close();
  };
  for (const [f, t, s, img] of PHONE) await go(1080, 1920, B + new URLSearchParams({ t, s, img }), 'phone-' + f + '.png');
  await go(1024, 500, B + new URLSearchParams({ cls: 'fg', img: 'daily.png,reader.png' }), 'feature-graphic-1024x500.png');
  await go(2560, 1600, B + new URLSearchParams({ cls: 'tab', t: 'Your sites, made into a magazine', img: 'tab-daily.png' }), 'tablet-1-daily.png');
  await go(2560, 1600, B + new URLSearchParams({ cls: 'tab', t: 'Reading that feels like print', img: 'tab-reader.png' }), 'tablet-2-reader.png');
  await b.close();
})();
