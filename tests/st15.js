const {APP}=require('./env');
const {mock,seed,PW}=require('./mock');const {chromium}=require(PW);
let pass=0,fail=0;const log=[];const ck=(n,c,x='')=>{if(c)pass++;else{fail++;log.push(`FAIL ${n} ${x}`)}};
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:1000,height:900}})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await mock(p,{n:6});await p.goto('file://'+APP);await p.waitForTimeout(1500);
const R=await p.evaluate(async()=>{
 const o={};
 const V='market people government report officials said country economic growth policy during after before several members public leader office national agency reporters statement spokesperson meeting talks deal plan budget security energy prices workers court judge law vote city state nation week month year company bank trade'.split(' ');
 const words=n=>Array.from({length:n},(_,i)=>V[(i*7+3)%V.length]).join(' ');
 const para=(n,tag)=>'<p>'+(tag||'')+words(n)+'</p>';
 const frag=h=>{const d=document.createElement('div');d.innerHTML=h;const f=document.createDocumentFragment();while(d.firstChild)f.append(d.firstChild);return f};
 // 1. heuristics
 const T=(w,end)=>words(w)+(end||'');
 o.stub=looksIncomplete(T(320),'https://news.test/a');
 o.stubDot=looksIncomplete(T(320,'.'),'https://news.test/a');
 o.signoff=looksIncomplete(T(320,'. Reporting by Jane Doe; Editing by Sam Roe'),'https://news.test/a');
 o.reutersTag=looksIncomplete(T(300,' (Reuters) - details'),'https://news.test/a');
 o.longDot=looksIncomplete(T(450,'.'),'https://news.test/a');
 o.long=looksIncomplete(T(800),'https://news.test/a');
 o.hydratedLong=looksIncomplete(T(900,'.'),'https://www.reuters.com/world/x');
 o.hydratedSub=looksIncomplete(T(900,'.'),'https://www.bloomberg.com/news/x');
 // 2. payload extraction
 const dom='<body><article><h1>Headline</h1>'+para(40)+para(40)+'</article></body>';
 const full=Array.from({length:10},(_,i)=>'Paragraph '+i+' of the whole story. '+words(60));
 const next={props:{pageProps:{article:{title:'x',paragraphs:full}}}};
 const f1=extract('<html><body><script id="__NEXT_DATA__" type="application/json">'+JSON.stringify(next)+'</script>'+dom+'</body></html>','https://news.test/n');
 o.nextLen=f1?f1.textContent.length:0;o.nextHas=f1&&/Paragraph 9 of the whole story/.test(f1.textContent);
 const arc={props:{pageProps:{content:{content_elements:full.map((t,i)=>({type:i%4===3?'header':'text',content:t}))}}}};
 const f2=extract('<html><body><script id="__NEXT_DATA__" type="application/json">'+JSON.stringify(arc)+'</script>'+dom+'</body></html>','https://news.test/n2');
 o.arcHas=f2&&/Paragraph 9 of the whole story/.test(f2.textContent);
 const html={props:{pageProps:{story:{bodyHtml:full.map(t=>'<p>'+t+'</p>').join('')}}}};
 const f3=extract('<html><body><script id="__NEXT_DATA__" type="application/json">'+JSON.stringify(html)+'</script>'+dom+'</body></html>','https://news.test/n3');
 o.htmlHas=f3&&/Paragraph 9 of the whole story/.test(f3.textContent);
 const fus=extract('<html><body><script>window.Fusion=window.Fusion||{};Fusion.globalContent='+JSON.stringify({headlines:{basic:'x'},content_elements:full.map(t=>({type:'text',content:t}))})+';Fusion.globalContentConfig={};</script>'+dom+'</body></html>','https://news.test/f');
 o.fusionHas=fus&&/Paragraph 9 of the whole story/.test(fus.textContent);
 // a page whose own markup is complete is left alone
 const fullDom='<body><article><h1>H</h1>'+Array.from({length:10},(_,i)=>para(60,'Paragraph '+i+' of the whole story. ')).join('')+'</article></body>';
 const f4=extract('<html><body><script id="__NEXT_DATA__" type="application/json">'+JSON.stringify({props:{pageProps:{note:'unrelated',items:['a','b','c']}}})+'</script>'+fullDom+'</body></html>','https://news.test/n4');
 o.leftAlone=f4&&!f4.payload&&/Paragraph 9 of the whole story/.test(f4.textContent);
 // 3. waterfall: stub page -> reader
 const of=window.fetchText,ofe=window.fetch;
 const stubPage='<html><body><article><h1>Big story</h1>'+para(150)+para(150)+'</article></body></html>';
 const longMd='# Big story\n\n'+Array.from({length:9},(_,i)=>'Reader paragraph '+i+' '+words(90)).join('\n\n');
 let jinaHits=0;
 window.fetchText=async(u,ok,lg)=>{if(/wp-json/.test(u))throw new Error('no wp');if(lg)lg.won='direct';ok&&ok(stubPage);return stubPage};
 window.fetch=async(u,opt)=>{if(/r\.jina\.ai/.test(String(u))){jinaHits++;return new Response(longMd,{status:200})}return ofe(u,opt)};
 const g1=await getFull('https://www.reuters.com/world/some-story');
 o.reutersTier=g1&&g1.tier;o.reutersLong=g1&&g1.textContent.length>3000;o.jinaHits=jinaHits;
 // a stub for an ordinary site with no better version stays, and is marked
 window.fetch=async(u,opt)=>{if(/r\.jina\.ai/.test(String(u)))return new Response('x',{status:500});return ofe(u,opt)};
 const g2=await getFull('https://news.test/short-story');
 o.keptStub=g2&&g2.textContent.length>500;o.markedIncomplete=g2&&g2.incomplete===true;
 // a full-length story from an ordinary site is accepted without calling the reader
 jinaHits=0;window.fetch=async(u,opt)=>{if(/r\.jina\.ai/.test(String(u))){jinaHits++;return new Response(longMd,{status:200})}return ofe(u,opt)};
 const fullPage='<html><body><article><h1>H</h1>'+Array.from({length:8},()=>para(90)).join('')+'</article></body></html>';
 window.fetchText=async(u,ok,lg)=>{if(/wp-json/.test(u))throw new Error('no wp');if(lg)lg.won='direct';ok&&ok(fullPage);return fullPage};
 const g3=await getFull('https://news.test/long-story');o.noJinaForFull=jinaHits===0&&g3&&g3.tier==='direct';
 window.fetchText=of;window.fetch=ofe;
 return o});
