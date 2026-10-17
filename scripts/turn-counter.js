#!/usr/bin/env node
/* UserPromptSubmit hook: counts the user's messages in this session and, from turn 8 on, tells Claude to save HANDOFF.md and show the checkpoint banner.
   The count lives in .git/turn-counter.json (never committed) and restarts whenever the session id changes. Output goes to Claude as extra context. */
'use strict';
const fs = require('fs'), path = require('path');
let raw = ''; process.stdin.on('data', d => raw += d).on('end', () => {
  let sid = 'x'; try { sid = String(JSON.parse(raw).session_id || 'x'); } catch (e) {}
  const f = path.join(process.cwd(), '.git', 'turn-counter.json');
  let s = { sid: '', n: 0 }; try { s = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) {}
  if (s.sid !== sid) s = { sid, n: 0 };
  s.n++; try { fs.writeFileSync(f, JSON.stringify(s)); } catch (e) {}
  let br = ''; try { br = require('child_process').execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch (e) {}
  const onBranch = br && br !== 'main' && br !== 'master' && br !== 'HEAD';
  if (s.n >= 8) {
    console.log('[turn-counter] This is message ' + s.n + ' of this session. Per CLAUDE.md section 4: finish the current step, update HANDOFF.md on disk (Active state, Next 3 tasks, Dead ends) and commit it, then STOP and show the "🛑 WEEKLY QUOTA CHECKPOINT: START A NEW SESSION 🛑" banner with the copy-ready handoff block. Do not start new work after the banner.' + (onBranch ? ' We are on working branch `' + br + '`, so put this exact copy line at the very top of the banner, in a code fence: Checkout branch ' + br + ', read CLAUDE.md and HANDOFF.md, and Continue.' : ''));
  }
});
