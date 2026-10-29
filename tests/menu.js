/* Reader More (···) menu, a bottom sheet since polish-2026-10 (J5): a quick row, one column of rows, rarely used ones under More; every action still reachable, fits a phone screen with nothing cut off. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
/* the trimmed menu (B32): 11 actions, plus Save as PDF and Send to Kindle (B66) = 13. Copy link, Translate, Full screen, Show my feeds and the second site-view item are gone on purpose */
const WANT={quick:['save','share','aa','web','tr'],list:['pdf','kindle','hub','jump','upnext'],more:['unread','junk','browser','settings','rp']};
const GONE=['copy','translate','fullscreen','fdn','webpref'];
(async()=>{
 const b=await chromium.launch();
 for(const [W,H] of [[360,640],[412,740],[320,568],[1100,820]]){
  const p=await (await b.newContext({viewport:{width:W,height:H},hasTouch:W<700})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(300);
  const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const f=S.feeds[0];
   const a={feedId:f.id,title:'Menu test',link:'https://w.test/menu',date:Date.now(),summary:'x',img:'',more:[{l:'https://o.test/1',t:'Else',f:f.id}],html:Array.from({length:40},(_,i)=>'<p>Paragraph '+i+' '+'words for the story here. '.repeat(30)+'</p>').join('')};
   a.more=[{l:'https://o.test/1',t:'Elsewhere',f:f.id}];items[f.id]=[a];S.sel='all';render();await w(300);openReader(a);await w(2200);
   document.querySelector('#mo').click();await w(300);
   const mn=document.querySelector('#mn'),rc=mn.getBoundingClientRect(),o={};
   o.vis=!mn.hidden;o.top=rc.top;o.bottom=rc.bottom;o.left=rc.left;o.right=rc.right;o.vh=innerHeight;o.vw=innerWidth;o.scrolls=mn.scrollHeight>mn.clientHeight+1;
   const acts=sel=>[...mn.querySelectorAll(sel)].map(b=>b.dataset.act);
   o.groups={quick:acts('.rshq [data-act]'),list:acts('.rshl>[data-act],.rshl>.rshp>[data-act]'),more:acts('#mnmx [data-act]')};
   o.dialog=mn.getAttribute('role')==='dialog'&&mn.getAttribute('aria-modal')==='true'&&!!mn.getAttribute('aria-labelledby');o.focusIn=mn.contains(document.activeElement);
   o.cut=[...mn.querySelectorAll('button:not([hidden])')].filter(b=>{const q=b.getBoundingClientRect();return q.bottom>innerHeight||q.right>innerWidth+1||q.left<-1||q.top<0}).length;
   o.small=[...mn.querySelectorAll('button:not([hidden])')].filter(b=>b.getClientRects().length&&b.getBoundingClientRect().height<48).length;
   /* an action still works from the grouped menu */
   let copied=false;try{navigator.clipboard.writeText=async()=>{copied=true}}catch(e){}
   mn.querySelector('[data-act="unread"]').click();await w(200);o.menuClosed=mn.hidden;
   return o});
  const t='['+W+'x'+H+'] ';
  ck(t+'menu opens',r.vis,JSON.stringify(r));
  ck(t+'a modal sheet with focus inside',r.dialog&&r.focusIn,JSON.stringify(r));
  ck(t+'the removed actions are really gone',GONE.every(k=>!Object.values(r.groups).some(l=>l.includes(k))),JSON.stringify(r.groups));
  ck(t+'every action is still in the menu',Object.entries(WANT).every(([g,l])=>l.every(k=>(r.groups[g]||[]).includes(k))),JSON.stringify(r.groups));
  ck(t+'it fits the screen: nothing cut off, no inner scrolling',r.top>=0&&r.bottom<=r.vh&&r.left>=0&&r.right<=r.vw+1&&r.cut===0&&!r.scrolls,JSON.stringify({top:r.top,bottom:r.bottom,vh:r.vh,cut:r.cut,scrolls:r.scrolls}));
  ck(t+'targets stay tappable (48px or taller)',r.small===0,String(r.small));
  ck(t+'choosing an action closes the menu',r.menuClosed);
  ck(t+'no page errors',!errs.length,errs[0]);await p.close();
 }
 await b.close();console.log(bad?'menu '+bad+' FAILED':'menu all passed');process.exit(bad?1:0);
})();
