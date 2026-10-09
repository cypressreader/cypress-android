/* Single-feed views are composed: one feature, varied modules, no two of the same module in a row, an accent colour, voice under the time headers, a designed caught-up moment. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
const W1=['Why the new chip changes everything','Senate passes sweeping budget deal','Rescue teams reach flooded village','Inside the lab building tomorrow battery','Hands on with the quietest keyboard','Court blocks the merger of two giants','A visual history of the pocket camera','Researchers find water beneath the ice','Streaming prices rise again this autumn','The strange comeback of the flip phone','Airline fined over cancelled flights','New telescope sends back first images','Farmers adopt solar powered tractors','Museum returns stolen statues to Peru','Why cities are banning leaf blowers'];
(async()=>{
 for(const W of [412,1100]){
  const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:W,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});
  const r=await p.evaluate(async(W1)=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const now=Date.now(),w=ms=>new Promise(r=>setTimeout(r,ms));
   const f=S.feeds[1];items[f.id]=Array.from({length:30},(_,i)=>({feedId:f.id,title:W1[(i*4)%15]+' '+['alpha','bravo','charlie','delta','echo','foxtrot','golf','hotel','india','juliet'][i%10]+i,link:'https://w.test/'+i,date:now-i*2.5*36e5,summary:'A standfirst long enough to serve as a deck for the piece in question, in a couple of lines.',img:i%3===1?'':'data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#369"/></svg>')}));
   S.feeds.filter(x=>x!==f).forEach(x=>items[x.id]=[]);S.welcome=0;S.sel='s:'+f.id;_lastSel=null;WIRE.order=null;WIRE.settled=true;render();await w(900);for(let i=0;i<60;i++)NRMORE&&NRMORE();await w(300);
   const g=document.querySelector('#grid'),mods=[...g.children].map(e=>e.className.split(' ').find(c=>/^(fd-feat|fd-pair|fd-decks|fd-brief|fd-voice|wthr|card|wsec|wsec-v)$/.test(c))||'').filter(x=>x&&x!=='wsec-v'&&x!=='wsec');
   let same=0;for(let i=1;i<mods.length;i++)if(mods[i]===mods[i-1]&&mods[i]!=='card')same++;
   const out={fed:g.classList.contains('fed'),feat:g.querySelectorAll('.fd-feat').length,kinds:[...new Set(mods)],same,accent:getComputedStyle(g).getPropertyValue('--fa').trim()!=='',voice:g.querySelectorAll('.wsec-v').length};
   items[f.id].forEach(a=>S.read[a.link]=1);_lastSel=null;render();await w(700);for(let i=0;i<60;i++)NRMORE&&NRMORE();await w(200);out.caught=(g.querySelector('.wcaught h3')||{}).textContent||'';
   return out},W1);
  ck(W+' feed view is composed',r.fed&&r.feat===1,JSON.stringify(r));
  ck(W+' at least 3 module kinds',r.kinds.filter(k=>/^fd-/.test(k)).length>=3,JSON.stringify(r.kinds));
  ck(W+' no module twice in a row',r.same===0,JSON.stringify(r));
  ck(W+' accent set',r.accent);ck(W+' time headers have voice',r.voice>=1);
  ck(W+' caught-up names the feed',/Caught up with/.test(r.caught),r.caught);
  ck(W+' no page errors',!errs.length,errs[0]);await b.close();
 }
 console.log('feed_rhythm',bad?bad+' FAILED':'all passed');process.exit(bad?1:0);
})();
