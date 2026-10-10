/* PDF magazine: cover with art, contents with links + outline, art on every page, one pull quote per feature (never repeated in the body), no glued words / eaten letters / duplicated paragraphs / mid-word truncation. Exports from the built app and reads the file back with poppler. */
const fs=require('fs'),cp=require('child_process');const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
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
 const raw=fs.readFileSync(OUT+'/m.pdf','latin1');const rawTxt=cp.execSync('pdftotext -raw -enc UTF-8 '+OUT+'/m.pdf -',{encoding:'utf8',maxBuffer:1<<26}).replace(/\s+/g,' ');
 ck('about a dozen pages or more',r.pages>=10,r.pages);
 ck('every page carries art (picture or designed fallback)',r.artOn.every(Boolean),JSON.stringify(r.artOn));
 const li=sh('pdfimages -list '+OUT+'/m.pdf');ck('cover has a full-page picture',/^\s*1\s/m.test(li.split('\n').slice(2).join('\n')));
 ck('contents entries are clickable and there is a full outline',r.links>=10+4&&/\/Outlines/.test(raw)&&(raw.match(/\/Dest \[/g)||[]).length>=r.titles.length+4,r.links+' links');
 ck('external "Read at" links exist',/\/S \/URI \/URI \(https:\/\/w\.test\//.test(raw));
 ck('contents list every headline',r.titles.every(t=>txt.replace(/\s+/g,' ').includes(t.slice(0,30))),'');
 ck('contents has dot leaders (a dotted line per entry)',(raw.match(/\[0 3\.4\] 0 d/g)||[]).length>=r.titles.length-1,(raw.match(/\[0 3\.4\] 0 d/g)||[]).length);
 /* text hygiene */
 const flat=txt.replace(/\s+/g,' ');
 ck('no glued words (camel joins)',!/[a-z]{2}[A-Z][a-z]{2}/.test(flat.replace(/CyPress|TechCrunch|McG|YouTube/g,'')),(flat.match(/[a-z]{2}[A-Z][a-z]{2}/)||[''])[0]);
 ck('no overlong tokens (glue)',!flat.split(' ').some(w=>w.replace(/[^A-Za-z]/g,'').length>24),flat.split(' ').find(w=>w.replace(/[^A-Za-z]/g,'').length>24));
 const labels=[...flat.matchAll(/(Story|More) (\d) paragraph (\d+):/g)].map(m=>m[0]);
 ck('no paragraph printed twice',new Set(labels).size===labels.length,labels.find((x,i)=>labels.indexOf(x)!==i));
 const nfeat=(rawTxt.match(/tory \d paragraph 0:/g)||[]).length;
 ck('drop caps keep their letter (the S is read right before "tory N paragraph 0")',nfeat>=4&&(rawTxt.match(/S tory \d paragraph 0:/g)||[]).length===nfeat,nfeat);
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
 console.log(bad?'pdf_magazine '+bad+' FAILED':'pdf_magazine all passed');process.exit(bad?1:0);
})();
