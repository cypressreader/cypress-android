/* Export PDF inside the Android app. The native share (CyNative.shareFile) is mocked three ways: it resolves, it rejects, it is missing. On native: the PDF goes to the share sheet (never the dead web download), a failure shows the REAL reason (never a generic message), the "ready" note says where to find the file (never "downloads") and its Save PDF button shares again. The Kindle send takes the same route. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x===undefined?'':x)}else console.log('ok',n)};
const seedEdition=async p=>p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const now=Date.now();
 const uw=n=>{let x=(n+3)*7919,o='';for(let k=0;k<6;k++){o+=String.fromCharCode(97+x%26);x=Math.floor(x/26)+k*5+1}return o};
 S.feeds.slice(0,4).forEach((f,fi)=>{items[f.id]=Array.from({length:14},(_,i)=>({feedId:f.id,title:[0,1,2,3].map(k=>uw((fi*14+i)*4+k+40)).join(' '),link:'https://w.test/'+fi+'/'+i,date:now-(i*55+fi*9+30)*6e4,summary:'A standfirst for the story.',img:'',html:'<p>'+('Body text of the story with plenty of words to be real. ').repeat(40)+'</p>'}));state[f.id]='ok'});
 S.sel='today';render();await w(1500)});
/* a fresh app with a mocked native bridge. mode: ok | reject | absent | hang */
async function open(b,mode){
 const ctx=await b.newContext({viewport:{width:412,height:860},acceptDownloads:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(mode=>{window.__calls=[];window.__web=0;window.__dl=0;
  const base={info:async()=>({versionCode:88,versionName:'1.69'})};
  const share=async o=>{window.__calls.push({name:o.name,mime:o.mime,len:(o.data||'').length,email:o.email||'',subject:o.subject||'',head:atob((o.data||'').slice(0,8))});
   if(mode==='reject')throw new Error("Share failed: Couldn't find meta-data for provider with authority com.cypress.reader.cyfiles");
   if(mode==='hang')return new Promise(()=>{});}
  window.Capacitor={isNativePlatform:()=>true,Plugins:{CyNative:mode==='absent'?base:Object.assign({},base,{shareFile:share})}};
  const o=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(this.hasAttribute('download'))window.__web++;return o.apply(this,arguments)};
 },mode);
 await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(400);await seedEdition(p);
 return {ctx,p,errs};
}
const note=p=>p.evaluate(()=>{const t=document.querySelector('#toast');return {msg:t&&t.querySelector('span')?t.querySelector('span').textContent:'',btn:t&&t.querySelector('.tundo')?t.querySelector('.tundo').textContent:'',show:!!(t&&/show/.test(t.className))}});
const waitNote=async(p,re,ms=40000)=>{const end=Date.now()+ms;let n;while(Date.now()<end){n=await note(p);if(re.test(n.msg))return n;await p.waitForTimeout(250)}return n};
(async()=>{
 const b=await chromium.launch();
 /* 1. the native share works */
 {const {ctx,p,errs}=await open(b,'ok');
  const dl=p.waitForEvent('download',{timeout:4000}).catch(()=>null);
  await p.evaluate(()=>exPdf([findStory(DGL[0])]));
  const n=await waitNote(p,/ready/i);
  const c=await p.evaluate(()=>window.__calls);
  ck('ok: the PDF is handed to the native share sheet',c.length===1&&c[0].mime==='application/pdf'&&/\.pdf$/.test(c[0].name)&&c[0].head.startsWith('%PDF'),JSON.stringify(c.map(x=>({n:x.name,m:x.mime,h:x.head,l:x.len}))));
  ck('ok: nothing goes down the web download route',(await p.evaluate(()=>window.__web))===0&&!(await dl));
  ck('ok: the "ready" note says where to find the file and never mentions downloads',/ready/i.test(n.msg)&&!/download/i.test(n.msg),n.msg);
  ck('ok: the note offers Save PDF',n.btn==='Save PDF',n.btn);
  await p.evaluate(()=>{const x=document.querySelector('#toast .tundo');if(x)x.click()});await p.waitForTimeout(1500);
  const c2=await p.evaluate(()=>({calls:window.__calls.length,web:window.__web}));
  ck('ok: Save PDF shares the PDF again through the native share (never the web download)',c2.calls===2&&c2.web===0,JSON.stringify(c2));
  ck('ok: no page errors',!errs.length,errs[0]);await ctx.close()}
 /* 2. the native share fails: the real reason is shown */
 {const {ctx,p,errs}=await open(b,'reject');
  await p.evaluate(()=>exPdf([findStory(DGL[0])]));
  const n=await waitNote(p,/couldn|failed|error/i);
  ck('reject: the real reason is shown',/meta-data for provider with authority com\.cypress\.reader\.cyfiles/.test(n.msg),n.msg);
  ck('reject: it is not the generic message and not "ready"',!/open the share sheet/i.test(n.msg)&&!/PDF is ready/i.test(n.msg),n.msg);
  ck('reject: the note can be copied for a bug report',/copy/i.test(n.btn),n.btn);
  ck('reject: nothing goes down the web download route',(await p.evaluate(()=>window.__web))===0);
  ck('reject: no page errors',!errs.length,errs[0]);await ctx.close()}
 /* 3. the native share is missing from the build */
 {const {ctx,p,errs}=await open(b,'absent');
  await p.evaluate(()=>exPdf([findStory(DGL[0])]));
  const n=await waitNote(p,/couldn|not available|missing|plugin/i);
  ck('absent: it says the share plugin is missing from this build',/shareFile|share plugin|not available/i.test(n.msg)&&!/PDF is ready/i.test(n.msg),n.msg);
  ck('absent: it does not fall back to a web download that does nothing in the app',(await p.evaluate(()=>window.__web))===0);
  ck('absent: no page errors',!errs.length,errs[0]);await ctx.close()}
 /* 4. the native share never answers */
 {const {ctx,p,errs}=await open(b,'hang');
  await p.evaluate(()=>{if(typeof saveFile!=='undefined')saveFile.timeoutMs=1500});
  await p.evaluate(()=>exPdf([findStory(DGL[0])]));
  const n=await waitNote(p,/respond|timed out|did not/i,60000);
  ck('hang: a share that never answers is reported, with the file size',/(did not respond|timed out)/i.test(n.msg)&&/MB|KB/.test(n.msg),n.msg);
  ck('hang: the app is not left stuck (export can be tried again)',(await p.evaluate(()=>EXBUSY))===0);
  ck('hang: no page errors',!errs.length,errs[0]);await ctx.close()}
 /* 5. the Kindle send takes the same route */
 {const {ctx,p,errs}=await open(b,'ok');
  await p.evaluate(()=>{S.kindle='reader@kindle.com';exKindle([findStory(DGL[0])])});
  await waitNote(p,/ready|couldn/i);
  const c=await p.evaluate(()=>window.__calls);
  ck('kindle: the Kindle book (an EPUB, not a PDF) goes to the native share with the Kindle address and subject',c.length===1&&/\.epub$/.test(c[0].name)&&c[0].mime==='application/epub+zip'&&c[0].email==='reader@kindle.com'&&/CyPress/.test(c[0].subject),JSON.stringify(c.map(x=>({e:x.email,s:x.subject}))));
  await ctx.close()}
 {const {ctx,p,errs}=await open(b,'reject');
  await p.evaluate(()=>{S.kindle='reader@kindle.com';exKindle([findStory(DGL[0])])});
  const n=await waitNote(p,/couldn|failed|error/i);
  ck('kindle: a failure shows the real reason too',/provider with authority/.test(n.msg),n.msg);await ctx.close()}
 await b.close();console.log('pdf_export_native',bad?bad+' FAILED':'all passed');process.exit(bad?1:0);
})();
