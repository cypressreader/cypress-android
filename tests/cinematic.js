/* B39: cinematic long reads. Long stories (about 800 words and more) scrolled down the page get a full-width lead photo, full-width pictures that drift against the text, big numbered section headings and floating captions. One-picture stories lead with the picture then settle into plain rhythm; stories with no picture are carried by type. Never a broken gap. */
const {APP}=require('./env');const {mock,seed,PW}=require('./mock');const {chromium}=require(PW);const fs=require('fs'),path=require('path');
let bad=0,n=0;const ck=(nm,ok,x)=>{n++;if(!ok){bad++;console.log('FAIL',nm,x||'')}else console.log('ok',nm)};
const land=fs.readFileSync(path.resolve(__dirname,'fixtures_hero.jpg')),port=fs.readFileSync(path.resolve(__dirname,'fixtures_portrait.jpg'));
const P=(k,w=70)=>'<p>'+('Paragraph '+k+' of the story, with some commas, a few clauses, and the sort of ordinary running text a long read has. ').repeat(Math.ceil(w/20)).split(' ').slice(0,w).join(' ')+'.</p>';
const FIG=(u,c)=>'<figure><img src="https://pics.test/'+u+'" width="1200" height="800" alt=""><figcaption>'+c+'</figcaption></figure>';
const body=(imgs,sections=3)=>{let h='';for(let s=0;s<sections;s++){h+=(s?'<h2>Section number '+(s+1)+' of the story</h2>':'')+P(s*10+1)+P(s*10+2)+P(s*10+3);if(imgs[s])h+=imgs[s];h+=P(s*10+4)+P(s*10+5)+P(s*10+6)+P(s*10+7)}return h};
const LONG=(imgs,sections=4)=>body(imgs,sections);
const cases={
 rich:{hero:true,html:LONG([FIG('a.jpg','A caption under the first picture, kept short.'),FIG('b.jpg','Second picture. Credit: Someone / Agency'),'<p><img src="https://pics.test/portrait.jpg" width="600" height="1000" alt=""></p>',FIG('d.jpg','Fourth picture.')])},
 one:{hero:true,html:LONG([])},
 none:{hero:false,html:LONG([])},
 short:{hero:true,html:P(1)+P(2)+P(3)+FIG('a.jpg','Caption')+P(4)},
 broken:{hero:true,html:LONG([FIG('a.jpg','Works'),FIG('missing.jpg','Does not load')])}
};
(async()=>{const b=await chromium.launch();
 for(const [W,H] of [[390,800],[820,1180]]){
  const ctx=await b.newContext({viewport:{width:W,height:H},hasTouch:W<900,isMobile:W<700});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{n:3});
  await p.route(/pics\.test|hero\.test/,r=>r.fulfill({status:200,contentType:'image/jpeg',body:land}));
  await p.route(/pics\.test\/portrait/,r=>r.fulfill({status:200,contentType:'image/jpeg',body:port}));
  await p.route(/pics\.test\/missing/,r=>r.fulfill({status:404,body:''}));
  await p.addInitScript(([sd])=>{try{localStorage.setItem('folio',JSON.stringify(Object.assign({},sd,{scroll:'vertical'})))}catch(e){}},[seed(['Alpha'])]);
  await p.goto('file://'+APP);await p.waitForTimeout(1500);await p.click('text=Get started').catch(()=>{});
  const open=async(key)=>{const c=cases[key];return await p.evaluate(async ([key,html,hero])=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const f=S.feeds[0];const a={feedId:f.id,title:'Cinematic '+key,link:'https://w.test/'+key+Math.random(),date:Date.now(),summary:'x',img:hero?'https://hero.test/hero.jpg':'',html};items[f.id]=[a,...(items[f.id]||[])];S.sel='all';render();await openReader(a);await new Promise(r=>setTimeout(r,2600));return true},[key,c.html,c.hero])};
  const probe=()=>p.evaluate(()=>{const rd=document.getElementById('rd'),b=document.querySelector('.cols .body'),cols=document.querySelector('.cols'),cw=cols.getBoundingClientRect().width;
   const figs=[...b.querySelectorAll('figure.cfr')],hero=document.querySelector('.cols>img.hero'),h2=[...b.querySelectorAll('h2')];
   const cs=e=>getComputedStyle(e);
   return {cls:rd.className,cw:Math.round(cw),nfig:figs.length,figW:figs.map(f=>Math.round(f.getBoundingClientRect().width)),heroW:hero?Math.round(hero.getBoundingClientRect().width):0,
    capIn:figs.every(f=>{const c=f.querySelector('figcaption');if(!c)return true;const cr=c.getBoundingClientRect(),fr=f.getBoundingClientRect();return cr.bottom<=fr.bottom+1&&cr.top>=fr.top-1}),
    portraitFull:[...b.querySelectorAll('img')].some(i=>/portrait/.test(i.src)&&i.closest('figure.cfr')),
    h2fs:h2.length?Math.round(parseFloat(cs(h2[0]).fontSize)):0,h2num:h2.length?getComputedStyle(h2[0],'::before').content:'',
    pull:b.querySelectorAll('.pullq').length,drop:!!b.querySelector('.dropcap'),fb:[...b.querySelectorAll('figure .imgfb')].map(x=>Math.round(x.getBoundingClientRect().height)),
    words:(b.textContent.match(/\S+/g)||[]).length}});
  /* rich: the full treatment */
  await open('rich');let r=await probe();
  ck(`${W}: a long story with pictures is cinematic (${r.words} words)`,/\bcine\b/.test(r.cls)&&!/cine-t|cine-1/.test(r.cls),r.cls);
  ck(`${W}: the lead photo runs full width (${r.heroW}px in a ${r.cw}px column)`,r.heroW>=r.cw,JSON.stringify(r));
  ck(`${W}: landscape pictures run as wide as the lead photo, in frames (${r.nfig})`,r.nfig>=3&&r.figW.every(w=>w>=r.heroW-2&&w>=r.cw),JSON.stringify(r));
  ck(`${W}: a tall picture stays inline, not stretched across the page`,!r.portraitFull,JSON.stringify(r));
  ck(`${W}: captions float inside the frame`,r.capIn,JSON.stringify(r));
  ck(`${W}: section headings are display type (${r.h2fs}px) and numbered`,r.h2fs>=28&&/^counter\(cch/.test(r.h2num),JSON.stringify({fs:r.h2fs,num:r.h2num}));
  const dr=await p.evaluate(async()=>{const v=document.querySelector('#rd .view'),f=document.querySelector('.cols .body figure.cfr');const m=a=>{const t=getComputedStyle(a).transform;return t==='none'?0:parseFloat(t.split(',')[5])};
   f.scrollIntoView({block:'center'});await new Promise(r=>setTimeout(r,300));v.dispatchEvent(new Event('scroll'));await new Promise(r=>setTimeout(r,200));const im=f.querySelector('img');const a0={fy:f.getBoundingClientRect().top,iy:im.getBoundingClientRect().top,ty:m(im),cy:f.style.getPropertyValue('--cy')};
   v.scrollTop+=260;v.dispatchEvent(new Event('scroll'));await new Promise(r=>setTimeout(r,300));const a1={fy:f.getBoundingClientRect().top,iy:im.getBoundingClientRect().top,ty:m(im),cy:f.style.getPropertyValue('--cy')};return {a0,a1,page:a1.fy-a0.fy,img:a1.iy-a0.iy}});
  ck(`${W}: pictures drift against the text (page moved ${Math.round(dr.page)}px, picture ${Math.round(dr.img)}px)`,Math.abs(dr.img-dr.page)>3&&Math.abs(dr.img-dr.page)<60,JSON.stringify(dr));
  /* one picture */
  await open('one');r=await probe();
  ck(`${W}: a story with one picture leads with it (lead full width) and has no frames`,/cine-1/.test(r.cls)&&r.heroW>=r.cw&&r.nfig===0,JSON.stringify(r));
  /* none */
  await open('none');r=await probe();
  ck(`${W}: a story with no picture is carried by type (drop cap, pulled quote, display headings)`,/cine-t/.test(r.cls)&&r.drop&&r.pull>=1&&r.h2fs>=28,JSON.stringify(r));
  const gap=await p.evaluate(()=>{const b=document.querySelector('.cols .body');let worst=0;const kids=[...b.children].filter(e=>e.getBoundingClientRect().height>0);for(let i=1;i<kids.length;i++){const g=kids[i].getBoundingClientRect().top-kids[i-1].getBoundingClientRect().bottom;if(g>worst)worst=g}const hero=document.querySelector('.cols>img.hero');const first=document.querySelector('.cols .tt');return {worst:Math.round(worst),hero:!!hero}});
  ck(`${W}: no broken gap in a story with no picture (largest gap ${gap.worst}px, no empty lead)`,gap.worst<150&&!gap.hero,JSON.stringify(gap));
  /* short */
  await open('short');r=await probe();ck(`${W}: a short story is left alone`,!/\bcine/.test(r.cls),r.cls);
  /* a long story after a short one, and back: nothing stale */
  await open('rich');await open('short');r=await probe();ck(`${W}: the treatment does not stay behind on the next, short story`,!/\bcine/.test(r.cls),r.cls);
  /* broken picture */
  await open('broken');await p.evaluate(async()=>{const v=document.querySelector('#rd .view');for(const f of document.querySelectorAll('.cols .body figure')){f.scrollIntoView({block:'center'});v.dispatchEvent(new Event('scroll'));await new Promise(r=>setTimeout(r,350))}});r=await probe();
  ck(`${W}: a picture that fails to load shows the retry card in its frame, not a hole`,r.fb.length>=1&&r.fb.every(h=>h>=100),JSON.stringify(r));
  /* switched off in Settings */
  await p.evaluate(()=>{S.cine=false;save()});await open('rich');r=await probe();ck(`${W}: the Settings switch turns it off`,!/\bcine/.test(r.cls)&&r.nfig===0,r.cls);
  await p.evaluate(()=>{S.cine=true;save()});
  /* reduced motion: still full width, no drift */
  await p.emulateMedia({reducedMotion:'reduce'});await open('rich');
  const rm=await p.evaluate(async()=>{const v=document.querySelector('#rd .view'),f=document.querySelector('.cols .body figure.cfr');f.scrollIntoView({block:'center'});v.scrollTop+=200;v.dispatchEvent(new Event('scroll'));await new Promise(r=>setTimeout(r,300));return {t:getComputedStyle(f.querySelector('img')).transform,cls:document.getElementById('rd').className}});
  ck(`${W}: reduced motion keeps the layout but does not move the pictures`,rm.t==='none'||/matrix\(1, 0, 0, 1, 0, 0\)/.test(rm.t),JSON.stringify(rm));
  await p.emulateMedia({reducedMotion:'no-preference'});
  ck(`${W}: no page errors`,!errs.length,errs[0]);await ctx.close()}
 /* page mode: no scroll effects */
 {const ctx=await b.newContext({viewport:{width:390,height:800},hasTouch:true,isMobile:true});const p=await ctx.newPage();await mock(p,{n:3});await p.route(/pics\.test|hero\.test/,r=>r.fulfill({status:200,contentType:'image/jpeg',body:land}));
  await p.addInitScript(([sd])=>{try{localStorage.setItem('folio',JSON.stringify(Object.assign({},sd,{scroll:'pages'})))}catch(e){}},[seed(['Alpha'])]);
  await p.goto('file://'+APP);await p.waitForTimeout(1500);await p.click('text=Get started').catch(()=>{});
  const c=await p.evaluate(async html=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const f=S.feeds[0];const a={feedId:f.id,title:'Paged',link:'https://w.test/paged',date:Date.now(),summary:'x',img:'https://hero.test/hero.jpg',html};items[f.id]=[a,...(items[f.id]||[])];S.sel='all';render();await openReader(a);await new Promise(r=>setTimeout(r,2400));return document.getElementById('rd').className},LONG([FIG('a.jpg','Cap'),FIG('b.jpg','Cap'),'',''],4));
  ck('page-turning mode has no cinematic effects',!/\bcine/.test(c),c);await ctx.close()}
 await b.close();console.log(bad?'FAILED '+bad+' of '+n:'cinematic all '+n+' passed');process.exit(bad?1:0)})();
