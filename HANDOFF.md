# HANDOFF — live session memory (read first, update silently after every finished task)
Old detail (dated session logs, FIXES 16-26 notes, debugging traces) lives in `HANDOFF-ARCHIVE.md`: don't read it on boot, `grep` it only if needed.
Keep THIS file under ~8 KB: when it grows past that, move finished/dated items to the archive and keep only rules, open items and the next tasks.

Last updated: 2026-11-18 (main = 1.343 (2026.11.17i) = smarter mute, folio/dial, AI label, opener quote, XDA/TechRadar cleanup; build 408 + Tests 1636 GREEN (confirmed 2026-11-18). Work branch claude/handoff-continuation-ilc3hc = main). Do NOT push HANDOFF-only commits to main (every push to main starts an APK build).
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
- Shell edits (sed/python) to `www/index.html` BYPASS the copy hook: always `cp www/index.html docs/app/index.html && node scripts/build-demo.js` after them.
- Mistakes to avoid: version bump by sed line number (line moves; use the pattern and check), `pkill -f`; backgrounded `git stash`; test server dies between commands; port 8765 collisions; no `cypress-gemini-audit/`.

## 3. Dead ends (don't repeat)
- **'Flip through pages' magazine view (`mgp`)**: removed 2026-10-22 (commit 5256ada). Don't rebuild without brief.
- Perf dead ends (fixOrph in rAF, sticky `nv`, `cutOf` cache key, cheapening `endTurn`, read-ahead timer storm, preloading Inter, close-from-Daily tweaks), forced hero card in list view, shrinking feed photos <1600px, nested `<form>` in Add dialog, ABC News feed, L6 timeline: full notes in `HANDOFF-ARCHIVE.md` (grep "Dead ends moved"). Cards/Columns "gone" = Compact size/list view.

## 4. Active state & next 3 tasks
Full detail of everything below: archive grep 'moved-1323b' (older: 'moved-1323', 'moved-1320', 'moved-1315'; NEVER commit family path or insights password). Insights daily check task trig_01KNpzQ3Cuz1KeDcZ2rZv1YW. Launch checklist: https://claude.ai/artifact/AQ7G5AMrwmYHipy28frpkt. Locked: page turn 1280 ms; whole-screen picture covers stay (David loves them), the card now turns like a leaf. NO NEW SETTINGS (David 2026-11-12: Settings is already a lot; looks are picked per story where they fit). **Tests: exit code 0 does NOT mean pass; count `^FAIL` lines.** Test clean-up 2026-11-16: 15 stale tests brought in line with the app (feat_run deleted). 2026-11-16 b: cinematic (33), deep2 (122), deep3 (194) ALL GREEN (stale checks updated: essay look has no pull quote by design, pace limit, md needs real paragraphs, askBox not prompt, one-page sources step). deep2 idb 'old cache migrated' flaked once. STILL FAILING: boot (needs /tmp/t/chk.js from tests/extract.js); layout flakes at 1366.
**Tests:** cover_rules + mixing flake (rerun alone). Page-turn copies trip tests: filter `.tl,.tl-leaf`.
**1.337 (Daily listening resumes, player-close lag, `*` selector RULE: never end a selector in `*` after a `[class*=]` test) + 1.338 (smoother Dynamic: `dynBars`, `dynTrim` only on story open/tab switch):** archive grep 'moved-1339'.
**Send a messy story (1.339-1.341 history, worker deploy notes, Cloudflare script `cypress-share`):** archive grep 'moved-1343'. Worker cap 3 MB; read via `curl -s 'https://cypressreader.com/api/insights?messy=list'` then `?messy=<t>`. Command David uses: 'check messy stories'.
**Widget buttons (branch only, NOT built):** David 2026-11-18: 1-4 of the 1.343 checks fine; Top Story widget buttons tiny. Save/Listen/prev/next 32->44dp (cy_widget_card.xml acts marginEnd 116, cy_widget_top.xml controls), chevron drawables lost their inner circle, cy_w_pill_bg radius 99dp, Save/Listen need widget >=320dp (`CyWidgets.java` acts). Ship on `build` (needs version bump + whats-new).
**Favorite sites first (branch only, NOT built):** David 2026-11-18. `habS()` = per-site score from `S.ops` (opens halved per 30 days since last open; null under 20 opens). `habSort` (background downloads + Daily pre-download) now round-robins sites by score (top up to 3/round), 2 favorite-site stories then 1 never-opened; keeps each site's order, sorts in place. Refresh (`loadAll0`): site on screen first, then by `habS` score (was sidebar order).
**1.343 (smarter mute chips, folio/dial, AI label, Dynamic opener quote, XDA/TechRadar cleanup):** shipped + green; archive grep 'moved-1343b'. David 2026-11-18: mute, footer, AI label, opener all OK on the Fold.
**Next 3 tasks:**
TOP. On `build`: ship branch (widget buttons + favorite sites first): version bump, whats-new, workflow APP_LABEL. Messy: 'check messy stories' -> ?messy=list (2026-11-18 = 4 known: XDA, TechRadar, MUO fixed; Slashdot blocks app). Add a fixture to tests/messy_fixtures.js per fixed report.
0. Ask David on the Fold: Daily widget, Save toast, Listen, Continue listening, dot + Breaking strip, player buttons, Android Authority ending, widget looks (full list archive grep '0. Ask David on the Fold').
1. Next device test run uses the release manifest: check for new failures.
2. After ~Nov 22 read the Fold's weekly Insights (`curl -s https://cypressreader.com/api/insights`): refresh time (was 38 s; refresh queue fix should help), REAL closes (fz) left (wide-screen crash fix may cut them). Wait for David: 'Reset appearance' and book text size; Fold verdict on leaf card + fade; any page still sticking; which Font he uses.
3. Deep dive 3 leftovers ALL FIXED in 1.331 (only CSP hashes remain). Older: NPR/The Verge content leftovers need a device dump; Quick/Deep/Saved ahead For you cards question; freeze retest (1.307 Esquire); framed-picture headline size.
