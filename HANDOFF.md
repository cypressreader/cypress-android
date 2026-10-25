# HANDOFF — live session memory (read first, update silently after every finished task)
Old detail (dated session logs, FIXES 16-26 notes, debugging traces) lives in `HANDOFF-ARCHIVE.md`: don't read it on boot, `grep` it only if needed.
Keep THIS file under ~8 KB: when it grows past that, move finished/dated items to the archive and keep only rules, open items and the next tasks.

Last updated: 2026-10-25 · Branch: `claude/magazine-sections` · Code: web `2026.10.25f`, Android label **1.153 (translated headlines + badge, pull-quote fix)**. Older labels: see archive.

## 1. Working & locked (verified; don't change core logic without asking)
- **Halcyon theme** (`halcyon`/`halcyond`): website palette (cream `#f3ecdc`, green `#123524`/`#0c2619`, brass `#c9a24a`/`#b08d3e`), follows phone via `twinApply`. Headlines use `--disp` (narrow display serif) with `!important` (user's choice). Dark-brass labels on cream `#7d5f14`; light-brass `#e2c27a` on dark `.noimg` lead/hero cards (`.noimg` ≠ cream card).
- **The Daily**: name once per section (`sh()`), one-line intros (`DAYDEK`), "Vol. 26 · No. 290" line, "Next up" styled like "Since this morning", "In this issue" links use `jumpTop`, cover number `.dcv-num`.
- **Headlines**: list and tile views share "The front page" first section. **All Stories**: title-case header, centered chips, `tabMast` headings in both views.
- **Story card size** Compact|Medium|Large drives `--csz`. Cards|Columns (wire) view exists only with Medium/Large + tiles (by design). Daily + Compact sets `data-cards="narrow"` on `#grid` (CSS needs both selectors). Wire "Cards" sets `data-w="mag"`.
- **No location**: no permission/geolocation code. "Near you" = typed place, up to 10 saved (`S.places`), `locLang`. `nUrl` keeps `q=/query=/search=`.
- Light/dark: As the theme is / Always light / Always dark / Follow phone (`S.sch`). Sky transition remains; sunset mode and weather removed. Pure Black theme `oled` (light phone falls back to Light).
- Excerpts end on whole words (`trimWords`, `sumOf`). Opaque docked tab bar `#mtabs`; pull-to-refresh `#pts`; Search closes after keyboard.
- **Reader**: do NOT re-add a spanning title block in the paged reader. Justified text uses hyphens. "Aa" = bottom sheet (Theme/Font/Focus/Large print), opened from the ... menu (`data-act="aa"`); no `#raa/#raaf` buttons. "Why it matters" stays as is (`whyBox`, `COOKIEJ` filter).
- **Side bar** hide setting (Never / portrait+square / Always), hamburger `#menu`, tab `#sideh`; click-to-close skips folder arrows/dots/× buttons.
- **Return to the feed (1.111, calm)**: `rdFreeze` pins body `grid-template-columns` while a story is open (released 480 ms after `reading` ends / on resize); `rdAnchorSave/Restore` per frame; progress-only change patches the bar (`patchProg`) instead of `render()`; no close cross-fade (`closeRd` = `closeRd0`); `#grid.wire` cards have `content-visibility:visible`. If jitter returns, re-add a `?dbg=1` note (see git commits d4c09e6/207523e).
- Site, privacy, demo (generated), tablet page: US spelling, no publisher names. Near you sends typed place to Google News and Bing News (disclosed on privacy page).
- Tests passing: `tests/syntax.js`, `st5`, `st18`, `st27`, `st29`, `control`. Pre-existing failures (also on main): `st26`, `deep2`, `deep3`.

## 2. Rules & tooling
- Single file `www/index.html`; hook copies to `docs/app/index.html` and rebuilds `docs/demo.html`. Don't read those copies.
- Fonts: Literata `--serif`, Cormorant `--fd`, `--disp` headlines. Theme vars `--bg --pn --ink --mut --ln --a1 --a2 --logo`. Photo cards white text on dark overlay.
- `#grid.list .card…` rules are strong; add `#grid.list` selectors, don't fight them. CSS-only fixes preferred; `fitPage1`/`fitHero`/`layout` are delicate.
- Preview: commit → push → `scripts/publish-preview.sh <this session's branch>`. Pasted briefs naming "cypress-preview / experiment/daily-redesign" are applied in THIS repo/branch.
- Release: only on the user's `build`: merge to `main`, label + `whats-new.txt` + workflow `APP_LABEL` in step; remind about `docs/worker/share-worker.js` only if it changed (unchanged since 1.107).
- Mistakes to avoid: `pkill -f`; backgrounded `git stash`; unset-var `cat >`; test server dies between commands; port 8765 collisions; don't commit `cypress-gemini-audit/`; throwaway scripts go in the scratchpad.

## 3. Dead ends (don't repeat)
- **'Flip through pages' magazine view (`mgp`)**: built as an experiment 2026-10-21, David judged it "doesn't look good" and it was removed 2026-10-22 (commit reverts 5256ada). Don't rebuild it without a new design brief.
- Forced hero card in list view (solved: normal row). Cards/Columns "gone" = Compact size or list view, not a bug. Nested `<form>` in Add dialog (use div + Enter). Heavy-sans reader title not reproducible (ask `S.font`, `S.hfont`). ABC News feed removed.

## 4. Active state & next 3 tasks
Locked: page turn (Play Books style, tap turns 1280 ms, do not retune). Shipped and closed: 1.128-1.136 (list-view tidy, Teach CyPress, Add a feed search, full review batches, Fold-as-small-tablet, junk filter v2) — detail in `HANDOFF-ARCHIVE.md` under the two "Moved from HANDOFF 2026-10-24" sections. Pre-existing test failures are listed there too.
- List view chapters/contents/In brief were REMOVED on purpose (David: same job as the side bar, hides what is new). Don't rebuild.
- Muse web review leftovers: photo-less monogram/blank tiles (changed 2026-10-24, not yet judged); Remove feed/Delete folder already confirm + undo (left).
- Friend's naming is the reverse of the app's: he calls the tile view 'list view' and the list view 'tile view'.
- Browser relays (allorigins/corsproxy/codetabs) are dead: web preview cannot fetch pages or Feedly; only the APK proves fetching.
- **Side-by-side** = 3-way setting `S.splitm` (land/always/off; old `S.split` true=always, false=off; `splitMode`/`splitShape`/`sideways()` compares screen.width vs screen.height because the Fold's window is wider than tall both ways). VERIFIED on the Fold 1.139.
- **Lag in All Stories (1.140-1.147):** full detail moved to `HANDOFF-ARCHIVE.md` ('Moved from HANDOFF 2026-10-25'). Still open: a full redraw can cost seconds; next big step would be drawing only the visible part of the list (ask David first).
**Polish pass RELEASED as 1.148 (2026-10-25):** built by worktree agents, merged by area. Rollback branch `backup/pre-polish-2026-10-25` (= 2a1738a); retired themes/covers/fonts hidden via `POLISH_RETIRED`/`POLISH_COVERS`/`POLISH_FONT_KEEP`; every K feature has a switch. Detail in `HANDOFF-ARCHIVE.md`.
**Shipped after 1.148 (2026-10-25, all merged to main):** 1.149 Text-and-appearance sheet restyled like the "..." sheet; 1.150 Dynamic follows story PHOTO colors + Muse-review fixes (one reading-time rule `readMin`=`minsOf`, forward-only loader line, `_italic_`/`__bold__`, Mark-all-read hidden on Saved/History/Stats, theme names in settings search); 1.151 Dynamic light/dark flip instant (`renderSoon` defers the redraw until Settings closes; richer `dynTone`); 1.152 on-device Translate story (ML Kit: `native/extras/CyTranslatePlugin.java`, `TR_LINE` in `scripts/prepare_android.py`, JS `translateNative`/`CyTR()`); 1.153 translated headlines (per-feed `f.tr`, global `S.trg` pick/all, `trfPass`/`trfRun`, cache `folio-trc`, globe badge `.trb`, `trfAuto`) + pull-quote translation. 1.153 APK run 183 (id 40209195564) was still building at hand-off: check it first.
- **CI "Tests" workflow red on main since 1.148:** `tests/add_feed.js` is STALE (polish changed the Add dialog); passes at 2a1738a. Fix the test, not the app, if David asks.
- Muse review leftovers not done: label what each count measures (Daily 40 vs Brief 10 vs Headlines 32 are different scopes), Stats bar heights, Brief "The Lead" empty band, WIRE ticker clipped, imageless History card oversized letter, sticky tab bar clipping Quick Reads, left-nav pressed state. Dynamic Dark list contrast could NOT be reproduced in the demo.
- Unverified on device (TESTING.md): translation, translated headlines + badge, Dynamic switch speed and photo colors.
**Next 3 tasks:** 1. Confirm the 1.153 APK built; get David's phone verdict on translated headlines/badge, Dynamic switch speed and photo colors; fix what he flags. 2. Offer: update stale `add_feed` test; Muse leftovers above. 3. Remaining phone checks: 1.135/1.136 Fold layout, junk filter, Teach + sitemap, feed search, reader shimmer lines, 1.148 polish items (widgets, Kindle, Daily redraw on the Fold).
