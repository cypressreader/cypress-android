/* "Story N of M" is a quiet position note inside the pinned section bar under the header (never a floating pill that looks tappable and does nothing); it follows the scroll. */
const {APP}=require('./env');const {mock,seed,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 const b=await chromium.launch();
 for(const W of [412,1100]){
  const p=await (await b.newContext({viewport:{width:W,height:860}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:30});await p.addInitScript(sd=>{try{if(!localStorage.getItem('folio'))localStorage.setItem('folio',JSON.stringify(sd))}catch(e){}},seed(['Alpha','Beta','Gamma','Delta']));await p.goto('file://'+APP);await p.waitForTimeout(2200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(2200);
  const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));S.sel='all';S.atab='latest';render();await w(1200);
   const m=document.querySelector('main'),out={};m.scrollTop=1400;await w(600);m.scrollTop=1500;await w(700);
   const pin=document.querySelector('#wpin'),top=document.querySelector('.top').getBoundingClientRect();
   out.pin=!!pin&&!pin.hidden;out.pos=pin?(pin.querySelector('.wpos')||{}).textContent||'':'';
   const pr=pin&&pin.getBoundingClientRect();out.pinTop=pr?Math.round(pr.top):null;out.hdrBottom=Math.round(top.bottom);
   out.floating=[...document.querySelectorAll('body *')].filter(e=>/^Story \d+ of \d+$/.test((e.textContent||'').trim())&&!e.closest('#wpin')&&e.children.length===0).length;
   out.oldPill=!!document.querySelector('#whairl');
   out.pe=pin?getComputedStyle(pin).pointerEvents:'';out.role=pin?pin.getAttribute('role')||pin.tagName:'';
   const n1=out.pos;m.scrollTop=2600;await w(800);out.pos2=(document.querySelector('#wpin .wpos')||{}).textContent||'';
   return out});
  const t='['+W+'] ';
  ck(t+'no floating "Story N of M" pill',r.floating===0&&!r.oldPill,JSON.stringify(r));
  ck(t+'the position note sits in the pinned bar directly under the header',r.pin&&/^Story \d+ of \d+$/.test(r.pos)&&Math.abs(r.pinTop-r.hdrBottom)<=2,JSON.stringify(r));
  ck(t+'it follows the scroll',/^Story \d+ of \d+$/.test(r.pos2)&&r.pos2!==r.pos,r.pos+' -> '+r.pos2);
  ck(t+'it is not a button (not tappable, not announced as one)',r.pe==='none'&&r.role==='DIV',JSON.stringify(r));
  ck(t+'no page errors',!errs.length,errs[0]);await p.close();
 }
 await b.close();console.log(bad?'story_pos '+bad+' FAILED':'story_pos all passed');process.exit(bad?1:0);
})();
