const {chromium}=require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright');
const {mock,seed}=require('/tmp/t/mock2.js');
const D='/tmp/claude-0/-home-claude-cypress-android/d256d902-d0e0-5710-a009-ee1dc848c76e/scratchpad/shots/';
(async()=>{const b=await chromium.launch();
const c0=await b.newContext({viewport:{width:390,height:800}});const p0=await c0.newPage();const errs=[];p0.on('pageerror',e=>errs.push(e.message));
await mock(p0,{n:6});await p0.addInitScript(s=>{try{if(!localStorage.getItem('folio'))localStorage.setItem('folio',JSON.stringify(s))}catch(e){}},seed(['Alpha','Beta']));
await p0.goto('file:///mnt/user-data/outputs/cypress.html');await p0.waitForTimeout(2200);
const urls=await p0.evaluate(async()=>{const a=cur[0];a.summary='Two men have been charged over an alleged plot, police said on Friday. Prosecutors say the case will be heard next month and that more details will follow as the investigation continues.';a.img='https://img.test/photo.jpg';
 const u=await shareUrl(a);const a2={...a,img:'',summary:'',title:'No photo story'};const u2=await shareUrl(a2);return {u,u2,len:u.length,link:a.link,title:a.title}});
console.log('url length',urls.len,urls.u.slice(0,90));console.log('app errs',errs);
for(const [nm,w,h,u] of [['phone',390,844,urls.u],['fold',884,900,urls.u],['nophoto',390,844,urls.u2]]){
 const c=await b.newContext({viewport:{width:w,height:h},userAgent:'Mozilla/5.0 (Linux; Android 14; SM-F946U) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36'});const p=await c.newPage();const pe=[];p.on('pageerror',e=>pe.push(e.message));
 // serve a fake photo
 await p.route('https://img.test/**',r=>r.fulfill({status:200,contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7a3b1e"/><stop offset="1" stop-color="#1b2a4a"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/></svg>'}));
 await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
 await p.goto('file:///home/claude/cypress-android/docs/s.html'+u.slice(u.indexOf('#')));await p.waitForTimeout(900);
 const m=await p.evaluate(()=>({h1:document.querySelector('h1')&&document.querySelector('h1').textContent,href:(document.querySelector('.btn.pri')||{}).href,small:(document.querySelector('.btn.pri small')||{}).textContent,ex:!!document.querySelector('.ex'),img:!!document.querySelector('.hero img'),dl:document.querySelector('#dl').href,plat:document.querySelector('#plat').hidden,sw:document.documentElement.scrollWidth,iw:innerWidth}));
 console.log(nm,JSON.stringify(m),pe);
 await p.screenshot({path:D+'share-'+nm+'.png',fullPage:true});await c.close()}
// bad payloads
const c=await b.newContext({viewport:{width:390,height:700}});const p=await c.newPage();
for(const h of ['zNOTVALID','pe30','p'+Buffer.from(JSON.stringify({t:'<img src=x onerror=alert(1)>',s:'x',l:'javascript:alert(1)',i:'http://a/b.png',c:'red;background:url(x)'})).toString('base64url')]){
 await p.goto('file:///home/claude/cypress-android/docs/s.html#'+h);await p.waitForTimeout(500);
 console.log('bad',h.slice(0,12),await p.evaluate(()=>({h1:(document.querySelector('h1')||{}).textContent,imgs:document.querySelectorAll('#story img').length,btn:!!document.querySelector('.btn.pri'),inj:!!document.querySelector('#story [onerror]')})));
}
await b.close()})();
