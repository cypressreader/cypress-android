#!/bin/bash
# Runs the feed audit from start to finish. Usage:  ./run.sh            (every site, ~5 minutes)
#                                                    ./run.sh retest     (only the sites a server could not check)
# Needs: node, python3, and Playwright (npm i -g playwright && npx playwright install chromium).
cd "$(dirname "$0")"
export NODE_PATH=$(npm root -g)
rm -rf d report.json; node cat.js || exit 1
if [ "$1" = "retest" ]; then python3 fetch.py --only retest-names.txt; else python3 fetch.py; fi
node an.js && python3 summarize.py | tee summary.txt
echo; echo "Full results: $(pwd)/report.json   Short list: $(pwd)/summary.txt"
