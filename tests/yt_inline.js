/* A video inside a story plays right there on tap (YouTube's privacy-enhanced embed, loaded only on tap); if embedding is off the card falls back to "Opens in YouTube". */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 const b=await chromium.launch();
 for(const W of [412,1100]){
  const p=await (await b.newContext({viewport:{width:W,height:860}})).newPage();const errs=[],reqs=[];p.on('pageerror',e=>errs.push(e.message));p.on('request',r=>{if(/youtube/.test(r.url()))reqs.push(r.url())});
  await mock(p,{n:6});await p.goto('file://'+APP);await p.waitForTimeout(1300);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(300);
  const t='['+W+'] ';
  const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const f=S.feeds[0],o={};
   const para=n=>`<p>${'Words for the story here, ordinary reporting text with a few more words. '.repeat(n)}</p>`;
   const a={feedId:f.id,title:'Video story',link:'https://w.test/yt1',date:Date.now(),summary:'x',img:'',html:para(8)+'<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" width="560" height="315"></iframe>'+para(8)};
   items[f.id]=[a];S.sel='all';S.scroll='paged';render();await w(300);openReader(a);await w(1800);
   const c=document.querySelector('.cols .yt-tap');o.card=!!c;o.tag=c&&c.tagName;o.noIframeYet=!document.querySelector('.cols iframe[src*="youtube"]');o.label=c&&c.getAttribute('aria-label');o.nested=document.querySelectorAll('.cols a button,.cols button a').length;o.beforeTap=performance.getEntriesByType('resource').some(e=>/youtube-nocookie|youtube\.com\/embed/.test(e.name));
   c.click();await w(300);const fr=document.querySelector('.cols .yt-live iframe');o.iframe=!!fr;o.src=fr&&fr.src;o.card2=!!document.querySelector('.cols .yt-tap');
   window.dispatchEvent(new MessageEvent('message',{data:JSON.stringify({event:'onError',info:150}),source:fr.contentWindow}));await w(150);
   const fb=document.querySelector('.cols a.emb.yt');o.fallback=!!fb&&/Opens in YouTube/.test(fb.textContent)&&/watch\?v=dQw4w9WgXcQ/.test(fb.href);o.liveGone=!document.querySelector('.cols .yt-live');
   return o});
  ck(t+'a tap-to-play card (a button, labelled) replaces the link card',r.card&&r.tag==='BUTTON'&&r.label==='Play video'&&r.nested===0,JSON.stringify(r));
  ck(t+'nothing is loaded from the player before the tap',r.noIframeYet&&!r.beforeTap,JSON.stringify(r));
  ck(t+'tap plays inline in the official privacy-enhanced embed (autoplay, inline)',r.iframe&&/^https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ\?/.test(r.src)&&/autoplay=1/.test(r.src)&&/playsinline=1/.test(r.src)&&!r.card2,r.src);
  ck(t+'embedding disabled (player error 150) falls back to "Opens in YouTube"',r.fallback&&r.liveGone,JSON.stringify(r));
  ck(t+'no page errors',!errs.length,errs[0]);await p.close();
 }
 await b.close();console.log(bad?'yt_inline '+bad+' FAILED':'yt_inline all passed');process.exit(bad?1:0);
})();
