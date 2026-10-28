# HANDOFF — live session memory (read first, update silently after every finished task)
Old detail (dated session logs, FIXES 16-26 notes, debugging traces) lives in `HANDOFF-ARCHIVE.md`: don't read it on boot, `grep` it only if needed.
Keep THIS file under ~8 KB: when it grows past that, move finished/dated items to the archive and keep only rules, open items and the next tasks.

Last updated: 2026-10-28 · 1.194 SHIPPED (`build`) · web `2026.10.28t`, Android 1.194.

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
- Tests: ALL 167 suites pass (2026-10-28 full sweep: every old failure diagnosed; stale tests updated to the current design, harnesses repaired, st26 deleted with the retired Nocturne theme). Run long ones with `timeout 900`. Tests rewrite d7_*.png / sp/*.png screenshots: `git checkout` them, don't commit.

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
Locked: page turn (Play Books style, tap turns 1280 ms, do not retune). Shipped and closed: 1.128-1.155 (list-view tidy, Teach CyPress, Add a feed search, review batches, Fold-as-small-tablet, junk filter v2, polish pass 1.148, editorial polish) — detail in `HANDOFF-ARCHIVE.md`. No known test failures (see section 1).
- **Side-by-side** = 3-way setting `S.splitm` (land/always/off; old `S.split` true=always, false=off; `splitMode`/`splitShape`/`sideways()` compares screen.width vs screen.height because the Fold's window is wider than tall both ways). VERIFIED on the Fold 1.139.
**Active state:** branch `claude/theme-six-handoff-9l5kv7` (same commit as `-p4kqng` = main 1.194) (1.192-1.194 on main) (1.185-1.191 on main; earlier `-4mbkkx`) (continues `-f59gxy`, `-vdvk42`, `-s31j30`; 1.187 on main). Older batch detail (1.175-1.183: Car mode `#tdr.car`, `wireSavePos` in-memory, `cvAhead`, `UCC`, `splitShape` sideways-only, MutationObserver `pressSync` fix, `quietGap`) is in `HANDOFF-ARCHIVE.md`. USER RULE: the Motion Showroom artifact (https://claude.ai/artifact/W5meRM5trXS4LfJurN85dR) is the visual reference. LESSON: run `sync-whats-new.js` AFTER the version bump. NOTE: local `main` in the container is an unrelated old branch; release by `git push origin <branch>:main` (fast-forward). Fling harness: manual CDP `Input.dispatchTouchEvent`; set `splitm:'off'`.
1.191 app check (David): 1% slow frames, worst 92 ms, 0 >100 ms, 0 script; largest photo 2560px (under 6 MP gate). Second 1.191 check (feed switches via side list): `render` 228-238 ms per side-list tap (`DIV#side-list.onclick`) = possible later task (faster feed switch); `Promise.resolve` 55 ms. 1.192: `shrinkImg` gate now `naturalWidth>1600` (was >6 MP).
1.192 All Stories check (291 cards, 73,000 px fling): 19% slow; main-thread `shrinkImg` resize 1341 ms + `aheadImgs` every 160 ms (392 ms) + forced layout in onscroll. 1.193: shrink resize/encode in a blob Worker (`shrinkOff`/`SHW`, CSP `worker-src 'self' blob:`), `aheadSoon` debounced to scroll pauses.
1.193 checks: All Stories (479 cards) 21% slow, but 2834 ms was the scroll check's own `PERF.sc` forcing layout in the scroll event; `fixOrph` 471 ms (block appends). Daily (digest) 4%: tab-tap `render` 190-246 ms (`#document.onclick` data-bm), few 0-script raster frames ≤337 ms. 1.194: `PERF.sc` only marks, `PERF.fl` reads scrollTop after paint (rAF→setTimeout).
**Next 3 tasks:** 0. 1.194 SHIPPED (honest scroll check). David: redo All Stories + Daily checks from the 1.194 app. Then targets: `fixOrph` on long All Stories, tab/feed-switch `render` ~230 ms. (1.193 SHIPPED worker shrink.) Old: scroll check on All Stories AND Daily from the 1.193 app (photos loaded largest should be ≤1600px; if stalls remain with 0 script, next suspects: GPU upload of many 1500-2000px photos, consider shrinking >3 MP too) (compare 1.186 app: 4% slow frames, worst 167 ms). If still lagging, gate the worker-sweep suspects (save() timers, saveCache0 rIC timeout, ungated parse paths) (compare 1.183: 17% frames >20 ms, worst 492 ms); `trfPass`/`aheadImgs` fixed in 1.185, find the next suspect from his trace.
 1. Phone-check TESTING.md 'Scroll jitter round 2' (1.183) + 'Feed scroll glide' (1.182), new scroll check from David, '1.180 picks', 'Car mode', 'Feed scroll stutter' and earlier picks lines; ask David for a new scroll check on the Fold. 2. Picks queue is empty (tilt card needs a touch design); ask David for the next batch, compare looks with the Motion Showroom artifact. 3. Next release: 1.195 (bump version FIRST, then `sync-whats-new.js`, then syntax) on `build`; release = `git push origin <branch>:main` (fast-forward).