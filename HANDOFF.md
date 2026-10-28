# HANDOFF — live session memory (read first, update silently after every finished task)
Old detail (dated session logs, FIXES 16-26 notes, debugging traces) lives in `HANDOFF-ARCHIVE.md`: don't read it on boot, `grep` it only if needed.
Keep THIS file under ~8 KB: when it grows past that, move finished/dated items to the archive and keep only rules, open items and the next tasks.

Last updated: 2026-10-28 · 1.187 SHIPPED (`build`) · web `2026.10.28m`, Android 1.187.

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
**Active state:** branch `claude/theme-six-handoff-4mbkkx` (continues `-f59gxy`, `-vdvk42`, `-s31j30`; 1.187 on main). Older batch detail (1.175-1.183: Car mode `#tdr.car`, `wireSavePos` in-memory, `cvAhead`, `UCC`, `splitShape` sideways-only, MutationObserver `pressSync` fix, `quietGap`) is in `HANDOFF-ARCHIVE.md`. USER RULE: the Motion Showroom artifact (https://claude.ai/artifact/W5meRM5trXS4LfJurN85dR) is the visual reference. LESSON: run `sync-whats-new.js` AFTER the version bump. NOTE: local `main` in the container is an unrelated old branch; release by `git push origin <branch>:main` (fast-forward). Fling harness: manual CDP `Input.dispatchTouchEvent`; set `splitm:'off'`.
1.184 = scroll round 3 (`fixOrph` `P._oc` skip; `PARIO` parRead in rAF). 1.185 = scroll round 4 (shipped): `trfPass` (translated headlines) now measures each nearby card once (`near()`), skips text in offscreen cards, never measures inside skipped cards; `aheadImgs` skips pictures in cards cvAhead watches (`c._cv`) except big openers. scroll_cost/perf_scroll/deep_scroll/continuous pass.
1.186 = scroll round 5 (shipped; David: smooth on the preview site): David's 1.185 check = 1% slow frames, worst 183 ms; with Pictures = No pictures it was 0%, worst 100 ms, so photos cause the rest. `.card>img{backface-visibility:hidden}` gave every photo AND every overlapping card its own GPU layer (47 layers → 15, CDP LayerTree): rule removed. Watch for photo flicker on card zoom/tap.
1.187 = scroll round 6 (shipped): David: 1.186 smooth on the preview site but NOT in the app (4% slow frames, worst 167 ms). The app's real data (40 MB heap, many feeds) runs background jobs: after a scroll pause every waiting `og()` offline save (DOMParser+`extract`, 20-45 ms each) woke at once, 4 in one frame. Fix: `quietGap` is now a one-at-a-time lane (`BGL`, 16 ms between jobs, each re-checks `userBusy`); `og()` does `extract` in its own `bgGate` turn. Worker sweep found other ungated spots (save() JSON of S from `dpRun` 8137 timers, `saveCache0` rIC timeout 5 s, ungated `parse` in gnewsFeed/repairFeed): next suspects if still lagging.
**Next 3 tasks:** 0. David: send a scroll check from the 1.187 APP (compare 1.186 app: 4% slow frames, worst 167 ms). If still lagging, gate the worker-sweep suspects (save() timers, saveCache0 rIC timeout, ungated parse paths) (compare 1.183: 17% frames >20 ms, worst 492 ms); `trfPass`/`aheadImgs` fixed in 1.185, find the next suspect from his trace.
 1. Phone-check TESTING.md 'Scroll jitter round 2' (1.183) + 'Feed scroll glide' (1.182), new scroll check from David, '1.180 picks', 'Car mode', 'Feed scroll stutter' and earlier picks lines; ask David for a new scroll check on the Fold. 2. Picks queue is empty (tilt card needs a touch design); ask David for the next batch, compare looks with the Motion Showroom artifact. 3. Next release: 1.188 (bump version FIRST, then `sync-whats-new.js`, then syntax) on `build`; release = `git push origin <branch>:main` (fast-forward).