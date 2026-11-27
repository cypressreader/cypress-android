/* World Edition, pass 4c: write the clearance an eye has given, into the edition.
 *
 * David, 2026-11-27: "Can't we develop an AI or rules that do the eye picking for us? I mean if muse can do it
 * and it's an AI why can't we make something similar?" He is right, and most of it was already built: photos.js
 * lays every candidate out as a numbered contact sheet so the looking is one glance instead of forty, and the
 * twice-daily task is already a session that opens drawings and rejects them by written rules. The only piece
 * missing was the one that takes a verdict and writes it down. This is that piece.
 *
 * THE SIX MARKS AND WHAT THEY MEAN ARE AT THE TOP OF photos.js. Read them there; they are not repeated here,
 * because a rule written twice is a rule that drifts.
 *
 * HOW IT IS MEANT TO BE USED, and the order matters:
 *   1. photos.js writes photos.json (numbered candidates) and contact.png (the sheet).
 *   2. An eye - a session, MJ, David - OPENS contact.png and looks at every numbered picture.
 *   3. That eye writes a verdicts file: { "3": {"ok": true, "people": false},
 *                                         "7": {"ok": false, "why": "a crying relative at a graveside"} }
 *      `ok` means all six marks pass. Anything uncertain is `ok: false` with a reason - the bias is written
 *      into photos.js and it is not symmetric: a bare page is the correct outcome when in doubt.
 *   4. This writes the cleared ones into the edition and says what it did. A candidate marked `inline` by
 *      photos.js joins the story's `inline` list (the pictures inside a long read) instead of becoming its
 *      opener; the whole list is rewritten each run, so clearing the same picture twice cannot double it.
 *
 * IT REPORTS BY DEFAULT AND WRITES ONLY WITH --write. The first rounds are meant to be read by a person before
 * anything is written, which is how the drawings were introduced.
 *
 * WHAT IT REFUSES TO DO, so that a mistake upstream cannot become a published face:
 *   - no verdict for a number, or `ok` is not exactly true  -> not cleared;
 *   - a verdict for a number that is not in photos.json     -> an error, nothing is written;
 *   - a candidate whose story is not in the edition         -> skipped and named;
 *   - a candidate with no credit, or under 600px            -> not cleared, because the app would refuse it
 *     anyway and a mark that does nothing is a lie in the file.
 *
 *   node scripts/edition/clear.js --photos tmp/photos/photos.json --verdicts v.json
 *   node scripts/edition/clear.js --photos tmp/photos/photos.json --verdicts v.json --write
 */
const fs = require('fs'), path = require('path'), { ROOT } = require('./app');

const arg = n => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null };
const WRITE = process.argv.includes('--write');
const GIVEN = arg('--edition');
const EDITION = GIVEN || path.join(ROOT, 'world-edition.json');
const DOCS = path.resolve(__dirname, '../../docs/app/world-edition.json');
const PHOTOS = arg('--photos'), VERDICTS = arg('--verdicts');
const BY = arg('--by') || 'Claude, looked at each one';
const MARKS = ['logo', 'text', 'child', 'body', 'grief', 'mugshot'];
const SM = 600;

if (!PHOTOS || !VERDICTS) { console.error('need --photos photos.json and --verdicts v.json'); process.exit(1) }
const pj = JSON.parse(fs.readFileSync(PHOTOS, 'utf8'));
const vs = JSON.parse(fs.readFileSync(VERDICTS, 'utf8'));
const cands = new Map((pj.photos || []).map(p => [String(p.no), p]));

/* a verdict about a picture that is not on the sheet means the sheet and the looking have come apart: stop */
const stray = Object.keys(vs).filter(k => !cands.has(String(k)));
if (stray.length) { console.error('verdicts for pictures that are not in photos.json: ' + stray.join(', ') + ' - nothing written'); process.exit(1) }

const d = JSON.parse(fs.readFileSync(EDITION, 'utf8'));
const byLink = new Map();
for (const e of (d.editions || [d])) for (const s of (e.sections || [])) for (const st of (s.stories || [])) {
  if (!byLink.has(st.l)) byLink.set(st.l, []);
  byLink.get(st.l).push(st);
}

let cleared = 0, refused = 0, skipped = 0;
/* the pictures inside a story are collected first and written as one list, so a second run replaces that
   list rather than adding the same picture to it again */
const inside = new Map();
for (const [no, c] of cands) {
  const v = vs[no] || vs[String(no)];
  const name = '#' + no + ' ' + String(c.title || '').slice(0, 44);
  if (!v || v.ok !== true) { refused++; console.log('  --  ' + name + ': ' + ((v && v.why) || 'no verdict')); continue }
  if (!String(c.credit || '').trim()) { refused++; console.log('  --  ' + name + ': cleared, but it has no credit, so the app would refuse it'); continue }
  if (Math.max(+c.w || 0, +c.h || 0) < SM) { refused++; console.log('  --  ' + name + ': cleared, but it is only ' + c.w + 'x' + c.h); continue }
  const sts = byLink.get(c.link);
  if (!sts || !sts.length) { skipped++; console.log('  ??  ' + name + ': its story is not in the edition any more'); continue }
  const photo = { url: c.url, credit: String(c.credit).trim(), w: +c.w, h: +c.h, clear: MARKS.slice(), by: BY };
  if (v.people === false) photo.people = false;
  if (c.kind === 'inline') {
    photo.after = +c.after || 0;
    if (!inside.has(c.link)) inside.set(c.link, []);
    inside.get(c.link).push(photo);
  } else sts.forEach(st => { st.photo = photo });
  cleared++;
  console.log('  ok  ' + name + (c.kind === 'inline' ? '  (inside the story, after paragraph ' + photo.after + ')' : '')
    + (v.people === false ? '  (nobody identifiable)' : ''));
}

for (const [link, list] of inside) (byLink.get(link) || []).forEach(st => { st.inline = list });

console.log('\n' + cleared + ' cleared, ' + refused + ' not cleared' + (skipped ? ', ' + skipped + ' whose story has gone' : ''));
if (!WRITE) { console.log('nothing written (pass --write)'); process.exit(0) }
if (!cleared) { console.log('nothing to write'); process.exit(0) }
/* the rev stamp, or the correction never travels to a phone that already holds today's issue */
d.rev = new Date().toISOString();
fs.writeFileSync(EDITION, JSON.stringify(d, null, 1));
/* Only mirror into the DEPLOYED copy when we are writing the default edition. With an explicit --edition
   this must not touch docs/app: a test run of clear.js with a four-story fixture replaced the live 33-story
   edition in the working tree on 27 Nov, and only the uncommitted-changes hook caught it before it was pushed. */
if (!GIVEN && fs.existsSync(DOCS)) fs.writeFileSync(DOCS, JSON.stringify(d, null, 1));
console.log('written, issue stamped ' + d.rev);
