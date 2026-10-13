/* "My Feeds" in the side menu opens and closes on a touch tap (on the label or the arrow), keeps its state, and the folder arrows inside still work. Before the fix, opening it was undone at once: closing stored a flag, opening deleted it, and the menu then read a missing flag as the "collapsed" default. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x===undefined?'':x)}else console.log('ok',n)};
(async()=>{const b=await chromium.launch();
for(const [W,H] of [[360,740],[412,860],[515,900],[884,1060]]){
 const ctx=await b.newContext({viewport:{width:W,height:H},hasTouch:true,isMobile:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{n:6});
 await p.goto('file://'+APP);await p.waitForTimeout(1500);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(500);
 await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 const m=await p.$('#menu');if(m&&await m.isVisible()){const r=await m.boundingBox();await p.touchscreen.tap(r.x+r.width/2,r.y+r.height/2);await p.waitForTimeout(700)}
 const tag=W+': ';
 const box=()=>p.evaluate(()=>{const h=document.querySelector('.mfh');const r=h.getBoundingClientRect();return{x:r.left,y:r.top+r.height/2,w:r.width,exp:h.getAttribute('aria-expanded'),n:document.querySelectorAll('.mfb .fold').length}});
 let q=await box();ck(tag+'My Feeds starts collapsed',q.exp==='false'&&q.n===0,JSON.stringify(q));
 await p.touchscreen.tap(q.x+40,q.y);await p.waitForTimeout(350);q=await box();ck(tag+'tapping the label opens it and shows the folders',q.exp==='true'&&q.n>=1,JSON.stringify(q));
 await p.touchscreen.tap(q.x+40,q.y);await p.waitForTimeout(350);q=await box();ck(tag+'tapping again closes it',q.exp==='false'&&q.n===0,JSON.stringify(q));
 await p.touchscreen.tap(q.x+q.w-14,q.y);await p.waitForTimeout(350);q=await box();ck(tag+'the arrow at the right opens it too',q.exp==='true'&&q.n>=1,JSON.stringify(q));
 /* a folder inside still opens and closes with its own arrow */
 const f0=await p.evaluate(()=>{const u=document.querySelector('.mfb .chv');const r=u.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2,exp:u.getAttribute('aria-expanded')}});
 await p.touchscreen.tap(f0.x,f0.y);await p.waitForTimeout(350);
 const f1=await p.evaluate(()=>document.querySelector('.mfb .chv').getAttribute('aria-expanded'));ck(tag+'a folder arrow inside toggles ('+f0.exp+' to '+f1+')',f0.exp!==f1);
 /* the state is kept across a restart */
 await p.evaluate(()=>save());await p.reload();await p.waitForTimeout(1500);await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 const kept=await p.evaluate(()=>{side();const h=document.querySelector('.mfh');return h&&h.getAttribute('aria-expanded')});ck(tag+'the open state survives a restart',kept==='true',String(kept));
 ck(tag+'no page errors',!errs.length,errs[0]);await ctx.close()}
await b.close();console.log('feeds_drawer',bad?bad+' FAILED':'all passed');process.exit(bad?1:0)})();
