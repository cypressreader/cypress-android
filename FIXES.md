# Fix list (batch together, then preview)

1. **Daily "Quick Reads" section (Brief view):** the name shows twice (small running head "QUICK READS" at the top, and again as the big "— Quick Reads" heading), and the big heading wraps onto two lines. Fix: show the name once, and size the heading so it stays on one line. Code: `sh('brief','Quick Reads',...)` near `dsec2` in `www/index.html`. Seen in Halcyon light; check other themes and phone widths.

2. **Daily "The Front Page" section (same pattern as item 1):** the name shows twice, once in the small running head ("NO. 289 · THE FRONT PAGE · 01") and again in the big "01 — The Front Page" heading. Also the sentence under it ("Start here. These are the ones your sites agree are worth your time.") reads oddly and has a drop cap that splits "S | tart here". Cause: the `sh()` helper in `www/index.html` (near line 6667) prints a `.dfolio` running head containing the section name and then a heading with the same name, for every Daily section (Front Page, Quick Reads, Deep Reads, More). The sentences come from `DAYDEK` (about line 6603); the drop cap is applied to `.ddek` by JS (near line 6904). Plan: one fix for all sections: drop the repeated name from the running head (keep issue number and section number), keep headings on one line, remove the drop cap from the short sentence, and tighten the sentence wording.

   **Proposed plain-English copy for item 2 (Daily section intros, awaiting OK).** Each section has two sentences that rotate by day; the small italic line beside the heading (`sub`) repeats the same idea, so drop it for Quick Reads and Deep Dives and keep one plain sentence under the heading, with no drop cap.
   - The Front Page: "The stories that matter most since you last looked." / "Start here: these are stories several of your feeds are covering."
   - Quick Reads: "Short stories you can finish in a few minutes." / "Quick reads for when you only have a moment."
   - Deep Dives: "Longer stories for when you have time to settle in." / "In-depth reads that are worth setting time aside for."
   - More: "Everything else from today, in case you want more." / "The rest of today's stories."
