# HANDOFF — live session memory (read first, update silently after every finished task)
Old detail (dated session logs, FIXES 16-26 notes, debugging traces) lives in `HANDOFF-ARCHIVE.md`: don't read it on boot, `grep` it only if needed.
Keep THIS file under ~8 KB: when it grows past that, move finished/dated items to the archive and keep only rules, open items and the next tasks.

Last updated: 2026-11-04 (session kq2amn)
## 1. Working & locked (verified; don't change core logic without asking)
- **Halcyon theme** (`halcyon`/`halcyond`): website palette (cream `#f3ecdc`, green `#123524`/`#0c2619`, brass `#c9a24a`/`#b08d3e`), follows phone via `twinApply`. Headlines use `--disp` (narrow display serif) with `!important` (user's choice). Dark-brass labels on cream `#7d5f14`; light-brass `#e2c27a` on dark `.noimg` lead/hero cards (`.noimg` ≠ cream card).
- **The Daily**: name once per section (`sh()`), one-line intros (`DAYDEK`), "Vol. 26 · No. 290" line, "Next up" styled like "Since this morning", "In this issue" links use `jumpTop`, cover number `.dcv-num`.
- **Headlines**: list and tile views share "The front page" first section. **All Stories**: title-case header, centered chips, `tabMast` headings in both views.
- **Story card size** Compact|Medium|Large drives `--csz`. Cards|Columns (wire) view exists only with Medium/Large + tiles (by design). Daily + Compact sets `data-cards="narrow"` on `#grid` (CSS needs both selectors). Wire "Cards" sets `data-w="mag"`.
- **No location**: no permission/geolocation code. "Near you" = typed place, up to 10 saved (`S.places`), `locLang`. `nUrl` keeps `q=/query=/search=`.
- Light/dark: As the theme is / Always light / Always dark / Follow phone (`S.sch`). Sky transition (`sky()`, `.sk-*`) is QUEUED FOR REMOVAL (see next tasks); sunset mode and weather removed. Pure Black theme `oled` (light phone falls back to Light).
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
**1.238-1.241, site refresh, 1.239/1.240, Email notes: HANDOFF-ARCHIVE.md (grep "moved jubrvc" / "moved gawgc1"). Voice: run `scripts/check-voice.sh` before any voice change.**
**Insights (all live after 1.242, merge 43c350a):** cypressreader.com/insights installable app; per-report Copy for Claude + New/Working/Fixed (worker POST /api/insights {t,st}, deployed wemfdv turn 1). `curl -s https://cypressreader.com/api/insights` works with no header (network adds key; never print/commit it). Feed errors logged only when online, with reason. Privacy line live. Scheduled task trig_01KNpzQ3Cuz1KeDcZ2rZv1YW 'CyPress daily check (site, worker, reports)', 7:04 PT, fresh session, push only when something is DOWN (home, /insights, GitHub Pages, /api/insights JSON) or new reports. Worker deploy recipe: fetch raw file in COMPOSIO_REMOTE_WORKBENCH, check sha, base64 into CLOUDFLARE_MCP_EXECUTE (multipart PUT, kv_namespace bindings SHORT+STATS re-sent, keep_bindings secret_text); CF sandbox cannot fetch GitHub. Detail: archive (grep 'moved wemfdv').
**1.243 (Insights extras: UX block, CRUMB, report status, site-list checkbox): archive, grep 'moved rnwh2j'.**
**1.244/1.245 AI summary notes: archive, grep 'moved kq2amn'.**
**1.246 MERGED (747831b, APK run 41756564956), session kq2amn:** David picked Rule and grow. `aiType` replaced by `aiGrow(el,h0)`: adds `.whyit.ai.in` for 1.1 s (brass ::before scaleY .5 s with real border transparent, li fade .3/.39/.48 s), grows the ul from the waiting bars' height (skipped if the box spans columns or reduced motion), relayout runs after the 500 ms grow. Also ships promo-row fix 5c781f0.
**Next batch queue:** remove the "Good morning / Good evening" sky animation (`sky(kind)` ~13110 in www/index.html, `.sk-star/.sk-sun/.sk-moon/.sk-hill/.sk-t` CSS, its callers and any setting for it): David 11-04 says it looks out of place. Light/dark switch stays, just instant.
**Next 3 tasks:** 1. David installs 1.246 on Fold 8: TESTING.md 'AI summary' + 'AI summary status line' + 'AI summary reveal'. 2. ~11-09: Insights ?sum=1 for 1.243-1.246 rows; then phone-found bugs. 3. Voice/topic sweeps later; Play Store parked.