# HANDOFF — live session memory (read first, update silently after every finished task)
Old detail (dated session logs, FIXES 16-26 notes, debugging traces) lives in `HANDOFF-ARCHIVE.md`: don't read it on boot, `grep` it only if needed.
Keep THIS file under ~8 KB: when it grows past that, move finished/dated items to the archive and keep only rules, open items and the next tasks.

Last updated: 2026-11-22 (work branch claude/checkout-ccr-aefb8e60-idp0ts-k2ch6w; main = 1.384). Do NOT push HANDOFF-only commits to main (every push to main starts an APK build).
## 1. Working & locked (verified; don't change core logic without asking)
- **Halcyon theme** (`halcyon`/`halcyond`): website palette (cream `#f3ecdc`, green `#123524`/`#0c2619`, brass `#c9a24a`/`#b08d3e`), follows phone via `twinApply`. Headlines use `--disp` (narrow display serif) with `!important` (user's choice). Dark-brass labels on cream `#7d5f14`; light-brass `#e2c27a` on dark `.noimg` lead/hero cards (`.noimg` ≠ cream card).
- **The Daily**: name once per section (`sh()`), one-line intros (`DAYDEK`), "Vol. 26 · No. 290" line, "Next up" styled like "Since this morning", "In this issue" links use `jumpTop`, cover number `.dcv-num`.
- **Headlines**: list and tile views share "The front page" first section. **All Stories**: title-case header, centered chips, `tabMast` headings in both views.
- **Story card size** Compact|Medium|Large drives `--csz`. Cards|Columns (wire) view exists only with Medium/Large + tiles (by design). Daily + Compact sets `data-cards="narrow"` on `#grid` (CSS needs both selectors). Wire "Cards" sets `data-w="mag"`.
- **No location**: no permission/geolocation code. "Near you" = typed place, up to 10 saved (`S.places`), `locLang`. `nUrl` keeps `q=/query=/search=`.
- Excerpts end on whole words (`trimWords`, `sumOf`). Opaque docked tab bar `#mtabs`; pull-to-refresh `#pts`; Search closes after keyboard.
- **Reader**: No spanning title block in paged reader. Justified text uses hyphens. "Aa" = bottom sheet (Theme/Font/Focus/Large print) from ... menu (`data-act="aa"`). "Why it matters" stays (`whyBox`, `COOKIEJ`).
- Return to feed (rdFreeze/rdAnchor/patchProg) and Light/dark modes (S.sch, oled): archive grep 'moved-1357c'.
- **Side bar** hide setting (Never/portrait+square/Always), hamburger `#menu`, tab `#sideh`; click-to-close skips folder arrows/dots/× buttons.
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
ACTIVE STATE (2026-11-22, session 01FNE57L): main = 1.384 (build 449 green). David asked (turn 3) for the app to feel as smooth as Apple News / Google News: fast start, fluid use, fast story open, no stutter. SPEED WORK IN PROGRESS on the work branch, NOT shipped:
- MEASURED (tools/perf/perf.js, 80 sites x 25 stories with pictures, CPU x4): almost all slowness is STYLE RECALC, not script. Start-up ~1.2 s of style, story open ~1 s (24,000 element restyles in 57 passes for a 150-element story: layout() runs 3 times, each forcing 3-4 restyles of the whole reader via inline style/class changes on #rd/.cols/.book), page turn ~0.8 s.
- STAGE 1 DONE (uncommitted until the suite comparison ends, then commit): scripts/css-keys.js rewrote 144 selectors (132 rules) ending in a bare :is(list) to add :where(key); same matches (tools/perf/equiv.js ALL OK except 4 app-generated .pf0-3 rules that differ by themselves), same weight. 241 of 3282 rules were tried on every element = 76% of selector time. Gain: start-up style -35%, page-turn blocked time -66%, feed tab switches lighter; story open ~same.
- FULL SUITE before/after is running in the background: scratchpad/suite (logs/NAME.{before,after}.log + .rc, DONE marker). Compare ^FAIL counts; re-run differing tests alone; `git checkout` any changed .png.
- MEASURED POTENTIAL, not built: dropping ALL 144 :has() rules cuts page-turn style another ~40% and start-up ~30% (only the page-wide body:has ones: no gain). Dead ends this session: container-type on main (no gain), transitions/animations off (no gain), body:has rules alone (no gain). Test-data trap: fake sites with near-identical headlines group as one running story (80-entry timeline in every story).
- AI summary line (option F, shipped 1.384): aiPut / whyText / xsOpen('aic'); ready class is .aiok because .rdy belongs to feed cards. Detail: archive grep 'moved-1385'. `node tools/r3/ai_box.js` (~4 min, run in background).
NEXT 3 TASKS:
1. Finish stage 1: read the suite comparison, commit + push (work branch), offer David `build` (label 1.385).
2. STAGE 2: replace the READER :has() rules (.cols:has(>.hs-*), figure:has(img/figcaption), p:has(>img:only-child), .cols:has(.note>.nt), .rf-next:has(.rn-i)...) with classes set where the content is built (layout() already sets .hbg/.fim/.hsw this way); then the feed ones (.card.noimg:has(>svg), .card:not(:has(.rdy)), .nr-river:has, .nr-top:not(:has(>.nr-rail))). One group at a time, equiv-style check + cmp.sh after each.
3. STAGE 3: story open: make the 3 layout() passes cheaper (skip writes that do not change; batch inline style changes on #rd/.cols before the first measure); then start-up (feedHead forced layout ~390 ms at x4, refresh fetches + XML parsing competing with first paint).
3. Wait for David's Fold verdicts on 1.382/1.383 (TESTING.md: 'Headline over a photo stays white', 'Book page turns feel smooth', 'Side bar and a resting story', 'Outside tap only closes the side bar', 'No whole-screen picture covers'). Then the older open items below. If he confirms covers stay gone, remove the unused ccov/pcov code (ccv(), cslid, cpk, CSS) in one careful pass.
Older notes (Fold reports after 1.381-1.383, round three, video, podcasts, open questions for David): archive grep 'moved-1384'. Before that: archive grep 'moved-1323b' (older: 'moved-1323', 'moved-1320', 'moved-1315'; NEVER commit family path or insights password). Insights daily check task trig_01KNpzQ3Cuz1KeDcZ2rZv1YW. Launch checklist: https://claude.ai/artifact/AQ7G5AMrwmYHipy28frpkt. Locked: page turn 1280 ms. (Whole-screen picture covers: David turned against them 2026-11-22, see below.) NO NEW SETTINGS (David 2026-11-12: Settings is already a lot; looks are picked per story where they fit). **Tests: exit code 0 does NOT mean pass; count `^FAIL` lines.** Test clean-up 2026-11-16: 15 stale tests brought in line with the app (feat_run deleted). 2026-11-16 b: cinematic (33), deep2 (122), deep3 (194) ALL GREEN (stale checks updated: essay look has no pull quote by design, pace limit, md needs real paragraphs, askBox not prompt, one-page sources step). deep2 idb 'old cache migrated' flaked once. STILL FAILING: boot (needs /tmp/t/chk.js from tests/extract.js); layout flakes at 1366.
**Tests:** cover_rules + mixing flake (rerun alone). Page-turn copies trip tests: filter `.tl,.tl-leaf`.
**Send a messy story (1.339-1.341 history, worker deploy notes, Cloudflare script `cypress-share`):** archive grep 'moved-1343'. Worker cap 3 MB; read via `curl -s 'https://cypressreader.com/api/insights?messy=list'` then `?messy=<t>`. Command David uses: 'check messy stories'.
PM deep dive / 1.350 notes: archive grep 'moved-1351'. 1.337-1.347 notes (story touches, title page picks, Teach fallbacks, gray strip): archive grep 'moved-1345'/'moved-1345b'/'moved-1350'.
**Idea book:** https://claude.ai/artifact/GWC3jXRYfrs8pJjWPLk8e5 (card text: Artifact read, then awk the `c-<id>` article). 87 picks received 2026-11-19; history, theme checks, skipped cards: archive grep 'moved-1355' / 'moved-1353'. F8 LAST.
