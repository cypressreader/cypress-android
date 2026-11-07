# HANDOFF — live session memory (read first, update silently after every finished task)
Old detail (dated session logs, FIXES 16-26 notes, debugging traces) lives in `HANDOFF-ARCHIVE.md`: don't read it on boot, `grep` it only if needed.
Keep THIS file under ~8 KB: when it grows past that, move finished/dated items to the archive and keep only rules, open items and the next tasks.

Last updated: 2026-11-07 (main = 1.275 Books batch B1-B4, BUILT + RELEASED as CyPress v1.275 build 331, run 42356904270; awaiting David's on-device check of TESTING.md "Books batch" on the Fold. Unbuilt work sits on claude/book-prototype-handoff-azxnv9 @ a5196b8: messy-EPUB sweep + encoding fix + format messages). Shipped 1.257-1.273 notes: HANDOFF-ARCHIVE grep "moved bkp0".
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
**SHIPPED 1.274 (2026-11-07): Books (Phase 0 + Phase 1), from `claude/book-prototype`, preview https://cypressreader.github.io/cypress-preview/books/app/ (slot `books`).** Code block before `renderBack` (`zipIndex`/`zipGet`, `bkImport`, `cypress-books` IDB `books`/`ch`/`img`, `bkHtml`, `bkArt` link `book:<id>/<n>`, `renderBooks`/`bkFront`). Reader hooks: openReader fast path `if(a.book)`, `readerNext` stays in the book, fitHero/fitPage1/fitWhy/prefetch/getFull/whyBox/aiBox/legalBody skip books. Phase 0 detail + measurements: HANDOFF-ARCHIVE grep 'books-phase0'.
Locked: page turn (Play Books style, tap turns 1280 ms, do not retune). Older shipped work: `HANDOFF-ARCHIVE.md`. **Tests: exit code 0 does NOT mean pass; count `^FAIL` lines.** Pre-existing failures (same on session base 27ae568, 2026-11-02 full suite): deep2 deep3 feat_run (vm harness, not an app bug) native st16 st17 st2 st3 st4 st7b st9 st26 (MODULE_NOT_FOUND); layout flakes at 1366.
**Key facts kept from 4wgedt (detail in archive):** worker `cypress-share` on Cloudflare (bindings SHORT, STATS, secrets INSIGHTS_KEY, FAMILY_PATH, FAMILY_CODE; redeploy = PUT multipart with ALL bindings/keep_bindings). Web app is family-only at a secret path; github.io copy redirects home (shipped in 1.232). Store kit in `store/`; audit `audit/store-readiness` branch, findings https://claude.ai/artifact/8ZeRvqt8bmAPEvVUqU6X4R. NEVER commit family path/password or insights password (public repo). Price $2.99/mo, $24.99/yr, 14-day trial.
**Launch checklist (source of truth for what's left):** https://claude.ai/artifact/AQ7G5AMrwmYHipy28frpkt (db collection `items`: list app|store, grp, t, d, ref audit #, done, st wip|blocked). Read with ArtifactData list; tick items with update + if_version when work finishes.
**Insights:** live (cypressreader.com/insights, worker POST /api/insights, daily check task trig_01KNpzQ3Cuz1KeDcZ2rZv1YW 7:04 PT). `curl -s https://cypressreader.com/api/insights` works (never print/commit the key). Worker deploy recipe + detail: archive (grep 'moved ppo0d5').
Side-by-side setting + deep-dive audit notes: HANDOFF-ARCHIVE grep "moved 3884797".
**Next 3 tasks:** 1. On `build`: ship the branch work as 1.276 (whats-new: books with older accented text read correctly; comics and picture books say they can't be opened yet; Kindle and PDF files say which formats work; each book's page shows how much room it takes on the device; quick taps/swipes always turn a page (`hurry()` lands a turn in progress, `T.ok`); book page restyled as an 'edition front' from the Bookshelf Concept artifact: `.rkt/.rkby/.rkr/.rkc/.rkl`, read / you are here / min in the list). Then David checks TESTING.md 'Books: messy-EPUB sweep' + 'Books batch' on the Fold. 2. Books Phase 2 remainder (storage per book DONE: `bkSz`/`bkSize`, `bk.sz` set in `bkStore`, older books measured once on open): a few REAL store EPUBs still wanted (publisher free samples / free Play Books or Kobo titles / Standard Ebooks — David's first attempt was 4 Z-Library pirated bestsellers, REFUSED: public repo + Play Store launch, and Z-Library re-converts files so they don't represent real store output). 3. Blocked on David: developer name, account type, free vs paid, Cloudflare Web Analytics off, full-story helpers decision (a30).

**Books Phase 1 + messy sweep detail (what's implemented, symbol by symbol): HANDOFF-ARCHIVE grep 'books-phase1-moved'.**
