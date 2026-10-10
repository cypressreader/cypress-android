/* Clean extraction: junk lines captured from REAL BBC / The Verge / Ars Technica / The Guardian / Engadget pages are removed by their publisher rules while the story paragraphs stay;
   a suspiciously short or cluttered result says so and offers "View the site here". */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
const P=(w,k)=>'<p>'+Array.from({length:w},(_,i)=>['The','committee','met','on','Tuesday','to','discuss','harbour','plans','for','winter','repairs'][(i+k)%12]).join(' ')+'. “We cannot keep doing this and expect a different outcome,” said the council leader after the meeting ended.</p>';
const CASES=[
 ['https://www.bbc.co.uk/news/articles/x1',['Reuters','Getty Images','AFP'],'bbc'],
 ['https://www.theverge.com/x',['Part Of The AI Superintelligence Slowdown see all updates','See all updates','Weekend Editor'],'verge'],
 ['https://arstechnica.com/x',['Story text','* Subscribers only Learn more','Social Media','Performance','Audience Measurement','Jacek Krywko – Oct 10, 2026 7:15 am | 40','Eric Berger Senior Space Editor'],'ars'],
 ['https://www.theguardian.com/world/x',['View image in fullscreen','Prefer the Guardian on Google','Reuse this content','Fri 9 Oct 2026 05.59 EDT Last modified on Fri 9 Oct 2026 10.39 EDT'],'guardian'],
 ['https://www.engadget.com/x',['Add Engadget on Google:'],'engadget']];
(async()=>{
 const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:412,height:860}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await mock(p,{n:6});await p.goto('file://'+APP);await p.waitForTimeout(1300);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(300);
 const r=await p.evaluate(async(CASES)=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const out={};const mkP=(wd,k)=>'<p>'+Array.from({length:wd},(_,i)=>['The','committee','met','on','Tuesday','to','discuss','harbour','plans','for','winter','repairs'][(i+k)%12]).join(' ')+'. “We cannot keep doing this and expect a different outcome,” said the council leader after the meeting ended.</p>';
  out.cases=[];
  for(const [url,junk,name] of CASES){const frag=document.createElement('div');frag.innerHTML=mkP(60,0)+junk.map(j=>'<p>'+j+'</p>').join('')+mkP(60,3)+mkP(60,5);
   junkClean(frag,url);const t=frag.textContent;out.cases.push({name,left:junk.filter(j=>t.includes(j)),paras:frag.querySelectorAll('p').length})}
  /* Report junk text teaches the site's next story */
  S.jk=S.jk||{};S.jk.t=S.jk.t||{};S.jk.t['example.test']=[jkNorm('Our weekly offers just for you today')];
  {const frag=document.createElement('div');frag.innerHTML=mkP(60,0)+'<p>Our weekly offers just for you today</p>'+mkP(60,3)+mkP(60,5);junkClean(frag,'https://www.example.test/a');out.learned=!frag.textContent.includes('weekly offers just for you')&&frag.querySelectorAll('p').length>=3}
  /* the honest fallback */
  const f=S.feeds[0];const short=document.createElement('div');short.innerHTML=mkP(95,0);const long=document.createElement('div');long.innerHTML=mkP(120,0)+mkP(120,3)+mkP(120,5);
  for(const [nm,frag] of [['short',short],['long',long]]){window.__frag=frag;const a={feedId:f.id,title:'Fallback '+nm,link:'https://w.test/fb'+nm,date:Date.now(),summary:'x',img:'',html:'<p>x</p>'};items[f.id]=[a];S.sel='all';render();await w(200);
   const g0=window.getFull;window.getFull=async()=>{const d=document.createElement('div');d.innerHTML=frag.innerHTML;const fr=document.createDocumentFragment();while(d.firstChild)fr.append(d.firstChild);fr.tier='direct';return fr};
   openReader(a);await w(2200);window.getFull=g0;const nt=document.querySelector('.cols .note');out[nm]={note:nt?nt.textContent:'',btn:!!document.querySelector('.cols .note [data-web]'),words:document.querySelector('.cols .body').textContent.trim().split(/\s+/).length};
   document.querySelector('#cl')&&document.querySelector('#cl').click();await w(300)}
  return out},CASES);
 for(const c of r.cases)ck('['+c.name+'] its junk lines are removed and the story paragraphs stay',c.left.length===0&&c.paras>=3,JSON.stringify(c));
 ck('a line reported as junk is skipped in that site\'s next story',r.learned,'');
 ck('a suspiciously short result says so and offers "View the site here"',r.short.btn&&/View the site here/.test(r.short.note),JSON.stringify(r.short));
 ck('a normal-length story shows no such notice',!r.long.btn,JSON.stringify(r.long));
 ck('no page errors',!errs.length,errs[0]);
 await b.close();console.log(bad?'clean_extract '+bad+' FAILED':'clean_extract all passed');process.exit(bad?1:0);
})();
