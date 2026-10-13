/* B61: opening a story answers at once (the panel shows before the text is laid out) and a late picture cannot push the text down */
const {APP}=require('./env');const {mock,seed,PW}=require('./mock');const {chromium}=require(PW);const fs=require('fs');
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
const jpg=fs.readFileSync(require('path').resolve(__dirname,'fixtures_hero.jpg'));
const art=t=>`<html><head><title>${t}</title></head><body><article><h1>${t}</h1><img src="https://img.test/hero.jpg" width="1200" height="800" alt=""><p>${'The company said on Monday it will launch a new product with a bigger screen and a smarter coach. '.repeat(6)}</p><figure><img src="https://img.test/a.jpg" width="1200" height="800" alt=""><figcaption>A caption</figcaption></figure><p>${'Analysts expect strong demand through the holiday quarter, according to people familiar. '.repeat(8)}</p><figure><img src="https://img.test/b.jpg" alt=""></figure><p>${'More paragraphs follow here with ordinary reporting text that continues the story. '.repeat(10)}</p><p>${'And a final paragraph to give the page a real second column to flow into. '.repeat(10)}</p></article></body></html>`;
(async()=>{const b=await chromium.launch();
 for(const [mode,vw,vh] of [['pages',390,800],['scroll',390,800]]){
  const ctx=await b.newContext({viewport:{width:vw,height:vh},hasTouch:true,isMobile:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:6});
  await p.route(/img\.test/,async r=>{await new Promise(x=>setTimeout(x,500));r.fulfill({status:200,contentType:'image/jpeg',body:jpg})});
  await p.route(/corsproxy\.io/,r=>{const u=decodeURIComponent(r.request().url());const m=u.match(/https?:\/\/(\w+)\.test\/(feed|story-\d+)/);if(m&&m[2]!=='feed')return r.fulfill({status:200,contentType:'text/html',body:art(m[1]+' '+m[2])});r.fallback()});
  await p.addInitScript(([sd,mode])=>{try{localStorage.setItem('folio',JSON.stringify(Object.assign({},sd,{scroll:mode})))}catch(e){}},[seed(['Alpha','Beta']),mode]);
  await p.goto('file://'+APP);await p.waitForTimeout(2500);
  await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());S.sel='all';render()});await p.waitForTimeout(800);
  const r=await p.evaluate(async()=>{
   window.__ls=[];new PerformanceObserver(l=>l.getEntries().forEach(e=>{if(!e.hadRecentInput)window.__ls.push(e.value)})).observe({type:'layout-shift'});
   document.querySelector('#grid .card[data-i]').click();
   /* straight after the tap (before the first frame) the panel is up, but the text has not been filled in yet */
   const sh={on:$('#rd').classList.contains('on'),bar:!!$('#rd .bar'),ready:R.ready,filled:($('.cols .body')||{textContent:''}).textContent.trim().length>0};
   const t0=Date.now();while(!R.ready&&Date.now()-t0<8000)await new Promise(r=>setTimeout(r,100));
   await new Promise(r=>setTimeout(r,1500));
   const imgs=[...document.querySelectorAll('.cols .body img')];
   return {sh,ready:R.ready,cls:window.__ls.reduce((a,x)=>a+x,0),imgs:imgs.length,sized:imgs.filter(i=>i.getAttribute('height')).length,unsizedRatio:imgs.filter(i=>!i.getAttribute('height')).every(i=>getComputedStyle(i).aspectRatio!=='auto')}});
  ck(mode+': the panel and its bar show before the text is laid out',r.sh.on&&r.sh.bar&&!r.sh.ready&&!r.sh.filled,JSON.stringify(r.sh));
  ck(mode+': the story finishes opening',r.ready,JSON.stringify(r));
  ck(mode+': late pictures do not shift the layout (shift score '+r.cls.toFixed(3)+')',r.cls<0.05,JSON.stringify(r));
  ck(mode+': pictures with a stated size keep it ('+r.sized+' of '+r.imgs+') and the rest reserve a shape',r.imgs===0||(r.sized>=1&&r.unsizedRatio),JSON.stringify(r));
  ck(mode+': no page errors',!errs.length,errs[0]);await ctx.close()}
 await b.close();console.log(bad?'FAILED '+bad:'open_smooth all passed');process.exit(bad?1:0)})();
