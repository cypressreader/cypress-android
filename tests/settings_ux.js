/* Settings and reader UX: the "Aa" appearance popover in the reader bar, the live sample passage on the Reading page, developer tools folded away, and "Reset appearance and reading settings" that keeps feeds, folders, saved stories and highlights. */
const {APP}=require('./env');const {mock,seed,PW}=require('./mock');const {chromium}=require(PW);
let bad=0,n=0;const ck=(nm,ok,x)=>{n++;if(!ok){bad++;console.log('FAIL',nm,x||'')}else console.log('ok',nm)};
const P=k=>'<p>'+('Paragraph '+k+' of the story with enough ordinary words to make a real paragraph for reading. ').repeat(6)+'</p>';
(async()=>{const b=await chromium.launch();
 for(const [W,H,touch] of [[390,800,true],[1100,820,false]]){
  const ctx=await b.newContext({viewport:{width:W,height:H},hasTouch:touch,isMobile:W<700});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{n:3});
  await p.goto('file://'+APP);await p.waitForTimeout(1500);await p.click('text=Get started').catch(()=>{});
  const t=W+': ';
  /* reader: the Aa popover */
  await p.evaluate(async html=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const f=S.feeds[0];const a={feedId:f.id,title:'Aa story',link:'https://w.test/aa',date:Date.now(),summary:'x',img:'',html};items[f.id]=[a,...(items[f.id]||[])];S.sel='all';S.scroll='vertical';S.fs=18;S.lh=1.68;S.sep=false;render();await openReader(a);await new Promise(r=>setTimeout(r,2200))},P(1)+P(2)+P(3)+P(4));
  const q=(sel)=>p.evaluate(s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect(),cs=getComputedStyle(e);return {hidden:e.hidden,w:Math.round(r.width),h:Math.round(r.height),disp:cs.display,exp:e.getAttribute('aria-expanded'),role:e.getAttribute('role'),txt:e.textContent.trim().slice(0,40)}},sel);
  const aa=await q('#raa');ck(t+'the reader bar has an Aa button with an accessible name',aa&&aa.w>0,JSON.stringify(aa));
  const nm=await p.evaluate(()=>{const e=document.getElementById('raa');return e.getAttribute('aria-label')});ck(t+'it is named "Text and appearance"',nm==='Text and appearance',nm);
  await p.click('#raa');await p.waitForTimeout(300);
  let pop=await q('#aapop');ck(t+'tapping Aa opens the popover (a dialog, on screen)',pop&&!pop.hidden&&pop.w>200&&pop.role==='dialog',JSON.stringify(pop));
  ck(t+'Aa reports that it is expanded',(await q('#raa')).exp==='true');
  const fs0=await p.evaluate(()=>S.fs);await p.click('#aapop [data-fs="1"]');await p.waitForTimeout(400);
  const r1=await p.evaluate(()=>({fs:S.fs,ro:document.getElementById('aafsv').textContent,css:document.getElementById('rd').style.getPropertyValue('--fs'),open:document.getElementById('rd').classList.contains('on'),pop:!document.getElementById('aapop').hidden}));
  ck(t+'A+ makes the text bigger, shows the size, reflows the story and keeps the reader and popover open',r1.fs===fs0+1&&r1.ro===(fs0+1)+'px'&&parseFloat(r1.css)>=fs0+1&&r1.open&&r1.pop,JSON.stringify(r1));
  await p.click('#aapop [data-fs="-1"]');await p.click('#aapop [data-fs="-1"]');await p.waitForTimeout(300);
  ck(t+'A− makes it smaller',(await p.evaluate(()=>S.fs))===fs0-1);
  await p.click('#aapop [data-lh="1.9"]');await p.waitForTimeout(300);
  const lh=await p.evaluate(()=>({lh:S.lh,css:document.getElementById('rd').style.getPropertyValue('--lh'),on:document.querySelector('#aapop [data-lh="1.9"]').getAttribute('aria-pressed')}));
  ck(t+'Roomy sets the line spacing live and marks itself pressed',lh.lh===1.9&&lh.on==='true'&&parseFloat(lh.css)>=1.5,JSON.stringify(lh));
  await p.click('#aapop [data-tg="sep"]');await p.waitForTimeout(300);
  ck(t+'the sepia switch turns the sepia page on',(await p.evaluate(()=>({s:S.sep,p:document.querySelector('#aapop [data-tg="sep"]').getAttribute('aria-pressed')}))).s===true);
  await p.click('#aapop [data-sc="pages"]');await p.waitForTimeout(500);
  ck(t+'a reading style pill changes the reading style',(await p.evaluate(()=>S.scroll))==='pages'&&(await p.evaluate(()=>document.getElementById('rd').classList.contains('on'))));
  await p.click('#aapop [data-sc="vertical"]');await p.waitForTimeout(400);
  await p.keyboard.press('Escape');await p.waitForTimeout(200);
  const esc=await p.evaluate(()=>({hid:document.getElementById('aapop').hidden,foc:document.activeElement&&document.activeElement.id,rd:document.getElementById('rd').classList.contains('on')}));
  ck(t+'Escape closes the popover, returns focus to Aa and leaves the story open',esc.hid&&esc.foc==='raa'&&esc.rd,JSON.stringify(esc));
  await p.click('#raa');await p.waitForTimeout(200);await p.evaluate(()=>{const e=document.querySelector('.cols .tt')||document.querySelector('.cols .body p');e.dispatchEvent(new MouseEvent('click',{bubbles:true}))});await p.waitForTimeout(250);await p.evaluate(()=>{document.getElementById('rd').classList.remove('hbar','nobar','chromeoff')});
  ck(t+'tapping the story closes the popover',await p.evaluate(()=>document.getElementById('aapop').hidden));
  await p.click('#raa');await p.waitForTimeout(200);await p.click('#aamore');await p.waitForTimeout(700);
  const mo=await p.evaluate(()=>({set:document.getElementById('set').open,pg:SETP,title:document.getElementById('settitle').textContent}));
  ck(t+'"More reading settings…" opens Settings on the Reading page',mo.set&&mo.pg==='read',JSON.stringify(mo));
  /* settings: the live sample passage */
  const pv=await p.evaluate(async()=>{const el=document.getElementById('rprev');const inPage=!!el&&!!el.closest('#sp-read');const cs=()=>{const x=el.querySelector('.rprev-p');const c=getComputedStyle(x);return {fs:c.fontSize,lh:c.lineHeight,ff:c.fontFamily.slice(0,30),ta:c.textAlign}};
   const a=cs();S.fs=22;S.lh=1.9;S.font='garamond';save();applyFs(true);syncSet();const b2=cs();S.just=false;syncReadPrev();const c2=cs();return {inPage,a,b2,c2}});
  ck(t+'the sample passage sits on the Reading page',pv.inPage);
  ck(t+'the sample follows size, spacing and font ('+pv.b2.fs+', '+pv.b2.ff+')',pv.b2.fs==='22px'&&parseFloat(pv.b2.lh)>pv.b2.fs.replace('px','')*1.85&&/Garamond/i.test(pv.b2.ff),JSON.stringify(pv));
  ck(t+'the sample follows alignment',pv.c2.ta==='left'&&pv.a.ta==='justify',JSON.stringify([pv.a.ta,pv.c2.ta]));
  /* diagnostics folded away */
  await p.evaluate(()=>{setShow('about')});await p.waitForTimeout(300);
  const dv=await p.evaluate(()=>{const d=document.querySelector('#sp-about details.sdev');const ids=['diagb','schkb','perfb','catchk'].map(i=>{const e=document.getElementById(i);return !!e&&!!e.closest('details.sdev')});return {has:!!d,open:d&&d.open,sum:d&&d.querySelector('summary').textContent.trim(),ids,sup:(()=>{const e=document.getElementById('diagb');return e&&e.getBoundingClientRect().width>0})()}});
  ck(t+'the four developer rows live in their own "Developer and diagnostics" group',dv.has&&/Developer/.test(dv.sum)&&dv.ids.every(Boolean),JSON.stringify(dv));
  /* reset appearance keeps the library */
  await p.evaluate(()=>{S.theme='forest';S.cvs='gallery';S.font='garamond';S.fs=24;S.hl=S.hl||[];S.saved=['https://w.test/keep'];save()});
  const before=await p.evaluate(()=>({feeds:S.feeds.length,saved:S.saved.length}));
  await p.evaluate(()=>{document.querySelector('#sp-about details.smore').open=true;const d=document.querySelector('#sp-about details.sdev');});
  await p.click('#resetlookb');await p.waitForTimeout(300);
  const dlg=await p.evaluate(()=>{const d=document.getElementById('ask');return d&&d.open?d.querySelector('h3').textContent:null});
  ck(t+'Reset asks first',/Reset appearance/.test(dlg||''),dlg);
  await p.evaluate(()=>{const d=document.getElementById('ask');d.querySelector('[data-a="0"]').click()});await p.waitForTimeout(300);
  ck(t+'cancelling changes nothing',(await p.evaluate(()=>S.theme))==='forest');
  await p.click('#resetlookb');await p.waitForTimeout(300);await p.evaluate(()=>document.getElementById('ask').querySelector('[data-a="1"]').click());await p.waitForTimeout(800);
  const af=await p.evaluate(()=>({theme:S.theme,cvs:S.cvs,font:S.font,fs:S.fs,feeds:S.feeds.length,saved:S.saved.length}));
  ck(t+'Reset puts theme, cover, font and size back to defaults',af.theme===undefined&&af.cvs===undefined&&af.font===undefined&&af.fs===18,JSON.stringify(af));
  ck(t+'Reset keeps feeds and saved stories',af.feeds===before.feeds&&af.saved===before.saved,JSON.stringify([af,before]));
  ck(t+'no page errors',!errs.length,errs[0]);await ctx.close()}
 await b.close();console.log(bad?'FAILED '+bad+' of '+n:'settings_ux all '+n+' passed');process.exit(bad?1:0)})();
