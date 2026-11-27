/* THE SQUARE (David, 2026-11-26, filmed three times: "the screen does that square thing for a second", on a hard
   swipe DOWN, flat on a table so not the Fold's hinge). The World Edition was drawn into roughly the top 46% of the
   window for about a third of a second, with content clipped rather than scaled - the lead headline was missing from
   the small frame, so the box really was short.
   CAUSE, measured: pull-to-refresh moves #grid (transform: translateY) and springs it back. A transformed element
   becomes the containing block for any fixed-position descendant, and the full-screen edition is fixed inset:0 with
   height:100%!important - so for the length of the spring-back it measured 100% of #grid, which is 48px tall while the
   edition is showing, and landed on its own min-height floor of 420px. 420/915 = 46%, the square, and the duration was
   the spring, which is why it was flat-topped and always the same size.
   FIX: pull-to-refresh leaves the edition alone, the way it already left an open story alone. Its refresh tree is
   painted behind the edition anyway, so the gesture was invisible as well as harmful.
   This requires the edition to keep full height through a hard fling down, AND requires the gesture to still work in
   the list - a fix that quietly killed pull-to-refresh everywhere would pass the first half alone. Run: node tests/we_square.js */
const fs=require('fs'),path=require('path'),http=require('http');
const PW=require('child_process').execSync('npm root -g').toString().trim()+'/playwright';
const {chromium}=require(PW);
const ROOT=path.resolve(__dirname,'../www');
const MIME={'.html':'text/html','.json':'application/json','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const serve=()=>new Promise(res=>{const s=http.createServer((q,r)=>{let f=path.join(ROOT,decodeURIComponent(q.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';
 if(!f.startsWith(ROOT)||!fs.existsSync(f)){r.writeHead(404);return r.end()}r.writeHead(200,{'content-type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r)});s.listen(0,'127.0.0.1',()=>res(s))});
const STANDIN='<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Stand-in</title></head><body><article><h1>Stand-in</h1>'
 +Array.from({length:16},(_,i)=>`<p>Paragraph ${i} of a stand-in article with enough words to fill a printed page.</p>`).join('')+'</article></body></html>';
const VH=915;
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x===undefined?'':x)}else console.log('ok',n,x===undefined?'':x)};
/* a hard fling down, dispatched the way a finger does it, plus a sampler that watches the whole spring-back */
const FLING=`(()=>{const el=document.querySelector('.we-sc')||document.querySelector('#grid')||document.body;
 const mk=(ty,y)=>{const t=new Touch({identifier:1,target:el,clientX:206,clientY:y});
  el.dispatchEvent(new TouchEvent(ty,{bubbles:true,cancelable:true,touches:ty==='touchend'?[]:[t],targetTouches:ty==='touchend'?[]:[t],changedTouches:[t]}))};
 mk('touchstart',120);for(let y=130;y<=880;y+=35)mk('touchmove',y);mk('touchend',880)})()`;
(async()=>{const s=await serve(),url='http://127.0.0.1:'+s.address().port+'/index.html';
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:412,height:VH},deviceScaleFactor:1,hasTouch:true,isMobile:true});
 await ctx.route(u=>!/^(127\.0\.0\.1|localhost)$/.test(u.hostname),(r,q)=>
  /^(document|fetch|xhr)$/.test(q.resourceType())?r.fulfill({contentType:'text/html',body:STANDIN}):r.continue().catch(()=>{}));
 const p=await ctx.newPage();
 await p.goto(url,{waitUntil:'domcontentloaded'});await p.waitForTimeout(1500);
 await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());S.sel='we';render()});
 await p.waitForTimeout(2500);
 ck('the edition has the screen to itself',await p.evaluate(()=>document.body.classList.contains('wefull')));
 ck('and starts at the full height of the window',await p.evaluate(()=>Math.round(document.querySelector('.we').getBoundingClientRect().height))>=VH-2);
 /* watch every frame of the spring-back, not just the ends: the square lasted ~350ms */
 await p.evaluate(()=>{window.__m=[];const t=setInterval(()=>{const we=document.querySelector('.we'),g=document.getElementById('grid');
   window.__m.push([Math.round(we?we.getBoundingClientRect().height:-1),g?getComputedStyle(g).transform:'none'])},30);setTimeout(()=>clearInterval(t),2000)});
 await p.evaluate(FLING);await p.waitForTimeout(2100);
 const m=await p.evaluate(()=>window.__m);
 const low=Math.min(...m.map(x=>x[0])),moved=m.filter(x=>x[1]&&x[1]!=='none').length;
 ck('the edition never shrinks during a hard fling down',low>=VH-2,'shortest '+low+'px of '+VH+' over '+m.length+' frames');
 ck('and the page under it is never moved',moved===0,moved+' frames with a transform on #grid');
 /* the other half: the gesture must still refresh the list, which is what it is for */
 await p.evaluate(()=>{S.sel='all';render()});
 await p.waitForTimeout(1500);
 ck('the app is back on the list',await p.evaluate(()=>!document.body.classList.contains('wefull')));
 await p.evaluate(()=>{window.__p=0;const t=setInterval(()=>{const g=document.getElementById('grid'),e=document.getElementById('pts');
   if((g&&getComputedStyle(g).transform!=='none')||(e&&e.classList.contains('on')))window.__p++},30);setTimeout(()=>clearInterval(t),1200)});
 await p.evaluate(FLING);await p.waitForTimeout(1300);
 ck('pulling down in the list still calls up refresh',await p.evaluate(()=>window.__p)>0);
 await b.close();s.close();console.log('we_square',bad?bad+' FAILED':'all passed');process.exit(bad?1:0)})();
