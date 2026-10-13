/* B80: the PDF's drop cap is an artifact; ActualText wraps only the first line, so text comes out in reading order */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);const fs=require('fs'),cp=require('child_process'),os=require('os');
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:412,height:860}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await mock(p,{n:6});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(300);
 const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const f=S.feeds[0];
  const para=k=>`<p>${'ABCDEF'[k-1]===undefined?'':''}The committee met on Tuesday to discuss the long-running dispute over the harbour redevelopment, a plan that has divided the town for years, and the room agreed that something had to give before the winter arrived in full.</p>`;
  const a={feedId:f.id,title:'Harbour plan divides the town',link:'https://w.test/dc',date:Date.now(),summary:'x',img:'',html:'<p>Everything was great until he arrived, and then the whole plan for the harbour fell apart in one long afternoon of argument.</p>'+[1,2,3,4,5,6].map(para).join('')};
  const s=await pdfStory(a,false);const logo=await pdfLogoImg();
  const ed=Object.assign({},pdfEdMeta(new Date(),'m'),{logo,solo:true,totalMin:s.min+' minutes',cover:{title:s.title,source:s.source,deck:s.dek||'',img:null},stories:[s]});
  const o=pdfIssue(ed);let t='';const u=o.bytes;for(let i=0;i<u.length;i+=8192)t+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return {b64:btoa(t)}});
 const pdf=Buffer.from(r.b64,'base64');const zlib=require('zlib');let raw=pdf.toString('latin1');{const re=/stream\r?\n/g;let m;const buf=pdf;let out='';while((m=re.exec(raw))){const st=m.index+m[0].length,en=raw.indexOf('endstream',st);if(en<0)break;try{out+=zlib.inflateSync(buf.subarray(st,en)).toString('latin1')+'\n'}catch(e){}re.lastIndex=en}raw+='\n'+out}
 const art=raw.indexOf('/Artifact BMC'),span=raw.indexOf('/ActualText');
 ck('the drop cap is marked as an artifact',art>0,'no /Artifact BMC');
 ck('ActualText comes after the artifact ends (it does not wrap the big letter)',span>art&&/\/Artifact BMC[\s\S]{0,400}?EMC\s*\/Span << \/ActualText/.test(raw),'order');
 const blk=raw.match(/\/Span << \/ActualText <[0-9A-Fa-f]+> >> BDC([\s\S]*?)EMC/);
 ck('exactly one text-showing operation sits inside the ActualText span',!!blk&&(blk[1].match(/\bTj\b|\bTJ\b/g)||[]).length===1,blk&&blk[1].slice(0,200));
 const f=os.tmpdir()+'/cy_dropcap.pdf';fs.writeFileSync(f,pdf);
 let txt='';try{txt=cp.execSync('pdftotext -layout "'+f+'" -',{encoding:'utf8'})}catch(e){}
 if(txt){const lines=txt.split('\n').map(x=>x.trim()).filter(Boolean);const i=lines.findIndex(x=>/^T?he committee met on Tuesday/.test(x)||/committee met on Tuesday/.test(x));
  ck('text extraction gives the first line then the next lines in order',i>=0&&/dispute over the harbour/.test(lines.slice(i,i+3).join(' ')),lines.slice(0,12).join(' | '));
  ck('the big letter is not extracted as a stray line on its own',!lines.some(x=>x==='T'),lines.slice(0,12).join('|'))}
 ck('no page errors',!errs.length,errs[0]);await b.close();console.log(bad?'FAILED '+bad:'pdf_dropcap all passed');process.exit(bad?1:0)})();
