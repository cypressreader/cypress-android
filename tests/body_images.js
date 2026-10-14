/* B100/B101: pictures inside a story survive the cleaner (lazy-load addresses, the backup reader's picture-only blocks), ad pictures do not, small gallery copies are dropped, a loose photo credit becomes the picture's caption, and a converter's "[Image: url]" is never shown as text. Shapes are taken from real MakeUseOf pages. */
const {APP}=require('./env');const {mock,seed,PW}=require('./mock');const {chromium}=require(PW);const fs=require('fs'),path=require('path');
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
const jpg=fs.readFileSync(path.resolve(__dirname,'fixtures_hero.jpg'));
const P=n=>'<p>'+('This is paragraph '+n+' of the story, long enough to count as real text for the extractor and the reader to keep. ').repeat(3)+'</p>';
const U0='https://static0.makeuseofimages.com/x/';const U='https://static0.makeuseofimages.com/wordpress/wp-content/uploads/wm/2026/10/';
const page='<html><body><nav>menu</nav><article><h1>Archive apps</h1>'+P(1)+
 /* a lazy picture: blank placeholder in src, real address in data-img-url */
 '<figure><picture><source media="(max-width: 480px)" srcset="'+U+'one.jpg?w=500"><img width="1650" height="1100" alt="one" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" data-img-url="'+U+'one.jpg?q=49&fit=crop&w=825"></picture><small class="body-img-caption">Credit:&nbsp;Brady Snyder / MakeUseOf</small></figure>'+P(2)+
 /* a picture whose only address is in its picture sources */
 '<div><picture><source srcset="'+U+'two.jpg?w=800 800w, '+U+'two.jpg?w=1200 1200w"><img alt="two" width="1200" height="800"></picture></div>'+P(3)+
 /* an ad slot and an ad network picture */
 '<div class="ad-slot top-ad"><img width="728" height="300" src="'+U+'ad-banner.jpg" alt=""></div>'+
 '<img width="600" height="400" src="https://tpc.googlesyndication.com/simgad/123456" alt="">'+
 '<div id="div-gpt-ad-1"><img width="300" height="250" src="https://cdn.example.com/house.jpg"></div>'+P(4)+
 /* a gallery: full size slides then small copies of the same pictures */
 '<div><img width="842" height="1500" alt="three" src="'+U+'three.jpg?w=421"><img width="842" height="1500" alt="four" src="'+U+'four.jpg?w=421"></div><div><img width="334" height="186" alt="three" src="'+U+'three.jpg?w=167"><img width="334" height="186" alt="four" src="'+U+'four.jpg?w=167"></div>'+P(5)+
 /* a credit set loose under the picture */
 '<div><img width="1200" height="800" alt="five" src="'+U+'five.jpg"></div><p>Credit: Pankil Shah / MakeUseOf</p>'+P(6)+'</article><footer>foot</footer></body></html>';
const md='Title: x\n\nURL Source: https://x.test/a\n\nMarkdown Content:\n'+['First','Second','Third','Fourth'].map((t,i)=>t+' paragraph of the story. '.repeat(1)+'It goes on for a good while so the converter sees real text here and keeps it. '.repeat(2)).join('\n\n')+
 '\n\n![Image 2: Uninstall app in the Files app](https://static0.makeuseofimages.com/wordpress/wp-content/uploads/wm/2026/03/uninstall-app-files.jpg?q=49&fit=crop&w=825)\n\nA fifth paragraph that carries on the story after the screenshot, long enough to be text of its own and not a caption here.\n\n![Image 3: ad](https://securepubads.g.doubleclick.net/pagead/ads?x=1)\n\n[Image: https://static0.makeuseofimages.com/wordpress/wp-content/uploads/wm/2026/03/bare-url-picture.jpg]\n\nA sixth paragraph that carries on the story after the other picture, again long enough to count as text of its own.\n\n![Image 4: Brady](https://static0.makeuseofimages.com/wordpress%2Fwp-content%2Fauthors%2Fbrady.jpeg?fit=crop&w=90&h=90)\n\nA seventh paragraph that closes out the story, written long enough to be kept as ordinary text by the converter.\n';
