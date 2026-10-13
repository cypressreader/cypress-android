/* Side-by-side reading (B50): opt-in (off by default); when on and the screen is wide enough (including the nearly square unfolded phone), a tapped story opens beside the list instead of covering it. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{console.log((ok?'ok ':'FAIL ')+n+(ok?'':' '+(x||'')));if(!ok)bad++};
(async()=>{const b=await chromium.launch();
for(const [W,H] of [[1100,800],[900,810],[412,860]]){
 const p=await (await b.newContext({viewport:{width:W,height:H}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{n:10});
 await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(400);
 const t=`[${W}x${H}] `;
 const run=async on=>p.evaluate(async on=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const now=Date.now();S.feeds.slice(0,4).forEach((f,fi)=>{items[f.id]=Array.from({length:8},(_,i)=>({feedId:f.id,title:'Story '+fi+' '+i+' about unique '+['a','b','c','d','e','f','g','h'][i],link:'https://w.test/'+fi+'/'+i,date:now-(i+fi)*36e5,summary:'A sentence of summary.',img:''}))});S.split=on;S.sel='all';save();render();screenMode();await w(500);
  const g=document.querySelector('#grid .card');openReader(cur[0]);await w(1500);const rd=document.getElementById('rd').getBoundingClientRect(),m=document.querySelector('main').getBoundingClientRect();
  return{split:document.body.classList.contains('split'),rdLeft:Math.round(rd.left),rdW:Math.round(rd.width),mainW:Math.round(m.width),mainVisible:m.width>150&&getComputedStyle(document.querySelector('main')).visibility!=='hidden',on:document.getElementById('rd').classList.contains('on')}},on);
 const off=await run(false);ck(t+'off by default: the story covers the list (no side-by-side)',!off.split,JSON.stringify(off));
 await p.evaluate(()=>{try{closeRd()}catch(e){}});
 const on=await run(true);
 if(W>=840){ck(t+'on: list on the left, story on the right, both visible',on.split&&on.mainVisible&&on.rdLeft>=on.mainW-4&&on.rdW>=300,JSON.stringify(on))}
 else ck(t+'on a phone: stays a normal full-screen reader',!on.split,JSON.stringify(on));
 ck(t+'no page errors',!errs.length,errs[0]);await p.context().close()}
await b.close();console.log(bad?'side_reading '+bad+' FAILED':'side_reading all passed');process.exit(bad?1:0)})();
