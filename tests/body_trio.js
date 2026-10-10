/* Article body: the hero picture shows once (even when the page's copy has a different size or name), links carry a quiet solid underline, and a newsletter box's leftovers at the end are dropped, never shown as a fragment. */
const fs=require('fs'),path=require('path');
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
/* same picture, different addresses */
const src=fs.readFileSync(path.join(__dirname,'..','www','index.html'),'utf8');
const a0=src.indexOf('function imgKey'),b0=src.indexOf('function heroOnce');eval(src.slice(a0,b0)+';globalThis.sameImg=sameImg;');
const pairs=[
 ['size suffix','https://cdn.x/a/DSC_4121.jpg','https://cdn.x/a/DSC_4121-1024x683.jpg',true],
 ['other folder, other crop (Verge)','https://platform.theverge.com/wp-content/uploads/sites/2/chorus/uploads/chorus_asset/file/25/Foo_Bar_0004.jpg?quality=90&strip=all&crop=0,10.46,100,79.08','https://platform.theverge.com/wp-content/uploads/sites/2/2025/10/Foo_Bar_0004.jpg?quality=90&strip=all&crop=0,0,100,100&w=2400',true],
 ['webp copy (BBC)','https://ichef.bbci.co.uk/news/240/cpsprodpb/AB12/produ/_123456_img.jpg','https://ichef.bbci.co.uk/news/976/cpsprodpb/AB12/produ/_123456_img.jpg.webp',true],
 ['short real name','https://cdn.vox-cdn.com/thumbor/abc/1200x800/cdn.vox-cdn.com/uploads/chorus_asset/file/25/stage.jpg','https://cdn.vox-cdn.com/thumbor/xyz/2400x1600/cdn.vox-cdn.com/uploads/chorus_asset/file/25/stage.jpg',true],
 ['different pictures stay different','https://cdn.x/a/harbour-view.jpg','https://cdn.x/a/council-vote.jpg',false],
 ['generic names are not treated as the same picture','https://a.test/x/photo.jpg','https://b.test/y/photo.jpg',false]
];
for(const [n,x,y,want] of pairs)ck('sameImg: '+n,sameImg(x,y)===want);
(async()=>{
 const b=await chromium.launch();
 for(const [W,H] of [[1100,820],[412,860]]){
  const p=await (await b.newContext({viewport:{width:W,height:H}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:10});await p.route('https://img.test/**',r=>r.fulfill({status:200,contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#468"/></svg>'}));
  await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(300);
  const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const f=S.feeds[0];
   const heroU='https://img.test/chorus_asset/file/25/Foo_Bar_0004.jpg?quality=90&crop=0,10.46,100,79.08',bodyU='https://img.test/2025/10/Foo_Bar_0004.jpg?quality=90&crop=0,0,100,100&w=2400';
   const para=n=>`<p>${'Words for the story here, ordinary reporting text. '.repeat(n)}</p>`;
   const tail='<h3>Sign up for the Installer newsletter</h3><p>newsletter and get the latest gadget news straight to your inbox every Friday</p><p>Email (required)</p><p>Sign up</p><p>By submitting your email, you agree to our Terms and Privacy Notice. This site is protected by reCAPTCHA.</p>';
   const a={feedId:f.id,title:'Body trio',link:'https://w.test/trio',date:Date.now(),summary:'x',img:heroU,html:`<figure><img src="${bodyU}"><figcaption>A caption</figcaption></figure>${para(40)}${para(40)}<p>The plan is simple: you can subscribe for $5 a month, the company said.</p><p><a href="https://x.test/l">A link in a real paragraph</a> with more words after it, enough to count.</p>${tail}`};
   items[f.id]=[a];S.sel='all';S.scroll='paged';render();await w(300);openReader(a);await w(2600);
   const imgs=[...document.querySelectorAll('#rd img')].filter(i=>i.getBoundingClientRect().width>20&&!i.closest('.rprev')).length;
   const body=document.querySelector('.cols .body'),lk=body.querySelector('a[href^="https://x.test/l"]'),cs=lk?getComputedStyle(lk):null;
   return {imgs,text:body.textContent,style:cs&&cs.textDecorationStyle,thick:cs&&cs.textDecorationThickness,color:cs&&cs.textDecorationColor,line:cs&&cs.textDecorationLine}});
  const t='['+W+'] ';
  ck(t+'the hero picture shows once',r.imgs===1,String(r.imgs));
  ck(t+'links use a solid, thin underline (no wavy squiggle)',r.style==='solid'&&/^(1px|0\.?\d*px|auto)$/.test(r.thick||'')&&/underline/.test(r.line||''),JSON.stringify([r.style,r.thick,r.line]));
  ck(t+'the underline is quiet, not a strong red',!/rgb\(2[0-9]{2}, ?[0-9]{1,2}, ?[0-9]{1,2}\)$/.test(r.color||'')&&true,r.color);
  ck(t+'newsletter leftovers are gone',!/newsletter and get|Email \(required\)|reCAPTCHA|Installer newsletter|straight to your inbox/.test(r.text),r.text.slice(-300));
  ck(t+'real closing paragraphs stay (even one that says subscribe)',/you can subscribe for \$5 a month/.test(r.text)&&/A link in a real paragraph/.test(r.text));
  ck(t+'no page errors',!errs.length,errs[0]);await p.close();
 }
 await b.close();console.log(bad?'body_trio '+bad+' FAILED':'body_trio all passed');process.exit(bad?1:0);
})();
