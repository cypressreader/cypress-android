const {chromium}=require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright');
const {mock,seed}=require('/tmp/t/mock2.js');
const D='/tmp/claude-0/-home-claude-cypress-android/d256d902-d0e0-5710-a009-ee1dc848c76e/scratchpad/shots/';
(async()=>{const b=await chromium.launch();
for(const [nm,w,h,th] of [['phone',390,844,'light'],['phoned',390,844,'dark'],['fold',884,900,'light']]){
const c=await b.newContext({viewport:{width:w,height:h},hasTouch:nm!=='fold',isMobile:nm!=='fold'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await mock(p,{n:6});await p.addInitScript(s=>{try{if(!localStorage.getItem('folio'))localStorage.setItem('folio',JSON.stringify(s))}catch(e){}},seed(['Alpha','Beta']));
await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
await p.goto('file:///mnt/user-data/outputs/cypress.html');await p.waitForTimeout(2200);
await p.evaluate(t=>{S.theme=t;document.documentElement.dataset.theme=t;applyTheme&&applyTheme()},th).catch(()=>{});
await p.evaluate(()=>{document.querySelector('#set').showModal();});await p.waitForTimeout(300);
const r=await p.evaluate(async()=>{const s=document.getElementById('hfn');s.scrollIntoView({block:'center'});await new Promise(r=>setTimeout(r,200));const r0=s.getBoundingClientRect();return {x:r0.x+r0.width/2,y:r0.y+r0.height/2,vis:r0.width>0,v:s.value}});
await p.evaluate(()=>document.getElementById('hfn').click());await p.waitForTimeout(500);
const o=await p.evaluate(()=>{const d=document.getElementById('pk');return d?{open:d.open,title:d.querySelector('h3').textContent,n:d.querySelectorAll('.po').length,on:d.querySelector('.po.on span').textContent,grp:[...d.querySelectorAll('.pg')].map(x=>x.textContent),sw:d.scrollWidth,cw:d.clientWidth}:null});
console.log(nm,JSON.stringify(r),JSON.stringify(o));
await p.screenshot({path:D+'pk-'+nm+'.png'});
await p.click('#pk .po:nth-child(4)');await p.waitForTimeout(300);
console.log(' after',JSON.stringify(await p.evaluate(()=>({v:document.getElementById('hfn').value,S:S.hfont,pk:!!document.getElementById('pk')}))),errs);
// ordinary select (time)
const t=await p.evaluate(()=>{const s=document.getElementById('lhs')||document.getElementById('mast');s.scrollIntoView({block:'center'});const b=s.getBoundingClientRect();return {id:s.id,x:b.x+b.width/2,y:b.y+b.height/2,n:s.options.length}});
await p.evaluate(id=>document.getElementById(id).click(),t.id);await p.waitForTimeout(300);
console.log(' ',t.id,JSON.stringify(await p.evaluate(()=>{const d=document.getElementById('pk');return d&&{open:d.open,h:d.querySelector('h3').textContent,n:d.querySelectorAll('.po').length}})));
await p.keyboard.press('Escape');await p.waitForTimeout(200);console.log(' esc closed',await p.evaluate(()=>!document.getElementById('pk')),'set still open',await p.evaluate(()=>document.getElementById('set').open));
await c.close()}
await b.close()})();
