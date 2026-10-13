/* Export PDF must deliver a real PDF, or say honestly that it could not. Web: the browser really downloads a valid PDF; if the browser ignores the automatic download, the "ready" note offers Save PDF and that works. Android: the file handed to the share sheet decodes to the same PDF. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);const fs=require('fs');
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x===undefined?'':x)}else console.log('ok',n)};
const seedEdition=async p=>p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const now=Date.now();
 const uw=n=>{let x=(n+3)*7919,o='';for(let k=0;k<6;k++){o+=String.fromCharCode(97+x%26);x=Math.floor(x/26)+k*5+1}return o};
 S.feeds.slice(0,4).forEach((f,fi)=>{items[f.id]=Array.from({length:14},(_,i)=>({feedId:f.id,title:[0,1,2,3].map(k=>uw((fi*14+i)*4+k+40)).join(' '),link:'https://w.test/'+fi+'/'+i,date:now-(i*55+fi*9+30)*6e4,summary:'A standfirst for the story.',img:'',html:'<p>'+('Body text of the story with plenty of words to be real. ').repeat(40)+'</p>'}));state[f.id]='ok'});
 S.sel='today';render();await w(1500)});
(async()=>{
 const b=await chromium.launch();
 for(const [W,label] of [[412,'phone'],[1100,'desktop']]){
  /* 1. the browser downloads a real PDF */
  {const ctx=await b.newContext({viewport:{width:W,height:860},acceptDownloads:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
   await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(400);await seedEdition(p);
   const dl=p.waitForEvent('download',{timeout:60000}).catch(()=>null);await p.evaluate(()=>exPdf([findStory(DGL[0])]));const d=await dl;
   let head='',size=0;if(d){const path=await d.path();const buf=fs.readFileSync(path);head=buf.slice(0,5).toString();size=buf.length}
   ck(label+': Export PDF starts a download',!!d);ck(label+': the file is a real PDF',head==='%PDF-'&&size>8000,head+' '+size);
   const note=await p.evaluate(()=>(document.querySelector('#toast')||{}).textContent||'');
   ck(label+': the note says the PDF is ready and offers Save PDF (never "saved" without proof)',/PDF is ready/.test(note)&&/Save PDF/.test(note)&&!/is saved/.test(note),note);
   ck(label+': no page errors',!errs.length,errs[0]);await ctx.close()}
  /* 2. a browser that ignores the automatic download: Save PDF still delivers */
  {const ctx=await b.newContext({viewport:{width:W,height:860},acceptDownloads:true});const p=await ctx.newPage();
   await p.addInitScript(()=>{const o=HTMLAnchorElement.prototype.click;window.__auto=0;HTMLAnchorElement.prototype.click=function(){if(this.hasAttribute('download')&&!window.__allow){window.__auto++;return}return o.apply(this,arguments)}});
   await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(400);await seedEdition(p);
   await p.evaluate(()=>exPdf([findStory(DGL[0])]));await p.waitForSelector('#toast .tundo',{timeout:60000});
   const auto=await p.evaluate(()=>window.__auto);ck(label+': (blocked-download case) the automatic download was attempted and ignored',auto===1,String(auto));
   const dl=p.waitForEvent('download',{timeout:15000}).catch(()=>null);await p.evaluate(()=>{window.__allow=true});await p.click('#toast .tundo');const d=await dl;
   let ok=false;if(d){const buf=fs.readFileSync(await d.path());ok=buf.slice(0,5).toString()==='%PDF-'}
   ck(label+': tapping Save PDF delivers the PDF',ok);await ctx.close()}
 }
 /* 3. Android: what the share sheet receives is the same PDF */
 {const ctx=await b.newContext({viewport:{width:412,height:860}});const p=await ctx.newPage();
  await p.addInitScript(()=>{window.__got=null;window.Capacitor={isNativePlatform:()=>true,Plugins:{CyNative:{info:async()=>({versionCode:1,versionName:'x'}),shareFile:async o=>{window.__got=o}}}}});
  await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(400);await seedEdition(p);
  await p.evaluate(()=>exPdf([findStory(DGL[0])]));await p.waitForFunction(()=>window.__got,null,{timeout:60000}).catch(()=>{});
  const got=await p.evaluate(()=>window.__got&&{name:window.__got.name,mime:window.__got.mime,len:window.__got.data.length});
  ck('android: the share sheet is handed a file',!!got,JSON.stringify(got));
  if(got){const raw=await p.evaluate(()=>window.__got.data);const buf=Buffer.from(raw,'base64');ck('android: it decodes to a real PDF with the right name and type',buf.slice(0,5).toString()==='%PDF-'&&buf.length>8000&&/\.pdf$/.test(got.name)&&got.mime==='application/pdf',buf.slice(0,5).toString()+' '+buf.length+' '+got.name+' '+got.mime)}
  await ctx.close()}
 await b.close();console.log('pdf_export',bad?bad+' FAILED':'all passed');process.exit(bad?1:0);
})();
