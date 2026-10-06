const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage();
await p.goto('file://'+require('path').resolve(__dirname,'../../www/index.html'));await p.waitForTimeout(1500);
const r=await p.evaluate(()=>{const o=[];for(const c of CAT)for(const x of c.f)o.push([c.n,x[0],x[1],x[3]?1:0]);return o});
fs.writeFileSync('cat.json',JSON.stringify(r));console.log(r.length);await b.close()})()
