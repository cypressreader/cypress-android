/* THE SQUARE: the World Edition drawn at ~46% of the window height, which David filmed three times and called
   "the screen does that square thing for a second" (2026-11-26, swipe DOWN hard, happens flat on a table so it is
   not the Fold's hinge). NOT a phone problem - this reproduces in an ordinary headless browser at 412x915.

   What it prints: `.we` flipping between 420 px and 915 px in a 915 px window. 420/915 = 46%, the square.

   SOLVED 2026-11-26 - and the guess below was wrong, so it is replaced rather than kept. `.we` DOES have a height of
   its own (`height:calc(100svh - 150px);min-height:420px`, and `height:100%!important` once `body.wefull` is on); the
   height was never indefinite and 420 was never the cover's content height - it is the `min-height` floor, exactly.
   The real cause: pull-to-refresh moves `#grid` with a transform and springs it back, a transformed element becomes the
   containing block for any fixed-position descendant, and the full-screen edition is `position:fixed;inset:0`. So for
   the length of the spring it measured 100% of `#grid` - 48 px while the edition is showing - and hit the 420 floor.
   420/915 = 46%, the square; the duration was the spring, hence flat-topped and always the same size. Fixed by leaving
   the edition out of pull-to-refresh (`.open,.wefull` in the `main` touchstart guard). Guard: `tests/we_square.js`.
   This tool stays as the reproducer that cornered it: before the fix it prints `.we` flipping 915 -> 420 -> 915 on a
   hard swipe down; after it, `.we` stays 915. To see the mechanism itself, log `getComputedStyle(#grid).transform`
   alongside the height - the square is present exactly while that is not `none`. Run: node tools/we-height.js */
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
