/* The app, open in a headless browser, for the edition pipeline to call into.
 *
 * Every pass of the pipeline that needs to read a feed, group headlines or clean an article calls the APP's own
 * code rather than a copy of it (WORLD-EDITION-PIPELINE.md, pass 0). That only works if opening the app is one
 * step, so this is that step: a tiny file server over `www/`, a headless browser pointed at it, and the page
 * handed back. Nothing here knows anything about editions.
 *
 *   const {openApp}=require('./app');
 *   const app=await openApp();            // app.page is the live app
 *   await app.close();
 */
const fs=require('fs'),path=require('path'),http=require('http');
const PW=require('child_process').execSync('npm root -g').toString().trim()+'/playwright';
const {chromium}=require(PW);
const ROOT=path.resolve(__dirname,'../../www');

const MIME={'.html':'text/html','.json':'application/json','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2','.webmanifest':'application/manifest+json'};
const serve=()=>new Promise(res=>{const s=http.createServer((q,r)=>{let f=path.join(ROOT,decodeURIComponent(q.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';
 if(!f.startsWith(ROOT)||!fs.existsSync(f)){r.writeHead(404);return r.end()}
 r.writeHead(200,{'content-type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r)});s.listen(0,'127.0.0.1',()=>res(s))});

/* fixtures: answer every off-site address with a local copy if there is one, so the whole path runs with no
   network at all. That is the only way to exercise the article passes in a cloud session, where publishers
   answer 403 or nothing. */
async function useFixtures(ctx,dir){
 dir=path.resolve(dir);
 await ctx.route(u=>!/^(127\.0\.0\.1|localhost)$/.test(u.hostname),(r,q)=>{
  const f=path.join(dir,encodeURIComponent(decodeURIComponent(q.url())).slice(0,120)+'.html');
  if(fs.existsSync(f))return r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:fs.readFileSync(f,'utf8')});
  return r.abort().catch(()=>{})});
}

async function openApp({fixtures,viewport,wake=true}={}){
 const srv=await serve(),url='http://127.0.0.1:'+srv.address().port+'/index.html';
 /* The pipeline fetches stories the way the ANDROID app does: straight from the publisher, falling back to a
    relay only when one refuses. The web build has no direct route, because a browser forbids the cross-origin
    fetch - so this browser runs with that rule off and tells the app so (CYDIRECT below). Until 27 Nov every
    story in a run went out through a PUBLIC relay instead, and when one rate-limited us an entire edition read
    nothing and published nothing. A runner reaches most publishers directly; the relays are for the rest. */
 const browser=await chromium.launch({args:['--disable-web-security','--disable-features=IsolateOrigins,site-per-process']});
 const ctx=await browser.newContext({viewport:viewport||{width:412,height:915}});
 if(fixtures)await useFixtures(ctx,fixtures);
 const page=await ctx.newPage();
 await page.addInitScript(()=>{window.CYDIRECT=1});
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.waitForTimeout(1500);
 /* the app holds background work back until the finger is still; a steady wheel event keeps userRest() true */
 if(wake)await page.evaluate(()=>{setInterval(()=>dispatchEvent(new Event('wheel')),800)});
 return{page,ctx,url,close:async()=>{await browser.close();srv.close()}};
}

module.exports={openApp,ROOT};
