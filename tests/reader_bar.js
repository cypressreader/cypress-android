/* Reader toolbar: visible primaries are Back, Save, Listen (plus More, and Focus only in scroll mode); everything else is in the ... menu; one way out; accent only on kicker, its rule, pull quote and progress. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 for(const [W,H,mode] of [[412,860,'vertical'],[1100,800,'vertical'],[1100,800,'paged']]){
  const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:W,height:H}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});
  const r=await p.evaluate(async(mode)=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));
   const now=Date.now();S.feeds.slice(0,4).forEach((f,fi)=>{items[f.id]=Array.from({length:8},(_,i)=>({feedId:f.id,title:'Story '+fi+' '+i+' about unique '+['a','b','c','d','e','f','g','h'][i],link:'https://w.test/'+fi+'/'+i,date:now-(i+fi)*36e5,summary:'A summary of the piece.',img:'',html:'<p>'+'Some article text here. '.repeat(60)+'</p>'}));state[f.id]='ok'});
   S.scroll=mode;S.sel='all';render();await w(500);openReader(cur[0]);await w(1800);
   const vis=[...document.querySelectorAll('#rd .bar button')].filter(b=>getComputedStyle(b).display!=='none'&&b.offsetWidth>0).map(b=>b.id);
   document.querySelector('#mo').click();await w(200);const menu=[...document.querySelectorAll('#mn button')].filter(b=>b.offsetParent).map(b=>b.textContent.trim());
   const kick=document.querySelector('.cols .kick'),cs=kick&&getComputedStyle(kick),lbl=(document.querySelector('#st .bl')||{}).textContent||'';
   return {vis,menu,kickRule:cs&&cs.borderBottomStyle,kickColor:cs&&cs.color,ink:getComputedStyle(document.body).color,lbl}},mode);
  ck(W+' '+mode+' primaries are back, save, listen, more',['cl','st','ra','mo'].every(i=>r.vis.includes(i)),JSON.stringify(r.vis));
  ck(W+' '+mode+' no hamburger, X or page arrows in the bar',!r.vis.includes('fdn')&&!r.vis.includes('pv')&&!r.vis.includes('nx')&&!r.vis.includes('rp')&&!r.vis.includes('wb'),JSON.stringify(r.vis));
  ck(W+' '+mode+' focus eye only in scroll mode',mode==='vertical'?r.vis.includes('fcs'):!r.vis.includes('fcs'),JSON.stringify(r.vis));
  ck(W+' '+mode+' menu holds the rest',['Reading settings','Playback settings','Share','Open in browser','Translate in browser','Full screen','Report junk text'].every(x=>r.menu.includes(x)),JSON.stringify(r.menu));
  ck(W+' '+mode+' kicker has an accent rule',r.kickRule==='solid',JSON.stringify(r));
  if(W>=700)ck(W+' '+mode+' tablet labels under icons',/Save/.test(r.lbl),r.lbl);
  ck(W+' '+mode+' no page errors',!errs.length,errs[0]);await b.close();
 }
 console.log('reader_bar',bad?bad+' FAILED':'all passed');process.exit(bad?1:0);
})();
