# Feed audit

Checks every site in the Add a feed list against the live web, so problems like "the reader shows the site footer" or
"this site only posts lists of links" are caught before users see them.

Needs open internet access, node + Playwright (as for the tests) and python3.

    cd tools/feed-audit
    node cat.js          # writes cat.json from the app's own catalogue
    python3 fetch.py     # downloads each feed and two recent articles into d/ (a few minutes)
    node an.js           # runs the app's own parse/extract/tidy on them, writes report.json
    python3 summarize.py # prints the feeds worth a look

Notes:
- A page of about 5.5 KB that is identical across many sites is a bot-check page, not an article. Those feeds are
  inconclusive from a server; try them from a phone.
- "No stories" can mean the feed is dead or that the site refuses this machine.
- Read the output before removing anything: the checks are hints, not verdicts.

## Running it on a Mac (or any home computer)
Sites often refuse requests from data-centre machines, so a home connection can check what a server could not.

    cd tools/feed-audit && ./run.sh retest      # just the ~150 sites a server could not check
    ./run.sh                                    # every site

Then send `summary.txt` (or `report.json`) back, or run it inside a Claude Code session on that machine and ask it to push the results.
