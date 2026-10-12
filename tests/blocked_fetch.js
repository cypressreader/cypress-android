/* Blocked is not slow: a bot-check reply (202) or 429 is retried after a short pause, never accepted as the page,
   and is reported as "blocked". Strict publishers (thehill.com) get the full browser header set. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x===undefined?'':x)}else console.log('ok',n)};
(async()=>{
 const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:412,height:860}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await mock(p);let hits={};
 await p.route(/^https?:\/\/(?!localhost)/,r=>{
  const u=decodeURIComponent(r.request().url());const m=u.match(/https?:\/\/(\w+)\.test\/story/);
  if(!m)return r.abort();const k=m[1];hits[k]=(hits[k]||0)+1;
  const page='<html><body><article>'+'<p>Real reporting paragraph with plenty of words.</p>'.repeat(30)+'</article></body></html>';
  if(k==='bot202')return r.fulfill({status:hits[k]<=3?202:200,contentType:'text/html',body:hits[k]<=3?'<html><body>Just a moment…</body></html>':page});
  if(k==='bot429')return r.fulfill({status:hits[k]<=3?429:200,contentType:'text/html',body:page});
  if(k==='always429')return r.fulfill({status:429,body:'no'});
  return r.abort();
 });
 await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});
 const run=(host,retry)=>p.evaluate(async([host,retry])=>{const lg=[];lg.retry=retry;let ok=false;try{const t=await fetchText('https://'+host+'.test/story',t=>/Real reporting/.test(t),lg);ok=/Real reporting/.test(t)}catch(e){}return{ok,blocked:lg.blocked,log:lg.join('|')}},[host,retry]);
 let r=await run('bot202',0);ck('a 202 bot-check page is never accepted as the story',!r.ok&&r.blocked&&/HTTP 202/.test(r.log),JSON.stringify(r));
 hits={};r=await run('bot202',2);ck('a 202 bot check is retried with a pause and then loads',r.ok&&/retrying/.test(r.log),JSON.stringify(r));
 hits={};r=await run('bot429',2);ck('a 429 is retried and then loads',r.ok,JSON.stringify(r));
 r=await run('always429',1);ck('a site that always refuses is reported as blocked, not slow',!r.ok&&r.blocked&&/HTTP 429/.test(r.log)&&!/timed out/.test(r.log),JSON.stringify(r));
 /* the site view: a blocked site ends in an honest message with a retry, never an endless "Loading site…" */
 await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const f=S.feeds[0].id;const a={feedId:f,title:'Blocked story for the site view',link:'https://always429.test/story-1',date:Date.now(),summary:'x',img:'',html:'<p>'+'Some words here. '.repeat(30)+'</p>'};items[f]=[a];state[f]='ok';S.sel='all';render();openReader(a)});
 await p.waitForTimeout(1500);
 await p.evaluate(()=>toggleWeb());
 await p.waitForFunction(()=>{const m=document.querySelector('.web .wmsg');return m&&!m.hidden},null,{timeout:40000}).catch(()=>{});
 const wv=await p.evaluate(()=>{const m=document.querySelector('.web .wmsg');return{shown:!!m&&!m.hidden,txt:m?m.textContent:'',ld:document.querySelector('.web').classList.contains('ld'),retry:!!document.querySelector('#wtry')}});
 ck('the site view ends honestly instead of hanging on Loading site',wv.shown&&!wv.ld&&wv.retry,JSON.stringify(wv));
 ck('the site view says it was blocked, not slow',/bot check/.test(wv.txt),wv.txt);
 const h=await p.evaluate(()=>({hill:hdrFor('https://thehill.com/a/b'),other:hdrFor('https://example.org/')}));
 ck('thehill.com gets browser-like headers',/Chrome/.test(h.hill['User-Agent'])&&h.hill['Sec-Fetch-Mode']==='navigate'&&!h.other['Sec-Fetch-Mode'],JSON.stringify(h));
 ck('no page errors',!errs.length,errs[0]);
 await b.close();console.log('blocked_fetch',bad?bad+' FAILED':'all passed');process.exit(bad?1:0);
})();
