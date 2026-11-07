/* Builds deliberately awkward EPUBs for the messy-book sweep (tests/book_messy.js).
   Nothing is committed as a binary: every file is written fresh into a temp folder at test time, so the
   cases stay readable and legal (no real books). Each case says what the app is expected to do with it. */
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib');

/* --- the smallest zip writer that zipIndex() can read: local headers, central directory, EOCD --- */
const TBL = (() => { const t = new Int32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c } return t })();
const crc32 = b => { let c = -1; for (let i = 0; i < b.length; i++) c = TBL[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ -1) >>> 0 };

function zip(entries) {
  const loc = [], cen = []; let off = 0;
  for (const e of entries) {
    const name = Buffer.from(e.name, 'utf8'), raw = Buffer.isBuffer(e.data) ? e.data : Buffer.from(e.data, 'utf8');
    const store = !!e.store, body = store ? raw : zlib.deflateRawSync(raw), crc = crc32(raw);
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0, 6); lh.writeUInt16LE(store ? 0 : 8, 8);
    lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(body.length, 18); lh.writeUInt32LE(raw.length, 22); lh.writeUInt16LE(name.length, 26);
    loc.push(lh, name, body);
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(store ? 0 : 8, 10);
    ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(body.length, 20); ch.writeUInt32LE(raw.length, 24); ch.writeUInt16LE(name.length, 28);
    ch.writeUInt32LE(off, 42);
    cen.push(ch, name);
    off += 30 + name.length + body.length;
  }
  const cd = Buffer.concat(cen), lo = Buffer.concat(loc), eo = Buffer.alloc(22);
  eo.writeUInt32LE(0x06054b50, 0); eo.writeUInt16LE(entries.length, 8); eo.writeUInt16LE(entries.length, 10);
  eo.writeUInt32LE(cd.length, 12); eo.writeUInt32LE(lo.length, 16);
  return Buffer.concat([lo, cd, eo]);
}

/* --- small builders for the bits every case needs --- */
const CONT = p => `<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="${p}" media-type="application/oebps-package+xml"/></rootfiles></container>`;
const page = (title, body) => `<?xml version="1.0" encoding="utf-8"?><!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml"><head><title>${title}</title></head><body>${body}</body></html>`;
const prose = (n, seed) => { const out = []; for (let i = 0; i < n; i++) out.push(`<p>Paragraph ${i + 1} of ${seed}. ` + 'The quick brown fox jumps over the lazy dog. '.repeat(6) + '</p>'); return out.join('') };
const chap = (t, n, seed) => page(t, `<h1>${t}</h1>` + prose(n, seed || t));
/* a 1x1 png, so cover handling has something real to store */
const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6300010000050001' + '0d0a2db40000000049454e44ae426082', 'hex');

const opf = ({ items, spine, meta = '', toc = '', ver = '3.0' }) => `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="${ver}" unique-identifier="bid">
 <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
  <dc:identifier id="bid">urn:uuid:messy-${Math.random().toString(36).slice(2)}</dc:identifier>
  ${meta}
 </metadata>
 <manifest>${items}</manifest>
 <spine${toc ? ` toc="${toc}"` : ''}>${spine}</spine>
</package>`;
const nav = hrefs => page('Contents', '<nav epub:type="toc" xmlns:epub="http://www.idpf.org/2007/ops"><ol>' + hrefs.map(([h, t]) => `<li><a href="${h}">${t}</a></li>`).join('') + '</ol></nav>');
const ncx = hrefs => `<?xml version="1.0" encoding="utf-8"?><ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1"><navMap>` +
  hrefs.map(([h, t], i) => `<navPoint id="n${i}" playOrder="${i + 1}"><navLabel><text>${t}</text></navLabel><content src="${h}"/></navPoint>`).join('') + `</navMap></ncx>`;

