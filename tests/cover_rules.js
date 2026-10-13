/* Cover design rules, for every cover style:
   1. the photo is either clearly visible (at least a third of the cover shows it unobscured) or not there at all;
   2. no text is cut off (no hidden lines, no "..." in headline, kicker or story boxes);
   3. nothing overlaps (headline, kicker, masthead, story boxes, small pictures);
   4. small pictures are big enough to recognise (at least 72 px);
   5. story-box text is readable (at least 12 px, boxes wide enough to hold a few words on a line). */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
const STYLES=(process.env.STYLES||'type,photo,poster,block,gazette,gallery,spotlight,magazine,broadcast,duotone,index,overlap,cinema,rail,titleseq,chapters,journal,plays,fact,collage,italic').split(',');
const SIZES=(process.env.SIZES||'360x740,412x860,820x1180').split(',').map(s=>s.split('x').map(Number));
const TITLES=['Australia politics live: PM urged to call Trump about execution livestream','Iran war latest: Putin loses 30,000 soldiers in one month as commanders send troops into kill zones','Fortune’s Weave: new classes and unlock requirements in Fire Emblem','Tropical Storm Rachel downgraded as high winds turn inward'];
const MAGENTA=`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000"><rect width="100%" height="100%" fill="#ff00ff"/></svg>`;
(async()=>{const b=await chromium.launch();let bad=0,checks=0;const fails=[];
 for(const [W,H] of SIZES){
  const p=await (await b.newContext({viewport:{width:W,height:H}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{n:10});
  const LIME=MAGENTA.replace('#ff00ff','#40ff40');await p.route('https://img.test/**',r=>r.fulfill({status:200,contentType:'image/svg+xml',body:/\/y\d/.test(r.request().url())?LIME:MAGENTA}));
  await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(400);
  await p.evaluate(TT=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const now=Date.now();
   S.feeds.slice(0,4).forEach((f,fi)=>{items[f.id]=Array.from({length:16},(_,i)=>({feedId:f.id,title:TT[(i+fi)%TT.length],link:'https://w.test/'+fi+'/'+i,date:now-(i*55+fi*9+5)*6e4,summary:'A standfirst long enough to serve as a deck for the story in a couple of lines.',img:i<8?'https://img.test/x'+i+'.svg':'',html:''}));state[f.id]='ok'})},TITLES);
  for(const st of STYLES){
   await p.evaluate(async st=>{const w=ms=>new Promise(r=>setTimeout(r,ms));S.cvs=st;S.sel='today';S.cvt={n:0,t:'type',p:''};save();render();await w(700);try{await document.fonts.ready}catch(e){}await w(150);document.querySelector('main').scrollTop=0},st);
   const cv=await p.$('#grid .dcov,#grid .cover');if(!cv){fails.push(`${W} ${st}: no cover`);bad++;continue}
   /* rule 1: how much of the cover is made of the photo? Draw it with two different test pictures and count the pixels that differ (tinted or greyed photos count too; text, glass and washes hide it). */
   const shotA=await cv.screenshot();
   await p.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));S.feeds.slice(0,4).forEach(f=>items[f.id].forEach((a,i)=>{if(a.img)a.img='https://img.test/y'+i+'.svg'}));render();await w(700);try{await document.fonts.ready}catch(e){}await w(150);document.querySelector('main').scrollTop=0});
   const cv2=await p.$('#grid .dcov,#grid .cover');const shotB=await cv2.screenshot();
   await p.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));S.feeds.slice(0,4).forEach(f=>items[f.id].forEach((a,i)=>{if(a.img)a.img='https://img.test/x'+i+'.svg'}));});
   const vis=await p.evaluate(async([a,b])=>{const ld=async s=>{const im=new Image();im.src='data:image/png;base64,'+s;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);return x.getImageData(0,0,c.width,c.height).data};const A=await ld(a),B=await ld(b);let n=0,t=0;for(let i=0;i<A.length&&i<B.length;i+=16){t++;const d=Math.abs(A[i]-B[i])+Math.abs(A[i+1]-B[i+1])+Math.abs(A[i+2]-B[i+2]);if(d>200)n++}return n/t},[shotA.toString('base64'),shotB.toString('base64')]);
   const r=await p.evaluate(()=>{const cv=document.querySelector('#grid .dcov,#grid .cover');const cr=cv.getBoundingClientRect();const out=[];
    const T=[...cv.querySelectorAll('h2,.cvlead small,.dcv-lead small,.cvm,.dcv-mast,.cvd,.dcv-ed,.cvl span,.cvl small,.dcv-l span,.dcv-l small,.cvv,.dcv-q,.dcv-sub')].filter(e=>{const c=getComputedStyle(e);return c.display!=='none'&&c.visibility!=='hidden'&&e.getBoundingClientRect().width>4&&e.getBoundingClientRect().height>4&&e.textContent.trim().length>0});
    const R=e=>{const r=e.getBoundingClientRect();return{l:r.left,t:r.top,r:r.right,b:r.bottom}};const inter=(a,b)=>Math.max(0,Math.min(a.r,b.r)-Math.max(a.l,b.l))*Math.max(0,Math.min(a.b,b.b)-Math.max(a.t,b.t));
    /* rule 2 */
    for(const e of T){const c=getComputedStyle(e);const clamp=(c.webkitLineClamp&&c.webkitLineClamp!=='none')||/hidden|clip/.test(c.overflowY)||c.textOverflow==='ellipsis';if(clamp&&(e.scrollHeight>e.clientHeight+2||(c.textOverflow==='ellipsis'&&e.scrollWidth>e.clientWidth+1)))out.push('text cut off: '+(e.className||e.tagName)+' "'+e.textContent.trim().slice(0,28)+'"')}
    /* rule 3: text boxes that overlap one another (a box inside another is its own label) */
    for(let i=0;i<T.length;i++)for(let j=i+1;j<T.length;j++){if(T[i].contains(T[j])||T[j].contains(T[i]))continue;const a=R(T[i]),b=R(T[j]);const ov=inter(a,b);if(ov>12&&Math.min(Math.min(a.r,b.r)-Math.max(a.l,b.l),Math.min(a.b,b.b)-Math.max(a.t,b.t))>4)out.push('overlap: "'+T[i].textContent.trim().slice(0,18)+'" ('+T[i].tagName+(T[i].className?'.'+T[i].className:'')+' '+Math.round(a.t)+'-'+Math.round(a.b)+') over "'+T[j].textContent.trim().slice(0,18)+'" ('+T[j].tagName+(T[j].className?'.'+T[j].className:'')+' '+Math.round(b.t)+'-'+Math.round(b.b)+')')}
    /* small pictures */
    const S2=[...cv.querySelectorAll('.cvth,.cvp>i,.cvl i')].filter(e=>getComputedStyle(e).display!=='none'&&e.getBoundingClientRect().width>0);
    for(const s of S2){const a=R(s);const w=a.r-a.l,h=a.b-a.t;if(Math.min(w,h)<72)out.push('small picture too small ('+Math.round(w)+'x'+Math.round(h)+')');for(const e of T){if(s.contains(e)||e.contains(s)||s.parentElement.contains(e)&&s.parentElement!==cv&&false)continue;const ov=inter(a,R(e));if(ov>60&&!s.parentElement.contains(e))out.push('text over a small picture: '+(e.className||e.tagName))}}
    /* rule 5 */
    for(const e of cv.querySelectorAll('.cvl span,.dcv-l span')){const c=getComputedStyle(e);if(c.display==='none')continue;const fs=parseFloat(c.fontSize);const w=e.getBoundingClientRect().width;if(fs<12)out.push('story text under 12px ('+fs+')');if(w>0&&w<110)out.push('story box too narrow ('+Math.round(w)+'px)')}
    return out},);
   checks++;
   /* rule 1: visible or absent */
   const hasImg=await p.evaluate(()=>{const cv=document.querySelector('#grid .dcov,#grid .cover');const im=cv.querySelector(':scope>img,.dcv-art>img');if(!im)return false;const c=getComputedStyle(im);return c.display!=='none'&&c.visibility!=='hidden'&&+c.opacity>0.05});
   const msgs=[...r];if(hasImg&&vis<.30)msgs.push(`photo hardly shows (${Math.round(vis*100)}% of the cover) but is still there`);
   if(msgs.length){bad++;fails.push(`${W}x${H} ${st}: ${[...new Set(msgs)].slice(0,6).join('; ')}`)}
  }
  if(errs.length){bad++;fails.push(W+': page error '+errs[0])}
  await p.context().close()}
 await b.close();fails.forEach(f=>console.log('FAIL',f));console.log('cover_rules',bad?bad+' of '+checks+' FAILED':'all '+checks+' passed');process.exit(bad?1:0)})();
