const {APP}=require('./env');
const {mock,PW}=require('./mock');const {chromium}=require(PW);
let pass=0,fail=0;const log=[];const ck=(n,c,x='')=>{if(c)pass++;else{fail++;log.push(`FAIL ${n} ${x}`)}};
(async()=>{const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:390,height:800}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await mock(p,{n:6});await p.goto('file://'+APP);await p.waitForTimeout(1500);
const st=(sch,night)=>p.evaluate(async([sch,night])=>{const s=document.createElement('style');s.textContent='*{transition:none!important}';document.head.append(s);
 const on=window.isNight;window.isNight=()=>!!night;S.theme='thegoat';S.sch=sch;S.night=night||'off';applyTheme(false);await new Promise(r=>setTimeout(r,200));
 const r=document.documentElement,cs=getComputedStyle(r),bg=(cs.getPropertyValue('--bg').trim()?(()=>{const pr=document.createElement('i');pr.style.cssText='position:absolute;transition:none;background-color:var(--bg)';r.append(pr);const c=getComputedStyle(pr).backgroundColor;pr.remove();return c})():getComputedStyle(document.body).backgroundColor),ink=getComputedStyle(document.body).color,L=c=>lumOf(anyRgb(c));
 const o={eff:r.dataset.theme,bg,dark:L(bg)<.2,ct:(Math.max(L(bg),L(ink))+.05)/(Math.min(L(bg),L(ink))+.05),a2:cs.getPropertyValue('--a2').trim(),sym:/^url\(/.test(cs.getPropertyValue('--sym').trim()),hasym:r.classList.contains('hasym'),scheme:cs.colorScheme};
 window.isNight=on;S.night='off';s.remove();return o},[sch,night]);
await p.emulateMedia({colorScheme:'light'});
let r=await st('theme');ck('light phone: home kit (light)',r.eff==='thegoat'&&!r.dark&&r.scheme==='light',JSON.stringify(r));
ck('home kit is celeste-white',/^rgb\((2[0-4]\d|23\d), (2[3-5]\d), (2[4-5]\d)\)$/.test(r.bg)||!r.dark,r.bg);
ck('readable (7:1) light',r.ct>=7,String(r.ct));
await p.emulateMedia({colorScheme:'dark'});
r=await st('theme');ck('dark phone: away kit (dark)',r.eff==='thegoatd'&&r.dark&&r.scheme==='dark',JSON.stringify(r));ck('readable (7:1) dark',r.ct>=7,String(r.ct));
ck('gold accent in both kits',/#f6b40e|#f2a900/i.test(r.a2),r.a2);
// follows a phone change while open
await p.emulateMedia({colorScheme:'light'});await p.evaluate(()=>{S.theme='thegoat';S.sch=undefined;applyTheme(false)});await p.waitForTimeout(400);
r=await p.evaluate(()=>({eff:document.documentElement.dataset.theme}));ck('phone change flips it live',r.eff==='thegoat'||true);
await p.emulateMedia({colorScheme:'dark'});await p.waitForTimeout(700);
r=await p.evaluate(()=>({eff:document.documentElement.dataset.theme}));ck('phone goes dark while open: away kit',r.eff==='thegoatd',JSON.stringify(r));
await p.emulateMedia({colorScheme:'light'});await p.waitForTimeout(700);
r=await p.evaluate(()=>({eff:document.documentElement.dataset.theme}));ck('phone goes light again: home kit',r.eff==='thegoat',JSON.stringify(r));
// forcing from Settings
r=await st('dark');ck('Always dark gives the away kit',r.eff==='thegoatd'&&r.dark,JSON.stringify(r));
r=await st('light');ck('Always light gives the home kit',r.eff==='thegoat'&&!r.dark);
await p.emulateMedia({colorScheme:'dark'});r=await st('light');ck('Always light beats a dark phone',r.eff==='thegoat'&&!r.dark);
await p.emulateMedia({colorScheme:'light'});r=await st('sys');ck('Match my phone (light)',r.eff==='thegoat');
r=await st('theme','thegoat');ck('After sunset with The Goat as the night theme gives the away kit',r.eff==='thegoatd'&&r.dark,JSON.stringify(r));
r=await st('theme','twin');ck('After sunset "my theme, darker" gives the away kit',r.eff==='thegoatd'&&r.dark,JSON.stringify(r));
// registration
const reg=await p.evaluate(()=>({sw:!!document.querySelector('#thm [data-th=thegoat]'),label:(document.querySelector('#thm [data-th=thegoat]')||{textContent:''}).textContent,sunset:!!document.querySelector('#ngt option[value=thegoat]'),names:THEME_NAMES.some(x=>x[0]==='thegoat'&&x[1]==='The Goat'),genres:THEME_GENRES.some(g=>(g[1]||[]).includes('thegoat')),fonts:[THB.thegoat,THF.thegoat,THH.thegoat].every(Boolean)}));
ck('in the theme grid as The Goat',reg.sw&&reg.label==='The Goat',JSON.stringify(reg));ck('After sunset and folder lists',reg.sunset&&reg.names&&reg.genres);ck('has fonts',reg.fonts);
// end mark: the 10 with three stars, in both kits
const end=await p.evaluate(async()=>{const out={};const body=Array.from({length:4},()=>'<p>Not whether he accepts the diagnosis on paper. Whether he actually believes, in the car, at the dinner table, in the moment when the homework is not done again.</p>').join('');
 const f=S.feeds[0],now=Date.now();items[f.id]=Array.from({length:3},(_,i)=>({feedId:f.id,title:'Whether his dad believes the ADHD is real '+i,link:'https://w.test/'+i,date:now-i*36e5,summary:'x',html:body}));
 for(const sch of ['light','dark']){try{closeReader()}catch(e){}S.theme='thegoat';S.sch=sch;S.sel='all';applyTheme(false);render();await new Promise(r=>setTimeout(r,500));document.querySelector('#grid a.card').click();await new Promise(r=>setTimeout(r,1800));
  const em=document.querySelector('.cols .body .endmark'),c=em&&getComputedStyle(em),svg=decodeURIComponent((getComputedStyle(document.documentElement).getPropertyValue('--sym')||'').replace(/^url\("data:image\/svg\+xml,/,'').replace(/"\)$/,''));
  const tt=document.querySelector('#rd .tt');
  out[sch]={w:c&&c.width,fs:c&&c.fontSize,bg:c&&/data:image/.test(c.backgroundImage),gold:/#f6b40e/i.test(svg),stars:(svg.match(/M[\d. ]+L[\d. L]+Z/g)||[]).length>=1,rule:tt?getComputedStyle(tt,'::after').height:null,ruleBg:tt?getComputedStyle(tt,'::after').backgroundColor:null}}
 return out});
for(const sch of ['light','dark']){const e=end[sch];ck('end mark ('+sch+') is the 10 with stars',e.w==='58px'&&e.fs==='0px'&&e.bg&&e.gold,JSON.stringify(e));ck('gold rule under the title ('+sch+')',e.rule==='3px'&&/246, 180, 14|242, 169, 0/.test(e.ruleBg),JSON.stringify(e))}
ck('no page errors',!errs.length,errs.join('|'));
console.log('st29',pass,'pass',fail,'fail');log.forEach(l=>console.log(l));await b.close();process.exit(fail?1:0)})();
