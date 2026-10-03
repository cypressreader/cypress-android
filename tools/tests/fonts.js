const {chromium}=require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright');
const {mock,seed}=require('/tmp/t/mock2.js');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:800}});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await mock(p,{n:6});await p.addInitScript(s=>{try{if(!localStorage.getItem('folio'))localStorage.setItem('folio',JSON.stringify(s))}catch(e){}},seed(['Alpha','Beta']));
await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
await p.goto('file:///mnt/user-data/outputs/cypress.html');await p.waitForTimeout(2200);
const r=await p.evaluate(()=>{const out=[];const keys=[...document.querySelectorAll('#fgrid [data-fn]')].map(x=>x.dataset.fn);
 const opts=[...document.querySelectorAll('#fnt option')].map(o=>o.value);
 const miss=keys.filter(k=>k!=='theme'&&!FONTS[k]);const nolink=keys.filter(k=>!FONTLINK[k]&&!['serif','sans','dys','theme'].includes(k));const nopt=keys.filter(k=>!opts.includes(k));
 for(const k of keys){S.font=k;try{applyFs()}catch(e){out.push(k+':'+e.message)}
  const ff=getComputedStyle(document.getElementById('rd')).getPropertyValue('--rf')||'';}
 return {n:keys.length,miss,nolink,nopt,out,counts:[...document.querySelectorAll('#fgrid summary')].map(x=>x.textContent)}});
console.log(JSON.stringify(r));
// click a new font button and verify persisted + link tag
const t=await p.evaluate(()=>{const bt=document.querySelector('[data-fn="jetbrains"]');bt.click();return {f:S.font,link:!!document.querySelector('link[data-f="jetbrains"]'),sel:document.getElementById('fnt').value}});
console.log(JSON.stringify(t),errs);await b.close()})();
