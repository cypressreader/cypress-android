/* Delight and access: shareable edition cover, widget list leads with the Daily cover story, reader follows the system text size, copy says "sources". */
const fs=require('fs'),path=require('path');
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 const src=fs.readFileSync(path.join(__dirname,'..','www','index.html'),'utf8');
 ck('copy sweep: no "of your sites" or "of your feeds" left in user text',!/of your (\d+ |\$\{[^}]+\} )?(sites|feeds)\b/.test(src.replace(/<section class="sgrp"[^]*?<\/section>/g,'').replace(/\/\*[^]*?\*\//g,'')),(src.match(/.{40}of your (sites|feeds).{20}/)||[''])[0]);
 const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:412,height:860}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});
 const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const now=Date.now();
  const im='data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#369"/><circle cx="800" cy="300" r="160" fill="#fc6"/></svg>');
  S.feeds.slice(0,4).forEach((f,fi)=>{items[f.id]=Array.from({length:10},(_,i)=>({feedId:f.id,title:'Story '+fi+i+' about unique '+['a','b','c','d','e','f','g','h','i','j'][i],link:'https://w.test/'+fi+'/'+i,date:now-(i+fi)*36e5,summary:'A standfirst long enough to be a dek for the piece, in a line or two of text.',img:i%2?'':im}));state[f.id]='ok'});
  S.welcome=0;S.sel='today';render();await w(1200);
  const out={};
  const wl=widgetList();out.widgetFirst=wl[0]&&wl[0].link===LEADK;out.widgetN=wl.length;
  const c=await edCoverImage();out.cover=c?[c.width,c.height]:null;
  if(c){const x=c.getContext('2d'),d=x.getImageData(540,1000,1,1).data;out.px=[...d];const d2=x.getImageData(200,400,1,1).data;out.bright=d2[0]+d2[1]+d2[2]>30}
  const before=S.fs;SYSFS=1.3;S.sysfs=true;applyFs(false);out.fs13=getComputedStyle($('#rd')).getPropertyValue('--fs');S.sysfs=false;applyFs(false);out.fsOff=getComputedStyle($('#rd')).getPropertyValue('--fs');SYSFS=0;S.sysfs=true;
  out.base=before;
  const a=items[S.feeds[0].id][0];a.more=[{l:'x',t:'t',f:'y'},{l:'x2',t:'t',f:'y'}];out.why=whyMatters(a);
  out.btns=[...document.querySelectorAll('.dexp')].map(b=>b.textContent);
  return out});
 ck('widget leads with the Daily cover story',r.widgetFirst&&r.widgetN>=3,JSON.stringify(r));
 ck('edition cover is a 1080x1350 picture',r.cover&&r.cover[0]===1080&&r.cover[1]===1350&&r.bright,JSON.stringify(r));
 ck('reader follows the system text size',Math.abs(parseFloat(r.fs13)-r.base*1.3)<.6&&parseFloat(r.fsOff)===r.base,JSON.stringify(r));
 ck('copy says sources',/Covered by 3 sources/.test(r.why),r.why);
 ck('Today offers the cover share beside the PDF',r.btns.includes('Share this cover')&&r.btns.includes('Export this edition as a PDF'),JSON.stringify(r.btns));
 ck('no page errors',!errs.length,errs[0]);await b.close();
 console.log('delight',bad?bad+' FAILED':'all passed');process.exit(bad?1:0);
})();
