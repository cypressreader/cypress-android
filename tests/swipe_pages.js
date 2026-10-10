/* Page mode: swiping past the last page goes to the next story, swiping back on the first page goes to the previous one; swipes inside a story still turn pages; tapping to advance still works. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 const b=await chromium.launch();
 for(const [W,H] of [[1100,820],[820,1180]]){
  const p=await (await b.newContext({viewport:{width:W,height:H}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(300);
  const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const f=S.feeds[0];const now=Date.now();
   const body=i=>Array.from({length:10},(_,k)=>'<p>Story '+i+' paragraph '+k+' '+'words for the story here. '.repeat(45)+'</p>').join('');
   items[f.id]=[0,1,2,3].map(i=>({feedId:f.id,title:'Swipe story '+i+' unique'+i,link:'https://w.test/sw'+i,date:now-i*36e5,summary:'x',img:'',html:body(i)}));S.feeds.slice(1).forEach(x=>items[x.id]=[]);state[f.id]='ok';
   S.scroll='paged';S.cont=true;S.sel='all';render();await w(500);
   const o={};
   const sw=async(dx,dy)=>{const bk=document.querySelector('#rd .book');const r=bk.getBoundingClientRect(),x0=r.left+r.width/2,y0=r.top+r.height/2;const ev=(t,x,y)=>bk.dispatchEvent(new PointerEvent(t,{pointerId:7,pointerType:'touch',isPrimary:true,clientX:x,clientY:y,bubbles:true,cancelable:true}));
    ev('pointerdown',x0,y0);for(let i=1;i<=6;i++){ev('pointermove',x0+dx*i/6,y0+dy*i/6);await w(16)}ev('pointerup',x0+dx,y0+dy);await w(900)};
   openReader(items[f.id][0]);await w(2200);o.paged=!isVert();o.np=R.np;
   /* inside the story: a swipe still turns the page */
   await sw(-260,0);o.turned=R.pg>=1&&curA.link.endsWith('sw0');
   /* last page: swipe goes to the next story */
   R.pg=R.np-1;show();await w(300);await sw(-260,0);o.next=curA.link.endsWith('sw1');
   await w(1500);
   /* first page of story 1: swipe right goes back to story 0 */
   o.first=R.pg===0;await sw(260,0);o.prev=curA.link.endsWith('sw0');
   await w(1500);
   /* first story, first page: swipe right does nothing */
   await sw(260,0);o.stay=curA.link.endsWith('sw0');
   /* a short swipe at the edge does nothing */
   R.pg=R.np-1;show();await w(300);await sw(-30,0);o.short=curA.link.endsWith('sw0');
   /* tap to advance still works: turn the page twice at the end */
   go(1);await w(400);go(1);await w(1500);o.tap=curA.link.endsWith('sw1');
   return o});
  const t='['+W+'] ';
  ck(t+'reader is in page mode',r.paged&&r.np>2,JSON.stringify(r));
  ck(t+'swipe inside a story still turns the page',r.turned,JSON.stringify(r));
  ck(t+'swipe past the last page opens the next story',r.next,JSON.stringify(r));
  ck(t+'swipe back on the first page opens the previous story',r.first&&r.prev,JSON.stringify(r));
  ck(t+'nothing happens before the first story',r.stay);ck(t+'a short swipe at the edge does nothing',r.short);
  ck(t+'tapping to advance still works',r.tap,JSON.stringify(r));
  ck(t+'no page errors',!errs.length,errs[0]);await p.close();
 }
 await b.close();console.log(bad?'swipe_pages '+bad+' FAILED':'swipe_pages all passed');process.exit(bad?1:0);
})();
