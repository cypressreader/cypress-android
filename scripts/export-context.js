#!/usr/bin/env node
/* Splits the one-file app (www/index.html) into plain css, html and js files and writes debug.json, a map of
   every top-level symbol with its line number. The split files are a READ-ONLY copy for people and tools that
   want smaller pieces: www/index.html stays the source of truth and is never changed by this script.
   Usage: node scripts/export-context.js [outDir]   (default: context/)
   The build runs it on every build and keeps the result with the build. */
'use strict';
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const out = path.resolve(root, process.argv[2] || 'context');
const src = fs.readFileSync(path.join(root, 'www', 'index.html'), 'utf8');
const lineOf = i => src.slice(0, i).split('\n').length;

/* the <style> blocks, the inline <script> blocks, and what is left (the markup) */
const css = [], js = [], blocks = [];
let html = src.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (m, body, off) => { css.push({ body, line: lineOf(off) }); return '<!-- style: see app.css -->'; });
html = html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (m, attrs, body, off) => {
  if (/\bsrc\s*=/.test(attrs) || /type\s*=\s*["'](?!module|text\/javascript)/i.test(attrs)) return m;
  js.push({ body, line: lineOf(off) }); return '<!-- script: see app.js -->';
});
const join = parts => parts.map(p => '/* from www/index.html line ' + p.line + ' */\n' + p.body.replace(/^\n/, '')).join('\n');
const jsText = join(js), cssText = join(css);

/* top-level symbols of the script, with the line in app.js and the line in www/index.html */
const symbols = [];
const re = /^(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)|^(?:const|let|var)\s+([A-Za-z_$][\w$]*)/;
let lineNo = 0;
for (const part of js) {
  const lines = part.body.split('\n');
  lines.forEach((ln, i) => {
    const m = re.exec(ln); if (!m) return;
    symbols.push({ name: m[1] || m[2], kind: m[1] ? 'function' : 'variable', appJsLine: lineNo + i + 2, indexHtmlLine: part.line + i });
  });
  lineNo += lines.length + 1;
}
/* CSS: counts, and the line of each theme block */
const themes = {}; { const r = /:root\[data-theme=([a-z0-9]+)\]\{/g; let m; while ((m = r.exec(src))) if (!themes[m[1]]) themes[m[1]] = lineOf(m.index); }
const ver = (src.match(/const APP_VERSION='([^']+)'/) || [])[1] || '', label = (src.match(/const APP_LABEL='([^']+)'/) || [])[1] || '';

fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'app.css'), cssText);
fs.writeFileSync(path.join(out, 'app.html'), html);
fs.writeFileSync(path.join(out, 'app.js'), jsText);
const debug = {
  generated: new Date().toISOString(), source: 'www/index.html', version: ver, label,
  files: { 'app.css': cssText.split('\n').length, 'app.html': html.split('\n').length, 'app.js': jsText.split('\n').length, 'index.html': src.split('\n').length },
  counts: { styleBlocks: css.length, scriptBlocks: js.length, symbols: symbols.length, themes: Object.keys(themes).length },
  themes, symbols,
};
fs.writeFileSync(path.join(out, 'debug.json'), JSON.stringify(debug, null, 1));
console.log('context written to ' + path.relative(root, out) + ': app.css, app.html, app.js, debug.json (' + symbols.length + ' symbols)');
