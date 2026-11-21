# HANDOFF — live session memory (read first, update silently after every finished task)
Old detail (dated session logs, FIXES 16-26 notes, debugging traces) lives in `HANDOFF-ARCHIVE.md`: don't read it on boot, `grep` it only if needed.
Keep THIS file under ~8 KB: when it grows past that, move finished/dated items to the archive and keep only rules, open items and the next tasks.

Last updated: 2026-11-21 k (main = 1.376 (2026.11.21g), build 441 GREEN; work branch ccr-55075230-otnbgd = main + 3 round-two fixes). Do NOT push HANDOFF-only commits to main (every push to main starts an APK build).
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
Full detail of everything below: archive grep 'moved-1323b' (older: 'moved-1323', 'moved-1320', 'moved-1315'; NEVER commit family path or insights password). Insights daily check task trig_01KNpzQ3Cuz1KeDcZ2rZv1YW. Launch checklist: https://claude.ai/artifact/AQ7G5AMrwmYHipy28frpkt. Locked: page turn 1280 ms; whole-screen picture covers stay (David loves them), the card now turns like a leaf. NO NEW SETTINGS (David 2026-11-12: Settings is already a lot; looks are picked per story where they fit). **Tests: exit code 0 does NOT mean pass; count `^FAIL` lines.** Test clean-up 2026-11-16: 15 stale tests brought in line with the app (feat_run deleted). 2026-11-16 b: cinematic (33), deep2 (122), deep3 (194) ALL GREEN (stale checks updated: essay look has no pull quote by design, pace limit, md needs real paragraphs, askBox not prompt, one-page sources step). deep2 idb 'old cache migrated' flaked once. STILL FAILING: boot (needs /tmp/t/chk.js from tests/extract.js); layout flakes at 1366.
**Tests:** cover_rules + mixing flake (rerun alone). Page-turn copies trip tests: filter `.tl,.tl-leaf`.
**Send a messy story (1.339-1.341 history, worker deploy notes, Cloudflare script `cypress-share`):** archive grep 'moved-1343'. Worker cap 3 MB; read via `curl -s 'https://cypressreader.com/api/insights?messy=list'` then `?messy=<t>`. Command David uses: 'check messy stories'.
PM deep dive / 1.350 notes: archive grep 'moved-1351'. 1.337-1.347 notes (story touches, title page picks, Teach fallbacks, gray strip): archive grep 'moved-1345'/'moved-1345b'/'moved-1350'.
**Idea book:** https://claude.ai/artifact/GWC3jXRYfrs8pJjWPLk8e5 (card text: Artifact read, then awk the `c-<id>` article). 87 picks received 2026-11-19; history, theme checks, skipped cards: archive grep 'moved-1355' / 'moved-1353'. F8 LAST.
**Next 3 tasks:**
ROUND TWO INSPECTION DONE 2026-11-21 (report https://claude.ai/artifact/D44a72PdJm6ds4yVYGrV3y; don't Artifact-read it whole; item ids + code pointers: FIXES.md grep 'ROUND TWO INSPECTION results'). Work branch ccr-55075230-otnbgd = main + 5b40b44 (3 small fixes: edge swipe no longer marks a card read, toast time by length, Aa sheet choices wrap with large text; device-unverified, TESTING.md 'Round two inspection fixes'). NOT merged, no APK. WAITING for David's 'Round two picks: ...' paste, then build the picked items on that branch. Biggest items: P1 cold start (first screen first), P2 story open runs layout() 5 times, J1 setup skipped after a reload, S1 short story shown as unreachable, A1 Save star hidden in list view. No touching MT.gate / GATEMARK.
1.376 shipped notes, WATCH list (RB copies, video bar, noHy, book line, no Up next under video) and open picks R16a/R16b (wait for David's Fold verdict on the freeze after a picture cover): archive grep 'moved-1378'. settings_ux fails 2 ('Developer and diagnostics' group) on main too.
1.361-1.375 shipped notes (video page, docked bar, pop-up, podcast player, themes): archive grep 'moved-1376'.
ASK DAVID after 1.372 (device-unverified, TESTING.md 'Video page'): real playback + sound + full screen; Up next plays in the big screen; docked player; do shorts land in the Shorts row; strips scroll sideways without opening the side bar; move/drop the site header + 'Readers also follow' above the big screen on phones?
OPEN (David 2026-11-20): (1) video story page is weak (thumbnail-size player in one column, picture twice as hero + player, description links above, empty second page): proposed player-as-hero full width, waiting for his go. (2) Up Next (More menu > 'Add to Up Next', addUpNext/S.lq, episodes via epQueue): a MIXED list (stories + episodes) not re-tested; consider an easier way to find it (card hold menu) if David asks.
0. Ask David on the Fold: Daily widget, Save toast, Listen, Continue listening, dot + Breaking strip, player buttons, Android Authority ending, widget looks (full list archive grep '0. Ask David on the Fold').
1. Next device test run uses the release manifest: check for new failures.
2. After ~Nov 22 read the Fold's weekly Insights (`curl -s https://cypressreader.com/api/insights`): refresh time (was 38 s; refresh queue fix should help), REAL closes (fz) left (wide-screen crash fix may cut them). Wait for David: 'Reset appearance' and book text size; Fold verdict on leaf card + fade; any page still sticking; which Font he uses.
3. Older leftovers (CSP hashes, NPR/Verge, freeze retest): archive grep 'moved-1346'.
