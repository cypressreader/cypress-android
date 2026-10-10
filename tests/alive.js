/* Alive + personal: rotating covers never repeat two days running, thumbs move Smart ranking, "this day" block, story hub. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:412,height:860}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});
 const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const now=Date.now();const out={};
  const RD=Date;
  /* covers over 12 days, with and without a photo */
  const seq=[];S.cvt=null;
  for(let i=0;i<12;i++){const off=i*864e5;window.Date=class extends RD{constructor(...a){if(a.length)super(...a);else super(RD.now()+off+12*36e5-(RD.now()%864e5))}static now(){return RD.now()+off}};seq.push(coverTreat({img:i%4===1?'':'https://x/y.jpg'}));window.Date=RD}
  out.seq=seq.join(',');out.noRepeat=seq.every((t,i)=>!i||t!==seq[i-1]);out.allThree=new Set(seq).size===3;
  /* thumbs train Smart ranking */
  const f=S.feeds[0],g=S.feeds[1]||S.feeds[0];
  const A={feedId:f.id,title:'Alpha harbor story today',link:'https://w.test/a',date:now-36e5,summary:'x'},B={feedId:g.id,title:'Gamma orchard story today',link:'https://w.test/b',date:now-36e5,summary:'x'};
  S.lk={s:{},w:{}};const aff=dayAffinity();const s0=dayScore(A,aff,now).s,s0b=dayScore(B,aff,now).s;
  S.lk.s[f.id]=3;const s1=dayScore(A,aff,now).s;S.lk.s[f.id]=-3;const s2=dayScore(A,aff,now).s;S.lk={s:{},w:{}};
  out.up=s1>s0;out.down=s2<s0;out.same=Math.abs(s0-s0b)<1e-6||f.id!==g.id;
  /* this day */
  S.hist=[{l:'https://w.test/old',ti:'A story from last week',fid:f.id,ft:'Src',t:new Date(new Date().getFullYear(),new Date().getMonth(),new Date().getDate()-7,9).getTime()}];
  out.td=thisDayHtml();S.hist=[];out.tdNone=thisDayHtml()==='';
  /* hub */
  const T=['Dam bursts near river town','River town dam failure: what we know','Dam failure floods river town overnight','Unrelated story about cooking'];
  items[f.id]=T.map((t,i)=>({feedId:f.id,title:t,link:'https://w.test/h'+i,date:now-(i===3?1:i)*36e5*5,summary:'x',img:''}));S.feeds.slice(1).forEach(x=>items[x.id]=[]);state[f.id]='ok';
  items[f.id][0].more=[{l:'https://w.test/h1',t:T[1],f:f.id},{l:'https://other.test/z',t:'Elsewhere report',f:f.id}];
  S.sel='all';S.atab='latest';render();await w(600);
  const card0=[...document.querySelectorAll('#grid .card')].find(c=>/Dam bursts/.test(c.textContent));
  out.cardFound=!!card0;
  if(card0){(card0.querySelector('a')||card0).click();await w(900)}
  out.opened=document.querySelector('#rd.on')?1:0;out.noHubOnTap=!document.querySelector('#hub.on');
  items[f.id][0].more=[{l:'https://w.test/h1',t:T[1],f:f.id},{l:'https://other.test/z',t:'Elsewhere report',f:f.id}];openReader(items[f.id][0]);await w(1200);
  out.teaser=!!document.querySelector('.cov.covt');
  return out});
 ck('covers never repeat two days running',r.noRepeat,r.seq);ck('all three looks appear',r.allThree,r.seq);
 ck('thumbs up raises score',r.up);ck('thumbs down lowers score',r.down);
 ck('this day block shows a week-ago story',/A week ago today/.test(r.td)&&/last week/.test(r.td),r.td);ck('this day empty with no history',r.tdNone);
 ck('card tap opens the article',r.opened===1,JSON.stringify(r));ck('card tap does not open the hub',r.noHubOnTap);
 ck('reader shows coverage teaser',r.teaser);
 const h=await p.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));const o={};
  const btn=document.querySelector('.cov.covt');btn&&btn.click();await w(300);
  const hub=document.querySelector('#hub');o.open=!!(hub&&hub.classList.contains('on'));o.role=hub&&hub.getAttribute('role');o.focusIn=!!(hub&&hub.contains(document.activeElement));
  o.rows=hub?hub.querySelectorAll('.hr,.hh').length:0;o.heads=hub?[...hub.querySelectorAll('h3')].map(x=>x.textContent):[];
  document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await w(200);o.closed=!document.querySelector('#hub.on');o.focusBack=document.activeElement===btn||!!document.querySelector('#rd.on');
  o.menu=[...document.querySelectorAll('#mn button')].some(x=>x.textContent==='Full coverage');
  btn&&btn.click();await w(200);const row=document.querySelector('#hub .hr[data-hopen]');const t=row&&row.dataset.hopen;row&&row.click();await w(900);
  o.hubClosed=!document.querySelector('#hub.on');o.openedOther=!!(curA&&curA.link===t);
  return o});
 ck('teaser opens the hub',h.open&&h.role==='dialog',JSON.stringify(h));ck('focus moves into hub',h.focusIn);ck('hub has sections',h.rows>=2&&h.heads.length>=2,JSON.stringify(h));
 ck('Escape closes the hub',h.closed);ck('reader menu has Full coverage',h.menu);ck('hub row opens that story and closes hub',h.hubClosed&&h.openedOther,JSON.stringify(h));
 ck('no page errors',errs.length===0,errs.join('|'));
 await b.close();console.log(bad?'FAILED '+bad:'alive all passed');process.exit(bad?1:0);
})();
