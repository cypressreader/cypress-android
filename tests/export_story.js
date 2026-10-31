/* Export (B66, B69, B70, B72): the Daily no longer exports a whole edition. One story: Save as PDF and Send to Kindle (an EPUB) from the reader menu. Saved: pick stories, then make a PDF or a Kindle book from just those. Paywall and page-furniture labels never reach the files; one tap starts it and says so. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
const {execFileSync}=require('child_process');const fs=require('fs');const os=require('os');const path=require('path');
let bad=0;const ck=(n,ok,x)=>{console.log((ok?'ok ':'FAIL ')+n+(ok?'':' '+(x||'')));if(!ok)bad++};
const TMP=fs.mkdtempSync(path.join(os.tmpdir(),'cyx-'));
const pdfText=buf=>{const f=path.join(TMP,'t'+Math.random().toString(36).slice(2)+'.pdf');fs.writeFileSync(f,buf);try{return execFileSync('pdftotext',[f,'-'],{encoding:'utf8'})}catch(e){return null}};
const epubInfo=buf=>{const f=path.join(TMP,'e'+Math.random().toString(36).slice(2)+'.epub');fs.writeFileSync(f,buf);
 const py=`
import zipfile,sys,json,xml.etree.ElementTree as ET
z=zipfile.ZipFile(sys.argv[1]);n=z.namelist();o={'names':n,'first':n[0],'firstStored':z.infolist()[0].compress_type==0,'mime':z.read('mimetype').decode()}
errs=[]
for nm in n:
    if nm.endswith(('.xhtml','.opf','.ncx','.xml')):
        try:ET.fromstring(z.read(nm))
        except Exception as e:errs.append(nm+': '+str(e))
o['xmlErrors']=errs
ns={'o':'http://www.idpf.org/2007/opf'};r=ET.fromstring(z.read('OEBPS/content.opf'))
mani={i.get('id'):i.get('href') for i in r.find('o:manifest',ns)}
o['spineOk']=all(i.get('idref') in mani and ('OEBPS/'+mani[i.get('idref')]) in n for i in r.find('o:spine',ns))
o['manifestOk']=all(('OEBPS/'+h) in n for h in mani.values())
o['text']=' '.join(z.read(x).decode('utf8','ignore') for x in n if x.endswith('.xhtml') and 'nav' not in x and 'cover' not in x)
o['css']=z.read('OEBPS/style.css').decode()
imgs={x:z.read(x) for x in n if x.startswith('OEBPS/images/')}
o['imgs']=[x for x in imgs]
try:
    from PIL import Image
    import io
    sp={}
    for x,b in imgs.items():
        im=Image.open(io.BytesIO(b)).convert('RGB');px=list(im.getdata())[::53];sp[x]=max(max(p)-min(p) for p in px)
    o['spread']=sp
except Exception as e:o['spread']=None
print(json.dumps(o))`;
 try{return JSON.parse(execFileSync('python3',['-W','ignore','-c',py,f],{encoding:'utf8'}))}catch(e){return {err:String(e).slice(0,300)}}};
const hist=p=>p.evaluate(()=>window.__toasts||[]);
const slow=p=>p.evaluate(()=>{window.__toasts=[];const t=document.querySelector('#toast');new MutationObserver(()=>{const m=(t.querySelector('span')||{}).textContent;if(m&&window.__toasts[window.__toasts.length-1]!==m)window.__toasts.push(m)}).observe(t,{childList:true,subtree:true,characterData:true});const sf=saveFile;saveFile=async(...a)=>{await new Promise(r=>setTimeout(r,1500));return sf(...a)}});
const note=p=>p.evaluate(()=>{const t=document.querySelector('#toast');return {msg:t&&t.querySelector('span')?t.querySelector('span').textContent:'',show:!!(t&&/show/.test(t.className))}});
(async()=>{
 const b=await chromium.launch();
 /* a real JPEG for the story pictures (an SVG cannot be decoded by the browser) */
 const jpg=await (async()=>{const c=await b.newContext();const p=await c.newPage();await p.setContent('<canvas id=c width=900 height=560></canvas>');const d=await p.evaluate(()=>{const c=document.getElementById('c'),x=c.getContext('2d');const g=x.createLinearGradient(0,0,900,560);g.addColorStop(0,'#b03a2a');g.addColorStop(1,'#2a5db0');x.fillStyle=g;x.fillRect(0,0,900,560);x.fillStyle='#f3d9bf';x.beginPath();x.arc(450,230,120,0,7);x.fill();return c.toDataURL('image/jpeg',.9)});await c.close();return Buffer.from(d.split(',')[1],'base64')})();
 const open=async mode=>{
  const ctx=await b.newContext({viewport:{width:412,height:860},acceptDownloads:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  if(mode==='native')await p.addInitScript(()=>{window.__share=[];window.Capacitor={isNativePlatform:()=>true,Plugins:{CyNative:{info:async()=>({versionCode:99,versionName:'1.84'}),shareFile:async o=>{window.__share.push({name:o.name,mime:o.mime,email:o.email||'',subject:o.subject||'',data:o.data})}}}}});
  await mock(p,{n:6});
  await p.route('https://img.test/**',r=>r.request().method()==='OPTIONS'?r.fulfill({status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*'}}):r.fulfill({status:200,contentType:'image/jpeg',body:jpg,headers:{'access-control-allow-origin':'*'}}));
  await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(400);
  await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const f=S.feeds[0];
   const para=k=>`<p>Paragraph ${k} of the article carries enough ordinary words to look like real reporting from a well known publication, with a second clause that keeps going.</p>`;
   const html=`<p>FOR SUBSCRIBERS</p><p>Photo: Fadfebrian/Getty Images</p><p>The opening line of the story is the lede and it must come first after the headline, long enough to be a proper paragraph of reporting.</p>${para(1)}<figure><img src="https://img.test/a1.jpg" width="800" height="500"><figcaption>A caption that explains the first picture.</figcaption></figure>${para(2)}<h2>A section heading</h2>${para(3)}<p>Related stories</p><p>Sign in to continue reading</p>${para(4)}<p>Advertisement</p>${para(5)}`;
   const mk=(i,t,img)=>({feedId:f.id,title:t,link:'https://w.test/'+i,date:Date.now()-i*36e5,summary:'A summary.',img:img||'',html,author:'Jane Reporter'});
   S.saved=[mk(1,'FOR SUBSCRIBERS Attack on Saudi airport dials up pressure on D.C.','https://img.test/lead1.jpg'),mk(2,'Second story about the harbour plan','https://img.test/lead2.jpg'),mk(3,'Third story: why the council changed its mind','')];
   S.feeds.slice(0,1).forEach(f2=>{items[f2.id]=S.saved.slice()});S.kindle='';S.kmode='bw';save()});
  return {ctx,p,errs}};
 /* 1. the Daily has no edition export any more */
 {const {ctx,p,errs}=await open('web');
  const r=await p.evaluate(async()=>{S.sel='today';render();await new Promise(r=>setTimeout(r,1500));return [...document.querySelectorAll('#grid button')].map(b=>b.textContent.trim())});
  ck('the Daily has no Export PDF or Send to Kindle button',!r.some(t=>/export pdf|send to (my )?kindle|change kindle/i.test(t)),r.join(' | '));
  /* 2. the reader menu */
  const m=await p.evaluate(async()=>{S.sel='saved';render();await new Promise(r=>setTimeout(r,500));openReader(S.saved[0]);await new Promise(r=>setTimeout(r,1500));document.querySelector('#mo').click();await new Promise(r=>setTimeout(r,300));return [...document.querySelectorAll('#mn button')].filter(b=>b.offsetParent).map(b=>b.textContent.trim())});
  ck('the reader menu has PDF and Kindle under Send to',m.includes('PDF')&&m.includes('Kindle'),m.join(' | '));
  /* 3. one tap on Save as PDF starts it, says so at once, ignores a second tap, and delivers a PDF without the labels */
  await slow(p);const dl=p.waitForEvent('download',{timeout:60000}).catch(()=>null);
  await p.evaluate(()=>document.querySelector('#mn [data-act="pdf"]').click());
  await p.waitForTimeout(300);
  const n1=await hist(p);
  ck('one tap shows "Making your PDF…" straight away',/making your pdf/i.test(n1[0]||''),JSON.stringify(n1));
  const dis=await p.evaluate(()=>EXBUSY===1&&[...document.querySelectorAll('[data-exact]')].every(b=>b.disabled));
  ck('while it works the export buttons are switched off, so a second tap cannot start another',dis);
  const d=await dl;ck('the PDF downloads after that single tap',!!d);
  if(d){const buf=fs.readFileSync(await d.path());ck('it is a real PDF',buf.slice(0,5).toString()==='%PDF-');
   const t=pdfText(buf);
   ck('the PDF text is readable',t&&/opening line of the story/.test(t)&&/Second|Paragraph 2/.test(t),(t||'').slice(0,100));
   ck('no "FOR SUBSCRIBERS", photo credit, related, sign-in or ad line in the PDF',t&&!/for subscribers|getty|related stories|sign in to continue|advertisement/i.test(t),(t||'').split('\n').filter(l=>/subscribers|getty|related|sign in|advertisement/i.test(l)).join(' | '));
   ck('the headline has no paywall label in front',t&&/Attack on Saudi airport/.test(t)&&!/FOR SUBSCRIBERS/.test(t));
   ck('the article opens with the lede, not the photo credit',t&&t.indexOf('opening line of the story')>=0&&(t.indexOf('Fadfebrian')<0))}
  const after=await p.evaluate(()=>({busy:EXBUSY,dis:[...document.querySelectorAll('[data-exact]')].some(b=>b.disabled)}));
  ck('the buttons are back when it is done',!after.busy&&!after.dis,JSON.stringify(after));
  ck('no page errors',!errs.length,errs[0]);await ctx.close()}
 /* 4. Send to Kindle: asks for the address once (so the tap visibly does something), then makes an EPUB and hands it to the share sheet */
 for(const mode of ['bw','color']){
  const {ctx,p,errs}=await open('native');
  await p.evaluate(m=>{S.kmode=m;save();openReader(S.saved[0])},mode);await p.waitForTimeout(1500);
  await p.evaluate(()=>document.querySelector('#mo').click());await p.waitForTimeout(200);
  await p.evaluate(()=>document.querySelector('#mn [data-act="kindle"]').click());await p.waitForTimeout(600);
  const dlg=await p.evaluate(()=>{const d=document.querySelector('dialog[open]');return d?d.textContent.slice(0,200):''});
  ck(`[${mode}] Send to Kindle answers the tap: it asks for the Kindle address`,/kindle/i.test(dlg)&&/@kindle\.com/i.test(dlg),dlg);
  await p.evaluate(()=>{const d=document.querySelector('dialog[open]');const i=d.querySelector('input');i.value='me@kindle.com';i.dispatchEvent(new Event('input',{bubbles:true}));const bt=[...d.querySelectorAll('button')].find(x=>/save|ok|use|send|continue/i.test(x.textContent)&&!/cancel/i.test(x.textContent));bt&&bt.click()});
  const end=Date.now()+60000;let sh=[];while(Date.now()<end){sh=await p.evaluate(()=>window.__share);if(sh.length)break;await p.waitForTimeout(300)}
  ck(`[${mode}] the share sheet gets an EPUB, addressed to the Kindle`,sh.length===1&&/\.epub$/.test(sh[0].name)&&sh[0].mime==='application/epub+zip'&&sh[0].email==='me@kindle.com',JSON.stringify(sh.map(s=>({n:s.name,m:s.mime,e:s.email}))));
  if(sh.length){const buf=Buffer.from(sh[0].data,'base64'),inf=epubInfo(buf);
   ck(`[${mode}] the EPUB is well formed (mimetype first and stored, every file listed exists, XML parses)`,inf&&!inf.err&&inf.first==='mimetype'&&inf.firstStored&&inf.mime==='application/epub+zip'&&!inf.xmlErrors.length&&inf.spineOk&&inf.manifestOk,JSON.stringify(inf).slice(0,300));
   ck(`[${mode}] the EPUB text has the story and none of the labels`,inf&&/opening line of the story/.test(inf.text)&&!/for subscribers|getty|related stories|sign in to continue|advertisement/i.test(inf.text),(inf.text||'').slice(0,200));
   ck(`[${mode}] the story's own picture is kept`,inf&&inf.imgs.length>=2,JSON.stringify(inf.imgs));
   if(inf.spread){const px=Object.entries(inf.spread);if(mode==='bw')ck('[bw] every picture, and the cover, is grey (no color)',px.every(([,v])=>v<=2),JSON.stringify(inf.spread));else ck('[color] pictures keep their color',px.some(([k,v])=>!/cover/.test(k)&&v>20),JSON.stringify(inf.spread))}
   ck(`[${mode}] type is sized by the reader, not fixed small`,inf&&!/font-size:\s*\d+(\.\d+)?px/.test(inf.css)&&/font-size:1em/.test(inf.css));
   if(process.env.EPUBCHECK){try{const o=execFileSync('java',['-jar',process.env.EPUBCHECK,path.join(TMP,fs.readdirSync(TMP).filter(f=>f.endsWith('.epub')).pop())],{encoding:'utf8'});ck(`[${mode}] epubcheck: no errors`,/0 fatals \/ 0 errors/.test(o),o.slice(-300))}catch(e){const m=String(e.stdout||e.message);ck(`[${mode}] epubcheck: no errors`,/0 fatals \/ 0 errors/.test(m),m.slice(-300))}}}
  const nt=await note(p);ck(`[${mode}] a note says the book is ready`,/kindle book is ready/i.test(nt.msg),nt.msg);
  ck(`[${mode}] no page errors`,!errs.length,errs[0]);await ctx.close()}
 /* 5. Saved: pick stories, make a PDF from just those */
 {const {ctx,p,errs}=await open('web');
  await p.evaluate(async()=>{S.sel='saved';render();await new Promise(r=>setTimeout(r,800))});
  await p.click('[data-ssel]');await p.waitForTimeout(500);
  const st=await p.evaluate(()=>({bar:!!document.getElementById('svbar'),cks:document.querySelectorAll('#grid .svck').length,txt:(document.getElementById('svbar')||{}).textContent||''}));
  ck('Pick stories shows a check on every card and an action bar',st.bar&&st.cks===3&&/0 picked/.test(st.txt),JSON.stringify(st));
  const dis0=await p.evaluate(()=>[...document.querySelectorAll('#svbar [data-svact="pdf"],#svbar [data-svact="kindle"]')].every(b=>b.disabled));
  ck('with nothing picked, Save as PDF and Kindle are off',dis0);
  const boxes=await p.evaluate(()=>[...document.querySelectorAll('#grid .svck')].map(b=>{const r=b.getBoundingClientRect();return [b.getAttribute('role'),b.getAttribute('aria-checked'),/Pick:/.test(b.getAttribute('aria-label')),r.width>=44&&r.height>=44]}));
  ck('each check is a labelled checkbox with a 44 point target',boxes.every(x=>x[0]==='checkbox'&&x[1]==='false'&&x[2]&&x[3]),JSON.stringify(boxes));
  await p.click('#grid .card[data-href="https://w.test/1"]');await p.click('#grid .svck[data-svpick="https://w.test/3"]');await p.waitForTimeout(300);
  const s2=await p.evaluate(()=>({txt:document.getElementById('svbar').textContent,sel:[...SVSEL],open:document.getElementById('rd').classList.contains('on')}));
  ck('tapping a card picks it (it does not open it); two picked',/2 picked/.test(s2.txt)&&s2.sel.length===2&&!s2.open,JSON.stringify(s2));
  await slow(p);const dl=p.waitForEvent('download',{timeout:90000}).catch(()=>null);
  await p.click('[data-svact="pdf"]');await p.waitForTimeout(300);
  const n=await hist(p);ck('Save as PDF says it is working',/typesetting 2 stories/i.test(n[0]||''),JSON.stringify(n));
  const d=await dl;ck('a PDF of the picks downloads',!!d);
  if(d){const buf=fs.readFileSync(await d.path()),t=pdfText(buf);
   ck('the mini-edition has the picked stories and not the third',t&&/Attack on Saudi airport/.test(t)&&/Why the council|council changed/.test(t)&&!/Second story about the harbour/.test(t),(t||'').slice(0,160));
   ck('it has a cover made from the picks',t&&/YOUR SELECTION/i.test(t)&&/2 stories/.test(t));
   ck('no paywall label in the mini-edition',t&&!/for subscribers/i.test(t))}
  await p.click('[data-svact="all"]');await p.waitForTimeout(200);
  const all=await p.evaluate(()=>SVSEL.size);ck('Pick all picks everything',all===3,all);
  await p.click('[data-svact="done"]');await p.waitForTimeout(500);
  const gone=await p.evaluate(()=>({bar:!!document.getElementById('svbar'),cks:document.querySelectorAll('#grid .svck').length}));
  ck('Done leaves picking mode',!gone.bar&&gone.cks===0,JSON.stringify(gone));
  ck('no page errors',!errs.length,errs[0]);await ctx.close()}
 /* 6. settings */
 {const {ctx,p,errs}=await open('web');
  const s=await p.evaluate(async()=>{set.showModal();syncSet();await new Promise(r=>setTimeout(r,300));const m=document.getElementById('kmode'),k=document.getElementById('kset');return {mode:m&&m.value,opts:m?[...m.options].map(o=>o.textContent):[],btn:!!k}});
  ck('Settings has the Kindle book style (black and white / color) and the address',s.mode==='bw'&&s.opts.length===2&&s.btn,JSON.stringify(s));
  ck('no page errors',!errs.length,errs[0]);await ctx.close()}
 /* 7. a story whose text was never stored is fetched before it is typeset */
 {const {ctx,p,errs}=await open('web');
  const r=await p.evaluate(async()=>{const f=S.feeds[0],a={feedId:f.id,title:'Never opened story',link:'https://w.test/never',date:Date.now(),summary:'Only a summary.',img:''};let asked=0;
   const para=k=>'This is paragraph '+k+' of a story that was never opened, with enough ordinary words in it to look like real reporting from a publication, and a second clause that keeps going for a while.';
   const old=getFull;getFull=async()=>{asked++;const d=document.createElement('div');d.innerHTML=[1,2,3,4,5,6].map(k=>'<p>'+para(k)+'</p>').join('');return d};
   const st=await exStory(a);getFull=old;return {asked,blocks:st.blocks.length,first:(st.blocks[0]||{}).s||''}});
  ck('a story with no stored text is fetched first, then typeset with its full text',r.asked===1&&r.blocks>=5&&/paragraph 1/.test(r.first),JSON.stringify(r));
  ck('no page errors',!errs.length,errs[0]);await ctx.close()}
 await b.close();console.log(bad?'export_story '+bad+' FAILED':'export_story all passed');process.exit(bad?1:0)})();
