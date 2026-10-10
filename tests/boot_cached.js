/* Startup with data already on the device (a phone's normal start): the first render runs before the end of the script, so nothing it touches may be a const/let declared later (temporal dead zone, "Cannot access 'X' before initialization"). Boots in a mobile viewport on each main screen, with cached stories, reading progress and history. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 const pw=require(PW);const b=await chromium.launch();
 for(const dev of ['Pixel 5','Galaxy S9+']){
  for(const sel of ['today','all','digest','brief','saved','hist']){
   const ctx=await b.newContext({...pw.devices[dev]});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
   await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(300);
   await p.evaluate(async([sel])=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const now=Date.now();
    S.feeds.slice(0,3).forEach((f,fi)=>{items[f.id]=Array.from({length:14},(_,i)=>({feedId:f.id,title:'Cached headline '+i+' of feed '+fi+' subject'+(i*7+fi),link:'https://w.test/'+fi+'/'+i,img:i%3?'https://i.test/'+i+'.jpg':'',date:now-(i*55+fi*9)*6e4,summary:'A long enough summary of this cached story to count as a lede for sure here, with several words.',wc:900}))});
    const l=items[S.feeds[0].id];S.prog[l[5].link]={p:.5,t:now-864e5};S.dw=S.dw||{};S.dw[l[6].link]={s:90,t:now-864e5};
    S.hist=[{l:l[2].link,ti:l[2].title,fid:l[2].feedId,ft:'Src',t:now-7*864e5}];S.saved=[{...l[3],st:now}];
    S.sel=sel;save();saveCache0()},[sel]);
   await p.reload();await p.waitForTimeout(2200);
   const r=await p.evaluate(()=>({fail:!!document.getElementById('cyfail'),failText:(document.getElementById('cyfail')||{}).textContent||'',boot:document.documentElement.classList.contains('boot'),cover:!!document.querySelector('#grid .dcov, #grid .cover'),cards:document.querySelectorAll('#grid .card').length}));
   const t='['+dev+' '+sel+'] ';
   ck(t+'starts without the crash screen',!r.fail,r.failText.slice(0,200));
   ck(t+'no page errors (no TDZ)',errs.length===0,errs.join('|'));
   if(sel==='today')ck(t+'Today cover is drawn on the first start',r.cover);
   await ctx.close();
  }
 }
 await b.close();console.log(bad?'boot_cached '+bad+' FAILED':'boot_cached all passed');process.exit(bad?1:0);
})();
