/* Tap identity: whatever card is tapped, the story that opens is that card's own story.
   (a) Daily, one feed and All stories: cards at the top, middle and bottom of a scrolled list.
   (b) End-of-article cards (Next up, Related reads) in both reading modes, including the bottom card.
   (c) (b) again for stories that were downloaded ahead (cache path) as well as opened cold. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x===undefined?'':x)}else console.log('ok',n)};
const TITLES={
 A:'Quantum computing breakthrough announced',
 N:'Neanderthal skull discovery reveals ancient',
 R1:'Quantum computing error correction advance',
 R2:'Quantum computing startup raises funding',
 R3:'Quantum computing chip design lab'};
(async()=>{
 const b=await chromium.launch();
 for(const W of [412,1100]){
  const ctx=await b.newContext({viewport:{width:W,height:860}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(300);
  /* ---- fixtures: a long list from four feeds, plus a quantum story with three related ones ---- */
  await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const now=Date.now();
   const body=t=>'<p>'+(('Body text of the story '+t+' with enough words to be a real article. ').repeat(40))+'</p>';
   const uw=n=>{let x=(n+3)*7919,o='';for(let k=0;k<6;k++){o+=String.fromCharCode(97+x%26);x=Math.floor(x/26)+k*5+1}return o};const tt=n=>[uw(n*4),uw(n*4+1),uw(n*4+2),uw(n*4+3)].join(' ');
   S.feeds.slice(0,4).forEach((f,fi)=>{items[f.id]=Array.from({length:16},(_,i)=>({feedId:f.id,title:tt(fi*16+i+10),link:'https://w.test/'+fi+'/'+i,date:now-(i*55+fi*9+60)*6e4,summary:'A standfirst long enough to serve as a deck for the story, in a couple of lines.',img:'',html:body(fi+'-'+i)}));state[f.id]='ok'});
   const f0=S.feeds[0].id,f1=S.feeds[1].id,f2=S.feeds[2].id;
   const mk=(id,fid,t,k)=>({feedId:fid,title:t,link:'https://q.test/'+id,date:now-k*6e4,summary:'Summary of '+t+'.',img:'',html:body(id)});
   items[f0].unshift(mk('A',f0,'Quantum computing breakthrough announced',1));
   items[f1].unshift(mk('N',f1,'Neanderthal skull discovery reveals ancient',2));
   items[f0].push(mk('R1',f0,'Quantum computing error correction advance',3),mk('R2',f2,'Quantum computing startup raises funding',4),mk('R3',f1,'Quantum computing chip design lab',5));
   S.read={};S.rt=S.rt||{};});
  const tag=W+' ';
  /* ---- (a) lists: top, middle and bottom of a scrolled list ---- */
  const views=[['Daily','today'],['One feed','s:FIRST'],['All stories','all']];
  for(const [vn,sel] of views){
   const n=await p.evaluate(async sel=>{const w=ms=>new Promise(r=>setTimeout(r,ms));S.sel=sel==='s:FIRST'?'s:'+S.feeds[0].id:sel;S.scroll='page';render();await w(1000);for(let i=0;i<40;i++)NRMORE&&NRMORE();await w(500);return document.querySelectorAll('#grid [data-i]').length},sel);
   ck(tag+vn+': has cards to tap',n>=6,String(n));
   let tested=0,wrong=[];
   for(const where of ['top','middle','bottom']){
    for(const pick of ['first','center','last']){
     const info=await p.evaluate(async([where,pick])=>{const w=ms=>new Promise(r=>setTimeout(r,ms));
      if(document.querySelector('#rd.on'))closeRd();await w(250);
      const m=document.querySelector('main');m.scrollTop=where==='top'?0:where==='middle'?Math.max(0,(m.scrollHeight-m.clientHeight)/2):m.scrollHeight;await w(500);
      const mr=m.getBoundingClientRect();const vis=[...document.querySelectorAll('#grid [data-i]')].filter(e=>{const r=e.getBoundingClientRect();return r.width>40&&r.height>20&&r.top>=mr.top+8&&r.bottom<=mr.bottom-8&&!e.closest('.wthr-b')&&(()=>{const t=document.elementFromPoint(r.left+r.width*.33,r.top+r.height*.55);return !!t&&e.contains(t)})()});
      if(!vis.length)return null;
      const cy=mr.top+mr.height/2;let el=pick==='first'?vis[0]:pick==='last'?vis[vis.length-1]:vis.slice().sort((a,b)=>Math.abs(a.getBoundingClientRect().top+a.getBoundingClientRect().height/2-cy)-Math.abs(b.getBoundingClientRect().top+b.getBoundingClientRect().height/2-cy))[0];
      const r=el.getBoundingClientRect(),x=r.left+r.width*.33,y=r.top+r.height*.55,top=document.elementFromPoint(x,y);return {expected:cur[+el.dataset.i].link,href:el.dataset.href||'',x,y,cls:el.className.split(' ').slice(0,2).join('.'),covered:top&&!el.contains(top)?(top.id?'#'+top.id:top.tagName+'.'+String(top.className).split(' ')[0]):''}},[where,pick]);
     if(!info)continue;
     await p.mouse.click(info.x,info.y);await p.waitForTimeout(900);
     const got=await p.evaluate(()=>({open:!!document.querySelector('#rd.on'),link:curA&&curA.link}));
     tested++;if(!got.open||got.link!==info.expected)wrong.push([where,pick,info.cls,info.expected,got.link,got.open,'covered by',info.covered]);
    }
   }
   ck(tag+vn+': '+tested+' taps at top, middle and bottom each opened the tapped story',tested>=6&&!wrong.length,JSON.stringify(wrong.slice(0,3)));
  }
  /* ---- (b)+(c) end-of-article cards, both reading modes, cold and from the download-ahead cache ---- */
  for(const mode of ['page','vertical']){
   for(const cache of ['cold','cached']){
    const res=await p.evaluate(async([mode,cache])=>{const w=ms=>new Promise(r=>setTimeout(r,ms));
     if(document.querySelector('#rd.on'))closeRd();await w(250);
     S.scroll=mode;S.sel='all';S.read={};render();await w(800);
     Object.keys(AC).forEach(k=>delete AC[k]);
     const all=S.feeds.flatMap(f=>items[f.id]||[]);
     if(cache==='cached'){for(const a of all)if(/q\.test/.test(a.link)){acPut(a.link,a.html,1);try{markReady(a.link)}catch(e){}}}
     const A=all.find(a=>a.link==='https://q.test/A');
     const open=async()=>{if(document.querySelector('#rd.on'))closeRd();await w(250);openReader(A);await w(1800)};
     await open();
     const btns=()=>[...document.querySelectorAll('.rfoot [data-rnext]')];
     const targets=btns().map(x=>({link:x.dataset.rnext,kind:x.classList.contains('rf-next')?'next':'related'}));
     const out={targets,cachedA:!!(AC[A.link]&&AC[A.link].c),taps:[]};
     for(let i=0;i<targets.length;i++){
      await open();const el=btns()[i];if(!el){out.taps.push({i,err:'missing'});continue}
      el.click();await w(1200);
      out.taps.push({i,expected:targets[i].link,kind:targets[i].kind,got:curA&&curA.link,open:!!document.querySelector('#rd.on')});
     }
     return out},[mode,cache]);
    const rel=res.targets.filter(t=>t.kind==='related'),nx=res.targets.find(t=>t.kind==='next');
    const label=tag+mode+' mode, '+cache+': ';
    ck(label+'end of article offers Next up and at least two Related reads',!!nx&&rel.length>=2,JSON.stringify(res.targets));
    if(cache==='cached')ck(label+'the opened story really came from the download-ahead cache',res.cachedA);
    const wrong=res.taps.filter(t=>t.err||t.got!==t.expected||!t.open);
    ck(label+'every end-of-article card opens its own story',res.taps.length===res.targets.length&&!wrong.length,JSON.stringify(wrong));
    const last=res.taps.filter(t=>t.kind==='related').pop();
    ck(label+'the bottom Related card does not open the Next up story',!!last&&last.got===last.expected&&(!nx||last.got!==nx.link),JSON.stringify([last,nx]));
   }
  }
  ck(tag+'no page errors',!errs.length,errs[0]);
  await ctx.close();
 }
 await b.close();
 console.log('tap_identity',bad?bad+' FAILED':'all passed');process.exit(bad?1:0);
})();
