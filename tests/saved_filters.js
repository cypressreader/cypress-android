/* Saved shelf and History (B57, B58): "Time I have" really filters the saved list; Clear history asks, clears, and says so (with Undo). */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{console.log((ok?'ok ':'FAIL ')+n+(ok?'':' '+(x||'')));if(!ok)bad++};
(async()=>{const b=await chromium.launch();
for(const [W,H] of [[412,860],[1100,800]]){
 const p=await (await b.newContext({viewport:{width:W,height:H}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{n:10});
 await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(400);
 const t=`[${W}] `;
 await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const now=Date.now();const f=S.feeds[0];
  S.saved=[3,4,12,14,22,40].map((m,i)=>({feedId:f.id,title:'Saved story '+i+' ('+m+' min)',link:'https://s.test/'+i,date:now-i*1e5,summary:'x',img:'',wc:m*230}));
  S.svmin=0;S.sel='saved';save();render();await new Promise(r=>setTimeout(r,700))});
 const count=()=>p.evaluate(()=>document.querySelectorAll('#grid .card').length);
 const all=await count();ck(t+'saved shelf shows every saved story at first',all===6,all);
 await p.click('[data-svmin="15"]');await p.waitForTimeout(500);
 const n15=await count(),on15=await p.evaluate(()=>document.querySelector('[data-svmin="15"]').getAttribute('aria-pressed'));
 ck(t+'"15 min" keeps only stories of 15 minutes or less (4 of 6)',n15===4&&on15==='true',JSON.stringify({n15,on15}));
 await p.click('[data-svmin="5"]');await p.waitForTimeout(500);ck(t+'"5 min" narrows it further (2 of 6)',(await count())===2);
 await p.click('[data-svmin="0"]');await p.waitForTimeout(500);ck(t+'"Any" brings everything back',(await count())===6);
 /* history */
 await p.evaluate(async()=>{const now=Date.now();S.hist=[0,1,2].map(i=>({l:'https://h.test/'+i,t:now-i*1e5,ti:'Read story '+i,fid:S.feeds[0].id,ft:'x',fu:'',img:''}));save();S.sel='hist';render();await new Promise(r=>setTimeout(r,700))});
 await p.click('[data-hclear]');await p.waitForTimeout(500);
 const dlg=await p.evaluate(()=>{const d=document.querySelector('dialog[open]');return d?d.textContent.slice(0,120):''});
 ck(t+'Clear history asks first and says how many entries',/clear history/i.test(dlg)&&/3 entr/.test(dlg),dlg);
 const ok=await p.evaluate(()=>{const d=document.querySelector('dialog[open]');const bt=[...d.querySelectorAll('button')].find(x=>/clear|remove|yes|ok/i.test(x.textContent)&&!/cancel/i.test(x.textContent));if(bt)bt.click();return !!bt});await p.waitForTimeout(800);
 const after=await p.evaluate(()=>({n:(S.hist||[]).length,toast:(document.querySelector('#toast')||{}).textContent||''}));
 ck(t+'confirming clears the history and a note says so',ok&&after.n===0&&/clear|undo/i.test(after.toast),JSON.stringify(after));
 ck(t+'no page errors',!errs.length,errs[0]);await p.context().close()}
await b.close();console.log(bad?'saved_filters '+bad+' FAILED':'saved_filters all passed');process.exit(bad?1:0)})();
