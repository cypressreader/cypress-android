/* All stories, Columns view: a story group never leaves a dead blank column. Every column the group opens holds stories; when that cannot be balanced the group falls back to fewer columns (down to one). */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 const b=await chromium.launch();
 for(const W of [1280,1024,820]){
  const p=await (await b.newContext({viewport:{width:W,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(300);
  const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const now=Date.now();
   const f=S.feeds[0];S.feeds.slice(1).forEach(x=>items[x.id]=[]);
   const ages=[3,8,15,25,40,55,  80,95,  300,330,380,  700,  1500,1530,1560,1590,1620];
   items[f.id]=ages.map((m,i)=>({feedId:f.id,title:'Column story '+i+' alpha'+i+' beta'+(i*3),link:'https://w.test/c'+i,img:i===0||i===8?'data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#468"/></svg>'):'',date:now-m*6e4,summary:'A summary that is long enough to count as a lede for sure here with words.'}));
   state[f.id]='ok';S.seen=S.seen||{};S.seen.all=now-70*6e4;S.wdens='col';S.sel='all';S.atab='latest';WIRE.order=null;WIRE.settled=true;_lastSel=null;render();await w(1500);
   for(let i=0;i<20;i++){try{NRMORE&&NRMORE()}catch(e){}}await w(600);
   const out=[];
   for(const g of document.querySelectorAll('#grid .wcols')){
    const kids=[...g.children],cs=getComputedStyle(g),lefts=new Set(kids.map(k=>Math.round(k.getBoundingClientRect().left))),avail=Math.max(1,Math.floor((g.clientWidth+28)/278));
    out.push({n:kids.length,used:lefts.size,count:cs.columnCount,avail,ruleW:cs.columnRuleWidth,w:g.clientWidth});
   }
   /* groups of every size, built the way the Columns view builds them, then run through the fix */
   const g0=document.querySelector('#grid');
   for(const n of [1,2,3,4,5,6,7,9]){const d=document.createElement('div');d.className='wcols';d.dataset.syn=n;d.style.gridColumn='1/-1';d.innerHTML=Array.from({length:n},(_,i)=>'<a class="cvlead wcol" href="#"><small>Src · 3h ago</small><b>Synthetic story '+i+' with a headline of ordinary length</b></a>').join('');g0.append(d)}
   wcolsFix();
   for(const g of g0.querySelectorAll('.wcols[data-syn]')){const kids=[...g.children],cs=getComputedStyle(g),lefts=new Set(kids.map(k=>Math.round(k.getBoundingClientRect().left)));out.push({syn:true,n:kids.length,used:lefts.size,count:cs.columnCount,avail:Math.max(1,Math.floor((g.clientWidth+28)/278)),w:g.clientWidth})}
   return out});
  ck(W+' there are column groups to check',r.length>=1,JSON.stringify(r));
  for(const [i,g] of r.entries()){
   const cnt=g.count==='auto'?g.avail:+g.count;
   ck(W+' group '+(i+1)+' ('+g.n+' stories) uses every column it opens',g.used===Math.min(cnt,g.n)||g.used===cnt,JSON.stringify(g));
   ck(W+' group '+(i+1)+' never opens more columns than it has stories',cnt<=Math.max(1,g.n),JSON.stringify(g));
  }
  ck(W+' no page errors',!errs.length,errs[0]);await p.close();
 }
 await b.close();console.log(bad?'col_fill '+bad+' FAILED':'col_fill all passed');process.exit(bad?1:0);
})();
