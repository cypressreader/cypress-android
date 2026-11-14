# Deep dive on 1.318 (2026-11-12, David asked): raw agent findings, unverified unless marked
Read-only agents, headless Chromium (not a phone). Nothing here is built. David picks; then move picks to FIXES.md and delete this file.

## Improvement ideas (agent 3; not reviewed: scrolling mode, Aa sheet, Search, Saved, Highlights, History, Stats, Books, 1280x800, pictures inside story text)
1. Small: last text page ends in half a blank screen, 'Next up' on its own page with a small picture: start the end card on the same page when there is room, bigger Next up picture.
2. Small: 'At a glance' table on the first text page repeats source/date/reading time already on the cover: show only when it adds something, or one line.
3. Medium: Headlines on a phone: ~560 of 902px (ticker, masthead, stats card, 'In this issue', section title) before the first picture: merge stats + 'In this issue'.
4. Medium: All Stories: first story starts at ~380px (chips, date, Sections, Developing row, 'Last hour', Mark read): fold Developing into the chips or collapse after one view.
5. Large: Settings has ~195 controls in 10 groups; 'Theme layouts', 'Living Dynamic theme', 'Green top bar', 'Light or dark' read as one thing (the look): merge; move 'Battery and motion' into loading options.
6. Small: first run: a third of the welcome screen is empty, edition cards have no pictures, 'Your front page' preview is below the fold.
7. Small: last onboarding screen is six text tips beside empty space: 2-3 tips, include the Aa reading options.
8. Small (needs phone): phone hero cards: oversized headline covers the picture's subject: cap lines or put the headline in a band under it.
9. Small: the tip card floats over the bottom row of the Daily cover; agent's Dismiss click did not remove it (CHECK: possible bug).
10. Small: reader footer line ('SITE · HEADLINE · 1 OF 7') overlaps the progress tick on phone and Fold (CHECK: possible bug; also visible in emulator shots).
11. Small: 'How the story developed' repeats the same headline per site; group as 'Seen on 6 sites'. The two ending pages also appeared twice in a row on the phone when pressing next at the end (CHECK: possible bug).
12. Small (needs phone): open Fold left-page picture crop can miss the subject.
13. Small: Fold/tablet show 'Save · Listen · More', phone only '...': one set.
14. Small: 'No sites here yet' has no hint of the starter packs that sit in the Add dialog.
Wording check: seeded data showed '10 stories' on Brief vs '15 new' on Headlines (unverified against real data).