ck('a 300-word stub with no ending is incomplete',R.stub===true);ck('a plain full stop alone does not rescue a short stub',R.stubDot===true);
ck('a reporter sign-off marks it complete',R.signoff===false);ck('a wire dateline tag marks it complete',R.reutersTag===false);
ck('a long story ending on a full stop is complete',R.longDot===false);ck('800 words is complete',R.long===false);
ck('reuters.com is always sent deeper',R.hydratedLong===true);ck('bloomberg.com is always sent deeper',R.hydratedSub===true);
ck('Next.js payload paragraphs beat a 2-paragraph page',R.nextHas===true,String(R.nextLen));
ck('Arc-style content blocks read from the payload',R.arcHas===true);ck('HTML body string in the payload is read',R.htmlHas===true);
ck('Fusion globalContent is read',R.fusionHas===true);ck('a complete page is left alone',R.leftAlone===true);
ck('a stub on reuters.com is replaced by the reader’s full text',R.reutersLong===true&&R.reutersTier==='reader'&&R.jinaHits>=1,JSON.stringify([R.reutersTier,R.reutersLong,R.jinaHits]));
ck('if the reader fails, the stub is kept and marked',R.keptStub===true&&R.markedIncomplete===true);
ck('a full story from an ordinary site never calls the reader',R.noJinaForFull===true);
// mirror upgrade for a marked stub (Tier 4)
const M=await p.evaluate(async()=>{
 const words=n=>Array.from({length:n},(_,i)=>'The Senate budget bill debate '+(i%50)).join(' ');
 const gnx='<?xml version="1.0"?><rss><channel><title>g</title><item><title>Senate passes the budget bill after long debate - AP</title><link>https://apnews.com/article/senate-budget</link><pubDate>'+new Date().toUTCString()+'</pubDate></item></channel></rss>';
 const og=window.getFull,of=window.fetchText;
 window.fetchText=async(u,ok)=>gnx;
 window.getFull=async u=>{const d=document.createElement('div');d.innerHTML='<p>'+words(300)+'</p>';const f=document.createDocumentFragment();while(d.firstChild)f.append(d.firstChild);return f};
 const m=await mirrorFor({title:'Senate passes the budget bill after long debate',link:'https://www.reuters.com/world/senate',summary:'The Senate'});
 window.getFull=og;window.fetchText=of;return {u:m&&m.u,tier:m&&m.n.tier}});
ck('the wire-mirror tier still finds a longer copy',/apnews\.com/.test(M.u||'')&&M.tier==='mirror',JSON.stringify(M));
ck('no page errors',errs.length===0,errs.join('|'));
console.log(pass+' passed, '+fail+' failed');log.forEach(l=>console.log(l));await b.close()})()
