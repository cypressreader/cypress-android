/* "Feed text size" sits in the main list of Look and Layout, directly after "Story card size" (not buried in More Options), and its section reset restores Comfortable. */
const {APP,OUT}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 const b=await chromium.launch();
 for(const W of [412,1100]){
  const p=await (await b.newContext({viewport:{width:W,height:860}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:6});await p.goto('file://'+APP);await p.waitForTimeout(1300);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(300);
  const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const o={};
   document.querySelector('#set').showModal();setBuild();syncSet();setGo('look');await w(300);
   const pg=document.querySelector('#sp-look');const rows=[...pg.querySelectorAll('.line')].map(l=>({t:(l.querySelector('.lb')||l).firstChild.textContent.trim(),more:!!l.closest('.smore')}));
   const i=rows.findIndex(x=>x.t==='Story card size'),j=rows.findIndex(x=>x.t==='Feed text size');o.rows=rows.slice(Math.max(0,i-1),i+3);o.i=i;o.j=j;o.more=j>=0&&rows[j].more;
   const row=pg.querySelectorAll('.line')[j];o.visible=!!row&&row.getBoundingClientRect().height>0&&!row.closest('details:not([open])');
   /* reset puts it back */
   S.ts='l';tsApply();const before=document.documentElement.dataset.ts;SET_PAGES.find(x=>x.id==='look');
   const rb=pg.querySelector('[data-rst]');rb&&rb.click();await w(100);rb&&rb.click();await w(400);o.before=before;o.after=document.documentElement.dataset.ts;o.ts=S.ts;
   document.querySelector('#set').scrollTo&&0;
   return o});
  const t='['+W+'] ';
  ck(t+'Feed text size comes right after Story card size',r.i>=0&&r.j===r.i+1,JSON.stringify(r.rows));
  ck(t+'it is in the main list, not under More Options',r.j>=0&&!r.more&&r.visible,JSON.stringify(r));
  ck(t+'the section reset puts it back to Comfortable',r.before==='l'&&r.after==='m'&&r.ts===undefined,JSON.stringify([r.before,r.after,r.ts]));
  ck(t+'no page errors',!errs.length,errs[0]);await p.close();
 }
 await b.close();console.log(bad?'feed_text_row '+bad+' FAILED':'feed_text_row all passed');process.exit(bad?1:0);
})();
