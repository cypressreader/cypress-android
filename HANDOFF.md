# HANDOFF — live session memory (read first, update silently after every finished task)
Old detail (dated session logs, FIXES 16-26 notes, debugging traces) lives in `HANDOFF-ARCHIVE.md`: don't read it on boot, `grep` it only if needed.
Keep THIS file under ~8 KB: when it grows past that, move finished/dated items to the archive and keep only rules, open items and the next tasks.

Last updated: 2026-11-06 (1.269 merged to main (C3 C4 C5 A14), APK run 42176939481; branch n921s1)
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
- Mistakes to avoid: `pkill -f`; backgrounded `git stash`; test server dies between commands; port 8765 collisions; no `cypress-gemini-audit/`.

## 3. Dead ends (don't repeat)
- **'Flip through pages' magazine view (`mgp`)**: removed 2026-10-22 (commit 5256ada). Don't rebuild without brief.
- Perf dead ends (fixOrph in rAF, sticky `nv`, `cutOf` cache key, cheapening `endTurn`, read-ahead timer storm, preloading Inter, close-from-Daily tweaks), forced hero card in list view, shrinking feed photos <1600px, nested `<form>` in Add dialog, ABC News feed, L6 timeline: full notes in `HANDOFF-ARCHIVE.md` (grep "Dead ends moved"). Cards/Columns "gone" = Compact size/list view.

## 4. Active state & next 3 tasks
Locked: page turn (Play Books style, tap turns 1280 ms, do not retune). Older shipped work: `HANDOFF-ARCHIVE.md`. **Tests: exit code 0 does NOT mean pass; count `^FAIL` lines.** Pre-existing failures (same on session base 27ae568, 2026-11-02 full suite): deep2 deep3 feat_run (vm harness, not an app bug) native st16 st17 st2 st3 st4 st7b st9 st26 (MODULE_NOT_FOUND); layout flakes at 1366.
- **Side-by-side** = 3-way setting `S.splitm` (land/always/off; old `S.split` true=always, false=off; `splitMode`/`splitShape`/`sideways()` compares screen.width vs screen.height because the Fold's window is wider than tall both ways). VERIFIED on the Fold 1.139.
**Key facts kept from 4wgedt (detail in archive):** worker `cypress-share` on Cloudflare (bindings SHORT, STATS, secrets INSIGHTS_KEY, FAMILY_PATH, FAMILY_CODE; redeploy = PUT multipart with ALL bindings/keep_bindings). Web app is family-only at a secret path; github.io copy redirects home (shipped in 1.232). Store kit in `store/`; audit `audit/store-readiness` branch, findings https://claude.ai/artifact/8ZeRvqt8bmAPEvVUqU6X4R. NEVER commit family path/password or insights password (public repo). Price $2.99/mo, $24.99/yr, 14-day trial.
**Launch checklist (source of truth for what's left):** https://claude.ai/artifact/AQ7G5AMrwmYHipy28frpkt (db collection `items`: list app|store, grp, t, d, ref audit #, done, st wip|blocked). Read with ArtifactData list; tick items with update + if_version when work finishes.
**Insights:** live (cypressreader.com/insights, worker POST /api/insights, daily check task trig_01KNpzQ3Cuz1KeDcZ2rZv1YW 7:04 PT). `curl -s https://cypressreader.com/api/insights` works (never print/commit the key). Worker deploy recipe + detail: archive (grep 'moved ppo0d5').
**1.238-1.250 notes: HANDOFF-ARCHIVE.md (grep 'moved h0vq5j'). 1.249: weekly feed check task trig_01WVzHQzsP4WKKeQA47q1xys (Sun 19:23 PT). Feed test method: curl --compressed mobile UA, need <rss|feed> + >0 <item|entry>. `CATY` 5th element (topics) REQUIRED.**
**1.253 shipped (voice play, bot-block hidden browser, real Chrome UA): detail in HANDOFF-ARCHIVE.md (grep 'moved eldcyo').**
**1.257-1.264 fold work (merged, APK green): HANDOFF-ARCHIVE.md (grep 'moved lfeljy').** fold/unfold never calls `render()`; `shapeChanged` reads `documentElement.clientWidth/Height`. Tools: `tests/layout.js` (row-gap line fails pre-existing), `tests/fold_stale.js`, `tests/unfold_cost.js`.
**1.265-1.267 (windowing dead end, fold place keeping via `shpSave`/`shpHold`): HANDOFF-ARCHIVE.md (grep 'moved hty0c3'). Don't retry DOM windowing; The Well fix stays.**
**FRESH EYES QUEUE (David 11-06 picked: ALL of A, ALL of B, C2-C6; C1 skipped). Artifact https://claude.ai/artifact/RHjcSJxAy9Y6ZdKyrqPk58 has each item's full text.** Done items A1 A2 A4 A5, B1-B10, C2 C6 (1.268): HANDOFF-ARCHIVE.md (grep 'moved n921s1').
C: C2 mark older than 1/3/7 days read; C3 past last page → next story (page turn itself untouched); C4 plain high-contrast theme; C5 draggable progress line with section ticks; C6 look-up word in selection bar.
Order: finish A (one or two sessions, one commit per few items, re-shoot), then B5 B6 B2 B3 B7 B9, then C. Bump label once per shipped batch (next 1.268) + whats-new.
C4 done (1.269): theme `contrast` "High Contrast" = `RETIRED.contrast='eink'` (effTheme returns eink, all B&W CSS applies) + `html.hc` class set in applyTheme/boot; `html.hc` rules: --mut/--a2/--a3/--ln pure ink (!important beats HANDTWIN inline), 3px card borders, 4px `.tbi`, reader links underlined, read items not faded, 3px focus ring. thmPal falls back via RETIRED. Daily cover keeps its fixed design (as in B&W).
C3 done: turn-past-last-page already armed `R.endArmed` + second turn `advanceNext()`; now `rnHint(t,n)` shows a peek card (`#rnh.pk`: Up next · site, headline, hint) that slides in. C5 done: `#dial` was already draggable in both modes; `dialTicks(d)` (called from dialSync, rebuilt on key link|np|vert|scrollHeight) adds `<b>` marks at `.body` h2-h4 (page: `findPage`/span; scroll: offset-24 / scroll span), drag snaps within 10px (`d._tf`). Hidden with the dial in scroll mode until hover/drag/focus.
A14 rest done: two-up footers line up (`.card.nr:is(.dq-c,.nr-row,.nr-late)>.tx` flex column stretched, `.cfoot` margin-top:auto; was up to 89px off with uneven headlines at 840px); `#sideh` edge tab pill-rounded and says "Sites" (matches My Sites). Dark cover double frame left (same in light, intended). B9 closed: swipe-down close (`#rd` touchend, >130px <700ms -> `closeRd`) has no close animation, so flick speed has nothing to follow.
**Next 3 tasks:** 1. Check APK run 42176939481 went green. 2. David tests 1.268 + 1.269 on phone (TESTING.md lists). 3. Fresh Eyes queue is empty: ask David what's next (new review, or phone findings). Next label 1.270.
