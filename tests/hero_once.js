/* The article picture is never on screen twice, not even for one frame while the story loads; the body copy is the one kept. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 const b=await chromium.launch();
 for(const [W,H] of [[1100,820],[412,860]]){
  const p=await (await b.newContext({viewport:{width:W,height:H}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:10});await p.route('https://img.test/**',async r=>{await new Promise(x=>setTimeout(x,150));r.fulfill({status:200,contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#468"/></svg>'})});
  await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(300);
  const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const f=S.feeds[0];
   const para=n=>`<p>${'Words for the story here, ordinary reporting text. '.repeat(n)}</p>`;
   const out={};
   const run=async(name,a,pre)=>{items[f.id]=[a];S.sel='all';S.scroll='paged';render();await w(300);if(pre)pre();let max=0,frames=0,stop=false;const tick=()=>{const k=[...document.querySelectorAll('#rd img')].filter(i=>/Foo_Bar/.test(i.getAttribute('src')||'')&&!i.closest('.rprev')).length;if(k>max)max=k;frames++;if(!stop)requestAnimationFrame(tick)};requestAnimationFrame(tick);
    const mo=new MutationObserver(()=>{const k=[...document.querySelectorAll('#rd img')].filter(i=>/Foo_Bar/.test(i.getAttribute('src')||'')).length;if(k>max)max=k});mo.observe(document.body,{subtree:true,childList:true});
    openReader(a);await w(2800);stop=true;mo.disconnect();
    out[name]={max,frames,hero:!!document.querySelector('.cols>img.hero'),heroAny:!!document.querySelector('#rd img.hero'),inBody:!!document.querySelector('.cols .body img[src*="Foo_Bar"]'),total:[...document.querySelectorAll('#rd img')].filter(i=>i.getBoundingClientRect().width>20&&!i.closest('.rprev')).length};document.querySelector('#cl')&&document.querySelector('#cl').click();await w(300)};
   const heroU='https://img.test/a/Foo_Bar_0004.jpg?crop=1',bodyU='https://img.test/b/Foo_Bar_0004-1024x683.jpg';
   await run('feedcopy',{feedId:f.id,title:'Hero A',link:'https://w.test/ha',date:Date.now(),summary:'x',img:heroU,html:`<figure><img src="${bodyU}"></figure>${para(40)}${para(40)}`});
   const L='https://w.test/hb';await run('cached',{feedId:f.id,title:'Hero B',link:L,date:Date.now(),summary:'x',img:heroU,html:`<figure><img src="${bodyU}"></figure>${para(40)}`},()=>{acPut(L,`<figure><img src="${bodyU}"></figure>${para(60)}${para(60)}`)});
   await run('nopic',{feedId:f.id,title:'Hero C',link:'https://w.test/hc',date:Date.now(),summary:'x',img:heroU,html:`${para(40)}${para(40)}`});
   return out});
  const t='['+W+'] ';
  for(const k of ['feedcopy','cached']){const o=r[k];ck(t+k+': never two copies on screen (any frame)',o.max<=1,JSON.stringify(o));ck(t+k+': body copy is kept, top copy dropped',o.inBody&&!o.heroAny&&o.total===1,JSON.stringify(o))}
  ck(t+'story without the picture in its text keeps the top picture',r.nopic.total===1&&r.nopic.heroAny,JSON.stringify(r.nopic));
  ck(t+'no page errors',!errs.length,errs[0]);await p.close();
 }
 await b.close();console.log(bad?'hero_once '+bad+' FAILED':'hero_once all passed');process.exit(bad?1:0);
})();
