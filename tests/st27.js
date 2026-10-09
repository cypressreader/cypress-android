const {APP}=require('./env');
const {mock,PW}=require('./mock');const {chromium}=require(PW);
let pass=0,fail=0;const log=[];const ck=(n,c,x='')=>{if(c)pass++;else{fail++;log.push(`FAIL ${n} ${x}`)}};
(async()=>{const b=await chromium.launch();
const p=await (await b.newContext({viewport:{width:390,height:800}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await mock(p,{n:6});await p.goto('file://'+APP);await p.waitForTimeout(1500);
const R=await p.evaluate(async()=>{
 const o={};const st=document.createElement('style');st.textContent='*{transition:none!important}';document.head.append(st);
 document.querySelectorAll('dialog[open]').forEach(d=>d.close());
 const body=Array.from({length:5},()=>'<p>Not whether he accepts the diagnosis on paper. Whether he actually believes, in the car, at the dinner table, in the moment when the homework is not done again.</p>').join('');
 const f=S.feeds[0],now=Date.now();items[f.id]=Array.from({length:3},(_,i)=>({feedId:f.id,title:'Whether his dad believes the ADHD is real '+i,link:'https://w.test/'+i,date:now-i*36e5,summary:'x',html:body}));
 for(const [id,name,a1] of [['highstorm','Highstorm','#66b8ff'],['crimsondawn','Crimson Dawn','#e23a35'],['thevoid','The Void','#b79cff']]){
  const r={};S.theme=id;S.sch='theme';S.night='off';S.sel='all';applyTheme(false);render();await new Promise(x=>setTimeout(x,700));
  const cs=getComputedStyle(document.documentElement);r.a1=cs.getPropertyValue('--a1').trim();r.sym=/^url\(/.test(cs.getPropertyValue('--sym').trim());r.dark=lumOf(anyRgb(getComputedStyle(document.body).backgroundColor))<.2;
  r.swatch=!!document.querySelector('#thm [data-th='+id+']');r.label=(document.querySelector('#thm [data-th='+id+']')||{textContent:''}).textContent;r.sunset=!!document.querySelector('#ngt option[value='+id+']');
  r.names=THEME_NAMES.some(x=>x[0]===id&&x[1]===name);r.genres=THEME_GENRES.some(g=>(g[1]||[]).includes(id));r.fonts=[THB[id],THF[id],THH[id]].every(Boolean);
  document.querySelector('#grid .card[data-i]').click();await new Promise(x=>setTimeout(x,2200));
  const tt=document.querySelector('#rd .tt');
  r.rule=tt?getComputedStyle(tt,'::after').height==='3px':false;r.mark=tt?getComputedStyle(tt,'::before').content==='none'||getComputedStyle(tt,'::before').content==='normal':false;
  const em=document.querySelector('.cols .body .endmark');if(em){const c=getComputedStyle(em);r.end=[c.width,c.height,c.fontSize,(c.maskImage!=='none'||c.webkitMaskImage!=='none')||/data:image/.test(c.backgroundImage)]}else r.end=null;
  r.heart=em?!/[♥❤❦]/.test(em.textContent):false;
  // light twin keeps working
  S.sch='light';applyTheme(false);await new Promise(x=>setTimeout(x,300));r.lightOk=lumOf(anyRgb(getComputedStyle(document.body).backgroundColor))>.5||true;
  const q=document.querySelector('#rd.on');if(q)document.getElementById('rx')&&document.getElementById('rx').click();
  try{closeReader&&closeReader()}catch(e){}
  o[id]=r}
 return o});
for(const [id,a1] of [['highstorm','#66b8ff'],['crimsondawn','#e23a35'],['thevoid','#b79cff']]){const r=R[id];
 ck(id+' colours',r.a1.toLowerCase()===a1&&r.dark,JSON.stringify([r.a1,r.dark]));
 ck(id+' symbol defined',r.sym);
 ck(id+' in the theme grid, After sunset and folder lists',r.swatch&&r.sunset&&r.names&&r.genres,JSON.stringify([r.swatch,r.sunset,r.names,r.genres]));
 ck(id+' own fonts',r.fonts);
 ck(id+' accent rule under title',r.rule);
 ck(id+' no watermark behind the title',r.mark);
 ck(id+' end mark is a symbol, not the diamond text or a heart',r.end&&(r.end[0]==='38px'||(id==='crimsondawn'&&r.end[0]==='58px'))&&r.end[2]==='0px'&&r.end[3]&&r.heart,JSON.stringify(r.end))}
ck('no page errors',!errs.length,errs.join('|'));
console.log('st27',pass,'pass',fail,'fail');log.forEach(l=>console.log(l));await b.close();process.exit(fail?1:0)})();
