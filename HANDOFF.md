# HANDOFF — live session memory (read first, update silently after every finished task)
Old detail (dated session logs, FIXES 16-26 notes, debugging traces) lives in `HANDOFF-ARCHIVE.md`: don't read it on boot, `grep` it only if needed.
Keep THIS file under ~8 KB: when it grows past that, move finished/dated items to the archive and keep only rules, open items and the next tasks.

Last updated: 2026-10-26 · Branch: `main` · Code: web `2026.10.25k`, Android label **1.158 released (Top Story widget inflation fix: AdapterViewFlipper service streaming, Binder size safety, try/catch guards)**. Older labels: see archive.

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
Locked: page turn (Play Books style, tap turns 1280 ms, do not retune). Shipped and closed: 1.128-1.155 (list-view tidy, Teach CyPress, Add a feed search, review batches, Fold-as-small-tablet, junk filter v2, polish pass 1.148, editorial polish) — detail in `HANDOFF-ARCHIVE.md`. Pre-existing test failures: `st26`, `deep2`, `deep3`, `widget_push` (global playwright missing).
- **Side-by-side** = 3-way setting `S.splitm` (land/always/off; old `S.split` true=always, false=off; `splitMode`/`splitShape`/`sideways()` compares screen.width vs screen.height because the Fold's window is wider than tall both ways). VERIFIED on the Fold 1.139.
- **Widgets 1.156-1.157 (Editorial Overhaul):** 4x3 & 4x4 Magazine Spread (`cy_widget_list.xml`) pairs cinematic 60% full-bleed hero photo and 40% cream card hosting two secondary briefs side-by-side; replaced 3D StackView with full-bleed `AdapterViewFlipper` (`cy_widget_top.xml`, `cy_widget_card.xml`); eliminated nested inner card borders; dark brass kickers (`#8c6b2d`); direct deep linking via `CyExtras.openIntent` and `fillInIntent`.
- **Top Story Widget Inflation Fix (1.158):**
  - **Exact root cause:** The launcher error "Couldn't add widget" on Top Story was caused by two compounding issues: (1) `cy_widget_top.xml` had `android:loopViews="true"` on `<AdapterViewFlipper>` (attribute belongs to `StackView`, not `AdapterViewFlipper`), triggering an `InflateException`; (2) on API 31+, `CyWidgets.buildTop` packed all 5 full-bleed cards with large bitmaps into a single `RemoteCollectionItems` parcel, exceeding the 1 MB Binder transaction ceiling (`TransactionTooLargeException`) and passing `RemoteCollectionItems` to `AdapterViewFlipper` (unsupported by `AdapterViewAnimator`); (3) `CyFlipperRemoteViewsFactory` in `CyWidgetService.java` returned `null` instead of a fallback view when data was empty or loading.
  - **Files and layouts changed:**
    - `native/extras/res/layout/cy_widget_top.xml`: Removed invalid `android:loopViews="true"` from `AdapterViewFlipper`.
    - `native/extras/CyWidgets.java`: Always bind `CyWidgetService` via Intent (`rv.setRemoteAdapter(R.id.cy_flipper, intent)`) streaming items individually across Binder; added `buildFallbackTop()` and `buildStaticCard()`; in `cropFill()`, use `Bitmap.Config.RGB_565` for full-bleed cards; wrapped `buildTop` and `buildStackCard` in try/catch with `Log.e(TAG, ...)`.
    - `native/extras/CyWidgetService.java`: Guarded `onCreate`, `onDataSetChanged`, `getCount`, `getViewAt`, and `getLoadingView` with try/catch and `Log.e("CyWidget", ...)`, returning `buildStaticCard(mContext)` on error instead of `null`.
    - `native/extras/CyWidgetProvider.java`: Wrapped `onUpdate` and `onAppWidgetOptionsChanged` in try/catch with `Log.e(TAG, ...)`, updating with `buildFallbackTop(context)` on failure.
    - Version sync: Bumped to 1.158 (`www/index.html`, `.github/workflows/build-apk.yml`, `whats-new.txt`, `docs/app/index.html`, `docs/demo.html`).
  - **What could NOT be verified here:** Headless desktop environment lacks Android display/launcher and physical device hardware; actual home screen widget drag-and-drop, flipper animation, and Binder IPC execution must be verified on a real Android phone.
  - **Commit hash:** `b18c733` (`main`).

**Next 3 tasks:** 0. Phone-check 1.159 Top Story widget placement (TESTING.md; fallback bisect plan in the Top Story note below), flipper auto-rotation, and deep-link tap. 1. Read David's 1.148 phone feedback + support report (TESTING.md polish entries; Daily redraw on the Fold; widgets; Kindle). 2. Read the 1.147 report after his `build`: 'All' tap and deep redraws should be well under 1 s; `redraws` callers; 'longest at'. 3. Remaining phone checks: 1.135/1.136 Fold layout, junk filter, Teach + sitemap, feed search "calm"/"birdwatching", reader shimmer lines.
**Reader-typography branch (2026-10-26):** `claude/reader-typography` merged here (brief-story dateline stamp). Blank web preview = fresh-profile skeleton, same on main, NOT a regression; web (non-APK) now shows "Stories can’t load in this web preview" after 8 s. Merged main (1.158 widget inflation fix). Branch: `claude/reader-typography-handoff-yhnns0`.
**Top Story widget (2026-10-26):** 1.158 still showed "Couldn't add widget" on David's phone. Simplified on branch `claude/reader-typography-handoff-yhnns0`: `cy_widget_top.xml` now a plain `ViewFlipper`, pages added with `addView` (`buildTop`), only page 1 has a photo (Binder size). `CyWidgetService` is now unused. Released as 1.159 (web 2026.10.26a). If it STILL fails, next bisect: set `android:previewLayout` aside, then ship Top Story as the empty-state layout only.
