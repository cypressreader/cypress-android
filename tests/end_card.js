/* End of article: the end card (colophon, Up next, Related reads) flows after the text and never covers it; no blank page is made for the Up next cue in page mode. Scroll and page modes, phone and tablet. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 const b=await chromium.launch();
 for(const [W,H,sc] of [[1100,820,'paged'],[820,1180,'paged'],[1280,720,'paged'],[412,860,'vertical'],[1100,820,'vertical']]){
  const p=await (await b.newContext({viewport:{width:W,height:H}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(300);
  const r=await p.evaluate(async(sc)=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const f=S.feeds[0];const now=Date.now();
   const body=(i,n)=>Array.from({length:n},(_,k)=>'<p>Story '+i+' paragraph '+k+' '+'words for the story here, ordinary reporting text. '.repeat(14)+'</p>').join('');
   items[f.id]=[[0,22],[1,12],[2,30],[3,9]].map(([i,n])=>({feedId:f.id,title:'End card story '+i,link:'https://w.test/ec'+i,date:now-i*36e5,summary:'x',img:'',html:body(i,n)}));S.feeds.slice(1).forEach(x=>items[x.id]=[]);state[f.id]='ok';
   S.scroll=sc;S.cont=true;S.sel='all';render();await w(500);
   const out=[];
   for(const i of [0,1,2,3]){
    openReader(items[f.id][i]);await w(2300);
    const o={i,vert:isVert(),np:R.np};
    if(!isVert()){R.pg=R.np-1;show();await w(300)}else{const v=vView();v.scrollTop=v.scrollHeight;await w(400)}
    const rf=document.querySelector('.rfoot'),nx=document.querySelector('.rnext'),view=document.querySelector('#rd .view').getBoundingClientRect();
    o.tag=rf&&rf.tagName;o.tf=rf&&getComputedStyle(rf).transform;o.rfpos=rf&&getComputedStyle(rf).position;
    const rr=rf&&rf.getBoundingClientRect();
    o.inView=rr&&rr.left>=view.left-1&&rr.right<=view.right+1;
    const ps=[...document.querySelectorAll('.cols .body > p')].filter(p=>!p.classList.contains('endmark')&&!p.classList.contains('rtags'));
    const hits=[];if(rr)for(const p of ps){for(const q of p.getClientRects()){if(q.width&&q.bottom>view.top&&q.top<view.bottom&&rr.left<q.right-2&&rr.right>q.left+2&&rr.top<q.bottom-2&&rr.bottom>q.top+2){hits.push(ps.indexOf(p));break}}}
    o.hits=hits;o.rnext=!!nx;
    if(nx){const nr=nx.getBoundingClientRect();o.rnextAfter=!rr||nr.top>=rr.bottom-1}
    /* page mode: the last page holds real content, not just a cue */
    if(!isVert()){const vis=[...document.querySelectorAll('.cols .body > *, .cols > .orig')].filter(e=>{const q=e.getBoundingClientRect();return q.width>0&&q.right>view.left&&q.left<view.right&&q.bottom>view.top&&q.top<view.bottom});o.lastKinds=vis.map(e=>e.className||e.tagName).join(',');o.lastH=Math.max(0,...vis.map(e=>e.getBoundingClientRect().bottom))-Math.min(1e9,...vis.map(e=>e.getBoundingClientRect().top))}
    out.push(o)}
   return out},sc);
  for(const o of r){
   const t='['+W+'x'+H+' '+sc+' story '+o.i+'] ';
   ck(t+'the end card is not shifted off its place',o.tf==='none'&&o.rfpos!=='fixed',JSON.stringify(o));
   ck(t+'it sits inside the reading area',o.inView,JSON.stringify(o));
   ck(t+'it never covers article text',o.hits.length===0,JSON.stringify(o.hits));
   if(sc==='paged')ck(t+'no separate Up next page is made',o.rnext===false&&/orig|rfoot|p/.test(o.lastKinds||'')&&o.lastH>120,JSON.stringify([o.rnext,o.lastKinds,o.lastH]));
   else if(o.i<3)ck(t+'the Up next cue follows the end card',o.rnext&&o.rnextAfter,JSON.stringify([o.rnext,o.rnextAfter]));else ck(t+'the last story has no Up next cue',!o.rnext);
  }
  ck('['+W+'x'+H+' '+sc+'] no page errors',!errs.length,errs[0]);await p.close();
 }
 await b.close();console.log(bad?'end_card '+bad+' FAILED':'end_card all passed');process.exit(bad?1:0);
})();
