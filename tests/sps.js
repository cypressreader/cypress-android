/* Screen baseline for the single-page-structure work: every list screen at phone (412), Fold-open (840) and tablet (1024) widths.
   node tests/sps.js [outdir]   (default tests/sps-base). Compare before/after with your eyes; the point is one markup for every width. */
const path=require('path');const {APP}=require('./env');
const {mock,seed,PW}=require('./mock2');const {chromium}=require(PW);
const OUT=process.argv[2]||path.join(__dirname,'sps-base');require('fs').mkdirSync(OUT,{recursive:true});
const FEEDS=['CNN','Wired','Verge','Atlantic','Guardian','Nature'];
/* [name, state patch applied before render] */
const SCREENS=[
 ['today',{sel:'today'}],['today-list',{sel:'today',view:'list'}],['today-compact',{sel:'today',cards:'compact'}],
 ['all',{sel:'all',atab:'latest'}],['all-top',{sel:'all',atab:'top'}],['all-quick',{sel:'all',atab:'quick'}],['all-deep',{sel:'all',atab:'deep'}],
 ['all-list',{sel:'all',atab:'latest',view:'list'}],['all-compact',{sel:'all',atab:'latest',cards:'compact'}],['all-col',{sel:'all',atab:'latest',wdens:'col'}],
 ['digest',{sel:'digest'}],['folder',{sel:'f:d1'}],['site',{sel:'s:f2'}],['saved',{sel:'saved'}],['brief',{sel:'brief'}],['stats',{sel:'stats'}],['notes',{sel:'notes'}],['hist',{sel:'hist'}],['bi',{sel:'bi'}]];
(async()=>{const b=await chromium.launch();
for(const [w,h] of [[412,915],[840,1000],[1024,768]]){
 const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1});const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(e.message));
 await mock(p,{n:14});
 await p.addInitScript(s=>{localStorage.setItem('folio',JSON.stringify(s))},{...seed(FEEDS),sel:'today'});
 await p.goto('file://'+APP);await p.waitForTimeout(4000);
 const shot=n=>p.screenshot({path:path.join(OUT,`${w}-${n}.jpg`),type:'jpeg',quality:70});
 for(const [n,st] of SCREENS){
  await p.evaluate(st=>{S.view=st.view||'card';S.cards=st.cards||'medium';S.wdens=st.wdens||'mag';Object.assign(S,st);save();render();document.querySelector('main').scrollTop=0},st);
  await p.waitForTimeout(900);await shot(n);
  /* the varied-layout blocks sit under the cover: two more screens down for the main lists */
  if(/^(today|all|all-top|folder|site)$/.test(n))for(const k of [1,2]){await p.evaluate(y=>{document.querySelector('main').scrollTop=y},k*h);await p.waitForTimeout(700);await shot(n+'-'+(k+1))}
 }
 /* a story open, then Settings */
 await p.evaluate(()=>{S.sel='today';S.view='card';S.cards='medium';save();render()});await p.waitForTimeout(700);
 await p.evaluate(()=>{const c=document.querySelector('#grid .card:not(.tl):not(.tl-leaf)');c&&c.click()});await p.waitForTimeout(1800);await shot('reader');
 await p.evaluate(()=>{try{closeRd()}catch(e){}});await p.waitForTimeout(500);
 await p.evaluate(()=>document.querySelector('#gear').click());await p.waitForTimeout(700);await shot('settings');
 console.log(w,'done',errs.length?'errs: '+errs.join(' | ').slice(0,400):'no errors');await ctx.close()}
await b.close()})();
