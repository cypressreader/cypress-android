/* B79: a figure whose site also puts the description inside it (Big Think, other WordPress themes) stays one column wide, keeps its description as the caption (set under the picture when long), and never pushes text out of the page */
const {APP}=require('./env');const {mock,seed,PW}=require('./mock');const {chromium}=require(PW);const fs=require('fs'),path=require('path');
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
const html=fs.readFileSync(path.resolve(__dirname,'fixtures_bigthink.html'),'utf8');const jpg=fs.readFileSync(path.resolve(__dirname,'fixtures_hero.jpg'));
(async()=>{const b=await chromium.launch();
 for(const [name,vw,vh,mode] of [['phone pages',390,800,'pages'],['tablet pages',820,1180,'pages'],['phone scroll',390,800,'vertical']]){
  const ctx=await b.newContext({viewport:{width:vw,height:vh},hasTouch:vw<900,isMobile:vw<700});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{n:3});
  await p.route(/bigthink\.com/,r=>r.fulfill({status:200,contentType:'image/jpeg',body:jpg}));
  await p.addInitScript(([sd,mode])=>{try{localStorage.setItem('folio',JSON.stringify(Object.assign({},sd,{scroll:mode})))}catch(e){}},[seed(['Alpha']),mode]);
  await p.goto('file://'+APP);await p.waitForTimeout(2000);await p.click('text=Get started').catch(()=>{});
  const r=await p.evaluate(async html=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const f=S.feeds[0];const a={feedId:f.id,title:'Will the Hubble “constant” ever become an actual constant?',link:'https://bigthink.test/hubble',date:Date.now(),summary:'x',img:'https://bigthink.com/wp-content/uploads/2023/11/x.jpg',html};items[f.id]=[a,...(items[f.id]||[])];S.sel='all';render();await openReader(a);await new Promise(r=>setTimeout(r,2500));
   const cols=document.querySelector('.cols'),cw=cols.getBoundingClientRect().width;const figs=[...document.querySelectorAll('.cols .body figure')].filter(f=>f.querySelector('img'));
   const lf=figs.find(f=>[...f.children].some(c=>!/^(IMG|PICTURE|FIGCAPTION|BR)$/.test(c.tagName)));return {n:figs.length,cw:Math.round(cw),loose:figs.filter(f=>[...f.children].some(c=>!/^(IMG|PICTURE|FIGCAPTION|BR)$/.test(c.tagName))).length,wide:figs.filter(f=>f.getBoundingClientRect().width>cw+30).length,over:figs.filter(f=>{const c=f.querySelector('figcaption');return c&&c.textContent.length>140&&getComputedStyle(c).position==='absolute'}).length,hasCap:figs.filter(f=>f.querySelector('figcaption')&&f.querySelector('figcaption').textContent.length>60).length,np:R.np}},html);
  ck(name+': the article has its pictures ('+r.n+')',r.n>=3,JSON.stringify(r));
  ck(name+': nothing but the picture and its caption sits loose in a figure',r.loose===0,JSON.stringify(r));
  ck(name+': no figure is wider than the page column plus its picture bleed ('+r.cw+'px)',r.wide===0,JSON.stringify(r));
  ck(name+': a long caption is set under its picture, not over it',r.over===0,JSON.stringify(r));
  ck(name+': the description is kept as the caption',r.hasCap>=3,JSON.stringify(r));
  ck(name+': no page errors',!errs.length,errs[0]);await ctx.close()}
 await b.close();console.log(bad?'FAILED '+bad:'reader_figure all passed');process.exit(bad?1:0)})();
