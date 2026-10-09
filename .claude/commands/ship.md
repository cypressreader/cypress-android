---
description: Run the required checks, push the branch, and write a concise ship debrief. Never releases — await the build command.
---

1. Run the start-up check and only the lightweight suites needed to verify the current changes (`node tests/stNN.js` for the relevant suites — not the full matrix unless the change warrants it).
2. Confirm `www/index.html` and `docs/app/index.html` are identical (`diff` them; the post-edit hook should have synced them).
3. Push the branch.
4. Write a concise debrief: what changed per item, test results, and anything needing a real phone (add to TESTING.md if not already there).
5. Do NOT merge or release. Await the `build` command.
