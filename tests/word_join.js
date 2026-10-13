/* B60: words must not fuse where an empty or blank link/span stood between them */
const {APP}=require('./env');const {mock,seed,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{const b=await chromium.launch();const p=await (await b.newContext()).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{n:3});
 await p.addInitScript(sd=>{try{localStorage.setItem('folio',JSON.stringify(sd))}catch(e){}},seed(['Alpha']));await p.goto('file://'+APP);await p.waitForTimeout(1500);
 const tail=' since 2024 through its Idea Exchange, which now includes more than 1,000 cities across 95 countries and counting every month of the year.';
 const cases=[
  ['a blank link between two words','Bloomberg<a href="/a/b"> </a>has been testing a model'+tail,'Bloomberg has been'],
  ['a blank span between two words','The company<span> </span>said on Monday it will launch'+tail,'company said on'],
  ['an empty link with no space in the source','The company<a href="/a/b"></a>said on Monday it will launch'+tail,'company said on'],
  ['a blank link after a comma','Prices rose,<a href="/a/b"> </a>analysts said, and more'+tail,'rose, analysts'],
  ['a normal link is untouched','The <a href="/a/b">company</a> said on Monday it will launch'+tail,'company said on'],
  ['a drop cap letter is not split','<span>T</span>he company said on Monday it will launch'+tail,'The company'],
 ];
 for(const [n,para,want] of cases){
  const r=await p.evaluate(([para])=>{const body='<article>'+('<p>'+para+'</p>').repeat(6)+'</article>';const x=extract('<html><body>'+body+'</body></html>','https://example.com/a/b');return x?x.textContent.replace(/\s+/g,' '):''},[para]);
  ck(n+' -> "'+want+'"',r.includes(want),r.slice(0,80));
 }
 ck('no page errors',!errs.length,errs[0]);await b.close();console.log(bad?'FAILED '+bad:'word_join all passed');process.exit(bad?1:0)})();
