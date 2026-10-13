/* B82: the colophon is the final page of both the PDF and the Kindle book: badge, CYPRESS, rule, tagline, one quote (never a lone word on its last line), and the dated bottom line */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);const fs=require('fs'),cp=require('child_process'),os=require('os'),zlib=require('zlib');
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
const EPC=process.env.EPUBCHECK||'/tmp/r2/epc/epubcheck-5.1.0/epubcheck.jar';
const unzip=buf=>{const out={};let i=0;while(i<buf.length-30&&buf.readUInt32LE(i)===0x04034b50){const m=buf.readUInt16LE(i+8),cs=buf.readUInt32LE(i+18),nl=buf.readUInt16LE(i+26),xl=buf.readUInt16LE(i+28),nm=buf.toString('utf8',i+30,i+30+nl),st=i+30+nl+xl;out[nm]=m===0?buf.subarray(st,st+cs):zlib.inflateRawSync(buf.subarray(st,st+cs));i=st+cs}return out};
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:412,height:860}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await mock(p,{n:6});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(300);
 const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const f=S.feeds[0];
  const para=t=>`<p>${t} with enough ordinary words to read like real reporting from a well known publication about the harbour.</p>`;
  const a={feedId:f.id,title:'Harbour plan divides the town',link:'https://w.test/co',date:Date.now(),summary:'x',img:'',html:'<p>Everything was great until he arrived, and then the whole plan for the harbour fell apart in one long afternoon of argument.</p>'+['The committee met on Tuesday','The mayor spoke on Monday','The council voted on Friday'].map(para).join('')};
  const s=await pdfStory(a,false);const logo=await pdfLogoImg(),badge=await pdfBadgeImg('#8a6a14');
  const ed=Object.assign({},pdfEdMeta(new Date(),'m'),{logo,badge,solo:true,totalMin:s.min+' minutes',cover:{title:s.title,source:s.source,deck:s.dek||'',img:null},stories:[s]});
  const o=pdfIssue(ed);let t='';const u=o.bytes;for(let i=0;i<u.length;i+=8192)t+=String.fromCharCode.apply(null,u.subarray(i,i+8192));
  const st=await exStory(a);const mode=async m=>{const bl=await epubMake([st],m,'T');const ab=new Uint8Array(await bl.arrayBuffer());let z='';for(let i=0;i<ab.length;i+=8192)z+=String.fromCharCode.apply(null,ab.subarray(i,i+8192));return btoa(z)};
  /* ten exports: the quote is picked at random */
  const picks=new Set();for(let i=0;i<80;i++)picks.add(exColophon().quote);
  /* every quote in the bank: wrapped for the PDF page, no one-word last line, within a sane number of lines, every character encodable */
  const all=EXBANK.map(([q,by])=>{const qt='\x93'+pdfWa(q)+'\x94',ql=exWrapQuote(qt,14.5);return {n:ql.length,last:ql[ql.length-1].trim().split(/\s+/).length,w:Math.max(...ql.map(l=>pdfW(l,'i',14.5))),enc:/[^\x00-\xff]/.test(qt+pdfWa(by)),q:q.slice(0,30)}});
  return {all,pdf:btoa(t),pages:o.pages,bw:await mode('bw'),color:await mode('color'),distinct:picks.size,bank:EXBANK.length,slogan:SLOGAN}});
 const f=os.tmpdir()+'/cy_colo.pdf';fs.writeFileSync(f,Buffer.from(r.pdf,'base64'));
 const np=+(cp.execSync('pdfinfo "'+f+'" | grep Pages',{encoding:'utf8'}).match(/\d+/)||[0])[0];
 const last=cp.execSync('pdftotext -f '+np+' -l '+np+' -layout "'+f+'" -',{encoding:'utf8'}).split('\n').map(x=>x.trim()).filter(Boolean);
 const flat=last.join(' | ');
 ck('PDF: the last page carries CYPRESS, the slogan and the bottom line',/C\s*Y\s*P\s*R\s*E\s*S\s*S/.test(flat)&&last.includes('The art of staying informed.')&&/This selection was made [A-Z][a-z]+ \d{1,2}, \d{4} · Get the app at cypressreader\.com\/app/.test(flat),flat);
 const qi=last.findIndex(l=>/^“/.test(l)),bi=last.findIndex(l=>/^—/.test(l));
 ck('PDF: the quote sits in typographic quotation marks with its author',qi>=0&&bi>qi&&/”$/.test(last[bi-1]),flat);
 ck('PDF: no single word alone on the quote\'s last line',qi>=0&&bi>qi&&last[bi-1].split(/\s+/).length>=2,last.slice(qi,bi).join(' / '));
 ck('PDF: it is a page of its own (nothing from a story on it)',!/Harbour plan|committee met/.test(flat),flat);
 ck('the bank is the approved one: 116 quotes',r.bank===116,String(r.bank));
 ck('the quote is picked at random (many different ones in 80 tries; got '+r.distinct+')',r.distinct>=15,String(r.distinct));
 ck('all 116 quotes wrap with no one-word last line',r.all.every(x=>x.last>=2),JSON.stringify(r.all.filter(x=>x.last<2)));
 ck('all 116 quotes fit the page: at most 8 lines and inside the measure',r.all.every(x=>x.n<=8&&x.w<=340),JSON.stringify(r.all.filter(x=>x.n>8||x.w>340)));
 ck('every character of every quote and author can be set in the PDF font',r.all.every(x=>!x.enc),JSON.stringify(r.all.filter(x=>x.enc)));
 for(const m of ['bw','color']){
  const buf=Buffer.from(r[m],'base64');const files=unzip(buf);const opf=files['OEBPS/content.opf'].toString();
  const spine=[...opf.matchAll(/<itemref idref="([^"]+)"/g)].map(x=>x[1]);const man={};for(const x of opf.matchAll(/<item id="([^"]+)"[^>]*href="([^"]+)"/g))man[x[1]]=x[2];
  const lastHref=man[spine[spine.length-1]];const html=(files['OEBPS/'+lastHref]||Buffer.from('')).toString();
  ck('EPUB ('+m+'): the last page of the book is the colophon',/class="colo"/.test(html)&&/CYPRESS/.test(html)&&/The art of staying informed\./.test(html)&&/Get the app at cypressreader\.com\/app/.test(html),lastHref);
  ck('EPUB ('+m+'): the badge picture is in the book',/<img src="images\/i\d+\.jpg" alt="CyPress"/.test(html));
  ck('EPUB ('+m+'): quote has proper quotation marks and its last two words are tied together (no widow)',/&#8220;[\s\S]+&#160;[^ <]+&#8221;/.test(html)||/“[\s\S]+ [^ <]+”/.test(html),html.slice(html.indexOf('cq')-10,html.indexOf('cq')+200));
  ck('EPUB ('+m+'): '+(m==='bw'?'black only, no colour':'gold accents'),m==='bw'?!/8a6a14/.test(files['OEBPS/style.css'].toString().split('.colo').slice(1).join(' ')):/8a6a14/.test(files['OEBPS/style.css'].toString().split('.colo').slice(1).join(' ')));
  const ef=os.tmpdir()+'/cy_colo_'+m+'.epub';fs.writeFileSync(ef,buf);
  if(fs.existsSync(EPC)){let o='';try{o=cp.execSync('java -jar "'+EPC+'" "'+ef+'" 2>&1',{encoding:'utf8'})}catch(e){o=String(e.stdout||e)}
   const sum=(o.match(/Messages: ([^\n]+)/)||[])[1]||o.slice(-200);ck('EPUBCheck ('+m+'): '+sum,/0 fatals? \/ 0 errors? \/ 0 warnings?/.test(sum)||/Messages: 0 fatal/.test(o),o.slice(-300))}
 }
 ck('no page errors',!errs.length,errs[0]);await b.close();console.log(bad?'FAILED '+bad:'export_colophon all passed');process.exit(bad?1:0)})();
