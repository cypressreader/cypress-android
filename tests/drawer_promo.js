/* The reader's edge tab says what it is and its drawer has a header; event ads and sponsored posts are never shown as stories; Android gets no parallax/leaf layers that can ghost text; a video story shows a tap card, never an empty box. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 const b=await chromium.launch();
 for(const [W,H,ua] of [[900,820,''],[412,860,'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/124 Mobile Safari/537.36']]){
  const ctx=await b.newContext(Object.assign({viewport:{width:W,height:H}},ua?{userAgent:ua,hasTouch:true,isMobile:true}:{}));const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:6});await p.goto('file://'+APP);await p.waitForTimeout(1300);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(300);
  const t='['+W+(ua?' android':'')+'] ';
  const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const f=S.feeds[0],o={};
   const now=Date.now();const real=['Anthropic can’t reliably control its AI agents','Elon Musk intensifies attack on Ambani over Starlink India launch delay','Long live the mechanical keyboard','The maker of non-text AI model Jev valued at $7.5B','Will Warner Bros. kill Skydance — or will David Ellison kill Warner Bros?'];
   const ads=['3 days to TechCrunch Disrupt 2026: Meet the startups before they hit mainstream','Disrupt 2026: early bird tickets end Friday — save $400','Sponsored: how to run a faster data warehouse','THE NUMBER $100 — Disrupt passes ending soon','Last chance: save on tickets before prices rise'];
   o.adHidden=ads.map(t=>muted({title:t,link:'https://techcrunch.com/2026/10/10/x',feedId:f.id,summary:''}));o.realKept=real.map(t=>!muted({title:t,link:'https://techcrunch.com/2026/10/10/x',feedId:f.id,summary:''}));
   items[f.id]=[...real,...ads].map((t,i)=>({feedId:f.id,title:t,link:'https://techcrunch.com/2026/10/10/s'+i,date:now-i*6e4,summary:'A plain summary '+i,img:''}));state[f.id]='ok';S.sel='all';S.atab='latest';render();await w(700);
   const shown=[...document.querySelectorAll('#grid .card')].map(c=>c.textContent);o.adsInList=ads.filter(t=>shown.some(x=>x.includes(t.slice(0,25)))).length;o.realInList=real.filter(t=>shown.some(x=>x.includes(t.slice(0,25)))).length;
   /* a video story */
   const v={feedId:f.id,title:'A video',link:'https://www.youtube.com/watch?v=dQw4w9WgXcQ',date:now,summary:'x',img:'',html:'<p>About the video.</p>'};items[f.id]=[v];S.sel='all';render();await w(200);S.scroll='paged';openReader(v);await w(1500);
   o.vidTap=!!document.querySelector('.cols .yt-tap');o.vidEmptyBox=[...document.querySelectorAll('.cols .vid')].some(x=>!x.querySelector('iframe')||x.getBoundingClientRect().height<5);o.vidAuto=!!document.querySelector('.cols iframe[src*="youtube"]');
   document.querySelector('#cl')&&document.querySelector('#cl').click();await w(300);
   o.android=document.documentElement.classList.contains('android');
   const probe=document.createElement('div');probe.className='dcv-art';document.body.append(probe);o.parTransform=getComputedStyle(probe).transform;probe.remove();
   return o});
  ck(t+'event ads and sponsored posts are hidden everywhere ('+r.adHidden.filter(Boolean).length+' of 5 caught)',r.adHidden.every(Boolean),JSON.stringify(r.adHidden));
  ck(t+'real stories are untouched',r.realKept.every(Boolean)&&r.realInList>=4&&r.adsInList===0,JSON.stringify([r.realKept,r.realInList,r.adsInList]));
  ck(t+'a video story shows a tap-to-play card, not an empty box or an auto-loading player',r.vidTap&&!r.vidEmptyBox&&!r.vidAuto,JSON.stringify([r.vidTap,r.vidEmptyBox,r.vidAuto]));
  if(ua)ck(t+'Android: parallax layers are off (no transform on the cover art)',r.android&&(r.parTransform==='none'||/matrix\(1, 0, 0, 1, 0, 0\)/.test(r.parTransform)),r.parTransform);
  else{
   const r2=await p.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));const f=S.feeds[0];const para=n=>`<p>${'Words for the story here, ordinary reporting text. '.repeat(n)}</p>`;const a={feedId:f.id,title:'Edge tab',link:'https://w.test/e',date:Date.now(),summary:'x',img:'',html:para(20)};items[f.id]=[a];S.sel='all';render();await w(200);S.scroll='paged';openReader(a);await w(1500);
    const h=document.querySelector('#sideh'),o={tab:!!h,txt:h?h.textContent.trim():'',vis:h&&getComputedStyle(h).display!=='none'};h.click();await w(500);const hd=document.querySelector('#sidehdr');o.hdr=hd?hd.textContent.trim():'';o.hdrVis=!!hd&&hd.getBoundingClientRect().height>10;document.querySelector('#sidehx').click();await w(400);o.closed=!document.body.classList.contains('sideshow');return o});
   ck(t+'the edge tab carries a visible label ("Feeds")',r2.tab&&r2.vis&&/Feeds/.test(r2.txt),JSON.stringify(r2));
   ck(t+'its drawer opens with a header ("Your feeds") and a close button that works',/Your feeds/.test(r2.hdr)&&r2.hdrVis&&r2.closed,JSON.stringify(r2));
  }
  ck(t+'no page errors',!errs.length,errs[0]);await ctx.close();
 }
 await b.close();console.log(bad?'drawer_promo '+bad+' FAILED':'drawer_promo all passed');process.exit(bad?1:0);
})();
