# HANDOFF — live session memory (read first, update silently after every finished task)
Old detail (dated session logs, FIXES 16-26 notes, debugging traces) lives in `HANDOFF-ARCHIVE.md`: don't read it on boot, `grep` it only if needed.
Keep THIS file under ~8 KB: when it grows past that, move finished/dated items to the archive and keep only rules, open items and the next tasks.

Last updated: 2026-11-14 (main = 1.328 (2026.11.14a), build 393 + tests + site CONFIRMED green; work branch claude/handoff-continuation-he3yvg). Do NOT push HANDOFF-only commits to main (every push to main starts an APK build).
## 1. Working & locked (verified; don't change core logic without asking)
- **Halcyon theme** (`halcyon`/`halcyond`): website palette (cream `#f3ecdc`, green `#123524`/`#0c2619`, brass `#c9a24a`/`#b08d3e`), follows phone via `twinApply`. Headlines use `--disp` (narrow display serif) with `!important` (user's choice). Dark-brass labels on cream `#7d5f14`; light-brass `#e2c27a` on dark `.noimg` lead/hero cards (`.noimg` ≠ cream card).
- **The Daily**: name once per section (`sh()`), one-line intros (`DAYDEK`), "Vol. 26 · No. 290" line, "Next up" styled like "Since this morning", "In this issue" links use `jumpTop`, cover number `.dcv-num`.
- **Headlines**: list and tile views share "The front page" first section. **All Stories**: title-case header, centered chips, `tabMast` headings in both views.
- **Story card size** Compact|Medium|Large drives `--csz`. Cards|Columns (wire) view exists only with Medium/Large + tiles (by design). Daily + Compact sets `data-cards="narrow"` on `#grid` (CSS needs both selectors). Wire "Cards" sets `data-w="mag"`.
- **No location**: no permission/geolocation code. "Near you" = typed place, up to 10 saved (`S.places`), `locLang`. `nUrl` keeps `q=/query=/search=`.
- Light/dark: As the theme is / Always light / Always dark / Follow phone (`S.sch`). Sky animation REMOVED in 1.247 (David: out of place); sunset mode and weather removed. Pure Black theme `oled` (light phone falls back to Light).
- Excerpts end on whole words (`trimWords`, `sumOf`). Opaque docked tab bar `#mtabs`; pull-to-refresh `#pts`; Search closes after keyboard.
- **Reader**: No spanning title block in paged reader. Justified text uses hyphens. "Aa" = bottom sheet (Theme/Font/Focus/Large print) from ... menu (`data-act="aa"`). "Why it matters" stays (`whyBox`, `COOKIEJ`).
- **Side bar** hide setting (Never/portrait+square/Always), hamburger `#menu`, tab `#sideh`; click-to-close skips folder arrows/dots/× buttons.
- **Return to feed**: `rdFreeze` pins body `grid-template-columns` while story open; `rdAnchorSave/Restore` per frame; `patchProg` updates progress bar without full `render()`; `#grid.wire` cards have `content-visibility:visible`.
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
Full detail of everything below: archive grep 'moved-1323b' (older: 'moved-1323', 'moved-1320', 'moved-1315'; NEVER commit family path or insights password). Insights daily check task trig_01KNpzQ3Cuz1KeDcZ2rZv1YW. Launch checklist: https://claude.ai/artifact/AQ7G5AMrwmYHipy28frpkt. Locked: page turn 1280 ms; whole-screen picture covers stay (David loves them), the card now turns like a leaf. NO NEW SETTINGS (David 2026-11-12: Settings is already a lot; looks are picked per story where they fit). **Tests: exit code 0 does NOT mean pass; count `^FAIL` lines.** Pre-existing failures: cinematic (2) deep2 deep3 feat_run native st16 st17 st2 st3 st4 st7b st8 st9 st26 feed_pool; layout flakes at 1366.
**SHIPPED 1.324-1.327 (detail: archive grep 'moved-1327', 'moved-1328b'; unverified on a phone, checks at the end of TESTING.md):** 1.325 `ccov` card turns like a leaf + 320 ms picture fade (NO Fold verdict from David yet); 1.326 pinned picture band REMOVED, don't bring it back; 1.327 `JK.PUB` `cut:` lists + `turnFail()`.
**Device test:** rig facts in archive ('moved-1323c', 'moved-1328'). Dynamic at the open-Fold size kills the emulator (runs 28-35): a rig limit, STOP chasing; only David's Fold can judge Dynamic covers. RUN file has no `STEPS=`/`COVERFIX=` lines now (next run = full run).
**RELEASED IN 1.328 (2026-11-14, David said `build`; unverified on a phone, checks at the end of TESTING.md):**
- Large first letter only on a story's FIRST paragraph (David picked C); `ftpFit` fits framed/two-tone title pages (pages AND scrolling).
- DEEP DIVE 2 fixes (findings + what is left: `DEEP-DIVE.md`, second half, last section 'H. Done / left'): `CUT.k=''` in `layout()` (stale page-turn copies = likely David's stuck page) + guarded pre-build; `cleanLib` drops `sk` with unsafe ids; Highlights title tap; privacy page + in-app text cover the Google News/Bing fallback, Google Fonts request deleted; sideways phone opens on `cov`; `md()` keeps short-paragraph stories; gallery captions white; Pages<->Scroll keeps the place (`bodyEnd` skips `.rfoot`); book chapter menu; Stats overlay is a dialog; wording 'sites' not 'feeds'.
- Build: `paths-ignore` now skips *.md, tests/, review/ etc. (HANDOFF-only pushes to main no longer build, but still never push to main without `build`/`merge`); APP_LABEL check; hooks use `$CLAUDE_PROJECT_DIR`.
**Tests:** known failures as listed above plus, never fixed: cover_lead (7), instant_open (1: stored story opens instantly but relays are still asked), deep + polish_nits (crash). st26 passes now. cover_rules + mixing flake.
**Next 3 tasks:**
1. Wait for David: Fold verdict on the leaf card + fade (1.325); does any page still stick after the `CUT` fix; which Font he has set (his framed title page showed the plain sans).
2. Left from deep dive 2 (section H): History page at tablet size (needs a design pass: `listRow` without `#grid.list` looks broken, tried and reverted); Look preview cover clipped; Fold side bar 'HighlightsHistory'; Bookshelf checkbox; scroll-mode ArrowDown/Home/End; sw.js double copy of the app; core-only manifest cleartext; device test uses the debug manifest; CSP hashes; stale docs/shots/laptop.jpg.
3. Older: NPR / The Verge content leftovers need a device dump; OPEN QUESTION whether Quick reads, Deep reads and Saved ahead should use the For you cards; freeze retest (1.307 Esquire); framed-picture headline size.
