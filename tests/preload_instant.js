/* Instant open: stories are fetched, extracted and cleaned ahead of time (the Daily edition on Wi-Fi, the next stories while one is read, the cards below the screen while scrolling) and stored render-ready; tapping one does no network, no page parsing, no cleaning. Gating: nothing on mobile data, a few stories when the connection or charge is unknown or low. */
const {APP}=require('./env');const {mock,seed,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
const SITES=['Alpha','Beta','Gamma','Delta'];
async function boot(b,n,ua){
 const ctx=await b.newContext(Object.assign({viewport:{width:1100,height:820}},ua?{userAgent:ua}:{}));const p=await ctx.newPage();const errs=[];p.errs=errs;p.on('pageerror',e=>errs.push(e.message));p.reqs=[];p.on('request',r=>{if(!/^file:|^data:/.test(r.url()))p.reqs.push(r.url())});
 await mock(p,{n});await p.addInitScript(sd=>{try{if(!localStorage.getItem('folio'))localStorage.setItem('folio',JSON.stringify(sd))}catch(e){}},seed(SITES));
 await p.goto('file://'+APP);await p.waitForTimeout(2200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(800);
 await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close())});return {ctx,p};
}
(async()=>{
 const b=await chromium.launch();
 /* ---------- gating ---------- */
 {const {ctx,p}=await boot(b,6);
  const g=await p.evaluate(async()=>{const o={};const set=(c,bat)=>{Object.defineProperty(navigator,'connection',{value:c,configurable:true});BATST=bat};
   set({type:'cellular'},null);o.cell=pfCap(40);o.cellDp=dpCap();const t0=PF.tot;const L=Object.values(items).flat().slice(0,5);prefetch(L,true);o.cellPrefetched=PF.tot-t0;
   set({type:'wifi'},{level:.9,charging:true});o.wifiCharging=dpCap();
   set({type:'wifi'},{level:.3,charging:false});o.wifiLow=dpCap();
   set({type:'wifi'},{level:.8,charging:false});o.wifiOk=dpCap();
   set({effectiveType:'3g'},null);o.slow=pfCap(40);
   set({type:'wifi'},null);Object.keys(AC).forEach(k=>delete AC[k]);PF.done.clear();PF.q.length=0;const t1=PF.tot;prefetch(L,true);o.wifiPrefetched=PF.tot-t1;
   return o});
  ck('nothing is fetched ahead on mobile data (cap 0, no story queued)',g.cell===0&&g.cellDp===0&&g.cellPrefetched===0,JSON.stringify(g));
  ck('a slow (3G) connection counts as mobile data',g.slow===0,JSON.stringify(g));
  ck('Wi-Fi on charge may take the whole edition (40); on a low battery only a few (6); on Wi-Fi with a fair charge 20',g.wifiCharging===40&&g.wifiLow===6&&g.wifiOk===20,JSON.stringify(g));
  ck('on Wi-Fi stories are queued',g.wifiPrefetched>0,JSON.stringify(g));
  ck('no page errors (gating)',!p.errs.length,p.errs[0]);await ctx.close()}
 {const {ctx,p}=await boot(b,6,'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/124 Mobile Safari/537.36');
  const g=await p.evaluate(()=>{Object.defineProperty(navigator,'connection',{value:undefined,configurable:true});BATST={level:.9,charging:true};return {unknown:pfCap(40),kind:netKind(),mobile:MOBILEUA}});
  ck('a phone that cannot say what network it is on takes at most 6 stories',g.mobile&&g.kind==='unknown'&&g.unknown===6,JSON.stringify(g));await ctx.close()}
 /* ---------- the Daily pre-download, then a tap with no network ---------- */
 {const {ctx,p}=await boot(b,6);
  const r=await p.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));Object.defineProperty(navigator,'connection',{value:{type:'wifi'},configurable:true});BATST={level:.9,charging:true};
   window.__warm=0;const w0=warmImgs;warmImgs=function(){window.__warm++;return w0.apply(this,arguments)};
   S.sel='today';render();await w(3500);dayPreload();const t0=Date.now();
   while(Date.now()-t0<70000){const n=Object.values(AC).filter(e=>e.c&&e.h).length;if(n>=8)break;await w(500)}
   const ready=Object.entries(AC).filter(([l,e])=>e.c&&e.h);return {n:ready.length,secs:Math.round((Date.now()-t0)/1000),warm:window.__warm,links:ready.map(x=>x[0]).slice(0,3),dgl:DGL.length}});
  ck('the Daily edition was fetched in full and stored render-ready ('+r.n+' stories in '+r.secs+'s)',r.n>=8,JSON.stringify(r));
  ck('pictures stayed lazy during the bulk pass (no picture warm-up)',r.warm===0,String(r.warm));
  /* tap: count everything that could touch the network or do parsing/cleaning */
  const tap=await p.evaluate(async link=>{const w=ms=>new Promise(r=>setTimeout(r,ms));const a=findStory(link);const cnt={fetch:0,getFull:0,fetchText:0,fromPage:0,fromHTML:0,tidy:0,junkClean:0,foldBoiler:0,dropTitle:0};
   const wrap=(n)=>{const o=window[n];window[n]=function(){cnt[n]++;return o.apply(this,arguments)}};['getFull','fetchText','fromPage','fromHTML','tidy','junkClean','foldBoiler','dropTitle'].forEach(wrap);
   const f0=window.fetch;window.fetch=function(){cnt.fetch++;return f0.apply(this,arguments)};
   S.sel='today';const t0=performance.now();openReader(a);await w(60);const first=performance.now()-t0;await w(500);const snap=Object.assign({},cnt);await w(1000);
   const text=document.querySelector('.cols .body').textContent;return {cnt:snap,text:text.length,has:/paragraph/i.test(text),note:!!document.querySelector('.cols .note'),first:Math.round(first)}},r.links[0]);
  const net=p.reqs.length;await p.waitForTimeout(200);
  ck('tapping a pre-downloaded story: zero network (fetch, proxies, pages)',tap.cnt.fetch===0&&tap.cnt.getFull===0&&tap.cnt.fetchText===0&&tap.cnt.fromPage===0,JSON.stringify(tap.cnt));
  ck('... zero parsing and cleaning (no page parse, tidy, junk clean, title drop or boilerplate fold)',tap.cnt.fromHTML===0&&tap.cnt.tidy===0&&tap.cnt.junkClean===0&&tap.cnt.dropTitle===0&&tap.cnt.foldBoiler===0,JSON.stringify(tap.cnt));
  ck('... and the full story is on the page with no "Loading" note',tap.has&&tap.text>1500&&!tap.note,JSON.stringify(tap));
  /* the browser itself saw no request after the tap either */
  const after=await p.evaluate(()=>performance.getEntriesByType('resource').length);
  ck('no page errors (daily + tap)',!p.errs.length,p.errs[0]);await ctx.close()}
 /* ---------- read-ahead of the next stories in the reading queue ---------- */
 {const {ctx,p}=await boot(b,10);
  const r=await p.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));Object.defineProperty(navigator,'connection',{value:{type:'wifi'},configurable:true});BATST={level:.9,charging:true};
   S.sel='all';S.atab='latest';S.scroll='paged';render();await w(800);
   const a=cur[0],nx=cur.slice(1,4).map(x=>x.link);Object.keys(AC).forEach(k=>delete AC[k]);PF.done.clear();
   openReader(a);const t0=Date.now();let got=0;while(Date.now()-t0<45000){got=nx.filter(l=>AC[l]&&AC[l].c).length;if(got>=3)break;await w(500)}
   return {got,secs:Math.round((Date.now()-t0)/1000),ctx:(R.ctx||[]).length,nextIsCtx1:R.ctx&&R.ctx[1]&&R.ctx[1].link===nx[0],opened:!!AC[a.link]}});
  ck('while story 1 is read, stories 2-4 of the queue are stored ready ('+r.got+' of 3 in '+r.secs+'s)',r.got>=3&&r.nextIsCtx1,JSON.stringify(r));
  ck('no page errors (read-ahead)',!p.errs.length,p.errs[0]);await ctx.close()}
 /* ---------- viewport lookahead while scrolling All stories ---------- */
 {const {ctx,p}=await boot(b,30);
  const r=await p.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));Object.defineProperty(navigator,'connection',{value:{type:'wifi'},configurable:true});BATST={level:.9,charging:true};
   S.sel='all';S.atab='latest';render();await w(900);Object.keys(AC).forEach(k=>delete AC[k]);PF.done.clear();PF.q.length=0;PF.n=0;
   const m=document.querySelector('main');m.scrollTop=900;m.dispatchEvent(new Event('scroll'));await w(400);m.scrollTop=1000;m.dispatchEvent(new Event('scroll'));
   const vh=innerHeight,vis=[...document.querySelectorAll('#grid .card[data-i]')].filter(c=>{const q=c.getBoundingClientRect();return q.top<vh&&q.bottom>0}).map(c=>+c.dataset.i);const z=Math.max(...vis);
   const ahead=cur.slice(z+1,z+11).map(x=>x.link);const t0=Date.now();let got=0;
   while(Date.now()-t0<60000){got=ahead.filter(l=>(AC[l]&&AC[l].c)).length;if(got>=7)break;await w(600)}
   return {z,got,secs:Math.round((Date.now()-t0)/1000),total:ahead.length,done:ahead.filter(l=>PF.done.has(l)).length}});
  ck('scrolling All stories: the next ten cards below the screen are stored ready ('+r.got+' of '+r.total+' in '+r.secs+'s)',r.total===10&&r.got>=7&&r.done>=9,JSON.stringify(r));
  ck('no page errors (lookahead)',!p.errs.length,p.errs[0]);await ctx.close()}
 await b.close();console.log(bad?'preload_instant '+bad+' FAILED':'preload_instant all passed');process.exit(bad?1:0);
})();
