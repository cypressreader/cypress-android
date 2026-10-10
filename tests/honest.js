/* An honest app: quiet-day copy, text-only mode, pick-up-where-you-left-off rules. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:412,height:860}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});
 const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const now=Date.now();const o={};
  const f=S.feeds[0];const mk=(i,age)=>({feedId:f.id,title:'Story '+i+' unique'+i,link:'https://w.test/p'+i,date:now-age*36e5,summary:'x',img:'https://i.test/'+i+'.jpg'});
  items[f.id]=Array.from({length:8},(_,i)=>mk(i,30+i));S.feeds.slice(1).forEach(x=>items[x.id]=[]);state[f.id]='ok';
  DGL=items[f.id].map(a=>a.link);o.quiet=quietDay();
  items[f.id]=Array.from({length:8},(_,i)=>mk(i,1+i));o.busy=quietDay();
  /* pick-ups */
  S.read={};S.prog={};S.dw={};S.thm={};S.pug={};S.pu=null;S.st=S.st||{d:{},src:{},tp:{},hr:[],fin:{}};S.st.fin={};
  const L=i=>'https://w.test/p'+i,t=now-36e5;
  S.prog[L(0)]={p:.4,t};S.dw[L(1)]={s:75,t};S.prog[L(2)]={p:.1,t};S.dw[L(2)]={s:10,t};   /* 2 bounced */
  S.prog[L(3)]={p:.6,t};S.thm[L(3)]=-1;                                                    /* thumbs down */
  S.prog[L(4)]={p:.5,t:t-1000};S.prog[L(5)]={p:.7,t:t-2000};S.prog[L(6)]={p:.9,t:t-3000};
  S.prog[L(7)]={p:1,t};                                                                    /* finished */
  const a=pickups();o.first=a.map(x=>x.slice(-1)).join('');
  o.again=pickups().map(x=>x.slice(-1)).join('');
  S.pu.k='next-edition';const n=pickups();o.next=n.map(x=>x.slice(-1)).join('');
  S.pu.k='after';o.after=pickups().length;
  o.html=(()=>{S.pu=null;S.pug={};return pickupHtml()})();
  /* text only */
  S.txo=true;txoApply();o.cleared=items[f.id].every(a=>!a.img);o.cls=document.documentElement.classList.contains('txo');
  S.txo=false;txoApply();o.back=items[f.id].every(a=>!!a.img);o.clsOff=!document.documentElement.classList.contains('txo');
  return o});
 ck('quiet day says so with the facts',/A quiet (morning|evening) — 8 stories, all worth your time\./.test(r.quiet),r.quiet);ck('busy day gets the normal line',r.busy==='');
 ck('only genuine progress resurfaces, max 3, bounce and thumbs-down excluded',r.first.length===3&&!/[237]/.test(r.first)&&!/[3]/.test(r.first),r.first);
 ck('same edition keeps the same list',r.again===r.first,r.again);
 ck('next edition shows what is left, never the same ones again',r.next.split('').every(c=>!r.first.includes(c)),r.next+' vs '+r.first);
 ck('pick-up section renders',/Pick up where you left off/.test(r.html));
 ck('text only strips pictures and sets class',r.cleared&&r.cls);ck('turning it off puts them back',r.back&&r.clsOff);
 ck('no page errors',errs.length===0,errs.join('|'));
 await b.close();console.log(bad?'FAILED '+bad:'honest all passed');process.exit(bad?1:0);
})();
