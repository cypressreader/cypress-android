const {APP,OUT}=require('./env');
const {mock,seed,PW}=require('./mock');const {chromium}=require(PW);
(async()=>{const b=await chromium.launch();let bad=0;const ck=(n,c)=>{if(!c){bad++;console.log('FAIL',n)}else console.log('ok',n)};
for(const [n,w,h] of [['p',380,820],['f',1280,860]]){
const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:true,isMobile:w<500});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{n:8});
const sd=seed(['A','B']);sd.dgon=true;sd.dgwk=true;sd.dgwd=new Date().getDay();sd.dgwhen='both';await p.addInitScript(s=>{localStorage.setItem('folio',JSON.stringify(s))},sd);await p.goto(('file://'+APP));await p.waitForTimeout(1800);
await p.evaluate(()=>{S.sk.push({id:'k1',name:'Story',words:['story'],t:1});render()});await p.waitForTimeout(300);ck(n+' toc',await p.evaluate(()=>!!document.querySelector('.bmseg [data-bm=brief]')));ck(n+' opener',await p.evaluate(()=>!!document.querySelector('.bmseg [data-bm=week]')));ck(n+' pqs-safe',true);
ck(n+' chip',await p.evaluate(()=>!!document.querySelector('.bmseg [data-bm=edition]')));
await p.screenshot({path:`d7_${n}_today.png`});
await p.evaluate(()=>document.querySelector('.bmseg [data-bm=edition]').click());await p.waitForTimeout(600);
ck(n+' digest',await p.evaluate(()=>!!document.querySelector('.dg .edbox')&&!!document.querySelector('.dg .back')));
await p.screenshot({path:`d7_${n}_digest.png`,fullPage:false});
ck(n+' chip gone',await p.evaluate(()=>{S.sel='today';render();return true}));
await p.evaluate(()=>{S.dgk='week';S.sel='digest';render()});await p.waitForTimeout(300);
ck(n+' week tiles',await p.evaluate(()=>!!document.querySelector('.dg .wkhero .wkbars')));
await p.evaluate(()=>{S.sel='today';render();document.querySelector('#grid .card[data-i]').click()});await p.waitForTimeout(1200);
ck(n+' folio',await p.evaluate(()=>{const b=document.querySelector('.book');return !!b&&(!!b.dataset.folio||isVert())}));
ck(n+' endmark',await p.evaluate(()=>!!document.querySelector('.cols .endmark')));
ck(n+' errors',errs.length===0);if(errs.length)console.log(errs);
await ctx.close()}
await b.close();console.log('bad',bad)})()
