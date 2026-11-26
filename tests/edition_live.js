/* The edition has to be able to arrive on its own (David's choice, 2026-11-26: a scheduled build makes a new issue
   twice a day, so it cannot wait for a new APK). Three things have to hold at once, and the third is the one that
   would annoy a reader:
     1. the copy inside the app still opens the magazine with no network at all;
     2. a newer edition on CyPress's own site is picked up and used from the NEXT open;
     3. an OLDER edition on the site is ignored - the magazine only ever moves forward.
   And it must never swap under a reader mid-page, which is why the fetched issue is kept for next time rather than
   rendered on arrival. Run: node tests/edition_live.js */
const fs=require('fs'),path=require('path'),http=require('http');
const PW=require('child_process').execSync('npm root -g').toString().trim()+'/playwright';
const {chromium}=require(PW);
const ROOT=path.resolve(__dirname,'../www');
const BUILT=JSON.parse(fs.readFileSync(path.join(ROOT,'world-edition.json'),'utf8'));
const LIVE='https://cypressreader.com/app/world-edition.json';

/* the same edition with a different date and a headline we can look for */
const stamp=(date,headline)=>{const d=JSON.parse(JSON.stringify(BUILT));d.date=date;
 d.editions[0].sections[0].stories[0].h=headline;return JSON.stringify(d)};

const MIME={'.html':'text/html','.json':'application/json','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const serve=()=>new Promise(res=>{const s=http.createServer((q,r)=>{let f=path.join(ROOT,decodeURIComponent(q.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';
 if(!f.startsWith(ROOT)||!fs.existsSync(f)){r.writeHead(404);return r.end()}
 r.writeHead(200,{'content-type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r)});s.listen(0,'127.0.0.1',()=>res(s))});

let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x===undefined?'':x)}else console.log('ok',n,x===undefined?'':x)};

(async()=>{
 const srv=await serve(),url='http://127.0.0.1:'+srv.address().port+'/index.html';
 const b=await chromium.launch();
 let liveBody=null,asked=0;
 const ctx=await b.newContext({viewport:{width:412,height:915}});
 await ctx.route(u=>!/^(127\.0\.0\.1|localhost)$/.test(u.hostname),(r,q)=>{
   if(q.url().indexOf('/app/world-edition.json')>=0){asked++;
     if(liveBody===null)return r.abort().catch(()=>{});
     return r.fulfill({status:200,contentType:'application/json',body:liveBody})}
   return r.abort().catch(()=>{})});
 const p=await ctx.newPage();
 const open=async()=>{await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());WE.st='';WE.d=null;S.sel='we';render()});
   await p.waitForTimeout(4500)};
 const lead=()=>p.evaluate(()=>((WE.d&&WE.d.editions[0].sections[0].stories[0].h)||''));
 const date=()=>p.evaluate(()=>((WE.d&&WE.d.date)||''));

 await p.goto(url,{waitUntil:'domcontentloaded'});await p.waitForTimeout(1500);

 /* 1. nothing on the site: the copy inside the app still opens the magazine */
 await open();
 ck('the built-in edition opens with the site unreachable',await date()===BUILT.date,await date());
 ck('and the magazine actually rendered',await p.evaluate(()=>!!document.querySelector('.we-pg')));

 /* 2. a newer edition appears on the site */
 liveBody=stamp('2099-01-02','A newer edition arrived on its own');
 await open();                       /* this open fetches it in the background */
 await p.waitForTimeout(3500);
 ck('the site was asked for a newer edition',asked>0,asked+' request(s)');
 ck('but the issue on screen did not change under the reader',await date()===BUILT.date,await date());
 await open();                       /* and the next open uses it */
 ck('the next open uses the newer edition',await date()==='2099-01-02',await date());
 ck('with its own lead story',(await lead())==='A newer edition arrived on its own',await lead());

 /* 3. an older edition on the site must never pull the magazine backwards */
 liveBody=stamp('2000-01-01','An older edition that must be ignored');
 await open();await p.waitForTimeout(3500);await open();
 ck('an older edition on the site is ignored',await date()==='2099-01-02',await date());
 ck('and the lead story is still the newer one',(await lead())==='A newer edition arrived on its own',await lead());

 await b.close();srv.close();
 console.log('edition_live',bad?bad+' FAILED':'all passed');process.exit(bad?1:0)})();
