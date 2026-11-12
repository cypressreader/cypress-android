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