## EMULATOR RUN 8 on 1.318 (b140c6c, Android 16, WebView Chrome 133): app stopped responding
Step 'sizes' FAILED at open Fold: story opened on the new whole-screen cover (`pcov`, BBC 'Burnham's push...', shot 25), and on the first turn Android showed 'CyPress isn't responding' (shots 26, 27, 28-FAILED; Back did not close after 3 presses). Run 7 passed the same step when that size opened on the left-page cover. Correlation, not proof: cause not found (headless turns from `pcov` fine). All other steps passed (first-run feed story scroll themes big-text dark-phone leave-and-return share-in cold-start), 0 crashes. Phone-size stalls up to ~1 s on the list, ~0.7 s in a story. Shots not yet reviewed by eye beyond 25-28.
Branch now restores the 1.317 choice (`wcov` under 1600px, `hero` for tall/square). 1600px+ captioned or very wide pictures still take `pcov` as they did before 1.318: SAME RISK, unproven either way.

## Speed (agent 2; headless Chromium, software raster, CPU throttled 4x unless said; 32 sites, 448 stories; NOT a phone)
Numbers at 4x: first paint 260 ms, first list card warm 1355 / cold 2835 ms; main script run 710-750 ms; render() Daily 117 / All Stories 124 / Headlines 226 ms; open a story 493 ms (auto) / 234 (dynamic); page turn worst frame 184 ms (first turn), 60 (second); close 344 ms. Dynamic theme: style recalc ~1.9x on Daily. Scroll: Daily 55-63 of 225 frames over 32 ms. File 2.58 MB (CSS 746 KB, 5569 rules, 126 `:has(`, 47 backdrop-filter).
Ideas, ranked:
1. `renderDigest` (~line 16323) reads `$('#grid').clientWidth` just before replacing the list: forces a full layout of the old page. Stubbed: Headlines render 190 -> 87 ms. One line (use cached width). Low risk.
2. Lead-card picture animations (`kbz` + `cpx`, ~lines 5011-5012): disabled, scroll paint halved headless (software raster overstates; needs a phone).
3. `:is(.tf,.tl) *` (~line 858): universal selector, top-3 on every style recalc; small gain.
4. Long `:is()` descendant lists (~2667-2669): modest.
5. `::highlight(...)` rules matched 1000-1700 elements per recalc: inject on first use; small.
6. `fixOrph` ~75 ms per Daily render at 4x (known dead-end area; only angle: skip the phone path when no group is a 2-column grid).
7. `hdrClear` (~16670) 15-40 ms per render: skip when title+width unchanged; small.
8. ~170 KB of rarely used data constants + 95 KB data-URI variables parsed every start: more risk than reward.
First turn of a story was not pre-built in the agent's run (46-59 ms sync vs 1 ms on turn 2).

## Bug hunt (agent 1; headless, 4 sizes x light/dark/dynamic/halcyon/oled; no JS errors, no blank pages, no page overflow, dialogs and names OK)
1. FIXED on the branch: author name (`.dt .by`) dark on the dark cover picture on every picture cover (phone `cov`, left-page `hero`, 'Hero spread' setting in any theme, sideways). Cause: `#rd .cols .dt .by{color:var(--ink)}` beat the white byline rule. New rule in the '1.316 pictures first' block.
2. OPEN: phone sideways 902x411, Dynamic, long headline: 47px headline overflows the top of the page, first line clipped (cover there is `ccov` with one page).
3. OPEN: reader keyboard focus escapes the dialog: at 1280x800, Tab past the 'Position in story' slider lands on `#sideh` ('Show sites'), then body.
4. OPEN, low: dim meta text in dark mode ('1 min', '2-min read' about 2.7:1).
5. OPEN, low: 'Follow ...' buttons in the reader More sheet clip long names with no ellipsis at 411px.
6. OPEN, low: on the left-page cover '2-min read' wraps as '2-' / 'min read'.
Unconfirmed: light 'wide' cover at 902x411 cuts a 150-character headline after 4 lines with no ellipsis; one blank page seen once (page 10 of 13, light+dark, 902x411), not reproduced.
Not covered: real phone, Search/Saved with real data, Headlines/Brief/Sunday in depth, site settings dialogs.

# Deep dive 2 on 1.327 + branch (2026-11-14, David asked): six read-only reviewers; headless only, NOT a phone. C = reviewer confirmed by running it, P = plausible from reading. Nothing below is fixed yet unless marked.
## A. Bugs worth fixing first
1. C. Page-turn copies built from a stale cut cache throw (`CUT`/`cutOf`/`mkBox` 8995-9026; `layout()` never clears `CUT`; key = `prepKey()` only). Cover picture arriving after the first pre-built turn moves headline into the figure, cached child indexes go stale: `mkBox` throws ('reading remove/style') at 412, 884, 1280; or the turn shows the wrong paragraphs. Very likely David's stuck page (1.327 `turnFail` only hides it). Same throw uncaught in the idle fill (`q.shift()()` ~9161). Fix idea: `CUT.k=''` at top of `layout()` + try/catch in `step`. CAREFUL: '`cutOf` cache key' is a listed perf dead end (archive grep 'Dead ends moved') — read it before touching.
2. C. Restoring a tampered backup file runs script: `cleanLib` (5355) does not check `sk[].id`; written unescaped at 6489 (`data-sel="k:${k.id}"`), 6879, 13376, 17178. Fix: filter `sk` by `okId(k.id)` in `cleanLib` + `esc()` at the four uses. Same cleaner serves the sync merge (14118).
3. C. Highlights page: tapping a story title does nothing (capture listener at 18530 matches `[data-hopen]`, calls window.open("0")). Fix: `#hub [data-hopen]`.
4. C. Framed title page never fitted in SCROLLING mode (`ftpFit` only called at 8941, after `layout()` returned for scrolling ~8917): long word cut off, frame clipped, quotes not converted.
5. C. Phone held sideways (902x411): 'framed picture' opening picked (`heroSpread` 14435, `d[0]<1600` branch not behind the two-page test): page 1 nearly empty, headline on page 2.
6. C. Backup reading service `md()`: story of short paragraphs thrown away (6199, `tot<4000&&pr<600`, counts only 110+ char paragraphs); a real list of linked items removed (6184).
7. C. Scrolling mode, light theme: picture captions gray on the dark picture gradient (4445 outranks 1279).
8. C. Aa sheet Pages -> Scroll mid-story loses your place (7872 `refreshReader()`).
9. P. `prepTurn` catch (9156) leaves the page-edge stack hidden (`edgeHide(bk,0)` + perspectiveOrigin reset missing). P. `pdStop()` not called at the top of `startTurn` (cover drift jumps on hands-free / read-aloud turns).
## B. Smaller bugs (all C)
Books: More menu shows story-only actions on a chapter ('Site view in the app' replaces the chapter; Translate, Mark as unread, Send to...; `mnMarkup` ~12534) and 'Bookmark' reads 'Save' (`rdxMnSync` 12549). Stats 'Your 2026 so far' overlay has no role=dialog / label / focus move or trap (`openYir` 16442). History at 1280x800 uses huge `card(a,i,'mid')` (12199): use `listRow`. Phone tables with `<th>` header row but no `<thead>` keep a cut-off header strip (1074). Near you drops keyboard focus after Find news / Save to my places. Highlights search with no match = blank page (12210). Long unbroken words spill: `.hlc blockquote` (3549), Near you place name. Bookshelf checkbox far from its label; Markdown book named after its file. Fold 884 side bar: 'HighlightsHistory' labels touch, Saved count on the star. Settings > Look preview cover clipped ('THURSI'); cover says '5-min read', At a glance '4 min'. Scroll mode: ArrowDown/Home/End do nothing when a bar button has focus.
## C. Privacy page vs code
C. A failed/blocked feed silently falls back to a Google News then Bing news search for the site's domain (16880-16948, 16824; also Add a site with no feed found, 11399): NOT on privacy.html (it names Bing only for Near you). C. Catalog entries for CNN, Reuters, AP, Axios, Space.com, National Post, CTV ARE Google News searches (11411, 11432, 11343) while the page says feeds load 'straight from each site'. C. Google News link decoding on Android (16895-16903) not described. C. Google Fonts sentence is out of date IF every `FONTLINK` entry is in `LOCALF` (10228-10234; verify, then delete the dead branch and the sentence). No geolocation, no tracking, no first-party http found. Info: no `<meta name=referrer>`, card background pictures send the app's origin.
## D. Build, offline, Android
C. Notes-only pushes to main (HANDOFF.md, tests/**, etc.) still build + publish an APK release (build-apk.yml 6-13 `paths-ignore` too narrow). C. Copy hook in `.claude/settings.json` is cwd-relative (failed silently 2026-11-14) and its match also fires on any edit that mentions the path; `scripts/turn-counter.js` same cwd problem. C. Device test builds DEBUG without the release manifest overlay (services, widgets, network config untested). C. Release-notes fallback `cat whats-new.txt` (168 KB) would exceed GitHub's 125,000 limit and fail the publish after the build; no check that workflow APP_LABEL = app APP_LABEL; versionCode mismatch only warns. C. No Gradle/npm/Playwright caching. C. Core-only manifest: `usesCleartextTraffic=true` without `cy_network.xml`. C. sw.js caches './' and 'index.html' separately (2.6 MB twice; second goes stale). P. Data Saver read only when background refresh is scheduled (CyExtras ~658). C. Stray tracked d7_*.png at repo root, 3.6 MB review/final-pass-1.221.html, `.gitignore` lacks scripts/__pycache__/. Actions pinned to tags not SHAs. Sound: versions agree, precache paths exist, allowBackup=false, exports minimal, no secrets in tracked files.
## E. Accessibility + wording
PASS: no nested controls, no empty names, dialogs labelled, focus trap/return, arrow keys on tabs, contrast (halcyon, dynamic, oled), no British spellings, plurals via `plu()`. C. Tap targets under 40px: Settings toggles `button.tg` 52x32 and segmented buttons 34px; side bar color dot 10x10, rows 22px, `#sbh` shown on a phone; Daily 'MORE', 'Catch me up', 'Surprise me' 28px; reader `#dial` 24px, Aa close 34px. C. 'sites' vs 'feeds' mixed (Settings 'Feeds & backup', 'Manage feeds', 'Purge Selected Feeds', 'Explore Full Feed'...); 'The site blocked the fetch.' (10223), 'fetched' (5292). C. docs/shots/laptop.jpg is stale ('My Feeds', 'Add feed'); phone-daily.jpg sample says 'harbour'. Low: four Settings segmented groups lack role=group; feed not `inert` behind the reader; whats-new old sections say RSS/OPML/cache. In-app privacy text says 'No ads.'
## F. Hardening ideas
CSP has `'unsafe-inline'`: hashes for the four inline scripts would contain an injection (the ~14 inline onerror/onload strings need a document-level listener first). Restore dialog: say that the backup's relay also carries reading traffic, or drop `relay` on restore. Android: `handleFile0` accept `content:` only.
