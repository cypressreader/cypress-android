/* B63: the folder arrows in the Your feeds drawer expand and collapse on a touch tap, at phone widths (320 to 700), and each arrow's tappable area is at least 44 x 44 px */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x===undefined?'':x)}else console.log('ok',n)};
(async()=>{const b=await chromium.launch();
for(const [W,H] of [[320,640],[412,860],[515,900],[700,900]]){
 const ctx=await b.newContext({viewport:{width:W,height:H},hasTouch:true,isMobile:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{n:6});
 await p.goto('file://'+APP);await p.waitForTimeout(1500);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(500);
 await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 const m=await p.$('#menu');if(m&&await m.isVisible()){const r=await m.boundingBox();await p.touchscreen.tap(r.x+r.width/2,r.y+r.height/2);await p.waitForTimeout(800)}
 const n=await p.evaluate(()=>document.querySelectorAll('#side-list .chv').length);const tag=W+': ';ck(tag+'the drawer lists folders with arrows ('+n+')',n>=1);
 for(let i=0;i<n;i++){
  const q=await p.evaluate(i=>{const u=document.querySelectorAll('#side-list .chv')[i];const r=u.getBoundingClientRect();const a=getComputedStyle(u,'::after');return{x:r.left+r.width/2,y:r.top+r.height/2,aw:r.width+parseFloat(a.right||0)*-1+parseFloat(a.left||0)*-1,ah:r.height+parseFloat(a.top||0)*-1+parseFloat(a.bottom||0)*-1}},i);
  ck(tag+'arrow '+(i+1)+' has a tappable area of at least 44 x 44 ('+Math.round(q.aw)+' x '+Math.round(q.ah)+')',q.aw>=44&&q.ah>=44,JSON.stringify(q));
  /* tap 12 px off the arrow's centre, as a real finger would */
  const bef=await p.evaluate(i=>document.querySelectorAll('#side-list .chv')[i].getAttribute('aria-expanded'),i);
  await p.touchscreen.tap(q.x+8,q.y+8);await p.waitForTimeout(350);
  const aft=await p.evaluate(i=>document.querySelectorAll('#side-list .chv')[i].getAttribute('aria-expanded'),i);
  ck(tag+'tapping arrow '+(i+1)+' toggles it ('+bef+' to '+aft+')',bef!==aft);
  await p.evaluate(()=>{S.fcol={};side()});
 }
 ck(tag+'no page errors',!errs.length,errs[0]);await ctx.close()}
await b.close();console.log('feeds_drawer',bad?bad+' FAILED':'all passed');process.exit(bad?1:0)})();
