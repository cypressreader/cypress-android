/* Feed text size: Compact / Comfortable / Large scale card text only; display type is untouched; Large is one column. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 const b=await chromium.launch();
 for(const W of [1200,412]){
  const p=await (await b.newContext({viewport:{width:W,height:860}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:12});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(300);
  const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const o={};const now=Date.now();S.feeds.slice(0,4).forEach((f,fi)=>{state[f.id]='ok';items[f.id]=Array.from({length:12},(_,i)=>({feedId:f.id,title:['Harbour','Quantum','Glacier','Orchard'][fi]+' '+['alpha','bravo','charlie','delta','echo','foxtrot','golf','hotel','india','juliet','kilo','lima'][i]+' unrelated headline '+(fi*13+i)+' xq'+(fi*97+i*31),link:'https://w.test/'+fi+'/'+i,date:now-(i*55+fi*9)*6e4,img:'',summary:'I did not expect to feel this way about a game that I had only just started playing, said the reviewer, adding that the combat was the finest of the year.'}))});
   const fs=sel=>{const e=document.querySelector(sel);return e?parseFloat(getComputedStyle(e).fontSize)*(parseFloat(getComputedStyle(e).zoom)||1):0};
   o.btn=!!document.querySelector('#tsz [data-ts="c"]')&&!!document.querySelector('#tsz [data-ts="l"]');
   for(const k of ['m','c','l']){S.ts=k;tsApply();S.sel='all';S.atab='latest';render();await w(700);
    const cols=document.querySelector('#grid')?getComputedStyle(document.querySelector('#grid')).gridTemplateColumns.replace(/\([^)]*\)/g,'x').split(' ').length:0;
    o[k]={h3:fs('#grid .card h3'),p:fs('#grid .card p'),h:fs('header h1,.mast h1,#title'),sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,cols};}
   S.ts='m';tsApply();return o});
  const t='['+W+'] ';
  ck(t+'setting buttons exist',r.btn);
  ck(t+'cards rendered',r.m.h3>0,JSON.stringify(r.m));
  if(r.m.h3){
   ck(t+'Compact smaller, Large bigger than Comfortable',r.c.h3<r.m.h3&&r.l.h3>r.m.h3,JSON.stringify([r.c.h3,r.m.h3,r.l.h3]));
   ck(t+'ratios ~.9 / 1.16',Math.abs(r.c.h3/r.m.h3-.9)<.03&&Math.abs(r.l.h3/r.m.h3-1.16)<.03);
  }
  ck(t+'masthead/title unchanged',r.c.h===r.m.h&&r.l.h===r.m.h,JSON.stringify([r.c.h,r.m.h,r.l.h]));
  ck(t+'Large is a single column',r.l.cols===1,r.l.cols);
  ck(t+'no horizontal scroll at any step',[r.c,r.m,r.l].every(x=>x.sw<=x.cw+1),JSON.stringify([r.c,r.m,r.l].map(x=>[x.sw,x.cw])));
  ck(t+'no page errors',!errs.length,errs[0]);await p.close();
 }
 await b.close();console.log(bad?'text_size '+bad+' FAILED':'text_size all passed');process.exit(bad?1:0);
})();
