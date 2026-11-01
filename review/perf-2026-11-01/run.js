const {chromium}=require('playwright');
const CPU=+process.argv[2]||6, NET=process.argv[3]||'4g';
(async()=>{
const b=await chromium.launch({args:['--disable-web-security']});
const ctx=await b.newContext({viewport:{width:412,height:900},deviceScaleFactor:2,isMobile:true,hasTouch:true});
await ctx.addInitScript(()=>{window.Capacitor={isNativePlatform:()=>true,getPlatform:()=>'android',isPluginAvailable:()=>false,Plugins:{}};
 window.__lt=0;try{new PerformanceObserver(l=>l.getEntries().forEach(e=>window.__lt+=e.duration)).observe({type:'longtask',buffered:true})}catch(e){}});
const errs=[];const reqs=[];
async function page(){const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));p.on('requestfinished',r=>{if(!r.url().startsWith('http://localhost'))reqs.push(r.url())});
 const c=await ctx.newCDPSession(p);await c.send('Emulation.setCPUThrottlingRate',{rate:CPU});
 p._c=c;return p}
const net=p=>NET==='4g'?p._c.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:1.6e6,uploadThroughput:7.5e5}):0;
const nav=p=>p.evaluate(()=>{const n=performance.getEntriesByType('navigation')[0];const fcp=(performance.getEntriesByName('first-contentful-paint')[0]||{}).startTime;return {html:Math.round(n.responseEnd),scriptDone:Math.round(n.domInteractive),loaded:Math.round(n.loadEventEnd),fcp:Math.round(fcp||0)}});
// cold launch
let p=await page();const t0=Date.now();await p.goto('http://localhost:8772/index.html');
await p.waitForSelector('text=Get started',{timeout:60000});const tGS=Date.now()-t0;const n1=await nav(p);
await net(p);const t1=Date.now();await p.click('text=Get started');
await p.waitForFunction(()=>document.querySelector('#grid .card,#grid .dcov,#grid .cr'),null,{timeout:120000,polling:100});const tFirst=Date.now()-t1;
const feeds=await p.evaluate(()=>S.feeds.length);
await p.waitForFunction(()=>S.feeds.every(f=>state[f.id]&&state[f.id]!=='loading'),null,{timeout:180000,polling:250}).catch(()=>{});const tAll=Date.now()-t1;
const st=await p.evaluate(()=>{const c={};S.feeds.forEach(f=>{const s=String(state[f.id]);c[s]=(c[s]||0)+1});return {c,stories:Object.values(items).reduce((a,l)=>a+(l||[]).length,0),lt:Math.round(window.__lt)}});
const nreq=reqs.length;
// realistic: add two 6-site packs, then time a full refresh of every site
await p.evaluate(async()=>{await addPack(0);await addPack(1)}).catch(e=>errs.push('pack '+e.message));
const big=await p.evaluate(async()=>{const t=performance.now();await Promise.all(S.feeds.map(f=>load(f,true)));const d=performance.now()-t;const c={};S.feeds.forEach(f=>{const s=String(state[f.id]);c[s]=(c[s]||0)+1});return {feeds:S.feeds.length,refreshAll:Math.round(d),c}});
// open first story
let tStory=-1;try{const t2=Date.now();await p.click('#grid .card >> nth=0');await p.waitForFunction(()=>document.querySelector('#rd.on')&&[...document.querySelectorAll('#sheet p')].some(x=>x.textContent.length>80&&!x.closest('.tl,.tl-leaf')),null,{timeout:30000,polling:100});tStory=Date.now()-t2}catch(e){}
await p.waitForTimeout(3000);await p.close();
// warm launch (stories saved)
p=await page();const t3=Date.now();await p.goto('http://localhost:8772/index.html');await net(p);
await p.waitForFunction(()=>document.querySelector('#grid .card,#grid .dcov'),null,{timeout:60000,polling:100});const tWarm=Date.now()-t3;const n2=await nav(p);
console.log(JSON.stringify({CPU,NET,cold:{...n1,getStartedVisible:tGS},afterGetStarted:{feeds,firstStories:tFirst,allFeedsDone:tAll,...st,requests:nreq},bigRefresh:big,openStory:tStory,warm:{...n2,storiesVisible:tWarm},errors:errs.slice(0,3)}));
await b.close()})().catch(e=>{console.log('ERR',e.message);process.exit(1)});
