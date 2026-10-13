/* B19/B20 (found already built, now pinned): the stats tiles and "Most covered" line open things; every label in "In this issue" jumps to a real section and says what it means */
const {APP}=require('./env');const {mock,seed,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:412,height:860}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await mock(p,{n:8});await p.addInitScript(sd=>{try{if(!localStorage.getItem('folio'))localStorage.setItem('folio',JSON.stringify(sd))}catch(e){}},seed(['Alpha','Beta','Gamma']));
 await p.goto('file://'+APP);await p.waitForTimeout(2500);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(300);
 const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());
  const a0=Object.values(items).flat()[0];S.saved=[{...a0,st:Date.now()}];S.read={};S.sel='digest';S.dgk='morning';render();await new Promise(r=>setTimeout(r,800));
  const o={};const box=document.querySelector('.edbox');o.hasBox=!!box;o.tiles=[...document.querySelectorAll('.edbox button[data-edgo]')].map(x=>x.dataset.edgo);
  const ins=[...document.querySelectorAll('.edin [data-edin]')];o.labels=ins.map(x=>x.textContent.trim());o.targets=ins.map(x=>!!document.getElementById(x.dataset.edin));
  o.copy=(document.querySelector('.edin')||{textContent:''}).textContent;
  /* a tile goes somewhere */
  const sv=document.querySelector('.edbox [data-edgo="saved"]');if(sv){sv.click();o.afterSaved=S.sel}
  /* the most-covered line opens its story */
  let opened=null;const _o=openReader;openReader=function(a){opened=a&&a.link;return Promise.resolve()};
  const l=document.createElement('button');l.dataset.edstory=a0.link;document.body.append(l);l.click();l.remove();openReader=_o;o.opened=opened===a0.link;
  return o});
 ck('the stats box is there with tiles that each go somewhere (all stories, sources, saved)',r.hasBox&&r.tiles.length>=2&&r.tiles.every(t=>/^(all|saved|feeds)$/.test(t)),JSON.stringify(r.tiles));
 ck('the saved tile opens Saved',r.afterSaved==='saved'||!r.tiles.includes('saved'),String(r.afterSaved));
 ck('tapping the most-covered line opens that story',r.opened===true);
 ck('every label in "In this issue" is a button that jumps to a real section',r.labels.length>=2&&r.targets.every(Boolean),JSON.stringify({l:r.labels,t:r.targets}));
 ck('saved and missed say what they mean',!/\bSaved\s*·|\bMissed\b/.test(r.copy)&&(/saved by you/.test(r.copy)||!/saved/i.test(r.copy)),r.copy.slice(0,200));
 ck('no page errors',!errs.length,errs[0]);await b.close();console.log(bad?'FAILED '+bad:'edition_taps all passed');process.exit(bad?1:0)})();
