/* Today: "Since this morning" is a real section of new stories, frozen for the session; a compact tab bar appears when the main strip scrolls away. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 for(const W of [412,1100]){
  const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:W,height:860}});await ctx.addInitScript(()=>{const R=Date,off=new R(2026,9,10,20,0,0).getTime()-R.now();globalThis.Date=class extends R{constructor(...a){if(a.length)super(...a);else super(R.now()+off)}static now(){return R.now()+off}}});
  const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});
  const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const now=Date.now(),w=ms=>new Promise(r=>setTimeout(r,ms));
   const T=['Why the new chip changes everything','Senate passes sweeping budget deal','Rescue teams reach flooded village','Inside the lab building tomorrow battery','Hands on with the quietest keyboard','Court blocks the merger of two giants','Researchers find water beneath the ice','Streaming prices rise again this autumn','Museum returns stolen statues to Peru','Why cities are banning leaf blowers'];
   S.feeds.slice(0,4).forEach((f,fi)=>{items[f.id]=Array.from({length:12},(_,i)=>({feedId:f.id,title:'Story '+fi+' '+i+' about unique '+['a','b','c','d','e','f','g','h','i','j','k','l'][i]+' '+T[(i+fi*3)%10].split(' ')[1],link:'https://w.test/'+fi+'/'+i,date:now-(i*.8+fi*.3)*3600e3,summary:'x',img:''}));state[f.id]='ok'});
   /* this morning's edition held the older half */
   const all=S.feeds.slice(0,4).flatMap(f=>items[f.id]);const old=all.filter(a=>a.date<now-3*3600e3).map(a=>a.link);
   const d=new Date();S.edprev={k:edKey().slice(0,-1)+'m',l:old,t:now-4*3600e3,cov:{}};S.edn=null;S.welcome=0;S.sel='today';render();await w(900);
   const g=document.querySelector('#grid'),sec=(g.querySelector('#dsec-since')||{}).parentElement,n1=sec?sec.querySelectorAll('.dd-i').length:0;
   [...sec?sec.querySelectorAll('.card[data-i]'):[]].forEach(c=>S.read[c.getAttribute('data-href')]=1);render();await w(700);
   const n2=document.querySelectorAll('.ddiff .dd-i').length;
   const m=document.querySelector('main');m.scrollTop=1500;await w(500);const on=document.querySelector('#mtabs.on')!==null,btns=document.querySelectorAll('#mtabs [data-bm]').length;
   m.scrollTop=0;await w(500);const off=!document.querySelector('#mtabs.on');
   return {kind:edKind(),n1,n2,on,btns,off,sec:!!sec,snap:DIFFSNAP&&DIFFSNAP.items.length,pool:DAYPOOL.length,diffNow:(editionDiff(DAYPOOL)||[]).length,old:old.length}});
  ck(W+' evening edition',r.kind==='e',JSON.stringify(r));ck(W+' since-this-morning section has stories',r.n1>=1,JSON.stringify(r));
  ck(W+' frozen after reading',r.n2===r.n1,JSON.stringify(r));ck(W+' mini tabs appear on scroll',r.on&&r.btns===4,JSON.stringify(r));ck(W+' mini tabs hide at top',r.off);
  ck(W+' no page errors',!errs.length,errs[0]);await b.close();
 }
 console.log('today_since',bad?bad+' FAILED':'all passed');process.exit(bad?1:0);
})();
