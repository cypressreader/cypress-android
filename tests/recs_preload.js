/* B97: reaching the end of a story gets everything on its end card ready in the background (Wi-Fi only) */
const {APP}=require('./env');const {mock,seed,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
const SITES=['Alpha','Beta','Gamma','Delta'];
async function boot(b){
 const ctx=await b.newContext({viewport:{width:1100,height:820}});const p=await ctx.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));
 await mock(p,{n:8});await p.addInitScript(sd=>{try{if(!localStorage.getItem('folio'))localStorage.setItem('folio',JSON.stringify(sd))}catch(e){}},seed(SITES));
 await p.goto('file://'+APP);await p.waitForTimeout(2200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(800);
 await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close())});return {ctx,p};
}
const open=p=>p.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));S.sel='all';render();await w(500);PF.done.clear();PF.q.length=0;Object.keys(AC).forEach(k=>delete AC[k]);
 const a=cur[0];openReader(a);await w(2500);return a.link});
(async()=>{
 const b=await chromium.launch();
 /* Wi-Fi: reaching the end queues the end card's stories, and they are stored */
 {const {ctx,p}=await boot(b);
  await p.evaluate(()=>{Object.defineProperty(navigator,'connection',{value:{type:'wifi'},configurable:true});BATST={level:.9,charging:true}});
  const l=await open(p);
  const before=await p.evaluate(()=>({q:PF.tot,recs:recsList(curA).length}));
  ck('there are stories on the end card to get ready',before.recs>=1,JSON.stringify(before));
  ck('nothing is fetched before the end is reached',await p.evaluate(()=>{const v=vView();return !(R.recsFor===curA.link)||!v||v.scrollHeight<=v.clientHeight+20}),'started early');
  await p.evaluate(async()=>{R.recsFor=null;const v=vView();if(isVert()&&v)v.scrollTop=v.scrollHeight;else{R.pg=R.np-1}setProg()});
  const r=await p.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));const want=recsList(curA).map(x=>x.link);const t0=Date.now();
   while(Date.now()-t0<40000){if(want.every(x=>acHas(x)))break;await w(500)}
   return {want:want.length,queued:want.filter(x=>PF.done.has(x)).length,stored:want.filter(x=>acHas(x)).length,for:R.recsFor===curA.link}});
  ck('the end was noticed',r.for,JSON.stringify(r));
  ck('every story on the end card was queued ('+r.queued+'/'+r.want+')',r.want>0&&r.queued===r.want,JSON.stringify(r));
  ck('and stored ready to open ('+r.stored+'/'+r.want+')',r.stored===r.want,JSON.stringify(r));
  ck('no page errors',!p.errs.length,p.errs[0]);await ctx.close()}
 /* mobile data, data-saver and offline: nothing */
 for(const [name,setup] of [['mobile data',()=>Object.defineProperty(navigator,'connection',{value:{type:'cellular'},configurable:true})],['data saver',()=>{Object.defineProperty(navigator,'connection',{value:{type:'wifi'},configurable:true});S.dsave=1;save()}],['offline mode',()=>{Object.defineProperty(navigator,'connection',{value:{type:'wifi'},configurable:true});S.offline=true}]]){
  const {ctx,p}=await boot(b);
  await p.evaluate(setup);
  await open(p);
  await p.evaluate(async()=>{R.recsFor=null;const v=vView();if(isVert()&&v)v.scrollTop=v.scrollHeight;else{R.pg=R.np-1}setProg()});await p.waitForTimeout(1500);
  const q=await p.evaluate(()=>R.recsFor===curA.link);
  ck('the end of a story starts nothing on '+name,q===false,String(q));await ctx.close()}
 await b.close();console.log(bad?'FAILED '+bad:'recs_preload all passed');process.exit(bad?1:0);
})();
