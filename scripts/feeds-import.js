/* Import MJ's tested feed sweep into the app as a SEARCH-ONLY reference list.
 *
 * David, 2026-11-27: "I'm not saying add them as buttons people can push adding a site, but when people
 * search for a site to add we have these as reference."
 *
 * So these do NOT go into CATY. CATY is the browsable catalogue - the categories you tap through - and
 * adding 700 publishers to it would turn that into a phone book. These go into `CATX`, a flat list that is
 * only ever reached by typing in the Add a site box, and only then: it is unpacked inside `fidx()`, which
 * the app builds on the first search and never at startup. Nothing is paid for until somebody searches.
 *
 * WHAT GETS IN, out of the 1,245 feeds that passed:
 *   - one feed per publisher, not all of them. 149 domains in the sweep carry up to TWENTY section feeds
 *     each (rt.com, tribuneindia.com, mid-day.com). Somebody typing "mid-day" wants Mid-Day, once.
 *   - the best feed for that publisher: one whose pictures were verified first, then the shortest, most
 *     home-like address.
 *   - nothing already in CATY, by host. The built-in catalogue covers 247 of the sweep's 703 publishers.
 *
 * NAME: CATW, not CATX - `CATX` is already a small hand-added extension to the BROWSABLE catalogue, and
 * reusing the name redeclared it and broke the whole script. Check a name is free before taking it.
 *
 * The image flag is kept on each line because the World Edition needs it: a page goes bare when no
 * photograph passes, and this records which publishers' pictures actually load.
 *
 * THE LIST IS A SUGGESTION, NOT A PROMISE. The sweep ran from a data centre: feeds that failed there can
 * work from a phone, and a couple that passed are metered. The app's own reader is still the final word,
 * which is why these are offered for searching and never added silently.
 *
 *   node scripts/feeds-import.js <sweep.md>            # report what it would add
 *   node scripts/feeds-import.js <sweep.md> --write    # write CATX into www/index.html
 */
const fs = require('fs'), path = require('path');
const SRC = process.argv[2], WRITE = process.argv.includes('--write');
const APP = path.resolve(__dirname, '../www/index.html');
if (!SRC) { console.error('give me the sweep markdown'); process.exit(1) }

/* the sweep's own categories, mapped onto the app's. They are only ever shown as "adds to ..." on a result. */
const CATMAP = {
  'World / International': 'News', 'Politics & Society': 'News', 'Local News': 'News', 'Opinion': 'News',
  'Business & Economy': 'Business', 'Science & Technology': 'Science', 'Sports': 'Sports',
  'Lifestyle & Culture': 'Lifestyle', 'Other': 'News'
};

/* The registrable domain, so that feeds.npr.org and npr.org are one publisher - the first cut of this
   compared whole hostnames and let NPR, Fortune, ProPublica and a dozen others in a second time, which
   tests/feed_search.js caught as duplicates. The second-level list is the usual suspects (.co.uk, .ac.za,
   .gov.uk ...); without it `wiser.wits.ac.za` is named "AC". */
const TWO = /\.(co|com|org|net|gov|edu|ac|govt|sch|or|ne|go|in|id)\.[a-z]{2,3}$/;
const regd = h => { h = String(h).replace(/^www\./, ''); const parts = h.split('.');
  return parts.slice(TWO.test(h) ? -3 : -2).join('.') };
