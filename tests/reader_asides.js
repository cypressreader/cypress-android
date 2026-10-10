/* Only the feeds sidebar is styled and slid like a sidebar. The reader's own <aside> notes ("At a glance", the end card) used to inherit its slide-away transform and sat one column to the left, showing as an empty rounded sliver at the page edge; and a tall lead picture used to jump to the second column and leave the first one half empty under the headline. */
const fs=require('fs');const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
const fx=JSON.parse(fs.readFileSync(__dirname+'/fixtures/pdf_real_feeds.json','utf8'));
(async()=>{
 const b=await chromium.launch();
 for(const [W,H] of [[900,700],[1100,800],[1440,900]]){
  const p=await (await b.newContext({viewport:{width:W,height:H}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{n:6});
  await p.route('https://img.test/**',r=>r.fulfill({status:200,contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#468"/></svg>'}));
  await p.goto('file://'+APP);await p.waitForTimeout(1300);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(300);
  const r=await p.evaluate(async fx=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const f=S.feeds[0],out=[];
   for(const rl of ['auto','top','classic','hero'])for(let k=0;k<fx.length;k+=1){const x=fx[k];S.rl=rl;S.scroll='paged';const a={feedId:f.id,title:x.title,link:'https://w.test/ra'+rl+k,date:Date.now(),summary:'x',img:k%2?'':'https://img.test/h.jpg',html:x.html,author:'Jane Doe'};items[f.id]=[a];S.sel='all';render();await w(50);openReader(a);await w(800);
    const c=document.querySelector('.cols'),cr=c.getBoundingClientRect(),H=cr.height,half=cr.left+cr.width/2;
    const strays=[...c.querySelectorAll(':scope>aside,:scope>.rfoot')].filter(e=>e.getBoundingClientRect().left<cr.left-4).length;
    const asideT=[...document.querySelectorAll('#rd aside')].filter(e=>getComputedStyle(e).transform!=='none').length;
    const im=c.querySelector(':scope>img.hero,:scope>.hsf img.hero');const hs=c.querySelector(':scope>.kick,:scope>.tt');
    /* the first column must not be left mostly empty under the headline while the picture or the text starts in the second column */
    const L=[...c.querySelectorAll(':scope>.kick,:scope>.tt,:scope>.dt,:scope>img.hero,:scope>.hsf,:scope>.mnotes,:scope>.note,.body>p,.body>h2,.body>figure')].map(e=>e.getBoundingClientRect()).filter(r=>r.width>5&&r.left+r.width/2<half&&r.top<cr.bottom);
    const lb=L.length?Math.max(...L.map(r=>Math.min(r.bottom,cr.bottom))):cr.top;
    out.push({rl,k,strays,asideT,leftVoid:Math.round((cr.bottom-lb)/H*100),np:R.np});document.querySelector('#cl')&&document.querySelector('#cl').click();await w(120)}
   return out},fx);
  const t='['+W+'] ';
  ck(t+'no reader note or end card sits outside its page ('+r.length+' stories x layouts)',r.every(x=>x.strays===0),JSON.stringify(r.filter(x=>x.strays).slice(0,3)));
  ck(t+'no <aside> in the reader inherits the sidebar slide transform',r.every(x=>x.asideT===0),JSON.stringify(r.filter(x=>x.asideT).slice(0,3)));
  const big=r.filter(x=>x.np>=3);
  ck(t+'the first column is not left more than 40% empty on the first page ('+big.filter(x=>x.leftVoid>40).length+' of '+big.length+' over)',big.filter(x=>x.leftVoid>40).length<=Math.ceil(big.length*.06),JSON.stringify(big.filter(x=>x.leftVoid>40).slice(0,4)));
  ck(t+'no page errors',!errs.length,errs[0]);await p.close();
 }
 await b.close();console.log(bad?'reader_asides '+bad+' FAILED':'reader_asides all passed');process.exit(bad?1:0);
})();
