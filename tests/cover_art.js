/* Today cover: the photo shows whenever the story has one (small and portrait photos included); a photo that cannot load is logged and the cover switches to its designed fallback; typographic and minimal covers are composed to fill the cover (pull quote, numeral, centred headline) so they never read as a missing picture or an empty panel. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
const svg=(w,h)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#46a"/><circle cx="60%" cy="35%" r="18%" fill="#fde9b8"/></svg>`;
(async()=>{
 const b=await chromium.launch();
 const CASES=[['photo','big'],['photo','small'],['photo','portrait'],['photo','tiny'],['photo','404'],['type','big'],['min','big'],['type','none']];
 for(const [W,H] of [[412,860],[820,1180],[1180,820],[1366,1024]])for(const [t,kind] of CASES){
  const p=await (await b.newContext({viewport:{width:W,height:H}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:10});
  await p.route('https://img.test/**',r=>{const u=r.request().url();if(/404/.test(u))return r.fulfill({status:404,body:'x'});const sz=/small/.test(u)?[400,260]:/portrait/.test(u)?[700,1000]:/tiny/.test(u)?[120,80]:[1600,1000];r.fulfill({status:200,contentType:'image/svg+xml',body:svg(...sz)})});
  await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(400);
  const r=await p.evaluate(async([t,kind])=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const now=Date.now();
   const u=kind==='none'?'':'https://img.test/'+kind+'.svg';
   S.feeds.slice(0,4).forEach((f,fi)=>{items[f.id]=Array.from({length:16},(_,i)=>({feedId:f.id,title:i?'Headline number '+i+' of feed '+fi+' about subject'+(i*7+fi):'After 4 Hours, Phantom Blade Zero Just Became My Most-Anticipated Action Game Of The Year',link:'https://w.test/'+fi+'/'+i,img:(i===0&&fi===0)?u:'',date:now-(i*55+fi*9)*6e4,summary:i===0?'“I did not expect to feel this way about a game that I had only just started playing,” said the reviewer, adding that the combat was the finest of the year.':'A long enough summary of this story to count as a lede for sure here, with several words.'}))});
   const n=Math.floor(Date.UTC(new Date().getFullYear(),new Date().getMonth(),new Date().getDate())/864e5);S.cvt={n,t,p:''};S.sel='today';render();await w(2600);
   const cv=document.querySelector('#grid .dcov'),o={};if(!cv)return {none:true};
   const cr=cv.getBoundingClientRect(),hd=cv.querySelector('.dcv-top').getBoundingClientRect(),mn=cv.querySelector('.dcv-main').getBoundingClientRect(),pg=cv.querySelector('.dcv-prog').getBoundingClientRect();
   o.cls=cv.className;o.h=cr.height;o.gapTop=mn.top-hd.bottom;o.gapBot=cr.bottom-pg.top-(mn.bottom<pg.top?0:0)>0?pg.top-mn.bottom:0;
   o.fill=((hd.height+mn.height+pg.height)/cr.height);
   const im=cv.querySelector('.dcv-art>img');o.img=!!im;o.imgOk=!!im&&im.classList.contains('ok')&&getComputedStyle(im).opacity==='1';
   o.quote=!!cv.querySelector('.dcv-q')&&getComputedStyle(cv.querySelector('.dcv-q')).display!=='none';o.num=getComputedStyle(cv.querySelector('.dcv-num')).display!=='none';
   o.svgOp=cv.querySelector('.dcv-art>svg')?+getComputedStyle(cv.querySelector('.dcv-art>svg')).opacity:null;
   o.logged=(typeof ELOG!=='undefined'?ELOG:[]).some(e=>/cover art/.test(JSON.stringify(e)));
   o.title=cv.querySelector('h2').textContent.length>0;
   return o},[t,kind]);
  const tag='['+W+'x'+H+' '+t+'/'+kind+'] ';
  if(r.none){ck(tag+'cover renders',false);await p.close();continue}
  if(t==='photo'&&['big','small','portrait'].includes(kind))ck(tag+'the story\'s photo is shown',r.imgOk&&!/dct-fb/.test(r.cls),JSON.stringify(r));
  if(t==='photo'&&['tiny','404'].includes(kind)){ck(tag+'a photo that cannot be used is logged and the cover switches to its designed fallback',/dct-fb/.test(r.cls)&&r.logged&&!r.img,JSON.stringify(r));ck(tag+'the fallback is composed (art lit, quote, numeral)',r.quote&&r.num&&r.svgOp===1,JSON.stringify(r))}
  if(t!=='photo'||['tiny','404'].includes(kind)){
   ck(tag+'a cover with no photo carries a pull quote or standfirst and the edition numeral',r.quote&&r.num,JSON.stringify(r));
   ck(tag+'no empty panel: the content gap under the masthead is under 40% of the cover and the cover is filled',r.gapTop<=r.h*.4&&r.fill>=.5,JSON.stringify({gap:r.gapTop,h:r.h,fill:r.fill}));
  }
  ck(tag+'no page errors',!errs.length,errs[0]);await p.close();
 }
 await b.close();console.log(bad?'cover_art '+bad+' FAILED':'cover_art all passed');process.exit(bad?1:0);
})();
