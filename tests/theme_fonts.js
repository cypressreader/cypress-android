/* B92: every font a theme's styling names is loaded when that theme is used */
const {APP}=require('./env');const {mock,seed,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{const b=await chromium.launch();const p=await (await b.newContext()).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{n:3});await p.addInitScript(sd=>{try{localStorage.setItem('folio',JSON.stringify(sd))}catch(e){}},seed(['Alpha']));await p.goto('file://'+APP);await p.waitForTimeout(1500);
 const fs=require('fs');const src=fs.readFileSync(APP,'utf8');
 /* the fonts the stylesheet names for each theme (checked against the source below) */
 const NEED={cyber:['Rajdhani'],cyberdawn:['Rajdhani'],arcade:['Rajdhani'],pixel:['Silkscreen']};
 for(const [th,fs2] of Object.entries(NEED))for(const f of fs2)ck(th+': the stylesheet really names '+f,src.split('\n').some(l=>l.includes('data-theme')&&l.includes("'"+f+"'")&&(l.includes('='+th)||l.includes('^=cyber')&&th.startsWith('cyber'))));
 for(const th of ['cyber','cyberdawn','arcade','pixel']){
  const need=NEED[th];
  const loaded=await p.evaluate(t=>{document.querySelectorAll('link[data-f]').forEach(l=>l.remove());themeFonts(t);return [...document.querySelectorAll('link[data-f]')].map(l=>decodeURIComponent(l.href))},th);
  ck(th+': '+(need.join(', ')||'no special font')+' is loaded when the theme is used',need.every(f=>loaded.some(h=>h.includes(f))),JSON.stringify({need,loaded}));
 }
 ck('no page errors',!errs.length,errs[0]);await b.close();console.log(bad?'FAILED '+bad:'theme_fonts all passed');process.exit(bad?1:0)})();
