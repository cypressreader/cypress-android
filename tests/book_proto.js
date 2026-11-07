/* Books prototype (phase 0): import a real public-domain EPUB (Standard Ebooks, CC0), open a chapter through the reader's fast path, turn pages, flow to the next chapter, and make sure nothing touches the network. BIG=/path/to/big.epub also times a very large book. */
const {APP,OUT}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);const path=require('path');
let bad=0;const ck=(nm,ok,x)=>{if(!ok){bad++;console.log('FAIL',nm,x||'')}else console.log('ok',nm,x||'')};
const FX=path.resolve(__dirname,'fixtures/pride-and-prejudice.epub');
(async()=>{const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:390,height:800},hasTouch:true,isMobile:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{n:3});
 const net=[];p.on('request',r=>{const u=r.url();if(/^book:|w\.test|^https?:/.test(u)&&/book/.test(u))net.push(u)});
 await p.goto('file://'+APP);await p.waitForTimeout(1500);await p.click('text=Get started').catch(()=>{});
 await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());S.booksBeta=true;S.scroll="pages";S.sel='books';side();render()});await p.waitForTimeout(400);
 ck('the Books row shows in the side panel once the beta switch is on',await p.evaluate(()=>!!document.querySelector('aside [data-sel="books"]')));
 ck('an empty shelf offers "Open a book file"',await p.evaluate(()=>!!document.querySelector('#grid [data-bkadd]')));
 const [fc]=await Promise.all([p.waitForEvent('filechooser'),p.evaluate(()=>document.querySelector('#grid [data-bkadd]').click())]);
 await fc.setFiles(FX);
 await p.waitForFunction(()=>document.querySelector('#grid .rki h2'),null,{timeout:60000});
 const bk=await p.evaluate(async()=>{const l=await bkAll();const b=l[0];return {t:b.title,a:b.author,n:b.ch.length,w:b.words,ms:b.ms,max:Math.max(...b.ch.map(c=>c.w)),c1:b.ch.findIndex(c=>/^(Chapter )?(1|I|One)$/i.test(c.t)),titles:b.ch.slice(0,8).map(c=>c.t),cover:b.cover,side:!!document.querySelector('aside [data-sel="books"]')}});
 ck('the book imports with its title, author and chapters',/Pride and Prejudice/.test(bk.t)&&/Austen/.test(bk.a)&&bk.n>=60,JSON.stringify(bk));
 ck('import time (ms)',bk.ms<15000,bk.ms+' ms for '+bk.w+' words');
 ck('the cover picture is kept',!!bk.cover);
 const ci=bk.c1>=0?bk.c1:3;
 await p.evaluate(i=>document.querySelector('#grid [data-bkch="'+i+'"]:not(.go)').click(),ci);
 await p.waitForFunction(()=>R.ready&&curA&&curA.book,null,{timeout:20000});await p.waitForTimeout(900);
 const r=await p.evaluate(()=>{const bd=document.querySelector('.cols .body');return {txt:bd.textContent.slice(0,400),np:R.np,hero:!!document.querySelector('.cols img.hero'),why:!!document.querySelector('.cols .whyit'),lang:bd.lang,ttl:(document.querySelector('.cols .tt')||{}).textContent||'',scr:bd.querySelectorAll('script,style,[onclick]').length}});
 ck('chapter 1 opens on the page from the device, with no hero or publisher box',/truth universally acknowledged/.test(r.txt)&&!r.hero&&!r.why&&r.np>1,JSON.stringify({np:r.np,lang:r.lang,ttl:r.ttl.slice(0,60)}));
 ck('the book cleaner leaves no scripts, styles or handlers',r.scr===0);
 /* page-turn smoothness: worst frame gap during three turns (the turn itself is locked at 1280 ms and isn't retuned) */
 const jank=await p.evaluate(async()=>{let last=performance.now(),worst=0,run=true;const f=t=>{worst=Math.max(worst,t-last);last=t;if(run)requestAnimationFrame(f)};requestAnimationFrame(f);
  for(let i=0;i<3;i++){document.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));await new Promise(r=>setTimeout(r,1500))}run=false;return {worst:Math.round(worst),pg:R.pg}});
 ck('three page turns move on, worst frame gap (ms)',jank.pg>=2,JSON.stringify(jank));
 const n0=await p.evaluate(()=>curA.n);
 await p.evaluate(()=>advanceNext());await p.waitForFunction(n=>R.ready&&curA&&curA.n===n+1,n0,{timeout:20000}).catch(()=>{});
 const nx=await p.evaluate(()=>({n:curA.n,t:curA.title,txt:document.querySelector('.cols .body').textContent.length,pos:S.bkpos[curA.book]}));
 ck('the next chapter follows the last page, from the device',nx.n===n0+1&&nx.txt>500&&nx.pos===nx.n,JSON.stringify(nx));
 ck('nothing about the book went to the network',!net.length,net.slice(0,3).join(' '));
 ck('no page errors',!errs.length,errs.slice(0,3).join(' | '));
 await p.screenshot({path:OUT+'/book_chapter.png'});
 if(process.env.BIG){
  const [fc2]=await Promise.all([p.waitForEvent('filechooser'),p.evaluate(()=>{const c=document.getElementById("cl");if(c)c.click();S.sel='books';S.bkv='';render();setTimeout(()=>document.querySelector('#grid [data-bkadd]').click(),300)})]);
  await fc2.setFiles(process.env.BIG);await p.waitForFunction(()=>document.querySelector('#grid .rki h2')&&S.bkv&&!/Pride/.test(document.querySelector('#grid .rki h2').textContent),null,{timeout:180000});
  const g=await p.evaluate(async()=>{const b=(await bkAll()).find(x=>x.id===S.bkv);return {t:b.title,n:b.ch.length,w:b.words,ms:b.ms,max:Math.max(...b.ch.map(c=>c.w))}});
  console.log('BIG',JSON.stringify(g));
const i=await p.evaluate(async()=>{const b=(await bkAll()).find(x=>x.id===S.bkv);return b.ch.reduce((m,c,i,a)=>c.w>a[m].w?i:m,0)});
  const t0=Date.now();await p.evaluate(i=>bkOpen(document.querySelector('#grid')._bk,i),i);await p.waitForFunction(()=>R.ready,null,{timeout:30000});
  const o=await p.evaluate(()=>({np:R.np,w:curA&&curA.title}));console.log('BIG longest chapter open',Date.now()-t0,'ms',JSON.stringify(o));
 }
 await b.close();console.log(bad?bad+' FAIL':'all ok');process.exit(bad?1:0);
})();
