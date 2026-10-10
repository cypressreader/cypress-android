/* The story so far: developing-story timeline with dots (first reported, updates, latest, you are here), in both reader modes. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 for(const [W,mode] of [[412,'vertical'],[1100,'vertical'],[1100,'paged']]){
  const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:W,height:860}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});
  const r=await p.evaluate(async(mode)=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const now=Date.now(),H=36e5;
   const f=S.feeds[0],g=S.feeds[1];
   const mk=(fd,t,h,i)=>({feedId:fd.id,title:t,link:'https://w.test/'+i,date:now-h*H,summary:'x',img:'',html:'<p>'+'Body text here. '.repeat(60)+'</p>'});
   const A=mk(f,'Senate budget deal reached after long talks',30,1),B=mk(g,'Senate budget deal vote delayed until Friday',20,2),C=mk(f,'Senate passes budget deal with narrow majority',8,3),D=mk(g,'Senate budget deal signed into law by president',1,4);
   items[f.id]=[A,C];items[g.id]=[B,D];S.feeds.slice(2).forEach(x=>items[x.id]=[]);state[f.id]=state[g.id]='ok';
   S.scroll=mode;S.sel='all';render();await w(400);openReader(C);await w(1800);
   const t=document.querySelector('.rprev');
   return {has:!!t,n:t?t.querySelectorAll('li').length:0,labels:t?[...t.querySelectorAll('li em')].map(e=>e.textContent):[],now:t?t.querySelectorAll('li.now strong').length:0,btns:t?t.querySelectorAll('button[data-prev]').length:0,vis:t?t.getBoundingClientRect().height>40:false,dots:t?getComputedStyle(t.querySelector('li'),'::before').width:''}},mode);
  ck(W+' '+mode+' timeline shows',r.has&&r.n===4,JSON.stringify(r));
  ck(W+' '+mode+' first reported, updates, latest',r.labels[0]==='First reported'&&r.labels[r.n-1]==='Latest'&&/Update/.test(r.labels[1]),JSON.stringify(r.labels));
  ck(W+' '+mode+' marks where you are',r.now===1&&r.btns===3,JSON.stringify(r));ck(W+' '+mode+' is visible',r.vis);
  ck(W+' '+mode+' no page errors',!errs.length,errs[0]);await b.close();
 }
 console.log('timeline',bad?bad+' FAILED':'all passed');process.exit(bad?1:0);
})();
