/* Focus mode (the eye) stays in the reader toolbar in phone scroll mode, even when article decoration fails; it is hidden only in tablet page mode. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 const pw=require(PW);const b=await chromium.launch();
 const run=async(label,ctxOpts,fn)=>{
  const ctx=await b.newContext(ctxOpts);const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(300);
  const r=await p.evaluate(async([fn])=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const f=S.feeds[0];
   const a={feedId:f.id,title:'Eye test',link:'https://w.test/eye',date:Date.now(),summary:'x',img:'',html:Array.from({length:12},(_,i)=>'<p>Paragraph '+i+' '+'words for the story. '.repeat(40)+'</p>').join('')};
   items[f.id]=[a];S.sel='all';render();await w(300);
   const o={};const vis=()=>{const e=document.querySelector('#rd .bar #rfocus');if(!e)return false;const r=e.getBoundingClientRect();return getComputedStyle(e).display!=='none'&&r.width>10&&r.height>10};
   if(fn==='throw'){window.furnish=function(){throw new Error('boom')};}
   if(fn==='vertical'){S.scroll='vertical'}if(fn==='paged'){S.scroll='paged'}
   try{openReader(a)}catch(e){o.threw=String(e)}await w(2200);
   o.vis=vis();o.vert=isVert();
   const bt=document.querySelector('#rd .bar #rfocus');if(bt&&o.vis){bt.click();await w(300);o.on=document.querySelector('#rd').classList.contains('focus');o.pressed=bt.getAttribute('aria-pressed');
    const sc=vView();if(sc){sc.scrollTop=300;await w(300)}o.fl=!!document.querySelector('.cols .body p.fl');bt.click();await w(200);o.off=!document.querySelector('#rd').classList.contains('focus')}
   return o},[fn]);
  await ctx.close();return {r,errs};
 };
 let x=await run('phone',{...pw.devices['Pixel 5']},'');
 ck('phone scroll mode: eye is visible',x.r.vis&&x.r.vert,JSON.stringify(x.r));
 ck('phone: eye turns focus on and off',x.r.on&&x.r.pressed==='true'&&x.r.off,JSON.stringify(x.r));
 ck('phone: the current paragraph is highlighted while scrolling',x.r.fl,JSON.stringify(x.r));
 x=await run('phone-throw',{...pw.devices['Pixel 5']},'throw');
 ck('phone: eye still there if article decoration fails',x.r.vis,JSON.stringify(x.r));
 x=await run('tablet-paged',{viewport:{width:1100,height:820}},'paged');
 ck('tablet page mode: eye is hidden',!x.r.vis&&!x.r.vert,JSON.stringify(x.r));
 x=await run('tablet-scroll',{viewport:{width:1100,height:820}},'vertical');
 ck('tablet scroll mode: eye is visible',x.r.vis&&x.r.vert,JSON.stringify(x.r));
 await b.close();console.log(bad?'eye '+bad+' FAILED':'eye all passed');process.exit(bad?1:0);
})();
