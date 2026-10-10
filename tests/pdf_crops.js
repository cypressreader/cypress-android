/* PDF pictures: a heavy crop would cut people off (headless torsos), so any picture that would lose more than 12% in its frame is shown whole on a blurred copy of itself, and a mild crop keeps the subject in frame with headroom. A bright disc stands in for a face; it must come out whole (round, clear of every frame edge) in every frame the PDF uses, from landscape, square and portrait photos. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:900,height:700}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await mock(p,{n:6});await p.goto('file://'+APP);await p.waitForTimeout(1300);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(300);
 const r=await p.evaluate(async()=>{
  const out=[];
  const mkPhoto=(w,h,cx,cy,rad)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,w,h);g.addColorStop(0,'#27506b');g.addColorStop(1,'#1a2a33');x.fillStyle=g;x.fillRect(0,0,w,h);x.fillStyle='#ff2d95';x.beginPath();x.arc(cx*w,cy*h,rad*Math.min(w,h),0,7);x.fill();return createImageBitmap(c)};
  const scan=async v=>{const bm=await createImageBitmap(new Blob([v.bytes],{type:'image/jpeg'}));const c=document.createElement('canvas');c.width=bm.width;c.height=bm.height;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(bm,0,0);const d=x.getImageData(0,0,c.width,c.height).data;let x0=1e9,y0=1e9,x1=-1,y1=-1;for(let j=0;j<c.height;j+=2)for(let i=0;i<c.width;i+=2){const k=(j*c.width+i)*4;if(d[k]>200&&d[k+1]<110&&d[k+2]>110&&d[k+2]<210){x0=Math.min(x0,i);x1=Math.max(x1,i);y0=Math.min(y0,j);y1=Math.max(y1,j)}}return {w:c.width,h:c.height,x0,y0,x1,y1}};
  const photos=[['landscape 16:9 (face upper left)',1600,900,.2,.3,.12],['landscape 16:9 (face at the right edge)',1600,900,.9,.4,.1],['landscape 3:2 (face low)',1500,1000,.5,.7,.12],['square (face top)',1000,1000,.5,.25,.12],['portrait 2:3 (face top)',800,1200,.5,.2,.1],['wide 2:1 (face left)',2000,1000,.12,.5,.12]];
  for(const [nm,w,h,cx,cy,rad] of photos){const bm=await mkPhoto(w,h,cx,cy,rad);const foc={px:Math.round(cx*100),py:Math.round(cy*100),pt:h>w*1.15?1:0};
   for(const k of ['k','o','c','p']){if(k==='p'&&w/h>1.3)continue;const v=await pdfFrame(bm,PDFFR[k],foc);const s=await scan(v);out.push({nm,k,fw:s.w,fh:s.h,found:s.x1>=0,x0:s.x0,y0:s.y0,x1:s.x1,y1:s.y1})}}
  return out});
 const names={k:'cover',o:'opener',c:'card',p:'half-bleed'};
 for(const o of r){const wd=o.x1-o.x0,ht=o.y1-o.y0,round=Math.abs(wd-ht)<=Math.max(6,.12*Math.max(wd,ht)),clear=o.x0>=3&&o.y0>=3&&o.x1<=o.fw-4&&o.y1<=o.fh-4;
  ck('['+o.nm+'] in the '+names[o.k]+' frame the face is whole (round, clear of the edges)',o.found&&round&&clear,JSON.stringify(o));}
 ck('no page errors',!errs.length,errs[0]);
 await b.close();console.log(bad?'pdf_crops '+bad+' FAILED':'pdf_crops all passed');process.exit(bad?1:0);
})();
