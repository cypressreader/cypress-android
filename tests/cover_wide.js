/* B102: on tablet and wide screens no cover style shrinks its picture into a thumbnail or sets it beside big text: the picture runs the width of the cover (the way the phone cover reads), the text is above or below it. Runs every picture style at four tablet sizes. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
const svg=()=>`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b6ea5"/><stop offset="1" stop-color="#e0a458"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="60%" cy="38%" r="18%" fill="#fde9b8"/></svg>`;
const ST=['auto','clean','type','photo','poster','block','split','triptych','gazette','gallery','spotlight','magazine','broadcast','duotone','index','overlap','cinema','rail','titleseq','chapters','journal','plays','fact','collage','italic'];
let bad=0,n=0;const SIZES=(process.env.SIZES||'744x1133,820x1180,1024x768,1280x800').split(',').map(s=>s.split('x').map(Number));
(async()=>{const b=await chromium.launch();
for(const [W,H] of SIZES){
 const p=await (await b.newContext({viewport:{width:W,height:H}})).newPage();await mock(p,{n:10});
 await p.route('https://img.test/**',r=>r.fulfill({status:200,contentType:'image/svg+xml',body:svg()}));
 await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(400);
 await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 for(const st of ST){
  const r=await p.evaluate(async st=>{const w=ms=>new Promise(r=>setTimeout(r,ms));const now=Date.now();
   S.feeds.slice(0,4).forEach((f,fi)=>{items[f.id]=Array.from({length:16},(_,i)=>({feedId:f.id,title:i?'Headline number '+i+' of feed '+fi+' about the subject '+(i*7+fi):'Markets rally on rate hopes as investors weigh the next move',link:'https://w.test/'+fi+'/'+i,date:now-(i*55+fi*9+5)*6e4,summary:'A standfirst long enough to serve as a deck for the story in a couple of lines.',img:i<8?'https://img.test/x'+i+'.svg':'',html:''}));state[f.id]='ok'});
   S.cvs=st;S.sel='today';S.cvt={n:0,t:'type',p:''};save();render();await w(500);try{await document.fonts.ready}catch(e){}await w(100);document.querySelector('main').scrollTop=0;
   const cv=document.querySelector('#grid .dcov,#grid .cover');if(!cv)return{none:1};
   const cr=cv.getBoundingClientRect();const area=r=>r.width*r.height;
   let best=0,bi=null;cv.querySelectorAll('img,.cvph,[style*="background-image"],.cvp i').forEach(e=>{const r=e.getBoundingClientRect();const a=area(r);if(a>best&&r.width>40&&getComputedStyle(e).visibility!=='hidden'){best=a;bi=r}});
   const h=cv.querySelector('.cvlead h2,.dcv-lead h2'),hr=h&&h.getBoundingClientRect();
   return {cls:cv.className.replace(/\s+/g,' ').slice(0,40),cw:Math.round(cr.width),ch:Math.round(cr.height),pic:bi?Math.round(100*best/area(cr)):0,pw:bi?Math.round(bi.width):0,ph:bi?Math.round(bi.height):0,
    beside:!!(bi&&hr&&bi.right<=hr.left+4&&Math.abs((bi.top+bi.bottom)/2-(hr.top+hr.bottom)/2)<bi.height),hfs:h?Math.round(parseFloat(getComputedStyle(h).fontSize)):0,hx:hr?Math.round(hr.left-cr.left):0}},st);
  if(['auto','type','poster','titleseq','italic','collage'].includes(st)&&!r.pic)continue;/* type-only covers, and Collage which frames its own picture */
  n++;const f=[];
  if(r.none)f.push('no cover');else{
   if(r.beside)f.push('picture sits beside the headline');
   if(st!=='clean'&&r.pw<r.cw*.8&&!['gallery','gazette','index','overlap'].includes(st))f.push('picture is only '+r.pw+'px of a '+r.cw+'px cover');
   if(r.pw<r.cw*.8&&['gallery','gazette','index','overlap'].includes(st))f.push('framed picture is only '+r.pw+'px of a '+r.cw+'px cover');
   if(r.pic<24)f.push('picture is only '+r.pic+'% of the cover');
   if(r.ph<Math.min(220,r.cw*.4))f.push('picture is only '+r.ph+'px tall')}
  if(f.length){bad++;console.log('FAIL',W+'x'+H,st,f.join('; '),JSON.stringify(r))}
 }
}
await b.close();console.log(bad?'FAILED '+bad+' of '+n:'cover_wide all '+n+' passed');process.exit(bad?1:0)})();
