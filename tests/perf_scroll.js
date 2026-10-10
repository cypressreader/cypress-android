/* Scrolling a long feed does not re-measure the whole page every frame: the pinned section / hairline / picture-drift pass runs about twelve times a second, reuses its lists, and walks from where it was. Counts the page reads during a 2-second scroll. */
const {APP}=require('./env');const {mock,seed,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:412,height:860},hasTouch:true,isMobile:true})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await mock(p,{n:30});await p.addInitScript(sd=>{try{if(!localStorage.getItem('folio'))localStorage.setItem('folio',JSON.stringify(sd))}catch(e){}},seed(['Alpha','Beta','Gamma','Delta']));await p.goto('file://'+APP);await p.waitForTimeout(2200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(2200);
 const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));S.sel='all';S.atab='latest';render();await w(1500);
  const m=document.querySelector('main');let rects=0,qsa=0;const R0=Element.prototype.getBoundingClientRect,Q0=Element.prototype.querySelectorAll;
  Element.prototype.getBoundingClientRect=function(){rects++;return R0.call(this)};Element.prototype.querySelectorAll=function(q){if(this.id==='grid')qsa++;return Q0.call(this,q)};
  let frames=0;const t0=performance.now();await new Promise(res=>{const f=()=>{m.scrollTop+=100;frames++;if(performance.now()-t0<2000)requestAnimationFrame(f);else res()};requestAnimationFrame(f)});
  await w(300);Element.prototype.getBoundingClientRect=R0;Element.prototype.querySelectorAll=Q0;
  return {frames,rects,qsa,cards:document.querySelectorAll('#grid .card').length,deep:Math.round(m.scrollTop)}});
 console.log(JSON.stringify(r));
 ck('the feed was long and was scrolled (frames '+r.frames+', '+r.deep+'px)',r.cards>=20&&r.deep>2000,JSON.stringify(r));
 ck('the grid is not re-queried on every frame ('+r.qsa+' queries in '+r.frames+' frames; the old code made about 2.3 per frame)',r.qsa<=r.frames*.8,r.qsa);
 ck('page measurements stay low: '+r.rects+' reads over '+r.frames+' frames (was about 40 per frame)',r.rects<=r.frames*9,r.rects);
 ck('no page errors',!errs.length,errs[0]);
 await b.close();console.log(bad?'perf_scroll '+bad+' FAILED':'perf_scroll all passed');process.exit(bad?1:0);
})();
