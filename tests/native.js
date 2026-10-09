const {APP,OUT}=require('./env');
const {seed,PW}=require('./mock2');const {chromium}=require(PW);const fs=require('fs');
let html=fs.readFileSync(APP,'utf8');
if(!html.includes("const CP_REPO='';"))throw new Error('CP_REPO marker missing');
fs.writeFileSync(OUT+'/cypress-native.html',html.replace("const CP_REPO='';","const CP_REPO='me/cypress-android';"));
let pass=0,fail=0;const log=[];
const ck=(g,n,c,x='')=>{if(c)pass++;else{fail++;log.push(`FAIL [${g}] ${n} ${x}`)}};
const W=ms=>new Promise(r=>setTimeout(r,ms));
const CORS={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'*'};
const rss=(nm,n=6)=>`<?xml version="1.0"?><rss xmlns:media="http://search.yahoo.com/mrss/"><channel><title>${nm}</title>${Array.from({length:n},(_,i)=>`<item><title>${nm} story ${i+1}</title><link>https://${nm.toLowerCase()}.test/story-${i+1}</link><pubDate>${new Date(Date.now()-i*9e5).toUTCString()}</pubDate><description>Summary ${i+1}.</description></item>`).join('')}</channel></rss>`;
const S2=()=>seed(['Alpha','Beta'],{});
async function mk(b,{native=false,gh={tag:'v7',notes:'Faster loading.\nUpdates install from inside CyPress.'},web={}}={}){
 const ctx=await b.newContext({viewport:{width:884,height:1060},hasTouch:true});
 const p=await ctx.newPage();p.errs=[];p.hits=[];p.ctl={gh,...web};
 p.on('pageerror',e=>p.errs.push(e.message));p.on('dialog',d=>d.accept());
 await p.route(/^https?:\/\/(?!localhost)/,async r=>{
  const req=r.request(),u=req.url(),du=decodeURIComponent(u);p.hits.push({u:du,t:Date.now()});
  if(req.method()==='OPTIONS')return r.fulfill({status:204,headers:CORS});
  if(u.startsWith('https://api.github.com/repos/me/cypress-android/releases/latest')){
   if(p.ctl.gh===null)return r.fulfill({status:403,headers:CORS,body:'{"message":"rate limit"}'});
   return r.fulfill({status:200,contentType:'application/json',headers:CORS,body:JSON.stringify({tag_name:p.ctl.gh.tag,body:p.ctl.gh.notes})});
  }
  if(/\.test\/.*\.png/.test(u))return r.fulfill({status:200,contentType:'image/png',headers:CORS,body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==','base64')});
  const w=du.match(/^https:\/\/api\.allorigins\.win\/raw\?url=(.+)$/),c=du.match(/^https:\/\/corsproxy\.io\/\?url=(.+)$/),d=du.match(/^https:\/\/(\w+)\.test\/feed$/);
  const target=w?w[1]:c?c[1]:d?du:null;const via=w?'allorigins':c?'corsproxy':d?'direct':'';
  if(target){
   const m=target.match(/https:\/\/(\w+)\.test\/feed/);
   const beh=(p.ctl[via]||{});if(beh.delay)await W(beh.delay);
   if(beh.fail)return r.abort();
   if(m)return r.fulfill({status:200,contentType:'text/xml',headers:CORS,body:rss(m[1][0].toUpperCase()+m[1].slice(1))});
  }
  return r.abort();
 });
 if(native)await p.addInitScript(()=>{
  const st=window.__st={perm:false,failDl:false,prog:0};window.__calls=[];const rec=(n,a)=>window.__calls.push([n,a]);
  window.Capacitor={isNativePlatform:()=>true,Plugins:{CyNative:{
   info:async()=>({versionCode:5,versionName:'1.0.5',canInstall:st.perm}),
   download:async a=>{rec('download',a);if(st.failDl)throw new Error('Download failed: HTTP 404');st.prog=0;for(let i=0;i<5;i++){await new Promise(r=>setTimeout(r,150));st.prog=(i+1)*20}return{size:100}},
   progress:async()=>({received:st.prog,total:100,busy:true}),
   install:async()=>{rec('install');if(!st.perm)throw new Error('NEEDS_PERMISSION')},
   setBars:async a=>{rec('setBars',a)},shareFile:async a=>{rec('shareFile',a)},shareText:async a=>{rec('shareText',a)}}}};
 });
 await p.addInitScript(()=>{document.addEventListener('DOMContentLoaded',()=>{for(const sh of document.styleSheets){let r;try{r=sh.cssRules}catch(e){continue}for(let i=r.length-1;i>=0;i--){const t=r[i].selectorText||'';if(t==='.snav'||/^\.sgrp:not\(\.open\)/.test(t))sh.deleteRule(i)}}})});
 await p.addInitScript(s=>{try{if(!localStorage.getItem('folio'))localStorage.setItem('folio',JSON.stringify(s))}catch(e){}},S2());
 await p.goto(('file://'+OUT+'/cypress-native.html'));await W(1500);p.ctx=ctx;return p;
}
const txt=(p,s)=>p.evaluate(s=>{const e=document.querySelector(s);return e?e.textContent.trim():null},s);
const calls=(p,n)=>p.evaluate(n=>window.__calls.filter(c=>c[0]===n).map(c=>c[1]),n);
(async()=>{
 const b=await chromium.launch();

 /* ---------- A: update available, full install flow ---------- */
 {const p=await mk(b,{native:true});
  ck('A','runs as native',await p.evaluate(()=>NATIVE===true));
  ck('A','first route is the site itself, no proxies used',p.hits.some(h=>/^https:\/\/alpha\.test\/feed$/.test(h.u))&&!p.hits.some(h=>/corsproxy|allorigins/.test(h.u)&&/\/feed$/.test(h.u)),JSON.stringify(p.hits.filter(h=>/feed/.test(h.u)).map(h=>h.u.slice(0,80))));
  ck('A','stories loaded',await p.evaluate(()=>Object.values(items).flat().length>=10));
  await W(5200);
  ck('A','update bar shows',/CyPress 7 is ready/.test(await txt(p,'#upd span')||''),await txt(p,'#upd'));
  ck('A','has Update button',!!(await p.$('#upd [data-nupd]')));
  ck('A','asked GitHub about the right repo',p.hits.some(h=>h.u.startsWith('https://api.github.com/repos/me/cypress-android/releases/latest')));
  const bars=await calls(p,'setBars');ck('A','status bar colour sent',bars.length>0&&/^#[0-9a-f]{6}$/.test(bars[0].color)&&typeof bars[0].light==='boolean',JSON.stringify(bars[0]));
  // settings
  await p.evaluate(()=>{document.querySelector('#set').showModal()});await W(300);
  ck('A','App section in settings',!!(await p.$('#s-app')));
  ck('A','App nav chip',!!(await p.$('#snav [data-go="s-app"]')));
  ck('A','App chip sits before Setup',await p.evaluate(()=>{const n=[...document.querySelectorAll('#snav button')].map(x=>x.dataset.go);return n.indexOf('s-app')===n.indexOf('s-setup')-1}));
  ck('A','settings line',/^You have version .*5.*\. Version 7 is ready$/.test(await txt(p,'#appv')),await txt(p,'#appv'));
  ck('A','release notes shown',/Faster loading/.test(await txt(p,'#appnotes')||'')&&await p.evaluate(()=>!document.querySelector('#appnotes').hidden));
  await p.evaluate(()=>document.querySelector('#set').close());
  // tap Update: needs permission the first time
  await p.click('#upd [data-nupd]');await W(250);
  ck('A','shows downloading',/Downloading/.test(await txt(p,'#upd span')||''),await txt(p,'#upd span'));
  ck('A','button disabled while downloading',await p.evaluate(()=>{const b=document.querySelector('#upd [data-nupd]');return !!b&&b.disabled}));
  ck('A','no close button while downloading',!(await p.$('#upd [data-updx]')));
  await W(1300);
  ck('A','asks for permission',/Allow from this source/.test(await txt(p,'#upd span')||''),await txt(p,'#upd span'));
  const dl=await calls(p,'download');ck('A','downloaded once from the right link',dl.length===1&&dl[0].url==='https://github.com/me/cypress-android/releases/download/v7/cypress.apk',JSON.stringify(dl));
  await p.evaluate(()=>{window.__st.perm=true});
  await p.click('#upd [data-nupd]');await W(500);
  ck('A','does not download twice',(await calls(p,'download')).length===1);
  ck('A','installer opened',(await calls(p,'install')).length===2);
  ck('A','final instruction',/Tap Install/.test(await txt(p,'#upd span')||''),await txt(p,'#upd span'));
  ck('A','no page errors',p.errs.length===0,p.errs.join('|'));
  // sharing and saving
  await p.evaluate(()=>document.querySelector('#set').showModal());
  await p.click('#bke');await W(500);
  const sf=await calls(p,'shareFile');
  ck('A','backup goes to share sheet',sf.length===1&&sf[0].name==='cypress-backup.json'&&sf[0].mime==='application/json',JSON.stringify(sf).slice(0,120));
  let bk={};try{bk=JSON.parse(Buffer.from(sf[0].data,'base64').toString())}catch(e){}
  ck('A','backup content is intact',Array.isArray(bk.feeds)&&bk.feeds.length===2);
  await p.click('#exp');await W(400);
  const sf2=await calls(p,'shareFile');ck('A','OPML goes to share sheet',sf2.length===2&&sf2[1].name==='folio-feeds.opml'&&/<opml/.test(Buffer.from(sf2[1].data,'base64').toString()));
  await p.evaluate(()=>navigator.share({title:'T',url:'https://x.test/a'}));
  const st=await calls(p,'shareText');ck('A','link sharing works via polyfill',st.length===1&&st[0].url==='https://x.test/a'&&st[0].title==='T');
  await p.evaluate(()=>document.querySelector('#set').close());
  await p.ctx.close();}

 /* ---------- B: download fails, then retry ---------- */
 {const p=await mk(b,{native:true});await W(5200);
  await p.evaluate(()=>{window.__st.failDl=true});await p.click('#upd [data-nupd]');await W(700);
  ck('B','failure message',/didn’t download/.test(await txt(p,'#upd span')||''),await txt(p,'#upd span'));
  ck('B','offers Try again',/Try again/.test(await txt(p,'#upd [data-nupd]')||''));
  ck('B','can be dismissed after failure',!!(await p.$('#upd [data-updx]')));
  await p.evaluate(()=>{window.__st.failDl=false});await p.click('#upd [data-nupd]');await W(1400);
  ck('B','retry downloads',(await calls(p,'download')).length===2&&/Allow from this source/.test(await txt(p,'#upd span')||''));
  await p.click('#upd [data-updx]');ck('B','Later closes the bar',!(await p.$('#upd')));
  await p.ctx.close();}

 /* ---------- C: already up to date ---------- */
 {const p=await mk(b,{native:true,gh:{tag:'v5',notes:'x'}});await W(5600);
  ck('C','no update bar',!(await p.$('#upd')));
  await p.evaluate(()=>document.querySelector('#set').showModal());
  ck('C','line says up to date',/^You have version .*5.*\. Up to date/.test(await txt(p,'#appv')),await txt(p,'#appv'));
  await p.click('#appchk');await W(700);
  ck('C','manual check toast',/latest version/.test(await txt(p,'#toast')||''),await txt(p,'#toast'));
  await p.ctx.close();}

 /* ---------- D: GitHub unreachable ---------- */
 {const p=await mk(b,{native:true,gh:null});await W(5600);
  ck('D','silent on automatic check',!(await p.$('#upd'))&&!/check/.test(await txt(p,'#toast')||''));
  await p.evaluate(()=>document.querySelector('#set').showModal());await p.click('#appchk');await W(700);
  ck('D','manual check says so',/Couldn’t check/.test(await txt(p,'#toast')||''),await txt(p,'#toast'));
  ck('D','no page errors',p.errs.length===0,p.errs.join('|'));
  await p.ctx.close();}

 /* ---------- E: website / installed web app is untouched ---------- */
 {const p=await mk(b,{native:false});await W(5800);
  ck('E','not native',await p.evaluate(()=>NATIVE===false));
  ck('E','no App section',!(await p.$('#s-app'))&&!(await p.$('#snav [data-go="s-app"]')));
  ck('E','never asks GitHub',!p.hits.some(h=>/api\.github\.com/.test(h.u)));
  await p.evaluate(()=>document.querySelector('#set').showModal());
  ck('E','settings nav highlights work',await p.evaluate(()=>{const n=[...document.querySelectorAll('#snav [data-go]')].map(x=>x.dataset.go);return n.every(g=>document.getElementById(g))}));
  await p.ctx.close();}

 /* ---------- F: staggered fetching on the web ---------- */
 const timed=async(p,url)=>p.evaluate(async u=>{const lg=[],t=Date.now();let ok=true,txt='';try{txt=await fetchText(u,isFeed,lg)}catch(e){ok=false}return{ok,ms:Date.now()-t,lg,len:txt.length}},url);
 {const p=await mk(b,{native:false});await W(300);p.hits.length=0;
  const r=await timed(p,'https://gamma.test/feed');
  ck('F','fast first route wins alone',r.ok&&p.hits.filter(h=>/corsproxy|codetabs|thingproxy|yacdn/.test(h.u)).length===0&&p.hits.filter(h=>/allorigins/.test(h.u)).length===1,JSON.stringify(p.hits.map(h=>h.u.slice(0,50))));
  await p.ctx.close();}
 {const p=await mk(b,{native:false,web:{allorigins:{fail:1}}});await W(300);p.hits.length=0;
  const r=await timed(p,'https://gamma.test/feed');
  ck('F','failure moves on immediately',r.ok&&r.ms<700&&p.hits.some(h=>/corsproxy/.test(h.u)),JSON.stringify({ms:r.ms,lg:r.lg}));
  ck('F','failure is logged by name',r.lg.some(x=>/^allorigins: /.test(x)),JSON.stringify(r.lg));
  await p.ctx.close();}
 {const p=await mk(b,{native:false,web:{allorigins:{delay:2500}}});await W(300);p.hits.length=0;
  const r=await timed(p,'https://gamma.test/feed');
  ck('F','slow first route is overtaken after about a second',r.ok&&r.ms>900&&r.ms<1900&&p.hits.some(h=>/corsproxy/.test(h.u)),JSON.stringify({ms:r.ms}));
  await p.ctx.close();}
 {const p=await mk(b,{native:false,web:{allorigins:{fail:1},corsproxy:{fail:1}}});await W(300);
  const r=await timed(p,'https://gamma.test/feed');
  ck('F','all routes failing gives a clean error',!r.ok&&r.ms<5000,JSON.stringify({ms:r.ms,ok:r.ok}));
  await p.ctx.close();}

 /* ---------- G: native goes straight to the site ---------- */
 {const p=await mk(b,{native:true});await W(300);p.hits.length=0;
  const r=await timed(p,'https://gamma.test/feed');
  ck('G','direct request only',r.ok&&p.hits.length===1&&/^https:\/\/gamma\.test\/feed$/.test(p.hits[0].u),JSON.stringify(p.hits.map(h=>h.u.slice(0,50))));
  await p.ctx.close();}
 {const p=await mk(b,{native:true,web:{direct:{fail:1}}});await W(300);p.hits.length=0;
  const r=await timed(p,'https://gamma.test/feed');
  ck('G','blocked site falls back within a moment',r.ok&&r.ms<800&&p.hits.some(h=>/allorigins/.test(h.u)),JSON.stringify({ms:r.ms,lg:r.lg}));
  ck('G','log says direct failed',r.lg.some(x=>/^direct: /.test(x)),JSON.stringify(r.lg));
  await p.ctx.close();}

 await b.close();
 console.log(log.join('\n'));console.log(`${pass} passed, ${fail} failed`);
})().catch(e=>{console.error('CRASH',e);process.exit(1)});
