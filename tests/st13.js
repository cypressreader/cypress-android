const {APP}=require('./env');
const {mock,seed,PW}=require('./mock');const {chromium}=require(PW);
let pass=0,fail=0;const log=[];const ck=(n,c,x='')=>{if(c)pass++;else{fail++;log.push(`FAIL ${n} ${x}`)}};
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:1000,height:900}})).newPage();
await mock(p,{n:6});
await p.addInitScript(s=>{try{if(!localStorage.getItem('folio'))localStorage.setItem('folio',JSON.stringify(s))}catch(e){}},seed(['Alpha','Beta','Gamma']));
await p.goto('file://'+APP);await p.waitForTimeout(1500);
const R=await p.evaluate(async()=>{
 const rss=(n,days,txt,h)=>'<?xml version="1.0"?><rss><channel><title>T</title>'+Array.from({length:n},(_,i)=>'<item><title>Story '+i+'</title><link>https://'+(h||'s')+'.test/'+i+'</link><pubDate>'+new Date(Date.now()-days*864e5-i*3600e3).toUTCString()+'</pubDate><description>'+(txt||'short')+'</description></item>').join('')+'</channel></rss>';
 const frag=h=>{const d=document.createElement('div');d.innerHTML=h;const f=document.createDocumentFragment();while(d.firstChild)f.append(d.firstChild);return f};
 const longT='<p>'+'A real paragraph of reporting with many words in it. '.repeat(20)+'</p>';
 const feeds={'https://ok.test/f':rss(5,0),'https://old.test/f':rss(5,400),'https://empty.test/f':'<rss><channel><title>x</title></channel></rss>','https://links.test/f':rss(5,0,'','links'),'https://none.test/f':rss(5,0,'','none')};
 const art={'https://links.test/0':'<p><a href="https://a.test">First great article here</a> <a href="https://b.test">Second great article here</a></p>'.repeat(8),'https://none.test/0':null};
 const of=window.fetchText,og=window.getFull;
 window.fetchText=async u=>{if(u in feeds)return feeds[u];throw new Error('HTTP 404')};
 window.getFull=async u=>{const h=(u in art)?art[u]:longT;return h==null?null:frag(h)};
 const rows=[['','OK site','https://ok.test/f'],['','Old site','https://old.test/f'],['','Empty site','https://empty.test/f'],['','Links site','https://links.test/f'],['','Missing site','https://nope.test/f'],['','None site','https://none.test/f']];
 const res=await Promise.all(rows.map(siteProbe));
 const rep=siteReport(res,'test scope',65);
 window.fetchText=of;window.getFull=og;
 return {res:res.map(r=>[r.name,r.feed,r.art,r.notes.join('|')]),rep}});
const m=Object.fromEntries(R.res.map(r=>[r[0],r]));
ck('ok site is fine',m['OK site'][1]==='ok'&&m['OK site'][2]==='ok',JSON.stringify(m['OK site']));
ck('old site noted as stale',/months/.test(m['Old site'][3]),JSON.stringify(m['Old site']));
ck('empty feed = no stories',m['Empty site'][1]==='no stories');
ck('links site flagged',m['Links site'][2]==='links');
ck('failed fetch reported with reason',/^error: .*404/.test(m['Missing site'][1]),m['Missing site'][1]);
ck('unloadable article flagged',m['None site'][2]==='none');
ck('report has header and counts',/CyPress site check/.test(R.rep)&&/RESULT: 2 fine · 2 with article problems · 2 with no stories/.test(R.rep),R.rep.slice(0,400));
ck('report lists names and addresses of problems',/Missing site \| error/.test(R.rep)&&/https:\/\/links\.test\/f/.test(R.rep));
ck('report lists fine sites by name',/== FINE \(2\)\nOK site, Old site/.test(R.rep),R.rep.slice(-120));
// UI: open dialog, run "My feeds" with a stubbed probe
await p.evaluate(()=>{window.siteProbe=async c=>({name:c[1],url:c[2],feed:'ok',art:'ok',notes:[]})});
await p.evaluate(()=>siteCheckOpen());await p.waitForSelector('#schk [data-k]');
const btns=await p.evaluate(()=>[...document.querySelectorAll('#schk [data-k]')].map(x=>x.textContent));
ck('three scopes offered',btns.length===3&&/My feeds/.test(btns[2]),JSON.stringify(btns));
await p.click('#schk [data-k="2"]');await p.waitForSelector('#schk textarea',{timeout:15000});
const rep2=await p.evaluate(()=>document.querySelector('#schk textarea').value);
ck('UI produces a report for my feeds',/scope: My feeds · 3 sites/.test(rep2)&&/RESULT: 3 fine/.test(rep2),rep2.slice(0,300));
ck('copy and close buttons exist',await p.evaluate(()=>!!document.querySelector('#schk-cp')&&!!document.querySelector('#schk-x2')));
const hasLine=await p.evaluate(()=>!!document.getElementById('schkb'));ck('settings line exists',hasLine);
const sc=await p.evaluate(()=>{const names=new Set(CAT.flatMap(c=>c.f.map(x=>x[0])));return SITE_RETEST.filter(n=>names.has(n)).length});
ck('retest list matches catalogue names',sc>100,String(sc));

