# HANDOFF — live session memory (read first, update silently after every finished task)
Old detail (dated session logs, FIXES 16-26 notes, debugging traces) lives in `HANDOFF-ARCHIVE.md`: don't read it on boot, `grep` it only if needed.
Keep THIS file under ~8 KB: when it grows past that, move finished/dated items to the archive and keep only rules, open items and the next tasks.

Last updated: 2026-11-23 (work branch ccr-c1809217-pfx7fa; main = 1.387). Do NOT push HANDOFF-only commits to main (every push to main starts an APK build).
## 1. Working & locked (verified; don't change core logic without asking)
- Locked looks for Halcyon, the Daily and Headlines (palette, `--disp` headlines, `sh()`/`DAYDEK`, shared front page): archive grep 'moved-1387d'. Don't change them without asking.
- **Story card size** Compact|Medium|Large drives `--csz`. Cards|Columns (wire) view exists only with Medium/Large + tiles (by design). Daily + Compact sets `data-cards="narrow"` on `#grid` (CSS needs both selectors). Wire "Cards" sets `data-w="mag"`.
- **No location**: no permission/geolocation code. "Near you" = typed place, up to 10 saved (`S.places`), `locLang`. `nUrl` keeps `q=/query=/search=`.
- Excerpts end on whole words (`trimWords`, `sumOf`). Opaque docked tab bar `#mtabs`; pull-to-refresh `#pts`; Search closes after keyboard.
- **Reader**: No spanning title block in paged reader. Justified text uses hyphens. "Aa" = bottom sheet (Theme/Font/Focus/Large print) from ... menu (`data-act="aa"`). "Why it matters" stays (`whyBox`, `COOKIEJ`).
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
ACTIVE STATE (2026-11-23, end of session 01FNE57K): main = 1.387. 1.386 detail: archive grep 'moved-1387'.
- SESSION 01FNE57K (2026-11-23), SHIPPED as 1.387 (2026.11.23b) on David's `build`, merged to main 2026-11-23 (CHECK the APK build went green: it had only just started), browser-checked only (full notes: archive grep 'moved-1387e'; device checks at the end of TESTING.md):
  - Reader: tall pictures hug their frame (`img.tallp`); narrow two-column text left-aligned (rdVars `rfs()*40`); Fold title page restyled (`#rd.cpv2 .cols>.hsf.hs-top`).
  - Speed: ROOT CAUSE on David's Fold = `S.autoLow` (`html.lowp`) made `dpOk()` false, so the Daily read-ahead never ran (37 network taps vs 42 ready). dpOk/ldSlot no longer obey lowp. Also: getFull starts at the top of openReader; on-screen stories jump the read-ahead line; pump 3 at a time; diagnostics Preload line prints battery saver / data saver / lighter look.
  - David's batch: book card `.dchc` themed (green only in Halcyon); DAYDEK front line reworded; tod glow over `.top`; `#wpin` fades; chips row keeps scrollLeft across `render()`; Velvet tile gold box removed.
  - BLACK & WHITE = 'Broadsheet' (David picked; proposal https://claude.ai/artifact/T7uCum7B4mBmUMsby6ayyG): block at the END of the main style (`:root:root:is([data-theme=eink],[data-theme=einkd])`), night twin `einkd` (TWB), class `html.sq` (set where the theme is applied) squares every corner, tod glow hidden. Not done: bottom tab bar still slightly gray in day; check spinners that are now square.
  - NEXT: confirm build 452 is green; then ask for a fresh Copy diagnostics a day later; slow sites left: xda-developers, kotaku, engadget; 8 sites fail on Cloudflare bot checks. Open: Fold picture credit small; pfCap 6 stories under 50% battery; nothing read ahead on mobile data.
- SESSION 01FNE57L c (2026-11-23), on branch claude/checkout-ccr-aefb8e60-idp0ts-2nkggp, NOT shipped, browser-checked: build 452 (1.387) confirmed GREEN. Visual review of dark reader / end card / Fold lists / Settings (Halcyon dark, Broadsheet day + night): (1) 'The story so far' labels were the raw site color (unreadable on dark): now mixed 55% with ink (`.rprev em`, `.rn-t i`); (2) Broadsheet bars no longer take the warm time-of-day tint (`html.sq :is(.top,#tabs,...)`), which was the 'gray tab bar'; (3) Fold picture credit same size as its caption (`#rd .cols .body .cred`). Looked sound, no change: Daily cover, lists, Settings, end card. Screenshot trap: wait 4 s after render (cover landing animation looks like a cut-off bar). Not done: the 'Up next' note is cream on dark Halcyon (ask David); half-empty page before a tall picture.
- BARS (David picked T2 'a little slower', 2026-11-23), on branch, NOT shipped, browser-checked: `.top`, `#tabs`, `#wpin` tuck over .65s var(--ease-out) (rule next to `body #wpin[hidden]`; off with reduced motion / lowp). Section bar `#wpin` pop itself unchanged (no S pick yet; options page https://claude.ai/artifact/1A3PMmzsMXt9GWs3y68h6r: S1 heading sticks, S2 slides from under bar, S3 slow fade + names roll, S4 name into top bar, S5 small label, S6 none).
- DAVID'S DIRECTION (2026-11-23, last message): NOT Play paperwork. He wants (1) speed, (2) how the app functions, and MOST of all (3) the visuals: how the app looks and how it looks WHEN READING. Start the next session there.
- Tests: `boot` passes after `node tests/extract.js`; card_scrim tablet contrast 9.9 vs 10 on a bright photo (undecided: darken the overlay a touch). Emulator run 57: all 14 steps ok. TESTING.md ends with a 25-check FOLD SHORTLIST. Exit code 0 is not a pass: count `^FAIL`.
NEXT 3 TASKS:
1. Offer `build` for the three visual fixes on the branch (1.388). David's verdicts on 1.387 from the Fold: Black & White Broadsheet day + night (anything wrongly square: spinner, pull tree, switches, progress ring; bottom tab bar still gray in day), Fold title page + left-aligned columns, pinned section fade, chips row, top bar glow. Fix what he reports.
2. SPEED follow-up: a fresh Settings > Copy diagnostics a day after 1.387 ('Story opening' network vs ready; Preload line should say allowed true, Daily ~40 of 40). If network taps are still many: raise pfCap under 50% battery, allow on-screen read-ahead on mobile data (ask David), look at slow sites (xda-developers, kotaku, engadget) and the 8 feeds failing on Cloudflare bot checks.
3. VISUAL REVIEW, continue: dark-mode reader pages, end card, the lists on the Fold, Settings; Fold picture credit is very small. Then FUNCTION walk (first five minutes, empty/error moments). Waiting on David: Fold verdicts on 1.382/1.383 (then remove unused ccov/pcov cover code, inventory in FIXES.md); Play questions (paid at launch? personal or organization account?).
Pointers (older notes, messy stories, PM deep dive, idea book, insights task, launch checklist; NEVER commit family path or insights password): archive grep 'moved-1387b'. Locked: page turn 1280 ms. NO NEW SETTINGS. 'check messy stories' = `curl -s 'https://cypressreader.com/api/insights?messy=list'`.
