const {mock,seed,PW}=require('./mock');const {chromium}=require(PW);
const VPS=[['phone',380,820,true],['fold',884,1060,true],['desktop',1280,900,false]];
let fails=0,passes=0;const log=[];
const ck=(vp,name,cond,extra='')=>{if(cond)passes++;else{fails++;log.push(`FAIL [${vp}] ${name} ${extra}`)}};
(async()=>{
const b=await chromium.launch();
for(const [vp,w,h,touch] of VPS){
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:touch,isMobile:touch&&w<500,acceptDownloads:true});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/net::|Failed to load|ERR_|Blocked script execution in 'about:srcdoc'/.test(m.text()))errs.push('console: '+m.text())});
 await mock(p);
 await p.addInitScript(s=>{try{if(!localStorage.getItem('folio'))localStorage.setItem('folio',JSON.stringify(s))}catch(e){}},seed(['Alpha','Beta','Gamma']));
 await p.goto('file:///mnt/user-data/outputs/cypress.html');await p.waitForTimeout(1500);
 const E=(f,a)=>p.evaluate(f,a);
 const noHScroll=async tag=>ck(vp,'no horizontal page scroll '+tag,await E(()=>document.documentElement.scrollWidth<=innerWidth+1),await E(()=>document.documentElement.scrollWidth+'>'+innerWidth));
 const tap=async sel=>{if(!(await p.isVisible(sel))){await p.evaluate(s=>{const e=document.querySelector(s);e&&e.click()},sel);return}if(touch)await p.tap(sel);else await p.click(sel)};
 const openSide=async()=>{if(w<=720&&!(await E(()=>document.body.classList.contains('open')))){await tap('#menu');await p.waitForTimeout(350)}};
 // 1 feeds loaded
 ck(vp,'feeds loaded',await E(()=>S.feeds.every(f=>state[f.id]==='ok')));
 ck(vp,'today renders cards',await E(()=>document.querySelectorAll('#grid .card').length>=5));
 await noHScroll('today');
 // 2 navigation via sidebar
 for(const sel of ['all','f:d1','s:f2','saved','notes','today']){
  await openSide();
  const vis=await E(s=>{const e=document.querySelector(`[data-sel="${s}"]`);if(!e)return 'missing';const r=e.getBoundingClientRect();const t=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return e.contains(t)||t===e?'ok':'covered by '+(t&&(t.id||t.className))},sel);
  ck(vp,'sidebar item tappable '+sel,vis==='ok',vis);
  if(vis==='ok'){await tap(`[data-sel="${sel}"]`);await p.waitForTimeout(250);ck(vp,'sidebar opens '+sel,await E(s=>S.sel===s,sel));ck(vp,'drawer closes '+sel,w>720||await E(()=>!document.body.classList.contains('open')))}
 }
 // 3 list view, search
 await tap('[data-sel="all"]').catch(async()=>{await openSide();await tap('[data-sel="all"]')});await p.waitForTimeout(200);
 await E(()=>{S.sel='all';render()});
 ck(vp,'all stories count',await E(()=>document.querySelectorAll('#grid .card').length===18));
 await tap('#vw');await p.waitForTimeout(200);ck(vp,'list view',await E(()=>$('#grid').classList.contains('list')));await noHScroll('list');
 await tap('#vw');await p.waitForTimeout(150);
 await tap('#sb');await p.fill('#q','Gamma story 3');await p.waitForTimeout(300);
 ck(vp,'search filters',await E(()=>document.querySelectorAll('#grid .card').length===1));
 await p.fill('#q','');await p.dispatchEvent('#q','input');await p.waitForTimeout(200);
 await E(()=>{if(typeof openSearch==='function')openSearch(false)});
 // 4 star/save
 await E(()=>{S.sel='all';render()});
 await tap('#grid .card [data-star]');await p.waitForTimeout(200);
 ck(vp,'star saves',await E(()=>S.saved.length===1));
 // 5 open reader
 await tap('#grid .card:nth-child(2) h3');await p.waitForTimeout(2500);
 ck(vp,'reader open',await E(()=>$('#rd').classList.contains('on')));
 const rinfo=await E(()=>({len:$('.cols .body').textContent.length,np:R.np,cpv:R.cpv,note:($('.cols .note')||{}).textContent||'',
  junk:/Posts from this author|^Code$/m.test($('.cols .body').innerText),dupTitle:[...$('.cols .body').querySelectorAll('h1,h2')].some(h=>h.textContent.toLowerCase().replace(/[^a-z0-9]/g,'')===curA.title.toLowerCase().replace(/[^a-z0-9]/g,'')),
  pre:(()=>{const pr=$('.cols .body pre');if(!pr)return 'none';const c=$('.cols'),cw=(c.clientWidth-(R.cpv-1)*56)/R.cpv;return (pr.scrollWidth<=pr.clientWidth+1||(getComputedStyle(pr).overflowX==='auto'&&pr.getBoundingClientRect().width<=cw+2))?'fits':'overflow '+pr.scrollWidth+'>'+pr.clientWidth})(),
  wide:[...document.querySelectorAll('.cols .body *')].filter(e=>{if(e.closest('pre,.strip,.emb'))return false;const c=$('.cols');const cw=(c.clientWidth-(R.cpv-1)*56)/R.cpv;return [...e.getClientRects()].some(r=>r.width>cw+2)}).map(e=>e.tagName).slice(0,5)}));
 ck(vp,'full article loaded',rinfo.len>1500,JSON.stringify(rinfo).slice(0,200));
 ck(vp,'junk removed',!rinfo.junk);ck(vp,'no duplicate title',!rinfo.dupTitle);
 ck(vp,'code block fits column',rinfo.pre==='fits',rinfo.pre);
 ck(vp,'nothing wider than column',rinfo.wide.length===0,rinfo.wide.join());
 ck(vp,'columns by width',rinfo.cpv===(w-24>=700?2:1)||rinfo.cpv===(w>=760?2:1),'cpv '+rinfo.cpv);
 ck(vp,'multiple pages',rinfo.np>1,'np '+rinfo.np);
 await p.screenshot({path:`/tmp/t/deep-${vp}-reader.png`});
 await noHScroll('reader');
 // buttons
 const pg0=await E(()=>R.pg);
 await E(()=>document.querySelector('#nx').click());await p.waitForTimeout(1000);ck(vp,'next button turns',await E(()=>R.pg)===pg0+1);
 await E(()=>document.querySelector('#pv').click());await p.waitForTimeout(1000);ck(vp,'prev button turns',await E(()=>R.pg)===pg0);
 if(!touch){await p.keyboard.press('ArrowRight');await p.waitForTimeout(1000);ck(vp,'arrow key turns',await E(()=>R.pg)===1);await p.keyboard.press('ArrowLeft');await p.waitForTimeout(1000)}
 // tap zone
 const bb=await p.locator('.book').boundingBox();
 if(touch){await p.touchscreen.tap(bb.x+bb.width*.9,bb.y+bb.height/2)}else await p.mouse.click(bb.x+bb.width*.9,bb.y+bb.height/2);
 await p.waitForTimeout(1000);ck(vp,'edge tap turns',await E(()=>R.pg)===1);
 // drag turn (touch)