// --- leaving the app: pause, retry, resume ---
const P=await p.evaluate(async()=>{
 const out={};const rows=Array.from({length:12},(_,i)=>['','S'+i,'https://s'+i+'.test/f']);
 const calls=[];const setHidden=v=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>v});document.dispatchEvent(new Event('visibilitychange'))};
 localStorage.removeItem('cypress-schk');
 // 1. pause while hidden, carry on when back
 window.siteProbe=async c=>{calls.push(c[1]);await new Promise(r=>setTimeout(r,120));return {name:c[1],url:c[2],feed:'ok',art:'ok',notes:[]}};
 const ui=[];const run=siteCheckRun(rows,'test',(n,t,b,cur,paused)=>ui.push(paused?'paused':'run'));
 await new Promise(r=>setTimeout(r,300));setHidden(true);await new Promise(r=>setTimeout(r,150));const at=calls.length;
 await new Promise(r=>setTimeout(r,700));out.advancedWhileHidden=calls.length-at;
 setHidden(false);const rep=await run;out.total=calls.length;out.sawPaused=ui.includes('paused');out.fullReport=/12 sites/.test(rep)&&/RESULT: 12 fine/.test(rep);
 // 2. a failure that happened while hidden is tried again
 calls.length=0;let first=true;
 window.siteProbe=async c=>{calls.push(c[1]);if(c[1]==='S0'&&first){first=false;setHidden(true);await new Promise(r=>setTimeout(r,100));setTimeout(()=>setHidden(false),200);return {name:c[1],url:c[2],feed:'error: timed out',art:'',notes:[]}}return {name:c[1],url:c[2],feed:'ok',art:'ok',notes:[]}};
 const rep2=await siteCheckRun(rows.slice(0,4),'retry',()=>{});out.retried=calls.filter(x=>x==='S0').length;out.retryFine=/RESULT: 4 fine/.test(rep2);
 // 3. saved progress is offered and used
 localStorage.setItem('cypress-schk',JSON.stringify({label:'saved scope',rows:rows.slice(0,6),res:rows.slice(0,4).map(c=>({name:c[1],url:c[2],feed:'ok',art:'ok',notes:[]})),el:30,ts:Date.now()}));
 calls.length=0;window.siteProbe=async c=>{calls.push(c[1]);return {name:c[1],url:c[2],feed:'ok',art:'ok',notes:[]}};
 siteCheckOpen();await new Promise(r=>setTimeout(r,200));
 const btn=document.querySelector('#schk [data-k="r"]');out.resumeText=btn&&btn.textContent;
 btn.click();for(let i=0;i<60&&!document.querySelector('#schk textarea');i++)await new Promise(r=>setTimeout(r,100));
 out.resumedOnlyRest=calls.slice().sort().join(',');out.resumeReport=document.querySelector('#schk textarea')&&document.querySelector('#schk textarea').value;
 out.savedCleared=localStorage.getItem('cypress-schk')===null;
 // 4. last report offered
 document.querySelector('#schk-x2').click();await new Promise(r=>setTimeout(r,150));siteCheckOpen();await new Promise(r=>setTimeout(r,200));out.lastBtn=!!document.querySelector('#schk [data-k="l"]');
 document.querySelector('#schk-x').click();
 return out});
ck('nothing new starts while the app is in the background',P.advancedWhileHidden<=3,String(P.advancedWhileHidden));
ck('it carries on and finishes all sites after coming back',P.total===12&&P.fullReport,JSON.stringify([P.total,P.fullReport]));
ck('the screen says it is paused',P.sawPaused===true);
ck('a failure that happened in the background is tried again',P.retried===2&&P.retryFine===true,JSON.stringify([P.retried,P.retryFine]));
ck('saved progress is offered with its count',/4 of 6 done/.test(P.resumeText||''),String(P.resumeText));
ck('carrying on only checks what was left',P.resumedOnlyRest==='S4,S5',String(P.resumedOnlyRest));
ck('the report includes the sites done before',/6 sites/.test(P.resumeReport||'')&&/RESULT: 6 fine/.test(P.resumeReport||''),(P.resumeReport||'').slice(0,300));
ck('saved progress is cleared when finished',P.savedCleared===true);
ck('the last report can be shown again',P.lastBtn===true);
console.log(pass+' passed, '+fail+' failed');log.forEach(l=>console.log(l));await b.close()})()
