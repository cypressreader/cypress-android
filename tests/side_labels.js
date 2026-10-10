/* Sidebar rows: when the name and "N · M min" cannot share a line the figures move to a quieter second line; a name is never cut while its label is showing. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 const b=await chromium.launch();
 for(const [W,sw] of [[1280,'330px'],[1280,'250px'],[1280,'205px'],[412,'320px'],[1280,'150px']]){
  const p=await (await b.newContext({viewport:{width:W,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(300);
  const r=await p.evaluate(async([sw,W])=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const now=Date.now();
   document.documentElement.style.setProperty('--sw',sw);
   const names=['TechCrunch','The Verge Review Desk','Ars Technica','BBC World Service News','AP','Wired UK Magazine'];
   S.feeds.slice(0,4).forEach((f,i)=>{f.title=names[i];items[f.id]=Array.from({length:7},(_,k)=>({feedId:f.id,title:'S'+k,link:'https://w.test/'+i+'/'+k,date:now-k*36e5,summary:'x',wc:900}));state[f.id]='ok'});
   S.sel='all';render();await w(500);if(W<700){try{drawer(true)}catch(e){}}await w(500);fitSide();await w(200);
   return [...document.querySelectorAll('#side-list .fr')].filter(r=>r.querySelector('.frm')).map(r=>{const t=r.querySelector('.frt'),m=r.querySelector('.frm'),n=r.querySelector('.frn'),tr=t.getBoundingClientRect(),mr=m.getBoundingClientRect();return {name:t.textContent.trim(),cls:r.className,cut:t.scrollWidth>t.clientWidth+1,labelVisible:getComputedStyle(m).display!=='none'&&mr.width>0,below:mr.top>=tr.bottom-2,sameLine:Math.abs((mr.top+mr.height/2)-(tr.top+tr.height/2))<8,fs:parseFloat(getComputedStyle(m).fontSize),nfs:parseFloat(getComputedStyle(t).fontSize),inside:mr.right<=document.querySelector('aside').getBoundingClientRect().right+1}})},[sw,W]);
  const t='['+W+' '+sw+'] ';
  ck(t+'rows with labels exist',r.length>=3,JSON.stringify(r).slice(0,300));
  ck(t+'a name is never cut while its label shows',r.every(x=>!(x.labelVisible&&x.cut)),JSON.stringify(r.filter(x=>x.labelVisible&&x.cut)));
  ck(t+'two-line rows: figures sit below the name, smaller',r.filter(x=>/fr2/.test(x.cls)).every(x=>x.below&&x.fs<x.nfs&&x.inside),JSON.stringify(r.filter(x=>/fr2/.test(x.cls))));
  ck(t+'one-line rows keep name and figures on one line',r.filter(x=>!/fr2|fr3/.test(x.cls)).every(x=>x.sameLine),JSON.stringify(r.filter(x=>!/fr2|fr3/.test(x.cls))));
  if(sw==='330px'&&W>700)ck(t+'a wide sidebar keeps short names on one line',r.filter(x=>x.name.length<=12).every(x=>!/fr2|fr3/.test(x.cls)),JSON.stringify(r.map(x=>[x.name,x.cls])));
  if(sw==='205px')ck(t+'a narrow sidebar uses the second line for long names',r.some(x=>/fr2/.test(x.cls)),JSON.stringify(r.map(x=>[x.name,x.cls])));
  ck(t+'no page errors',!errs.length,errs[0]);await p.close();
 }
 await b.close();console.log(bad?'side_labels '+bad+' FAILED':'side_labels all passed');process.exit(bad?1:0);
})();
