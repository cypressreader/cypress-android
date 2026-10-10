/* The loading logo tracks the wait you can feel (the feeds being fetched), not the deliberately slow background read-ahead of stories, so a quick refresh fills quickly. */
const {APP}=require('./env');const {mock,seed,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:1100,height:820}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await mock(p,{n:14});await p.addInitScript(sd=>{try{if(!localStorage.getItem('folio'))localStorage.setItem('folio',JSON.stringify(sd))}catch(e){}},seed(['Alpha','Beta','Gamma','Delta']));await p.goto('file://'+APP);await p.waitForTimeout(1500);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(400);
 const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));
  try{Object.defineProperty(navigator,'connection',{value:{type:'wifi',effectiveType:'4g',saveData:false},configurable:true})}catch(e){}
  /* a big read-ahead (every story) is allowed, as on Wi-Fi with the setting on */
  S.pfm='all';const o={};const t0=performance.now();document.querySelector('#ref').click();await w(900);prefetch(Object.values(items).flat().slice(0,14),true);
  let done=null,maxQ=0,lpSeen=false,p100=null,gone=null;
  for(let i=0;i<700;i++){await w(100);const b=document.body;maxQ=Math.max(maxQ,PF.q.length+PF.run);if(b.classList.contains('lp'))lpSeen=true;
   const pv=parseFloat((document.querySelector('#tlp')||document.querySelector('aside .logo .lgm')).style.getPropertyValue('--p'))||0;if(pv>=100&&p100===null)p100=Math.round(performance.now()-t0);
   if(b.classList.contains('lpd')&&done===null)done=Math.round(performance.now()-t0);
   if(lpSeen&&!b.classList.contains('lp')&&(PF.q.length+PF.run>0||i>40)){gone=Math.round(performance.now()-t0);break}}
  o.gone=gone;
  o.lpSeen=lpSeen;o.done=done;o.p100=p100;o.maxQ=maxQ;o.stillReading=PF.q.length+PF.run;o.feedsDone=Object.values(state).filter(v=>v==='ok'||v==='err').length;o.feeds=S.feeds.length;return o});
 console.log('refresh logo: full after',r.p100,'ms, finished and hidden after',r.gone,'ms; background read-ahead peak',r.maxQ,'stories, still in flight now',r.stillReading);
 ck('the logo showed progress during the refresh',r.lpSeen,JSON.stringify(r));
 ck('it filled completely within 1.8 seconds of a quick refresh (it used to wait on the read-ahead: ~2.4 s here, minutes on a real phone)',r.p100!==null&&r.p100<1800,JSON.stringify(r));
 ck('and was finished and hidden within 8 seconds, although the background read-ahead was still going ('+r.maxQ+' stories queued)',r.gone!==null&&r.gone<8000,JSON.stringify(r));

 ck('no page errors',!errs.length,errs[0]);
 await b.close();console.log(bad?'refresh_ind '+bad+' FAILED':'refresh_ind all passed');process.exit(bad?1:0);
})();
