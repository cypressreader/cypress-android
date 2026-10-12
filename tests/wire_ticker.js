/* B62: the WIRE ticker is a short strip (4 headlines, each cut at about 46 characters), so the moving layer stays far below a phone GPU's texture limit, and it still moves */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x===undefined?'':x)}else console.log('ok',n)};
(async()=>{const b=await chromium.launch();
for(const W of [360,412,1100]){
 const p=await (await b.newContext({viewport:{width:W,height:860}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{n:10});
 await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(400);
 const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const now=Date.now();S.feeds.slice(0,4).forEach((f,fi)=>{items[f.id]=Array.from({length:16},(_,i)=>({feedId:f.id,title:'Headline number '+i+' of feed '+fi+' about the subject '+(i*7+fi)+' and a great many more words in the title that go on and on',link:'https://w.test/'+fi+'/'+i,date:now-(i*55+fi*9+5)*6e4,summary:'x',img:'',html:''}));state[f.id]='ok'});
  S.sel='digest';S.dgk='';render();await new Promise(r=>setTimeout(r,1200));
  const t=document.querySelector('.wtick-in');if(!t)return{none:1};const x0=t.getBoundingClientRect().left;await new Promise(r=>setTimeout(r,1500));const x1=t.getBoundingClientRect().left;
  return{w:Math.round(t.scrollWidth),n:t.querySelectorAll('span').length,longest:Math.max(...[...t.querySelectorAll('span')].map(s=>s.textContent.length)),moved:Math.round(x0-x1)}});
 const tag=W+': ';
 ck(tag+'the ticker is there',!r.none,JSON.stringify(r));if(r.none){await p.context().close();continue}
 ck(tag+'the moving strip is under 3600 px wide ('+r.w+')',r.w<3600,String(r.w));
 ck(tag+'each headline is cut short ('+r.longest+' characters at most)',r.longest<=70,String(r.longest));
 ck(tag+'it moves',r.moved>5,String(r.moved));
 ck(tag+'no page errors',!errs.length,errs[0]);await p.context().close()}
await b.close();console.log('wire_ticker',bad?bad+' FAILED':'all passed');process.exit(bad?1:0)})();
