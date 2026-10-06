#!/bin/bash
# Runs the feed audit from start to finish.
#   ./run.sh            every site (~5 minutes)
#   ./run.sh retest     only the sites a server could not check (~3 minutes)
# Needs node and python3. Installs Playwright into this folder the first time (a few minutes, ~150 MB).
cd "$(dirname "$0")"
command -v node >/dev/null || { echo "Node is missing. Install it from https://nodejs.org (the LTS button), then run this again."; exit 1; }
command -v python3 >/dev/null || { echo "python3 is missing. Run: xcode-select --install   then run this again."; exit 1; }
if [ ! -d node_modules/playwright ]; then
  echo "First run: installing the page checker..."
  npm install --no-audit --no-fund --silent playwright && npx playwright install chromium || exit 1
fi
export NODE_PATH="$(pwd)/node_modules"
rm -rf d report.json
node cat.js || exit 1
if [ "$1" = "retest" ]; then python3 fetch.py --only retest-names.txt; else python3 fetch.py; fi
node an.js && python3 summarize.py > summary.txt
cat summary.txt
if command -v pbcopy >/dev/null; then pbcopy < summary.txt && echo; echo "DONE. The results are copied: paste them into the chat (Cmd+V)."; else echo; echo "DONE. Results are in $(pwd)/summary.txt"; fi
