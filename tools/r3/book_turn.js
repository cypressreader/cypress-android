/* book page-turn cost at 4x CPU slowdown. NOHAS=1 deletes the paragraph :has() rule first (A/B). W=884 H=1104 by default */
const {APP}=require('../../tests/env');const {mock,PW}=require('../../tests/mock');const {chromium}=require(PW);const path=require('path');
const FX=path.resolve(__dirname,'../../tests/fixtures/pride-and-prejudice.epub');
(async()=>{const b=await chromium.launch();const W=+process.env.W||884,H=+process.env.H||1104;
 const ctx=await b.newContext({viewport:{width:W,height:H},hasTouch:true});const p=await ctx.newPage();await mock(p,{n:3});
 await p.goto('file://'+(process.env.APPF?path.resolve(process.env.APPF):APP));await p.waitForTimeout(1500);await p.click('text=Get started').catch(()=>{});
 await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());S.scroll="pages";S.sel='books';side();render()});await p.waitForTimeout(400);
 const [fc]=await Promise.all([p.waitForEvent('filechooser'),p.evaluate(()=>document.querySelector('#grid [data-bkadd]').click())]);await fc.setFiles(FX);
 await p.waitForFunction(()=>document.querySelector('#grid .rki h2'),null,{timeout:60000});
 const ci=await p.evaluate(async()=>{const l=await bkAll();const b=l[0];let m=0;b.ch.forEach((c,i)=>{if(c.w>b.ch[m].w)m=i});return m});
 await p.evaluate(i=>document.querySelector('#grid [data-bkch="'+i+'"]:not(.go)').click(),ci);
 await p.waitForFunction(()=>R.ready&&curA&&curA.book,null,{timeout:20000});await p.waitForTimeout(1500);
 if(process.env.DEL)console.log('deleted',await p.evaluate(re=>{re=new RegExp(re);const walk=(s,r)=>{let n=0;for(let i=r.length-1;i>=0;i--){if(r[i].cssRules&&!r[i].selectorText)n+=walk(r[i],r[i].cssRules);else if(r[i].selectorText&&re.test(r[i].selectorText)){s.deleteRule(i);n++}}return n};let n=0;for(const s of document.styleSheets){let r;try{r=s.cssRules}catch(e){continue}n+=walk(s,r)}return n},process.env.DEL));
 if(process.env.NOHAS)console.log('deleted',await p.evaluate(()=>{let n=0;for(const s of document.styleSheets){let r;try{r=s.cssRules}catch(e){continue}for(let i=r.length-1;i>=0;i--)if(r[i].selectorText&&/:has\(\+\s*p:not\(\[class\]\)\)/.test(r[i].selectorText)){s.deleteRule(i);n++}}return n}));
 const cdp=await ctx.newCDPSession(p);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await cdp.send('Performance.enable');
 const met=async()=>{const m=(await cdp.send('Performance.getMetrics')).metrics;const g=k=>m.find(x=>x.name===k).value;return {style:g('RecalcStyleDuration'),layout:g('LayoutDuration'),script:g('ScriptDuration'),task:g('TaskDuration')}};
 const m0=await met();
 const GAP=+process.env.GAP||1600;
 const j=await p.evaluate(async GAP=>{const out=[];const p0=R.pg;
  for(let i=0;i<6;i++){let last=performance.now(),t0=last,worst=0,slow=0,run=true,busy=0;const f=t=>{const d=t-last;if(t-t0<1450){worst=Math.max(worst,d);if(d>34)slow++}if(d>34)busy+=d;last=t;if(run)requestAnimationFrame(f)};requestAnimationFrame(f);
   document.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));await new Promise(r=>setTimeout(r,GAP));run=false;out.push(Math.round(worst)+'/'+slow+'/'+Math.round(busy))}
  return {turns_worst_slow_hitchms:out.join(' '),turned:R.pg-p0,np:R.np}},GAP);
 const m1=await met();const d={};for(const k in m0)d[k]=Math.round((m1[k]-m0[k])*1000/6);
 console.log(JSON.stringify({W,nohas:!!process.env.NOHAS,perTurnMs:d,...j}));await b.close()})();
