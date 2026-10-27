# HANDOFF — live session memory (read first, update silently after every finished task)
Old detail (dated session logs, FIXES 16-26 notes, debugging traces) lives in `HANDOFF-ARCHIVE.md`: don't read it on boot, `grep` it only if needed.
Keep THIS file under ~8 KB: when it grows past that, move finished/dated items to the archive and keep only rules, open items and the next tasks.

Last updated: 2026-10-27 · 1.173 SHIPPED (`build`) · web `2026.10.27f`, Android 1.173.

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
- Tests passing: `tests/syntax.js`, `st5`, `st18`, `st27`, `st29`, `control`. Pre-existing failures (also on main): `st26`, `deep2`, `deep3`.

## 2. Rules & tooling
- Single file `www/index.html`; hook copies to `docs/app/index.html` and rebuilds `docs/demo.html`. Don't read those copies.
- Fonts: Literata `--serif`, Cormorant `--fd`, `--disp` headlines. Theme vars `--bg --pn --ink --mut --ln --a1 --a2 --logo`. Photo cards white text on dark overlay.
- `#grid.list .card…` rules are strong; add `#grid.list` selectors, don't fight them. CSS-only fixes preferred; `fitPage1`/`fitHero`/`layout` are delicate.
- Preview: commit → push → `scripts/publish-preview.sh <branch>`. Apply briefs in THIS repo/branch.
- Release: on `build`: merge to `main`, label + `whats-new.txt` + workflow `APP_LABEL` in step.
- Mistakes to avoid: `pkill -f`; backgrounded `git stash`; test server dies between commands; port 8765 collisions; no `cypress-gemini-audit/`.

## 3. Dead ends (don't repeat)
- **'Flip through pages' magazine view (`mgp`)**: removed 2026-10-22 (commit 5256ada). Don't rebuild without brief.
- Forced hero card in list view (normal row). Cards/Columns "gone" = Compact size/list view. Nested `<form>` in Add dialog (use div+Enter). ABC News feed removed.

## 4. Active state & next 3 tasks
Locked: page turn (Play Books style, tap turns 1280 ms, do not retune). Shipped and closed: 1.128-1.155 (list-view tidy, Teach CyPress, Add a feed search, review batches, Fold-as-small-tablet, junk filter v2, polish pass 1.148, editorial polish) — detail in `HANDOFF-ARCHIVE.md`. Pre-existing test failures: `st26`, `deep2`, `deep3`, `widget_push` (global playwright missing), `briefing` ("designed end"), `boot`/`boot_cached` (need /tmp/t/chk.js), `brief_links` (CSP blocks its eval).
- **Side-by-side** = 3-way setting `S.splitm` (land/always/off; old `S.split` true=always, false=off; `splitMode`/`splitShape`/`sideways()` compares screen.width vs screen.height because the Fold's window is wider than tall both ways). VERIFIED on the Fold 1.139.
- **Widgets 1.156-1.157 (Editorial Overhaul):** 4x3 & 4x4 Magazine Spread (`cy_widget_list.xml`) pairs cinematic 60% full-bleed hero photo and 40% cream card hosting two secondary briefs side-by-side; replaced 3D StackView with full-bleed `AdapterViewFlipper` (`cy_widget_top.xml`, `cy_widget_card.xml`); eliminated nested inner card borders; dark brass kickers (`#8c6b2d`); direct deep linking via `CyExtras.openIntent` and `fillInIntent`.
- Top Story widget 1.158 inflation-fix detail: see `HANDOFF-ARCHIVE.md` (superseded by 1.159/1.160, verified on phone).
**Next 3 tasks:** 0. Phone-check 1.159 Top Story widget placement (TESTING.md; fallback bisect plan in the Top Story note below), flipper auto-rotation, and deep-link tap. 1. Read David's 1.148 phone feedback + support report (TESTING.md polish entries; Daily redraw on the Fold; widgets; Kindle). 2. Read the 1.147 report after his `build`: 'All' tap and deep redraws should be well under 1 s; `redraws` callers; 'longest at'. 3. Remaining phone checks: 1.135/1.136 Fold layout, junk filter, Teach + sitemap, feed search "calm"/"birdwatching", reader shimmer lines.
**Recent history (details in `HANDOFF-ARCHIVE.md`):** 1.164-1.169 shipped (Coast/Newsprint/Rosewood themes, scroll-jump fixes, tap-to-top, lock-screen player with time/Back 15/Forward 30/scrub, deep-check fixes). Branch `claude/theme-six-handoff-96ztep` carries unbumped post-1.169 fixes. Native Java: APK run 203 (1.169) PASSED.
**1.174 SHIPPED (2026-10-27, `build`; 1.173 APK run #207 not yet read):** look batch. Older 1.172/1.173 notes are in `HANDOFF-ARCHIVE.md`. In `www/index.html` (CSS blocks "1.174 look" and "part 2" at the end of the main stylesheet): One masthead (`latestMast` = date eyebrow + "All Stories"), one section style (`#grid.wire h3.dsh.wsec`: brass label+hairline, serif title, plain "Mark read"), cream source label on photo cards, giant monogram on no-photo cards (`.card.noimg::after` from `data-ini`), In brief timeline (`.fd-brief`, `.fd-bq` when <3), round monogram chip (`.sn[data-ini]::before`; card favicons removed), caption-under photo cards in a site's feed (`.card.cu` + `--pg` ring), `feedHead`/`fpSync` (top-bar title appears as `.fmast` scrolls away; `--fp` hairline), brass tab marker, brass skeletons, `.wnew` since-you-left marker, side menu "Your sites" (`.ysites`, top 6 by unread), two-line drop cap (`initial-letter:2`, no small-caps lead-in), highlights at story end (`.rhl`; the logo end mark already existed), Settings jump chips (`.sjump`, in-page only) + full descriptions + clearer switches, tip toast hides on first scroll, Aurora stale-background fix (`applyTheme`), jump catcher shows event gap and page height. All need phone checks (TESTING.md). Pre-existing test fails: grid_holes, copy_consistency (colour), st26, deep2/3, cover_*, briefing, boot*, brief_links.
**Not done / ideas left (2nd design artifact):** text-only card quote variant, reader Next-up already exists (`.rnext`/`.rf-next`), sticky section bar (`.sech`) still old style, theme picker row is a scroller (clipped name is by design).
**Active state:** work on `main`; branch `claude/theme-six-handoff-96ztep` = main.
**Next 3 tasks:** 1. Read APK run for 1.174 (and #207); fix build errors. 2. Phone-check TESTING.md 1.172-1.174 lines (offline fonts, speed on Fold, side bar, In brief timeline, caption-under cards, Settings chips, drop cap, Aurora switch). 3. If the scroll jump persists: Copy support info right after; the "unexplained" entry now says event gap and page height change.
