/* PDF magazine: cover with art, contents with links + outline, art on every page, one pull quote per feature (never repeated in the body), no glued words / eaten letters / duplicated paragraphs / mid-word truncation. Exports from the built app and reads the file back with poppler. */
const fs=require('fs'),cp=require('child_process');const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
const raw2=f=>fs.readFileSync(f,'latin1');
const OUT=process.env.PDFOUT||'/tmp/pdf_magazine';fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:412,height:860}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1500);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(300);
 const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());
  const f=S.feeds[0],now=Date.now();
  const img=(c1,c2)=>{const c=document.createElement('canvas');c.width=900;c.height=600;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,900,600);g.addColorStop(0,c1);g.addColorStop(1,c2);x.fillStyle=g;x.fillRect(0,0,900,600);x.fillStyle='rgba(255,240,200,.8)';x.beginPath();x.arc(640,200,110,0,7);x.fill();return c.toDataURL('image/jpeg',.8)};
  const para=(k,n)=>Array.from({length:n},(_,i)=>`<p>${k} paragraph ${i}: the committee met on Tuesday to discuss the long-running dispute over the harbour redevelopment, a plan that has divided the town for years. “We can’t keep doing this,” said one member, and the room agreed that something had to give before the winter. The ~~$350~~ price is _he_ said __huge__ for the officials.</p>`).join('');
  const lede='Everything was great until he arrived, and then the whole plan for the harbour fell apart in a single afternoon of argument.';
  const T=['The Pentagon is planning a new round of cuts as the agency criticises the deal','Celebrity chef opens a restaurant that nobody expected in the old port','Peace talks resume in Geneva after a long and difficult winter of fighting','Prosecutors defend the assault on rule of law charges in a packed courtroom','That the agency will review the rules is welcome news for local businesses','Markets slide as the central bank signals a deal is further away than hoped','Short item: bridge repairs delayed again','Short item: library hours extended','Short item: new cycle lane opens','Short item: council votes on parking'];
  const mk=(i,words,hasImg)=>({feedId:f.id,title:T[i],link:'https://w.test/pdf'+i,date:now-i*36e5,summary:'Summary '+i,img:hasImg?img('#'+((i*37%900)+100).toString().slice(0,3),'#223'):'',author:i%2?'Jane Doe':'',html:`<p>${lede}</p><h2>What changed</h2>`+para('Story '+i,Math.round(words/60))+`<blockquote>“This is the line that a magazine would lift out and set large for the reader,” she said.</blockquote>`+para('More '+i,3)});
  const sh=(i,im)=>({...mk(i,100,im),html:`<p>${lede}</p><p>The council said on Monday that the repairs would be delayed again, citing weather and supply problems, and promised an update before the end of the month.</p>`});
  const arts=[mk(0,1500,1),mk(1,1100,1),mk(2,700,0),mk(3,650,1),mk(4,400,0),mk(5,300,1),sh(6,0),sh(7,1),sh(8,0),sh(9,0)];
  const stories=[];for(const a of arts){const s=await pdfStory(a,false);s.img=a.img?await pdfCoverImg(a.img):null;stories.push(s)}
  const mins=stories.reduce((n,s)=>n+s.min,0),lead=stories[0],logo=await pdfLogoImg();
  const ed=Object.assign({},pdfEdMeta(new Date(),'m'),{logo,totalMin:mins+' minutes',cover:{title:lead.title,source:lead.source,deck:lead.dek||'',img:lead.img},stories});
  const o=pdfIssue(ed);let s='';const u=o.bytes;for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode.apply(null,u.subarray(i,i+8192));
  return {b64:btoa(s),pages:o.pages,artOn:o.artOn,outline:o.outline,links:o.links,titles:stories.map(s=>s.title)}});
 fs.writeFileSync(OUT+'/m.pdf',Buffer.from(r.b64,'base64'));await b.close();
 const sh=c=>cp.execSync(c,{encoding:'latin1',maxBuffer:1<<26});
 const txt=cp.execSync('pdftotext -enc UTF-8 '+OUT+'/m.pdf -',{encoding:'utf8',maxBuffer:1<<26});
 const raw=fs.readFileSync(OUT+'/m.pdf','latin1');
 ck('about a dozen pages or more',r.pages>=10,r.pages);
 ck('every page carries art (picture or designed fallback)',r.artOn.every(Boolean),JSON.stringify(r.artOn));
 const li=sh('pdfimages -list '+OUT+'/m.pdf');ck('cover has a full-page picture',/^\s*1\s/m.test(li.split('\n').slice(2).join('\n')));
 ck('contents entries are clickable and there is a full outline',r.links>=10+4&&/\/Outlines/.test(raw)&&(raw.match(/\/Dest \[/g)||[]).length>=r.titles.length+4,r.links+' links');
 ck('external "Read at" links exist',/\/S \/URI \/URI \(https:\/\/w\.test\//.test(raw));
 ck('contents list every headline',r.titles.every(t=>txt.replace(/\s+/g,' ').includes(t.slice(0,30))),'');
 ck('contents has dot leaders (a dotted line per entry)',(raw.match(/\[0 3\.4\] 0 d/g)||[]).length>=r.titles.length-1,(raw.match(/\[0 3\.4\] 0 d/g)||[]).length);
 /* text hygiene */
 const flat=txt.replace(/\s+/g,' ');const modesSample=['','-layout','-raw'].map(m=>cp.execSync('pdftotext '+m+' -enc UTF-8 '+OUT+'/m.pdf -',{encoding:'utf8',maxBuffer:1<<26}));
 ck('no glued words (camel joins)',!/[a-z]{2}[A-Z][a-z]{2}/.test(flat.replace(/CyPress|TechCrunch|McG|YouTube/g,'')),(flat.match(/[a-z]{2}[A-Z][a-z]{2}/)||[''])[0]);
 ck('no overlong tokens (glue)',!flat.split(' ').some(w=>w.replace(/[^A-Za-z]/g,'').length>24),flat.split(' ').find(w=>w.replace(/[^A-Za-z]/g,'').length>24));
 const labels=[...flat.matchAll(/(Story|More) (\d) paragraph (\d+):/g)].map(m=>m[0]);
 ck('no paragraph printed twice',new Set(labels).size===labels.length,labels.find((x,i)=>labels.indexOf(x)!==i));
 const nfeat=(flat.match(/Story \d paragraph 0:/g)||[]).length;
 ck('drop caps keep their letter: the first word reads whole ("Story N paragraph 0:") in every extraction mode',nfeat>=4&&modesSample.every(t=>(t.replace(/\s+/g,' ').match(/Story \d paragraph 0:/g)||[]).length===nfeat&&!/(^|\s)tory \d paragraph 0:/.test(t.replace(/\s+/g,' '))),nfeat);
 const pq=(flat.match(/This is the line that a magazine would lift out/g)||[]).length;
 ck('one pull quote per feature, never repeated in the body',pq===nfeat,'found '+pq+' for '+nfeat+' features');
 /* every ellipsis follows a whole word */
 const vocab=new Set(flat.toLowerCase().replace(/[^a-z' ]/g,' ').split(/\s+/));
 const ell=[...flat.matchAll(/([A-Za-z’']+)[,;:]?\s?…/g)].map(m=>m[1].toLowerCase());
 ck('ellipses follow whole words ('+ell.length+' checked)',ell.every(w=>vocab.has(w)&&w.length>=1),ell.filter(w=>!vocab.has(w)).join(','));
 ck('no "?" stand-ins for letters',!/\w\?\w/.test(flat),'');
 ck('back page: logo image and colophon',/Typeset on your device/.test(flat)&&/C\s*Y\s*P\s*R\s*E\s*S\s*S/.test(flat));
 const il=li.split('\n').slice(2).filter(Boolean);ck('last page holds the logo',il.some(l=>+l.trim().split(/\s+/)[0]===r.pages),il.slice(-2).join('|'));
 ck('no page errors',!errs.length,errs[0]);
 /* ---------- real publisher text (BBC, TechCrunch, The Verge): tests/fixtures/pdf_real_feeds.json ---------- */
 {
  const fx=JSON.parse(fs.readFileSync(__dirname+'/fixtures/pdf_real_feeds.json','utf8'));
  const b2=await chromium.launch();const p2=await (await b2.newContext({viewport:{width:412,height:860}})).newPage();const e2=[];p2.on('pageerror',e=>e2.push(e.message));
  await mock(p2,{n:10});await p2.goto('file://'+APP);await p2.waitForTimeout(1500);await p2.click('text=Get started').catch(()=>{});await p2.waitForTimeout(300);
  const rr=await p2.evaluate(async fx=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const f=S.feeds[0];const now=Date.now();
   const stories=[];for(let i=0;i<fx.length;i++){const a={feedId:f.id,title:fx[i].title,link:'https://'+({'BBC World':'www.bbc.co.uk/news/articles/x','TechCrunch':'techcrunch.com/2026/10/10/x','The Verge':'www.theverge.com/x'}[fx[i].feed])+i,date:now-i*36e5,summary:fx[i].desc||'x',img:'',html:fx[i].html};const s=await pdfStory(a,false);s.source=fx[i].feed;stories.push(s)}
   const mins=stories.reduce((n,s)=>n+s.min,0),lead=stories[0],logo=await pdfLogoImg();
   const ed=Object.assign({},pdfEdMeta(new Date(),'m'),{logo,totalMin:mins+' minutes',cover:{title:lead.title,source:lead.source,deck:lead.dek||'',img:null},stories});
   const o=pdfIssue(ed);let s='';const u=o.bytes;for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode.apply(null,u.subarray(i,i+8192));
   return {b64:btoa(s),pages:o.pages,stories:stories.map(s=>({title:s.title,words:s.words,first:(s.blocks.find(b=>b.t==='p'&&b.s.length>=140)||{}).s||''}))}},fx);
  await b2.close();fs.writeFileSync(OUT+'/real.pdf',Buffer.from(rr.b64,'base64'));
  const modes=['','-layout','-raw'].map(m=>cp.execSync('pdftotext '+m+' -enc UTF-8 '+OUT+'/real.pdf -',{encoding:'utf8',maxBuffer:1<<26}));
  const flats=modes.map(t=>t.replace(/\s+/g,' '));
  ck('[real] exported from real BBC / TechCrunch / Verge text',rr.pages>=8,rr.pages);
  const feats=rr.stories.filter(x=>x.words>=600).slice(0,5);
  ck('[real] there are features with drop caps',feats.length>=3,feats.length);
  for(const [mi,mn] of ['reading order','layout','raw'].entries()){
   const lone=modes[mi].split('\n').filter(l=>/^\s*[A-Z]\s*$/.test(l));
   ck('[real] ('+mn+') no capital left alone on a line',lone.length===0,lone.length);
   const miss=feats.filter(x=>{const w=x.first.split(/\s+/).slice(0,4).join(' ');return !flats[mi].includes(w)});
   ck('[real] ('+mn+') every feature\'s first words are whole: '+feats.map(x=>x.first.split(' ')[0]).join(', '),miss.length===0,miss.map(x=>x.first.slice(0,40)).join(' | '));
  }
  for(const [mi,mn] of ['reading order','layout','raw'].entries()){
   const t=flats[mi];
   ck('[real] ('+mn+') no glue at links ("Fish,and", "Shrinkingbetween", "LG$3600")',!/Fish,and|Shrinkingbetween|LG\$3600|Fish,\s*and watching all of Shrinking\s*between/.test(t)||/Fish, and watching all of Shrinking between/.test(t)&&!/Fish,and/.test(t),(t.match(/\S{0,12}Fish,\S{0,12}/)||[''])[0]);
   ck('[real] ('+mn+') publisher words after links are spaced',/Fish, and watching all of Shrinking/.test(t.replace(/\s+/g,' '))&&/\bbetween the hours of 1 and 5AM/.test(t.replace(/\s+/g,' '))&&/\$3600 at LG\s[\s\S]{0,400}\$3600 at Best Buy/.test(t)&&!/LG\$3600/.test(t),'');
  }
  const flat0=flats[0];
  ck('[real] no glued punctuation anywhere',!/[a-z][,;][A-Za-z]{2,}/.test(flat0.replace(/https?:\S+/g,'')),(flat0.match(/\S{0,10}[a-z][,;][A-Za-z]{2,}\S{0,10}/)||[''])[0]);
  /* contents: a headline is never cut, and its page number keeps clear of it */
  const bb=cp.execSync('pdftotext -f 2 -l 3 -bbox -enc UTF-8 '+OUT+'/real.pdf -',{encoding:'utf8',maxBuffer:1<<26});
  const W=[...bb.matchAll(/<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)<\/word>/g)].map(m=>({x0:+m[1],y0:+m[2],x1:+m[3],y1:+m[4],t:m[5]}));
  const nums=W.filter(w=>/^\d{1,3}$/.test(w.t)&&w.x0>480);let tight=0;
  for(const n of nums){const prev=W.filter(w=>w!==n&&Math.abs(w.y1-n.y1)<5&&w.x1<=n.x0+.5&&w.x0>100).sort((a,b)=>b.x1-a.x1)[0];if(prev&&n.x0-prev.x1<14)tight++}
  ck('[real] contents page numbers keep 14pt or more clear of the headline ('+nums.length+' numbers)',nums.length>=rr.stories.length-1&&tight===0,tight+' tight');
  const ctxt=cp.execSync('pdftotext -f 2 -l 3 -enc UTF-8 '+OUT+'/real.pdf -',{encoding:'utf8'}).replace(/\s+/g,' ');
  ck('[real] a three-line headline is whole in the contents ("... from the live internet instead")',/live internet instead/.test(ctxt)&&/calls it a gift to Putin/.test(ctxt),'');
  /* the way out to the story is a visible button */
  const rects=[...raw2(OUT+'/real.pdf').matchAll(/\/Rect \[([\d. -]+)\] \/Border \[0 0 0\] \/A << \/S \/URI/g)].map(m=>m[1].trim().split(/\s+/).map(Number));
  ck('[real] "Read at ..." buttons: linked, and button-sized (wide and tall enough to tap)',rects.length>=2&&rects.every(r=>r[2]-r[0]>=85&&r[3]-r[1]>=14),JSON.stringify(rects.slice(0,2)));
  ck('[real] "Read at" text is on the page',/Read at (www\.)?bbc\.co\.uk|Read at techcrunch\.com|Read at theverge\.com/.test(flat0));
  /* nothing printed outside the page margins (feature openers once lost their first letters at the page edge on some viewers) */
  {const allbb=cp.execSync('pdftotext -bbox -enc UTF-8 '+OUT+'/real.pdf -',{encoding:'utf8',maxBuffer:1<<26});const ws=[...allbb.matchAll(/<word xMin="([\d.]+)" yMin="[\d.]+" xMax="([\d.]+)" yMax="[\d.]+">([^<]*)<\/word>/g)].map(m=>({x0:+m[1],x1:+m[2],t:m[3]}));
   const out=ws.filter(w=>w.x0<44||w.x1>595.28-44);ck('[real] every word on every page sits at least 44pt inside the page edge ('+ws.length+' words)',out.length===0,JSON.stringify(out.slice(0,5)))}
  ck('[real] no page errors',!e2.length,e2[0]);
 }
 console.log(bad?'pdf_magazine '+bad+' FAILED':'pdf_magazine all passed');process.exit(bad?1:0);
})();
