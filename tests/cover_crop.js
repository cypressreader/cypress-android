/* Cover photos never lose their faces: with a test photo of two people (one near the right edge) on a flag, every cover style either leaves the photo out or shows at least one face whole and clear of the text, and shows both faces whole unless its picture area is a small thumbnail. A narrow slice that shows only the flag is a failure. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
const STYLES=(process.env.STYLES||'photo,poster,block,split,gazette,gallery,spotlight,magazine,broadcast,duotone,index,overlap,cinema,rail,titleseq,chapters,journal,plays,fact,collage,italic').split(',');
const SIZES=(process.env.SIZES||'360x740,412x860,820x1180').split(',').map(s=>s.split('x').map(Number));
const FACES=[{cx:.36,cy:.40,r:.13},{cx:.88,cy:.42,r:.11}];/* centres and radius as fractions of the photo's height (x of the width) */
const PHOTO=`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000"><defs><pattern id="s" width="100" height="154" patternUnits="userSpaceOnUse"><rect width="100" height="77" fill="#b22234"/><rect y="77" width="100" height="77" fill="#fff"/></pattern></defs><rect width="100%" height="100%" fill="url(#s)"/><rect width="640" height="540" fill="#3c3b6e"/>${FACES.map(f=>`<circle cx="${f.cx*1600}" cy="${f.cy*1000}" r="${f.r*1000}" fill="#e8b48a"/><circle cx="${f.cx*1600-f.r*350}" cy="${f.cy*1000-f.r*150}" r="${f.r*70}" fill="#222"/><circle cx="${f.cx*1600+f.r*350}" cy="${f.cy*1000-f.r*150}" r="${f.r*70}" fill="#222"/><rect x="${f.cx*1600-f.r*700}" y="${f.cy*1000+f.r*950}" width="${f.r*1400}" height="${f.r*2200}" fill="#223"/>`).join('')}</svg>`;
(async()=>{const b=await chromium.launch();let bad=0,checks=0;const fails=[];
 for(const [W,H] of SIZES){
  const p=await (await b.newContext({viewport:{width:W,height:H}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{n:10});
  await p.route('https://img.test/**',r=>r.fulfill({status:200,contentType:'image/svg+xml',body:PHOTO}));
  await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(400);
  await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const now=Date.now();S.feeds.slice(0,4).forEach((f,fi)=>{items[f.id]=Array.from({length:16},(_,i)=>({feedId:f.id,title:['Australia politics live: PM urged to call Trump about execution livestream','Iran war latest: Putin loses 30,000 soldiers in one month','Fortune’s Weave: new classes and unlock requirements','Tropical Storm Rachel downgraded as high winds turn inward'][(i+fi)%4],link:'https://w.test/'+fi+'/'+i,date:now-(i*55+fi*9+5)*6e4,summary:'A standfirst for the story.',img:i<8?'https://img.test/x'+i+'.svg':'',html:''}));state[f.id]='ok'})});
  for(const st of STYLES){
   const r=await p.evaluate(async([st,FACES])=>{const w=ms=>new Promise(r=>setTimeout(r,ms));S.cvs=st;S.sel='today';S.cvt={n:0,t:'type',p:''};save();render();await w(900);try{await document.fonts.ready}catch(e){}await w(200);document.querySelector('main').scrollTop=0;
    const cv=document.querySelector('#grid .cover');if(!cv)return{none:1};const im=cv.querySelector(':scope>img');const cr=cv.getBoundingClientRect();
    if(!im||getComputedStyle(im).display==='none'||+getComputedStyle(im).opacity<.05)return{noPhoto:1};
    if(!im.naturalWidth)return{notLoaded:1};
    const ir=im.getBoundingClientRect(),cs=getComputedStyle(im),iw=im.naturalWidth,ih=im.naturalHeight;const fit=cs.objectFit;
    const sc=fit==='contain'?Math.min(ir.width/iw,ir.height/ih):Math.max(ir.width/iw,ir.height/ih);const dw=iw*sc,dh=ih*sc;const pos=(cs.objectPosition||'50% 50%').split(' ').map(x=>parseFloat(x)/100);const ox=ir.left+(ir.width-dw)*(isNaN(pos[0])?.5:pos[0]),oy=ir.top+(ir.height-dh)*(isNaN(pos[1])?.5:pos[1]);
    const blocks=[...cv.querySelectorAll('.cvtop,.cvbot')].map(x=>x.getBoundingClientRect());
    const thumb=ir.width*ir.height<150*150*2;
    const faces=FACES.map(f=>{const x0=ox+(f.cx*1600-f.r*1000)*sc,x1=ox+(f.cx*1600+f.r*1000)*sc,y0=oy+(f.cy*1000-f.r*1000)*sc,y1=oy+(f.cy*1000+f.r*1000)*sc;
     const inside=x0>=ir.left-1&&x1<=ir.right+1&&y0>=ir.top-1&&y1<=ir.bottom+1&&x0>=0&&x1<=innerWidth&&y0>=0&&y1<=innerHeight+0;
     /* hidden behind text blocks (their text, not their empty area): count a block that covers more than 35% of the face */
     let hid=false;const fa=(x1-x0)*(y1-y0);for(const b of blocks){const ov=Math.max(0,Math.min(x1,b.right)-Math.max(x0,b.left))*Math.max(0,Math.min(y1,b.bottom)-Math.max(y0,b.top));if(ov>fa*.35)hid=true}
     return{inside,hid}});
    return{faces,fit,thumb,w:Math.round(ir.width),h:Math.round(ir.height)}},[st,FACES]);
   checks++;
   if(r.none){fails.push(`${W} ${st}: no cover`);bad++;continue}
   if(r.noPhoto||r.notLoaded)continue;
   const ok=r.faces.filter(f=>f.inside&&!f.hid).length;
   if(ok<1){bad++;fails.push(`${W}x${H} ${st}: no face is whole and clear (${r.fit}, picture area ${r.w}x${r.h}); ${JSON.stringify(r.faces)}`)}
   else if(ok<2&&!r.thumb){bad++;fails.push(`${W}x${H} ${st}: only one of two faces shows (${r.fit}, ${r.w}x${r.h})`)}
  }
  if(errs.length){bad++;fails.push(W+': page error '+errs[0])}
  await p.context().close()}
 await b.close();fails.forEach(f=>console.log('FAIL',f));console.log('cover_crop',bad?bad+' of '+checks+' FAILED':'all '+checks+' passed');process.exit(bad?1:0)})();
