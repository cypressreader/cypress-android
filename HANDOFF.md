# HANDOFF — live session memory (read first, update silently after every finished task)
Old detail (dated session logs, FIXES 16-26 notes, debugging traces) lives in `HANDOFF-ARCHIVE.md`: don't read it on boot, `grep` it only if needed.
Keep THIS file under ~8 KB: when it grows past that, move finished/dated items to the archive and keep only rules, open items and the next tasks.

Last updated: 2026-10-19 · Branch: `claude/cool-darwin-nkj7it` · Code: web `2026.10.19b`+, Android label **1.111** (released, tag `v131`, APK attached). Branch is clean and level with `main`.

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
- Tablet: list view two columns, 2-line summaries; picture cards capped 170 px; `fixOrph()` widens short last rows; trio/strip count classes (`nr-t1/t2`, `nr-s1..s3`); Cards-view rows use `auto-fit`. **Removed on purpose** (suspected stutter): `:has()` rules, muted card tint, favicon letter tile.
- Site, privacy, demo (generated), tablet page: US spelling, no publisher names. Near you sends typed place to Google News and Bing News (disclosed on privacy page).
- Tests passing: `tests/syntax.js`, `st5`, `st18`, `st27`, `st29`, `control`. Pre-existing failures (also on main): `st26`, `deep2`, `deep3`.

## 2. Rules & tooling
- Single file `www/index.html`; hook copies to `docs/app/index.html` and rebuilds `docs/demo.html`. Don't read those copies.
- Fonts: Literata `--serif`, Cormorant `--fd`, `--disp` headlines. Theme vars `--bg --pn --ink --mut --ln --a1 --a2 --logo`. Photo cards white text on dark overlay.
- `#grid.list .card…` rules are strong; add `#grid.list` selectors, don't fight them. CSS-only fixes preferred; `fitPage1`/`fitHero`/`layout` are delicate.
- Preview: commit → push → `scripts/publish-preview.sh claude/cool-darwin-nkj7it`. Pasted briefs naming "cypress-preview / experiment/daily-redesign" are applied in THIS repo/branch.
- Release: only on the user's `build`: merge to `main`, label + `whats-new.txt` + workflow `APP_LABEL` in step; remind about `docs/worker/share-worker.js` only if it changed (unchanged since 1.107).
- Mistakes to avoid: `pkill -f`; backgrounded `git stash`; unset-var `cat >`; test server dies between commands; port 8765 collisions; don't commit `cypress-gemini-audit/`; throwaway scripts go in the scratchpad.

## 3. Dead ends (don't repeat)
- Forced hero card in list view (solved: normal row). Cards/Columns "gone" = Compact size or list view, not a bug. Nested `<form>` in Add dialog (use div + Enter). Heavy-sans reader title not reproducible (ask `S.font`, `S.hfont`). ABC News feed removed.
- Return-feed stutter/flash causes (all fixed in 1.111): `startViewTransition` on close, `render()` on progress change, `content-visibility:auto` layout shift, body column re-flow while reading. The `:has()`/tint/favicon changes were NOT the cause.
- Visual-Test (AI Studio) repo: **user said do NOT port its visual enhancements yet**; review together first. Items to fix if ported: panel drag-to-close, OLED in `THEME_NAMES`/`twinApply`, no fake storage breakdown. Details in the archive §3c.

## 4. Active state & next 3 tasks
**Page turn (2026-10-19, preview, unverified on device):** to match Play Books the curl shading was lightened (strip shade .3→.12, fallback .42→.2, under-page .32→.14, edge cast .34→.2), `.book` perspective 3200→5200, tap-turn duration 780→620 ms (`go()`). Round 2 (user: 'looks like a floppy board being flipped'): strips 9→16 (6→10 on low-end), bend `CB=70°` (was 26) concentrated at the free edge (`CP=2.4` weights), in `setAng`. Round 1 kept: lighter shading, 5200 perspective, 620 ms. Test: `TESTING.md` last entry.
**State:** 1.111 released and unverified on devices (everything in `TESTING.md` for 1.107-1.111). Nothing unreleased on the branch except this trimmed handoff.
1. Wait for the user's device feedback on 1.111 (feed jump/flash on return; blank half in Cards-view short rows; tablet rows/tiles). Fix what they report.
2. FIXES 19 remainder (only after their tablet/fold screenshots): `@container` rules for worst components; Settings tablet layout. Muse item 1 (Daily Brief clipped banner) needs a screenshot.
3. Visual-Test review with the user (do not port first).
