/* Dynamic theme: never the same background family two editions running, time of day sets lightness; sidebar stays neutral; tablets slide the sidebar away while reading and bring it back on demand. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
const run=async(W,H,hour)=>{
 const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:W,height:H}});
 await ctx.addInitScript(h=>{const R=Date,off=new R(2026,9,10,h,0,0).getTime()-R.now();globalThis.Date=class extends R{constructor(...a){if(a.length)super(...a);else super(R.now()+off)}static now(){return R.now()+off}}},hour);
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});
 return {b,p,errs};
};
(async()=>{
 /* diversity and time of day */
 {
  const {b,p,errs}=await run(1100,800,8);
  const r=await p.evaluate(()=>{const fam=h=>Math.floor((((h%360)+360)%360)/45);const hue=c=>rgb2hsl(anyRgb(c))[0],lum=c=>rgb2hsl(anyRgb(c))[2];
   S.dyn=null;const a=dynTone('#2a8a4a',false);const f1=fam(hue(a.bg));
   S.dyn={k:'older-edition',prev:-1,last:f1};/* the edition changed: its family was f1 */
   const b2=dynTone('#2a8a4a',false);const f2=fam(hue(b2.bg));
   return {f1,f2,lMorning:lum(a.bg)}});
  ck('next edition uses a different background family',r.f1!==r.f2,JSON.stringify(r));
  await b.close();ck('no page errors (diversity)',!errs.length,errs[0]);
  const e=await run(1100,800,20);
  const l=await e.p.evaluate(()=>{S.dyn=null;return rgb2hsl(anyRgb(dynTone('#2a8a4a',false).bg))[2]});
  ck('evening is deeper than morning',l<r.lMorning-.03,r.lMorning+' vs '+l);await e.b.close();
 }
 /* sidebar neutral + tablet auto-hide */
 {
  const {b,p,errs}=await run(1000,800,10);
  const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));
   const now=Date.now();S.feeds.slice(0,2).forEach((f,fi)=>{items[f.id]=Array.from({length:6},(_,i)=>({feedId:f.id,title:'Story '+fi+i+' about unique '+['a','b','c','d','e','f'][i],link:'https://w.test/'+fi+'/'+i,date:now-i*36e5,summary:'x',img:'',html:'<p>'+'Text here. '.repeat(60)+'</p>'}));state[f.id]='ok'});
   S.theme='dynamic';applyTheme(false);S.sel='all';render();await w(500);
   const bg=getComputedStyle(document.querySelector('aside')).backgroundColor;
   const out={bg,before:getComputedStyle(document.querySelector('aside')).transform};
   openReader(cur[0]);await w(1500);
   out.reading=document.body.classList.contains('reading');out.hidden=getComputedStyle(document.querySelector('aside')).transform!=='none';out.handle=getComputedStyle(document.querySelector('#sideh')).display!=='none';
   document.querySelector('#sideh').click();await w(500);out.shown=document.body.classList.contains('sideshow')&&getComputedStyle(document.querySelector('aside')).position==='fixed'&&getComputedStyle(document.querySelector('aside')).transform==='none';
   document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await w(300);out.escHides=!document.body.classList.contains('sideshow');
   closeRd();await w(600);out.after=!document.body.classList.contains('reading')&&getComputedStyle(document.querySelector('aside')).transform==='none';
   return out});
  ck('sidebar stays neutral in the Dynamic theme',/^rgb\(24[34], 24[45], 24[67]\)$/.test(r.bg)||/rgb\(21, 24, 30\)/.test(r.bg),r.bg);
  ck('tablet: sidebar slides away while reading',r.reading&&r.hidden,JSON.stringify(r));ck('tablet: handle to recall it',r.handle);
  ck('tablet: handle brings the sidebar back',r.shown,JSON.stringify(r));ck('tablet: Escape hides it again',r.escHides);ck('tablet: sidebar returns after reading',r.after,JSON.stringify(r));
  await b.close();ck('no page errors (tablet)',!errs.length,errs[0]);
 }
 {
  const {b,p,errs}=await run(412,860,10);
  const r=await p.evaluate(()=>getComputedStyle(document.querySelector('#sideh')).display);ck('phone: no handle',r==='none',r);await b.close();ck('no page errors (phone)',!errs.length,errs[0]);
 }
 console.log('dynside',bad?bad+' FAILED':'all passed');process.exit(bad?1:0);
})();
