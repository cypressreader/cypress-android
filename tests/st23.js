const {APP}=require('./env');
const {mock,PW}=require('./mock');const {chromium}=require(PW);
let pass=0,fail=0;const log=[];const ck=(n,c,x='')=>{if(c)pass++;else{fail++;log.push(`FAIL ${n} ${x}`)}};
(async()=>{const b=await chromium.launch();
for(const [w,h] of [[412,860],[1000,800]]){
const p=await (await b.newContext({viewport:{width:w,height:h}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await mock(p,{n:4});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});
const r=await p.evaluate(async()=>{
 document.getElementById('set').showModal();await new Promise(r=>setTimeout(r,400));
 const btn=document.getElementById('skyp');btn.scrollIntoView({block:'center'});btn.click();await new Promise(r=>setTimeout(r,1200));
 const sk=document.getElementById('sky'),rc=sk&&sk.getBoundingClientRect();
  const o={exists:!!sk,inDialog:!!(sk&&sk.closest('dialog[open]')),inView:!!(rc&&rc.width>0&&rc.x>=0&&rc.y>=0&&rc.right<=innerWidth&&rc.bottom<=innerHeight)};
 await new Promise(r=>setTimeout(r,5000));o.gone=!document.getElementById('sky');
 // outside Settings it still goes to the page
 document.querySelectorAll('dialog[open]').forEach(d=>d.close());sky('set');await new Promise(r=>setTimeout(r,300));const s2=document.getElementById('sky');o.pageParent=!!(s2&&s2.parentElement===document.body);
 return o});
ck(w+' preview creates the animation',r.exists);
ck(w+' drawn inside the open Settings panel',r.inDialog);
ck(w+' fully on screen',r.inView,JSON.stringify(r));
ck(w+' cleans itself up',r.gone);
ck(w+' still goes to the page when Settings is closed',r.pageParent);
ck(w+' no page errors',!errs.length,errs.join('|'));await p.close()}
console.log('st23',pass,'pass',fail,'fail');log.forEach(l=>console.log(l));await b.close();process.exit(fail?1:0)})();
