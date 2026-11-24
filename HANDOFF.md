# HANDOFF — live session memory (read first, update silently after every finished task)
Old detail (dated session logs, FIXES 16-26 notes, debugging traces) lives in `HANDOFF-ARCHIVE.md`: don't read it on boot, `grep` it only if needed.
Keep THIS file under ~8 KB: when it grows past that, move finished/dated items to the archive and keep only rules, open items and the next tasks.

Last updated: 2026-11-24 (work branch preview/extractor-rules, after ccr-1e35149c-rfxbi4, continued from claude/checkout-continue-branch-r3bz1q; main = 1.393). Do NOT push HANDOFF-only commits to main (every push to main starts an APK build).
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
ACTIVE STATE (2026-11-24): main = 1.394 (2026.11.24a), build 459 + Tests 2036 GREEN. Work branch preview/publisher-rules = main + publisher rules (NOT merged, NOT built): waiting for MJ's 693-story regression, then David's `build` (ships as 1.395: version, whats-new, workflow label). 1.394 detail (extractor rules `tailFurn`/`pgKind`/`XK`/`xkStop`, credit fold, perks, arrow, refresh line): archive grep 'moved-1394'. Older: 'moved-1389'..'moved-1393'.
- BRANCH preview/publisher-rules: `pubFurn` at the start of `tidy` (via `underscoreItalics`): R2 'Partner content from …' + 1 para, R3/R5 cut from IEEE/STAT related headings, R8/R9 Wait But Why signup/Patreon/'More posts' + leftover ____ rules, R11 New Yorker ♦; R4 STAT+ price chrome removed ONLY in `gatePreviewUi` (earlier removal hides 'Unlock this article' = breaks gated detection); C1/C2 `…` `)` `]` endings in `looksIncomplete`. DAVID DECIDED (do not reopen): keep ↩ footnote back-links (R7), no bare-URL cut (R12), no C3/C4n (app has no last-80-char-line check), 3 leftover WBW ____ dividers stay. Cross-story cut stays out (Guardian guess unverified). Already covered: R1 R6 R10 R13 R14. David likes review-first: Step 0 verdict table (SAFE/RISKY/WON'T WORK + function) before any code, live before/after through the FULL reader path (extract->tidy->junkClean->foldBoiler).
- Known, not done: section name does not shrink step by step (size follows screen width, then '...'); at Fold size the title is cut to 'All Stor...' by the buttons (was so before); the 'Up next' note is cream on dark Halcyon (asked David, no answer); half-empty page before a tall picture; in David's 2nd recording the top bar never hid, cause unknown. Screenshot trap: wait 4 s after render (cover landing animation).
- DAVID'S DIRECTION: NOT Play paperwork. (1) speed, (2) how the app functions, MOST of all (3) visuals, especially when reading. He sends screen recordings: read them frame by frame (ffmpeg fps=12 tile) before changing anything. NO NEW SETTINGS. Nothing may change his look or motion without asking.
- Tests: `boot` passes after `node tests/extract.js`; card_scrim tablet contrast 9.9 vs 10 on a bright photo (undecided). Exit code 0 is not a pass: count `^FAIL`. TESTING.md ends with the 1.389 checks.
- OPEN BUG: the Daily snaps back up 600-900 px while a friend's finger scrolls down (Pixel 6, Android 17, WebView 157, Press light); NOT on David's phone; cloud can't reproduce. 1.390 logs finger direction on the 'unexplained' Jumps line (`jf`/`jfs`). tests/device/RUN still has `STEPS=daily-jump` (remove before a full run). Full notes: archive grep 'moved-bug-jump'.
NEXT 3 TASKS:
0. MJ's 693-story regression on preview/publisher-rules: fix what it finds (ask for story links + before/after endings). On David's `build`: merge to main as 1.395.
1. David's verdict on the new-stories arrow on phone and Fold; the friend's Copy diagnostics (Jumps line) for the Daily snap-back.
2. SPEED follow-up from a fresh Copy diagnostics, then VISUAL REVIEW (reading first) and FUNCTION walk. Still waiting on David: 1.387 verdicts (Broadsheet, Fold title page, chips row, top bar glow), Fold verdicts on 1.382/1.383, 'Up next' note cream on dark Halcyon.
Pointers (older notes, messy stories, PM deep dive, idea book, insights task, launch checklist; NEVER commit family path or insights password): archive grep 'moved-1387b'. Locked: page turn 1280 ms. NO NEW SETTINGS. 'check messy stories' = `curl -s 'https://cypressreader.com/api/insights?messy=list'`.
