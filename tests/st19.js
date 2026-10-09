const {APP}=require('./env');
const {mock,PW}=require('./mock');const {chromium}=require(PW);
let pass=0,fail=0;const log=[];const ck=(n,c,x='')=>{if(c)pass++;else{fail++;log.push(`FAIL ${n} ${x}`)}};
(async()=>{const b=await chromium.launch();
for(const [vw,vh,tag] of [[1000,900,'wide'],[390,800,'phone']]){
const p=await (await b.newContext({viewport:{width:vw,height:vh}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await mock(p,{n:6});await p.goto('file://'+APP);await p.waitForTimeout(1500);
const setup=async(seenAgoH,hide)=>p.evaluate(async([seenAgoH,hide])=>{
 const f=S.feeds[0],now=Date.now(),H=36e5;S.hideCount=hide;
 items[f.id]=Array.from({length:12},(_,i)=>({feedId:f.id,title:'Story number '+i+' about the economy',link:'https://w.test/s'+i,date:i<5?now-(i+1)*H:now-(10+i)*H,summary:'x',html:'<p>x</p>'}));
 for(const g of S.feeds.slice(1))items[g.id]=[];
 S.read={};S.seen={};S.seen['s:'+f.id]=now-seenAgoH*H;
 S.sel='all';_lastSel=null;render();await new Promise(r=>setTimeout(r,200));
 S.sel='today';render();S.sel='s:'+f.id;S.seen['s:'+f.id]=now-seenAgoH*H;render();await new Promise(r=>setTimeout(r,500));
 const g=document.querySelector('#grid'),kids=[...g.querySelectorAll('.wline,.card[data-i]')],wi=kids.findIndex(e=>e.classList.contains('wline'));
 const before=kids.slice(0,Math.max(wi,0)).filter(e=>!e.classList.contains('wline')).map(e=>chref(e)),after=kids.slice(wi+1).filter(e=>!e.classList.contains('wline')).map(e=>chref(e));
 return{wi,lines:g.querySelectorAll('.wline').length,before,after,txt:(g.querySelector('.wline')||{}).textContent,cards:kids.length}},[seenAgoH,hide]);
let r=await setup(6,false);
const idx=l=>+l.replace('https://w.test/s','');
ck(tag+' waterline appears',r.wi>0&&r.lines===1,JSON.stringify(r));
ck(tag+' all new stories sit above it',[0,1,2,3,4].every(i=>r.before.includes('https://w.test/s'+i)),JSON.stringify(r.before));
ck(tag+' only old stories below',r.after.length>0&&r.after.every(l=>idx(l)>=5),JSON.stringify(r.after));
ck(tag+' label',/Before your last visit/.test(r.txt||''));
r=await setup(0.01,false);ck(tag+' no line when nothing new',r.lines===0,JSON.stringify(r));
r=await setup(100,false);ck(tag+' no line when everything is new',r.lines===0,JSON.stringify(r));
// dots vs numbers
await setup(6,true);let d=await p.evaluate(()=>{S.seen={};S.seen['s:'+S.feeds[0].id]=Date.now()-6*36e5;_lastSel=null;S.sel='all';render();const row=document.querySelector('#side .fr[data-sel^="s:"] ,.fr[data-sel^="s:"]');return{dot:document.querySelectorAll('u.nd').length,num:[...document.querySelectorAll('.fr u:not(.nd),.nav u:not(.nd)')].length}});
ck(tag+' quiet mode shows dots, no numbers',d.dot>0&&d.num===0,JSON.stringify(d));
await setup(6,false);d=await p.evaluate(()=>{S.seen={};S.seen['s:'+S.feeds[0].id]=Date.now()-6*36e5;_lastSel=null;S.sel='all';render();return{dot:document.querySelectorAll('u.nd').length,num:[...document.querySelectorAll('.fr u:not(.nd),.nav u:not(.nd)')].length}});
ck(tag+' counts mode shows numbers, no dots',d.num>0&&d.dot===0,JSON.stringify(d));
// leaving a view clears its dot
d=await p.evaluate(async()=>{S.hideCount=true;S.seen={};S.seen['s:'+S.feeds[0].id]=Date.now()-6*36e5;S.sel='all';_lastSel=null;render();const before=document.querySelectorAll('u.nd').length;S.sel='today';render();await new Promise(r=>setTimeout(r,100));return{before,after:document.querySelectorAll('u.nd').length}});
ck(tag+' dots clear after you view the stories',d.before>0&&d.after===0,JSON.stringify(d));
ck(tag+' pill is gone',await p.evaluate(()=>typeof newPill==='undefined'&&!document.getElementById('newpill')));
ck(tag+' count still caps at 99+',await p.evaluate(()=>{S.hideCount=false;return bad(150)==='<u>99+</u>'&&bad(7)==='<u>7</u>'}));
ck(tag+' no page errors',!errs.length,errs.join('|'));
await p.close()}
console.log('st19',pass,'pass',fail,'fail');log.forEach(l=>console.log(l));await b.close();process.exit(fail?1:0)})();
