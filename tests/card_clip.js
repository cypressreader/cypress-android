/* B104: a long headline (an MCU slate announcement, with long words and colons) is never cut off at the top of its picture, in any image-led card type, at phone and tablet widths and with the text enlarged: a card whose text is taller than its shape grows instead of clipping. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0,n=0;const ck=(nm,ok,x)=>{n++;if(!ok){bad++;console.log('FAIL',nm,x||'')}};
const svg=()=>`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000"><rect width="100%" height="100%" fill="#3b6ea5"/></svg>`;
const T='Marvel Studios Confirms Avengers: Doomsday, Secret Wars, Spider-Man: Brand New Day And Three Surprise Disney+ Series In One Huge Slate Announcement Today';
const KINDS=['nr nr-hero','nr nr-lead','nr nr-lead nr-wide','nr nr-tall','nr nr-sp','nr nr-sm2','nr nr-hs','lead','mid'];
(async()=>{const b=await chromium.launch();
 for(const [W,H] of [[320,640],[360,740],[412,860],[820,1180]])for(const scale of [1,1.5]){
  const p=await (await b.newContext({viewport:{width:W,height:H}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{n:5});
  await p.route('https://img.test/**',r=>r.fulfill({status:200,contentType:'image/svg+xml',body:svg()}));
  await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(300);
  await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
  if(scale>1)await p.addStyleTag({content:'#grid .card h3{font-size:calc(1em*'+scale+')!important}#grid .card p{font-size:calc(1em*'+scale+')!important}#grid .card .tx small,#grid .card .tx .k{font-size:calc(1em*'+scale+')!important}'});
  const r=await p.evaluate(async ([KINDS,T])=>{const f=S.feeds[0];const a={feedId:f.id,title:T,link:'https://w.test/x',date:Date.now()-6e4,summary:'A standfirst long enough to serve as a deck for the story in a couple of lines, and then a little more.',img:'https://img.test/x.svg',html:''};
   items[f.id]=[a];S.sel='all';render();const g=document.getElementById('grid');g.innerHTML='';const out=[];
   for(const k of KINDS){g.insertAdjacentHTML('beforeend',card(a,0,k));const c=g.lastElementChild;c.scrollIntoView();/* an offscreen card shows its placeholder height (content-visibility), not its real layout */cardGrow();await new Promise(r=>setTimeout(r,120));const cr=c.getBoundingClientRect();
    const t=c.querySelector('.tx')||c.querySelector('h3');const tr=t.getBoundingClientRect();const h=c.querySelector('h3,h2');const hr=h.getBoundingClientRect();
    out.push({k,w:Math.round(cr.width),h:Math.round(cr.height),topGap:Math.round(hr.top-cr.top),botGap:Math.round(cr.bottom-hr.bottom),txTop:Math.round(tr.top-cr.top)})}
   out.push(await (async()=>{const now=Date.now();S.feeds.slice(0,4).forEach((ff,fi)=>{items[ff.id]=Array.from({length:16},(_,i)=>({feedId:ff.id,title:i<3&&fi===0?T:'Headline number '+i+' of feed '+fi,link:'https://w.test/'+fi+'/'+i,date:now-(i*55+fi*9+5)*6e4,summary:'A standfirst long enough to serve as a deck for the story in a couple of lines.',img:i<9?'https://img.test/x'+i+'.svg':'',html:''}));state[ff.id]='ok'});S.sel='today';render();await new Promise(r=>setTimeout(r,900));
    let worst=0,nn=0;document.querySelectorAll('#grid .card').forEach(c=>{const t=c.querySelector(':scope>.tx');if(!t)return;const cr=c.getBoundingClientRect();if(!cr.width)return;nn++;worst=Math.min(worst,Math.round(t.getBoundingClientRect().top-cr.top))});
    return {k:'real Today render ('+nn+' cards)',w:0,h:0,topGap:worst,botGap:0,txTop:worst}})());
   return out},[KINDS,T]);
  for(const o of r)ck(`${W}px x${scale} ${o.k}: headline starts inside the card (${o.topGap}px from the top)`,o.topGap>=0&&o.botGap>=-1&&o.txTop>=-1,JSON.stringify(o));
  ck(`${W}px x${scale}: no page errors`,!errs.length,errs[0]);await p.close()}
 await b.close();console.log(bad?'FAILED '+bad+' of '+n:'card_clip all '+n+' passed');process.exit(bad?1:0)})();
