#!/bin/bash
# cmp.sh <before.html> <after.html> [flows] : runs both, prints a side by side of busy/style/blocked per flow
F=${3:-boot,scroll,open,turn}; D=$(dirname $0)
APP=$1 FLOWS=$F JSON_OUT=$D/a.json timeout 800 node $D/perf.js >$D/a.txt 2>&1
APP=$2 FLOWS=$F JSON_OUT=$D/b.json timeout 800 node $D/perf.js >$D/b.txt 2>&1
node -e "
const a=require('$D/a.json'),b=require('$D/b.json');const pad=(s,n)=>String(s).padEnd(n);
console.log(pad('flow',32)+pad('busy ms',16)+pad('style ms',16)+pad('blocked ms',16)+pad('worst frame',14)+'extra');
a.forEach((x,i)=>{const y=b[i]||{};const e=o=>o&&o.extra?Object.entries(o.extra).filter(([k])=>/Ms|ms|slow|lcp/.test(k)).map(([k,v])=>k+' '+v).join(' '):'';console.log(pad(x.flow.slice(0,30),32)+pad(x.task+' > '+y.task,16)+pad(x.style+' > '+y.style,16)+pad(x.blocked+' > '+y.blocked,16)+pad(x.worstFrame+' > '+y.worstFrame,14)+e(x)+'  >  '+e(y))})"
