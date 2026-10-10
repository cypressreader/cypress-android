/* A story that is slow to load shows real progress (seconds, which route) instead of a frozen line, and after 16 seconds says so honestly with a "View the site here" way out. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:412,height:860}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await mock(p,{n:6});
 /* every route to a page hangs: the worst case for a slow site */
 await p.route(/api\.allorigins\.win|codetabs\.com|corsproxy\.io|r\.jina\.ai|web\.archive\.org|slow\.test/,()=>{});
 await p.goto('file://'+APP);await p.waitForTimeout(1300);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(300);
 await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const f=S.feeds[0];const a={feedId:f.id,title:'Slow story',link:'https://slow.test/slow-1',date:Date.now(),summary:'A short summary only.',img:'',html:'<p>A short summary only.</p>'};items[f.id]=[a];S.sel='all';S.scroll='paged';render();openReader(a)});
 await p.waitForTimeout(1200);const n0=await p.evaluate(()=>(document.querySelector('.cols .note')||{}).textContent||'');
 await p.waitForTimeout(6500);const n1=await p.evaluate(()=>(document.querySelector('.cols .note')||{}).textContent||'');
 await p.waitForTimeout(11000);const n2=await p.evaluate(()=>({t:(document.querySelector('.cols .note')||{}).textContent||'',btn:!!document.querySelector('.cols .note [data-web]'),retry:!!document.querySelector('.cols .note [data-retry]')}));
 ck('it starts with the plain loading line',/^Loading the full article/.test(n0),n0);
 ck('after a few seconds it shows real progress (seconds and the route being tried)',/Loading the full article… .*route \d of \d.*·\s*\d+s|·\s*\d+s/.test(n1),n1);
 ck('after 16 seconds it says so honestly and offers "View the site here", Try again and the original',/Taking too long/.test(n2.t)&&n2.btn&&n2.retry&&/View the site here/.test(n2.t),JSON.stringify(n2));
 ck('no page errors',!errs.length,errs[0]);
 await ctx.close();await b.close();console.log(bad?'slow_load '+bad+' FAILED':'slow_load all passed');process.exit(bad?1:0);
})();
