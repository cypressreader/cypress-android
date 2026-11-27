#!/usr/bin/env node
/* UserPromptSubmit hook. Replaces scripts/turn-counter.js (removed 2026-11-26).
   The old one counted David's messages and, from message 8 on, ordered a hard stop on EVERY message -
   an arbitrary deadline that fought the rest of the session and measured nothing real.
   What is actually at risk is unsaved work, so that is what this measures: unpushed commits, and a
   HANDOFF.md that has drifted from what is committed. It says nothing at all when there is nothing to
   say, so on a normal turn it costs no tokens. It never orders a stop; the wrap-up is David's call. */
'use strict';
const fs = require('fs'), path = require('path');
const sh = c => { try { return require('child_process').execSync(c, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() } catch (e) { return '' } };
let raw = ''; process.stdin.on('data', d => raw += d).on('end', () => {
  const out = [];
  try {
    let sid = 'x'; try { sid = String(JSON.parse(raw).session_id || 'x') } catch (e) {}
    const f = path.join(process.env.CLAUDE_PROJECT_DIR || process.cwd(), '.git', 'turn-counter.json');
    let s = { sid: '', n: 0 }; try { s = JSON.parse(fs.readFileSync(f, 'utf8')) } catch (e) {}
    if (s.sid !== sid) s = { sid, n: 0 };
    s.n++; try { fs.writeFileSync(f, JSON.stringify(s)) } catch (e) {}

    const br = sh('git rev-parse --abbrev-ref HEAD');
    const onBranch = br && !/^(main|master|HEAD)$/.test(br);
    /* work that exists only in this container */
    const ahead = (sh('git rev-list --count @{u}..HEAD') || '').match(/^\d+$/) ? Number(sh('git rev-list --count @{u}..HEAD')) : (onBranch && !sh('git rev-parse --abbrev-ref @{u}') ? -1 : 0);
    const dirty = sh('git status --porcelain -- HANDOFF.md').length > 0;
    if (ahead > 0) out.push(ahead + ' commit' + (ahead > 1 ? 's' : '') + ' on `' + br + '` not pushed yet.');
    if (ahead === -1) out.push('`' + br + '` has no upstream, so nothing is pushed: `git push -u origin ' + br + '`.');
    if (dirty) out.push('HANDOFF.md has uncommitted edits.');
    /* a genuinely long session: a nudge, not a deadline */
    if (s.n >= 30 && s.n % 10 === 0) out.push('Message ' + s.n + ' of this session. If we are mid-task, check HANDOFF.md still says where we are.');
  } catch (e) {}
  if (out.length) console.log('[session-guard] ' + out.join(' ') + ' (Nothing to stop for - this is a note, not a deadline.)');
});
