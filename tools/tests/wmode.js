const {chromium}=require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright');
const {mock,seed}=require('/tmp/t/mock2.js');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:800},hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await mock(p,{n:6});await p.addInitScript(s=>{try{if(!localStorage.getItem('folio'))localStorage.setItem('folio',JSON.stringify(s))}catch(e){}window.__sh=[];Object.defineProperty(navigator,'share',{value:async d=>{window.__sh.push(d)},configurable:true})},seed(['Alpha']));
await p.goto('file:///tmp/t/w_app.html');await p.waitForTimeout(2200);
const r=await p.evaluate(async()=>{await doAct0('card').catch(()=>{});return null}).catch(()=>null);
const out=await p.evaluate(async()=>{const a=cur[0];curA=a;try{await doAct('card')}catch(e){return 'ERR '+e.message}await new Promise(r=>setTimeout(r,500));return window.__sh});
console.log(JSON.stringify(out).slice(0,300));console.log('errs',errs);await b.close()})();
