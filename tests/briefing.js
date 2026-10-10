/* The Briefing: no memo furniture, numbers + three to know + quote + designed end; never stuck at one story from an early load. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 for(const W of [412,1100]){
  const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:W,height:860}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});
  const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const now=Date.now(),w=ms=>new Promise(r=>setTimeout(r,ms));
   const T=['Why the new chip changes everything','Senate passes sweeping budget deal','Rescue teams reach flooded village','Inside the lab building tomorrow battery','Hands on with the quietest keyboard','Court blocks the merger of two giants','Researchers find water beneath the ice','Streaming prices rise again this autumn'];
   S.feeds.slice(0,4).forEach((f,fi)=>{items[f.id]=Array.from({length:8},(_,i)=>({feedId:f.id,title:T[(i+fi*2)%8]+' '+'abcd'[fi]+i,link:'https://w.test/'+fi+'/'+i,date:now-(i*1.5+fi)*3600e3,summary:'“We cannot keep doing this and expect a different outcome,” said the minister on Tuesday after the vote. More text.',img:''}));state[f.id]='ok'});
   /* a stale one-story brief saved from an early load */
   S.brief={day:new Date().toDateString(),links:[items[S.feeds[0].id][0].link]};S.sel='brief';render();await w(800);
   const g=document.querySelector('#grid');
   return {n:g.querySelectorAll('.bi').length,txt:g.innerText,num:!!g.querySelector('.bnum'),dig:g.querySelectorAll('.bdig li').length,quote:!!g.querySelector('.bq blockquote'),end:!!g.querySelector('.bend'),lead:g.querySelectorAll('.brf-lead').length}});
  ck(W+' not stuck at one story',r.n>=4,String(r.n));
  ck(W+' no memo furniture',!/MEMO|Memo|To: you|From:/.test(r.txt));
  ck(W+' numbers',r.num);ck(W+' three to know',r.dig===3);ck(W+' quote of the day',r.quote);ck(W+' designed end',r.end);ck(W+' one lead',r.lead===1);
  ck(W+' no page errors',!errs.length,errs[0]);await b.close();
 }
 console.log('briefing',bad?bad+' FAILED':'all passed');process.exit(bad?1:0);
})();
