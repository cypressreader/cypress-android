const {APP}=require('./env');
const {mock,PW}=require('./mock');const {chromium}=require(PW);
let pass=0,fail=0;const log=[];const ck=(n,c,x='')=>{if(c)pass++;else{fail++;log.push(`FAIL ${n} ${x}`)}};
(async()=>{const b=await chromium.launch();
const p=await (await b.newContext({viewport:{width:390,height:800}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await mock(p,{n:6});await p.goto('file://'+APP);await p.waitForTimeout(1500);
const st=async(th,sch)=>p.evaluate(async([th,sch])=>{const s=document.createElement('style');s.textContent='*{transition:none!important}';document.head.append(s);
 S.theme=th;S.sch=sch;S.night='off';applyTheme(false);await new Promise(r=>setTimeout(r,80));
 const m=getComputedStyle(document.body).backgroundColor.match(/[\d.]+/g).map(Number);s.remove();return{eff:document.documentElement.dataset.theme,dark:lumOf(m)<.2,pd:document.documentElement.classList.contains('pdark'),inline:!!document.documentElement.style.getPropertyValue('--bg')}},[th,sch]);
let r;
r=await st('sepia','theme');ck('as-theme keeps light',!r.dark&&!r.inline);
r=await st('sepia','dark');ck('light theme to dark twin',r.dark&&r.pd&&r.inline&&r.eff==='sepia');
r=await st('midnight','light');ck('dark theme to light twin',!r.dark&&!r.pd&&r.inline);
r=await st('midnight','dark');ck('already dark untouched',r.dark&&!r.inline);
r=await st('auto','dark');ck('auto maps to dark',r.dark&&r.eff==='dark');
r=await st('auto','light');ck('auto maps to light',!r.dark&&(r.eff==='light'||r.eff==='auto'),JSON.stringify(r));
r=await st('terminal','light');ck('special look stays',r.dark&&!r.inline);
r=await st('sepia','theme');ck('back to theme clears twin',!r.dark&&!r.inline);
r=await st('dynamic','dark');ck('dynamic ignores switch',!r.inline);
// sys follows phone
await p.emulateMedia({colorScheme:'dark'});r=await st('sepia','sys');ck('sys dark',r.dark);
await p.emulateMedia({colorScheme:'light'});await p.evaluate(()=>applyTheme(false));await p.waitForTimeout(900);
r=await p.evaluate(()=>lumOf(getComputedStyle(document.body).backgroundColor.match(/[\d.]+/g).map(Number))>.2);ck('sys follows phone change',r);
// contrast across themes
const bad=await p.evaluate(async()=>{const o=[];const ths=[...new Set([...document.querySelectorAll('#thm [data-th]')].map(x=>x.dataset.th))].filter(t=>t!=='dynamic');
 const s=document.createElement('style');s.textContent='*{transition:none!important}';document.head.append(s);
 for(const t of ths)for(const sc of['light','dark']){S.theme=t;S.sch=sc;applyTheme(false);await new Promise(r=>setTimeout(r,30));
  const l=c=>lumOf(c.match(/[\d.]+/g).map(Number));const a=l(getComputedStyle(document.body).backgroundColor),i=l(getComputedStyle(document.body).color);const ct=(Math.max(a,i)+.05)/(Math.min(a,i)+.05);if(ct<7)o.push(t+'/'+sc+' '+ct.toFixed(1))}return o});
ck('all themes both ways readable',!bad.length,bad.join(', '));
// settings UI
await p.evaluate(()=>{S.sch='dark';syncSet()});ck('select shows value',await p.evaluate(()=>$('#sch').value)==='dark');
await p.evaluate(()=>{const e=$('#sch');e.value='light';e.dispatchEvent(new Event('change'))});ck('select saves',await p.evaluate(()=>S.sch)==='light');
ck('synced key',await p.evaluate(()=>SET_KEYS.includes('sch')));
// after sunset: my theme, darker
{const q=async(th,sch,night,nowN)=>p.evaluate(async([th,sch,night,nowN])=>{const s=document.createElement('style');s.textContent='*{transition:none!important}';document.head.append(s);const o=window.isNight;window.isNight=()=>nowN;S.theme=th;S.sch=sch;S.night=night;applyTheme(false);await new Promise(r=>setTimeout(r,2300));
 const m=getComputedStyle(document.body).backgroundColor.match(/[\d.]+/g).map(Number);const r={eff:document.documentElement.dataset.theme,dark:lumOf(m)<.2,night:document.documentElement.classList.contains('night')};window.isNight=o;s.remove();S.night='off';return r},[th,sch,night,nowN]);
 r=await q('sepia','theme','twin',true);ck('twin at night is dark sepia',r.dark&&r.eff==='sepia'&&r.night,JSON.stringify(r));
 r=await q('sepia','theme','twin',false);ck('twin by day is normal',!r.dark&&!r.night,JSON.stringify(r));
 r=await q('sepia','light','twin',true);ck('twin beats Always light at night',r.dark,JSON.stringify(r));
 r=await q('midnight','theme','twin',true);ck('already-dark theme stays',r.dark&&r.eff==='midnight');
 r=await q('sepia','theme','dark',true);ck('fixed night theme still works',r.dark&&r.eff==='dark');
 ck('option exists',await p.evaluate(()=>!!document.querySelector('#ngt option[value=twin]')));}
ck('no page errors',!errs.length,errs.join('|'));
console.log('st18',pass,'pass',fail,'fail');log.forEach(l=>console.log(l));await b.close();process.exit(fail?1:0)})();
