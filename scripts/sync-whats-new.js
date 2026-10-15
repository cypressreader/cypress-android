#!/usr/bin/env node
/* Keeps the What's New dialog in step with whats-new.txt.
   whats-new.txt is the one place release notes are written. This copies the bullets of the section for the current
   APP_LABEL (then the sections just below it) into the CHANGES list the dialog shows, in www/index.html and docs/app/index.html.
   Run it after editing whats-new.txt:  node scripts/sync-whats-new.js        (add --check to only report a mismatch) */
'use strict';
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..'), check = process.argv.includes('--check');
const files = ['www/index.html', 'docs/app/index.html'].map(f => path.join(root, f));
const notes = fs.readFileSync(path.join(root, 'whats-new.txt'), 'utf8').split('\n');
const html = fs.readFileSync(files[0], 'utf8');
const label = (html.match(/const APP_LABEL='([^']+)'/) || [])[1];
if (!label) { console.error('APP_LABEL not found'); process.exit(1); }
let i = notes.findIndex(l => l.trim() === label);
if (i < 0) { console.error('whats-new.txt has no section "' + label + '". Add one (see CLAUDE.md, Versioning).'); process.exit(1); }
const bullets = [];
for (let j = i + 1; j < notes.length && bullets.length < 8; j++) {
  const l = notes[j];
  if (/^\d+\.\d+[a-z]?$/.test(l.trim())) { if (!bullets.length) continue; }
  const m = /^-\s+(.*\S)\s*$/.exec(l); if (m) bullets.push(m[1]);
}
if (!bullets.length) { console.error('Section "' + label + '" has no bullets.'); process.exit(1); }
const lit = 'const CHANGES=' + JSON.stringify(bullets) + ';';
let bad = 0;
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8'), m = /const CHANGES=\[[\s\S]*?\];/.exec(s);
  if (!m) { console.error('CHANGES not found in ' + f); process.exit(1); }
  if (m[0] === lit) continue;
  if (check) { console.error(path.relative(root, f) + ': What\'s New dialog is out of date. Run: node scripts/sync-whats-new.js'); bad = 1; continue; }
  fs.writeFileSync(f, s.replace(m[0], () => lit));
  console.log('updated CHANGES in ' + path.relative(root, f) + ' (' + bullets.length + ' notes for ' + label + ')');
}
process.exit(bad);
