/* Designed image fallbacks: a missing or failing picture shows pattern art in the source's own colour (never a flat gradient). */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:412,height:860}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});
 const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const now=Date.now();
  S.feeds.slice(0,4).forEach((f,fi)=>{items[f.id]=Array.from({length:6},(_,i)=>({feedId:f.id,title:'Story '+fi+i+' about unique '+['a','b','c','d','e','f'][i],link:'https://w.test/'+fi+'/'+i,date:now-(i+fi)*36e5,summary:'x',img:i%2?'':'https://x.invalid/missing'+fi+i+'.jpg'}));state[f.id]='ok'});
  S.sel='all';S.atab='latest';render();await w(2500);for(let i=0;i<20;i++)NRMORE&&NRMORE();await w(500);
  const cards=[...document.querySelectorAll('#grid .card')],noimg=cards.filter(c=>c.classList.contains('noimg'));
  const pats=noimg.map(c=>getComputedStyle(c.querySelector('.ov')).backgroundImage);
  const kinds=new Set(S.feeds.slice(0,4).map(f=>patSvg(f)));
  return {n:cards.length,noimg:noimg.length,withPattern:pats.filter(x=>/url\(.*data:image\/svg/.test(x)).length,kinds:kinds.size,svgBrand:/hsla\(/.test([...kinds][0])}});
 ck('cards without a picture exist (missing and failed)',r.noimg>=6,JSON.stringify(r));
 ck('every one of them shows pattern art',r.withPattern===r.noimg,JSON.stringify(r));
 ck('feeds get their own pattern art',r.kinds>=2&&r.svgBrand,JSON.stringify(r));
 ck('no page errors',!errs.length,errs[0]);await b.close();
 console.log('patterns',bad?bad+' FAILED':'all passed');process.exit(bad?1:0);
})();
