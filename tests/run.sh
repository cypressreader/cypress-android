#!/bin/bash
# Runs the whole CyPress test suite against www/index.html (or APP=/path/to/index.html).
# Needs: node, a global Playwright install (npm i -g playwright) and its Chromium.
# Screenshots and scratch files go to $OUT (default /tmp/t). Takes about ten minutes.
cd "$(dirname "$0")"
node extract.js || exit 1
for f in boot deep deep2 deep3 native feat_run spt st2 st3 st4 st5 st6 st7b st8 st9 st11 st12 st13 st14 st15 st16 st17 st18 layout; do
  echo "=== $f"; timeout 900 node $f.js 2>&1 | grep -E "FAIL|^bad|passed|failed|BOOT|rror" | tail -8
done
echo "=== st10"; ACC=1 timeout 300 node st10.js 2>&1 | grep -E "FAIL|^bad" | tail -4
echo ALLDONE
