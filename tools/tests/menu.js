const {chromium}=require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright');
const {mock,seed}=require('/tmp/t/mock2.js');
const D='/tmp/claude-0/-home-claude-cypress-android/d256d902-d0e0-5710-a009-ee1dc848c76e/scratchpad/shots/';
(async()=>{const b=await chromium.launch();
for(const [nm,w,h] of [['phone',390,800],['fold',884,800]]){
const c=await b.newContext({viewport:{width:w,height:h},hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await mock(p,{n:6});await p.addInitScript(s=>{try{if(!localStorage.getItem('folio'))localStorage.setItem('folio',JSON.stringify(s))}catch(e){}},seed(['Alpha','Beta']));
await p.goto('file:///mnt/user-data/outputs/cypress.html');await p.waitForTimeout(2200);
await p.evaluate(()=>{S.theme='dark';applyTheme(false);document.querySelector('#grid .card').click()});await p.waitForTimeout(1500);
await p.evaluate(()=>document.querySelector('#mo').click());await p.waitForTimeout(400);
const hts=await p.evaluate(()=>{const m=document.querySelector('#mn').getBoundingClientRect();return {h:Math.round(m.height),btns:[...document.querySelectorAll('#mn button')].filter(x=>x.offsetParent).length}});
console.log(nm,hts,errs);await p.screenshot({path:D+'menu-'+nm+'.png'});
// every action still works
const ok=await p.evaluate(()=>[...document.querySelectorAll('#mn [data-act]')].map(x=>x.dataset.act));console.log(ok.join(','));
await c.close()}
await b.close()})();
