# HANDOFF — live session memory (read first, update silently after every finished task)
Old detail (dated session logs, FIXES 16-26 notes, debugging traces) lives in `HANDOFF-ARCHIVE.md`: don't read it on boot, `grep` it only if needed.
Keep THIS file under ~8 KB: when it grows past that, move finished/dated items to the archive and keep only rules, open items and the next tasks.

Last updated: 2026-11-25 (main = 1.396, green; branch preview/world-edition = main + World Edition test version). Do NOT push HANDOFF-only commits to main (every push to main starts an APK build).
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
ACTIVE STATE (2026-11-24): main = 1.396 (2026.11.24c) = 1.395 + publisher rules pass 2, shipped on David's `build` after MJ's regression came back clean (693 set 571 -> 573, sweep 1,580 set 1,266 -> 1,276, 0 worse). Build 461 + Tests 2044 GREEN. 1.394 detail: archive grep 'moved-1394'. Older: 'moved-1389'..'moved-1393'.
- PUBLISHER RULES (1.395) and PASS 2 (1.396): `pubFurn` at the start of `tidy`; David's decisions (keep footnote back-links, no bare-URL cut, no C3/C4n) are final. He likes review-first: verdict table before code, live before/after through the full reader path. Full notes: archive grep 'moved-1396'.
- WORLD EDITION: three briefs delivered as artifacts 2026-11-25 (universal Daily; regional newspaper + play; art direction with today's real headlines: https://claude.ai/artifact/QgRWKSxn93tuiuzZBzyTkM). FIRST TEST VERSION BUILT on branch `preview/world-edition` (NOT merged, no version bump): reading only. `renderWE`/`weClick`/`weFit`/`wePhotoOk`/`weChart` + `.we*` CSS in `www/index.html`; route `S.sel==='we'`; tab in the drawer and the bottom bar; data in `www/world-edition.json` (copy to `docs/app/` by hand, the hook only copies index.html); format in `WORLD-EDITION-FORMAT.md`. Sample = US + International for Tue Nov 24 2026, real headlines. Decided by David: 18 stories, ten fixed sections, two editions at launch, type cover with photo layer behind the checklist, chart on the contents page, region switched on the edition line (no setting), own night/day looks, play = openings from reading notes (later). NOT built: play mode (button inert), back issues, sharing, pipeline. Deviations: Cormorant ships only in medium (no bold file added, heavy day cannot go lighter: headline dims instead); shape library has 8 shapes not ~24; photo layer never seen with a real photo; Fold spread starts at 600px of page width. Device checks: end of TESTING.md. Paper week NOT run (API credit ends Dec 1).
- Known, not done: section name does not shrink step by step (size follows screen width, then '...'); at Fold size the title is cut to 'All Stor...' by the buttons (was so before); the 'Up next' note is cream on dark Halcyon (asked David, no answer); half-empty page before a tall picture; in David's 2nd recording the top bar never hid, cause unknown. Screenshot trap: wait 4 s after render (cover landing animation).
- DAVID'S DIRECTION: NOT Play paperwork. (1) speed, (2) how the app functions, MOST of all (3) visuals, especially when reading. He sends screen recordings: read them frame by frame (ffmpeg fps=12 tile) before changing anything. NO NEW SETTINGS. Nothing may change his look or motion without asking.
- Tests: `boot` passes after `node tests/extract.js`; card_scrim tablet contrast 9.9 vs 10 on a bright photo (undecided). Exit code 0 is not a pass: count `^FAIL`. TESTING.md ends with the 1.389 checks.
- OPEN BUG: the Daily snaps back up 600-900 px while a friend's finger scrolls down (Pixel 6, Android 17, WebView 157, Press light); NOT on David's phone; cloud can't reproduce. 1.390 logs finger direction on the 'unexplained' Jumps line (`jf`/`jfs`). tests/device/RUN still has `STEPS=daily-jump` (remove before a full run). Full notes: archive grep 'moved-bug-jump'.
NEXT 3 TASKS:
0. David's verdict on the World Edition test version (preview/world-edition): cover, contents, Fold spread; then back issues + share, then play. Also his verdict on 1.396 story endings (Open Culture, ArchDaily, ZDNet, CNET). Leftovers: ArchDaily 'More Specs'/'Project gallery'/'About this office' lines; ZDNet/CNET author-bio line; Open Culture 'Related Content:' label.
1. David's verdict on the new-stories arrow on phone and Fold; the friend's Copy diagnostics (Jumps line) for the Daily snap-back.
2. SPEED follow-up from a fresh Copy diagnostics, then VISUAL REVIEW (reading first) and FUNCTION walk. Still waiting on David: 1.387 verdicts (Broadsheet, Fold title page, chips row, top bar glow), Fold verdicts on 1.382/1.383, 'Up next' note cream on dark Halcyon.
Pointers (older notes, messy stories, PM deep dive, idea book, insights task, launch checklist; NEVER commit family path or insights password): archive grep 'moved-1387b'. Locked: page turn 1280 ms. NO NEW SETTINGS. 'check messy stories' = `curl -s 'https://cypressreader.com/api/insights?messy=list'`.
