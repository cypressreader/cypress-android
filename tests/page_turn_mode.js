/* Page turns: the book curl is used for every story. A heavy story gets fewer strips (not a flat page), one slow story never makes the rest of the session flat, a stale "flat" choice from an older build is ignored, and the strip count recovers after quick turns. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 const b=await chromium.launch();
 const p=await (await b.newContext({viewport:{width:1100,height:820}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(300);
 const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const f=S.feeds[0];const now=Date.now();
  const body=(i,n)=>Array.from({length:n},(_,k)=>'<p>Story '+i+' paragraph '+k+' '+'words for the story here. '.repeat(30)+'</p>').join('');
  items[f.id]=[6,60].map((n,i)=>({feedId:f.id,title:'Turn story '+i,link:'https://w.test/pt'+i,date:now-i*36e5,summary:'x',img:'',html:body(i,n)}));S.feeds.slice(1).forEach(x=>items[x.id]=[]);state[f.id]='ok';
  S.scroll='paged';S.cont=true;S.sel='all';S.curl=true;S.rmo=false;render();await w(500);
  const o={},slow=()=>({st:[1],N:curlPlan().N,dts:Array(10).fill(55),cap:curlPlan().cap}),fast=()=>({st:[1],N:curlPlan().N,dts:Array(10).fill(12),cap:false});
  const reset=()=>{curlN=0;curlSlow=0;curlFast=0;curlFlat='';curlSeen='';curlRead=true};
  reset();
  openReader(items[f.id][0]);await w(2500);
  o.short=curlPlan();go(1);await w(150);o.shortTurn=R.T?(R.T.st?R.T.st.length:0):-1;await w(1500);
  reset();
  openReader(items[f.id][1]);await w(2500);
  o.long=curlPlan();go(1);await w(150);o.longTurn=R.T?(R.T.st?R.T.st.length:0):-1;await w(1500);
  /* heavy stories: fewer strips, flat only when huge */
  reset();const v=document.querySelector('.view');const base=v.querySelectorAll('*').length;
  const pad=n=>{const x=document.createElement('div');x.id='padx';x.style.display='none';x.innerHTML='<i></i>'.repeat(n);v.append(x)};
  const unpad=()=>{const x=document.getElementById('padx');if(x)x.remove()};
  pad(3000-base);o.heavy=curlPlan();unpad();pad(9000);o.huge=curlPlan();unpad();
  const im=document.createElement('div');im.id='padx';im.style.display='none';im.innerHTML='<img alt="">'.repeat(50);v.append(im);o.pics=curlPlan();unpad();
  /* the slow ratchet: one slow story never makes later stories flat */
  reset();const kA=curlKey();o.b0=curlPlan().N;
  curlTune(slow());o.afterFirst=curlN;           /* first turn of a story is not measured */
  curlTune(slow());curlTune(slow());o.step1=curlN;
  curlTune(slow());curlTune(slow());o.step2=curlN;
  curlTune(slow());curlTune(slow());o.step3=curlN;o.flatKey=curlFlat===kA;o.planA=curlPlan();
  openReader(items[f.id][0]);await w(2500);o.planB=curlPlan();
  /* recovery after quick turns */
  curlSeen=curlKey();curlN=8;curlFast=0;for(let i=0;i<4;i++)curlTune(fast());o.up1=curlN;for(let i=0;i<4;i++)curlTune(fast());o.up2=curlN;
  /* a stale "flat" choice saved by an older build is ignored */
  localStorage.setItem('cy_curl',JSON.stringify({v:APP_VERSION,n:-1}));curlN=0;curlRead=false;curlGet();o.stale=curlN;
  o.diag=mzSum().split('\n').filter(l=>l.indexOf('Page turns')===0)[0]||'';
  reset();
  return o});
 ck('short story turns with the curl',r.short.N>=8&&r.shortTurn>=8,JSON.stringify([r.short,r.shortTurn]));
 ck('long story turns with the curl',r.long.N>=8&&r.longTurn>=8,JSON.stringify([r.long,r.longTurn]));
 ck('heavy story gets fewer strips, not a flat page',r.heavy.N>=6&&r.heavy.N<16&&r.heavy.cap===true,JSON.stringify(r.heavy));
 ck('only a huge story turns flat',r.huge.N===0&&/heavy/.test(r.huge.why),JSON.stringify(r.huge));
 ck('many pictures reduce the strips',r.pics.N>=6&&r.pics.N<16,JSON.stringify(r.pics));
 ck('first turn of a story is not measured',r.afterFirst===0,r.afterFirst);
 ck('two slow turns step the strips down, floor at 8',r.step1===Math.max(8,Math.round(r.b0*.55))&&r.step2===8&&r.step3===8,JSON.stringify([r.b0,r.step1,r.step2,r.step3]));
 ck('a story that is slow even at 8 strips turns flat for that story only',r.flatKey&&r.planA.N===0&&r.planB.N>=8,JSON.stringify([r.planA,r.planB]));
 ck('quick turns bring the strips back up',r.up1===10&&r.up2===0,JSON.stringify([r.up1,r.up2]));
 ck('a saved "flat" choice from an older build is ignored',r.stale===0,r.stale);
 ck('diagnostics list the page turns',/^Page turns: /.test(r.diag),r.diag);
 ck('no page errors',!errs.length,errs[0]);
 await b.close();console.log(bad?'page_turn_mode '+bad+' FAILED':'page_turn_mode all passed');process.exit(bad?1:0);
})();
