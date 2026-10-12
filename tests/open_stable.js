/* B61: opening a story does not shift. The lead photo's room is held before it arrives (a late picture pushes nothing down), the layout chosen for it is the final one, and the text is not shown while the columns are being worked out. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x===undefined?'':x)}else console.log('ok',n)};
const svg=(w,h)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#46a"/><circle cx="60%" cy="35%" r="18%" fill="#fde9b8"/></svg>`;
(async()=>{const b=await chromium.launch();
for(const [W,H,mode] of [[412,860,'page'],[412,860,'vertical'],[1100,800,'page']]){
 const p=await (await b.newContext({viewport:{width:W,height:H}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{n:10});
 await p.route('https://img.test/**',async r=>{await new Promise(x=>setTimeout(x,500));r.fulfill({status:200,contentType:'image/svg+xml',body:svg(1600,1000)})});
 await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(400);
 const r=await p.evaluate(async mode=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const f=S.feeds[0].id,para='<p>'+'Body words go here for the story and keep going to fill the page. '.repeat(30)+'</p>';
  const a={feedId:f,title:'A story with a lead picture that arrives late',link:'https://s.test/story-5',date:Date.now(),summary:'s',img:'https://img.test/lead.svg',html:para+para+para};
  items[f]=[a];state[f]='ok';acPut(a.link,a.html,1);S.sel='all';S.scroll=mode;render();await new Promise(r=>setTimeout(r,300));
  const S0=[];let stop=false;const t0=performance.now();
  const tick=()=>{if(stop)return;const c=document.querySelector('.cols'),bd=document.querySelector('.cols .body'),tt=document.querySelector('.cols .tt');if(c&&bd&&tt){const rt=tt.getBoundingClientRect(),fp=bd.firstElementChild?bd.firstElementChild.getBoundingClientRect():{top:0};S0.push({t:Math.round(performance.now()-t0),tt:Math.round(rt.top),fp:Math.round(fp.top),vis:getComputedStyle(c).opacity==='1'&&!document.querySelector('#rd.rdb')})}requestAnimationFrame(tick)};tick();
  openReader(a);await new Promise(r=>setTimeout(r,1600));stop=true;return {S0,rdb:!!document.querySelector('#rd.rdb')}},mode);
 const tag=W+' '+mode+': ';
 const vis=r.S0.filter(s=>s.vis),first=vis[0];
 ck(tag+'the page ends up visible (not stuck hidden)',!r.rdb&&!!first,JSON.stringify(r.rdb));
 /* once visible, nothing moves more than a few pixels, including when the late picture arrives (500 ms) */
 const mv=first?Math.max(...vis.map(s=>Math.abs(s.tt-first.tt)),...vis.map(s=>Math.abs(s.fp-first.fp))):999;
 ck(tag+'no jump once the text is shown, also when the picture arrives late (max move '+mv+'px)',mv<=10,JSON.stringify(vis.slice(0,3)));
 ck(tag+'no page errors',!errs.length,errs[0]);await p.context().close()}
await b.close();console.log('open_stable',bad?bad+' FAILED':'all passed');process.exit(bad?1:0)})();
