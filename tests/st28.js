const {APP}=require('./env');
const {mock,PW}=require('./mock');const {chromium}=require(PW);
let pass=0,fail=0;const log=[];const ck=(n,c,x='')=>{if(c)pass++;else{fail++;log.push(`FAIL ${n} ${x}`)}};
(async()=>{const b=await chromium.launch();
const p=await (await b.newContext({viewport:{width:390,height:800}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await mock(p,{n:6});await p.goto('file://'+APP);await p.waitForTimeout(1500);
const IDS=['nocturne','midnight','forest','golden','crimson','alpenglow','nebula','deepsea','aurora','highstorm','crimsondawn','thevoid'];
const R=await p.evaluate(async(IDS)=>{
 const o={};const st=document.createElement('style');st.textContent='*{transition:none!important}';document.head.append(st);
 document.querySelectorAll('dialog[open]').forEach(d=>d.close());
 const body=Array.from({length:4},()=>'<p>Not whether he accepts the diagnosis on paper. Whether he actually believes, in the car, at the dinner table, in the moment when the homework is not done again.</p>').join('');
 const f=S.feeds[0],now=Date.now();items[f.id]=Array.from({length:3},(_,i)=>({feedId:f.id,title:'Whether his dad believes the ADHD is real '+i,link:'https://w.test/'+i,date:now-i*36e5,summary:'x',html:body}));
 const one=async(id,sch)=>{try{closeReader()}catch(e){}S.theme=id;S.sch=sch;S.night='off';S.sel='all';applyTheme(false);render();await new Promise(x=>setTimeout(x,500));document.querySelector('#grid a.card').click();await new Promise(x=>setTimeout(x,1800));
  const r=document.documentElement,em=document.querySelector('.cols .body .endmark');const c=em&&getComputedStyle(em);
  return{has:r.classList.contains('hasym'),sym:/^url\(/.test(getComputedStyle(r).getPropertyValue('--sym').trim()),size:c&&c.width,fs:c&&c.fontSize,heart:em?/[♥❤❦]/.test(em.textContent):null,paint:c&&(c.maskImage!=='none'||c.webkitMaskImage!=='none'||/data:image/.test(c.backgroundImage)),logoL:r.style.getPropertyValue('--logo')?rgb2hsl(anyRgb(r.style.getPropertyValue('--logo')))[2]:null}};
 for(const id of IDS){o[id]=await one(id,'theme');o[id+'_l']=await one(id,'light')}
 o.sepia=await one('sepia','theme');o.dynamic=await one('dynamic','theme');
 return o},IDS);
for(const id of IDS){const r=R[id];
 ck(id+' has an end symbol',r.has&&r.sym&&r.paint,JSON.stringify(r));
 ck(id+' symbol size and no stray text',(r.size==='38px'||(id==='crimsondawn'&&r.size==='58px'))&&r.fs==='0px'&&r.heart===false,JSON.stringify([r.size,r.fs,r.heart]));
 const l=R[id+'_l'];ck(id+' light twin keeps it',l.has&&l.paint);
 if(id!=='thevoid'&&id!=='crimsondawn'&&id!=='nocturne')ck(id+' light twin symbol is dark enough',l.logoL!==null&&l.logoL<=.45,String(l.logoL))}
ck('a theme without a symbol keeps the plain diamond',!R.sepia.has&&R.sepia.size!=='38px');
ck('dynamic keeps the plain diamond',!R.dynamic.has);
ck('no page errors',!errs.length,errs.join('|'));
console.log('st28',pass,'pass',fail,'fail');log.forEach(l=>console.log(l));await b.close();process.exit(fail?1:0)})();
