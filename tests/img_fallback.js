/* Article pictures: ones that cannot load (404, blocked, blank placeholder) show the feed's designed fallback with a retry, never a grey box; ones that load are untouched; in page mode pictures are fetched eagerly. */
const zlib=require('zlib');
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
const crc=(()=>{const t=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0}return b=>{let c=0xffffffff;for(const x of b)c=t[(c^x)&255]^(c>>>8);return (c^0xffffffff)>>>0}})();
const chunk=(ty,d)=>{const l=Buffer.alloc(4);l.writeUInt32BE(d.length);const td=Buffer.concat([Buffer.from(ty),d]);const c=Buffer.alloc(4);c.writeUInt32BE(crc(td));return Buffer.concat([l,td,c])};
const png=(w,h,v)=>{const raw=Buffer.alloc((w*3+1)*h,v);for(let y=0;y<h;y++)raw[y*(w*3+1)]=0;const ih=Buffer.alloc(13);ih.writeUInt32BE(w,0);ih.writeUInt32BE(h,4);ih[8]=8;ih[9]=2;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ih),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))])};
(async()=>{
 const b=await chromium.launch();
 for(const [W,H,sc] of [[1100,820,'paged'],[412,860,'vertical']]){
  const p=await (await b.newContext({viewport:{width:W,height:H}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  let retryOk=false;
  await mock(p,{n:10});
  await p.route('https://img.test/**',r=>{const u=r.request().url();
   if(/good/.test(u))return r.fulfill({status:200,contentType:'image/png',body:png(600,400,150)});
   if(/blank/.test(u))return r.fulfill({status:200,contentType:'image/png',body:png(1,1,200)});
   if(/flaky/.test(u)){if(retryOk)return r.fulfill({status:200,contentType:'image/png',body:png(600,400,90)});return r.fulfill({status:403,body:'no'})}
   return r.fulfill({status:404,body:'gone'})});
  await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(300);
  const r=await p.evaluate(async([sc])=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const f=S.feeds[0];
   const para=n=>`<p>${'Words for the story here, ordinary reporting text. '.repeat(n)}</p>`;
   const im=(n,w,h)=>`<figure><img src="https://img.test/${n}.png" loading="lazy" width="${w}" height="${h}" alt="${n} photo"><figcaption>${n} caption</figcaption></figure>`;
   const a={feedId:f.id,title:'Image test',link:'https://w.test/imgs',date:Date.now(),summary:'x',img:'',html:para(30)+im('good1',600,400)+para(30)+im('missing',800,450)+para(30)+im('good2',600,400)+para(20)+im('blank',800,450)+para(30)+im('flaky',800,450)+para(20)};
   items[f.id]=[a];S.sel='all';S.scroll=sc;render();await w(300);openReader(a);await w(3500);
   const body=document.querySelector('.cols .body'),o={};
   o.imgs=[...body.querySelectorAll('img')].map(i=>({s:i.getAttribute('src').split('/').pop(),ok:i.complete&&i.naturalWidth>8,lazy:i.loading}));
   o.fbs=[...body.querySelectorAll('.imgfb')].map(b=>({src:b._src.split('/').pop(),role:b.getAttribute('aria-label'),pat:/^pf\d+/.test(b.className.split(' ')[1]||''),bg:getComputedStyle(b).backgroundImage.slice(0,40),h:b.getBoundingClientRect().height,w:b.getBoundingClientRect().width}));
   o.broken=[...body.querySelectorAll('img')].filter(i=>i.complete&&!i.naturalWidth).length;
   return o},[sc]);
  retryOk=true;
  const r2=await p.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));const b=document.querySelector('.cols .body');const fb=[...b.querySelectorAll('.imgfb')].find(x=>/flaky/.test(x._src));if(!fb)return {noFb:true};fb.click();await w(1500);const im=[...b.querySelectorAll('img')].find(i=>/flaky/.test(i.src));return {back:!!im&&im.complete&&im.naturalWidth>8,fbLeft:b.querySelectorAll('.imgfb').length}});
  const t='['+W+' '+sc+'] ';
  ck(t+'good pictures load and stay',r.imgs.filter(i=>/good/.test(i.s)).length===2&&r.imgs.filter(i=>/good/.test(i.s)).every(i=>i.ok),JSON.stringify(r.imgs));
  ck(t+'failed, blocked and blank pictures are replaced by the designed fallback',r.fbs.length===3&&r.fbs.every(f=>f.pat&&/url\(/.test(f.bg)),JSON.stringify(r.fbs));
  ck(t+'no broken or grey picture is left in the text',r.broken===0&&!r.imgs.some(i=>/missing|blank/.test(i.s)),JSON.stringify([r.broken,r.imgs]));
  ck(t+'the fallback has a real size and a name for screen readers',r.fbs.every(f=>f.h>60&&f.w>100&&/could not be loaded/.test(f.role||'')),JSON.stringify(r.fbs));
  if(sc==='paged')ck(t+'pictures are fetched eagerly in page mode',r.imgs.every(i=>i.lazy!=='lazy'),JSON.stringify(r.imgs));
  ck(t+'tapping the fallback tries again and a picture that now loads comes back',r2.back===true&&r2.fbLeft===2,JSON.stringify(r2));
  ck(t+'no page errors',!errs.length,errs[0]);await p.close();
 }
 await b.close();console.log(bad?'img_fallback '+bad+' FAILED':'img_fallback all passed');process.exit(bad?1:0);
})();
