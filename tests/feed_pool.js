/* B95: at most six feeds are read at once; dead feeds back off; one OPML import takes at most 300 feeds */
const {APP}=require('./env');const {mock,seed,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:1100,height:820}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await mock(p,{n:4});
 await p.addInitScript(sd=>{try{if(!localStorage.getItem('folio'))localStorage.setItem('folio',JSON.stringify(sd))}catch(e){}},seed(Array.from({length:24},(_,i)=>'Site'+i)));
 await p.goto('file://'+APP);await p.waitForTimeout(2500);await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close())});
 const r=await p.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));let cur=0,max=0,calls=[];const _l0=load0;load0=async function(f){cur++;max=Math.max(max,cur);calls.push(f.id);try{await w(120);return await _l0.apply(this,arguments)}finally{cur--}};
  await w(3000);cur=0;max=0;calls=[];
  await loadAll(true);const all={max,n:calls.length,feeds:S.feeds.length};
  /* a feed that has failed 5 times in a row just now is left alone by an ordinary refresh, but a manual refresh still tries it */
  const dead=S.feeds[3];S.health[dead.id]={fail:Date.now(),fn:5,ff:Date.now()-1e6};S.feeds.forEach(f=>{if(f!==dead)S.health[f.id]={ok:Date.now()}});calls=[];S.feeds.forEach(f=>{f.rfm=0});await loadAll();const auto=calls.includes(dead.id);calls=[];await loadAll(true);const manual=calls.includes(dead.id);
  S.health[dead.id]={fail:Date.now()-2*864e5,fn:5,ff:Date.now()-3*864e5};calls=[];await loadAll();const later=calls.includes(dead.id);
  /* OPML: 350 feeds, one import */
  askBox=async()=>true;const n0=S.feeds.length;const opml='<?xml version="1.0"?><opml version="2.0"><body>'+Array.from({length:350},(_,i)=>`<outline text="F${i}" title="F${i}" type="rss" xmlUrl="https://imp${i}.test/feed"/>`).join('')+'</body></opml>';
  await opmlImport(opml,'big.opml');const added=S.feeds.length-n0;
  return {all,auto,manual,later,added}});
 ck('24 feeds are refreshed ('+r.all.n+' of '+r.all.feeds+') ',r.all.n>=r.all.feeds,JSON.stringify(r.all));
 ck('never more than six feeds at the same time (peak '+r.all.max+')',r.all.max<=6&&r.all.max>=2,JSON.stringify(r.all));
 ck('an ordinary refresh leaves a feed alone that has just failed five times',r.auto===false,JSON.stringify(r));
 ck('a manual refresh still tries it',r.manual===true,JSON.stringify(r));
 ck('after a long wait it is tried again',r.later===true,JSON.stringify(r));
 ck('one import takes at most 300 feeds (added '+r.added+')',r.added===300,JSON.stringify(r));
 ck('no page errors',!errs.length,errs[0]);await b.close();console.log(bad?'FAILED '+bad:'feed_pool all passed');process.exit(bad?1:0)})();
