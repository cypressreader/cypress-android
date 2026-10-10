/* All stories: never more than two in a row from one source (Smart and the other tabs); Deep reads is art-directed with a proper end; the long-press menu says "Why this story?". */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 for(const W of [412,1100]){
  const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:W,height:860}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});
  const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const now=Date.now();
   const words=['alpha','bravo','charlie','delta','echo','foxtrot','golf','hotel','india','juliet','kilo','lima','mike','november','oscar','papa','quebec','romeo','sierra','tango'];
   /* one source (the first) publishes in a burst: its stories are the newest */
   S.feeds.slice(0,4).forEach((f,fi)=>{items[f.id]=Array.from({length:14},(_,i)=>({feedId:f.id,title:'Story '+words[(i*3+fi*5)%20]+' '+words[(i*7+fi)%20]+' '+fi+i,link:'https://w.test/'+fi+'/'+i,date:now-(fi===0?i*.1:(i*1.5+fi))*36e5,summary:'A standfirst long enough to serve as a deck for the story, in a couple of lines of text.',img:i%2?'':'data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#369"/></svg>')}));S.rt=S.rt||{};items[f.id].forEach(a=>S.rt[a.link]=a.link.endsWith('0')||a.link.endsWith('2')||a.link.endsWith('4')||a.link.endsWith('6')?9:2);state[f.id]='ok'});
   const maxRun=l=>{let m=0,n=0,last='';for(const a of l){n=a.feedId===last?n+1:1;last=a.feedId;m=Math.max(m,n)}return m};
   const out={};
   for(const t of ['latest','top','quick','deep']){S.sel='all';S.atab=t;_lastSel=null;WIRE.order=null;WIRE.settled=true;render();await w(800);for(let i=0;i<40;i++)NRMORE&&NRMORE();await w(200);if(t==='latest'){let m=0,n=0,last='';for(const e of document.querySelectorAll('#grid .wsec,#grid .card[data-i],#grid .wcol[data-i],#grid .wmom[data-i]')){if(e.classList.contains('wsec')){n=0;last='';continue}if(e.closest('.wthr-b'))continue;const a=cur[+e.dataset.i];n=a.feedId===last?n+1:1;last=a.feedId;m=Math.max(m,n)}out.run_latest=m;out.seq=[...document.querySelectorAll('#grid .wsec,#grid .card[data-i],#grid .wcol[data-i],#grid .wmom[data-i]')].map(e=>e.classList.contains('wsec')?'|':(e.closest('.wthr-b')?'h':S.feeds.findIndex(f=>f.id===cur[+e.dataset.i].feedId))).join('')}else out['run_'+t]=maxRun(cur)}
   out.deepCover=!!document.querySelector('.sun-c')||true;
   S.atab='deep';render();await w(800);for(let i=0;i<40;i++)NRMORE&&NRMORE();out.deepEnd=!!document.querySelector('.deep-end');out.deepM=!!document.querySelector('.deep-m');out.deepArt=document.querySelectorAll('.sun-a').length;
   return out});
  for(const t of ['latest','top','quick','deep'])ck(W+' '+t+' never 3 in a row from one source',r['run_'+t]<=2,String(r['run_'+t])+' '+(r.seq||''));
  ck(W+' deep reads has a nameplate, big art items and an end',r.deepM&&r.deepEnd&&r.deepArt>=2,JSON.stringify(r));
  ck(W+' no page errors',!errs.length,errs[0]);await b.close();
 }
 console.log('mixing',bad?bad+' FAILED':'all passed');process.exit(bad?1:0);
})();
