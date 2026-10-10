/* The badge on a card means "saved for offline", not "read": it carries an offline icon and name, a tap explains it, the tips list a legend, and nothing that downloads a story marks it read. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 const b=await chromium.launch();
 for(const W of [412,1100]){
  const p=await (await b.newContext({viewport:{width:W,height:860}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(300);
  const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const f=S.feeds[0];const now=Date.now();
   items[f.id]=Array.from({length:8},(_,i)=>({feedId:f.id,title:'Ready story '+i,link:'https://w.test/rd'+i,date:now-i*36e5,summary:'x',img:'',html:'<p>'+'Words for the story. '.repeat(120)+'</p>'}));S.feeds.slice(1).forEach(x=>items[x.id]=[]);state[f.id]='ok';
   S.read={};S.sel='all';render();await w(600);
   const links=items[f.id].map(a=>a.link),o={};
   /* a story gets downloaded for offline reading: the badge appears, the story is not read */
   acPut(links[0],'<p>'+'Words for the story. '.repeat(400)+'</p>');markReady(links[0]);await w(500);
   const card=[...document.querySelectorAll('#grid .card')].find(c=>chref(c)===links[0]),bd=card&&card.querySelector('.rdy');
   o.badge=!!bd;o.label=bd&&bd.getAttribute('aria-label');o.title=bd&&bd.getAttribute('title');o.noTick=bd&&!/m5 12\.5 4\.5 4\.5L19 7\.5/.test(bd.innerHTML);
   o.readAfterDownload=!!S.read[links[0]];o.readClass=card&&card.classList.contains('read');
   /* preloading the next story is not reading it */
   try{R.ctx=items[f.id].slice();curA=items[f.id][0];await preloadNext()}catch(e){}
   o.readAfterPreload=Object.keys(S.read).length;
   /* a tap on the badge explains and does not open the story */
   let opened=false;const oo=openReader;window.openReader=function(){opened=true;return oo.apply(this,arguments)};
   if(bd)bd.click();await w(300);o.toast=(document.querySelector('.toast,#toast')||{}).textContent||'';o.opened=opened;window.openReader=oo;
   /* opening a long story and leaving at once is a bounce, not a read */
   items[f.id][3].html='<p>'+'Words for the story. '.repeat(2500)+'</p>';openReader(items[f.id][3]);await w(1800);closeRd();await w(400);o.bounce=!!S.read[links[3]];
   /* legend in the tips */
   openTips();await w(200);o.tips=document.querySelector('#tipslist').textContent;document.querySelector('#tips').close();
   return o});
  const t='['+W+'] ';
  ck(t+'the badge appears for a story saved for offline',r.badge,JSON.stringify(r));
  ck(t+'it is named for what it is (offline), not "Ready" or "read"',/offline/i.test(r.label||'')&&/offline/i.test(r.title||'')&&!/\bread\b/i.test(r.label||''),JSON.stringify([r.label,r.title]));
  ck(t+'it is not drawn as a tick',r.noTick);
  ck(t+'downloading a story does not mark it read',!r.readAfterDownload&&!r.readClass&&r.readAfterPreload===0,JSON.stringify([r.readAfterDownload,r.readClass,r.readAfterPreload]));
  ck(t+'tapping it explains it and does not open the story',/offline/i.test(r.toast)&&r.opened===false,JSON.stringify([r.toast,r.opened]));
  ck(t+'opening a long story and leaving at once does not mark it read',r.bounce===false,String(r.bounce));
  ck(t+'the tips carry a legend for it',/saved on your device/i.test(r.tips)&&/not mean you have read/i.test(r.tips));
  ck(t+'no page errors',!errs.length,errs[0]);await p.close();
 }
 await b.close();console.log(bad?'ready_mark '+bad+' FAILED':'ready_mark all passed');process.exit(bad?1:0);
})();
