/* B104: only the big image-led cards (hero, lead, tall, the wire's lead) drift their picture while you scroll; every other card's picture holds still. Never a mix inside one kind. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0,n=0;const ck=(nm,ok,x)=>{n++;if(!ok){bad++;console.log('FAIL',nm,x||'')}};
const svg=()=>`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000"><rect width="100%" height="100%" fill="#3b6ea5"/></svg>`;
(async()=>{const b=await chromium.launch();
 for(const [W,H] of [[390,800],[820,1180]]){
  const p=await (await b.newContext({viewport:{width:W,height:H}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{n:5});
  await p.route('https://img.test/**',r=>r.fulfill({status:200,contentType:'image/svg+xml',body:svg()}));
  await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(300);
  await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
  for(const sel of ['today','all','wire']){
   const r=await p.evaluate(async sel=>{const now=Date.now();S.feeds.slice(0,4).forEach((f,fi)=>{items[f.id]=Array.from({length:20},(_,i)=>({feedId:f.id,title:'Headline number '+i+' of feed '+fi+' about the subject '+(i*7+fi),link:'https://w.test/'+fi+'/'+i,date:now-(i*55+fi*9+5)*6e4,summary:'A standfirst long enough to serve as a deck for the story in a couple of lines.',img:'https://img.test/x'+i+'.svg',html:''}));state[f.id]='ok'});
    S.sel=sel;render();await new Promise(r=>setTimeout(r,1200));const m=document.querySelector('main');{const hc=document.querySelector('#grid .card.nr-hero');m.scrollTop=hc?Math.max(0,hc.getBoundingClientRect().top-m.getBoundingClientRect().top+m.scrollTop-120):300}/* the Daily's section headers are taller now, so scroll to the big card instead of a fixed 300px */m.dispatchEvent(new Event('scroll'));await new Promise(r=>setTimeout(r,400));
    const big=/\b(nr-hero|nr-lead|nr-tall|lead)\b/;const out={moving:{},still:{}};
    document.querySelectorAll('#grid .card>img').forEach(im=>{const c=im.parentElement;if(!c.getBoundingClientRect().width)return;const mv=im.style.getPropertyValue('--ip')!==''&&getComputedStyle(im).transform!=='none';const k=c.className.replace(/\b(noimg|read|act|pf\d+|card)\b/g,'').replace(/\s+/g,' ').trim()||'card';(big.test(c.className)?out.moving:out.still)[k]=((big.test(c.className)?out.moving:out.still)[k]||[]).concat(mv?1:0)});return out},sel);
   for(const [k,v] of Object.entries(r.moving))ck(`${W} ${sel}: big card "${k}" drifts (${v.length})`,v.every(x=>x===1),JSON.stringify(v));
   for(const [k,v] of Object.entries(r.still))ck(`${W} ${sel}: card "${k}" holds still (${v.length})`,v.every(x=>x===0),JSON.stringify(v));
  }
  ck(W+': no page errors',!errs.length,errs[0]);await p.close()}
 await b.close();console.log(bad?'FAILED '+bad+' of '+n:'card_parallax all '+n+' passed');process.exit(bad?1:0)})();
