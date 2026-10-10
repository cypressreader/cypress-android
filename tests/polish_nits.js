/* Polish nits: the Brief's quote of the day names a speaker or the source (never a headline); a Today cover line is not repeated in The Well; the Sunday week panel fits its content. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 const b=await chromium.launch();
 for(const W of [1180,412]){
  const p=await (await b.newContext({viewport:{width:W,height:860}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:10});
  await p.route('https://img.test/**',r=>r.fulfill({status:200,contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="100%" height="100%" fill="#468"/></svg>'}));
  await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(400);
  const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const now=Date.now();const o={};
   const Q=['“We did not see that coming at all, and neither did our customers,” said Jane Smith, the chief executive of the firm.','The minister told reporters: “There will be no cuts to the front line while this government is in office, none at all.”','“Nobody expected a result quite like this one tonight,” the company said in a statement on Friday evening.'];
   S.offline=true;S.feeds.slice(0,4).forEach((f,fi)=>{state[f.id]='ok';items[f.id]=Array.from({length:16},(_,i)=>({feedId:f.id,title:['Harbour','Quantum','Glacier','Orchard'][fi]+' story '+['alpha','bravo','charlie','delta','echo','foxtrot','golf','hotel','india','juliet','kilo','lima','mike','november','oscar','papa'][i]+' about '+['bridges','chips','ice','apples'][fi]+' '+(i*7+fi),link:'https://w.test/'+fi+'/'+i,img:'https://img.test/p'+fi+'-'+i+'.svg',date:now-(i*55+fi*9)*6e4,summary:i<3&&fi===0?Q[i]:'A long enough summary of this story to count as a lede for sure here, with several words in it.'}));items[f.id].forEach((a,i)=>{S.rt[a.link]=i%5===0?10:3})});
   /* 1. quote of the day */
   cur=[];const q=briefQuote([items[S.feeds[0].id][0]]);o.q1=q;
   cur=[];o.q2=briefQuote([items[S.feeds[0].id][1]]);cur=[];o.q3=briefQuote([items[S.feeds[0].id][2]]);
   o.titles=items[S.feeds[0].id].slice(0,3).map(a=>a.title);o.src=fof(items[S.feeds[0].id][0]).title;
   /* 2. cover lines vs The Well */
   S.sel='today';S.dtab='latest';render();await w(1800);
   const cl=[...document.querySelectorAll('#grid .dcov .dcv-l,#grid .dcov .dcv-lead')].map(a=>a.getAttribute('href')),well=[...document.querySelectorAll('#grid .dwell a')].map(a=>a.getAttribute('href'));
   o.cover=cl.length;o.lines=document.querySelectorAll('.dcov .dcv-l').length;o.cls=document.querySelector('.dcov')?document.querySelector('.dcov').className:'none';o.pool=topOf(S.feeds,400,new Set(),null,true).length;o.well=well.length;o.both=cl.filter(h=>well.includes(h));
   const ct=[...document.querySelectorAll('#grid .dcov .dcv-l span,#grid .dcov .dcv-lead h2')].map(e=>e.textContent.trim()),wt=[...document.querySelectorAll('#grid .dwell *')].map(e=>(e.children.length?'':e.textContent.trim())).filter(Boolean);
   o.sameText=ct.filter(t=>wt.includes(t));
   /* 3. Sunday week panel */
   S.sel='digest';S.dgk='week';render();await w(1200);const e=document.querySelector('.wkhero');
   if(e){const r=e.getBoundingClientRect(),bars=e.querySelector('.wkbars').getBoundingClientRect();o.wk={h:Math.round(r.height),w:Math.round(r.width),bars:Math.round(bars.width)}}
   return o});
  const t='['+W+'] ';
  const txt=h=>String(h||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');
  ck(t+'a quote names its speaker ("said Jane Smith")',/Jane Smith/.test(txt(r.q1)),r.q1);
  ck(t+'a speaker introduced before the quote is found too',/minister/i.test(txt(r.q2))||/Quote of the day/.test(txt(r.q2)),r.q2);
  ck(t+'without a speaker the source is named instead',r.q3&&txt(r.q3).includes('— ')&&txt(r.q3).includes(r.src),r.q3);
  ck(t+'no quote is attributed to a headline',[r.q1,r.q2,r.q3].every(h=>!h||!r.titles.some(ti=>txt(h).includes(ti))),JSON.stringify([r.q1,r.titles]));
  ck(t+'the cover and The Well show different stories',r.cover>=2&&r.both.length===0&&r.sameText.length===0,JSON.stringify([r.cover,r.well,r.both,r.sameText,r.lines,r.cls,r.pool]));
  if(r.wk){ck(t+'the Sunday week panel fits its content',r.wk.h<=(W>=700?230:300),JSON.stringify(r.wk));if(W>=700)ck(t+'on a wide screen the chart fills the panel beside the figures',r.wk.bars>=r.wk.w*.45,JSON.stringify(r.wk))}else ck(t+'the week panel exists',false);
  ck(t+'no page errors',!errs.length,errs[0]);await p.close();
 }
 await b.close();console.log(bad?'polish_nits '+bad+' FAILED':'polish_nits all passed');process.exit(bad?1:0);
})();
