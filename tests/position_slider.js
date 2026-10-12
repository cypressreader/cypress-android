/* "Position in story" slider: its value follows where you are (0 at the top, 100 at the end), in scrolling and page mode, never a constant 50. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x===undefined?'':x)}else console.log('ok',n)};
(async()=>{
 const b=await chromium.launch();
 for(const mode of ['vertical','page']){
  const p=await (await b.newContext({viewport:{width:412,height:860}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(400);
  const r=await p.evaluate(async mode=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const now=Date.now();
   S.feeds.slice(0,2).forEach((f,fi)=>{items[f.id]=Array.from({length:6},(_,i)=>({feedId:f.id,title:'Story '+fi+i+' about unique topic '+i,link:'https://w.test/'+fi+'/'+i,date:now-(i+fi)*36e5,summary:'A summary.',img:'',html:Array.from({length:40},(_,k)=>'<p>Paragraph '+k+' of a long article. '+'Words to fill the line and make the page long enough. '.repeat(6)+'</p>').join('')}));state[f.id]='ok'});
   S.scroll=mode==='page'?'page':'vertical';S.sel='all';render();await w(500);openReader(cur[0]);await w(2200);
   const d=$('#dial'),o={mode,vals:[],hidden:d.hidden,tab:d.tabIndex,role:d.getAttribute('role')};
   const rd=()=>({n:d.getAttribute('aria-valuenow'),t:d.getAttribute('aria-valuetext'),min:d.getAttribute('aria-valuemin'),max:d.getAttribute('aria-valuemax')});
   o.top=rd();
   if(mode==='vertical'){const v=vView();o.scrollable=v.scrollHeight-v.clientHeight;v.scrollTop=(v.scrollHeight-v.clientHeight)/2;await w(500);o.mid=rd();v.scrollTop=v.scrollHeight;await w(500);o.end=rd()}
   else{o.np=R.np;R.pg=Math.floor((R.np-1)/2);show();await w(500);dialSync();o.mid=rd();R.pg=R.np-1;show();await w(500);dialSync();o.end=rd()}
   return o},mode);
  const t=mode+': ';
  ck(t+'the slider is reachable by keyboard and has a range',r.tab===0&&r.top.min==='0'&&r.top.max==='100'&&r.role==='slider',JSON.stringify([r.tab,r.top,r.role]));
  ck(t+'at the top it reads 0, not 50',+r.top.n<=5,JSON.stringify(r.top));
  ck(t+'in the middle it reads about half',+r.mid.n>=25&&+r.mid.n<=75,JSON.stringify(r.mid));
  ck(t+'at the end it reads about 100, not 50',+r.end.n>=90,JSON.stringify(r.end));
  ck(t+'it says it in words too',/story/i.test(r.mid.t||'')&&/End of the story/.test(r.end.t||'')||+r.end.n>=90&&/(End|%)/.test(r.end.t||''),JSON.stringify([r.mid.t,r.end.t]));
  ck(t+'no page errors',!errs.length,errs[0]);await p.context().close();
 }
 await b.close();console.log('position_slider',bad?bad+' FAILED':'all passed');process.exit(bad?1:0);
})();
