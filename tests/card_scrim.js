/* B33: text on a photo card stays readable on a bright, busy photo (measured: the lighter parts of the picture behind the text against the text color) */
const {APP}=require('./env');const {mock,seed,PW}=require('./mock');const {chromium}=require(PW);const fs=require('fs'),path=require('path');
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
const img=fs.readFileSync(path.resolve(__dirname,'fixtures_bright.jpg'));
(async()=>{const b=await chromium.launch();
 for(const [name,vw,vh] of [['phone',390,900],['tablet',900,1100]]){
  const p=await (await b.newContext({viewport:{width:vw,height:vh}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{n:8});
  await p.route(/img\.test/,r=>r.fulfill({status:200,contentType:'image/jpeg',body:img}));
  await p.addInitScript(sd=>{try{localStorage.setItem('folio',JSON.stringify(sd))}catch(e){}},seed(['Alpha','Beta','Gamma']));
  await p.goto('file://'+APP);await p.waitForTimeout(2500);await p.click('text=Get started').catch(()=>{});
  await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());let i=0;Object.values(items).flat().forEach(a=>{a.img='https://img.test/'+(i++)+'.jpg'});S.nroom=false;S.sel='digest';S.dgk='morning';render();await new Promise(r=>setTimeout(r,1800))});
  const info=await p.evaluate(()=>{const c=[...document.querySelectorAll('#grid .card.lead,#grid .card.mid')].find(x=>x.querySelector('img')&&x.querySelector('.tx'));if(!c)return null;c.scrollIntoView({block:'center'});const rs=[...c.querySelectorAll('.tx h2,.tx h3,.tx h4,.tx b,.tx small,.tx time,.tx span,.tx p')].filter(e=>e.textContent.trim()&&e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,col:getComputedStyle(e).color}}).filter(r=>r.w>8&&r.h>6&&r.y>140&&r.y+r.h<innerHeight-70);c.querySelectorAll('.tx *').forEach(e=>e.style.visibility='hidden');return {rs}});
  if(!info||!info.rs.length){ck(name+': a photo card with text was found and in view',false,JSON.stringify(info));await p.close();continue}
  await p.waitForTimeout(100);let worst=99;
  for(const r of info.rs.slice(0,6)){const shot=await p.screenshot({clip:{x:Math.max(0,r.x),y:r.y,width:Math.min(r.w,vw-r.x),height:r.h}});
   const ratio=await p.evaluate(async([b64,col])=>{const im=await new Promise(res=>{const i=new Image();i.onload=()=>res(i);i.src='data:image/png;base64,'+b64});const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);const d=x.getImageData(0,0,c.width,c.height).data;const L=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};const ls=[];for(let k=0;k<d.length;k+=4)ls.push(.2126*L(d[k])+.7152*L(d[k+1])+.0722*L(d[k+2]));ls.sort((a,b)=>a-b);const m=col.match(/[\d.]+/g).map(Number),tl=.2126*L(m[0])+.7152*L(m[1])+.0722*L(m[2]),bg=ls[Math.floor(ls.length*.75)];return (Math.max(tl,bg)+.05)/(Math.min(tl,bg)+.05)},[shot.toString('base64'),r.col]);worst=Math.min(worst,ratio)}
  ck(name+': text on a bright busy photo keeps a contrast of at least 10:1 (measured '+worst.toFixed(1)+')',worst>=10,worst.toFixed(2));
  ck(name+': no page errors',!errs.length,errs[0]);await p.close()}
 await b.close();console.log(bad?'FAILED '+bad:'card_scrim all passed');process.exit(bad?1:0)})();
