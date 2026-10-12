/* Covers: "Type" is a style in the picker that can be pinned (the typographic cover every day, no photo needed); and every other cover style is at the Type cover's scale: nearly full screen, edge to edge, a big display headline. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x===undefined?'':x)}else console.log('ok',n)};
const svg=(w,h)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#46a"/><circle cx="60%" cy="35%" r="18%" fill="#fde9b8"/></svg>`;
const STYLES=['photo','poster','block','gazette','gallery','spotlight','magazine','broadcast','duotone','index','overlap','cinema','rail','titleseq','chapters','journal','plays','fact','collage','italic'];
(async()=>{const b=await chromium.launch();
 const p=await (await b.newContext({viewport:{width:412,height:860}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{n:10});
 await p.route('https://img.test/**',r=>r.fulfill({status:200,contentType:'image/svg+xml',body:svg(1600,1000)}));
 await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(400);
 await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const now=Date.now();S.feeds.slice(0,4).forEach((f,fi)=>{items[f.id]=Array.from({length:16},(_,i)=>({feedId:f.id,title:i?'Headline number '+i+' of feed '+fi+' about the subject '+(i*7+fi):'After 4 Hours, Phantom Blade Zero Just Became My Most-Anticipated Action Game Of The Year',link:'https://w.test/'+fi+'/'+i,date:now-(i*55+fi*9+5)*6e4,summary:'A standfirst long enough to serve as a deck for the story in a couple of lines.',img:i<8?'https://img.test/x'+i+'.svg':'',html:''}));state[f.id]='ok'})});
 /* the picker */
 const pk=await p.evaluate(async()=>{cvPickFill();const g=document.querySelector('#cvg');const btn=g.querySelector('[data-cvk="type"]');return{has:!!btn,name:btn&&btn.querySelector('span b').textContent,prev:!!(btn&&btn.querySelector('.cvtm')),names:CVNAMES.length}});
 ck('Type is in the cover picker with its own preview',pk.has&&pk.name==='Type'&&pk.prev,JSON.stringify(pk));
 /* pinned: the typographic cover on different days and with or without a photo */
 for(const [day,photo] of [[0,true],[1,true],[2,true],[0,false]]){
  const r=await p.evaluate(async([day,photo])=>{const w=ms=>new Promise(r=>setTimeout(r,ms));S.cvs='type';S.cvt={n:day,t:['photo','type','min'][day],p:''};const f=S.feeds[0].id;items[f][0].img=photo?'https://img.test/x0.svg':'';S.sel='today';save();render();await w(1500);const cv=document.querySelector('#grid .dcov');return cv?{cls:cv.className,h:Math.round(cv.getBoundingClientRect().height),num:getComputedStyle(cv.querySelector('.dcv-num')).display!=='none'}:null},[day,photo]);
  ck('Type pinned (rotation day '+day+', '+(photo?'with':'no')+' photo): the typographic cover shows',!!r&&/dct-type/.test(r.cls)&&r.h>=700,JSON.stringify(r));
 }
 await p.evaluate(()=>{const f=S.feeds[0].id;items[f][0].img='https://img.test/x0.svg'});
 /* a click on the picker sets and keeps it */
 await p.evaluate(()=>{S.cvs='clean';save();cvPickFill()});await p.click('#cvg [data-cvk="type"]',{force:true}).catch(async()=>{await p.evaluate(()=>document.querySelector('#cvg [data-cvk="type"]').click())});
 ck('choosing Type in the picker pins it',await p.evaluate(()=>S.cvs==='type'));
 /* every other style at the Type scale */
 for(const st of STYLES){
  const r=await p.evaluate(async st=>{const w=ms=>new Promise(r=>setTimeout(r,ms));S.cvs=st;S.sel='today';save();render();await w(1200);const cv=document.querySelector('#grid .cover');if(!cv)return null;const h2=cv.querySelector('.cvlead h2'),cr=cv.getBoundingClientRect();return{h:Math.round(cr.height),w:Math.round(cr.width),fs:parseFloat(getComputedStyle(h2).fontSize),vh:innerHeight}},st);
  ck('['+st+'] fills the screen ('+(r&&r.h)+' of '+(r&&r.vh)+' px), edge to edge ('+(r&&r.w)+' px) with a big headline ('+(r&&r.fs)+' px)',!!r&&r.h>=r.vh*.8&&r.w>=396&&r.fs>=30,JSON.stringify(r));
 }
 ck('no page errors',!errs.length,errs[0]);
 await b.close();console.log('cover_type',bad?bad+' FAILED':'all passed');process.exit(bad?1:0)})();
