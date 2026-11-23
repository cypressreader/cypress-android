# HANDOFF — live session memory (read first, update silently after every finished task)
Old detail (dated session logs, FIXES 16-26 notes, debugging traces) lives in `HANDOFF-ARCHIVE.md`: don't read it on boot, `grep` it only if needed.
Keep THIS file under ~8 KB: when it grows past that, move finished/dated items to the archive and keep only rules, open items and the next tasks.

Last updated: 2026-11-23 (work branch claude/checkout-ccr-aefb8e60-idp0ts-2nkggp; main = 1.389). Do NOT push HANDOFF-only commits to main (every push to main starts an APK build).
## 1. Working & locked (verified; don't change core logic without asking)
- Locked looks for Halcyon, the Daily and Headlines (palette, `--disp` headlines, `sh()`/`DAYDEK`, shared front page): archive grep 'moved-1387d'. Don't change them without asking.
- **Story card size** Compact|Medium|Large drives `--csz`. Cards|Columns (wire) view exists only with Medium/Large + tiles (by design). Daily + Compact sets `data-cards="narrow"` on `#grid` (CSS needs both selectors). Wire "Cards" sets `data-w="mag"`.
- **No location**: no permission/geolocation code. "Near you" = typed place, up to 10 saved (`S.places`), `locLang`. `nUrl` keeps `q=/query=/search=`.
- Excerpts end on whole words (`trimWords`, `sumOf`). Opaque docked tab bar `#mtabs`; pull-to-refresh `#pts`; Search closes after keyboard.
- **Reader**: No spanning title block in paged reader. Justified text uses hyphens. "Aa" = bottom sheet (Theme/Font/Focus/Large print) from ... menu (`data-act="aa"`). "Why it matters" stays (`whyBox`, `COOKIEJ`).
- Site, privacy, demo (generated), tablet page: US spelling, no publisher names. Near you sends typed place to Google News/Bing News.
- Tests: see section 4 for current failures. Page-turn copies (`.tl,.tl-leaf`, pre-built next turn) are in the DOM while reading: tests that query the story must skip them (`!x.closest('.tl,.tl-leaf')`). Under -P3/-P4 load end_card, trend_strip, continuous can flake: rerun alone before blaming. Run long ones with `timeout 900`. Tests rewrite d7_*.png / sp/*.png screenshots: `git checkout` them, don't commit.

## 2. Rules & tooling
- David prefers testing in the app over the web preview: on a finished change, offer `build` rather than a preview.
- Single file `www/index.html`; hook copies to `docs/app/index.html` and rebuilds `docs/demo.html`. Don't read those copies.
- Fonts: Literata `--serif`, Cormorant `--fd`, `--disp` headlines. Theme vars `--bg --pn --ink --mut --ln --a1 --a2 --logo`. Photo cards white text on dark overlay.
- `#grid.list .card…` rules are strong; add `#grid.list` selectors, don't fight them. CSS-only fixes preferred; `fitPage1`/`fitHero`/`layout` are delicate.
- Preview: commit → push → `scripts/publish-preview.sh <branch>`. Apply briefs in THIS repo/branch.
- Release: on `build`: merge to `main`, label + `whats-new.txt` + workflow `APP_LABEL` in step.
- Shell edits (sed/python) to `www/index.html` BYPASS the copy hook: always `cp www/index.html docs/app/index.html && node scripts/build-demo.js` after them.
- Mistakes to avoid: version bump by sed line number (line moves; use the pattern and check), `pkill -f`; backgrounded `git stash`; test server dies between commands; port 8765 collisions; no `cypress-gemini-audit/`.

## 3. Dead ends (don't repeat)
- **'Flip through pages' magazine view (`mgp`)**: removed 2026-10-22 (commit 5256ada). Don't rebuild without brief.
- Perf dead ends (fixOrph in rAF, sticky `nv`, `cutOf` cache key, cheapening `endTurn`, read-ahead timer storm, preloading Inter, close-from-Daily tweaks), forced hero card in list view, shrinking feed photos <1600px, nested `<form>` in Add dialog, ABC News feed, L6 timeline: full notes in `HANDOFF-ARCHIVE.md` (grep "Dead ends moved"). Cards/Columns "gone" = Compact size/list view.

## 4. Active state & next 3 tasks
ACTIVE STATE (2026-11-23, end of session 01FNE57L c): main = 1.389 (2026.11.23d), shipped on David's `build` (CHECK the APK build 454 went green). Work branch claude/checkout-ccr-aefb8e60-idp0ts-2nkggp = main + handoff commits. Detail of 1.387-1.389: archive grep 'moved-1389'.
- 1.389 (browser-checked only; device checks at the end of TESTING.md): (1) ALL STORIES TOP BAR, David's own design: no pinned section bar. `wireChrome` writes the section name into `#tsec` (span appended to `.top`; `.top.sec` shows it, `.sw` while swapping), brass italic --disp under the title, title lifts 7px, top bar never tucks while `.sec`. `#wpin` is no longer created: its CSS is DEAD (lines ~1168, 3448, 3645, 3782, 4645, 4916, plus the 1.388 glide rules next to `#tsec`): remove it. (2) LIGHTER LOOK never switches on by itself: stall watcher removed, `S.autoLow` deleted at start; `html.lowp` only from 'Pause effects on low battery' (under 20%, Battery Saver, Data Saver). `html.lowp *` still sets every transition to .01 ms: `.top`, `#tabs`, `#tsec`, `#ttl` are exempt. (3) Bars glide .65s var(--ease-out) (David picked T2 'a little slower').
- 1.388: story timeline labels readable on dark (`.rprev em`, `.rn-t i`), Broadsheet bars lose the time-of-day tint (`html.sq :is(.top,#tabs,...)`), Fold picture credit size (`#rd .cols .body .cred`). 1.387: Broadsheet (`eink`/`einkd`, `html.sq`), read-ahead fix, Fold title page.
- Known, not done: section name does not shrink step by step (size follows screen width, then '...'); at Fold size the title is cut to 'All Stor...' by the buttons (was so before); the 'Up next' note is cream on dark Halcyon (asked David, no answer); half-empty page before a tall picture; in David's 2nd recording the top bar never hid, cause unknown. Screenshot trap: wait 4 s after render (cover landing animation).
- DAVID'S DIRECTION: NOT Play paperwork. (1) speed, (2) how the app functions, MOST of all (3) visuals, especially when reading. He sends screen recordings: read them frame by frame (ffmpeg fps=12 tile) before changing anything. NO NEW SETTINGS. Nothing may change his look or motion without asking.
- Demo pages: section in top bar https://claude.ai/artifact/WBDfKQ88DhyvnVk8uMeQyf ; bar options https://claude.ai/artifact/1A3PMmzsMXt9GWs3y68h6r ; Broadsheet proposal https://claude.ai/artifact/T7uCum7B4mBmUMsby6ayyG.
- Tests: `boot` passes after `node tests/extract.js`; card_scrim tablet contrast 9.9 vs 10 on a bright photo (undecided). Exit code 0 is not a pass: count `^FAIL`. TESTING.md ends with the 1.389 checks.
NEXT 3 TASKS:
1. Confirm build 454 (1.389) is green. Then David's verdict on the Fold: section name under 'All Stories', bottom tabs glide, animations back. Fix what he reports; remove the dead `#wpin` CSS.
2. SPEED follow-up: a fresh Settings > Copy diagnostics a day after 1.387+ ('Story opening' network vs ready; Preload line: lighter look false, allowed true, Daily ~40 of 40). If network taps are still many: raise pfCap under 50% battery, on-screen read-ahead on mobile data (ask David), slow sites (xda-developers, kotaku, engadget), 8 feeds failing on Cloudflare bot checks.
3. VISUAL REVIEW, continue (reading first), then FUNCTION walk (first five minutes, empty/error moments). Waiting on David: verdicts on 1.387 (Broadsheet day + night, Fold title page, chips row, top bar glow), Fold verdicts on 1.382/1.383 (then remove unused ccov/pcov cover code, inventory in FIXES.md); Play questions (paid at launch? personal or organization account?).
Pointers (older notes, messy stories, PM deep dive, idea book, insights task, launch checklist; NEVER commit family path or insights password): archive grep 'moved-1387b'. Locked: page turn 1280 ms. NO NEW SETTINGS. 'check messy stories' = `curl -s 'https://cypressreader.com/api/insights?messy=list'`.
