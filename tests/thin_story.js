/* A page that answers with almost nothing must not count as an answer (David's screenshot, 2026-11-26: the whole
   Riemann story in the edition was a photo caption plus the "listen to this article" notice, and the pull quote then
   quoted the notice). Science News gates its body, so a relay fetching without a sign-in gets the page WITHOUT the
   article but WITH the caption and the notice. The app used to treat that as the story: any answer from the page
   cancelled the WordPress route - which carries the whole article - and won the race outright.
   Measured on the real page before the fix: the gated copy yields 575 characters, and getFull either returns that
   junk (his phone) or nothing at all (here) - both wrong, when /wp-json/wp/v2/posts had all 848 words waiting.
   This serves a gated page on the page route and a WordPress reply on the WordPress route, and requires the whole
   story to come back. Run: node tests/thin_story.js */
const fs=require('fs'),path=require('path'),http=require('http');
const PW=require('child_process').execSync('npm root -g').toString().trim()+'/playwright';
const {chromium}=require(PW);
const ROOT=path.resolve(__dirname,'../www');
const URL0='https://www.sciencenews.org/article/riemann-hypothesis-solved-math-ai';
/* a page with all its furniture and none of its story, the way a gate serves one */
/* The page is the real Science News article as a relay without a sign-in gets it: everything the publisher serves
   EXCEPT the fourteen body paragraphs, with scripts, styles and comments stripped so it is 104 KB instead of 784 KB.
   Hand-built stand-ins were tried first and all failed to reproduce it - a short reply is refused for being short, a
   page full of sign-up copy is refused for being a notice page - so the real shape is what the guard needs. */
const GATED=fs.readFileSync(path.join(__dirname,'fixtures/gated-page.html'),'utf8');
/* and the reply /wp-json/wp/v2/posts actually gave for the same story: the whole 848-word article */
const WP=fs.readFileSync(path.join(__dirname,'fixtures/wp-reply.json'),'utf8');
const MIME={'.html':'text/html','.json':'application/json','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const serve=()=>new Promise(res=>{const s=http.createServer((q,r)=>{let f=path.join(ROOT,decodeURIComponent(q.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';
 if(!f.startsWith(ROOT)||!fs.existsSync(f)){r.writeHead(404);return r.end()}r.writeHead(200,{'content-type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r)});s.listen(0,'127.0.0.1',()=>res(s))});
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x===undefined?'':x)}else console.log('ok',n,x===undefined?'':x)};
(async()=>{const s=await serve(),url='http://127.0.0.1:'+s.address().port+'/index.html';
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:412,height:915}});
 await ctx.route(u=>!/^(127\.0\.0\.1|localhost)$/.test(u.hostname),(r,q)=>{const u=decodeURIComponent(q.url());
  if(u.indexOf('/wp-json/wp/v2/posts')>=0)return r.fulfill({status:200,contentType:'application/json',body:WP});
  if(u.indexOf('sciencenews.org/article/riemann')>=0)return r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:GATED});
  return r.abort().catch(()=>{})});
 const p=await ctx.newPage();
 await p.goto(url,{waitUntil:'domcontentloaded'});await p.waitForTimeout(1500);
 await p.evaluate(()=>{setInterval(()=>dispatchEvent(new Event('wheel')),600)});
 const r=await p.evaluate(async u=>{const n=await getFull(u,false);
   if(!n)return{none:1,log:(LG[u]||[]).slice(0,8)};
   const ps=[...n.querySelectorAll('p')].map(x=>x.textContent.trim()).filter(Boolean);
   return{tier:n.tier,n:ps.length,words:ps.join(' ').split(/\s+/).filter(Boolean).length,text:ps.join(' '),log:(LG[u]||[]).slice(0,8)};},URL0)
  .catch(e=>({error:String(e)}));
 ck('the story comes back at all',!r.none&&!r.error,r.error||(r.none?'getFull returned nothing; log '+JSON.stringify(r.log):''));
 if(!r.none&&!r.error){
  ck('it is the publisher\'s own text, not the gated page',r.tier==='wp-json',String(r.tier));
  ck('the whole story arrives',r.n>=4&&r.words>=60,r.n+' paragraphs, '+r.words+' words');
  ck('the caption is not printed as the story',!/secret order hidden in the prime/.test(r.text||''));
  ck('the listen-to-this-article notice is not printed',!/voiced by AI|Take our survey/i.test(r.text||''));
 }
 await b.close();s.close();console.log('thin_story',bad?bad+' FAILED':'all passed');process.exit(bad?1:0)})();
