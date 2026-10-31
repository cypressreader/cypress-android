/* Add a feed dialog (B23, B45, B53, B35): the Back button is easy to see and tap; a pasted address says which folder it will go to (and the choice can be changed); a feed found on a site goes to the CHOSEN folder (not a made-up "Other"); the keyboard does not open by itself; after adding, the button says Done. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{console.log((ok?'ok ':'FAIL ')+n+(ok?'':' '+(x||'')));if(!ok)bad++};
const rss=t=>`<?xml version="1.0"?><rss version="2.0"><channel><title>${t}</title>${[1,2,3].map(i=>`<item><title>${t} story ${i}</title><link>https://x.test/${i}</link><pubDate>Mon, 12 Oct 2026 10:0${i}:00 GMT</pubDate><description>Text ${i}</description></item>`).join('')}</channel></rss>`;
const lum=c=>{const m=c.match(/[\d.]+/g).map(Number);const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};return .2126*f(m[0])+.7152*f(m[1])+.0722*f(m[2])};
const cr=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
(async()=>{
 const b=await chromium.launch();
 for(const [W,H] of [[360,740],[412,860],[1100,800]]){
  const p=await (await b.newContext({viewport:{width:W,height:H}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{n:4});
  await p.route(/^https?:\/\/(?!localhost)/,r=>{let u=r.request().url();try{const o=new URL(u);if(/corsproxy\.io|allorigins|codetabs/.test(o.hostname))u=o.searchParams.get('url')||o.searchParams.get('quest')||u}catch(e){}
   const x=new URL(u);if(x.hostname==='newsite.test'){if(x.pathname==='/')return r.fulfill({status:200,contentType:'text/html',body:'<html><head><link rel="alternate" type="application/rss+xml" href="/rss.xml"></head><body>hi</body></html>',headers:{'access-control-allow-origin':'*'}});if(x.pathname==='/rss.xml')return r.fulfill({status:200,contentType:'text/xml',body:rss('New Site'),headers:{'access-control-allow-origin':'*'}});return r.fulfill({status:404,body:'',headers:{'access-control-allow-origin':'*'}})}
   const m=u.match(/https?:\/\/(\w+)\.test\/(feed|story-\d+)/);if(m&&m[2]==='feed')return r.fulfill({status:200,contentType:'text/xml',body:rss(m[1]),headers:{'access-control-allow-origin':'*'}});return r.abort()});
  await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(400);
  const t=`[${W}] `;
  await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());S.fcheck=false;document.getElementById('add').click()});await p.waitForTimeout(600);
  const f0=await p.evaluate(()=>{const a=document.activeElement;return a&&(a.id||a.tagName)});
  ck(t+'opening the dialog does not put the cursor in the search box (no keyboard in the way)',f0!=='u',f0);
  /* Back */
  await p.evaluate(()=>{cat=-8;pop()});await p.waitForTimeout(300);
  const bk=await p.evaluate(()=>{const b=document.querySelector('#pop .aback');if(!b)return null;const r=b.getBoundingClientRect(),cs=getComputedStyle(b),h=document.querySelector('#pop .ahd').getBoundingClientRect(),bg=getComputedStyle(document.getElementById('dlg')).backgroundColor;return {w:r.width,h:r.height,col:cs.color,bg:cs.backgroundColor,dlg:bg,label:b.getAttribute('aria-label'),top:r.top,headTop:h.top,vis:r.width>0}});
  ck(t+'Back is a real button with a name, at the top of the list, at least 44 points tall and wide',bk&&bk.vis&&bk.h>=44&&bk.w>=64&&bk.top<bk.headTop&&/back/i.test(bk.label||''),JSON.stringify(bk));
  ck(t+'Back text is easy to read (contrast 4.5 or more against its own background)',bk&&cr(bk.col,bk.bg)>=4.5,bk&&cr(bk.col,bk.bg).toFixed(2));
  await p.click('#pop .aback');await p.waitForTimeout(300);
  const st=await p.evaluate(()=>({rows:document.querySelectorAll('#pop .agl .arow').length,back:!!document.querySelector('#pop .aback')}));
  ck(t+'Back returns to the start (For you, Starter packs, Near you, Browse topics)',st.rows>=3&&!st.back,JSON.stringify(st));
  /* a pasted address: where will it go? */
  const d1=await p.evaluate(async()=>{const u=document.getElementById('u');u.value='https://newsite.test/';u.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(r=>setTimeout(r,2500));return {hint:document.getElementById('fodest').textContent,pop:document.getElementById('pop').textContent,fo:document.getElementById('fo').value}});
  ck(t+'the folder line says where a pasted address will go',/added to “Unfiled”/.test(d1.hint),d1.hint);
  ck(t+'the feed found on the site is offered, and says it will be added to that folder',/Latest:|A feed was found/.test(d1.pop)&&/will be added to “Unfiled”/.test(d1.pop),d1.pop.slice(0,200));
  await p.evaluate(()=>{const f=document.getElementById('fo');f.value=S.folders.find(x=>x.name==='World').id;f.dispatchEvent(new Event('change',{bubbles:true}))});await p.waitForTimeout(500);
  const d2=await p.evaluate(()=>({hint:document.getElementById('fodest').textContent,pop:document.getElementById('pop').textContent}));
  ck(t+'changing the folder updates both the line and the found feed',/added to “World”/.test(d2.hint)&&/will be added to “World”/.test(d2.pop),JSON.stringify(d2).slice(0,300));
  await p.evaluate(()=>document.querySelector('#pop [data-addurl],#pop [data-add]').click());await p.waitForTimeout(1200);
  const d3=await p.evaluate(()=>{const f=S.feeds.find(x=>/newsite\.test/.test(x.url)),fo=f&&S.folders.find(o=>o.id===f.folder);return {folder:fo&&fo.name,other:S.folders.some(o=>o.name==='Other'),ok:document.getElementById('ok').textContent,toast:(document.querySelector('#toast')||{}).textContent||''}});
  ck(t+'it lands in the folder that was chosen, and no stray "Other" folder is made',d3.folder==='World'&&!d3.other,JSON.stringify(d3));
  ck(t+'the note names the folder and the main button now says Done',/World/.test(d3.toast)&&d3.ok==='Done',JSON.stringify(d3));
  ck(t+'no page errors',!errs.length,errs[0]);await p.context().close()}
 await b.close();console.log(bad?'add_dialog '+bad+' FAILED':'add_dialog all passed');process.exit(bad?1:0)})();