/* --- the cases. `expect` is what tests/book_messy.js asserts. --- */
const CASES = [];
const add = (name, expect, entries) => CASES.push({ name, expect, build: () => zip(entries()) });
const MIME = { name: 'mimetype', data: 'application/epub+zip', store: true };

/* 1. An EPUB 2 book: no nav document at all, chapter names only in the old toc.ncx. */
add('epub2-ncx-only', { opens: true, chapters: 3, firstTitle: 'The Road North' }, () => [MIME,
  { name: 'META-INF/container.xml', data: CONT('OEBPS/content.opf') },
  { name: 'OEBPS/content.opf', data: opf({
    ver: '2.0', toc: 'ncx',
    meta: '<dc:title>An Older Book</dc:title><dc:creator>A. Writer</dc:creator><dc:language>en</dc:language>',
    items: '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/><item id="c1" href="c1.xhtml" media-type="application/xhtml+xml"/><item id="c2" href="c2.xhtml" media-type="application/xhtml+xml"/><item id="c3" href="c3.xhtml" media-type="application/xhtml+xml"/>',
    spine: '<itemref idref="c1"/><itemref idref="c2"/><itemref idref="c3"/>' }) },
  { name: 'OEBPS/toc.ncx', data: ncx([['c1.xhtml', 'The Road North'], ['c2.xhtml', 'The Road South'], ['c3.xhtml', 'Home Again']]) },
  { name: 'OEBPS/c1.xhtml', data: page('x', prose(12, 'one')) },
  { name: 'OEBPS/c2.xhtml', data: page('x', prose(12, 'two')) },
  { name: 'OEBPS/c3.xhtml', data: page('x', prose(12, 'three')) }]);

/* 2. Chapters buried in folders, reached with ../ paths from a package file that is itself nested. */
add('nested-paths', { opens: true, chapters: 2, firstTitle: 'Down a Level' }, () => [MIME,
  { name: 'META-INF/container.xml', data: CONT('pkg/meta/content.opf') },
  { name: 'pkg/meta/content.opf', data: opf({
    meta: '<dc:title>Deep Folders</dc:title><dc:creator>B. Writer</dc:creator><dc:language>en</dc:language>',
    items: '<item id="nav" href="../nav.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="c1" href="../text/ch/one.xhtml" media-type="application/xhtml+xml"/><item id="c2" href="../text/ch/two.xhtml" media-type="application/xhtml+xml"/>',
    spine: '<itemref idref="c1"/><itemref idref="c2"/>' }) },
  { name: 'pkg/nav.xhtml', data: nav([['text/ch/one.xhtml', 'Down a Level'], ['text/ch/two.xhtml', 'Deeper Still']]) },
  { name: 'pkg/text/ch/one.xhtml', data: page('x', prose(10, 'nested one')) },
  { name: 'pkg/text/ch/two.xhtml', data: page('x', prose(10, 'nested two')) }]);

/* 3. Every entry stored uncompressed (some older tools do this), plus a cover image. */
add('stored-uncompressed', { opens: true, chapters: 2, cover: true }, () => [MIME,
  { name: 'META-INF/container.xml', data: CONT('content.opf'), store: true },
  { name: 'content.opf', store: true, data: opf({
    meta: '<dc:title>Nothing Compressed</dc:title><dc:creator>C. Writer</dc:creator><dc:language>en</dc:language>',
    items: '<item id="cov" href="cover.png" media-type="image/png" properties="cover-image"/><item id="c1" href="c1.xhtml" media-type="application/xhtml+xml"/><item id="c2" href="c2.xhtml" media-type="application/xhtml+xml"/>',
    spine: '<itemref idref="c1"/><itemref idref="c2"/>' }) },
  { name: 'cover.png', data: PNG, store: true },
  { name: 'c1.xhtml', data: chap('Flat One', 10), store: true },
  { name: 'c2.xhtml', data: chap('Flat Two', 10), store: true }]);

