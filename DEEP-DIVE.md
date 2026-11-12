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
