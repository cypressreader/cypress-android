# HANDOFF — live session memory (read first, update silently after every finished task)
Old detail (dated session logs, FIXES 16-26 notes, debugging traces) lives in `HANDOFF-ARCHIVE.md`: don't read it on boot, `grep` it only if needed.
Keep THIS file under ~8 KB: when it grows past that, move finished/dated items to the archive and keep only rules, open items and the next tasks.

Last updated: 2026-10-24 · Branch: `claude/magazine-sections` · Code: web `2026.10.24k`, Android label **1.138 (released 2026-10-24 on David's `build`; 1.137 was build 167)**. Older labels: see archive.

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
- On the branch and NOT in `main` (rules only, no app code): operating-rules commits e227e7f + d57f62c — Sonnet-worker rule, failures-only tests, grep-or-append for the big text files, new CLAUDE.md §3b (which model to run, works from Opus or Sonnet), model-agnostic commit trailer, whats-new order corrected (new sections go at the END).
- **Side-by-side is now a 3-way setting `S.splitm` (land/always/off; old `S.split` true=always, false=off; helpers `splitMode`/`splitShape`).** Fold unfolded is ~859x847 both ways, so 'always' splits upright too; default 'land' needs width>height. Unverified on phone.
- **Side by side did nothing in the APK (1.136), browser was fine** — reported 2026-10-24, fixed and RELEASED as 1.137, still unverified on the phone (first thing to check in the new APK). Two WebView differences, both now handled: `pointer:coarse` is not reliable there (`touchy()` also tries `any-pointer:coarse`, `maxTouchPoints`, `ontouchstart`), and the WebView can report the old size during `resize` while a rotation may not resize at all (`shapeChanged()` re-reads `VW` inside the 120 ms delay and also listens to `orientationchange`). `splitAuto` reads `innerWidth/innerHeight` fresh. New "Side by side:" line in Copy support info names the failing condition if it is still wrong.
**Next 3 tasks:** 1. David installs 1.137 and checks the open Fold held sideways opens stories beside the list in the app (if not: Settings > Developer and diagnostics > Copy support info, send the "Side by side:" line, which names the failing condition); then the rest of the 1.135/1.136 (Fold layout + sideways scroll, junk filter on real stories; send screenshots of any junk left) (new TESTING.md entries, CSP inside the APK first) (worker re-pasted and verified live 2026-10-24); also 1.134 phone checks (`TESTING.md` last entries: Teach + sitemap, web feed search "happy"/"calm"/"birdwatching"); fix what he reports. 2. Optional ideas not built: warning when a taught feed matches zero links (once), richer feeling list, a nicer tap-the-headline picker for Teach. 3. Page-turn overlap on the Fold (not reproducible; wait for the 'Page turns' diagnostics line; don't retune); failing feeds only if still red after a refresh.
