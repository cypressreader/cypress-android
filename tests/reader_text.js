/* Article text fixes: drop cap decorates (never eats) the first letter, word boundaries survive cleaning, underscore italics, "Sign Me Up!" is cleaned, duplicate hero image removed, spinner watchdog armed. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 for(const W of [412,1100]){
  const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:W,height:860}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});
  const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));
   const out={};
   const long=' '.repeat(1)+'will stop selling the product after a long dispute with regulators over the rules that govern how it can be sold, according to people familiar with the matter who asked not to be named because the talks are private.';
   const f=S.feeds[0],a={feedId:f.id,title:'Amazon to stop selling',link:'https://w.test/amz',date:Date.now(),summary:'x',img:'',html:'<p><strong>AMAZON</strong>'+long+'</p><p>Second paragraph '+'text '.repeat(40)+'</p><p>Third '+'text '.repeat(40)+'</p><p>Fourth '+'text '.repeat(40)+'</p><p>A _real italic_ phrase here, and some_snake_case stays.</p><p>NDAs<br>when we asked</p><p>Sign Me Up!</p>'};
   items[f.id]=[a];S.sel='all';render();await w(300);openReader(a);await w(1800);
   const body=document.querySelector('.cols .body');
   const dp=body.querySelector('p.dropcap'),cap=dp&&dp.querySelector('.dcap');
   out.cap=cap?cap.textContent:null;out.word=dp?dp.textContent.trim().split(' ')[0]:null;
   out.em=[...body.querySelectorAll('em')].map(e=>e.textContent);out.snake=body.textContent.includes('some_snake_case');
   out.signme=/Sign Me Up/i.test(body.textContent);
   out.plain=plainText(new DOMParser().parseFromString('<p>NDAs<br>when we asked</p>','text/html').body.firstChild);
   out.wd=!!R.wd;
   /* hero duplicate */
   const hero=document.createElement('img');hero.className='hero';hero.src='https://img.test/photo-big-1024x683.jpg';const sheet=document.querySelector('#sheet');
   body.prepend(Object.assign(document.createElement('img'),{src:'https://img.test/photo-big.jpg'}));curA.img='https://img.test/photo-big-1024x683.jpg';body.parentNode.insertBefore(hero,body);heroOnce();
   /* the body copy is kept and the separate top copy is set aside, so the picture shows once */
   out.dupGone=![...document.querySelectorAll('.cols>img.hero')].length&&[...body.querySelectorAll('img')].some(i=>/photo-big\.jpg/.test(i.src));
   return out});
  ck(W+' drop cap is just the first letter',r.cap==='A',JSON.stringify(r));
  ck(W+' the word is not eaten',r.word==='AMAZON'||/^AMAZON/.test(r.word||''),JSON.stringify(r));
  ck(W+' underscore italics become emphasis',r.em.includes('real italic')&&r.snake,JSON.stringify(r));
  ck(W+' word boundary kept at a line break',r.plain==='NDAs when we asked',r.plain);
  ck(W+' Sign Me Up is cleaned',!r.signme);
  ck(W+' spinner watchdog armed',r.wd);ck(W+' duplicate hero removed',r.dupGone);
  ck(W+' no page errors',!errs.length,errs[0]);await b.close();
 }
 console.log('reader_text',bad?bad+' FAILED':'all passed');process.exit(bad?1:0);
})();
