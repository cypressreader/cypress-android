#!/bin/bash
cd /tmp/t
for f in boot deep deep2 deep3 native feat_run spt st2 st3 st4 st5 st6 st7b st8 st9; do echo "=== $f" ; timeout 900 node $f.js 2>&1 | tail -12; done
echo "=== st10"; ACC=1 timeout 300 node st10.js 2>&1 | tail -12
echo ALLDONE
