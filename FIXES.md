# Fix list (batch together, then preview)

1. **Daily "Quick Reads" section (Brief view):** the name shows twice (small running head "QUICK READS" at the top, and again as the big "— Quick Reads" heading), and the big heading wraps onto two lines. Fix: show the name once, and size the heading so it stays on one line. Code: `sh('brief','Quick Reads',...)` near `dsec2` in `www/index.html`. Seen in Halcyon light; check other themes and phone widths.
