const {chromium}=require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright');
const {mock,seed}=require('/tmp/t/mock2.js');
(async()=>{const b=await chromium.launch();
for(const w of [360,390,884]){const c=await b.newContext({viewport:{width:w,height:844}});const p=await c.newPage();
await mock(p,{n:6});await p.addInitScript(s=>{try{if(!localStorage.getItem('folio'))localStorage.setItem('folio',JSON.stringify(s))}catch(e){}},seed(['Alpha','Beta']));
await p.goto('file:///mnt/user-data/outputs/cypress.html');await p.waitForTimeout(2000);
await p.evaluate(()=>{document.querySelector('#set').showModal();const r=document.getElementById('dynmrow');r.hidden=false;r.scrollIntoView({block:'center'})});await p.waitForTimeout(300);
const r=await p.evaluate(()=>{const s=document.querySelector('#dynmrow select');return {sw:s.getBoundingClientRect().width,txt:s.options[s.selectedIndex].textContent,clip:s.scrollWidth>s.clientWidth}});
console.log(w,JSON.stringify(r));if(w===360)await p.screenshot({path:'/tmp/t/dy.png'});await c.close()}
await b.close()})();
