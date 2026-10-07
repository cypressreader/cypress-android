const {APP}=require('./env');
const {mock,PW}=require('./mock');const {chromium}=require(PW);
let pass=0,fail=0;const log=[];const ck=(n,c,x='')=>{if(c)pass++;else{fail++;log.push(`FAIL ${n} ${x}`)}};
(async()=>{const b=await chromium.launch();
const p=await (await b.newContext({viewport:{width:390,height:800}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await mock(p,{n:4});await p.goto('file://'+APP);await p.waitForTimeout(1200);
const R=await p.evaluate(async()=>{
 const o={};
 const NOTICE='This website is now part of PMX Global, LLC, a subsidiary of Penske Media Corporation. By continuing to use our services, you agree to the PMC Terms of Use, including waiver and arbitration. PMC, its service providers, and third-party partners process information about you and how you use our services, including clicks and screen recordings, using first and third-party cookies, pixels, and similar technologies. Where applicable, you can opt out of certain uses of cookies via the Your Privacy Choices link in our footer. Learn more about our data practices in our Privacy Policy.';
 const PAGE404='<html><head><title>404 | The Verge</title></head><body><header><nav>Subscribe</nav></header><main><h1>404</h1><h2>Page Not Found</h2><p>That page does not exist. Try again or go back to the homepage.</p></main><footer><div><h3>Terms of Use/Your Privacy Rights</h3><p>'+NOTICE+'</p><p>Notifications Drawer</p><p>Sign in to see your notifications or create an account to join the conversation.</p><p>Opt-Out Request Honored</p><h2>Privacy Center</h2><p>When you visit our website, we store cookies on your browser to collect information. The information collected might relate to you, your preferences or your device, and is mostly used to make the site work as you expect it to.</p></footer></body></html>';
 const words=n=>Array.from({length:n},(_,i)=>['market','people','government','report','officials','country','economic','growth','policy','public','leader','national'][(i*7+3)%12]).join(' ');
 const REAL='<html><head><title>ChatGPT gets a new Intelligent UI</title></head><body><article><h1>ChatGPT gets a new Intelligent UI</h1><p>'+words(120)+'.</p><p>'+words(110)+'.</p><p>'+words(100)+'.</p></article></body></html>';
 const COOKIESTORY='<html><head><title>Google delays its cookie phase-out again</title></head><body><article><h1>Google delays its cookie phase-out again</h1><p>Google said on Tuesday it would keep third-party cookies in Chrome for another year, citing regulators. The company said users could still opt out of ad personalization. '+words(110)+'.</p><p>'+words(120)+'.</p><p>'+words(90)+'.</p></article></body></html>';
 const feedOnly=extract(PAGE404,'https://www.theverge.com/x');
 o.notice=consentish(NOTICE);o.noticeFoot=footerish(NOTICE);
 o.err=errorPage(PAGE404,feedOnly&&feedOnly.textContent);
 o.realErr=errorPage(REAL,extract(REAL,'https://x.test/a').textContent);
 o.cookieStoryConsent=consentish(extract(COOKIESTORY,'https://x.test/c').textContent);
 o.cookieStoryErr=errorPage(COOKIESTORY,extract(COOKIESTORY,'https://x.test/c').textContent);
 o.realFoot=footerish(extract(REAL,'https://x.test/a').textContent);
 o.shortError=errorPage('<title>Not found</title><h1>Not found</h1>','Not found. The page you wanted is gone. '+words(30));
 o.longStoryWithWord=errorPage('<title>Why the 404 error page became a design icon</title>','The humble 404 page is now '+words(800));
 // a route that returns the 404 page is skipped, the next route's real page is used
 const of=window.fetchText;let tries=0;
 window.fetchText=async(u,ok)=>{for(const t of [PAGE404,REAL]){tries++;if(ok(t))return t}throw new Error('Could not fetch')};
 const fr=await fromPage('https://www.theverge.com/ai/1/story',[], 'page via ');
 o.tries=tries;o.gotReal=!!(fr&&/economic/.test(fr.textContent)&&!/PMX Global/.test(fr.textContent));
 // nothing but the 404 page: no article is returned, so the reader keeps the feed text
 window.fetchText=async(u,ok)=>{for(const t of [PAGE404]){if(ok(t))return t}throw new Error('Could not fetch')};
 let only='x';try{only=await fromPage('https://www.theverge.com/ai/2/story',[], 'page via ')}catch(e){only=null}
 o.onlyBad=!only;
 window.fetchText=of;
 // a cookie story is still read normally
 window.fetchText=async(u,ok)=>{if(ok(COOKIESTORY))return COOKIESTORY;throw new Error('no')};
 const cs=await fromPage('https://x.test/cookies',[], 'page via ');o.cookieStoryKept=!!(cs&&/third-party cookies in Chrome/.test(cs.textContent));
 window.fetchText=of;
 return o});
ck('cookie notice is spotted',R.notice===true);
ck('footerish also catches it (stale saved copies are dropped)',R.noticeFoot===true);
ck('404 page is spotted',R.err===true);
ck('real article is not an error page',R.realErr===false);
ck('real article is not a footer',R.realFoot===false);
ck('a story about cookies is not a notice',R.cookieStoryConsent===false&&R.cookieStoryErr===false,JSON.stringify([R.cookieStoryConsent,R.cookieStoryErr]));
ck('short error text is spotted',R.shortError===true);
ck('long story that mentions 404 is kept',R.longStoryWithWord===false);
ck('error page skipped, next route used',R.gotReal&&R.tries===2,JSON.stringify([R.gotReal,R.tries]));
ck('only an error page gives no article',R.onlyBad);
ck('a story about cookies is still read',R.cookieStoryKept);
ck('no page errors',!errs.length,errs.join('|'));
console.log('st25',pass,'pass',fail,'fail');log.forEach(l=>console.log(l));await b.close();process.exit(fail?1:0)})();
