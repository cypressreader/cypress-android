const {APP,OUT}=require('./env');
const {mock,seed,PW}=require('./mock');const {chromium}=require(PW);
(async()=>{const b=await chromium.launch();let bad=0;const ck=(n,c)=>{if(!c){bad++;console.log('FAIL',n)}else console.log('ok',n)};
for(const [n,w,h] of [['fold',884,1000],['phone',380,820]]){
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:true,isMobile:w<500});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{n:8});
 await p.addInitScript(s=>{localStorage.setItem('folio',JSON.stringify(s))},{...seed(['A','B','C'])});await p.goto(('file://'+APP));await p.waitForTimeout(1800);
 const E=(f,a)=>p.evaluate(f,a);
 // settings accordion
 await E(()=>{document.querySelector('#gear,[data-gear],#set').click()}).catch(()=>{});
 await p.waitForTimeout(400);
 ck(n+' settings has seven pages',await E(()=>document.querySelectorAll('#setgl .sgi').length===7));
 ck(n+' search filters',await E(()=>{const i=document.querySelector('#setq,#sset,#setsrch');if(!i)return false;i.value='voice';i.dispatchEvent(new Event('input',{bubbles:true}));return !document.querySelector('#setsr').hidden&&document.querySelectorAll('#setsr .sgi').length>=1}));
 ck(n+' search clear restores',await E(()=>{const i=document.querySelector('#setq,#sset,#setsrch');i.value='';i.dispatchEvent(new Event('input',{bubbles:true}));return document.querySelector('#setsr').hidden&&!document.querySelector('#setgl').hidden}));
 await E(()=>{document.querySelector('#sheet .x,#sclose,[data-close]')&&document.querySelector('#sheet .x,#sclose,[data-close]').click()});
 ck(n+' tlay default on',await E(()=>document.documentElement.classList.contains('tlay')));
 ck(n+' tlay renders broadsheet rule',await E(()=>{S.theme='broadsheet';applyTheme(false);render();return getComputedStyle(document.querySelector('#grid .card')).borderTopStyle==='double'}));
 ck(n+' tlay off restores plain',await E(()=>{S.tlay=false;applyFx();return getComputedStyle(document.querySelector('#grid .card')).borderTopStyle!=='double'}));
 ck(n+' dynx sets --dyn',await E(async()=>{delete S.tlay;S.theme='dynamic';applyTheme(false);render();await new Promise(r=>setTimeout(r,200));return !!document.getElementById('dynbg')}));
 ck(n+' dynx off clears',await E(async()=>{S.dynx=false;applyFx();await new Promise(r=>setTimeout(r,100));return !document.getElementById('dynbg')&&!document.documentElement.classList.contains('dynx')}));
 await E(()=>{delete S.dynx;S.theme='light';applyTheme(false)});
 // list view on narrow
 await E(()=>{closeAll&&0}).catch(()=>{});
 await E(()=>{S.view='list';S.cards='narrow';save();render()});await p.waitForTimeout(300);
 ck(n+' list card grid not broken',await E(()=>{const c=document.querySelector('#grid .card');if(!c)return false;const r=c.getBoundingClientRect();return r.height<200&&r.width>150}));
 ck(n+' no why in list',await E(()=>{const y=document.querySelector('.grid.list .why');return S.sel==='today'||!y||getComputedStyle(y).display==='none'}));
 // section opener
 await E(()=>{S.sel='s:'+S.feeds[0].id;S.view='cards';save();render()});await p.waitForTimeout(300);
 ck(n+' section opener',await E(()=>!!document.querySelector('.sop,.secop,[class*=sop]')));
 // update button logic
 ck(n+' update fn exists',await E(()=>typeof nativeUpdateNow==='function'&&typeof nativeAppLine==='function'));
 // reader: timeline, captions
 await p.evaluate(async()=>{S.scroll='pages';const a=Object.values(items).flat()[0];openReader(a);await new Promise(r=>setTimeout(r,2500))});
 ck(n+' timeline fn ran',await E(()=>typeof timeline==='function'));
 ck(n+' captions fn',await E(()=>typeof captions==='function'&&CREDRE.test('Photo: John Smith/Getty Images')));
 ck(n+' progOf', await E(()=>{const a=Object.values(items).flat()[0];S.prog=S.prog||{};S.prog[a.link]={p:.5};return Math.abs(progOf(a.link)-.5)<.01}));
 ck(n+' no page errors',errs.length===0||(console.log(errs),false));
 await ctx.close()}
console.log('bad',bad);await b.close()})();
