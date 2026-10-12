/* Drop cap: a paragraph opening in capitals shows a drop cap with normal-case text (names keep their capitals), the first line is not small caps, and the cap spans no more than the first two lines so no gap opens beside line three */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x===undefined?'':x)}else console.log('ok',n)};
(async()=>{const b=await chromium.launch();
 for(const W of [412,1100]){
  const p=await (await b.newContext({viewport:{width:W,height:860}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{n:3});
  await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});
  const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const f=S.feeds[0].id,more='<p>'+'Further reporting on the story from Trump and the officials involved, with plenty of words to fill the page. '.repeat(14)+'</p>';
   const a={feedId:f,title:'Tiger story',link:'https://s.test/story-7',date:Date.now(),summary:'s',img:'',html:'<p>A MAN HAS DIED AFTER ENTERING A tiger enclosure at a wildlife park in Yorkshire, police said on Sunday, and investigators were at the scene for most of the day and into the night.</p><p>TRUMP SAYS HE WILL SIGN THE ORDER later this week according to the White House and officials briefed on it, which would end the dispute.</p>'+more+more};
   items[f]=[a];state[f]='ok';acPut(a.link,a.html,1);S.sel='all';S.scroll='page';render();openReader(a);await new Promise(r=>setTimeout(r,1800));
   const ps=[...document.querySelectorAll('.cols .body p.dropcap')],t=ps.map(x=>x.textContent.slice(0,60)),fl=getComputedStyle(ps[0]||document.body,'::first-line').fontVariantCaps;
   const cap=document.querySelector('.cols .body p.dropcap .dcap'),pp=cap&&cap.parentElement,lh=pp?parseFloat(getComputedStyle(pp).lineHeight):0;
   return{t,fl,ch:cap?cap.getBoundingClientRect().height:0,lh,n:ps.length}});
  const tag=W+': ';
  ck(tag+'the first paragraph has a drop cap',r.n>=1,JSON.stringify(r));
  ck(tag+'its capitals became normal sentence case',/^A man has died after entering a tiger enclosure/.test(r.t[0]||''),r.t[0]);
  ck(tag+'a name keeps its capital',/^Trump says he will sign the order/.test(r.t[1]||'')||r.n<2,r.t[1]);
  ck(tag+'the first line is not small caps',r.fl==='normal',r.fl);
  ck(tag+'the cap is no taller than two lines of text (no gap beside line three)',r.lh>0&&r.ch<=r.lh*2+2,r.ch+' vs line '+r.lh);
  ck(tag+'no page errors',!errs.length,errs[0]);await p.context().close();
 }
 await b.close();console.log('drop_cap',bad?bad+' FAILED':'all passed');process.exit(bad?1:0)})();
