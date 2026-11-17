/* the running line under the page (site · title · page) never sits under the position line and its section ticks (David 2026-11-17, Fold) */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x===undefined?'':x)}else console.log('ok',n)};
(async()=>{const b=await chromium.launch();
 for(const [w,h] of [[412,860],[770,700],[884,1032],[1280,800]]){
  const p=await (await b.newContext({viewport:{width:w,height:h}})).newPage();
  await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(400);
  const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const now=Date.now();
   S.feeds.slice(0,1).forEach(f=>{items[f.id]=[{feedId:f.id,title:'Iran claims another attack targeting U.S. radar site in Bahrain',link:'https://w.test/a',date:now,summary:'A summary.',img:'',html:Array.from({length:30},(_,k)=>'<h2>Part '+k+'</h2><p>Paragraph '+k+' of a long article. '+'Words to fill the line and make the page long enough. '.repeat(5)+'</p>').join('')}];state[f.id]='ok'});
   S.scroll='page';S.sel='all';render();await w(500);openReader(cur[0]);await w(2500);
   const bk=document.querySelector('#rd .book[data-folio]'),d=$('#dial');if(!bk)return {nofolio:1};
   const br=bk.getBoundingClientRect(),cs=getComputedStyle(bk,'::after'),fb=br.bottom-parseFloat(cs.bottom),ft=fb-parseFloat(cs.lineHeight==='normal'?parseFloat(cs.fontSize)*1.25:cs.lineHeight),dr=d.getBoundingClientRect(),tk=[...d.querySelectorAll('b')].map(x=>x.getBoundingClientRect());
   const line=d.getBoundingClientRect(),ttop=tk.length?Math.min(...tk.map(x=>x.top)):line.top+line.height/2-1.5;
   return {ft,fb,ttop,dial:[dr.top,dr.bottom],ticks:tk.length,vh:innerHeight}});
  ck(w+'x'+h+': the running line ends above the ticks and the line',r.nofolio||r.fb<=r.ttop-2,JSON.stringify(r));
  await p.close()}
 await b.close();console.log(bad?'FAILED '+bad:'folio_dial all passed');process.exit(bad?1:0)})();
