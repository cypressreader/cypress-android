const {APP}=require('./env');
const {mock,PW}=require('./mock');const {chromium}=require(PW);
let pass=0,fail=0;const log=[];const ck=(n,c,x='')=>{if(c)pass++;else{fail++;log.push(`FAIL ${n} ${x}`)}};
(async()=>{const b=await chromium.launch();
for(const [w,h] of [[360,780],[412,860],[540,900],[600,900],[820,900],[1280,900]]){
const p=await (await b.newContext({viewport:{width:w,height:h}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await mock(p,{n:4});await p.goto('file://'+APP);await p.waitForTimeout(1200);
const r=await p.evaluate(async()=>{const LONG='<option>Default voice</option><option selected>English (United States) · iol ★ (online) (en-US) and a much longer name than that</option>';
 const out={};document.getElementById('set').showModal();await new Promise(r=>setTimeout(r,400));
 for(const id of ['voice','qv']){const e=document.getElementById(id);e.innerHTML=LONG;const line=e.closest('.line'),lb=line.querySelector('.lb'),R=x=>x.getBoundingClientRect().width;
  const wrapped=getComputedStyle(line).flexWrap==='wrap';
  out[id]={lb:Math.round(R(lb)),line:Math.round(R(line)),sel:Math.round(R(e)),wrapped,share:R(lb)/R(line),selShare:R(e)/R(line)}}
 return out});
for(const id of ['voice','qv']){const o=r[id];if(!o.line)continue;
 ck(w+' '+id+' label keeps room',o.wrapped?o.lb>=o.line*.9:o.share>=.3,JSON.stringify(o));
 ck(w+' '+id+' select stays inside row',o.sel<=o.line+1,JSON.stringify(o))}
ck(w+' no page errors',!errs.length,errs.join('|'));await p.close()}
console.log('st22',pass,'pass',fail,'fail');log.forEach(l=>console.log(l));await b.close();process.exit(fail?1:0)})();
