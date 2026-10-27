/* B92: every font a theme's styling names is loaded when that theme is used */
const {APP}=require('./env');const {mock,seed,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{const b=await chromium.launch();const p=await (await b.newContext()).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{n:3});await p.addInitScript(sd=>{try{localStorage.setItem('folio',JSON.stringify(sd))}catch(e){}},seed(['Alpha']));await p.goto('file://'+APP);await p.waitForTimeout(1500);
 const fs=require('fs');const src=fs.readFileSync(APP,'utf8');
 /* the fonts the stylesheet names for each theme (checked against the source below) */
 const NEED={aurora:['Philosopher','Be Vietnam Pro'],eink:['Libre Baskerville'],dark:['Fraunces','Source Serif 4']};/* live themes only: retired ones never apply (their styles were removed in 1.172) */
 for(const [th,fs2] of Object.entries(NEED))for(const f of fs2)ck(th+': the stylesheet really names '+f,src.split('\n').some(l=>l.includes('data-theme')&&l.includes("'"+f+"'")&&l.includes('='+th)));
 for(const th of Object.keys(NEED)){
  const need=NEED[th];
  const loaded=await p.evaluate(t=>{document.querySelectorAll('[data-f]').forEach(l=>l.remove());themeFonts(t);/* bundled fonts arrive as a <style>, the rest as a Google Fonts <link> */return [...document.querySelectorAll('[data-f]')].map(l=>l.href?decodeURIComponent(l.href):l.textContent)},th);
  ck(th+': '+(need.join(', ')||'no special font')+' is loaded when the theme is used',need.every(f=>loaded.some(h=>h.includes(f))),JSON.stringify({need,loaded}));
 }
 ck('no page errors',!errs.length,errs[0]);await b.close();console.log(bad?'FAILED '+bad:'theme_fonts all passed');process.exit(bad?1:0)})();
