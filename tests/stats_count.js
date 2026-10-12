/* Stats count what happened: a story is "opened" once (reopening or a redraw does not add another), and "read to the end" when you reach the bottom (including a short story that fits on the screen). */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x===undefined?'':x)}else console.log('ok',n)};
(async()=>{
 const b=await chromium.launch();
 for(const mode of ['vertical','page']){
  const p=await (await b.newContext({viewport:{width:412,height:860}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(400);
  const r=await p.evaluate(async mode=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const now=Date.now();
   const uw=n=>{let x=(n+3)*7919,o='';for(let k=0;k<6;k++){o+=String.fromCharCode(97+x%26);x=Math.floor(x/26)+k*5+1}return o};
   S.feeds.slice(0,4).forEach((f,fi)=>{items[f.id]=Array.from({length:8},(_,i)=>({feedId:f.id,title:[0,1,2,3].map(k=>uw((fi*8+i)*4+k+40)).join(' '),link:'https://w.test/'+fi+'/'+i,date:now-(i*55+fi*9+30)*6e4,summary:'A standfirst.',img:'',html:Array.from({length:40},(_,k)=>'<p>Paragraph '+k+' of the article. '+'Words to fill the line. '.repeat(8)+'</p>').join('')}));state[f.id]='ok'});
   S.scroll=mode==='page'?'page':'vertical';S.st={d:{},src:{},tp:{},hr:Array(24).fill(0),fin:{}};S.read={};S.prog={};S.sel='all';render();await w(900);
   const k=dayKey(),o={},all=S.feeds.flatMap(f=>items[f.id]||[]);const get=l=>all.find(a=>a.link===l);
   /* reopening the same story three times */
   for(let i=0;i<3;i++){if(document.querySelector('#rd.on'))closeRd();await w(250);openReader(get('https://w.test/1/0'));await w(900)}
   o.afterReopen=(S.st.d[k]||{}).n;
   /* a redraw of the open story (a setting change) */
   try{refreshReader()}catch(e){}await w(500);o.afterRedraw=(S.st.d[k]||{}).n;
   closeRd();await w(250);
   /* four different stories, each read to the very end */
   for(const l of ['https://w.test/1/0','https://w.test/2/0','https://w.test/3/0','https://w.test/0/1']){
    openReader(get(l));await w(1800);
    if(mode==='vertical'){const v=vView();for(let s=0;s<14;s++){v.scrollTop=v.scrollTop+v.clientHeight*.9;await w(100)}v.scrollTop=v.scrollHeight;await w(600)}
    else{const E=R.ep!=null?R.ep:R.np-1;for(let s=0;s<E;s++){go(1);await w(900)}await w(400)}
    closeRd();await w(300)}
   o.n4=(S.st.d[k]||{}).n;o.f4=(S.st.d[k]||{}).f;
   /* the numbers on the Stats screen */
   S.sel='stats';render();await w(900);o.tiles=[...document.querySelectorAll('.tile')].map(t=>t.textContent.trim().replace(/\s+/g,' ')).slice(0,4);
   return o},mode);
  const t=mode+': ';
  ck(t+'reopening a story three times counts it once',r.afterReopen===1,String(r.afterReopen));
  ck(t+'a redraw of the open story adds nothing',r.afterRedraw===1,String(r.afterRedraw));
  ck(t+'four different stories opened are counted as 4 (no extras)',r.n4===4,String(r.n4));
  ck(t+'each of the four, read to the bottom, counts as read to the end',r.f4===4,String(r.f4));
  ck(t+'the Stats tiles show the same numbers',r.tiles.some(x=>/^4\s*stories opened/.test(x))&&r.tiles.some(x=>/^4\s*read to the end/.test(x)),JSON.stringify(r.tiles));
  ck(t+'no page errors',!errs.length,errs[0]);await p.context().close();
 }

 /* a story that fits on the screen: on a tall screen a medium story is entirely visible, and counts as read to the end after a few seconds */
 for(const mode of ['vertical','page']){
  const p=await (await b.newContext({viewport:{width:412,height:3200}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(400);
  const r=await p.evaluate(async mode=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const now=Date.now();
   S.feeds.slice(0,1).forEach(f=>{items[f.id]=[{feedId:f.id,title:'A medium story that fits a tall screen',link:'https://w.test/medium',date:now-1e4,summary:'Medium.',img:'',html:Array.from({length:10},(_,k)=>'<p>Paragraph '+k+' of the story. '+'Words to fill the line. '.repeat(8)+'</p>').join('')}];state[f.id]='ok'});
   S.scroll=mode==='page'?'page':'vertical';S.st={d:{},src:{},tp:{},hr:Array(24).fill(0),fin:{}};S.read={};S.prog={};S.sel='all';render();await w(800);
   openReader(cur[0]);await w(1800);const before=Object.keys(S.st.fin).length;await w(5200);return {before,after:Object.keys(S.st.fin).length,f:(S.st.d[dayKey()]||{}).f}},mode);
  ck(mode+': a story that is entirely on screen is not counted at once but is after a few seconds',r.before===0&&r.after===1&&r.f===1,JSON.stringify(r));
  ck(mode+' (tall screen): no page errors',!errs.length,errs[0]);await p.context().close();
 }
 await b.close();console.log('stats_count',bad?bad+' FAILED':'all passed');process.exit(bad?1:0);
})();
