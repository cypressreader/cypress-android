# HANDOFF — live session memory (read first, update silently after every finished task)
Old detail (dated session logs, FIXES 16-26 notes, debugging traces) lives in `HANDOFF-ARCHIVE.md`: don't read it on boot, `grep` it only if needed.
Keep THIS file under ~8 KB: when it grows past that, move finished/dated items to the archive and keep only rules, open items and the next tasks.

Last updated: 2026-11-08 (main = 1.286, APK run 345 started).
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
- Mistakes to avoid: version bump by sed line number (line moves; use the pattern and check), `pkill -f`; backgrounded `git stash`; test server dies between commands; port 8765 collisions; no `cypress-gemini-audit/`.

## 3. Dead ends (don't repeat)
- **'Flip through pages' magazine view (`mgp`)**: removed 2026-10-22 (commit 5256ada). Don't rebuild without brief.
- Perf dead ends (fixOrph in rAF, sticky `nv`, `cutOf` cache key, cheapening `endTurn`, read-ahead timer storm, preloading Inter, close-from-Daily tweaks), forced hero card in list view, shrinking feed photos <1600px, nested `<form>` in Add dialog, ABC News feed, L6 timeline: full notes in `HANDOFF-ARCHIVE.md` (grep "Dead ends moved"). Cards/Columns "gone" = Compact size/list view.

## 4. Active state & next 3 tasks
**SHIPPED 1.274: Books** (code block before `renderBack`, `cypress-books` IDB, `bkHtml`, `renderBooks`; openReader `if(a.book)` fast path). Detail: archive grep "c3wydg-2" and "books-phase0".
Locked: page turn (Play Books style, tap turns 1280 ms, do not retune). Older shipped work: `HANDOFF-ARCHIVE.md`. **Tests: exit code 0 does NOT mean pass; count `^FAIL` lines.** Pre-existing failures (same on session base 27ae568, 2026-11-02 full suite): deep2 deep3 feat_run (vm harness, not an app bug) native st16 st17 st2 st3 st4 st7b st9 st26 (MODULE_NOT_FOUND); layout flakes at 1366.
**Key facts kept from 4wgedt (detail in archive):** worker `cypress-share` on Cloudflare (bindings SHORT, STATS, secrets INSIGHTS_KEY, FAMILY_PATH, FAMILY_CODE; redeploy = PUT multipart with ALL bindings/keep_bindings). Web app is family-only at a secret path; github.io copy redirects home (shipped in 1.232). Store kit in `store/`; audit `audit/store-readiness` branch, findings https://claude.ai/artifact/8ZeRvqt8bmAPEvVUqU6X4R. NEVER commit family path/password or insights password (public repo). Price $2.99/mo, $24.99/yr, 14-day trial.
**Launch checklist (source of truth for what's left):** https://claude.ai/artifact/AQ7G5AMrwmYHipy28frpkt (db collection `items`: list app|store, grp, t, d, ref audit #, done, st wip|blocked). Read with ArtifactData list; tick items with update + if_version when work finishes.
**Insights:** live (cypressreader.com/insights, worker POST /api/insights, daily check task trig_01KNpzQ3Cuz1KeDcZ2rZv1YW 7:04 PT). `curl -s https://cypressreader.com/api/insights` works (never print/commit the key). Worker deploy recipe + detail: archive (grep 'moved ppo0d5').
**SHIPPED 1.285/1.286:** mini player replaces the read-aloud pill `#afx` in the reader (tminiSync no longer hides when reader shows the story; `R.ttsPad` reserves `--dockh`; `body.hasdock #rd.vert .view::after`). Dynamic: one-time reset of `S.dynm` to `sys` on load (flag `S.dmv`); later picks stick. Dynamic pace: dwell 250-700 ms, min gap 600 ms, idle 200 ms, band -20%/-45%, dist<30, text rows `[data-href]` watched. Ideas not done: strongest photo color instead of average (`analyzePx` t), most-visible story. Side panel rows 44px (padding 6px), `.frmo` … hidden on touch too (hold opens settings).
1.283/1.284 detail: archive grep 'moved o3lbuq'.
**Next 3 tasks:** 1. David installs 1.286 (run 345) and checks TESTING.md 'Mini player in the reader', Dynamic, side panel rows, 'Keep listening while you look at another story', 'Book listening 1-7', 'Book ideas 1-4'. David OK'd the background-ends-goes-to-Up-next behavior. 2. Tune shake threshold (13 m/s², 3 jolts in 1.2 s) from device feedback. 3. Blocked on David: developer name, account type, free vs paid, Cloudflare Web Analytics off, full-story helpers (a30). Reminder scheduled 2026-11-21 10:00 PT (trig_01Wso38mBKPVg2bCmNsjBaFM); don't nag before then. Test books: Standard Ebooks, Gutenberg, Baen, samples; never pirated. Note: the container's local `main` is a stale unrelated clone; merge onto `origin/main` (detached) and push HEAD:main.

**Books Phase 1 + messy sweep detail (what's implemented, symbol by symbol): HANDOFF-ARCHIVE grep 'books-phase1-moved'.**
