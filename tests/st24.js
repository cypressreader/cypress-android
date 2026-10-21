const {APP}=require('./env');
const {mock,PW}=require('./mock');const {chromium}=require(PW);
let pass=0,fail=0;const log=[];const ck=(n,c,x='')=>{if(c)pass++;else{fail++;log.push(`FAIL ${n} ${x}`)}};
(async()=>{const b=await chromium.launch();
for(const [w,h] of [[390,800],[1000,900]]){
const p=await (await b.newContext({viewport:{width:w,height:h}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await mock(p,{n:4});await p.goto('file://'+APP);await p.waitForTimeout(1200);
const R=await p.evaluate(async()=>{
 const o={},now=Date.now(),f=S.feeds[0];
 items[f.id]=Array.from({length:120},(_,i)=>({feedId:f.id,title:'Story '+i,link:'https://w.test/s'+i,date:now-i*6e4,summary:'x',html:'<p>x</p>'}));
 S.read={};S.sel='s:'+f.id;render();await new Promise(r=>setTimeout(r,500));
 const sel=document.getElementById('pfm');
 const pick=async v=>{sel.value=v;sel.dispatchEvent(new Event('change'));await new Promise(r=>setTimeout(r,200))};
 o.opts=[...sel.options].map(x=>x.value).join(',');
 S.pfm=undefined;S.pfn=undefined;o.def=[pfMode(),pfN(),pfList().length];
 await pick('50');o.p50=[S.pfm,S.pfn,sel.value,pfList().length,new Set(pfList().map(a=>a.link)).size];
 await pick('100');o.p100=[S.pfn,pfList().length];
 await pick('200');o.p200=[S.pfn,pfList().length];
 await pick('off');o.off=S.pfm;
 await pick('100');o.back=[S.pfm,S.pfn];
 S.pfm='custom';o.clamp=[(S.pfn=-5,pfN()),(S.pfn='x',pfN()),(S.pfn=9999,pfN())];
 o.synced=SET_KEYS.includes('pfn');
 return o});
ck(w+' options are 50, 100, 200 and Off',R.opts==='50,100,200,off',R.opts);
ck(w+' standard is keep 100',R.def[0]==='custom'&&R.def[1]===100&&R.def[2]===100,JSON.stringify(R.def));
ck(w+' 50 saved and listed once each',R.p50[0]==='custom'&&R.p50[1]===50&&R.p50[2]==='50'&&R.p50[3]===50&&R.p50[4]===50,JSON.stringify(R.p50));
ck(w+' 100 and 200 fill from the available stories',R.p100[1]===100&&R.p200[1]===120,JSON.stringify([R.p100,R.p200]));
ck(w+' off still works',R.off==='off');
ck(w+' back from off',R.back[0]==='custom'&&R.back[1]===100,JSON.stringify(R.back));
ck(w+' bad stored numbers are clamped',R.clamp[0]===1&&R.clamp[1]===100&&R.clamp[2]===500,JSON.stringify(R.clamp));
ck(w+' number is synced',R.synced);
ck(w+' no page errors',!errs.length,errs.join('|'));await p.close()}
console.log('st24',pass,'pass',fail,'fail');log.forEach(l=>console.log(l));await b.close();process.exit(fail?1:0)})();
