/* Milestone badge (B18): the number and its label sit inside the circle with room to spare, for streaks and for big story counts. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{console.log((ok?'ok ':'FAIL ')+n+(ok?'':' '+(x||'')));if(!ok)bad++};
(async()=>{const b=await chromium.launch();
for(const [W,H] of [[360,740],[412,860]]){const p=await (await b.newContext({viewport:{width:W,height:H}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{n:10});
 await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(400);
 const out=[];
 for(const [kind,n] of [['s',7],['s',100],['s',365],['r',100],['r',1000],['r',10000]]){
  const r=await p.evaluate(async([kind,n])=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());mileShow({kind,n});await new Promise(r=>setTimeout(r,700));const s=document.querySelector('.mile-seal'),q=s.getBoundingClientRect(),cx=q.left+q.width/2,cy=q.top+q.height/2,R=q.width/2;let worst=1e9;
   for(const e of s.children){const r=e.getBoundingClientRect();for(const X of [r.left,r.right])for(const Y of [r.top,r.bottom])worst=Math.min(worst,R-Math.hypot(X-cx,Y-cy))}return worst},[kind,n]);
  if(r<5)out.push(kind+n+': '+r.toFixed(1)+'px from the edge')}
 ck(`[${W}] text sits at least 5px inside the circle`,!out.length,out.join('; '));
 ck(`[${W}] no page errors`,!errs.length,errs[0]);await p.context().close()}
await b.close();console.log(bad?'milestone_badge '+bad+' FAILED':'milestone_badge all passed');process.exit(bad?1:0)})();
