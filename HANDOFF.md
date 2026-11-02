# HANDOFF — live session memory (read first, update silently after every finished task)
Old detail (dated session logs, FIXES 16-26 notes, debugging traces) lives in `HANDOFF-ARCHIVE.md`: don't read it on boot, `grep` it only if needed.
Keep THIS file under ~8 KB: when it grows past that, move finished/dated items to the archive and keep only rules, open items and the next tasks.

Last updated: 2026-11-02 (session dn9q8h: **1.226 SHIPPED to main** 3b298c6, APK run 41376239198 + Tests 41376239255 green; includes 1.225 Quick Reads fix). Older ship notes: archive.

## 1. Working & locked (verified; don't change core logic without asking)
- **Halcyon theme** (`halcyon`/`halcyond`): website palette (cream `#f3ecdc`, green `#123524`/`#0c2619`, brass `#c9a24a`/`#b08d3e`), follows phone via `twinApply`. Headlines use `--disp` (narrow display serif) with `!important` (user's choice). Dark-brass labels on cream `#7d5f14`; light-brass `#e2c27a` on dark `.noimg` lead/hero cards (`.noimg` ≠ cream card).
- **The Daily**: name once per section (`sh()`), one-line intros (`DAYDEK`), "Vol. 26 · No. 290" line, "Next up" styled like "Since this morning", "In this issue" links use `jumpTop`, cover number `.dcv-num`.
- **Headlines**: list and tile views share "The front page" first section. **All Stories**: title-case header, centered chips, `tabMast` headings in both views.
- **Story card size** Compact|Medium|Large drives `--csz`. Cards|Columns (wire) view exists only with Medium/Large + tiles (by design). Daily + Compact sets `data-cards="narrow"` on `#grid` (CSS needs both selectors). Wire "Cards" sets `data-w="mag"`.
- **No location**: no permission/geolocation code. "Near you" = typed place, up to 10 saved (`S.places`), `locLang`. `nUrl` keeps `q=/query=/search=`.
- Light/dark: As the theme is / Always light / Always dark / Follow phone (`S.sch`). Sky transition remains; sunset mode and weather removed. Pure Black theme `oled` (light phone falls back to Light).
- Excerpts end on whole words (`trimWords`, `sumOf`). Opaque docked tab bar `#mtabs`; pull-to-refresh `#pts`; Search closes after keyboard.
- **Reader**: No spanning title block in paged reader. Justified text uses hyphens. "Aa" = bottom sheet (Theme/Font/Focus/Large print) from ... menu (`data-act="aa"`). "Why it matters" stays (`whyBox`, `COOKIEJ`).
- **Side bar** hide setting (Never/portrait+square/Always), hamburger `#menu`, tab `#sideh`; click-to-close skips folder arrows/dots/× buttons.
- **Return to feed**: `rdFreeze` pins body `grid-template-columns` while story open; `rdAnchorSave/Restore` per frame; `patchProg` updates progress bar without full `render()`; `#grid.wire` cards have `content-visibility:visible`.
- Site, privacy, demo (generated), tablet page: US spelling, no publisher names. Near you sends typed place to Google News/Bing News.
- Tests: see section 4 for current failures. Page-turn copies (`.tl,.tl-leaf`, pre-built next turn) are in the DOM while reading: tests that query the story must skip them (`!x.closest('.tl,.tl-leaf')`). Under -P3/-P4 load end_card, trend_strip, continuous can flake: rerun alone before blaming. Run long ones with `timeout 900`. Tests rewrite d7_*.png / sp/*.png screenshots: `git checkout` them, don't commit.

## 2. Rules & tooling
- Single file `www/index.html`; hook copies to `docs/app/index.html` and rebuilds `docs/demo.html`. Don't read those copies.
- Fonts: Literata `--serif`, Cormorant `--fd`, `--disp` headlines. Theme vars `--bg --pn --ink --mut --ln --a1 --a2 --logo`. Photo cards white text on dark overlay.
- `#grid.list .card…` rules are strong; add `#grid.list` selectors, don't fight them. CSS-only fixes preferred; `fitPage1`/`fitHero`/`layout` are delicate.
- Preview: commit → push → `scripts/publish-preview.sh <branch>`. Apply briefs in THIS repo/branch.
- Release: on `build`: merge to `main`, label + `whats-new.txt` + workflow `APP_LABEL` in step.
- Mistakes to avoid: `pkill -f`; backgrounded `git stash`; test server dies between commands; port 8765 collisions; no `cypress-gemini-audit/`.

## 3. Dead ends (don't repeat)
- **'Flip through pages' magazine view (`mgp`)**: removed 2026-10-22 (commit 5256ada). Don't rebuild without brief.
- Perf dead ends (fixOrph in rAF, sticky `nv`, `cutOf` cache key, cheapening `endTurn`, read-ahead timer storm, preloading Inter, close-from-Daily tweaks), forced hero card in list view, shrinking feed photos <1600px, nested `<form>` in Add dialog, ABC News feed, L6 timeline: full notes in `HANDOFF-ARCHIVE.md` (grep "Dead ends moved"). Cards/Columns "gone" = Compact size/list view.

## 4. Active state & next 3 tasks
Locked: page turn (Play Books style, tap turns 1280 ms, do not retune). Older shipped work: `HANDOFF-ARCHIVE.md`. **Tests: exit code 0 does NOT mean pass; count `^FAIL` lines.** Pre-existing failures (same on session base 27ae568, 2026-11-02 full suite): deep2 deep3 feat_run (vm harness, not an app bug) native st16 st17 st2 st3 st4 st7b st9 st26 (MODULE_NOT_FOUND); layout flakes at 1366.
- **Side-by-side** = 3-way setting `S.splitm` (land/always/off; old `S.split` true=always, false=off; `splitMode`/`splitShape`/`sideways()` compares screen.width vs screen.height because the Fold's window is wider than tall both ways). VERIFIED on the Fold 1.139.
**Active state (2026-11-01, end of session t92lcv, 2nd run):** WORK BRANCH `claude/handoff-continuation-dn9q8h` = main (1.226 shipped; branch and main identical except this HANDOFF). Not merged. Preview /polish/app/ = 1.225 (before speed fix). 1.224 APK + Tests green. Direction: Android-only app (web app version to be scrapped later), privacy kept, speed on the phone is the current priority. **David's standing rule: no merge, no APK, no production deploy until he says build/merge.**
**1.225 on branch (NOT on main):** fixed David's Quick Reads bug. Cause: `.dq-c` cards hide their img by design (CSS line ~788) but keep a.img, so photo-overlay rules (`#f6efe0!important` src rule ~4872, white `.cby` ~4006) hit them. Fix: one override at end of design-picks block (`html body #grid#grid .dq .card.dq-c` src→--mut, cfoot/cby→--ink) + card() skips the +N photo pill when k has dq-c. Verified in Halcyon/Light/Sepia/Dark on demo at 1000px. 1.224 APK 41343394198 + Tests 41343394176 green.
(Design review + picks notes: HANDOFF-ARCHIVE.md, grep "Moved 2026-11-01 speed".)
**Speed (1.226):** fixes 1-5 done (og() parses once; fewer forced layouts; cover cache key; refresh waits to look up photos + throttled photo redraws: replayed refresh 11.6->7.5 s sites, 15.9->9.7 s all; list skips style while a story covers it on phones). Launch is near its floor (style recalc vs 811 KB CSS). Tools: review/perf-2026-11-01/, HAR record/replay for stable A/B. Detail + dead ends: HANDOFF-ARCHIVE.md grep 'Speed fixes 2-5 detail'.
**Neural voices (David's Muse prompt, 2026-11-02): NOT started, waiting on David's answers** (license: English-only does NOT avoid GPL on older sherpa-onnx, kokoro-en ships espeak-ng-data; but sherpa-onnx issue #3731 removed espeak-ng in v2.0.0, lexicon-only: use >= v2.0.0 and confirm no espeak in AAR/models at build time; languages limited to models with lexicons (Kokoro en+zh at least). Pitch not supported; numbers need the Fold; branch name). Existing wiring: `native/extras/CyTts.java`, `CyMediaService.java`, `speechSynthesis` in www. Plan if yes: spike = one English voice end to end on a debug APK, then expand.
**Next 3 tasks:** 1. 1.226 is on main (shipped 2026-11-02): David checks it on the phone (TESTING.md 2026-11-02 list). 2. Neural voices: full plan in `review/tts-plan.md`; start step 1 (spike) only on David's go. 3. Speed leftovers: og() article-text extract during refresh (offline reading trade-off, ask David); launch style cost (CSS diet, risky).
