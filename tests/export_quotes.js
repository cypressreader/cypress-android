/* B88: <blockquote><p>..</p></blockquote> keeps every paragraph in the PDF and the EPUB. B89: a pull quote in a story of fewer than three paragraphs is still set. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);const fs=require('fs'),cp=require('child_process'),os=require('os'),zlib=require('zlib');
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
const pdfText=(b64,tag)=>{const f=os.tmpdir()+'/cy_'+tag+'.pdf';fs.writeFileSync(f,Buffer.from(b64,'base64'));try{return cp.execSync('pdftotext "'+f+'" -',{encoding:'utf8'}).replace(/\s+/g,' ')}catch(e){return ''}};
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:412,height:860}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await mock(p,{n:6});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(300);
 const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const f=S.feeds[0];
  const lede='Everything was great until he arrived, and then the whole plan for the harbour fell apart in one long afternoon of argument.';
  const para=t=>`<p>${t} with enough ordinary words to read like real reporting from a well known publication about the painter.</p>`;
  const L=['Sunflowers are the first letter paragraph','The yellow house is the second letter paragraph','Arles is the third letter paragraph'];
  const vg=`<p>${lede}</p>${para('Intro paragraph about Vincent')}<blockquote>${L.map(t=>`<p>${t} of the quoted letter to Theo, long enough to count as text.</p>`).join('')}</blockquote>${para('Closing paragraph after the letter')}${para('One more paragraph at the end')}`;
  const mk=(link,html)=>({feedId:f.id,title:'Test '+link,link:'https://w.test/'+link,date:Date.now(),summary:'x',img:'',html});
  const pdf=async a=>{const s=await pdfStory(a,false);const logo=await pdfLogoImg();const ed=Object.assign({},pdfEdMeta(new Date(),'m'),{logo,solo:true,totalMin:s.min+' minutes',cover:{title:s.title,source:s.source,deck:s.dek||'',img:null},stories:[s]});const o=pdfIssue(ed);let t='';const u=o.bytes;for(let i=0;i<u.length;i+=8192)t+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return btoa(t)};
  const o={};
  const a=mk('vg',vg);o.vg=await pdf(a);
  o.epubQ=exBlocks(vg,'https://w.test/vg').blocks.filter(b=>b.t==='q').map(b=>b.s.slice(0,20));
  /* a short story: two paragraphs and a quote to lift out */
  const short=`<p>${lede}</p>${para('First paragraph of a short story')}${para('Second paragraph of the same short story')}<blockquote>“We can not keep doing this to the town and the harbour,” the mayor said on Monday evening.</blockquote>`;
  o.short=await pdf(mk('sh',short));
  return o});
 const t1=pdfText(r.vg,'vg');
 for(const w of ['first letter paragraph','second letter paragraph','third letter paragraph'])ck('PDF keeps the quoted paragraph: '+w,t1.includes(w),t1.slice(0,300));
 ck('EPUB blocks keep all three quoted paragraphs',r.epubQ.length===3,JSON.stringify(r.epubQ));
 const t2=pdfText(r.short,'short');
 ck('a pull quote in a story of two paragraphs is still set in the PDF',/We can not keep doing this to the town/.test(t2),t2.slice(0,400));
 ck('no page errors',!errs.length,errs[0]);await b.close();console.log(bad?'FAILED '+bad:'export_quotes all passed');process.exit(bad?1:0)})();
