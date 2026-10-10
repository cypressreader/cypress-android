/* Daily > Brief: the lead card's picture always fills its frame (no grey gap, whatever shape the picture is) and a portrait keeps the top (faces) in frame. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
const svg=(w,h)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#468"/><circle cx="${w/2}" cy="${h*.18}" r="${Math.min(w,h)*.1}" fill="#fc9"/></svg>`;
(async()=>{
 const b=await chromium.launch();
 for(const W of [412,1100]){
  const p=await (await b.newContext({viewport:{width:W,height:860}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:10});
  await p.route('https://img.test/**',r=>{const m=/\/(\d+)x(\d+)/.exec(r.request().url());r.fulfill({status:200,contentType:'image/svg+xml',body:svg(+m[1],+m[2])})});
  await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});
  const out={};
  for(const [name,w,h] of [['strip',1200,300],['wide',1600,900],['square',800,800],['portrait',800,1200],['small',320,180]]){
   out[name]=await p.evaluate(async([name,w,h])=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const now=Date.now(),wt=ms=>new Promise(r=>setTimeout(r,ms));
    S.feeds.slice(0,4).forEach((f,fi)=>{items[f.id]=Array.from({length:6},(_,i)=>({feedId:f.id,title:'Story '+'abcd'[fi]+i+' of the day',link:'https://w.test/'+name+fi+'/'+i,date:now-(i*1.5+fi)*3600e3,summary:'A summary.',img:i===0&&fi===0?`https://img.test/${name}/${w}x${h}.png`:''}))});
    S.brief={day:new Date().toDateString(),links:[items[S.feeds[0].id][0].link,...S.feeds.slice(1).map(f=>items[f.id][0].link)]};S.sel='brief';render();await wt(1800);
    const art=document.querySelector('.brf-lead .bi-art'),im=art&&art.querySelector('img');if(!im)return {none:true};const A=art.getBoundingClientRect(),I=im.getBoundingClientRect(),cs=getComputedStyle(im);
    return {aw:Math.round(A.width),ah:Math.round(A.height),iw:Math.round(I.width),ih:Math.round(I.height),fit:cs.objectFit,pos:cs.objectPosition,nat:[im.naturalWidth,im.naturalHeight]}},[name,w,h]);
  }
  const t='['+W+'] ';
  for(const k in out){const o=out[k];ck(t+k+': picture fills its frame',!o.none&&Math.abs(o.iw-o.aw)<=1&&Math.abs(o.ih-o.ah)<=1&&o.ah>=Math.min(o.aw/2.2,150),JSON.stringify(o));ck(t+k+': aspect fill (cover)',o.fit==='cover',JSON.stringify(o))}
  const po=out.portrait;ck(t+'portrait keeps faces (anchored near the top)',po&&/^\d+(\.\d+)?% ([0-9]|[1-3][0-9])(\.\d+)?%$/.test(po.pos||''),po&&po.pos);
  ck(t+'no page errors',!errs.length,errs[0]);await p.close();
 }
 await b.close();console.log(bad?'brief_lead '+bad+' FAILED':'brief_lead all passed');process.exit(bad?1:0);
})();
