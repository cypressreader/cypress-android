/* Ad blindness (B6, B7): coupon, deal, sponsored and event-promo stories are never the cover story, whatever the cover style. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{console.log((ok?'ok ':'FAIL ')+n+(ok?'':' '+(x||'')));if(!ok)bad++};
const svg='<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000"><rect width="1600" height="1000" fill="#468"/><circle cx="800" cy="420" r="190" fill="#f3d9bf"/></svg>';
const PROMO=['LG Promo Codes and Coupons for October 2026','Best Prime Day deals: save up to 60% on laptops','Sponsored: the smartest way to bank in 2026','Up to $400 off: the best early Black Friday deals','TechCrunch Disrupt 2026: only 3 days left to save on tickets'];
(async()=>{const b=await chromium.launch();
for(const [W,H] of [[412,860],[1100,800]]){
 const p=await (await b.newContext({viewport:{width:W,height:H}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{n:10});
 await p.route('https://img.test/**',r=>r.fulfill({status:200,contentType:'image/svg+xml',body:svg}));
 await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(400);
 const leaks=[];
 for(const st of ['photo','magazine','gazette','type','clean','auto']){
  const r=await p.evaluate(async([st,PROMO])=>{const w=ms=>new Promise(r=>setTimeout(r,ms));document.querySelectorAll('dialog[open]').forEach(d=>d.close());const now=Date.now();
   S.feeds.slice(0,4).forEach((f,fi)=>{items[f.id]=[...PROMO.map((t,i)=>({feedId:f.id,title:t+(fi?' '+fi:''),link:'https://p.test/'+fi+'/'+i,img:'https://img.test/p'+i+'.jpg',date:now-(i+fi)*1e3,summary:'x'})),...Array.from({length:12},(_,i)=>({feedId:f.id,title:'Real story number '+i+' about the council and the budget',link:'https://x.test/'+fi+'/'+i,img:'https://img.test/'+i+'.jpg',date:now-(i+9)*3e5,summary:'x'}))]});
   S.cvs=st;S.sel='today';S.cvt={n:0,t:'photo',p:''};save();render();await w(1200);
   const h=document.querySelector('#grid .cover .cvlead h2,#grid .dcov .dcv-lead h2,#grid .cover h2');return h?h.textContent:''},[st,PROMO]);
  if(process.env.DBG)console.log(st,'->',r);
  if(!r||PROMO.some(t=>r.startsWith(t.slice(0,20))))leaks.push(st+': '+r)}
 ck(`[${W}] no ad, coupon or promo story becomes the cover story`,!leaks.length,leaks.join(' | '));
 ck(`[${W}] no page errors`,!errs.length,errs[0]);await p.context().close()}
await b.close();console.log(bad?'no_ads_cover '+bad+' FAILED':'no_ads_cover all passed');process.exit(bad?1:0)})();
