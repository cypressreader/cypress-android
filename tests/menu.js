/* Reader More (···) menu: four labelled groups, every action still reachable, fits a phone screen with nothing cut off. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
const WANT={Settings:['settings','rp'],Share:['share','copy','gift'],View:['browser','web','webpref','translate','fullscreen','fdn'],Story:['hub','jump','upnext','unread','junk']};
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
   o.groups={};mn.querySelectorAll('.mg').forEach(g=>{o.groups[g.querySelector('h4').textContent]=[...g.querySelectorAll('button')].map(b=>b.dataset.act)});
   o.headers=mn.querySelectorAll('h4').length;o.labelled=[...mn.querySelectorAll('.mg')].every(g=>g.getAttribute('role')==='group'&&g.getAttribute('aria-labelledby'));
   o.cut=[...mn.querySelectorAll('button:not([hidden])')].filter(b=>{const q=b.getBoundingClientRect();return q.bottom>innerHeight||q.right>innerWidth+1||q.left<-1||q.top<0}).length;
   o.small=[...mn.querySelectorAll('button:not([hidden])')].filter(b=>b.getBoundingClientRect().height<30).length;
   /* an action still works from the grouped menu */
   let copied=false;try{navigator.clipboard.writeText=async()=>{copied=true}}catch(e){}
   mn.querySelector('[data-act="unread"]').click();await w(200);o.menuClosed=mn.hidden;
   return o});
  const t='['+W+'x'+H+'] ';
  ck(t+'menu opens',r.vis,JSON.stringify(r));
  ck(t+'four labelled groups with quiet headers',r.headers===4&&r.labelled&&Object.keys(r.groups).join()==='Settings,Share,View,Story',JSON.stringify(r.groups));
  ck(t+'every action is still in the menu',Object.entries(WANT).every(([g,l])=>l.every(k=>(r.groups[g]||[]).includes(k))),JSON.stringify(r.groups));
  ck(t+'it fits the screen: nothing cut off, no inner scrolling',r.top>=0&&r.bottom<=r.vh&&r.left>=0&&r.right<=r.vw+1&&r.cut===0&&!r.scrolls,JSON.stringify({top:r.top,bottom:r.bottom,vh:r.vh,cut:r.cut,scrolls:r.scrolls}));
  ck(t+'targets stay tappable (30px or taller)',r.small===0,String(r.small));
  ck(t+'choosing an action closes the menu',r.menuClosed);
  ck(t+'no page errors',!errs.length,errs[0]);await p.close();
 }
 await b.close();console.log(bad?'menu '+bad+' FAILED':'menu all passed');process.exit(bad?1:0);
})();
