/* Messy-book sweep: feeds the awkward EPUBs from fixtures/messy-epubs.js through the real import path and
   checks each one either opens properly or fails with a message that says what went wrong in plain words.
   The books are generated fresh in a temp folder (no binaries in the repo, no real books). */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
const path=require('path'),os=require('os'),fs=require('fs');
const {writeAll}=require('./fixtures/messy-epubs');
let bad=0;const ck=(nm,ok,x)=>{if(!ok){bad++;console.log('FAIL',nm,x||'')}else console.log('ok',nm,x||'')};

(async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'messy-epub-'));const cases=writeAll(dir);
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:390,height:800},hasTouch:true,isMobile:true});const p=await ctx.newPage();
 const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{n:3});
 await p.goto('file://'+APP);await p.waitForTimeout(1500);await p.click('text=Get started').catch(()=>{});
 await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());S.scroll='pages';S.sel='books';side();render()});
 await p.waitForTimeout(400);

 for(const c of cases){
  /* a clean shelf each time, so one book can't mask the next */
  await p.evaluate(async()=>{const db=await bkDb();await new Promise(r=>{const tx=db.transaction(['books','ch','img'],'readwrite');tx.objectStore('books').clear();tx.objectStore('ch').clear();tx.objectStore('img').clear();tx.oncomplete=r;tx.onerror=r});S.bkv='';S.bkpos={};renderBooks()}).catch(()=>{});
  await p.waitForTimeout(150);
  await p.evaluate(()=>{window.__toast=null;const t=window.toast;window.toast=m=>{window.__toast=m;return t(m)}});
  const [fc]=await Promise.all([p.waitForEvent('filechooser'),p.evaluate(()=>(document.querySelector('#grid [data-bkadd]')||document.querySelector('[data-bkadd]')).click())]);
  await fc.setFiles(c.file);
  await p.waitForFunction(()=>window.__toast!==null,null,{timeout:60000}).catch(()=>{});
  const got=await p.evaluate(async()=>{const l=await bkAll();const bk=l[0];return {msg:window.__toast,n:l.length,
   t:bk&&bk.title,a:bk&&bk.author,ch:bk?bk.ch.length:0,cover:!!(bk&&bk.cover),first:bk&&bk.ch[0]&&bk.ch[0].t,
   parts:bk?bk.ch.filter(x=>/, part \d+$/.test(x.t)).length:0,
   txt:bk?await (async()=>{const db=await bkDb();return new Promise(r=>{const q=db.transaction('ch').objectStore('ch').get(bk.id+'/0');q.onsuccess=()=>r(String(q.result||'').slice(0,400));q.onerror=()=>r('')})})():''}});
  const e=c.expect;
  if(e.opens){
   let ok=got.n===1&&got.ch>0,why=[];
   if(!ok)why.push('did not open: '+got.msg);
   if(e.chapters!=null&&got.ch!==e.chapters){ok=false;why.push('chapters '+got.ch+' want '+e.chapters)}
   if(e.minChapters!=null&&got.ch<e.minChapters){ok=false;why.push('chapters '+got.ch+' want >='+e.minChapters)}
   if(e.firstTitle&&got.first!==e.firstTitle){ok=false;why.push('first chapter "'+got.first+'" want "'+e.firstTitle+'"')}
   if(e.cover!=null&&got.cover!==e.cover){ok=false;why.push('cover '+got.cover+' want '+e.cover)}
   if(e.splitParts&&!got.parts){ok=false;why.push('long chapter was not split')}
   if(e.noMojibake&&/Ã|Â|ï¿½|�/.test(got.txt)){ok=false;why.push('mojibake in the text')}
   ck(c.name,ok,ok?got.ch+' chapters'+(got.parts?', '+got.parts+' split parts':'')+(got.cover?', cover kept':''):why.join('; '));
  }else{
   const msg=String(got.msg||'');
   ck(c.name,got.n===0&&e.says.test(msg),got.n?'it opened a book it should have refused':'said: '+JSON.stringify(msg));
  }
 }
 ck('no page errors while importing awkward books',errs.length===0,errs.slice(0,2).join(' | '));
 await b.close();fs.rmSync(dir,{recursive:true,force:true});
 console.log(bad?'book_messy '+bad+' FAILED':'book_messy all passed ('+cases.length+' books)');
 process.exit(bad?1:0);
})();
