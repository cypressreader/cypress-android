const {chromium}=require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright');
const {mock,seed}=require('/tmp/t/mock2.js');
const D='/tmp/claude-0/-home-claude-cypress-android-d256d902-d0e0-5710-a009-ee1dc848c76e/scratchpad/shots/'.replace('android-d256','android/d256');
(async()=>{const b=await chromium.launch();
for(const [nm,w,h] of [['phone',360,800],['fold',884,900]]){
const c=await b.newContext({viewport:{width:w,height:h}});const p=await c.newPage();
await mock(p,{n:6});await p.addInitScript(s=>{try{if(!localStorage.getItem('folio'))localStorage.setItem('folio',JSON.stringify(s))}catch(e){}},seed(['Alpha','Beta']));
await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
await p.goto('file:///mnt/user-data/outputs/cypress.html');await p.waitForTimeout(2000);
await p.evaluate(()=>{document.querySelector('#set').showModal();document.querySelector('#s-read h3').click();document.querySelectorAll('#fgrid details').forEach(d=>d.open=true)});await p.waitForTimeout(300);
const r=await p.evaluate(()=>{const bad=[];document.querySelectorAll('#fgrid .fgrid button').forEach(b=>{for(const e of b.querySelectorAll('span,small')){if(e.scrollWidth>e.clientWidth+1||e.getBoundingClientRect().height>40)bad.push(b.dataset.fn+':'+e.textContent+' '+e.scrollWidth+'/'+e.clientWidth)}const bb=b.getBoundingClientRect();});const bt=[...document.querySelectorAll('#fgrid .fgrid button')].map(b=>b.getBoundingClientRect().height);const cols=getComputedStyle(document.querySelector('#fgrid .fgrid')).gridTemplateColumns;return {bad,minh:Math.min(...bt),maxh:Math.max(...bt),cols}});
console.log(nm,JSON.stringify(r));
await p.evaluate(()=>document.querySelector('#fgrid details:nth-of-type(3)').scrollIntoView({block:'start'}));await p.screenshot({path:'/tmp/t/fg-'+nm+'.png'});await c.close()}
await b.close()})();
