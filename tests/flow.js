/* Reading flow: Saved sorts by minutes available, Gift a story card. (Card swipes are covered in deep2.) */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:412,height:860}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});
 const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const now=Date.now();const o={};
  const f=S.feeds[0];const mk=(i,wc)=>({feedId:f.id,title:'Saved story '+i,link:'https://w.test/s'+i,date:now-i*36e5,summary:'x',wc,st:now-i});
  S.saved=[mk(1,4600),mk(2,460),mk(3,1840),mk(4,690)];S.sel='saved';S.svmin=0;render();await w(500);
  o.chips=[...document.querySelectorAll('[data-svmin]')].map(x=>x.getAttribute('aria-pressed'));
  document.querySelector('[data-svmin="5"]').click();await w(500);
  o.order=[...document.querySelectorAll('#grid .card')].map(c=>(c.textContent.match(/Saved story (\d)/)||[])[1]).join('');
  o.pressed=document.querySelector('[data-svmin="5"]').getAttribute('aria-pressed');
  S.svmin=0;
  const c1=await giftCard(mk(9,900),'A sentence worth sharing with a friend, kept short enough to fit.');o.w=c1.width;o.h=c1.height;
  const c2=await giftCard(mk(9,900),'');o.ok2=c2.width===1080;
  const mn=document.createElement('div');mn.innerHTML=mnMarkup();o.menu=!!mn.querySelector('[data-act="gift"]');
  return o});
 ck('Time I have chips present with pressed state',r.chips.length===4&&r.chips[0]==='true',JSON.stringify(r));
 ck('5-minute filter puts fitting reads first',/^2/.test(r.order)&&/^24/.test(r.order),r.order);ck('selected chip pressed',r.pressed==='true');
 ck('gift card renders 1080x1350 with a quote',r.w===1080&&r.h===1350);ck('gift card renders with a headline',r.ok2);ck('menu has Gift this story',r.menu);
 ck('no page errors',errs.length===0,errs.join('|'));
 await b.close();console.log(bad?'FAILED '+bad:'flow all passed');process.exit(bad?1:0);
})();
