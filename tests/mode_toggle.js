/* Scroll -> Pages -> Scroll leaves the story exactly as it was (picture height, text width): nothing from the paged layout is left behind */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
(async()=>{const b=await chromium.launch();let bad=0;
for(const [W,H] of [[673,841],[884,1104],[1200,860],[412,860]])for(const rl of ['auto','hero','top','classic']){
const p=await (await b.newContext({viewport:{width:W,height:H}})).newPage();p.on('pageerror',e=>console.log('ERR',e.message));
await mock(p,{n:6});
await p.route('https://img.test/**',r=>r.fulfill({status:200,contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#468"/></svg>'}));
await p.goto('file://'+APP);await p.waitForTimeout(1500);
const r=await p.evaluate(async(rl)=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const f=S.feeds[0];
 const para=n=>`<p>${'Words for the story here, ordinary reporting text with a few more words. '.repeat(n)}</p>`;
 const m=()=>{const im=document.querySelector('#rd img.hero'),bd=document.querySelector('#rd .body');const q=im&&im.getBoundingClientRect(),z=bd&&bd.getBoundingClientRect();return {cls:$('#rd').className,hero:q&&[Math.round(q.width),Math.round(q.height)],body:z&&[Math.round(z.width),Math.round(z.height)],hs:(im&&im.getAttribute('style'))||'',cs:$('.cols').getAttribute('style').slice(0,60)}};
 const a={feedId:f.id,title:'Toggle '+rl,link:'https://w.test/t'+rl,date:Date.now(),summary:'x',img:'https://img.test/hero.jpg',html:para(14)+para(14)+para(14)};items[f.id]=[a];
 S.rl=rl;S.scroll='vertical';S.sel='all';render();await w(200);openReader(a);await w(1400);const v0=m();
 S.scroll='paged';refreshReader();await w(900);const pg=m();
 S.scroll='vertical';refreshReader();await w(900);const v1=m();return {v0,pg,v1}},rl);
const ok=r.v1.hero&&r.v0.hero&&Math.abs(r.v1.hero[1]-r.v0.hero[1])<8&&Math.abs(r.v1.body[1]-r.v0.body[1])<30;
if(!ok)bad++;console.log(ok?'ok':'FAIL','Scroll > Pages > Scroll',W,rl,JSON.stringify(ok?{h0:r.v0.hero,h1:r.v1.hero}:r));await p.close()}
await b.close();process.exit(bad?1:0)})();
