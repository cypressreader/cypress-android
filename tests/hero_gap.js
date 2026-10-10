const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
/* The hero picture never touches what sits below it: at least 20px of air in every reader layout, paged and scrolling, phone to desktop. */
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{const b=await chromium.launch();
for(const W of [412,820,1200]){const p=await (await b.newContext({viewport:{width:W,height:860}})).newPage();p.on('pageerror',e=>console.log('ERR',e.message));
await mock(p,{n:6});await p.route('https://img.test/**',r=>r.fulfill({status:200,contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#468"/></svg>'}));await p.goto('file://'+APP);await p.waitForTimeout(1300);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(300);
const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const f=S.feeds[0],out=[];
 const para=n=>`<p>${'Words for the story here, ordinary reporting text with a few more words. '.repeat(n)}</p>`;
 const opts=[...document.querySelectorAll('#rlay option')].map(o=>o.value);
 for(const sc of ['paged','vertical'])for(const rl of opts){S.scroll=sc;S.rl=rl;const a={feedId:f.id,title:'Hero margin '+rl,link:'https://w.test/hm'+sc+rl,date:Date.now(),summary:'x',img:'https://img.test/hero.jpg',html:para(10)+para(10)};items[f.id]=[a];S.sel='all';render();await w(200);openReader(a);await w(1400);
  const im=document.querySelector('#rd img.hero');if(!im){out.push({sc,rl,none:true});document.querySelector('#cl')&&document.querySelector('#cl').click();await w(200);continue}
  const R=im.getBoundingClientRect();let nx=null,gap=null;
  /* the first visible element drawn below the picture's bottom edge (overlapping horizontally) */
  const cands=[...document.querySelectorAll('#rd .cols *')].filter(e=>e!==im&&!e.contains(im)&&!im.contains(e)&&e.children.length===0&&(e.textContent||'').trim()&&e.getClientRects().length);
  let best=1e9;for(const e of cands){for(const q of e.getClientRects()){if(q.top>=R.bottom-1&&q.left<R.right&&q.right>R.left){const d=q.top-R.bottom;if(d<best){best=d;nx=e.className||e.tagName}}}}
  out.push({sc,rl,gap:best===1e9?null:Math.round(best),nx,mb:getComputedStyle(im).marginBottom,ov:R.height>0});
  document.querySelector('#cl')&&document.querySelector('#cl').click();await w(250)}
 return out});
const seen=r.filter(x=>!x.none&&x.gap!=null);ck('['+W+'] a hero shows in the layouts that have one ('+seen.length+' of '+r.length+')',seen.length>=6,JSON.stringify(r.filter(x=>x.none||x.gap==null).map(x=>[x.sc,x.rl])));ck('['+W+'] at least 20px between the picture and what is below',seen.every(x=>x.gap>=20),JSON.stringify(seen.filter(x=>x.gap<20).map(x=>[x.sc,x.rl,x.gap,x.nx])));await p.close()}
await b.close();console.log(bad?'hero_gap '+bad+' FAILED':'hero_gap all passed');process.exit(bad?1:0)})();
