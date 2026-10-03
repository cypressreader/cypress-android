const {chromium}=require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright');
const {mock,seed}=require('/tmp/t/mock2.js');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:800}});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await mock(p,{n:6});await p.addInitScript(s=>{try{if(!localStorage.getItem('folio'))localStorage.setItem('folio',JSON.stringify(s))}catch(e){}},seed(['Alpha','Beta']));
await p.addInitScript(()=>{window.__sh=[];navigator.share=async d=>{window.__sh.push(d)};});
await p.goto('file:///mnt/user-data/outputs/cypress.html');await p.waitForTimeout(2200);
for(const choice of ['1','2','0']){
 await p.evaluate(()=>{window.__sh.length=0;cur[0]&&doAct});
 const r=await p.evaluate(async ch=>{curA=Object.assign({},cur[0],{img:'',summary:'Test'});const orig=askBox;let seen=null;window.askBox=askBox=async o=>{seen=o;return ch==='1'?true:ch==='2'?'alt':false};await doAct('share');await new Promise(r=>setTimeout(r,2500));askBox=orig;return {t:seen&&seen.title,ok:seen&&seen.ok,alt:seen&&seen.alt,sh:window.__sh.map(x=>({u:x.url&&x.url.slice(0,60),f:x.files&&x.files.length}))}},choice);
 console.log(choice,JSON.stringify(r));}
console.log('errs',errs);await b.close()})();
