/* Triage + e-ink: Catch me up, Send to Kindle, Calm preset, sidebar time labels. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1100,height:860}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});
 const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const now=Date.now();const o={};
  const f=S.feeds[0];
  items[f.id]=Array.from({length:12},(_,i)=>({feedId:f.id,title:'Story number '+i+' about topic '+i,link:'https://w.test/'+i,date:now-i*36e5,summary:'x',img:'',wc:690}));
  S.feeds.slice(1).forEach(x=>items[x.id]=[]);state[f.id]='ok';S.read={};
  /* sidebar */
  render();await w(500);const row=document.querySelector('.fr[data-sel="s:'+f.id+'"]');o.lbl=row&&(row.querySelector('.frm')||{}).textContent;o.lblRow=row&&row.querySelector('.frm')&&row.querySelector('u')?true:false;
  S.hideCount=true;render();await w(300);o.hidden=!document.querySelector('.fr .frm');S.hideCount=false;render();
  /* catch me up */
  S.sel='today';render();await w(800);o.btns=[...document.querySelectorAll('#grid .dexp')].map(x=>x.textContent);
  const cu=document.querySelector('[data-catchup]');cu&&cu.click();await w(1200);
  o.reader=!!document.querySelector('#rd.on');o.ctx=(R.ctx||[]).length;o.ctxMin=(R.ctx||[]).reduce((n,a)=>n+(minsOf(a)||2),0);
  closeRd&&closeRd();await w(300);
  /* kindle */
  let got=null;const sv=saveFile;saveFile=async(n,bl,x)=>{got={n,x};return true};
  S.kindle='me@kindle.com';DGL=items[f.id].slice(0,3).map(a=>a.link);
  await exportEdition({kindle:1});o.kindle=got;saveFile=sv;
  /* calm */
  document.querySelector('#tpre [data-tp="calm"]').click();await w(300);o.calm=document.documentElement.classList.contains('calm');o.font=S.font;
  document.querySelector('#tpre [data-tp="editorial"]').click();await w(300);o.calmOff=!document.documentElement.classList.contains('calm');
  return o});
 ck('sidebar row shows minutes',/min$/.test(r.lbl||''),JSON.stringify(r));ck('time label sits on the same row as the count',r.lblRow);ck('labels hidden with counts hidden',r.hidden);
 ck('Catch me up button on Today',r.btns.some(t=>/Catch me up/.test(t)),JSON.stringify(r.btns));ck('catch up opens the reader',r.reader);
 ck('catch up is about five minutes',r.ctx>=2&&r.ctx<=8&&r.ctxMin<=9,JSON.stringify(r));
 ck('Kindle send passes the address',r.kindle&&r.kindle.x&&r.kindle.x.email==='me@kindle.com',JSON.stringify(r.kindle));
 ck('Calm preset sets Atkinson + class',r.calm&&r.font==='hyper');ck('switching away clears Calm',r.calmOff);
 ck('no page errors',errs.length===0,errs.join('|'));
 await b.close();console.log(bad?'FAILED '+bad:'triage all passed');process.exit(bad?1:0);
})();
