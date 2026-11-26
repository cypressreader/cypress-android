/* THE SQUARE: the World Edition drawn at ~46% of the window height, which David filmed three times and called
   "the screen does that square thing for a second" (2026-11-26, swipe DOWN hard, happens flat on a table so it is
   not the Fold's hinge). NOT a phone problem - this reproduces in an ordinary headless browser at 412x915.

   What it prints: `.we` flipping between 420 px and 915 px in a 915 px window. 420/915 = 46%, the square.

   The cause, as far as this got: `.we` has NO height of its own - no inline style, and the only rule for it is
   `.we{position:relative}`. It is a grid item inside `#grid`, which is 48 px tall (still carrying its list layout),
   inside `main` at 915. So the edition's height falls back to its own CONTENT height - 420 px is the cover's natural
   height - and `.we-sc{flex:1}` / `.we-pg{height:100%}` resolve against an indefinite height, which is why whole
   pages come out short and clipped (the missing lead headline in his recording: the box really is shorter, the
   content is not scaled).

   STILL TO FIND: what normally gives `.we` the full 915, and why it is sometimes absent. Do not guess at CSS here -
   `fitPage1`/`fitHero`/`layout` are delicate and the look is David's call. Run: node tools/we-height.js */
const fs=require('fs'),path=require('path'),http=require('http');
const PW=require('child_process').execSync('npm root -g').toString().trim()+'/playwright';
const {chromium}=require(PW);
const ROOT=path.resolve('/home/user/cypress-android/www');
const MIME={'.html':'text/html','.json':'application/json','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const serve=()=>new Promise(res=>{const s=http.createServer((q,r)=>{let f=path.join(ROOT,decodeURIComponent(q.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';
 if(!f.startsWith(ROOT)||!fs.existsSync(f)){r.writeHead(404);return r.end()}r.writeHead(200,{'content-type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r)});s.listen(0,'127.0.0.1',()=>res(s))});
(async()=>{const s=await serve(),url='http://127.0.0.1:'+s.address().port+'/index.html';
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:412,height:915},deviceScaleFactor:1,hasTouch:true,isMobile:true});
 await ctx.route(u=>!/^(127\.0\.0\.1|localhost)$/.test(u.hostname),(r,q)=>/^(document|fetch|xhr)$/.test(q.resourceType())?r.fulfill({contentType:'text/html',body:'<html><body><article><h1>x</h1><p>y</p></article></body></html>'}):r.continue().catch(()=>{}));
 const p=await ctx.newPage();
 await p.goto(url,{waitUntil:'domcontentloaded'});await p.waitForTimeout(1500);
 await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());S.sel='we';render()});
 await p.waitForTimeout(4500);
 await p.evaluate(()=>{window.__s=[];const t=setInterval(()=>{const sc=document.querySelector('.we-sc'),pg=sc&&sc.querySelector('.we-pg'),we=document.querySelector('.we');
   const par=we&&we.parentElement,gp=par&&par.parentElement;
   window.__s.push([Math.round(performance.now()),we?Math.round(we.getBoundingClientRect().height):0,
     par?par.tagName+'.'+par.className.slice(0,18)+':'+Math.round(par.getBoundingClientRect().height):'-',
     gp?gp.tagName+':'+Math.round(gp.getBoundingClientRect().height):'-',
     we?(we.getAttribute('style')||'(no inline style)')+' || cls='+we.className+' || grid='+(par?getComputedStyle(par).display+' h='+getComputedStyle(par).height:'-'):'-'])},50);setTimeout(()=>clearInterval(t),2600)});
 /* a hard swipe down, then a hard fling down again */
 for(let r=0;r<2;r++){
  await p.touchscreen.tap(206,500).catch(()=>{});
  await p.evaluate(()=>{const el=document.querySelector('.we-sc')||document.body;
   const mk=(ty,y)=>{const t=new Touch({identifier:1,target:el,clientX:206,clientY:y});el.dispatchEvent(new TouchEvent(ty,{bubbles:true,cancelable:true,touches:ty==='touchend'?[]:[t],targetTouches:ty==='touchend'?[]:[t],changedTouches:[t]}))};
   mk('touchstart',120);for(let y=130;y<=880;y+=35)mk('touchmove',y);mk('touchend',880)});
  await p.waitForTimeout(700);
 }
 await p.waitForTimeout(900);
 const r=await p.evaluate(()=>window.__s);
 let prev=null;
 for(const x of r){const k=x[1]+'|'+x[2]+'|'+x[3];if(k!==prev){console.log('  t='+x[0]+'ms  .we='+x[1]+'  parent='+x[2]+'  grandparent='+x[3]+'  computed='+x[4]);prev=k}}
 await b.close();s.close()})();
