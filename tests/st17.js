const {APP}=require('./env');
const {mock,seed,PW}=require('./mock');const {chromium}=require(PW);
let pass=0,fail=0;const log=[];const ck=(n,c,x='')=>{if(c)pass++;else{fail++;log.push(`FAIL ${n} ${x}`)}};
(async()=>{const b=await chromium.launch();
{const p=await (await b.newContext({viewport:{width:1000,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await mock(p,{n:6});await p.goto('file://'+APP);await p.waitForTimeout(1500);
const R=await p.evaluate(async()=>{
 const o={};
 const V='market people government report officials said country economic growth policy during after before several members public leader office national agency reporters statement spokesperson meeting talks deal plan budget security energy prices workers court judge law vote city state nation week month year company bank trade senate'.split(' ');
 const words=n=>Array.from({length:n},(_,i)=>V[(i*7+3)%V.length]).join(' ');
 const para=n=>'<p>'+words(n)+'</p>';
 const frag=h=>{const d=document.createElement('div');d.innerHTML=h;const f=document.createDocumentFragment();while(d.firstChild)f.append(d.firstChild);return f};
 const NYT='https://www.nytimes.com/2026/10/05/world/story.html',OTHER='https://news.test/a';
 const gateMsg='Thank you for your patience while we verify access. If you are in Reader mode please exit and log into your Times account, or subscribe for all of The Times.';
 // 1. detection rules
 o.markerEnd=gatedPreview(words(300)+' '+gateMsg,false,NYT);
 o.markerOther=gatedPreview(words(300)+' Continue reading the main story. Already a subscriber? Log in.',false,OTHER);
 o.gateClassEdge=gatedPreview(words(500),true,NYT);o.gateClassOther=gatedPreview(words(300),true,OTHER);o.gateClassLong=gatedPreview(words(1500),true,OTHER);
 o.edgeShort=gatedPreview(words(380),false,NYT);o.edgeSigned=gatedPreview(words(380)+'. Reporting by Jane Doe; Editing by Sam Roe',false,NYT);
 o.otherShort=gatedPreview(words(380),false,OTHER);o.longTail=gatedPreview(words(1200)+' continue reading',false,OTHER);o.edgeLong=gatedPreview(words(1200)+'.',false,NYT);
 // 2. gate element in the page markup
 const gp='<html><body><article><h1>Headline</h1>'+para(120)+para(120)+'<div class="css-1abc gateway-content"><p>Subscribe to continue</p></div></article></body></html>';
 o.pageGate=extract(gp,NYT)&&extract(gp,NYT).gate===true;
 o.styleOnly=!extract('<html><body><article><h1>Headline</h1>'+para(120)+para(120)+'<div class="paywall-wrapper"><p>Welcome to our site, here is the weather today in town.</p></div></article></body></html>',OTHER).gate;
 o.pageNoGate=!extract('<html><body><article><h1>Headline</h1>'+para(120)+para(120)+'</article></body></html>',OTHER).gate;
 // 3. through getFull
 const of=window.fetchText,ofe=window.fetch;
 const gatedPage='<html><body><article><h1>World story</h1>'+para(90)+para(90)+para(60)+'<p>'+gateMsg+'</p></article></body></html>';
 window.fetchText=async(u,ok,lg)=>{if(/wp-json/.test(u))throw new Error('no wp');if(lg)lg.won='direct';ok&&ok(gatedPage);return gatedPage};
 window.fetch=async(u,opt)=>{if(/r\.jina\.ai/.test(String(u)))return new Response('x',{status:500});return ofe(u,opt)};
 const g=await getFull(NYT);o.gfFlag=g&&g.gated_preview===true;o.needs=g&&needsMore(g,NYT);
 const fullPage='<html><body><article><h1>World story</h1>'+Array.from({length:8},()=>para(110)).join('')+'<p>Reporting by Jane Doe.</p></article></body></html>';
 window.fetchText=async(u,ok,lg)=>{if(/wp-json/.test(u))throw new Error('no wp');if(lg)lg.won='direct';ok&&ok(fullPage);return fullPage};
 const g2=await getFull('https://www.nytimes.com/2026/10/06/world/full.html');o.fullNotGated=!!g2&&!g2.gated_preview;
 window.fetchText=of;window.fetch=ofe;
 // 4. cascade
 const a={title:'World story about the budget and the senate',link:NYT,summary:'The senate budget'};
 const stub=frag(para(200));stub.gated_preview=true;
 const om=window.mirrorFor,oa=window.archiveFor;let order=[];
 window.archiveFor=async()=>{order.push('archive');return {n:Object.assign(frag(para(500)),{tier:'archive'}),u:'https://web.archive.org/web/1/x'}};
 window.mirrorFor=async()=>{order.push('mirror');return null};
 const d1=await deeperTiers(a,stub,NYT);o.cas1=order.join('>')+' '+(d1.n.tier||'');
 order=[];window.archiveFor=async()=>{order.push('archive');return null};window.mirrorFor=async()=>{order.push('mirror');return {n:Object.assign(frag(para(500)),{tier:'mirror'}),u:'https://apnews.com/x'}};
 const d2=await deeperTiers(a,stub,NYT);o.cas2=order.join('>')+' '+(d2.n.tier||'');
 order=[];window.mirrorFor=async()=>{order.push('mirror');return null};
 const d3=await deeperTiers(a,stub,NYT);o.cas3=order.join('>')+' '+(d3.n===stub);
 window.mirrorFor=om;window.archiveFor=oa;
 return o});
ck('a story ending on the NYT verification message is gated',R.markerEnd===true);
ck('a "continue reading / already a subscriber" ending is gated on any site',R.markerOther===true);
ck('a gate element on a gated publisher is gated; on another site only if the story is short',R.gateClassEdge===true&&R.gateClassOther===true&&R.gateClassLong===false,JSON.stringify([R.gateClassEdge,R.gateClassOther,R.gateClassLong]));
ck('a short story from a gated publisher with no ending is gated',R.edgeShort===true);
ck('a short story that ends with a sign-off is not',R.edgeSigned===false);
ck('a short story from an ordinary site is not',R.otherShort===false);
ck('a long story with "continue reading" near the end is not',R.longTail===false&&R.edgeLong===false);
ck('a gateway element in the page markup is noticed',R.pageGate===true);ck('a page without one is not flagged',R.pageNoGate===true);
ck('a gate-named element with no gate message does not count',R.styleOnly===true);
ck('getFull marks the verification-gate story gated_preview',R.gfFlag===true);
ck('a gated story always needs the deeper steps',R.needs===true);
ck('a complete NYT story is not marked',R.fullNotGated===true);
ck('archive is tried first for a gated story and wins',/^archive(>mirror)? archive$/.test(R.cas1),R.cas1);
ck('then the wire mirror',R.cas2==='archive>mirror mirror',R.cas2);
ck('neither: the preview is kept',R.cas3==='archive>mirror true',R.cas3);
ck('no page errors',errs.length===0,errs.join('|'));}
// reader: preview card, fade, link, no caching; and a saved copy replaces the preview
{const ctx=await b.newContext({viewport:{width:884,height:1060}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{n:6});
 await p.addInitScript(s=>{try{localStorage.setItem('folio',JSON.stringify(s))}catch(e){}},seed(['Alpha']));await p.goto('file://'+APP);await p.waitForTimeout(1500);
 const U=await p.evaluate(async()=>{
  const V='market people government report officials said country economic growth policy during after before several members public leader office national agency reporters statement spokesperson meeting talks deal plan budget security energy prices workers court judge law vote city state nation week month year company bank trade senate'.split(' ');
  const words=n=>Array.from({length:n},(_,i)=>V[(i*7+3)%V.length]).join(' ');
  const frag=h=>{const d=document.createElement('div');d.innerHTML=h;const f=document.createDocumentFragment();while(d.firstChild)f.append(d.firstChild);return f};
  const gateMsg='Thank you for your patience while we verify access. If you are in Reader mode please exit and log into your Times account, or subscribe for all of The Times.';
  S.sel='all';render();const a=cur[0];const link=a.link;
  const og=window.getFull,oa=window.archiveFor,om=window.mirrorFor;
  window.getFull=async()=>{const f=frag('<p>'+words(120)+'</p><p>'+words(120)+'</p><p>'+words(80)+'</p><p>'+gateMsg+'</p>');f.gated_preview=true;return f};
  window.archiveFor=async()=>null;window.mirrorFor=async()=>null;
  await openReader(a);await new Promise(r=>setTimeout(r,2500));
  const card=document.querySelector('.cols .gcard'),ps=[...document.querySelectorAll('.cols .body p')],last=ps[ps.length-1],lastFade=ps.filter(x=>x.classList.contains('gfade'));
  const o={card:!!card,cardTxt:card?card.textContent:'',href:card?card.querySelector('a').getAttribute('href'):'',tgt:card?card.querySelector('a').getAttribute('target'):'',fade:lastFade.length,mask:lastFade[0]?getComputedStyle(lastFade[0]).webkitMaskImage||getComputedStyle(lastFade[0]).maskImage:'',gateGone:!/verify access/.test(document.querySelector('.cols .body').textContent),note:(document.querySelector('.cols .note')||{}).textContent||'',cached:!!acGet(link),link};
  document.querySelector('#cl').click();await new Promise(r=>setTimeout(r,400));
  // a saved copy found: no preview card
  TRUNCDONE.delete(link);window.archiveFor=async()=>({n:Object.assign(frag('<p>'+words(300)+'</p><p>'+words(300)+'</p>'),{tier:'archive'}),u:'https://web.archive.org/web/1/x'});
  await openReader(a);await new Promise(r=>setTimeout(r,2500));
  o.noCardWhenArchived=!document.querySelector('.cols .gcard');o.archNote=(document.querySelector('.cols .note')||{}).textContent||'';
  window.getFull=og;window.archiveFor=oa;window.mirrorFor=om;return o});
 ck('the preview card appears',U.card===true&&/Subscriber Preview/.test(U.cardTxt)&&/Read the full story on the original site/.test(U.cardTxt),JSON.stringify(U));
 ck('its button opens the source outside the app',U.href===U.link&&U.tgt==='_blank',JSON.stringify([U.href,U.link,U.tgt]));
 ck('the last paragraph fades out',U.fade===1&&/linear-gradient/.test(U.mask),JSON.stringify([U.fade,U.mask]));
 ck('the gate message itself is removed from the text',U.gateGone===true);
 ck('a preview is not stored as the full story',U.cached===false);
 ck('the page says it is a subscriber preview',/Subscriber preview/.test(U.note),U.note);
 ck('a saved copy replaces the preview',U.noCardWhenArchived===true&&/Internet Archive/.test(U.archNote),U.archNote);
 ck('no page errors (reader)',errs.length===0,errs.join('|'));await ctx.close()}
console.log(pass+' passed, '+fail+' failed');log.forEach(l=>console.log(l));await b.close()})()
