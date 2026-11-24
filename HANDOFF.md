# HANDOFF — live session memory (read first, update silently after every finished task)
Old detail (dated session logs, FIXES 16-26 notes, debugging traces) lives in `HANDOFF-ARCHIVE.md`: don't read it on boot, `grep` it only if needed.
Keep THIS file under ~8 KB: when it grows past that, move finished/dated items to the archive and keep only rules, open items and the next tasks.

Last updated: 2026-11-23 (work branch ccr-1e35149c-rfxbi4, continued from claude/checkout-continue-branch-r3bz1q; main = 1.393). Do NOT push HANDOFF-only commits to main (every push to main starts an APK build).
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
ACTIVE STATE (2026-11-23): main = 1.393 (2026.11.23h), shipped on David's `build` (1.393 build 458 GREEN). Work branch ccr-1e35149c-rfxbi4 = main + green-bar arrow fix (not built). Detail of 1.387-1.393: archive grep 'moved-1389' / 'moved-1391' / 'moved-1392' / 'moved-1393' (new-stories arrow `NN`/`nnBtn`/`nnSync`/`#nup` next to `wireLoad`; color scan `tools/scan/colors.js`).
- ON BRANCH, NOT BUILT (after 1.393): new-stories arrow `#nup` was an empty cream circle on the green Halcyon bar (circle = bar --ink cream, arrow = page --bg cream). Fix: arrow color `var(--pn,var(--bg))`; checked light+dark in 6 themes + green bar. `build` ships it as 1.394 (version, whats-new, workflow label).
- ON BRANCH, NOT BUILT: refresh line `.top::before` (`pfBar`, `--pon`) pulsed on/off for ~3 s when late sites finished one by one (hid 300 ms after each); now hides after 1.2 s of quiet, resets at 1.8 s. `refresh_ind` passes.
- BRANCH preview/extractor-rules (= ccr-1e35149c-rfxbi4 + extractor rules, NOT merged; MJ re-runs the 693-story set on it): `tailFurn` in `dropTailPromo` (trailing tag links, 'Send us tips', same-site 'More ...' list under a heading), `[Image: url]` lines in `tidy`, Ghost gate (`upgrade-cta`, 'for paying subscribers only' in `GATEMARK`), `XK`/`pgKind` labels (video/gallery/webinar/redirect/gated) for pages with no story, shown in the reader log only. Not done (David's call): credit lines, Eater trailing photo+perks, cross-story cut (Guardian weather tracker is multi-story by design).
- Known, not done: section name does not shrink step by step (size follows screen width, then '...'); at Fold size the title is cut to 'All Stor...' by the buttons (was so before); the 'Up next' note is cream on dark Halcyon (asked David, no answer); half-empty page before a tall picture; in David's 2nd recording the top bar never hid, cause unknown. Screenshot trap: wait 4 s after render (cover landing animation).
- DAVID'S DIRECTION: NOT Play paperwork. (1) speed, (2) how the app functions, MOST of all (3) visuals, especially when reading. He sends screen recordings: read them frame by frame (ffmpeg fps=12 tile) before changing anything. NO NEW SETTINGS. Nothing may change his look or motion without asking.
- Tests: `boot` passes after `node tests/extract.js`; card_scrim tablet contrast 9.9 vs 10 on a bright photo (undecided). Exit code 0 is not a pass: count `^FAIL`. TESTING.md ends with the 1.389 checks.
- OPEN BUG (2026-11-23, David's friend, Pixel 6, Android 17, WebView 157, app 1.389, Press theme light, type cover): The Daily snaps back up 600-900 px while her finger scrolls down, several times in a row; her Copy diagnostics 'Jumps' line logs it as 'unexplained ... by finger', same page height, no redraw. NOT on David's phone. Ruled out by reading: tabtuck handler, jumpTop re-aim. Cloud can't reproduce (headless finger swipes scroll 0, even tools/perf swipe). Device test step `daily-jump` (tests/device/run.js; RUN still has `STEPS=daily-jump`: remove that line before a full run, any push under tests/device starts a run) on the Android 16 emulator (WebView 133): 0 backward moves in Press and Halcyon, but swipes were flaky (a story opened, Press only reached 299 px). Waiting: her typed notes (All Stories too? since which update?). David's phone has the SAME Android 17 + WebView 157, so the web engine is not it; his own log has one 'unexplained by finger' in All Stories at 2144s (may be a fast flick up). SHIPPED in 1.390 (2026.11.23e, build 455 GREEN): the 'unexplained' line now adds finger down/lifted, how far the finger went (minus = finger moved up = wanted to go down), key, focus, bars (`jf`/`jfs` at the jump catcher). Next: friend updates to 1.390, reproduces, sends Copy diagnostics; read the Jumps line.
NEXT 3 TASKS:
0. On David's `build`: ship the green-bar arrow fix + steady refresh line as 1.394.
1. David's verdict on the 1.392 new-stories arrow on his phone and Fold (title squeeze, dark Halcyon colors); adjust.
1b. The friend's Copy diagnostics from 1.390+ : read the 'Jumps' line (finger direction) to find the Daily snap-back.
2. Messy stories leftovers (see above) once David sends a CBS screenshot.
3. SPEED follow-up from a fresh Copy diagnostics, then VISUAL REVIEW (reading first) and FUNCTION walk. Still waiting on David: 1.387 verdicts (Broadsheet, Fold title page, chips row, top bar glow), Fold verdicts on 1.382/1.383 (then remove unused ccov/pcov cover code), 'Up next' note cream on dark Halcyon, Play questions.
Pointers (older notes, messy stories, PM deep dive, idea book, insights task, launch checklist; NEVER commit family path or insights password): archive grep 'moved-1387b'. Locked: page turn 1280 ms. NO NEW SETTINGS. 'check messy stories' = `curl -s 'https://cypressreader.com/api/insights?messy=list'`.
