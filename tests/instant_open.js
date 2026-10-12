/* Instant open, acceptance: airplane-mode tap == instant story.
   (1) the Daily edition is stored in full while ANOTHER view (All stories) is open, Wi-Fi only;
   (2) the whole edition is covered (cap = edition size, not 20);
   (3) with the network switched off and the app restarted, tapping a pre-downloaded story renders it fully, fast, with no request at all;
   (4) read-ahead is cancelled when the reader is left; (5) the All stories lookahead never shortens the endless list. */
const {APP}=require('./env');const {mock,seed,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x===undefined?'':x)}else console.log('ok',n)};
const SITES=['Alpha','Beta','Gamma','Delta'];
(async()=>{const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:412,height:860}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));let reqs=[];p.on('request',r=>{if(!/^file:|^data:|^blob:/.test(r.url()))reqs.push(r.url())});
 await mock(p,{n:12});await p.addInitScript(sd=>{try{if(!localStorage.getItem('folio'))localStorage.setItem('folio',JSON.stringify(sd))}catch(e){}},seed(SITES));
 await p.goto('file://'+APP);await p.waitForTimeout(2200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(800);
 await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 /* (2) cap */
 const caps=await p.evaluate(()=>{const set=(c,bat)=>{Object.defineProperty(navigator,'connection',{value:c,configurable:true});BATST=bat};set({type:'wifi'},{level:.8,charging:false});const a=dpCap();set({type:'cellular'},null);const c=dpCap();set({type:'wifi'},null);return{wifi:a,cell:c,ed:ED_N}});
 ck('on Wi-Fi the pre-download cap is the whole edition, on mobile data none',caps.wifi===caps.ed&&caps.cell===0,JSON.stringify(caps));
 /* (1) while All stories is open */
 const r1=await p.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));Object.defineProperty(navigator,'connection',{value:{type:'wifi'},configurable:true});BATST={level:.9,charging:true};
  S.sel='all';S.scroll='pages';render();await w(800);window.__warm=0;const w0=warmImgs;warmImgs=function(){window.__warm++;return w0.apply(this,arguments)};
  {const t=Date.now();while((DPRE.on||PF.run||PF.q.length)&&Date.now()-t<60000)await w(500)}/* let the start-up passes finish first */
  Object.keys(AC).forEach(k=>delete AC[k]);DPRE.tried=new Set();DPRE.k='';dayPreload();const t0=Date.now();
  while(Date.now()-t0<80000){const n=Object.values(AC).filter(e=>e.c&&e.h).length;if(n>=10)break;await w(500)}
  const ready=Object.entries(AC).filter(([l,e])=>e.c&&e.h).map(x=>x[0]);await w(1500);return{n:ready.length,secs:Math.round((Date.now()-t0)/1000),sel:S.sel,warm:window.__warm,links:ready.slice(0,4)}});
 ck('the Daily edition is stored ready while All stories is open ('+r1.n+' stories, '+r1.secs+'s)',r1.n>=10&&r1.sel==='all',JSON.stringify(r1));
 ck('no pictures were pre-downloaded',r1.warm===0,String(r1.warm));
 /* (3) airplane mode, app restarted */
 await p.evaluate(()=>{save();return new Promise(r=>setTimeout(r,1500))});
 await ctx.setOffline(true);reqs=[];
 await p.reload();await p.waitForTimeout(2500);await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 const prep=await p.evaluate(async link=>{await acReady;S.sel='all';render();await new Promise(r=>setTimeout(r,800));const cards=[...document.querySelectorAll('#grid .card[data-href]')].filter(c=>AC[c.dataset.href]&&AC[c.dataset.href].c);return{inAC:Object.values(AC).filter(e=>e.c).length,cards:cards.length,href:cards[0]&&cards[0].dataset.href}},r1.links[0]);
 ck('after a restart the stored stories are still there ('+prep.inAC+')',prep.inAC>=10&&prep.cards>=1,JSON.stringify(prep));
 reqs=[];
 const t0=Date.now();await p.click(`#grid .card[data-href="${prep.href}"]`);
 await p.waitForFunction(()=>{const b=document.querySelector('.cols .body');return b&&b.textContent.length>1500},null,{timeout:4000}).catch(()=>{});
 const ms=Date.now()-t0;
 const tap=await p.evaluate(()=>({text:(document.querySelector('.cols .body')||{textContent:''}).textContent.length,note:!!document.querySelector('.cols .note'),open:!!document.querySelector('#rd.on')}));
 await p.waitForTimeout(600);
 ck('airplane mode: the tapped story is open and complete, with no "Loading" note',tap.open&&tap.text>1500&&!tap.note,JSON.stringify(tap));
 ck('... in under 1.2 s ('+ms+' ms including the click)',ms<1200,String(ms));
 ck('... and the page made no network request at all',reqs.length===0,JSON.stringify(reqs.slice(0,3)));
 await ctx.setOffline(false);
 /* (4) leaving the reader cancels the read-ahead */
 const r4=await p.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));Object.defineProperty(navigator,'connection',{value:{type:'wifi'},configurable:true});BATST={level:.9,charging:true};
  if(document.querySelector('#rd.on'))closeRd();await w(400);S.sel='all';render();await w(600);
  Object.keys(AC).forEach(k=>delete AC[k]);PF.done.clear();PF.q.length=0;
  const a=cur[0],nx=cur[1];window.__calls=[];const g0=getFull;getFull=function(u){window.__calls.push(u);return g0.apply(this,arguments)};
  /* a slow queue: the next story is still waiting when the reader is left */
  PF.run=2;readAhead(a);const queued=PF.q.some(x=>x.link===nx.link);closeRd();await w(300);const dropped=!PF.q.some(x=>x.link===nx.link)&&!PF.done.has(nx.link);PF.run=0;
  return{queued,dropped,ra:PF.raLink}});
 ck('read-ahead queues exactly the next story, and leaving the reader drops it',r4.queued&&r4.dropped&&r4.ra==='',JSON.stringify(r4));
 /* (5) lookahead never shortens the endless list */
 const r5=await p.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));S.sel='all';S.scroll='pages';render();await w(600);const n0=cur.length;const m=document.querySelector('main');m.scrollTop=m.scrollHeight/2;await w(2500);pfAhead();await w(500);const n1=cur.length;let more=0;try{for(let i=0;i<6;i++){if(typeof NRMORE==='function')NRMORE();await w(250)}}catch(e){}return{n0,n1,n2:cur.length,total:S.feeds.flatMap(f=>items[f.id]||[]).length}});
 ck('the lookahead does not cap or truncate the list',r5.n1>=r5.n0&&r5.n2>=r5.n0,JSON.stringify(r5));
 ck('no page errors',!errs.length,errs[0]);
 await b.close();console.log('instant_open',bad?bad+' FAILED':'all passed');process.exit(bad?1:0)})();
