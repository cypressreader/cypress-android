// Reader legibility in every theme under Always light / Always dark (Modern once showed pale text on a white sheet).
const {APP}=require('./env');
const {mock,PW}=require('./mock');const {chromium}=require(PW);
let pass=0,fail=0;const log=[];const ck=(n,c,x='')=>{if(c)pass++;else{fail++;log.push(`FAIL ${n} ${x}`)}};
(async()=>{const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:900,height:800}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await mock(p,{n:6});await p.goto('file://'+APP);await p.waitForTimeout(1500);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(300);
const ids=await p.evaluate(()=>THEME_NAMES.map(t=>t[0]).filter(x=>x));
const res=await p.evaluate(async(ids)=>{const out=[];const s=document.createElement('style');s.textContent='*{transition:none!important}';document.head.append(s);
 document.querySelectorAll('dialog[open]').forEach(d=>d.close());const now=Date.now(),f=S.feeds[0];
 items[f.id]=Array.from({length:3},(_,i)=>({feedId:f.id,title:'Reader legibility '+i,link:'https://w.test/'+i,date:now-i*36e5,summary:'x',html:'<p>Body text that must be readable in every theme and both modes.</p>'.repeat(3)}));
 S.sel='all';
 for(const id of ids)for(const sch of ['light','dark']){S.theme=id;S.sch=sch;applyTheme(false);render();await new Promise(r=>setTimeout(r,120));
  const c=document.querySelector('#grid .card[data-i]');if(!c)continue;c.click();await new Promise(r=>setTimeout(r,500));
  const L=c=>lumOf(anyRgb(c)),g=(e,p)=>e?getComputedStyle(e)[p]:null;
  const sh=document.querySelector('#rd .sheet,#sheet'),tt=document.querySelector('#rd .tt'),bp=document.querySelector('.cols .body p');
  const bg=g(sh,'backgroundColor'),a=[g(tt,'color'),g(bp,'color')].filter(Boolean);
  const ct=a.map(x=>(Math.max(L(bg),L(x))+.05)/(Math.min(L(bg),L(x))+.05));
  out.push({id,sch,bg,ct:Math.min(...ct)});
  try{closeReader&&closeReader()}catch(e){document.querySelector('#rd')?.classList.remove('on')}
  await new Promise(r=>setTimeout(r,80));}
 return out},ids);
for(const r of res)ck(`${r.id} ${r.sch}: reader text readable`,r.ct>=4.5,`${r.bg} ${r.ct.toFixed(2)}`);
ck('some themes checked',res.length>40,String(res.length));
ck('no page errors',!errs.length,errs.join('|'));
console.log(log.join('\n'));console.log(`${pass} passed, ${fail} failed`);await b.close()})();
