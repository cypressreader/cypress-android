const {APP}=require('./env');
const {mock,seed,PW}=require('./mock');const {chromium}=require(PW);
let pass=0,fail=0;const log=[];const ck=(n,c,x='')=>{if(c)pass++;else{fail++;log.push(`FAIL ${n} ${x}`)}};
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:1000,height:900}})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await mock(p,{n:6});await p.goto('file://'+APP);await p.waitForTimeout(1500);
const R=await p.evaluate(async()=>{
 const o={};const long=(n)=>'<p>'+'A real paragraph of reporting with many words in it, enough to count as story text. '.repeat(n)+'</p>';
 // 1 truncation
 const words=n=>Array.from({length:n},(_,i)=>'w'+i).join(' ');
 o.tr1=isTruncated({html:'<p>'+words(80)+'</p>'});o.tr2=isTruncated({html:'<p>'+words(400)+'</p>'});o.tr3=isTruncated({html:'<p>'+words(400)+' ...</p>'});o.tr4=isTruncated({html:'<p>'+words(400)+' Read more</p>'});o.tr5=isTruncated({html:'<p>'+words(400)+'[&#8230;]</p>'});
 // 1b json-ld body + meta
 const ldBody='Paragraph one of the full story. '.repeat(40)+'\n'+'Paragraph two of the full story. '.repeat(40);
 const page='<html><head><script type="application/ld+json">'+JSON.stringify({'@context':'https://schema.org','@type':'NewsArticle',headline:'Big News Today',author:[{'@type':'Person',name:'Jane Reporter'},{'@type':'Person',name:'Sam Writer'}],datePublished:'2026-10-05T10:00:00Z',articleBody:ldBody})+'</script></head><body><div id="app"><p>Loading…</p></div></body></html>';
 const f1=extract(page,'https://news.test/a');o.ldLen=f1?f1.textContent.length:0;o.ldMeta=f1&&f1.meta;
 // 2 overlays
 const art='<article><h1>Real headline here</h1>'+long(8)+long(8)+'</article>';
 const ovPage='<html><body><div class="cookie-consent-banner" style="position:fixed;z-index:99999"><p>We use cookies. Accept all cookies to continue.</p><button>Accept</button></div><div id="registration-modal" class="modal"><p>Create a free account to keep reading this story.</p></div><div class="gate-container"><p>Sign in to continue reading</p></div><div class="backdrop" style="position:absolute;z-index:5000"></div>'+art+'</body></html>';
 const f2=extract(ovPage,'https://news.test/b');const t2=f2?f2.textContent:'';o.ovKeep=/A real paragraph/.test(t2);o.ovGone=!/accept all cookies|Create a free account|Sign in to continue reading/i.test(t2);
 // story with a class that merely contains "modal" but holds real paragraphs must stay
 const keepPage='<html><body><div class="modal-body">'+long(8)+long(8)+'</div></body></html>';const f3=extract(keepPage,'https://news.test/c');o.modalKeep=!!f3&&/A real paragraph/.test(f3.textContent);
 // 4 tiers: route label
 const of=window.fetchText;window.fetchText=async(u,ok,lg)=>{if(lg)lg.won='direct';const h='<html><body>'+art+'</body></html>';ok&&ok(h);return h};
 const fp=await fromPage('https://news.test/d',[],'page via ');o.tierDirect=fp&&fp.tier;
 window.fetchText=async(u,ok,lg)=>{if(lg)lg.won='allorigins';const h='<html><body>'+art+'</body></html>';ok&&ok(h);return h};
 const fp2=await fromPage('https://news.test/e',[],'page via ');o.tierProxy=fp2&&fp2.tier;
 window.fetchText=of;
 // 3 mirror resolver
 const gnx=(items)=>'<?xml version="1.0"?><rss><channel><title>g</title>'+items.map(i=>'<item><title>'+i.t+'</title><link>'+i.l+'</link><pubDate>'+new Date().toUTCString()+'</pubDate></item>').join('')+'</channel></rss>';
 const og=window.getFull,orf=window.fetchText;let asked=[];
 window.fetchText=async(u,ok)=>gnx([{t:'Senate passes the budget bill after long debate - Some Blog',l:'https://someblog.test/x'},{t:'Senate passes the budget bill after long debate - AP',l:'https://apnews.com/article/senate-budget'},{t:'Senate passes the budget bill after long debate - Reuters',l:'https://www.reuters.com/world/senate-budget'}]);
 window.getFull=async u=>{asked.push(u);const d=document.createElement('div');d.innerHTML='<p>'+'The Senate passes the budget bill after a long debate over spending and the budget. '.repeat(20)+'</p>';const f=document.createDocumentFragment();while(d.firstChild)f.append(d.firstChild);return f};
 const a={title:'Senate passes the budget bill after long debate',link:'https://paywalled.test/senate',summary:'The Senate passed the budget bill'};
 const m=await mirrorFor(a);o.mirrorUrl=m&&m.u;o.mirrorTier=m&&m.n.tier;o.asked=asked.slice();
 // different story is rejected
 window.getFull=async u=>{const d=document.createElement('div');d.innerHTML='<p>'+'Completely unrelated cooking recipe with flour and sugar and butter. '.repeat(20)+'</p>';const f=document.createDocumentFragment();while(d.firstChild)f.append(d.firstChild);return f};
 o.mirrorWrong=await mirrorFor(a);
 // same host never used as its own mirror
 asked=[];window.getFull=async u=>{asked.push(u);return null};await mirrorFor({title:'Senate passes the budget bill after long debate',link:'https://apnews.com/article/original'});o.sameHostSkipped=!asked.some(u=>/apnews\.com\/article\/senate-budget/.test(u));
 window.getFull=og;window.fetchText=orf;
 // normalised state
 TIER['https://news.test/a']={tier:'proxy',meta:{headline:'Big News Today',author:'Jane Reporter',date:'2026-10-05T10:00:00Z'}};
 o.state=articleState({title:'Story title',link:'https://news.test/a',date:Date.UTC(2026,9,1)},'<p>x</p>');
 o.stateFeed=articleState({title:'Plain',link:'https://none.test/z',date:Date.UTC(2026,9,2)});
 return o});
