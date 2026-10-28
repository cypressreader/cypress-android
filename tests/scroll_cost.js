/* Deep reads and Sunday scroll smoothly: no item in them runs a scroll-driven animation (animation-timeline), which made the browser redo styles for every item on every scrolled frame (about 6x the style work), and the style work during a scroll stays small. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x===undefined?'':x)}else console.log('ok',n)};
const svg=c=>`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000"><rect width="100%" height="100%" fill="${c}"/></svg>`;
(async()=>{const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:412,height:860},hasTouch:true,isMobile:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{n:30});
 await p.route('https://img.test/**',r=>r.fulfill({status:200,contentType:'image/svg+xml',body:svg('#3b6ea5')}));
 const cdp=await ctx.newCDPSession(p);await cdp.send('Performance.enable');
 await p.goto('file://'+APP);await p.waitForTimeout(1500);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(500);
 await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const now=Date.now();const long='<p>'+'Long read paragraph words keep going for a good while so the story counts as long. '.repeat(30)+'</p>';
  S.feeds.slice(0,4).forEach((f,fi)=>{items[f.id]=Array.from({length:40},(_,i)=>({feedId:f.id,title:'Story number '+i+' of feed '+fi+' about the subject '+(i*7+fi),link:'https://w.test/'+fi+'/'+i,date:now-(i*55+fi*9+5)*6e4,summary:'A standfirst long enough to serve as a deck for the story.',img:i%5?'https://img.test/'+fi+'_'+i+'.svg':'',html:long.repeat(i%3?1:6),wc:i%3?400:2400}));state[f.id]='ok'});S.rt={};S.feeds.slice(0,4).forEach(f=>items[f.id].forEach((a,i)=>{S.rt[a.link]=i%3?3:11}));save()});
 for(const [name,sel,tab] of [['Deep reads','all','deep'],['Sunday','digest','week']]){
  await p.evaluate(async([sel,tab])=>{const w=ms=>new Promise(r=>setTimeout(r,ms));S.sel=sel;if(sel==='all'){S.atab=tab;S.dtab=tab}if(sel==='digest')S.dgk=tab;save();render();await w(2500)},[sel,tab]);
  const M0=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
  const r=await p.evaluate(async()=>{const m=document.querySelector('main');const sun=[...document.querySelectorAll('.sun-i')];const timeline=[...document.querySelectorAll('#grid *')].slice(0,3000).filter(e=>{const c=getComputedStyle(e);return c.animationTimeline&&!/^(auto|none)/.test(c.animationTimeline)}).length;
   let y=0;await new Promise(res=>{const st=()=>{y+=26;m.scrollTop=y;if(y>=Math.min(m.scrollHeight-m.clientHeight,5000))res();else requestAnimationFrame(st)};st()});return{sun:sun.length,timeline}});
  const M1=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));const rc=M1.RecalcStyleCount-M0.RecalcStyleCount;
  ck(name+': no scroll-driven animations on its items ('+r.sun+' items)',r.timeline===0,JSON.stringify(r));
  ck(name+': style recalculations while scrolling stay small ('+rc+')',rc<360,String(rc)/* about one recalculation a frame: the lead pictures drift a little as they scroll (card_parallax), which is one variable update per frame */);
 }
 ck('no page errors',!errs.length,errs[0]);
 await b.close();console.log('scroll_cost',bad?bad+' FAILED':'all passed');process.exit(bad?1:0)})();
