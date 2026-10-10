/* Production 1.67 parity: the fixes that shipped on main are alive on the experiment branch.
   (1) story cards: a headline link plus separate Save / Why buttons (no button inside a link, no link inside a button), Save and Why work without opening the story
   (2) the version shown is the clean "1.67" label
   (3) Stats > Top sources rows carry units ("9 stories", "1 story"). Screenshots go to $OUT. */
const {APP,OUT}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 const b=await chromium.launch();
 for(const W of [412,1100]){
  const p=await (await b.newContext({viewport:{width:W,height:860},hasTouch:W<500})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:8});await p.goto('file://'+APP);await p.waitForTimeout(1300);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(300);
  const t='['+W+'] ';
  const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const o={};
   const now=Date.now();S.feeds.slice(0,3).forEach((f,fi)=>{state[f.id]='ok';items[f.id]=Array.from({length:6},(_,i)=>({feedId:f.id,title:['Harbour','Quantum','Glacier'][fi]+' '+['alpha','bravo','charlie','delta','echo','foxtrot'][i]+' parity headline '+(fi*7+i),link:'https://w.test/p/'+fi+'/'+i,date:now-(i*55+fi*9)*6e4,img:'',summary:'A plain summary for the parity check number '+i+'.'}))});
   S.sel='all';S.atab='latest';render();await w(900);
   const g=document.querySelector('#grid');
   o.cards=g.querySelectorAll('.card').length;
   o.nested=g.querySelectorAll('a button, a [role=button], button a, button [role=link]').length;
   const c=g.querySelector('.card');o.hasLink=!!c.querySelector('a[href], h3 a');o.star=!!c.querySelector('button[data-star]');o.starInLink=!!c.querySelector('a button[data-star], a [data-star]');
   const k0=Object.keys(S.saved||{}).length||(S.saved||[]).length;
   c.querySelector('[data-star]').click();await w(200);
   const k1=Object.keys(S.saved||{}).length||(S.saved||[]).length;
   o.saved=k1>k0;o.openedBySave=document.querySelector('#rd').classList.contains('on');
   const wy=g.querySelector('.card [data-why]');o.why=!!wy;if(wy){wy.click();await w(250);o.whyShown=!document.querySelector('#whyp').hidden&&document.querySelector('#whyp').textContent.length>20;o.openedByWhy=document.querySelector('#rd').classList.contains('on');document.querySelector('#whyp').hidden=true}
   /* version label */
   document.querySelector('#set').showModal();setBuild();syncSet();await w(250);const ab=document.querySelector('[data-sum="about"]');o.about=ab?ab.textContent:'';o.label=APP_LABEL;
   document.querySelector('#set').close();
   /* stats */
   const n=Date.now(),d=k=>dayKey(new Date(n-k*864e5));S.st=S.st||{d:{},src:{},tp:{},hr:Array(24).fill(0),fin:{}};S.st.d[d(0)]={m:24,n:5,f:3};S.st.src={Alpha:9,Beta:1,Gamma:2};S.st.tp={Tech:10};
   S.sel='stats';render();await w(300);o.rows=[...document.querySelectorAll('.stats .hrow')].map(x=>x.textContent.replace(/\s+/g,' ').trim());
   return o});
  ck(t+'cards render',r.cards>=3,r.cards);
  ck(t+'1.67 cards: headline link plus separate Save / Why buttons (no nesting)',r.hasLink&&r.star&&r.nested===0&&!r.starInLink,JSON.stringify(r));
  ck(t+'Save works and does not open the story',r.saved&&!r.openedBySave,JSON.stringify(r));
  ck(t+'Why works and does not open the story',r.why&&r.whyShown&&!r.openedByWhy,JSON.stringify(r));
  ck(t+'version label is the clean "1.67"',r.label==='1.67'&&/version 1\.67$/.test(r.about),r.label+' | '+r.about);
  ck(t+"Stats 'Top sources' rows carry units",r.rows.some(x=>/Alpha.*9 stories$/.test(x))&&r.rows.some(x=>/Beta.*1 story$/.test(x)),JSON.stringify(r.rows));
  await p.screenshot({path:OUT+'/parity-stats-'+W+'.png'});
  await p.evaluate(()=>{S.sel='all';render()});await p.waitForTimeout(700);await p.screenshot({path:OUT+'/parity-cards-'+W+'.png'});
  await p.evaluate(()=>{document.querySelector('#set').showModal();setBuild();syncSet()});await p.waitForTimeout(300);await p.screenshot({path:OUT+'/parity-version-'+W+'.png'});
  ck(t+'no page errors',!errs.length,errs[0]);await p.close();
 }
 await b.close();console.log(bad?'parity_167 '+bad+' FAILED':'parity_167 all passed');process.exit(bad?1:0);
})();