/* 4. A spine entry pointing at a file that is not in the book: the rest must still open. */
add('broken-spine-href', { opens: true, chapters: 2 }, () => [MIME,
  { name: 'META-INF/container.xml', data: CONT('content.opf') },
  { name: 'content.opf', data: opf({
    meta: '<dc:title>One Chapter Missing</dc:title><dc:creator>D. Writer</dc:creator><dc:language>en</dc:language>',
    items: '<item id="c1" href="c1.xhtml" media-type="application/xhtml+xml"/><item id="gone" href="not-here.xhtml" media-type="application/xhtml+xml"/><item id="c2" href="c2.xhtml" media-type="application/xhtml+xml"/>',
    spine: '<itemref idref="c1"/><itemref idref="gone"/><itemref idref="c2"/><itemref idref="never-declared"/>' }) },
  { name: 'c1.xhtml', data: chap('Still Here', 10) },
  { name: 'c2.xhtml', data: chap('Also Here', 10) }]);

/* 5. One enormous chapter: the reader must split it instead of laying out 12,000 words at once. */
add('one-huge-chapter', { opens: true, minChapters: 2, splitParts: true }, () => [MIME,
  { name: 'META-INF/container.xml', data: CONT('content.opf') },
  { name: 'content.opf', data: opf({
    meta: '<dc:title>All In One Go</dc:title><dc:creator>E. Writer</dc:creator><dc:language>en</dc:language>',
    items: '<item id="c1" href="c1.xhtml" media-type="application/xhtml+xml"/>',
    spine: '<itemref idref="c1"/>' }) },
  { name: 'c1.xhtml', data: chap('The Long Middle', 320) }]);

/* 6. No cover declared anywhere: the shelf must cope without one. */
add('no-cover', { opens: true, chapters: 1, cover: false }, () => [MIME,
  { name: 'META-INF/container.xml', data: CONT('content.opf') },
  { name: 'content.opf', data: opf({
    meta: '<dc:title>Plain Shelf</dc:title><dc:creator>F. Writer</dc:creator><dc:language>en</dc:language>',
    items: '<item id="c1" href="c1.xhtml" media-type="application/xhtml+xml"/>',
    spine: '<itemref idref="c1"/>' }) },
  { name: 'c1.xhtml', data: chap('Only Chapter', 10) }]);

/* 7. Hidden (obfuscated) fonts, which is NOT copy protection: the book must still open. */
add('font-obfuscation-only', { opens: true, chapters: 1 }, () => [MIME,
  { name: 'META-INF/container.xml', data: CONT('content.opf') },
  { name: 'META-INF/encryption.xml', data: '<?xml version="1.0"?><encryption xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><EncryptedData><CipherData><CipherReference URI="fonts/body.otf"/></CipherData></EncryptedData></encryption>' },
  { name: 'content.opf', data: opf({
    meta: '<dc:title>Locked Fonts Only</dc:title><dc:creator>G. Writer</dc:creator><dc:language>en</dc:language>',
    items: '<item id="c1" href="c1.xhtml" media-type="application/xhtml+xml"/>',
    spine: '<itemref idref="c1"/>' }) },
  { name: 'c1.xhtml', data: chap('Readable', 10) }]);

/* 8. Locked chapters: real store copy protection, and the message must say so plainly. */
add('drm-locked-chapters', { opens: false, says: /copy-protected/i }, () => [MIME,
  { name: 'META-INF/container.xml', data: CONT('content.opf') },
  { name: 'META-INF/encryption.xml', data: '<?xml version="1.0"?><encryption xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><EncryptedData><CipherData><CipherReference URI="OEBPS/c1.xhtml"/></CipherData></EncryptedData></encryption>' },
  { name: 'content.opf', data: opf({
    meta: '<dc:title>Store Locked</dc:title><dc:language>en</dc:language>',
    items: '<item id="c1" href="c1.xhtml" media-type="application/xhtml+xml"/>', spine: '<itemref idref="c1"/>' }) },
  { name: 'c1.xhtml', data: chap('Unreachable', 10) }]);

