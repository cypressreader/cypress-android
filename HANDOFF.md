# HANDOFF — live session memory (read first, update silently after every finished task)
Old detail (dated session logs, FIXES 16-26 notes, debugging traces) lives in `HANDOFF-ARCHIVE.md`: don't read it on boot, `grep` it only if needed.
Keep THIS file under ~8 KB: when it grows past that, move finished/dated items to the archive and keep only rules, open items and the next tasks.

Last updated: 2026-10-24 · Branch: `claude/magazine-sections` · Code: web `2026.10.24a`, Android label **1.128 (merged to `main` 2026-10-24 on David's `build`)**. Older labels: see archive.

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
- Preview: commit → push → `scripts/publish-preview.sh claude/cool-darwin-nkj7it`. Pasted briefs naming "cypress-preview / experiment/daily-redesign" are applied in THIS repo/branch.
- Release: only on the user's `build`: merge to `main`, label + `whats-new.txt` + workflow `APP_LABEL` in step; remind about `docs/worker/share-worker.js` only if it changed (unchanged since 1.107).
- Mistakes to avoid: `pkill -f`; backgrounded `git stash`; unset-var `cat >`; test server dies between commands; port 8765 collisions; don't commit `cypress-gemini-audit/`; throwaway scripts go in the scratchpad.

## 3. Dead ends (don't repeat)
- **'Flip through pages' magazine view (`mgp`)**: built as an experiment 2026-10-21, David judged it "doesn't look good" and it was removed 2026-10-22 (commit reverts 5256ada). Don't rebuild it without a new design brief.
- Forced hero card in list view (solved: normal row). Cards/Columns "gone" = Compact size or list view, not a bug. Nested `<form>` in Add dialog (use div + Enter). Heavy-sans reader title not reproducible (ask `S.font`, `S.hfont`). ABC News feed removed.

## 4. Active state & next 3 tasks
Locked: page turn (Play Books style, tap turns 1280 ms, do not retune). Released: 1.127 (merged to `main` 2026-10-23: faster Daily, story grouping, saved Daily page, menu-tap diagnostics). Full detail of everything since 1.124 is in `HANDOFF-ARCHIVE.md` ('Moved from HANDOFF 2026-10-24').
**Branch `claude/magazine-sections` (side preview slot `magazine`; NOT built, David reviews first, never build without `build`):**
- Slow-story fix: a short story the site gave in full (200+ words, no paywall sign) no longer waits for the Morss/partner search (`truncReason(n,url,own)`).
- List view (S.view==='list') is now a TIDY INDEX (2026-10-24, David's call: list and tile felt too alike): `lrKind` returns '' (no feat/quote rows), pairs disabled (`if(false&&...)` in `listFlow`), wire sections off for list, small spaced-caps `h4.lr-h` day headings. Code for the variety is still there, dormant; remove if David keeps this. No letter tiles, thumbnails fade in.
- Tile view: Deep reads reverted to 1.127; 'Quick hits' header kept, thick black line above it, 'Keep exploring' and the river heading removed.
- Squarish screens (unfolded phone 859x847): caps on `.wmom`, cover story picture and feed cover masthead.
- No-picture cards (2026-10-24, implemented, unverified on device): faint letter removed in wire view; opener (`lead`/`nr-lead`/`nr-hero` + noimg) shows `nrQuoteText` as `p.lq` pull-quote; ordinary noimg h3 bigger; feed description paragraphs get a space (RSS parse near `i.description`). Option E (brass topic icons) and list-view ideas 1-8 (Keep exploring strip, read fade, caught-up count, chips, grouping, swipe) were shown to David, not chosen yet.
- List view life (2026-10-24): read-dim already existed (`.card.read`); added brass unread dot (`.src::before`) and `.lr-n` "N of M read" in `h4.lr-h` (`listFlow` `gc`/`rdn`). David was shown 12 more list ideas (time rail, feed color edge, rising tag, Top 5, tap to peek, source runs, length bar, part-of-day headings, chips, soft entrance); he has not picked beyond the dot + progress yet.
- List page (2026-10-24): David first chose 'Edition' (contents + chapters + In brief), then REMOVED the chapters/contents/In brief/Quick-vs-Long (same job as the side bar, and chapters hide which stories are newest). `listPage` is now just the greeting line `.lr-dv` + `listFlow` (day headings, newest first). Don't rebuild chapters.
- Muse web review (2026-10-24): fixed banner crying wolf (`bodyFull`, body >2200 chars never shows failure/trying note) and Daily 'Also in this issue' now skips `skip` set. Cover now stays put (Daily lead kept while still in the edition top list and unread); NOT done: photo-less monogram/blank tiles; Remove feed/Delete folder already confirm + undo (left).
- Teach CyPress rewrite (2026-10-24, branch, unreleased): `learnPattern` now uses the biggest family of look-alike links (was matching menus on sites like wondermind.com); `learnCards` reads headline + picture per card; `scrapeLearned` keeps first-seen dates in `f.seen` so a page without dates only shows new stories once. Checked on a saved copy of wondermind.com (29 stories). Wondermind's own feed is stale since May 2025: the homepage is curated old stories.
- Friend's naming is the reverse of the app's: he calls the tile view 'list view' and the list view 'tile view'.
**Next 3 tasks:** 1. David installs 1.128 and checks the `TESTING.md` entries (list view, banner, Daily cover, photo-less cards). 2. Page-turn overlap seen once on the Fold (old right page incl. 'Why it matters' box over the new page for ~0.8 s): not reproducible; wait for another sighting + the 'Page turns' line in Copy diagnostics; do not retune the curl. 3. Optional ideas David has not chosen: list view 'Keep exploring' strip label, repeated per-chunk day headings, gentler picture loading elsewhere; failing feeds (Tom's Guide, CBS News, Gizmodo...) only if they stay red after a refresh.