const md = fs.readFileSync(SRC, 'utf8');
const rows = []; let cat = '';
for (const line of md.split('\n')) {
  const h = line.match(/^### (.+?) \(/); if (h) { cat = h[1]; continue }
  const m = line.match(/^- \*\*(.+?)\*\* — (\S+) — avgLen (\d+) — images (accessible|not accessible|not verified)/);
  if (m) rows.push({ cat: CATMAP[cat] || 'News', dom: m[1].replace(/^www\./, ''), url: m[2], img: m[4] === 'accessible' });
}

/* what the app already carries, by host: CATY is the browsable catalogue and must not be duplicated */
const app = fs.readFileSync(APP, 'utf8');
const caty = app.match(/const CATY=\[[\s\S]*?\n\];/);
if (!caty) { console.error('could not find CATY in the app'); process.exit(1) }
/* EVERY publisher the app already knows, from anywhere in the file - not just CATY. The first cut checked
   CATY alone and offered ProPublica, Bellingcat, ICIJ, Fortune, Lifehacker and Entrepreneur a second time,
   because those live in the starter PACKS; tests/feed_search.js caught it as "listed twice in one folder".
   Any address in the app counts: a publisher we already carry anywhere must never come back as a suggestion. */
const have = new Set();
{ const scan = app.replace(/const CATW='[^']*';/, '');
  for (const m of scan.matchAll(/https?:\/\/[^"'\s)]+/g)) { try { have.add(regd(new URL(m[0]).hostname)) } catch (e) {} } }
const haveName = new Set();
for (const m of caty[0].matchAll(/"(https?:\/\/[^"]+)"/g)) { try { have.add(regd(new URL(m[1]).hostname)) } catch (e) {} }
/* also by NAME: two different addresses can carry the same publisher, and a result list with "Fortune" twice
   is a bug a reader sees before any of us do */
for (const m of caty[0].matchAll(/\[\s*"[^"]*",\s*"([^"]+)"/g)) haveName.add(m[1].toLowerCase());

/* one feed per publisher: pictures that load first, then the shortest and most home-like address */
const score = r => (r.img ? 0 : 100) + r.url.split('/').length + (/\/(rss|feed|index)(\.xml|\.rss)?\/?$/i.test(r.url) ? -2 : 0) + r.url.length / 1000;
const best = new Map();
for (const r of rows) { r.rd = regd(r.dom); if (have.has(r.rd)) continue;
  const b = best.get(r.rd); if (!b || score(r) < score(b)) best.set(r.rd, r) }

/* a name a person would recognise, from the domain. Short stems are initialisms (npr -> NPR, bbc -> BBC);
   longer ones are title-cased on their own hyphens (mid-day -> Mid-Day). The publisher's real name arrives
   with the first fetch; this only has to be good enough to recognise in a list. */
const nameOf = d => {
  const stem = regd(d).split('.')[0];
  const up = w => w.charAt(0).toUpperCase() + w.slice(1);
  if (/^[a-z]{2,4}$/.test(stem)) return stem.toUpperCase();              /* npr -> NPR, bbc -> BBC */
  if (/^[a-z]{2,5}\d{1,3}$/.test(stem)) return stem.toUpperCase();        /* abc15 -> ABC15, wsbt22 -> WSBT22 */
  if (/^\d{1,3}[a-z]{2,}$/.test(stem)) return stem.replace(/^(\d+)(.*)$/, (m, n, w) => n + up(w)); /* 10news -> 10News */
  return stem.split('-').map(up).join('-');
};

const used = new Set();
const out = [...best.values()].sort((a, b) => a.rd.localeCompare(b.rd))
  .map(r => ({ n: nameOf(r.dom), r }))
  .filter(x => { const k = x.n.toLowerCase();
    if (haveName.has(k) || used.has(k)) return false;   /* never the same name twice in one list of results */
    used.add(k); return true })
  .map(x => [x.n, x.r.url, x.r.cat, x.r.img ? 1 : 0].join('|'));

const withImg = out.filter(l => l.endsWith('|1')).length;
console.log(`${rows.length} feeds in the sweep, ${new Set(rows.map(r => r.dom)).size} publishers`);
console.log(`${out.length} added (${withImg} with pictures that load), ${new Set(rows.map(r => r.dom)).size - out.length} already in the catalogue`);
console.log(`${(out.join('\n').length / 1024).toFixed(1)} KB of list`);
console.log('first five: ' + out.slice(0, 5).join('   '));

if (!WRITE) { console.log('\nnothing written (pass --write)'); process.exit(0) }

const BLOCK = `/* MJ's tested sweep of the top 1,000 news domains (2026-11-26): one feed per publisher, SEARCH ONLY.
   These are deliberately NOT in CATY - the browsable categories stay the size a person can tap through, and
   these surface only when somebody types in Add a site. Unpacked in fidx(), which is built on the first
   search, so none of this is parsed at startup. Each line: name|feed|category|pictures load.
   A line is a suggestion, not a promise: the sweep ran from a data centre, and the reader is the final word.
   Regenerate with scripts/feeds-import.js. */
const CATW='${out.join('\\n').replace(/'/g, "\\'")}';`;

let s = app;
const old = s.match(/\/\* MJ's tested sweep[\s\S]*?\nconst CATW='[^']*';/);
if (old) s = s.replace(old[0], BLOCK);
else {
  const anchor = "const CATY=[";
  const i = s.indexOf(anchor);
  if (i < 0) { console.error('could not place CATX'); process.exit(1) }
  s = s.slice(0, i) + BLOCK + '\n' + s.slice(i);
}
fs.writeFileSync(APP, s);
console.log('written into www/index.html');
