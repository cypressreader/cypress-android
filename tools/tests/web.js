const {chromium,devices}=require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright');
const fs=require('fs');const D='/home/claude/cypress-android/docs/';
const rss=n=>`<?xml version="1.0"?><rss version="2.0"><channel><title>Example News</title><link>https://news.example.org/</link>${[1,2,3,4,5,6].map(i=>`<item><title>Story ${i} headline here</title><link>https://news.example.org/a${i}</link><pubDate>${new Date(Date.now()-i*36e5).toUTCString()}</pubDate><description>Summary of story ${i}. It has a few sentences so that it looks real enough.</description></item>`).join('')}</channel></rss>`;
(async()=>{const b=await chromium.launch();let pass=0,fail=0;const ck=(n,c,x='')=>{console.log((c?'ok   ':'FAIL ')+n+' '+(c?'':x));c?pass++:fail++};
for(const [nm,ua,vp] of [['android-ish','Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36',{width:390,height:844}],['iphone','Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',{width:390,height:844}]]){
 const c=await b.newContext({userAgent:ua,viewport:vp,hasTouch:true,isMobile:true,serviceWorkers:'allow'});const p=await c.newPage();const errs=[],hits=[],ext=[];
 p.on('pageerror',e=>errs.push(e.message));
 await c.route(/^https:\/\/(?!cypressreader\.com)/,r=>{const u=r.request().url();ext.push(u);if(/fonts\.(googleapis|gstatic)/.test(u))return r.abort();r.fulfill({status:500,body:'no'})});
 await c.route('https://cypressreader.com/**',async r=>{const u=new URL(r.request().url());
  if(u.pathname==='/feed'){const t=u.searchParams.get('u');hits.push(t);const h=r.request().headers();if(!h['sec-fetch-site']&&!h['referer'])return r.fulfill({status:403,body:'no'});
   if(/rss/.test(t))return r.fulfill({status:200,contentType:'text/plain; charset=utf-8',body:rss()});if(/gone/.test(t))return r.fulfill({status:404,body:'x'});
   return r.fulfill({status:200,contentType:'text/plain',body:'<html><head><title>Story</title></head><body><article><h1>Article headline</h1>'+Array.from({length:10},(_,i)=>'<p>Paragraph '+i+' of the real article. '+'It carries a good amount of ordinary sentence text so that it counts as readable. '.repeat(4)+'</p>').join('')+'</article></body></html>'})}
  let f=u.pathname.replace(/^\/app\//,'');if(u.pathname==='/app/'||u.pathname==='/app')f='index.html';const fp=D+'app/'+f;
  if(u.pathname.startsWith('/app/')&&fs.existsSync(fp)){const ct=/\.js$/.test(fp)?'text/javascript':/\.png$/.test(fp)?'image/png':/\.webmanifest$/.test(fp)?'application/manifest+json':'text/html';return r.fulfill({status:200,contentType:ct,body:fs.readFileSync(fp)})}
  r.fulfill({status:404,body:'nf'})});
 await p.addInitScript(()=>{try{if(!localStorage.getItem('folio')){localStorage.setItem('folio',JSON.stringify({feeds:[{id:'f1',url:'https://news.example.org/rss',title:'Example News',folder:''}],folders:[],setup:true,onb:1,theme:'light'}))}}catch(e){}});
 await p.goto('https://cypressreader.com/app/');await p.waitForTimeout(6500);
 const st=await p.evaluate(()=>({host:location.hostname,w:typeof WEBW!=='undefined'?WEBW:null,n:typeof cur!=='undefined'?cur.length:-1,cards:document.querySelectorAll('#grid article,#grid .card,#grid [data-i]').length,native:NATIVE,sw:'serviceWorker' in navigator,man:!!document.querySelector('link[rel=manifest]'),ask:!!document.getElementById('ask'),askT:(document.querySelector('#ask h3')||{}).textContent,hint:localStorage.getItem('cyhint')}));
 console.log(nm,JSON.stringify(st),'feed hits',hits.length,'errs',errs.length?errs:'');
 ck(nm+': web fetcher active',st.w==='https://cypressreader.com/feed?u=');
 ck(nm+': feed loaded through /feed',hits.some(h=>/news\.example\.org\/rss/.test(h))&&st.n>=5,JSON.stringify([hits,st.n]));
 ck(nm+': stories drawn',st.cards>=3,st.cards);
 await p.evaluate(()=>openReader(cur[0]));await p.waitForTimeout(3500);console.log(' reader open',await p.evaluate(()=>({on:document.getElementById('rd').classList.contains('on'),txt:(document.querySelector('#rd .cols,#rd')||{}).innerText.length})));
 console.log(' HITS',JSON.stringify(hits),'PROX',JSON.stringify(ext.filter(u=>/allorigins/.test(u))));ck(nm+': public proxies only after our fetcher tried first',ext.filter(u=>/allorigins|corsproxy|codetabs|thingproxy|yacdn|rss2json/.test(u)).every(u=>hits.includes(decodeURIComponent((u.split(/[?&](?:url|quest)=/)[1]||'').split('&')[0]))),ext.filter(u=>!/fonts/.test(u)).slice(0,3).join(' '));
 ck(nm+': no page errors',errs.length===0,errs.join('|'));
 if(nm==='iphone'){ck('iphone: home screen hint shown once',st.ask&&/Home Screen/.test(st.askT||'')&&st.hint==='1',JSON.stringify(st))}
 else ck('android-ish: no home screen hint',!(st.askT||'').includes('Home Screen'));
  await p.screenshot({path:'/tmp/t/web-'+nm+'.png'});await c.close()}
console.log('pass',pass,'fail',fail);await b.close()})();
