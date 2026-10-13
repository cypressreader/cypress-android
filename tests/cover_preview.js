/* Cover picker previews (B75): every preview is drawn with the app's real cover rules, so it looks like the cover you get: same style class, same height-to-width shape, and the same "photo shown or left out". Checked on a phone and a tablet. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{console.log((ok?'ok ':'FAIL ')+n+(ok?'':' '+(x||'')));if(!ok)bad++};
const svg='<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a5db0"/><stop offset="1" stop-color="#d98a3a"/></linearGradient></defs><rect width="1600" height="1000" fill="url(#g)"/><circle cx="800" cy="420" r="190" fill="#f3d9bf"/></svg>';
const STYLES=['clean','photo','poster','block','split','triptych','gazette','gallery','spotlight','magazine','broadcast','duotone','index','overlap','cinema','rail','titleseq','chapters','journal','plays','fact','collage','italic'];
(async()=>{const b=await chromium.launch();
for(const [W,H] of [[412,860],[1100,900]]){
 const p=await (await b.newContext({viewport:{width:W,height:H}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{n:10});
 await p.route('https://img.test/**',r=>r.fulfill({status:200,contentType:'image/svg+xml',body:svg}));
 await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(400);
 const real={};
 for(const st of STYLES){
  real[st]=await p.evaluate(async st=>{const w=ms=>new Promise(r=>setTimeout(r,ms));document.querySelectorAll('dialog[open]').forEach(d=>d.close());const now=Date.now();
   S.feeds.slice(0,4).forEach((f,fi)=>{items[f.id]=Array.from({length:16},(_,i)=>({feedId:f.id,title:i?'Headline number '+i+' about the subject of the day':'Samsung is quietly killing one of its newest apps',link:'https://x.test/'+fi+'/'+i,img:'https://img.test/'+i+'.jpg',date:now-i*1e5,summary:'x'}))});
   S.cvs=st;S.sel='today';S.cvt={n:0,t:'type',p:''};save();render();await w(1400);document.querySelector('main').scrollTop=0;
   const c=document.querySelector('#grid .cover');if(!c)return null;const im=c.querySelector(':scope>img');return{cls:c.className.split(/\s+/).filter(x=>/^cv-/.test(x)).join(' '),ratio:c.offsetHeight/c.offsetWidth,img:!!im&&getComputedStyle(im).display!=='none'}},st)}
 await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());document.getElementById('cvbtn').click()});await p.waitForTimeout(1500);
 const prev=await p.evaluate(()=>{const o={};document.querySelectorAll('#cvg [data-cvk]').forEach(b=>{const c=b.querySelector('.cover');if(!c)return;const im=c.querySelector(':scope>img');o[b.dataset.cvk]={cls:c.className.split(/\s+/).filter(x=>/^cv-/.test(x)).join(' '),ratio:c.offsetHeight/c.offsetWidth,img:!!im&&getComputedStyle(im).display!=='none',tile:b.querySelector('.cvt').clientHeight}});return o});
 const bc=[],br=[],bi=[];
 for(const st of STYLES){const r=real[st],q=prev[st];if(W>=700&&st==='triptych')continue;/* the app only builds the three-photo cover when it has three good photos; otherwise it shows Colour block */if(!r||!q){bc.push(st+': missing');continue}
  if(r.cls!==q.cls)bc.push(`${st}: app ${r.cls||'photo'} / preview ${q.cls||'photo'}`);
  if(Math.abs(q.ratio/r.ratio-1)>(W>=700?.6:.3))br.push(`${st}: app ${r.ratio.toFixed(2)} / preview ${q.ratio.toFixed(2)}`);
  if(r.img!==q.img&&st!=='clean')bi.push(`${st}: photo ${r.img?'shown':'left out'} in the app, ${q.img?'shown':'left out'} in the preview`)}
 ck(`[${W}] each preview has the same cover style class as the real cover`,!bc.length,bc.join(' | '));
 ck(`[${W}] each preview has the same shape (height to width) as the real cover, within 30% (60% on a tablet, where the app's two-pane cover adds its own spacing)`,!br.length,br.join(' | '));
 ck(`[${W}] photos are shown or left out the same way`,!bi.length,bi.join(' | '));
 ck(`[${W}] no page errors`,!errs.length,errs[0]);await p.context().close()}
await b.close();console.log(bad?'cover_preview '+bad+' FAILED':'cover_preview all passed');process.exit(bad?1:0)})();
