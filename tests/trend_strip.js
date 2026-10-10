/* Regression: the trending strip must survive navigation (away and back, through other views and tabs), a settled ranking, and a quiet moment. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 for(const W of [412,1100]){
  const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:W,height:860}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});
  const out=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const now=Date.now(),w=ms=>new Promise(r=>setTimeout(r,ms));
   S.feeds.slice(0,4).forEach((f,fi)=>{items[f.id]=Array.from({length:12},(_,i)=>({feedId:f.id,title:(i<3?'Budget deal ':'Other thing ')+fi+' '+i,link:'https://w.test/'+fi+'/'+i,date:now-(i*2+fi)*3600e3,summary:'x',img:''}));state[f.id]='ok'});
   const st=()=>!!document.querySelector('.wtrend [data-trend]'),r={};
   S.sel='all';S.atab='latest';render();await w(900);r.first=st();
   S.sel='saved';render();await w(300);S.sel='all';render();await w(900);r.viaSaved=st();
   S.sel='today';render();await w(300);S.sel='all';render();await w(900);r.viaToday=st();
   S.sel='s:'+S.feeds[0].id;render();await w(300);S.sel='all';render();await w(900);r.viaFeed=st();
   S.atab='top';render();await w(300);S.atab='latest';render();await w(900);r.viaTab=st();
   WIRE.order=null;WIRE.settled=false;WIRE.tr={};_lastSel=null;render();await w(300);r.unsettled=st();
   /* a quiet moment: the same stories now look a day old, so a fresh count finds nothing; the last strip is kept */
   S.sel='saved';render();await w(200);S.feeds.slice(0,4).forEach(f=>items[f.id].forEach(a=>a.date-=26*36e5));S.sel='all';render();await w(900);r.quiet=st();
   /* folder and single-feed views keep it too */
   S.feeds.slice(0,4).forEach(f=>items[f.id].forEach(a=>a.date+=26*36e5));WIRE.tr={};
   const fo=S.folders.find(f=>S.feeds.filter(x=>x.folder===f.id).length>1);if(fo){S.sel='f:'+fo.id;render();await w(900);r.folder=st()}
   /* all four All stories tabs carry the strip, and a chip opens the topic page directly */
   for(const t of ['latest','top','quick','deep']){S.sel='all';S.atab=t;_lastSel=null;render();await w(700);r['tab_'+t]=st()}
   S.atab='latest';S.sel='all';render();await w(700);document.querySelector('.wtrend [data-trend]').click();await w(700);
   r.topicOpen=!!document.querySelector('.tmast');r.noSearchBar=!document.querySelector('#srch.open');
   document.querySelector('[data-topicx]').click();await w(600);r.topicClosed=!document.querySelector('.tmast')&&document.querySelector('#q').value==='';
   document.querySelector('.wtrend [data-trend]').click();await w(500);S.sel='saved';render();await w(400);r.topicEndsOnLeave=!document.querySelector('.tmast')&&document.querySelector('#q').value==='';
   return r});
  for(const k in out)ck(W+' strip '+k,out[k]===true,JSON.stringify(out));
  ck(W+' no page errors',!errs.length,errs[0]);await b.close();
 }
 console.log('trend_strip',bad?bad+' FAILED':'all passed');process.exit(bad?1:0);
})();