(async()=>{const b=await chromium.launch();
 const ctx0=await b.newContext({viewport:{width:390,height:800}});const p0=await ctx0.newPage();await mock(p0,{n:2});await p0.goto('file://'+APP);await p0.waitForTimeout(1200);
 const r=await p0.evaluate(([page,md])=>{
  const w=document.createElement('div');const fr=extract(page,'https://www.makeuseof.com/x/');w.append(fr);
  const srcs=[...w.querySelectorAll('img')].map(i=>i.getAttribute('src'));
  const m=document.createElement('div');m.append(md_(md));
  function md_(t){return window.md(t,'https://x.test/a/')}
  return {srcs,figs:w.querySelectorAll('figure').length,credit:w.textContent.includes('Pankil'),creditInFig:[...w.querySelectorAll('figure')].some(f=>/Pankil/.test(f.textContent)),
   mdImgs:[...m.querySelectorAll('img')].map(i=>i.getAttribute('src')),mdText:m.textContent,fcTxt:[...w.querySelectorAll('figcaption')].map(c=>c.textContent)}},[page,md]);
 const has=k=>r.srcs.filter(s=>s.includes(k)).length;
 ck('lazy picture (blank src, real address in data-img-url) is kept',has('one.jpg')===1,JSON.stringify(r.srcs));
 ck('picture with its address only in <source> is kept',has('two.jpg')===1,JSON.stringify(r.srcs));
 ck('ad slot picture is dropped',has('ad-banner')===0&&has('house.jpg')===0,JSON.stringify(r.srcs));
 ck('ad network picture is dropped',!r.srcs.some(s=>/googlesyndication/.test(s)),JSON.stringify(r.srcs));
 ck('gallery: each picture once, no small copies',has('three.jpg')===1&&has('four.jpg')===1,JSON.stringify(r.srcs));
 ck('the picture kept from a gallery is the large one',r.srcs.filter(s=>/three|four/.test(s)).every(s=>/w=(421|1200)\b/.test(s)),JSON.stringify(r.srcs));
 ck('a loose credit under a picture becomes part of the same figure (or is dropped), never a loose line',!r.credit||r.creditInFig,JSON.stringify(r));
 ck('the picture with the loose credit is kept',has('five.jpg')===1,JSON.stringify(r.srcs));
 ck('backup reader keeps a picture-only block ("![Image 2: …](url)")',r.mdImgs.some(s=>/uninstall-app-files/.test(s)),JSON.stringify(r.mdImgs));
 ck('backup reader turns a bare "[Image: url]" into the picture',r.mdImgs.some(s=>/bare-url-picture/.test(s)),JSON.stringify(r.mdImgs));
 ck('"[Image: url]" is never shown as text',!/\[\s*Image/i.test(r.mdText),r.mdText.slice(0,200));
 ck('backup reader drops an ad network picture',!r.mdImgs.some(s=>/doubleclick/.test(s)),JSON.stringify(r.mdImgs));
 ck('backup reader still drops an author photo',!r.mdImgs.some(s=>/authors/.test(s)),JSON.stringify(r.mdImgs));
 await ctx0.close();
 /* layout: figure + caption stay together and never overlap the text, phone and tablet, both reading modes */
 for(const [name,vw,vh,mode] of [['phone scroll',390,800,'vertical'],['tablet pages',820,1180,'pages'],['phone pages',390,800,'pages']]){
  const ctx=await b.newContext({viewport:{width:vw,height:vh},hasTouch:vw<900,isMobile:vw<700});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{n:3});
  await p.route(/makeuseofimages/,r=>r.fulfill({status:200,contentType:'image/jpeg',body:jpg}));
  await p.addInitScript(([sd,mode])=>{try{localStorage.setItem('folio',JSON.stringify(Object.assign({},sd,{scroll:mode})))}catch(e){}},[seed(['Alpha']),mode]);
  await p.goto('file://'+APP);await p.waitForTimeout(1800);await p.click('text=Get started').catch(()=>{});
  const L=await p.evaluate(async ([page,U0])=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=document.createElement('div');w.append(extract(page,'https://www.makeuseof.com/x/'));const f=S.feeds[0];const a={feedId:f.id,title:'Archive apps',link:'https://www.makeuseof.com/x/',date:Date.now(),summary:'x',img:U0+'hero.jpg',html:w.innerHTML};items[f.id]=[a,...(items[f.id]||[])];S.sel='all';render();await openReader(a);await new Promise(r=>setTimeout(r,2500));
   const body=document.querySelector('.cols .body,.body'),cw=(document.querySelector('.cols')||body).getBoundingClientRect().width;
   const figs=[...document.querySelectorAll('.body figure')].filter(f=>f.querySelector('img'));let overlap=0,detached=0,wide=0,tiny=0;
   figs.forEach(f=>{const im=f.querySelector('img').getBoundingClientRect(),fr=f.getBoundingClientRect();if(fr.width>cw+40)wide++;if(im.width>0&&im.width<120)tiny++;const c=f.querySelector('figcaption');if(c){const cr=c.getBoundingClientRect();if(cr.width&&im.width&&cr.top<im.top-1)detached++;
     const over=cr.width&&im.width&&cr.top<im.bottom-2&&!/ov/.test(f.className)&&getComputedStyle(c).position!=='absolute';if(over)overlap++}});
   const cr=[...document.querySelectorAll('.body p')].filter(p=>/^Credit:/.test(p.textContent.trim())).length;
   return {n:figs.length,overlap,detached,wide,tiny,cw:Math.round(cw),looseCredits:cr,imgs:document.querySelectorAll('.body img').length}},[page,U0]).catch(e=>({err:String(e)}));
  if(L.err){ck(name+': reader opened',false,L.err);await ctx.close();continue}
  ck(name+': body pictures are shown ('+L.imgs+')',L.imgs>=5,JSON.stringify(L));
  ck(name+': no caption overlaps its picture',L.overlap===0,JSON.stringify(L));
  ck(name+': no caption above its picture',L.detached===0,JSON.stringify(L));
  ck(name+': no figure wider than the column',L.wide===0,JSON.stringify(L));
  ck(name+': no thumbnail-sized pictures in the story',L.tiny===0,JSON.stringify(L));
  ck(name+': no loose "Credit:" line left in the text',L.looseCredits===0,JSON.stringify(L));
  ck(name+': no page errors',!errs.length,errs[0]);await ctx.close()}
 await b.close();console.log(bad?'FAILED '+bad:'body_images all passed');process.exit(bad?1:0)})();