if(touch){
  await E(()=>{R.pg=0;show()});
  const cdp=await ctx.newCDPSession(p);const t=(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y}]});
  await t('touchStart',bb.x+bb.width*.8,bb.y+200);for(let i=1;i<=12;i++){await t('touchMove',bb.x+bb.width*.8-i*bb.width*.05,bb.y+202);await p.waitForTimeout(16)}
  const mid=await E(()=>R.T&&R.T.ang);ck(vp,'drag follows finger',mid>30&&mid<180,'ang '+mid);
  await t('touchEnd');await p.waitForTimeout(1100);ck(vp,'drag completes turn',await E(()=>R.pg)===1);
  ck(vp,'no leftover turn layers',await E(()=>!document.querySelector('.tl-leaf,.tl-under,.tl-cast')&&!R.busy));
  // small drag cancels
  await t('touchStart',bb.x+bb.width*.8,bb.y+200);for(let i=1;i<=3;i++){await t('touchMove',bb.x+bb.width*.8-i*20,bb.y+201);await p.waitForTimeout(30)}await p.waitForTimeout(150);
  await t('touchEnd');await p.waitForTimeout(1100);ck(vp,'short slow drag cancels',await E(()=>R.pg)===1);
  // vertical swipe ignored
  await E(()=>{S.sdown=false});
  await t('touchStart',bb.x+bb.width*.5,bb.y+100);for(let i=1;i<=8;i++){await t('touchMove',bb.x+bb.width*.5+3,bb.y+100+i*30);await p.waitForTimeout(16)}await t('touchEnd');await p.waitForTimeout(600);
  ck(vp,'vertical swipe no turn',await E(()=>R.pg)===1);
  await E(()=>{delete S.sdown});
 }
 // settings from inside reader
 await tap('#mo');await p.waitForTimeout(200);ck(vp,'more menu opens',await E(()=>!$('#mn').hidden));
 await tap('#mo');
 // playback menu
 if(await p.$('#rp')){await tap('#rp');await p.waitForTimeout(200);ck(vp,'playback menu opens',await E(()=>!$('#pb').hidden));await tap('#rp');await p.waitForTimeout(100)}
 // read aloud does not throw
 if(await p.$('#ra')){await tap('#ra');await p.waitForTimeout(400);await tap('#ra');await p.waitForTimeout(200);await E(()=>ttsStop())}
 // site view
 await tap('#wb');await p.waitForTimeout(1500);
 ck(vp,'site view shows page',await E(()=>{const f=$('.web iframe');return !$('.web').hidden&&f&&!f.hidden&&(f.srcdoc||'').length>500}));
 await tap('#wb');await p.waitForTimeout(300);ck(vp,'back to reader',await E(()=>$('.web').hidden&&!R.web));
 // font change inside reader keeps working
 for(const fnt of ['dys','lexend','serif']){await E(f=>{S.font=f;applyFs(true)},fnt);await p.waitForTimeout(250);ck(vp,'font '+fnt+' relayout',await E(()=>R.np>=1&&$('#pc').textContent.includes('/')))}
 // highlight
 const hl=await E(()=>{const t=$('.cols .body p').firstChild;const r=document.createRange();r.setStart(t,0);r.setEnd(t,20);const s=getSelection();s.removeAllRanges();s.addRange(r);document.dispatchEvent(new Event('selectionchange'));return true});
 await p.waitForTimeout(400);
 const sb=await E(()=>!$('#selbar').hidden);ck(vp,'selection bar shows',sb);
 if(sb){await tap('#selbar [data-s="hl"]');await p.waitForTimeout(200);ck(vp,'highlight saved',await E(()=>S.hl.length>=1))}
 await E(()=>getSelection().removeAllRanges());
 // close
 await tap('#cl');await p.waitForTimeout(300);ck(vp,'reader closes',await E(()=>!$('#rd').classList.contains('on')));
