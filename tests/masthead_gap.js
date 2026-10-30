/* Masthead and edition line (B42): the tail of the "y" in the paper name never touches or overlaps the line under it, on every cover style. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{console.log((ok?'ok ':'FAIL ')+n+(ok?'':' '+(x||'')));if(!ok)bad++};
const svg=()=>`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b6ea5"/><stop offset="1" stop-color="#e0a458"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="60%" cy="38%" r="18%" fill="#fde9b8"/></svg>`;
const STYLES0=['type','photo','poster','block','gazette','gallery','spotlight','magazine','broadcast','duotone','index','overlap','cinema','rail','titleseq','chapters','journal','plays','fact','collage','italic'];
const SIZES=(process.env.SIZES||'412x860,820x900').split(',').map(x=>x.split('x').map(Number));
(async()=>{const b=await chromium.launch();const fails=[];
 for(const [W,H] of SIZES){const p=await (await b.newContext({viewport:{width:W,height:H}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{n:10});
  await p.route('https://img.test/**',r=>r.fulfill({status:200,contentType:'image/svg+xml',body:svg()}));
  await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(400);
  if(process.env.CSS)await p.addStyleTag({content:process.env.CSS});await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close())});
  for(const st of (process.env.STYLES?process.env.STYLES.split(','):STYLES0)){
   const r=await p.evaluate(async([st,ht])=>{const w=ms=>new Promise(r=>setTimeout(r,ms));const now=Date.now();
    S.feeds.slice(0,4).forEach((f,fi)=>{items[f.id]=Array.from({length:16},(_,i)=>({feedId:f.id,title:i?'Headline number '+i+' of feed '+fi+' about the subject '+(i*7+fi):ht,link:'https://w.test/'+fi+'/'+i,date:now-(i*55+fi*9+5)*6e4,summary:'A standfirst long enough to serve as a deck for the story in a couple of lines.',img:i<8?'https://img.test/x'+i+'.svg':'',html:''}));state[f.id]='ok'});
    if(window.__th){S.theme=window.__th;try{applyTheme(true)}catch(e){}}S.cvs=st;S.sel='today';S.cvt={n:0,t:'type',p:''};save();render();await w(500);try{await document.fonts.ready}catch(e){}await w(100);document.querySelector('main').scrollTop=0;
    const cv=document.querySelector('#grid .dcov,#grid .cover');if(!cv)return{none:1};const m=cv.querySelector('.cvm,.dcv-mast');if(!m)return{nomast:1};
    const cs=getComputedStyle(m);if(cs.display==='none'||cs.visibility==='hidden')return{nomast:1};
    const c=document.createElement('canvas').getContext('2d');c.font=cs.fontStyle+' '+cs.fontWeight+' '+cs.fontSize+' '+cs.fontFamily;const t=c.measureText(m.textContent.trim());
    const r=m.getBoundingClientRect(),fs=parseFloat(cs.fontSize),lh=parseFloat(cs.lineHeight)||fs*1.2,A=t.fontBoundingBoxAscent,D=t.fontBoundingBoxDescent;
    const inkBottom=r.top+(lh-(A+D))/2+A+t.actualBoundingBoxDescent;
    /* only a line under the letters themselves counts: the name's box can be wider than its text, and the Index cover sets the edition line beside the name */const ink=(()=>{const g=document.createRange();g.selectNodeContents(m);return g.getBoundingClientRect()})();let nxt=null,best=1e9;for(const e of cv.querySelectorAll('.cvd,.cvlead small,.cvlead h2,.dcv-ed,.dcv-lead small,.dcv-lead h2')){const q=e.getBoundingClientRect();if(!q.height||m.contains(e))continue;if(q.top>r.top+r.height*.4&&q.top<best&&q.left<ink.right-(parseFloat(cs.letterSpacing)||0)/* the text box carries the spacing after the last letter */&&q.right>ink.left){best=q.top;nxt=e}}
    return{gap:nxt?Math.round((best-inkBottom)*10)/10:99,fs:Math.round(fs),el:nxt&&nxt.className}},[st,'Markets rally on rate hopes']);
   process.stdout.write(st+' ');if(r.none||r.nomast)continue;
   if(r.gap<2)fails.push(`${W}x${H} ${st}: the paper name's tail touches the line under it (gap ${r.gap}px at ${r.fs}px)`);
  }
  if(errs.length)fails.push(W+': page error '+errs[0]);await p.context().close()}
 await b.close();console.log();fails.forEach(f=>console.log('FAIL',f));console.log(fails.length?'masthead_gap '+fails.length+' FAILED':'masthead_gap all passed');process.exit(fails.length?1:0)})();
