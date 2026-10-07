const {APP}=require('./env');
const {mock,seed,PW}=require('./mock');const {chromium}=require(PW);
let pass=0,fail=0;const log=[];const ck=(n,c,x='')=>{if(c)pass++;else{fail++;log.push(`FAIL ${n} ${x}`)}};
(async()=>{const b=await chromium.launch();
{const p=await (await b.newContext({viewport:{width:1000,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await mock(p,{n:6});await p.goto('file://'+APP);await p.waitForTimeout(1500);
const R=await p.evaluate(async()=>{
 const o={};
 const V='market people government report officials said country economic growth policy during after before several members public leader office national agency reporters statement spokesperson meeting talks deal plan budget security energy prices workers court judge law vote city state nation week month year company bank trade senate'.split(' ');
 const words=n=>Array.from({length:n},(_,i)=>V[(i*7+3)%V.length]).join(' ');
 const para=n=>'<p>'+words(n)+'</p>';
 const frag=h=>{const d=document.createElement('div');d.innerHTML=h;const f=document.createDocumentFragment();while(d.firstChild)f.append(d.firstChild);return f};
 const of=window.fetchText;
 // canonical url
 o.canon=canonicalUrl('https://news.test/a/b?utm_source=x&id=7&fbclid=zz#top');
 // availability lookups
 const avail=j=>{window.fetchText=async(u,ok)=>{o.lastLookup=u;const t=JSON.stringify(j);ok&&ok(t);return t}};
 avail({archived_snapshots:{closest:{available:true,status:'200',url:'http://web.archive.org/web/20250105123456/https://news.test/story',timestamp:'20250105123456'}}});
 o.snapOk=await archiveSnapshot('https://news.test/story?utm_medium=a');o.lookupUrl=o.lastLookup;
 avail({archived_snapshots:{}});o.snapNone=await archiveSnapshot('https://news.test/story');
 avail({archived_snapshots:{closest:{available:true,status:'404',url:'http://web.archive.org/web/2025/https://news.test/story'}}});o.snap404=await archiveSnapshot('https://news.test/story');
 avail({archived_snapshots:{closest:{available:false,status:'200',url:'http://web.archive.org/web/2025/https://news.test/story'}}});o.snapUnavail=await archiveSnapshot('https://news.test/story');
 window.fetchText=async(u,ok)=>{throw new Error('HTTP 500')};o.snapErr=await archiveSnapshot('https://news.test/story');
 o.snapGoogle=await archiveSnapshot('https://news.google.com/rss/articles/abc');
 // archiveFor: saved copy read through the reader pipeline
 const a={title:'Senate budget deal reached after long talks',link:'https://news.test/story',summary:'The Senate reached a budget deal after long talks'};
 const fullPage='<html><body><article><h1>Senate budget deal reached after long talks</h1>'+para(120)+para(120)+para(120)+'</article></body></html>';
 const otherPage='<html><body><article><h1>Recipe</h1><p>'+'Flour and sugar and butter and eggs and milk and vanilla for the cake batter. '.repeat(40)+'</p></article></body></html>';
 const seen=[];let mode='full';
 window.fetchText=async(u,ok,lg)=>{seen.push(u);if(/wayback\/available/.test(u)){const t=JSON.stringify({archived_snapshots:{closest:{available:true,status:'200',url:'http://web.archive.org/web/20250105123456/https://news.test/story'}}});ok&&ok(t);return t}
  if(/web\.archive\.org\/web\/20250105123456id_\//.test(u)){if(lg)lg.won='direct';const h=mode==='full'?fullPage:mode==='other'?otherPage:'<html><body><p>tiny</p></body></html>';ok&&ok(h);return h}
  throw new Error('HTTP 404')};
 const ar=await archiveFor(a,a.link);o.arTier=ar&&ar.n.tier;o.arLong=ar&&wordsOf(ar.n)>300;o.arUsedRaw=seen.some(u=>/20250105123456id_\//.test(u));
 mode='other';o.arOther=await archiveFor(a,a.link);mode='tiny';o.arTiny=await archiveFor(a,a.link);
 // when to look further
 o.needNull=needsMore(null);o.needStub=needsMore(frag(para(250)),'https://news.test/x');o.needSigned=needsMore(frag('<p>'+words(250)+'. Reporting by Jane Doe; Editing by Sam Roe</p>'),'https://news.test/x');o.needFull=needsMore(frag(para(450)+'.'),'https://news.test/x');
 // the order of the steps
 const stub=frag(para(150));stub.incomplete=true;
 const om=window.mirrorFor,oa=window.archiveFor;let order=[];
 window.archiveFor=async()=>{order.push('archive');return {n:Object.assign(frag(para(400)),{tier:'archive'}),u:'https://web.archive.org/web/1/x'}};
 window.mirrorFor=async()=>{order.push('mirror');return {n:Object.assign(frag(para(400)),{tier:'mirror'}),u:'https://apnews.com/x'}};
 const d1=await deeperTiers(a,stub,a.link);o.d1=order.join('>')+' '+(d1.n.tier||'');
 order=[];window.archiveFor=async()=>{order.push('archive');return null};
 const d2=await deeperTiers(a,stub,a.link);o.d2=order.join('>')+' '+(d2.n.tier||'');
 order=[];window.mirrorFor=async()=>{order.push('mirror');return null};
 const d3=await deeperTiers(a,stub,a.link);o.d3=order.join('>')+' '+(d3.n===stub);
 window.mirrorFor=om;window.archiveFor=oa;window.fetchText=of;
 return o});
ck('tracking tags are dropped from the address looked up',R.canon==='https://news.test/a/b?id=7',String(R.canon));
ck('the lookup asks the Wayback availability API with the encoded address',/^https:\/\/archive\.org\/wayback\/available\?url=https%3A%2F%2Fnews\.test%2Fstory/.test(R.lookupUrl||''),String(R.lookupUrl));
ck('an available 200 snapshot is returned',/^https:\/\/web\.archive\.org\/web\/20250105123456\//.test(R.snapOk||''),String(R.snapOk));
ck('no snapshot, a 404 snapshot, an unavailable one, an error and a google link all give nothing',R.snapNone===null&&R.snap404===null&&R.snapUnavail===null&&R.snapErr===null&&R.snapGoogle===null,JSON.stringify([R.snapNone,R.snap404,R.snapUnavail,R.snapErr,R.snapGoogle]));
ck('the saved copy is read through the reader and tagged archive',R.arTier==='archive'&&R.arLong===true);
ck('the saved copy is fetched as it was saved (id_)',R.arUsedRaw===true);
ck('a saved copy of a different story is refused',R.arOther===null);ck('a tiny saved copy is refused',R.arTiny===null);
ck('null, a short stub, and nothing else, need more help',R.needNull===true&&R.needStub===true&&R.needSigned===false&&R.needFull===false,JSON.stringify([R.needNull,R.needStub,R.needSigned,R.needFull]));
ck('archive is tried first and wins',R.d1==='archive archive',R.d1);
ck('no saved copy: the wire mirror is next',R.d2==='archive>mirror mirror',R.d2);
ck('neither: the original is kept',R.d3==='archive>mirror true',R.d3);
ck('no page errors',errs.length===0,errs.join('|'));}
// the last card: neither a saved copy nor a mirror, so the feed's text with a badge and a link
{const ctx=await b.newContext({viewport:{width:884,height:1060}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{noArticles:true});
 await p.addInitScript(s=>{try{localStorage.setItem('folio',JSON.stringify(s))}catch(e){}},seed(['Alpha']));await p.goto('file://'+APP);await p.waitForTimeout(1200);
 await p.evaluate(()=>{S.sel='all';render();openReader(cur[0])});await p.waitForTimeout(8000);
 const n=await p.evaluate(()=>{const nt=document.querySelector('.cols .note');return {txt:nt?nt.innerText:'',badge:nt&&nt.querySelector('.sbadge')?nt.querySelector('.sbadge').textContent:'',link:nt&&[...nt.querySelectorAll('a')].map(a=>a.textContent+'|'+a.getAttribute('target')+'|'+a.getAttribute('href')).join(';'),body:document.querySelector('.cols .body')?document.querySelector('.cols .body').textContent.length:0}});
 ck('fallback card shows the truncated-text badge',/truncated source text/i.test(n.badge),JSON.stringify(n));
 ck('fallback card has an Open Original Story link that opens outside',/Open Original Story\|_blank\|https:\/\/alpha\.test\//.test(n.link),n.link);
 ck('the feed text is still shown',n.body>10,String(n.body));
 ck('no page errors (fallback)',errs.length===0,errs.join('|'));await ctx.close()}
console.log(pass+' passed, '+fail+' failed');log.forEach(l=>console.log(l));await b.close()})()
