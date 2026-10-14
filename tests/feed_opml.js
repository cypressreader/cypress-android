/* OPML import (B46): a feed list from another reader. The person sees what will happen first, folders (also nested ones) become folders, duplicates and unusable addresses are skipped and counted, a long list loads a few at a time, and Undo takes it all back. A wrong file says so in plain words. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{console.log((ok?'ok ':'FAIL ')+n+(ok?'':' '+(x||'')));if(!ok)bad++};
const OPML=(have)=>`<?xml version="1.0" encoding="UTF-8"?><opml version="2.0"><head><title>Feedly</title></head><body>
<outline text="News" title="News"><outline type="rss" text="Alpha News" xmlUrl="https://alpha.test/feed"/><outline type="rss" text="Beta &amp; Co's Daily" title="Beta &amp; Co's Daily" xmlUrl="https://beta.test/rss.xml"/></outline>
<outline text="Tech"><outline text="Dev"><outline type="rss" text="Gamma Dev" xmlUrl="https://gamma.test/atom.xml"/></outline><outline type="rss" text="Delta Tech" xmlurl="https://delta.test/feed/"/></outline>
<outline type="rss" text="Loose Feed" xmlUrl="https://loose.test/feed"/>
<outline type="rss" text="Alpha again" xmlUrl="https://www.alpha.test/feed/"/>
<outline type="rss" text="Have Already" xmlUrl="${have}"/>
<outline type="rss" text="Bad Address" xmlUrl="ftp://bad.test/feed"/>
<outline type="rss" text="Url attr only" url="https://urlonly.test/feed"/>
</body></opml>`;
(async()=>{
 const b=await chromium.launch();
 for(const [W,H] of [[412,860],[1100,800]]){
  const p=await (await b.newContext({viewport:{width:W,height:H}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{n:4});
  await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(400);
  const t=`[${W}] `;
  const base=await p.evaluate(()=>({n:S.feeds.length,fo:S.folders.length,url:S.feeds[0].url}));
  /* the parser alone */
  const pr=await p.evaluate(t=>{const r=opmlParse(t);return {n:r.feeds.length,bad:r.bad,titles:r.feeds.map(f=>f.title),folders:r.feeds.map(f=>f.folder)}},OPML(base.url));
  ck(t+'the parser reads folders, nested folders, odd attribute names, entities, and counts a bad address',pr.n===7&&pr.bad===1&&pr.titles.includes('Beta & Co\'s Daily')&&pr.folders.filter(f=>f==='Tech').length===2,JSON.stringify(pr));
  ck(t+'the same feed listed twice in the file is read once',pr.titles.filter(x=>/Alpha/.test(x)).length===1,JSON.stringify(pr.titles));
  /* through the file picker */
  await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close())});
  await p.setInputFiles('#fi',{name:'feedly.opml',mimeType:'text/xml',buffer:Buffer.from(OPML(base.url))});await p.waitForTimeout(600);
  const dlg=await p.evaluate(()=>{const d=document.getElementById('ask');return d?d.textContent:''});
  ck(t+'a preview says how many will be added, into how many folders, and what is skipped',/Import 6 feeds\?/.test(dlg)&&/2 folders/.test(dlg)&&/1 already in your list/.test(dlg)&&/1 with unusable/.test(dlg),dlg);
  const same=await p.evaluate(()=>S.feeds.length);ck(t+'nothing is added until the person agrees',same===base.n,same);
  await p.evaluate(()=>document.querySelector('#ask [data-a="1"]').click());await p.waitForTimeout(800);
  const a=await p.evaluate(()=>({n:S.feeds.length,fo:S.folders.map(f=>f.name),byF:Object.fromEntries(S.folders.map(f=>[f.name,S.feeds.filter(x=>x.folder===f.id).map(x=>x.title)])),loose:S.feeds.filter(x=>!S.folders.some(f=>f.id===x.folder)).map(x=>x.title),toast:(document.querySelector('#toast')||{}).textContent||''}));
  ck(t+'6 feeds were added',a.n===base.n+6,JSON.stringify(a.n));
  ck(t+'a new News folder is made; feeds for Tech join the Tech folder you already have (the nested Dev feed lands in Tech)',a.byF['News']&&a.byF['News'].length===2&&a.byF['Tech']&&a.byF['Tech'].includes('Gamma Dev')&&a.byF['Tech'].includes('Delta Tech'),JSON.stringify(a.byF));
  ck(t+'unfoldered feeds stay unfiled',a.loose.includes('Loose Feed')&&a.loose.includes('Url attr only'),JSON.stringify(a.loose));
  ck(t+'the note counts what was added and skipped, and offers Undo',/Added 6 feeds and 1 folder \(1 skipped\)/.test(a.toast)&&/Undo/.test(a.toast),a.toast);
  await p.evaluate(()=>document.querySelector('#toast .tundo').click());await p.waitForTimeout(400);
  const u=await p.evaluate(()=>({n:S.feeds.length,fo:S.folders.length}));
  ck(t+'Undo takes back the feeds and the new folders',u.n===base.n&&u.fo===base.fo,JSON.stringify(u));
  /* importing the same list again, now that it is in: nothing new */
  await p.setInputFiles('#fi',{name:'feedly.opml',mimeType:'text/xml',buffer:Buffer.from(OPML(base.url))});await p.waitForTimeout(500);
  await p.evaluate(()=>document.querySelector('#ask [data-a="1"]').click());await p.waitForTimeout(800);
  await p.setInputFiles('#fi',{name:'feedly.opml',mimeType:'text/xml',buffer:Buffer.from(OPML(base.url))});await p.waitForTimeout(500);
  const t2=await p.evaluate(()=>({ask:!!document.getElementById('ask'),toast:(document.querySelector('#toast')||{}).textContent||''}));
  ck(t+'importing the same list again says everything is already there (no empty dialog)',!t2.ask&&/already in your list/.test(t2.toast),JSON.stringify(t2));
  /* wrong files */
  for(const [nm,body,re] of [['notes.txt','just some words',/doesn.t look like a list of feeds/],['empty.opml','<?xml version="1.0"?><opml version="2.0"><head/><body></body></opml>',/no feeds in it/],['broken.opml','<opml><body><outline',/doesn.t look like a list of feeds|could not be read/]]){
   await p.setInputFiles('#fi',{name:nm,mimeType:'text/xml',buffer:Buffer.from(body)});await p.waitForTimeout(400);
   const tt=await p.evaluate(()=>(document.querySelector('#toast')||{}).textContent||'');ck(t+nm+': a plain-words message',re.test(tt),tt)}
  /* the entry in the Add a feed dialog */
  const en=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());document.getElementById('add').click();await new Promise(r=>setTimeout(r,300));const b=document.getElementById('opmlbtn');return !!b&&b.offsetParent!==null});
  ck(t+'the Add a feed dialog offers "Import a feed list"',en);
  ck(t+'no page errors',!errs.length,errs[0]);await p.context().close()}
 await b.close();console.log(bad?'feed_opml '+bad+' FAILED':'feed_opml all passed');process.exit(bad?1:0)})();
