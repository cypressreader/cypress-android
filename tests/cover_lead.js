/* Today cover follow-up: the cover leads full-bleed at every width, admin chrome is one quiet line beneath it, the cover story appears once. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 const b=await chromium.launch();
 for(const [W,H] of [[1180,820],[1024,768],[412,860]])for(const t of ['photo','type','min']){
  const p=await (await b.newContext({viewport:{width:W,height:H}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(400);
  const r=await p.evaluate(async([t])=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const now=Date.now();
   S.feeds.slice(0,4).forEach((f,fi)=>{items[f.id]=Array.from({length:16},(_,i)=>({feedId:f.id,title:'Distinct headline '+i+' feed'+fi+' sub'+(i*7+fi),link:'https://w.test/'+fi+'/'+i,img:'data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#468"/></svg>'),date:now-(i*55+fi*9)*6e4,summary:'A long enough summary of this story to count as a lede for sure here, with several words.'}))});
   const n=Math.floor(Date.UTC(new Date().getFullYear(),new Date().getMonth(),new Date().getDate())/864e5);S.cvt={n,t,p:''};S.sel='today';render();await w(1300);
   const g=document.querySelector('#grid'),cv=g.querySelector(':scope>.dcov'),o={};
   o.cover=!!cv;o.noPane=!g.querySelector('.d2,.d2l,.d2r');
   const main=document.querySelector('main').getBoundingClientRect(),cr=cv?cv.getBoundingClientRect():{width:0,height:0};
   o.bleed=cr.width>=main.width-4;o.tall=cr.height>=Math.min(innerHeight*.6,500);o.cls=cv&&cv.className.includes('dct-'+t);
   const nx=cv&&cv.nextElementSibling;o.meta=!!(nx&&nx.classList.contains('dmeta'));
   o.metaH=nx?nx.getBoundingClientRect().height:999;
   o.loose=[...g.querySelectorAll(':scope>.dateline,:scope>.dexp,:scope>.dtd,:scope>.dgp')].length;
   o.btns=[...g.querySelectorAll('.dmeta .dma .dexp')].filter(b=>{const r=b.getBoundingClientRect();return r.width>20&&r.height>10&&r.right<=innerWidth+1&&r.left>=0}).length;
   const lead=cur[0];o.once=[...g.querySelectorAll('.droy, .droy-k')].length===0&&[...g.querySelectorAll('a,h2,h3')].filter(a=>!cv.contains(a)&&a.textContent.trim()===lead.title).length===0;
   o.names=[...g.querySelectorAll('.dmeta .dma .dexp')].map(b=>b.textContent+'/'+(b.getAttribute('aria-label')||'')).join('|');const d=g.querySelector('.dmeta details');d&&(d.open=true);await w(100);o.openOk=!d||d.querySelector('.dmb').children.length>=1;
   return o},[t]);
  const tag='['+W+' '+t+'] ';
  ck(tag+'cover is full-bleed and leads',r.cover&&r.bleed&&r.tall&&r.noPane&&r.cls,JSON.stringify(r));
  ck(tag+'admin chrome is one quiet line',r.meta&&r.metaH<150&&r.loose===0&&r.btns===4,JSON.stringify(r));
  ck(tag+'actions visible without opening anything: '+r.names,/Catch me up/.test(r.names)&&/Export PDF/.test(r.names)&&/Share cover/.test(r.names)&&/Kindle/.test(r.names));ck(tag+'rest folds away',r.openOk);ck(tag+'cover story appears once',r.once);ck(tag+'no page errors',errs.length===0,errs.join('|'));
  await p.close();
 }
 await b.close();console.log(bad?'FAILED '+bad:'cover_lead all passed');process.exit(bad?1:0);
})();
