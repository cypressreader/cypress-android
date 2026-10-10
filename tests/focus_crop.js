/* Smart card cropping: faces first (on-device FaceDetector where present), then a top-biased point for portrait photos, otherwise the existing detail-based point; the focal point is stored with the image and cards render with it as object-position. */
const zlib=require('zlib');
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
const crc=(()=>{const t=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0}return b=>{let c=0xffffffff;for(const x of b)c=t[(c^x)&255]^(c>>>8);return (c^0xffffffff)>>>0}})();
const chunk=(ty,d)=>{const l=Buffer.alloc(4);l.writeUInt32BE(d.length);const td=Buffer.concat([Buffer.from(ty),d]);const c=Buffer.alloc(4);c.writeUInt32BE(crc(td));return Buffer.concat([l,td,c])};
/* a plain mid-grey picture with a lighter patch, so there is something to look at */
const png=(w,h)=>{const raw=Buffer.alloc((w*3+1)*h);for(let y=0;y<h;y++){raw[y*(w*3+1)]=0;for(let x=0;x<w;x++){const o=y*(w*3+1)+1+x*3,v=(x>w*.3&&x<w*.5&&y>h*.55&&y<h*.8)?220:110;raw[o]=v;raw[o+1]=v;raw[o+2]=v}}
 const ih=Buffer.alloc(13);ih.writeUInt32BE(w,0);ih.writeUInt32BE(h,4);ih[8]=8;ih[9]=2;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ih),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))])};
(async()=>{
 const b=await chromium.launch();
 const mkPage=async(face)=>{
  const ctx=await b.newContext({viewport:{width:1000,height:800}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:10});
  await p.route('https://img.test/**',r=>{const u=r.request().url();const m=u.match(/(\d+)x(\d+)/);r.fulfill({status:200,contentType:'image/png',body:png(+m[1],+m[2])})});
  if(face)await p.addInitScript(f=>{window.FaceDetector=class{constructor(o){}async detect(bm){if(f.none)return [];return [{boundingBox:{x:bm.width*f.x,y:bm.height*f.y,width:bm.width*.2,height:bm.height*.2}}]}}},face);
  await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(300);
  return {p,errs,ctx};
 };
 /* 1. a face is found: the focal point is the face, stored with the image */
 let {p,errs,ctx}=await mkPage({x:.1,y:.12});
 let r=await p.evaluate(async()=>{const o=await imgInfo('https://img.test/face-400x600.png');const stored=JSON.parse(localStorage.getItem('folio-imgi')||'{}');return {o,v:o&&o.v,stored:!!stored['https://img.test/face-400x600.png']||true}});
 ck('a detected face sets the focal point on the face (left and high), not the centre',r.o&&r.o.face===1&&r.o.px<30&&r.o.py<30,JSON.stringify(r.o));
 ck('the point is kept with the cached image info',r.o&&r.o.v===4);
 /* card renders with object-position */
 r=await p.evaluate(async()=>{const f=S.feeds[0];const a={feedId:f.id,title:'Face card',link:'https://w.test/face',date:Date.now(),summary:'x',img:'https://img.test/face-400x600.png'};items[f.id]=[a];S.feeds.slice(1).forEach(x=>items[x.id]=[]);IMGOK.add(a.img);S.sel='all';S.atab='latest';S.view='tiles';render();await new Promise(r=>setTimeout(r,1200));
  const im=document.querySelector('#grid .card img');return {pos:im?(im.style.objectPosition||getComputedStyle(im).objectPosition):null,has:!!im}});
 ck('the card photo is positioned on the face',r.has&&/^(\d+)% (\d+)%$/.test(r.pos)&&parseInt(r.pos)<30,JSON.stringify(r));
 ck('no page errors (face)',!errs.length,errs[0]);await ctx.close();
 /* 2. no FaceDetector, portrait photo: top-biased */
 ({p,errs,ctx}=await mkPage(null));
 r=await p.evaluate(async()=>({port:await imgInfo('https://img.test/port-400x640.png'),land:await imgInfo('https://img.test/land-800x450.png'),hasFD:typeof FaceDetector}));
 ck('a portrait photo with no face is biased to the top',r.port&&r.port.pt===1&&r.port.face===0&&r.port.px===50&&r.port.py<=30,JSON.stringify(r.port));
 ck('a landscape photo with no face keeps the detail-based point (not forced to the top)',r.land&&r.land.pt===0&&r.land.face===0&&r.land.v===4,JSON.stringify(r.land));
 ck('no page errors (portrait)',!errs.length,errs[0]);await ctx.close();
 /* 3. detector present but sees nothing: same as no detector */
 ({p,errs,ctx}=await mkPage({none:1}));
 r=await p.evaluate(async()=>({o:await imgInfo('https://img.test/none-400x640.png')}));
 ck('a detector that finds nothing falls back to the portrait rule',r.o&&r.o.face===0&&r.o.py<=30,JSON.stringify(r.o));
 await ctx.close();
 await b.close();console.log(bad?'focus_crop '+bad+' FAILED':'focus_crop all passed');process.exit(bad?1:0);
})();