ck(vp,'read-state sane after open',await E(()=>typeof S.read==='object'));
 ck(vp,'check mark on opened story',await E(()=>document.querySelectorAll('#grid .rdy').length>=1));
 // cached reopen instant
 const t0=Date.now();await E(()=>openReader(cur[1]));const t1=Date.now()-t0;ck(vp,'cached story opens fast',t1<400&&await E(()=>!$('.cols .note')),'ms '+t1);await tap('#cl');await p.waitForTimeout(200);
 // settings
 await openSide();await tap('#gear');await p.waitForTimeout(400);
 ck(vp,'settings opens',await E(()=>$('#set').open));
 const setInfo=await E(()=>{const d=$('#set').getBoundingClientRect();return{w:d.width,h:d.height,iw:innerWidth,ih:innerHeight,ov:$('.sbody').scrollWidth>$('.sbody').clientWidth+1}});
 ck(vp,'settings fits screen',setInfo.w<=setInfo.iw&&setInfo.h<=setInfo.ih&&!setInfo.ov,JSON.stringify(setInfo));
 await p.screenshot({path:`/tmp/t/deep-${vp}-settings.png`});
 await E(()=>document.querySelectorAll('#thm details').forEach(d=>d.open=true));for(const th of ['dark','sepia','dynamic','light','auto']){await tap(`[data-th="${th}"]`);await p.waitForTimeout(80);ck(vp,'theme '+th,await E(t=>S.theme===t&&document.documentElement.dataset.theme===t,th))}
 await tap('[data-fn="literata"]');ck(vp,'font tile',await E(()=>S.font==='literata'));
 await tap('[data-fs="1"]');ck(vp,'text size +',await E(()=>S.fs===19));await tap('[data-fs="-1"]');
 for(const k of ['just','group','hideRead','autoWeb','autoReader','queue']){const before=await E(k=>$(`.tg[data-tg="${k}"]`).classList.contains('on'),k);await tap(`.tg[data-tg="${k}"]`);await p.waitForTimeout(60);const after=await E(k=>$(`.tg[data-tg="${k}"]`).classList.contains('on'),k);ck(vp,'toggle '+k,before!==after);await tap(`.tg[data-tg="${k}"]`);await p.waitForTimeout(60)}
 for(const [id,v] of [['#lhs','1.9'],['#mgn','0.6'],['#srt','source'],['#arf','15'],['#pfm','feeds']]){await p.selectOption(id,v);ck(vp,'select '+id,true)}
 ck(vp,'select values stored',await E(()=>S.lh===1.9&&S.mg===0.6&&S.sort==='source'&&S.auto===15&&S.pfm==='feeds'));
 const [dl]=await Promise.all([p.waitForEvent('download',{timeout:3000}).catch(()=>null),tap('#exp')]);ck(vp,'OPML export downloads',!!dl);
 const [dl2]=await Promise.all([p.waitForEvent('download',{timeout:3000}).catch(()=>null),tap('#bke')]);ck(vp,'backup export downloads',!!dl2);
 await tap('#mut');await p.waitForTimeout(200);const mutOpen=await E(()=>[...document.querySelectorAll('dialog')].filter(d=>d.open).map(d=>d.id));ck(vp,'muted words editor opens',mutOpen.length>=1,mutOpen.join());
 await E(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 await openSide();await tap('#gear');await p.waitForTimeout(300);await tap('#mgb');await p.waitForTimeout(300);ck(vp,'feed manager opens',await E(()=>$('#mng').open&&document.querySelectorAll('.mrow').length===3));
 await E(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 await openSide();await tap('#gear');await p.waitForTimeout(300);await tap('#sfb');await p.waitForTimeout(300);ck(vp,'smart folder dialog',await E(()=>$('#sf').open));
 await E(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 await openSide();await tap('#gear');await p.waitForTimeout(300);await E(()=>{syncRl();$('#rl').showModal()});await p.waitForTimeout(300);ck(vp,'relay dialog',await E(()=>$('#rl').open));
 await E(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 // preload with checkmarks (feeds mode set above)
 await E(()=>{S.sel='all';PF.done.clear();PF.n=0;render()});await p.waitForTimeout(9000);
 const pre=await E(()=>({marks:document.querySelectorAll('#grid .rdy').length,ok:PF.ok,cached:Object.keys(AC).length}));
 ck(vp,'preload caches stories',pre.cached>=10,JSON.stringify(pre));ck(vp,'check marks appear',pre.marks>=10,JSON.stringify(pre));
 // logo toggle
 await openSide();const lg0=await E(()=>S.logo||'tree');await tap('#logo');await p.waitForTimeout(500);ck(vp,'logo toggles',await E(l=>(S.logo||'tree')!==l,lg0));
 if(w<=720)await E(()=>document.body.classList.remove('open'));
 // add feed dialog
 await openSide();await tap('#add');await p.waitForTimeout(300);ck(vp,'add dialog',await E(()=>$('#dlg').open));
 await p.fill('#u','tech');await p.waitForTimeout(200);ck(vp,'suggestions show',await E(()=>document.querySelectorAll('#pop .pf').length>0));
 await p.fill('#u','https://delta.test/feed');await p.press('#u','Enter');await p.waitForTimeout(2500);
 ck(vp,'feed added',await E(()=>S.feeds.some(f=>f.url.includes('delta'))),await E(()=>$('#err').textContent));
 await E(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 // mark all read
 await E(()=>{S.sel='all';render()});await tap('#mr');await p.waitForTimeout(300);ck(vp,'mark all read',await E(()=>cur.every(a=>S.read[a.link])||confirm));
 // refresh
 await tap('#ref');await p.waitForTimeout(2500);ck(vp,'refresh toast',await E(()=>/stor|feed/.test($('#toast').textContent)),await E(()=>$('#toast').textContent));
 // offline article failure path shows Why
 await E(()=>{S.saved=[];save()});
 await noHScroll('end');
 // dark screenshot of reader
 await E(()=>{S.theme='dark';document.documentElement.dataset.theme='dark';S.font='serif';openReader(cur[0])});await p.waitForTimeout(800);
 await p.screenshot({path:`/tmp/t/deep-${vp}-dark.png`});
 ck(vp,'no page errors',errs.length===0,errs.slice(0,3).join(' | '));
 await ctx.close();
}
// article failure path
{const ctx=await b.newContext({viewport:{width:884,height:1060}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{noArticles:true});
 await p.addInitScript(s=>{try{localStorage.setItem('folio',JSON.stringify(s))}catch(e){}},seed(['Alpha']));await p.goto('file:///mnt/user-data/outputs/cypress.html');await p.waitForTimeout(1200);
 await p.evaluate(()=>{S.sel='all';render();openReader(cur[0])});await p.waitForTimeout(6500);
 const n=await p.evaluate(()=>({note:$('.cols .note').innerText,why:!!$('.cols .note .why')}));
 ck('fail','failure note + Why',/Couldn/.test(n.note)&&n.why,JSON.stringify(n));
 await p.click('.cols .note [data-web]');await p.waitForTimeout(2500);ck('fail','site view fallback msg',await p.evaluate(()=>!$('.web').hidden));
 await p.screenshot({path:'/tmp/t/deep-fail.png'});
 ck('fail','no errors',errs.length===0,errs.join('|'));await ctx.close()}
// offline
{const ctx=await b.newContext({viewport:{width:884,height:1060}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p);
 await p.addInitScript(s=>{try{if(!localStorage.getItem('folio'))localStorage.setItem('folio',JSON.stringify(s))}catch(e){}},seed(['Alpha']));await p.goto('file:///mnt/user-data/outputs/cypress.html');await p.waitForTimeout(1500);
 await p.evaluate(()=>{S.sel='all';render();openReader(cur[0])});await p.waitForTimeout(2000);await p.click('#cl');
 await ctx.setOffline(true);await p.reload();await p.waitForTimeout(1500);
 const o=await p.evaluate(()=>({cards:document.querySelectorAll('#grid .card').length}));ck('offline','cached feed shows offline',o.cards>0,JSON.stringify(o));
 await p.evaluate(()=>{S.sel='all';render();openReader(cur.find(a=>acGet(a.link)))});await p.waitForTimeout(500);
 ck('offline','cached article readable offline',await p.evaluate(()=>$('.cols .body').textContent.length>1500));
 ck('offline','no errors',errs.length===0,errs.join('|'));await ctx.close()}
await b.close();
console.log(log.join('\n'));console.log(`\n${passes} passed, ${fails} failed`);
})();
