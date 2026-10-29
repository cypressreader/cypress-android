/* Card headers (B34): source names, read times and the "N sources" badge are never cut to a stub ("BBC NE…", "3 so") on phone widths, in the Daily, All stories and Headlines. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{console.log((ok?'ok ':'FAIL ')+n+(ok?'':' '+(x||'')));if(!ok)bad++};
const svg='<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000"><rect width="1600" height="1000" fill="#d8c9a8"/><circle cx="800" cy="420" r="190" fill="#f3d9bf"/></svg>';
(async()=>{const b=await chromium.launch();
for(const [W,H] of [[320,640],[360,740],[412,860],[515,900]])for(const sel of ['today','all','headlines']){
 const p=await (await b.newContext({viewport:{width:W,height:H}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{n:10});
 await p.route('https://img.test/**',r=>r.fulfill({status:200,contentType:'image/svg+xml',body:svg}));
 await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(400);
 const r=await p.evaluate(async sel=>{const w=ms=>new Promise(r=>setTimeout(r,ms));document.querySelectorAll('dialog[open]').forEach(d=>d.close());const now=Date.now();
  const names=['BBC News','The Guardian World','The New York Times','Ars Technica'];S.feeds.slice(0,4).forEach((f,fi)=>{f.title=names[fi];items[f.id]=Array.from({length:30},(_,i)=>({feedId:f.id,title:'Ukraine strikes Yandex data centre as talks stall over ceasefire terms '+i,link:'https://x.test/'+fi+'/'+i,img:i%2?'https://img.test/'+i+'.jpg':'',date:now-i*3e5,summary:'A sentence that is long enough to sit under the headline of the story.',more:i%3?[]:[{feedId:S.feeds[(fi+1)%4].id,title:'x',link:'https://y.test/'+i,date:now}]}))});
  if(sel==='headlines'){S.sel='digest';S.dgk='';render();await w(600);const t=[...document.querySelectorAll('.dtabs button')].find(x=>/headlines/i.test(x.textContent));if(t)t.click()}else{S.sel=sel;render()}
  await w(1500);const bad=[];
  for(const e of document.querySelectorAll('#grid .card *, #grid .cardh *, #grid [class*=src] *')){const cs=getComputedStyle(e);if(e.children.length||!(e.textContent||'').trim()||e.classList.contains('vh'))continue;/* .vh = screen-reader-only text ("3 hours ago"), clipped on purpose */
   const r=e.getBoundingClientRect();if(!r.width||r.bottom<0)continue;
   if(e.scrollWidth>e.clientWidth+1&&(cs.overflow!=='visible'||cs.textOverflow==='ellipsis'))bad.push((e.className||e.tagName)+':'+e.textContent.trim().slice(0,24));
   else if(cs.textOverflow==='ellipsis'&&/…$/.test(e.textContent.trim()))bad.push('ellipsis:'+e.textContent.trim())}
  return [...new Set(bad)].slice(0,6)},sel);
 ck(`[${W}] ${sel}: no source name, read time or badge is cut off`,!r.length,r.join(' | '));
 ck(`[${W}] ${sel}: no page errors`,!errs.length,errs[0]);await p.context().close()}
{const p=await (await b.newContext({viewport:{width:360,height:740}})).newPage();await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(400);
 const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const g=document.getElementById('grid');if(!g)return ['no grid'];g.innerHTML='<div class="sgc">'+['The Guardian World Edition','The New York Times','Ars Technica']
  .map(n=>'<div class="hrow"><span>'+n+'</span><b><i style="width:60%"></i></b><em>12 stories</em></div>').join('')+'</div>';await new Promise(r=>setTimeout(r,200));
  return [...g.querySelectorAll('.hrow span')].filter(e=>e.scrollWidth>e.clientWidth+1||getComputedStyle(e).textOverflow==='ellipsis').map(e=>e.textContent)});
 ck('Stats top sources: long source names wrap instead of being cut',!r.length,r.join(' | '));await p.close()}
await b.close();console.log(bad?'card_truncation '+bad+' FAILED':'card_truncation all passed');process.exit(bad?1:0)})();
