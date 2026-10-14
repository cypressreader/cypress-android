/* B103: the small divider inside a story (a horizontal rule, and the break the reader sets between sections) is the CyPress tree-C mark, not the generic flourish, in the light and dark themes. */
const {APP}=require('./env');const {mock,seed,PW}=require('./mock');const {chromium}=require(PW);
let bad=0,n=0;const ck=(nm,ok,x)=>{n++;if(!ok){bad++;console.log('FAIL',nm,x||'')}else console.log('ok',nm)};
const P=k=>'<p>'+('Paragraph '+k+' of the story, long enough to count as real text for the reader. ').repeat(4)+'</p>';
(async()=>{const b=await chromium.launch();
 for(const th of ['light','dark']){
  const p=await (await b.newContext({viewport:{width:390,height:800},isMobile:true,hasTouch:true})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{n:3});
  await p.addInitScript(([sd,th])=>{try{localStorage.setItem('folio',JSON.stringify(Object.assign({},sd,{theme:th})))}catch(e){}},[seed(['Alpha']),th]);
  await p.goto('file://'+APP);await p.waitForTimeout(1500);await p.click('text=Get started').catch(()=>{});
  const r=await p.evaluate(async html=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const f=S.feeds[0];const a={feedId:f.id,title:'Divider story',link:'https://w.test/d',date:Date.now(),summary:'x',img:'',html};items[f.id]=[a,...(items[f.id]||[])];S.sel='all';render();await openReader(a);await new Promise(r=>setTimeout(r,2200));
   const body=document.querySelector('.cols .body,.body');const d=document.createElement('div');d.className='rbrk';d.setAttribute('aria-hidden','true');d.textContent='❦';body.append(d);await new Promise(r=>setTimeout(r,100));
   const q=(e,ps)=>{const cs=getComputedStyle(e,ps);return {mask:(cs.webkitMaskImage||cs.maskImage||'').slice(0,40),bg:cs.backgroundColor,w:Math.round(parseFloat(cs.width)),content:cs.content,fs:cs.fontSize}};
   const hr=body.querySelector('hr');return {hr:hr&&q(hr),hrAfter:hr&&q(hr,'::after'),brk:q(d),nhr:body.querySelectorAll('hr').length}},P(1)+P(2)+'<hr>'+P(3)+P(4));
  ck(th+': a rule in a story is drawn with the CyPress mark',r.nhr>=1&&/url|var/.test(r.hr.mask)&&r.hr.mask!=='none',JSON.stringify(r.hr));
  ck(th+': the rule no longer carries the generic flourish',!r.hrAfter||/^(none|normal)$/.test(r.hrAfter.content),JSON.stringify(r.hrAfter));
  ck(th+': the section break is drawn with the CyPress mark',/url|var/.test(r.brk.mask)&&r.brk.mask!=='none'&&r.brk.fs==='0px',JSON.stringify(r.brk));
  ck(th+': the marks are small ('+r.hr.w+'px)',r.hr.w>=18&&r.hr.w<=40,JSON.stringify(r));
  ck(th+': no page errors',!errs.length,errs[0]);await p.close()}
 await b.close();console.log(bad?'FAILED '+bad:'story_divider all '+n+' passed');process.exit(bad?1:0)})();
