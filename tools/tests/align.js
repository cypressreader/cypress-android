const {chromium}=require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright');
const {mock,seed}=require('/tmp/t/mock2.js');
(async()=>{const b=await chromium.launch();
for(const w of [884,1280,720]){
const c=await b.newContext({viewport:{width:w,height:900}});const p=await c.newPage();
await mock(p,{n:8});await p.addInitScript(s=>{try{if(!localStorage.getItem('folio'))localStorage.setItem('folio',JSON.stringify(s))}catch(e){}},seed(['Alpha','Beta']));
await p.goto('file:///mnt/user-data/outputs/cypress.html');await p.waitForTimeout(2000);
await p.evaluate(()=>{S.sel='today';render()});await p.waitForTimeout(600);
console.log(w,await p.evaluate(()=>{const m=e=>{const r=e&&e.getBoundingClientRect();return r&&{t:Math.round(r.top),h:Math.round(r.height),c:Math.round(r.top+r.height/2)}};return {logo:m(document.querySelector('aside .logo')),logoTxt:m(document.querySelector('aside .logo span,aside .logo b,aside .logo .wm')),top:m(document.querySelector('.top')),h1:m(document.querySelector('.top h1'))}}));
await p.screenshot({path:`/tmp/claude-0/-home-claude-cypress-android/d256d902-d0e0-5710-a009-ee1dc848c76e/scratchpad/shots/align-${w}.png`,clip:{x:0,y:0,width:w,height:160}});
await c.close()}
await b.close()})();
