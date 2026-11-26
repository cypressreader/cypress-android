/* A story open in the World Edition is cut into pages for the width it was opened at: a spread above 600 CSS px,
   one scrolling page below. David, 2026-11-26, on an SM-F976U1: open a story on the Fold's inner screen, close the
   phone, and the story stays side-to-side on the cover screen until you back out and open another one. Every
   measurement in the shape log was correct - the numbers were never wrong, the pages were. This opens a story wide,
   folds to phone width, and requires the story to be re-cut as one scrolling page; then unfolds and requires the
   spread back. Run: node tests/fold_story.js */
const fs=require('fs'),path=require('path'),http=require('http');
const PW=require('child_process').execSync('npm root -g').toString().trim()+'/playwright';
const {chromium}=require(PW);
const ROOT=path.resolve(__dirname,'../www');
const MIME={'.html':'text/html','.json':'application/json','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const serve=()=>new Promise(res=>{const s=http.createServer((q,r)=>{let f=path.join(ROOT,decodeURIComponent(q.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';
 if(!f.startsWith(ROOT)||!fs.existsSync(f)){r.writeHead(404);return r.end()}r.writeHead(200,{'content-type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r)});s.listen(0,'127.0.0.1',()=>res(s))});
const STANDIN='<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Stand-in</title></head><body><article><h1>Stand-in</h1>'
 +Array.from({length:16},(_,i)=>`<p>Paragraph ${i} of a stand-in article with enough words to fill a printed page and then some, so the story is cut into several pages at either width and the shape of the cut can be told apart.</p>`).join('')+'</article></body></html>';
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x===undefined?'':x)}else console.log('ok',n,x===undefined?'':x)};
(async()=>{const s=await serve(),url='http://127.0.0.1:'+s.address().port+'/index.html';
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:884,height:1104},deviceScaleFactor:1});
 await ctx.route(u=>!/^(127\.0\.0\.1|localhost)$/.test(u.hostname),(r,q)=>
  /^(document|fetch|xhr)$/.test(q.resourceType())?r.fulfill({contentType:'text/html',body:STANDIN}):r.continue().catch(()=>{}));
 const p=await ctx.newPage();
 await p.goto(url,{waitUntil:'domcontentloaded'});await p.waitForTimeout(1500);
 await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());S.sel='we';render()});
 await p.waitForTimeout(1200);
 await p.evaluate(()=>{setInterval(()=>dispatchEvent(new Event('wheel')),900)});
 await p.evaluate(()=>{WE.go(2,1)});await p.waitForTimeout(400);
 await p.evaluate(()=>weRead(0,WE.pg|0));
 await p.waitForSelector('.we-sc .we-sp',{timeout:15000}).catch(()=>{});
 await p.waitForTimeout(3500);
 const wide=await p.evaluate(()=>({two:WE.two,pages:document.querySelectorAll('.we-sc .we-sp').length,
   scroll:document.querySelectorAll('.we-sc .we-sp.we-sx').length}));
 ck('opened wide, the story is a spread',wide.two===true&&wide.pages>0,JSON.stringify(wide));
 ck('and no page is the single scrolling kind',wide.scroll===0,JSON.stringify(wide));
 /* close the phone */
 await p.setViewportSize({width:412,height:915});await p.waitForTimeout(2500);
 const fold=await p.evaluate(()=>({two:WE.two,pages:document.querySelectorAll('.we-sc .we-sp').length,
   scroll:document.querySelectorAll('.we-sc .we-sp.we-sx').length,
   reread:SHPL.filter(x=>/ reread /.test(x)).length}));
 ck('folding re-cuts the open story',fold.reread>0,JSON.stringify(fold));
 ck('and it is now one scrolling page, not a spread',fold.two===false&&fold.scroll>0,JSON.stringify(fold));
 /* open it again */
 await p.setViewportSize({width:884,height:1104});await p.waitForTimeout(2500);
 const un=await p.evaluate(()=>({two:WE.two,scroll:document.querySelectorAll('.we-sc .we-sp.we-sx').length}));
 ck('unfolding puts the spread back',un.two===true&&un.scroll===0,JSON.stringify(un));
 await b.close();s.close();console.log('fold_story',bad?bad+' FAILED':'all passed');process.exit(bad?1:0)})();