/* 9. A fixed-page book (comic or picture book): unsupported, and it must say which kind it is. */
add('fixed-layout', { opens: false, says: /fixed pages/i }, () => [MIME,
  { name: 'META-INF/container.xml', data: CONT('content.opf') },
  { name: 'content.opf', data: opf({
    meta: '<dc:title>A Picture Book</dc:title><dc:language>en</dc:language><meta property="rendition:layout">pre-paginated</meta>',
    items: '<item id="c1" href="c1.xhtml" media-type="application/xhtml+xml"/>', spine: '<itemref idref="c1"/>' }) },
  { name: 'c1.xhtml', data: page('p1', '<div><img src="p1.png" alt=""/></div>') }]);

/* 10. Spine files that hold no words and no pictures: nothing readable to show. */
add('empty-chapters', { opens: false, says: /chapters/i }, () => [MIME,
  { name: 'META-INF/container.xml', data: CONT('content.opf') },
  { name: 'content.opf', data: opf({
    meta: '<dc:title>Blank Inside</dc:title><dc:language>en</dc:language>',
    items: '<item id="c1" href="c1.xhtml" media-type="application/xhtml+xml"/><item id="c2" href="c2.xhtml" media-type="application/xhtml+xml"/>',
    spine: '<itemref idref="c1"/><itemref idref="c2"/>' }) },
  { name: 'c1.xhtml', data: page('x', '<div>   </div>') },
  { name: 'c2.xhtml', data: page('x', '') }]);

/* 11. A zip that is not a book at all. */
add('zip-without-container', { opens: false, says: /EPUB/i }, () => [
  { name: 'readme.txt', data: 'Just some files in a zip.' },
  { name: 'notes/other.txt', data: 'Nothing book-shaped here.' }]);

/* 12. Not a zip in the first place (a renamed file). */
add('not-a-zip', { opens: false, says: /couldn.t be opened|EPUB/i }, () => [{ name: 'x', data: 'x' }]);
CASES[CASES.length - 1].build = () => Buffer.from('This is plain text with an .epub name on it. '.repeat(400), 'utf8');

/* 13. Chapter markup declared as Windows-1252 with bytes to match: accents must not turn to mojibake. */
add('windows-1252-text', { opens: true, chapters: 1, noMojibake: true }, () => {
  const body = '<?xml version="1.0" encoding="windows-1252"?><!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml"><head><title>x</title></head><body><h1>Caf\xe9 Chapter</h1><p>They met at the caf\xe9 in Z\xfcrich, na\xefve and early.</p>' + prose(10, 'accents') + '</body></html>';
  return [MIME,
    { name: 'META-INF/container.xml', data: CONT('content.opf') },
    { name: 'content.opf', data: opf({
      meta: '<dc:title>Accented</dc:title><dc:creator>H. Writer</dc:creator><dc:language>en</dc:language>',
      items: '<item id="c1" href="c1.xhtml" media-type="application/xhtml+xml"/>', spine: '<itemref idref="c1"/>' }) },
    { name: 'c1.xhtml', data: Buffer.from(body, 'latin1') }];
});

function writeAll(dir) {
  fs.mkdirSync(dir, { recursive: true });
  return CASES.map(c => { const p = path.join(dir, c.name + '.epub'); fs.writeFileSync(p, c.build()); return { ...c, file: p } });
}

module.exports = { CASES, writeAll, zip };
if (require.main === module) {
  const dir = process.argv[2] || path.join(require('os').tmpdir(), 'messy-epubs');
  for (const c of writeAll(dir)) console.log(fs.statSync(c.file).size.toString().padStart(8) + '  ' + path.basename(c.file));
  console.log('\nwrote ' + CASES.length + ' books to ' + dir);
}
