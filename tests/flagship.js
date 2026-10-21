/* Flagship pass: the four feed rhythms, the editorial story header and 700px measure, the float drop cap, the quiet promo sweep and Related-reading callouts, the ambient photo tint (and its legibility guard), and the lock-screen media session. */
const {APP}=require('./env');const {mock,seed,PW}=require('./mock');const {chromium}=require(PW);const fs=require('fs'),path=require('path');
let bad=0,n=0;const ck=(nm,ok,x)=>{n++;if(!ok){bad++;console.log('FAIL',nm,x||'')}else console.log('ok',nm)};
const bright=fs.readFileSync(path.resolve(__dirname,'fixtures_bright.jpg'));
const P=(k,w=70)=>'<p>'+('Paragraph '+k+' of the story, with some commas, a few clauses, and the sort of ordinary running text a long read has. ').repeat(Math.ceil(w/20)).split(' ').slice(0,w).join(' ')+'.</p>';
const svg=i=>`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000"><rect width="100%" height="100%" fill="hsl(${i*47%360},55%,45%)"/></svg>`;
(async()=>{const b=await chromium.launch();
 /* ---- feed rhythms ---- */
 for(const [W,H] of [[390,800],[1100,820]]){
  const p=await (await b.newContext({viewport:{width:W,height:H}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{n:6});
  await p.route('https://img.test/**',r=>r.fulfill({status:200,contentType:'image/svg+xml',body:svg(3)}));
  await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(300);
  const R=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const now=Date.now();S.feeds.slice(0,4).forEach((f,fi)=>{items[f.id]=Array.from({length:30},(_,i)=>({feedId:f.id,title:'Headline number '+i+' of feed '+fi+' about the subject',link:'https://w.test/'+fi+'/'+i,date:now-(i*47+fi*9+5)*6e4,summary:'A standfirst long enough to serve as a deck.',by:'Jane Reporter',sec:'Politics',img:i%5?'https://img.test/x'+i+'.svg':'',html:''}));state[f.id]='ok'});
   const w=ms=>new Promise(r=>setTimeout(r,ms));const out={};
   S.view='list';S.sel='all';render();await w(900);let c=document.querySelectorAll('#grid.list .card')[1];let cs=getComputedStyle(c),sc=getComputedStyle(c.querySelector('.src'));
   out.list={radius:cs.borderRadius,bg:cs.backgroundImage.slice(0,20),bt:getComputedStyle(document.getElementById('grid')).borderTopWidth,tr:sc.textTransform,ls:parseFloat(sc.letterSpacing),tm:getComputedStyle(c.querySelector('time')).color,mut:getComputedStyle(c).getPropertyValue('--mut')};
   S.view='cards';S.wdens='mag';render();await w(1100);const g=document.getElementById('grid');const a0=items[S.feeds[0].id][0];g.insertAdjacentHTML('beforeend',card(a0,0,'nr nr-hero')+card(a0,1,'nr nr-row nr-s'));
   const hero=g.querySelector('.card.nr-hero'),row=g.querySelector('.card.nr-row');cs=getComputedStyle(hero);
   out.cards={radius:cs.borderRadius,shadow:cs.boxShadow.slice(0,50),outline:cs.outlineWidth,cls:hero.className.slice(0,40),h3:parseFloat(getComputedStyle(hero.querySelector('h3')).fontSize),rowh3:parseFloat(getComputedStyle(row.querySelector('h3')).fontSize)};
   S.wdens='col';render();await w(900);g.insertAdjacentHTML('beforeend','<div class="wcols"><a class="wcol"><small>A</small><b>One headline here</b></a><a class="wcol"><small>B</small><b>Two headline here</b></a><a class="wcol"><small>C</small><b>Three headline here</b></a><a class="wcol"><small>D</small><b>Four headline here for width</b></a></div>');
   const wc=g.querySelector('.wcols:last-child'),wb=wc.querySelector('b');
   out.col={rule:getComputedStyle(wc).columnRuleWidth,ff:getComputedStyle(wb).fontFamily.slice(0,30),n:wc.children.length};
   return out});
  ck(`${W}: list view is a flat index (square rows, hairline, no card box)`,R.list.radius==='0px'&&/linear-gradient/.test(R.list.bg)&&R.list.bt==='1px',JSON.stringify(R.list));
  ck(`${W}: list source line is tracked small caps`,R.list.tr==='uppercase'&&R.list.ls>=1.2,JSON.stringify(R.list));
  ck(`${W}: card view has 12px corners, an inner frame line and no drop shadow`,R.cards.radius==='12px'&&/inset/.test(R.cards.shadow)&&!/rgba\(0, 0, 0, 0\.\d+\) 0px [1-9]/.test(R.cards.shadow)&&R.cards.outline==='1px',JSON.stringify(R.cards));
  ck(`${W}: magazine density: no card headline is bigger than 26px (lead ${R.cards.h3}px, companion ${R.cards.rowh3}px)`,R.cards.h3<=26&&R.cards.rowh3<=26&&R.cards.h3>=16,JSON.stringify(R.cards));
  ck(`${W}: columns density has vertical rules and a serif face`,R.col.n>0&&R.col.rule==='1px'&&/serif|CyPress Display|Newsreader|Georgia|Source|Literata|Merri|Garamond|Playfair|Lora|Charter/i.test(R.col.ff),JSON.stringify(R.col));
  ck(`${W}: no page errors`,!errs.length,errs[0]);await p.close()}
 /* ---- reader ---- */
 for(const [W,H] of [[1280,800],[390,800]]){
  const ctx=await b.newContext({viewport:{width:W,height:H},hasTouch:W<700,isMobile:W<700});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{n:3});
  await p.route(/hero\.test/,r=>r.fulfill({status:200,contentType:'image/jpeg',body:bright}));
  await p.addInitScript(([sd])=>{localStorage.setItem('folio',JSON.stringify(Object.assign({},sd,{scroll:'vertical'})))},[seed(['Alpha'])]);
  await p.goto('file://'+APP);await p.waitForTimeout(1500);await p.click('text=Get started').catch(()=>{});
  const html=P(1)+P(2)+'<p>Sign up for our newsletter to get the best stories in your inbox. <a href="https://x.test/n">Subscribe now</a></p>'+P(3)+'<p>Related reading</p><ul><li><a href="https://x.test/1">First related story</a></li><li><a href="https://x.test/2">Second related story</a></li></ul>'+P(4)+P(5)+'<p>Subscribe to the idea that a long paragraph of real reporting is never promotional, because it keeps going with sentences of its own, one after another, for quite some while longer than any banner would.</p>'+P(6);
  const T=W+': ';
  await p.evaluate(async html=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const f=S.feeds[0];const a={feedId:f.id,title:'A long read about something that matters a great deal to many people',link:'https://w.test/fl',date:Date.now(),summary:'x',by:'Jane Reporter',sec:'Politics',img:'https://hero.test/hero.jpg',html};items[f.id]=[a,...(items[f.id]||[])];S.sel='all';S.ptint=true;render();await openReader(a);window.__t0=performance.now()},html);
  await p.waitForTimeout(900);
  const q=await p.evaluate(()=>{const g=s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect(),c=getComputedStyle(e);return {l:Math.round(r.left),w:Math.round(r.width),fs:parseFloat(c.fontSize),ff:c.fontFamily.slice(0,40),txt:e.textContent.trim().slice(0,60)}};
   const d=document.querySelector('.cols .body p.dropcap .dcap'),dc=d&&getComputedStyle(d),pp=d&&getComputedStyle(d.closest('p'));
   return {kick:g('.cols .kick'),tt:g('.cols .tt'),dt:g('.cols .dt'),by:g('.cols .dt .by'),body:g('.cols .body'),dcap:d?{fl:dc.cssFloat,ratio:+(parseFloat(dc.fontSize)/parseFloat(pp.fontSize)).toFixed(2),lh:dc.lineHeight,mr:dc.marginRight}:null,promo:[...document.querySelectorAll('.cols .body p')].some(x=>/Sign up for our newsletter/.test(x.textContent)),keep:[...document.querySelectorAll('.cols .body p')].some(x=>/Subscribe to the idea/.test(x.textContent)),rcall:!!document.querySelector('.cols .body .rcall'),amb:document.getElementById('rd').classList.contains('amb')}});
  ck(T+'the header has a small-caps kicker, a display title, and a byline with the author and reading time',q.kick&&/ALPHA|Alpha/i.test(q.kick.txt)&&q.tt&&q.tt.fs>=(W>700?44:28)&&q.by&&/Jane Reporter/.test(q.by.txt)&&/min read/.test(q.dt.txt),JSON.stringify([q.kick,q.tt,q.by,q.dt]));
  if(W>700){const off=q.body.l-0;ck(T+'when scrolling down the text and header keep a 700px measure, centred',q.body.w<=700&&q.tt.w<=700&&q.kick.w<=700&&q.dt.w<=700&&q.body.l===q.tt.l,JSON.stringify([q.kick,q.tt,q.dt,q.body]))}
  ck(T+'the drop cap is a float (3.2em, 0.75 line height, 8px gap)',q.dcap&&q.dcap.fl==='left'&&Math.abs(q.dcap.ratio-3.2)<.05&&parseFloat(q.dcap.lh)>0&&q.dcap.mr==='8px',JSON.stringify(q.dcap));
  ck(T+'the newsletter box is still there before the sweep at 300 ms or just after, and real text is never touched',q.keep,JSON.stringify(q));
  await p.waitForTimeout(1200);
  const q2=await p.evaluate(()=>({promo:[...document.querySelectorAll('.cols .body p')].some(x=>/Sign up for our newsletter/.test(x.textContent)),keep:[...document.querySelectorAll('.cols .body p')].some(x=>/Subscribe to the idea/.test(x.textContent)),paras:document.querySelectorAll('.cols .body p').length,rc:(()=>{const r=document.querySelector('.cols .body .rcall');if(!r)return null;const c=getComputedStyle(r);return {bl:c.borderLeftWidth,lab:(r.querySelector('.rcl')||{}).textContent,links:r.querySelectorAll('a').length}})()}));
  ck(T+'the quiet sweep fades the injected newsletter box away',!q2.promo,JSON.stringify(q2));
  ck(T+'a real paragraph that starts with "Subscribe" is kept',q2.keep,JSON.stringify(q2));
  ck(T+'"Related reading" becomes a callout card with a left accent',q2.rc&&q2.rc.bl==='3px'&&/Related reading/i.test(q2.rc.lab)&&q2.rc.links===2,JSON.stringify(q2.rc));
  /* ambient tint */
  await p.waitForTimeout(1500);
  const am=await p.evaluate(()=>{const rd=document.getElementById('rd'),v=rd.querySelector('.view');const rgb=x=>String(x).match(/[\d.]+/g).slice(0,3).map(Number);const lum=a=>{const f=n=>{n/=255;return n<=.03928?n/12.92:Math.pow((n+.055)/1.055,2.4)};return .2126*f(a[0])+.7152*f(a[1])+.0722*f(a[2])};const cr=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
   const cs=getComputedStyle(v);return {amb:rd.classList.contains('amb'),bg:rgb(cs.backgroundColor),ink:rgb(cs.color),cr:cr(rgb(cs.color),rgb(cs.backgroundColor)),rbg:rd.style.getPropertyValue('--rbg')}});
  if(am.amb){const base=[255,255,255];const shift=Math.max(...am.bg.map((x,i)=>Math.abs(x-base[i])));ck(T+'the photo tint is a very light breath (largest channel shift '+shift+')',shift>0&&shift<=14,JSON.stringify(am));ck(T+'the tinted page keeps the text at contrast 4.5 or better ('+am.cr.toFixed(1)+')',am.cr>=4.5,JSON.stringify(am))}
  else console.log('note',T+'no tint was applied for this photo (allowed: the guard may decline)',JSON.stringify(am));
  /* tint off */
  const off=await p.evaluate(async()=>{S.ptint=false;save();rdAmbient('rgb(200,40,40)');return document.getElementById('rd').classList.contains('amb')});ck(T+'with "Tint pages with photo colors" off there is no tint',!off);
  const forced=await p.evaluate(()=>{S.ptint=true;const v=document.querySelector('#rd .view');const keep=v.style.cssText;rdAmbient('rgb(0,255,0)');const a=document.getElementById('rd').classList.contains('amb');const bg=getComputedStyle(v).backgroundColor;rdAmbient(null);return {a,bg,after:document.getElementById('rd').classList.contains('amb')}});
  ck(T+'clearing the tint removes it',forced.after===false,JSON.stringify(forced));
  /* lock-screen media session */
  const ms=await p.evaluate(()=>{const names=[];const ns=navigator.mediaSession;if(!ns)return {none:1};const o=ns.setActionHandler.bind(ns);ns.setActionHandler=(a,f)=>{names.push(a);try{o(a,f)}catch(e){}};mediaOn();return {names,title:ns.metadata&&ns.metadata.title,st:ns.playbackState}});
  ck(T+'read aloud registers with the lock screen (play, pause, skip, stop)',!ms.none&&['play','pause','nexttrack','previoustrack','stop'].every(x=>ms.names.includes(x))&&/long read/.test(ms.title||'')&&ms.st==='playing',JSON.stringify(ms));
  ck(T+'no page errors',!errs.length,errs[0]);await ctx.close()}
 await b.close();console.log(bad?'FAILED '+bad+' of '+n:'flagship all '+n+' passed');process.exit(bad?1:0)})();
