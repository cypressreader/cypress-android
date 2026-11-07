# HANDOFF — live session memory (read first, update silently after every finished task)
Old detail (dated session logs, FIXES 16-26 notes, debugging traces) lives in `HANDOFF-ARCHIVE.md`: don't read it on boot, `grep` it only if needed.
Keep THIS file under ~8 KB: when it grows past that, move finished/dated items to the archive and keep only rules, open items and the next tasks.

Last updated: 2026-11-07 night (main = 1.281: book running heads, Listen player, pace, Commonplace file).
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
**SHIPPED 1.274: Books** (code block before `renderBack`, `cypress-books` IDB, `bkHtml`, `renderBooks`; openReader `if(a.book)` fast path). Detail: archive grep "c3wydg-2" and "books-phase0".
Locked: page turn (Play Books style, tap turns 1280 ms, do not retune). Older shipped work: `HANDOFF-ARCHIVE.md`. **Tests: exit code 0 does NOT mean pass; count `^FAIL` lines.** Pre-existing failures (same on session base 27ae568, 2026-11-02 full suite): deep2 deep3 feat_run (vm harness, not an app bug) native st16 st17 st2 st3 st4 st7b st9 st26 (MODULE_NOT_FOUND); layout flakes at 1366.
**Key facts kept from 4wgedt (detail in archive):** worker `cypress-share` on Cloudflare (bindings SHORT, STATS, secrets INSIGHTS_KEY, FAMILY_PATH, FAMILY_CODE; redeploy = PUT multipart with ALL bindings/keep_bindings). Web app is family-only at a secret path; github.io copy redirects home (shipped in 1.232). Store kit in `store/`; audit `audit/store-readiness` branch, findings https://claude.ai/artifact/8ZeRvqt8bmAPEvVUqU6X4R. NEVER commit family path/password or insights password (public repo). Price $2.99/mo, $24.99/yr, 14-day trial.
**Launch checklist (source of truth for what's left):** https://claude.ai/artifact/AQ7G5AMrwmYHipy28frpkt (db collection `items`: list app|store, grp, t, d, ref audit #, done, st wip|blocked). Read with ArtifactData list; tick items with update + if_version when work finishes.
**Insights:** live (cypressreader.com/insights, worker POST /api/insights, daily check task trig_01KNpzQ3Cuz1KeDcZ2rZv1YW 7:04 PT). `curl -s https://cypressreader.com/api/insights` works (never print/commit the key). Worker deploy recipe + detail: archive (grep 'moved ppo0d5').
Side-by-side setting + deep-dive audit notes: HANDOFF-ARCHIVE grep "moved 3884797".
**SHIPPED 1.277 (merge 9b7b52c):** book batch + Today's Chapter. Symbol list: HANDOFF-ARCHIVE grep "moved 2026-11-07 c3wydg".
**Visual brainstorm 2026-11-07:** shortlist 6b/1/2/7 built below; 3 (fresh ink) dropped; photo treatments: no. Artifacts + detail: archive grep "moved 2026-11-07 c3wydg".
**SHIPPED 1.279 fix:** story looks used `data-look`, which Quick Looks' document click handler matches, so every story tap changed the theme and re-laid out mid-turn (forward curl lost). Now `data-rlook`; startup clears a theme saved as classic/gallery/essay. Never reuse `data-look` outside Quick Looks.
1.278 looks + 1.279 Big story alerts detail: archive grep 'moved ig1gfo'.
**SHIPPED 1.280:** squeezed wide photo. `fitWide` shrinks the across-both-pages banner until the headline block fits on the left page; when that leaves the picture at more than 1.8x its natural aspect (most of it cropped), it sets `R.hsq='top'` and `relayout()`s, and `heroSpread` auto then picks `top` (photo at its own shape atop the left page, text starts right page). `R.hsq` reset in openReader. Checked at 2000x1864 with a 3:2 photo; reader_figure/text/asides/st19 pass.
**Next 3 tasks:** 1. Confirm the 1.281 APK build is green; David checks TESTING.md 'Book ideas 1-4' plus TESTING.md 'Big story alerts', '1.278 reader looks', the 1.279 page-turn items and the 1.277 book items on the Fold. 2. **SHIPPED 1.281 (merge 6070e31): book ideas 1-4.** Commonplace 'Save as file' (`data-bkcpx="f"` → saveFile md); pace `bkPace(b,p)` from `S.st.d[k].b` (book minutes, counted in the 15 s STAT timer) shown in `bkDay` `.dchp` + `bkFront` hint; book Listen with reader closed continues via `ttsEnd` `bg` path (`R.ghostNext`), `digNext` = next chapter for books, tmini/tdr chapter labels + cover from `BKDU` + `.tdslp` sleep select; running heads `.book[data-rh]` (set in `layout()` before measuring, text in the page update next to data-folio; `rh2` spread uses U+2005 so justify splits title/chapter; `rh0` hides on chapter page 1). Tests pass: book_proto book_messy reader_figure tts_sync reader_text page_turn_mode st19 reader_asides. Device checks: TESTING.md 'Book ideas 1-4'.3. Blocked on David: developer name, account type, free vs paid, Cloudflare Web Analytics off, full-story helpers (a30). Reminder scheduled 2026-11-21 10:00 PT (trig_01Wso38mBKPVg2bCmNsjBaFM); don't nag before then. Test books: Standard Ebooks, Gutenberg, Baen, samples; never pirated. Note: the container's local `main` is a stale unrelated clone; merge onto `origin/main` (detached) and push HEAD:main.

**Books Phase 1 + messy sweep detail (what's implemented, symbol by symbol): HANDOFF-ARCHIVE grep 'books-phase1-moved'.**
