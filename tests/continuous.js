/* Continuous reading: the end of a story shows what is next; pulling past the end (scroll mode) or turning the last page again (page mode) flows into the next story; it can be turned off. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 for(const [W,mode] of [[412,'vertical'],[1100,'paged']]){
  const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:W,height:860}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});
  const r=await p.evaluate(async(mode)=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const now=Date.now();
   S.feeds.slice(0,2).forEach((f,fi)=>{items[f.id]=Array.from({length:5},(_,i)=>({feedId:f.id,title:'Story '+fi+i+' about unique '+['a','b','c','d','e'][i],link:'https://w.test/'+fi+'/'+i,date:now-(i+fi)*36e5,summary:'x',img:'',html:'<p>'+'Body text here, a sentence that goes on. '.repeat(70)+'</p>'}));state[f.id]='ok'});
   S.feeds.slice(2).forEach(x=>items[x.id]=[]);S.scroll=mode;S.sel='all';S.atab='latest';render();await w(500);
   const first=cur[0];openReader(first);await w(1800);
   const out={first:first.link};const card=document.querySelector('.rnext');out.card=!!card;out.cardTitle=card?card.querySelector('b').textContent:'';out.nextIs=readerNext()&&readerNext().title;
   if(mode==='vertical'){const v=vView();v.scrollTop=v.scrollHeight;await w(900);for(let i=0;i<4;i++){document.dispatchEvent(new WheelEvent('wheel',{deltaY:140,bubbles:true}));await w(60)}}
   else{R.pg=R.np-1;show&&show();await w(300);go(1);out.armed=R.endArmed;await w(200);go(1)}
   await w(1800);out.after=curA&&curA.link;out.advanced=curA&&curA.link!==first.link&&curA.title===out.nextIs;
   /* off switch */
   S.cont=false;const c2=document.querySelector('.rnext');out.offHasCard=!!document.querySelector('.rnext');rdNext&&(document.querySelector('.rnext')&&document.querySelector('.rnext').remove(),rdNext());out.offNoCard=!document.querySelector('.rnext');
   return out},mode);
  ck(W+' '+mode+' end of story shows what is next',r.card&&r.cardTitle===r.nextIs,JSON.stringify(r));
  ck(W+' '+mode+' pulling past the end flows into the next story',r.advanced,JSON.stringify(r));
  if(mode==='paged')ck(W+' paged: the first extra turn only arms it',r.armed===true,JSON.stringify(r));
  ck(W+' '+mode+' can be turned off',r.offNoCard,JSON.stringify(r));
  ck(W+' '+mode+' no page errors',!errs.length,errs[0]);await b.close();
 }
 console.log('continuous',bad?bad+' FAILED':'all passed');process.exit(bad?1:0);
})();