ck('short feed text is truncated',R.tr1===true);ck('long feed text is not',R.tr2===false);
ck('ellipsis / read more / [...] endings are truncated',R.tr3&&R.tr4&&R.tr5);
ck('JSON-LD articleBody fills the story when the page has no markup',R.ldLen>2000,String(R.ldLen));
ck('JSON-LD headline, authors and date captured',R.ldMeta&&R.ldMeta.headline==='Big News Today'&&R.ldMeta.author==='Jane Reporter, Sam Writer'&&/2026-10-05/.test(R.ldMeta.date),JSON.stringify(R.ldMeta));
ck('overlay, consent, gate and backdrop text removed',R.ovGone===true);ck('the story itself kept',R.ovKeep===true);
ck('a modal-named wrapper holding real paragraphs is kept',R.modalKeep===true);
ck('direct route tagged direct',R.tierDirect==='direct',String(R.tierDirect));ck('proxy route tagged proxy',R.tierProxy==='proxy',String(R.tierProxy));
ck('mirror found on a wire host, not the blog',/apnews\.com|reuters\.com/.test(R.mirrorUrl||''),String(R.mirrorUrl));
ck('mirror tagged',R.mirrorTier==='mirror');ck('non-wire host never tried',!(R.asked||[]).some(u=>/someblog/.test(u)),JSON.stringify(R.asked));
ck('a different story is rejected as a mirror',R.mirrorWrong===null);ck('the story’s own host is never its mirror',R.sameHostSkipped===true);
ck('normalised state has the five fields',R.state&&['title','author','publishDate','contentHtml','tierResolved'].every(k=>k in R.state),JSON.stringify(R.state));
ck('state uses page meta and tier',R.state.author==='Jane Reporter'&&R.state.tierResolved==='proxy'&&/2026-10-05/.test(R.state.publishDate)&&R.state.contentHtml==='<p>x</p>',JSON.stringify(R.state));
ck('state falls back to the feed',R.stateFeed.tierResolved==='feed'&&/2026-10-02/.test(R.stateFeed.publishDate),JSON.stringify(R.stateFeed));
ck('no page errors',errs.length===0,errs.join('|'));
console.log(pass+' passed, '+fail+' failed');log.forEach(l=>console.log(l));await b.close()})()
