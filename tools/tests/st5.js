const {mock,seed,PW}=require('./mock');const {chromium}=require(PW);
let pass=0,fail=0;const log=[];const ck=(n,c,x='')=>{if(c)pass++;else{fail++;log.push(`FAIL ${n} ${x}`)}};
(async()=>{const b=await chromium.launch();
for(const [vp,w,h,touch] of [['phone',380,820,true],['desktop',1280,900,false]]){
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:touch});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await mock(p,{n:6});
 await p.addInitScript(s=>{try{if(!localStorage.getItem('folio'))localStorage.setItem('folio',JSON.stringify(s))}catch(e){}},seed(['Alpha']));
 await p.goto('file:///mnt/user-data/outputs/cypress.html');await p.waitForTimeout(1500);
 const E=(f,a)=>p.evaluate(f,a);
 ck(vp+' catalog size',await E(()=>CAT.reduce((n,c)=>n+c.f.length,0))>=300);
 ck(vp+' categories',await E(()=>CAT.length)>=20);
 const q=async t=>E(t=>catSearch(t).map(x=>x.n),t);
 ck(vp+' name',(await q('verge'))[0]==='The Verge',JSON.stringify(await q('verge')));
 ck(vp+' alias hn',(await q('hn'))[0]==='Hacker News');
 ck(vp+' alias nyt',(await q('nyt')).some(n=>/NYT/.test(n)),JSON.stringify(await q('nyt')));
 ck(vp+' partial word',(await q('rock pap'))[0]==='Rock Paper Shotgun',JSON.stringify(await q('rock pap')));
 ck(vp+' domain',(await q('arstechnica'))[0]==='Ars Technica');
 ck(vp+' typo-safe accent',(await q('bon appetit')).includes('Bon Appétit'));
 ck(vp+' multi-word',(await q('npr politics'))[0]==='NPR Politics',JSON.stringify(await q('npr politics')));
 ck(vp+' no match empty',(await q('zzzqqq')).length===0);
 // dialog UI
 await E(()=>{document.querySelector('#add').click()});await p.waitForTimeout(200);
 await p.fill('#u','verg');await p.waitForTimeout(150);
 ck(vp+' popup lists suggestion',await E(()=>/The Verge/.test(document.querySelector('#pop').textContent)));
 await p.fill('#u','');await p.waitForTimeout(100);
 ck(vp+' chips shown when empty',await E(()=>!!document.querySelector('#pop .chips')));
 // already added
 await E(()=>{S.feeds.push({id:'zz',url:'https://www.theverge.com/rss/index.xml',title:'The Verge',folder:S.folders[0]?.id});save()});
 await p.fill('#u','verge');await p.waitForTimeout(150);
 ck(vp+' shows Added',await E(()=>/Added/.test(document.querySelector('#pop').textContent)));
 // live check: mock findFeed
 await E(()=>{window.__ff=findFeed;findFeed=async u=>{if(/goodblog/.test(u))return{url:'https://goodblog.com/feed',xml:'<rss><channel><title>Good Blog</title><item><title>x</title><link>https://goodblog.com/1</link></item></channel></rss>'};throw new Error('no')}});
 await p.fill('#u','goodblog');await p.waitForTimeout(2200);
 ck(vp+' live suggestion',await E(()=>/Good Blog/.test(document.querySelector('#pop').textContent)),await E(()=>document.querySelector('#pop').textContent));
 await p.fill('#u','qwertyuiop');await p.waitForTimeout(2200);
 ck(vp+' live none',await E(()=>/Nothing found/.test(document.querySelector('#pop').textContent)),await E(()=>document.querySelector('#pop').textContent));
 // unverified add path
 await E(()=>{findFeed=async u=>({url:u,xml:'<rss><channel><title>T</title></channel></rss>'})});
 const n0=await E(()=>S.feeds.length);
 await p.fill('#u','hacker news');await p.waitForTimeout(150);
 await p.click('#pop [data-add]');await p.waitForTimeout(800);
 ck(vp+' verified-add adds',await E(()=>S.feeds.length)===n0+1);
 // packs + local
 await E(()=>{S.feeds=S.feeds.filter(f=>f.id!=='zz');save();document.querySelector('#add').click()});
 await p.fill('#u','');await p.waitForTimeout(100);
 await E(()=>{findFeed=async u=>({url:u,xml:'<rss><channel><title>T</title><item><title>x</title><link>https://a.test/1</link></item></channel></rss>'})});
 await p.click('[data-cat="-2"]');await p.waitForTimeout(150);
 ck(vp+' packs listed',await E(()=>document.querySelectorAll('#pop [data-pack]').length)>=6);
 const n1=await E(()=>S.feeds.length);
 await p.click('#pop [data-pack="0"]');await p.waitForTimeout(1200);
 ck(vp+' pack adds several',await E(()=>S.feeds.length)>=n1+4,await E(()=>S.feeds.length)+'');
 ck(vp+' pack folder',await E(()=>S.folders.some(f=>f.name==='Tech morning')));
 await E(()=>{navigator.geolocation.getCurrentPosition=cb=>cb({coords:{latitude:51.5,longitude:-0.12}});fetchText=async()=>JSON.stringify({address:{city:'Testville'}})});
 await E(()=>{const k=document.querySelector('#pop [data-back]');k&&k.click()});await p.waitForTimeout(150);
 await p.click('[data-cat="-3"]');await p.waitForTimeout(100);
 ck(vp+' near you prompt',await E(()=>/Use my location/.test(document.querySelector('#pop').textContent)));
 await p.click('[data-local]');await p.waitForTimeout(800);
 ck(vp+' local results',await E(()=>/Testville/.test(document.querySelector('#pop').textContent)),await E(()=>document.querySelector('#pop').textContent));
 ck(vp+' no errors',errs.length===0,errs.join('|'));
 await ctx.close();}
await b.close();log.forEach(l=>console.log(l));console.log('pass',pass,'fail',fail)})();
