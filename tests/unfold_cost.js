/* Unfold cost with a big library: style+layout ms and time to the first handed-over frame, 412->840 and back. node tests/unfold_cost.js [n per feed] */
const {mockRich,seedRich,PW}=require('./mock3');const {chromium}=require(PW);
const APP=require('./env').APP,N=+(process.argv[2]||480);
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:412,height:900}});const p=await ctx.newPage();
await mockRich(p,{n:N});
await p.addInitScript(s=>localStorage.setItem('folio',JSON.stringify({...s,intro:false,theme:'light',splitm:'land'})),seedRich());
await p.goto('file://'+APP);await p.waitForTimeout(6000);
await p.evaluate(()=>{[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Got it')?.click()});await p.waitForTimeout(1500);
const cdp=await ctx.newCDPSession(p);await cdp.send('Performance.enable');
const met=async()=>{const m=(await cdp.send('Performance.getMetrics')).metrics;const g=k=>m.find(x=>x.name===k).value*1000;return {L:g('LayoutDuration'),S:g('RecalcStyleDuration'),J:g('ScriptDuration')}};
console.log('stories',await p.evaluate(()=>document.querySelectorAll('#grid .card,#grid article,#grid [data-id]').length),'dom',await p.evaluate(()=>document.getElementsByTagName('*').length));
for(const [w,h] of [[840,880],[412,900],[840,880],[412,900]]){
 await p.evaluate(()=>{window.__t0=null;new ResizeObserver((e,o)=>{if(window.__t0==null)window.__t0=performance.now()}).observe(document.documentElement)});
 const a=await met();const t=Date.now();await p.setViewportSize({width:w,height:h});
 const r=await p.evaluate(()=>new Promise(res=>requestAnimationFrame(()=>setTimeout(()=>res(performance.now()-(window.__t0||performance.now())),0))));
 await p.waitForTimeout(1500);const z=await met();
 console.log(w+'px','frame',r.toFixed(0)+'ms','wall',Date.now()-t,'| layout',(z.L-a.L).toFixed(0),'style',(z.S-a.S).toFixed(0),'script',(z.J-a.J).toFixed(0))}
await b.close()})();
