const {APP}=require('./env');
const {mock,seed,PW}=require('./mock');const {chromium}=require(PW);
let pass=0,fail=0;const log=[];const ck=(n,c,x='')=>{if(c)pass++;else{fail++;log.push(`FAIL ${n} ${x}`)}};
(async()=>{const b=await chromium.launch();
{const p=await (await b.newContext({viewport:{width:1000,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await mock(p,{n:6});await p.goto('file://'+APP);await p.waitForTimeout(1500);
const R=await p.evaluate(async()=>{
 const o={};
 const V='market people government report officials said country economic growth policy during after before several members public leader office national agency reporters statement spokesperson meeting talks deal plan budget security energy prices workers court judge law vote city state nation week month year company bank trade senate'.split(' ');
 const words=(n,o)=>Array.from({length:n},(_,i)=>V[(i*7+3+(o||0))%V.length]).join(' ');
 const para=(n,o)=>'<p>'+words(n,o)+'</p>';
 const frag=h=>{const d=document.createElement('div');d.innerHTML=h;const f=document.createDocumentFragment();while(d.firstChild)f.append(d.firstChild);return f};
 const of=window.fetchText;
 // canonical url
 o.canon=canonicalUrl('https://news.test/a/b?utm_source=x&id=7&fbclid=zz#top');
 // when to look further
 o.needNull=needsMore(null);o.needStub=needsMore(frag(para(250)),'https://news.test/x');o.needSigned=needsMore(frag('<p>'+words(250)+'. Reporting by Jane Doe; Editing by Sam Roe</p>'),'https://news.test/x');o.needFull=needsMore(frag(para(450)+'.'),'https://news.test/x');
 const a={title:'Senate budget deal reached after long talks',link:'https://news.test/story',summary:'The Senate reached a budget deal after long talks'};
 // the order of the steps
 const stub=frag(para(150));stub.incomplete=true;
 const om=window.mirrorFor;let order=[];
 window.mirrorFor=async()=>{order.push('mirror');return {n:Object.assign(frag(para(400)),{tier:'mirror'}),u:'https://apnews.com/x'}};
 const d1=await deeperTiers(a,stub,a.link);o.d1=order.join('>')+' '+(d1.n.tier||'');
 order=[];window.mirrorFor=async()=>{order.push('mirror');return null};
 const d3=await deeperTiers(a,stub,a.link);o.d3=order.join('>')+' '+(d3.n===stub);
 window.mirrorFor=om;window.fetchText=of;o.noArchive=typeof archiveFor==='undefined'&&typeof archiveSnapshot==='undefined'&&typeof archiveRead==='undefined';
 return o});
ck('tracking tags are dropped from the address looked up',R.canon==='https://news.test/a/b?id=7',String(R.canon));
ck('null, a short stub, and nothing else, need more help',R.needNull===true&&R.needStub===true&&R.needSigned===false&&R.needFull===false,JSON.stringify([R.needNull,R.needStub,R.needSigned,R.needFull]));
ck('there is no archive step: the wire mirror is tried and wins',R.noArchive===true&&R.d1==='mirror mirror',JSON.stringify([R.noArchive,R.d1]));
ck('no partner copy: the original is kept',R.d3==='mirror true',R.d3);
ck('no page errors',errs.length===0,errs.join('|'));}
// the last card: neither a saved copy nor a mirror, so the feed's text with a badge and a link
{const ctx=await b.newContext({viewport:{width:884,height:1060}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{noArticles:true});
 await p.addInitScript(s=>{try{localStorage.setItem('folio',JSON.stringify(s))}catch(e){}},seed(['Alpha']));await p.goto('file://'+APP);await p.waitForTimeout(1200);
 await p.evaluate(()=>{S.sel='all';render();openReader(cur[0])});await p.waitForTimeout(8000);
 const n=await p.evaluate(()=>{const nt=document.querySelector('.cols .note');return {txt:nt?nt.innerText:'',badge:nt&&nt.querySelector('.sbadge')?nt.querySelector('.sbadge').textContent:'',link:nt&&[...nt.querySelectorAll('a')].map(a=>a.textContent+'|'+a.getAttribute('target')+'|'+a.getAttribute('href')).join(';'),body:document.querySelector('.cols .body')?document.querySelector('.cols .body').textContent.length:0}});
 ck('fallback card shows the truncated-text badge',/truncated source text/i.test(n.badge),JSON.stringify(n));
 ck('fallback card has an Open the original story link that opens outside',/Open the original story\|_blank\|https:\/\/alpha\.test\//.test(n.link),n.link);
 ck('the feed text is still shown',n.body>10,String(n.body));
 ck('no page errors (fallback)',errs.length===0,errs.join('|'));await ctx.close()}
console.log(pass+' passed, '+fail+' failed');log.forEach(l=>console.log(l));await b.close()})()
