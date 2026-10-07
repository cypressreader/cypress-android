const {APP}=require('./env');
const {mock,PW}=require('./mock');const {chromium}=require(PW);
let pass=0,fail=0;const log=[];const ck=(n,c,x='')=>{if(c)pass++;else{fail++;log.push(`FAIL ${n} ${x}`)}};
(async()=>{const b=await chromium.launch();
const p=await (await b.newContext({viewport:{width:390,height:800}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await mock(p,{n:6});await p.goto('file://'+APP);await p.waitForTimeout(1500);
const IDS=['midnight','forest','golden','alpenglow','deepsea','aurora','cyber','cyberdawn','terminal','amber','outrun','y2k','arcade','sepia','newsprint','broadsheet','rose','typewriter','letterpress','sage','coastal','marigold','tropical','eink','highstorm','crimsondawn','thevoid','nocturne','crimson','nebula','light','dark','black','slate','modern','inkwash','blueprint','spartan','cortana','rivals','midgar','ragnarok','nightcity'];
const PLAIN=['dim','swissred','denim','pixel','covenant','protoss','dynamic'];
const TWIN=['midnight','forest','golden','alpenglow','deepsea','aurora','highstorm','nocturne','crimson','nebula','slate','spartan','cortana','rivals','midgar','ragnarok','nightcity'];
const BIG={crimsondawn:58,cyber:54,aurora:54,deepsea:54,cortana:56,ragnarok:56,nightcity:56,nebula:48,modern:48,light:48,dark:48,blueprint:48,black:48,nocturne:44};
const PLAIN_=PLAIN;
const R=await p.evaluate(async([IDS,PLAIN])=>{
 const o={};const st=document.createElement('style');st.textContent='*{transition:none!important}';document.head.append(st);
 document.querySelectorAll('dialog[open]').forEach(d=>d.close());
 const body=Array.from({length:4},()=>'<p>Not whether he accepts the diagnosis on paper. Whether he actually believes, in the car, at the dinner table, in the moment when the homework is not done again.</p>').join('');
 const f=S.feeds[0],now=Date.now();items[f.id]=Array.from({length:3},(_,i)=>({feedId:f.id,title:'Whether his dad believes the ADHD is real '+i,link:'https://w.test/'+i,date:now-i*36e5,summary:'x',html:body}));
 const one=async(id,sch)=>{try{closeReader()}catch(e){}S.theme=id;S.sch=sch;S.night='off';S.sel='all';applyTheme(false);render();await new Promise(x=>setTimeout(x,500));document.querySelector('#grid a.card').click();await new Promise(x=>setTimeout(x,1800));
  const r=document.documentElement,em=document.querySelector('.cols .body .endmark');const c=em&&getComputedStyle(em);
  return{has:r.classList.contains('hasym'),sym:/^url\(/.test(getComputedStyle(r).getPropertyValue('--sym').trim()),size:c&&c.width,fs:c&&c.fontSize,heart:em?/[♥❤❦]/.test(em.textContent):null,paint:c&&(c.maskImage!=='none'||c.webkitMaskImage!=='none'||/data:image/.test(c.backgroundImage)),logoL:r.style.getPropertyValue('--logo')?rgb2hsl(anyRgb(r.style.getPropertyValue('--logo')))[2]:null}};
 for(const id of IDS){o[id]=await one(id,'theme');o[id+'_l']=await one(id,'light');o[id+'_d']=await one(id,'dark')}
 for(const id of PLAIN)o['plain_'+id]=await one(id,'theme');
 return o},[IDS,PLAIN]);
for(const id of IDS){const r=R[id];
 ck(id+' has an end symbol',r.has&&r.sym&&r.paint,JSON.stringify(r));
 ck(id+' symbol size and no stray text',r.size===((BIG[id]||38)+'px')&&r.fs==='0px'&&r.heart===false,JSON.stringify([r.size,r.fs,r.heart]));
 const l=R[id+'_l'];ck(id+' light twin keeps it',l.has&&l.paint);
 ck(id+' dark twin keeps it',R[id+'_d'].has&&R[id+'_d'].paint);
 if(TWIN.includes(id))ck(id+' light twin symbol is dark enough',l.logoL!==null&&l.logoL<=.45,String(l.logoL))}
for(const id of PLAIN)ck(id+' keeps the plain diamond',!R['plain_'+id].has&&R['plain_'+id].size!=='38px',JSON.stringify(R['plain_'+id]));
ck('no page errors',!errs.length,errs.join('|'));
console.log('st28',pass,'pass',fail,'fail');log.forEach(l=>console.log(l));await b.close();process.exit(fail?1:0)})();
