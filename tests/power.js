/* Power reading: mark time group read, dead-feed note, section jump, compare coverage. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1100,height:860}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});
 const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const now=Date.now();const o={};
  const f=S.feeds[0];const words=n=>Array.from({length:n},(_,i)=>'word'+(i%50)).join(' ');
  items[f.id]=Array.from({length:14},(_,i)=>({feedId:f.id,title:'Distinct headline '+i+' alpha'+i+' beta'+i,link:'https://w.test/'+i,date:now-i*5*36e5,summary:'x',img:''}));
  S.feeds.slice(1).forEach(x=>items[x.id]=[]);state[f.id]='ok';S.read={};S.sel='all';S.atab='latest';render();await w(700);
  const btn=document.querySelector('[data-secread]');o.btn=!!btn;const key=btn&&btn.dataset.secread;const n0=Object.keys(S.read).length;
  btn&&btn.click();await w(500);o.read=Object.keys(S.read).length>n0;
  /* dead feed */
  items[f.id]=items[f.id].map(a=>({...a,date:now-45*864e5}));openFset(f.id);await w(200);o.dead=!$('#fsdead').hidden&&/45 days/.test($('#fsdead').textContent);$('#fset').close();
  items[f.id]=items[f.id].map(a=>({...a,date:now-36e5}));openFset(f.id);await w(200);o.fresh=$('#fsdead').hidden;$('#fset').close();
  /* section jump */
  const sec=i=>`<h2>Part ${i}</h2><p>${words(300)} Part ${i} ends here.</p>`;
  const a=items[f.id][0];a.html=[1,2,3,4].map(sec).join('');a.summary='x';
  S.sel='all';render();await w(300);openReader(a);await w(2500);
  o.heads=rdHeads().length;
  const mo=document.querySelector('#mo');mo&&mo.click();await w(200);const jb=document.querySelector('#mn [data-act="jump"]');o.jumpShown=!!jb&&!jb.hidden;
  document.querySelector('#mn').hidden=true;
  if(rdHeads().length){openJump();await w(200);o.jlist=document.querySelectorAll('#hub [data-jh]').length;document.querySelector('#hub [data-jh="3"]').click();await w(500);o.jumped=!document.querySelector('#hub.on')}
  /* compare */
  const c=items[f.id][2];c.more=[{l:items[f.id][3].link,t:items[f.id][3].title,f:f.id}];
  openReader(c);await w(1200);openHub(c);await w(300);o.cmp=document.querySelectorAll('#hcmp>div').length;
  return o});
 ck('time groups have Mark read',r.btn,JSON.stringify(r));ck('Mark read marks stories',r.read);
 ck('dead-feed note after 30+ quiet days',r.dead);ck('no note for a live feed',r.fresh);
 ck('headings found in a long structured read',r.heads>=3,JSON.stringify(r));ck('Jump to section shown for it',r.jumpShown);ck('section list opens and jumps',r.jlist===4&&r.jumped,JSON.stringify(r));
 ck('compare shows two sources side by side',r.cmp===2,JSON.stringify(r));
 ck('no page errors',errs.length===0,errs.join('|'));
 await b.close();console.log(bad?'FAILED '+bad:'power all passed');process.exit(bad?1:0);
})();
