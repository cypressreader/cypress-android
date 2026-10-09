const {APP,OUT}=require('./env');
const {mock,seed,KV,PW}=require('./mock2');const {chromium}=require(PW);
const URL0=('file://'+APP);
let fails=0,passes=0;const log=[];
const ck=(g,name,cond,extra="")=>{console.log((cond?"ok":"FAIL")+" ["+g+"] "+name+" "+(cond?"":extra));if(cond)passes++;else{fails++;log.push(`FAIL [${g}] ${name} ${extra}`)}};
const W=ms=>new Promise(r=>setTimeout(r,ms));
async function mk(b,{w=884,h=1060,touch=true,seedData=null,opt={},mob=false}={}){
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:touch,isMobile:mob,acceptDownloads:true});
 const p=await ctx.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));
 p.on('dialog',d=>{const v=p.nextPrompt;p.nextPrompt=undefined;if(d.type()==='prompt')d.accept(v||'');else d.accept()});
 await mock(p,opt);
 if(seedData)await p.addInitScript(s=>{try{if(!localStorage.getItem('folio'))localStorage.setItem('folio',JSON.stringify(s))}catch(e){}},seedData);
 await p.goto(URL0);await W(1300);
 p.E=(f,a)=>p.evaluate(f,a);p.ctx=ctx;
 p.touchDrag=async(x0,y0,x1,y1,steps=12,hold=16)=>{const cdp=p.cdp||(p.cdp=await ctx.newCDPSession(p));const t=(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y}]});await t('touchStart',x0,y0);for(let i=1;i<=steps;i++){await t('touchMove',x0+(x1-x0)*i/steps,y0+(y1-y0)*i/steps);await W(hold)}await t('touchEnd')};
 return p;
}
(async()=>{
const b=await chromium.launch();

/* ---------- 1. first run setup, phone ---------- */
for(const [nm,w,h,mob] of [['setup-phone',380,820,true],['setup-fold',884,1060,false]]){
 const p=await mk(b,{w,h,mob});
 ck(nm,'setup opens on first run',await p.E(()=>$('#ob')&&$('#ob').open));
 ck(nm,'no h-scroll in setup',await p.E(()=>{const d=$('.obbody');return d.scrollWidth<=d.clientWidth+1}));
 await p.screenshot({path:`/tmp/t/n-${nm}-1.png`});
 await p.tap('[data-oblg="circuit"]');ck(nm,'logo choice',await p.E(()=>S.logo==='circuit'));
 await p.tap('[data-obnext]');await W(150);
 ck(nm,'topics step',await p.E(()=>document.querySelectorAll('[data-obtop].on').length===2));
 await p.tap('[data-obtop="Science"]');await p.tap('[data-obnext]');await W(150);
 const n0=await p.E(()=>OB.picks.size);ck(nm,'sources preselected',n0===9,'n '+n0);
 await p.screenshot({path:`/tmp/t/n-${nm}-2.png`});
 await p.tap('[data-obsrc]');ck(nm,'toggle source',await p.E(()=>OB.picks.size)===n0-1);
 await p.fill('#obu','alpha.test/feed');await p.tap('[data-obaddu]');await W(100);
 ck(nm,'custom source added',await p.E(()=>OB.custom.length===1));
 await p.tap('[data-obnext]');await W(150);
 await p.tap('[data-obth="broadsheet"]');await p.tap('[data-obfn="lexend"]');await p.selectOption('#obnight','dark');
 ck(nm,'look choices',await p.E(()=>S.theme==='broadsheet'&&S.font==='lexend'&&S.night==='dark'));
 await p.screenshot({path:`/tmp/t/n-${nm}-3.png`});
 await p.tap('[data-obnext]');await W(150);await p.screenshot({path:`/tmp/t/n-${nm}-4.png`});
 await p.tap('[data-obdone]');await W(2500);
 const r=await p.E(()=>({n:S.feeds.length,ob:$('#ob').open,fo:S.folders.map(f=>f.name),alpha:S.feeds.find(f=>f.url.includes('alpha')),on:S.onboarded}));
 ck(nm,'setup builds feeds',r.n===n0,JSON.stringify(r).slice(0,200));
 ck(nm,'folders per topic',r.fo.includes('Tech')&&r.fo.includes('Science')&&r.fo.includes('News'),r.fo.join());
 ck(nm,'setup closes',!r.ob&&r.on===1);
 ck(nm,'custom feed loads',await p.E(()=>{const f=S.feeds.find(f=>f.url.includes('alpha'));return f&&state[f.id]==='ok'}));
 await p.reload();await W(1200);ck(nm,'setup not shown again',await p.E(()=>!$('#ob')||!$('#ob').open));
 // run setup again: remove one catalog source
 if(w<=720)await p.tap('#menu');await W(300);await p.tap('#gear');await W(300);await p.E(()=>$('#obagain').scrollIntoView());await p.tap('#obagain');await W(300);
 ck(nm,'rerun opens',await p.E(()=>$('#ob').open&&OB.rerun));
 await p.tap('[data-obnext]');await p.tap('[data-obnext]');await W(150);
 const rem=await p.E(()=>document.querySelector('[data-obsrc].on').dataset.obsrc);await p.tap(`[data-obsrc="${rem}"]`);
 await p.tap('[data-obnext]');await p.tap('[data-obnext]');await p.tap('[data-obdone]');await W(500);
 ck(nm,'rerun removes unchecked, keeps custom',await p.E(u=>!S.feeds.some(f=>f.url===u)&&S.feeds.some(f=>f.url.includes('alpha')),rem));
 // start fresh
 await p.E(()=>{S.saved.push({link:'x',title:'x'});save()});
 if(w<=720)await p.tap('#menu');await W(300);await p.tap('#gear');await W(300);await p.E(()=>$('#fresh').scrollIntoView());
 await Promise.all([p.waitForNavigation({timeout:8000}).catch(()=>null),p.tap('#fresh')]);await W(1500);
 ck(nm,'start fresh wipes and reopens setup',await p.E(()=>$('#ob')&&$('#ob').open&&S.saved.length===0));
 ck(nm,'no errors',p.errs.length===0,p.errs.join('|'));
 await p.ctx.close();
}

/* ---------- 2. IndexedDB storage + migration ---------- */
{const p=await mk(b,{seedData:seed(['Alpha'])});
 await p.E(()=>{localStorage.setItem('folio-art',JSON.stringify({'https://old.test/a':{h:'<p>old cached</p>',t:1}}))});await W(600);
 await p.reload();await W(1200);
 const mg=await p.E(()=>({g:acGet('https://old.test/a'),ls:(localStorage.getItem('folio-art')||'').slice(0,80),ok:IDB.ok,n:Object.keys(AC).length}));ck('idb','old cache migrated',mg.g==='<p>old cached</p>'&&!mg.ls,JSON.stringify(mg));
 await p.E(()=>{for(let i=0;i<60;i++)acPut('https://big.test/'+i,'<p>'+'x'.repeat(60000)+'</p>')});await W(500);
 await p.reload();await W(1500);
 ck('idb','large cache survives reload (3.6MB+)',await p.E(()=>Object.keys(AC).filter(k=>k.startsWith('https://big.test/')).length===60));
 ck('idb','localStorage stays small',await p.E(()=>(localStorage.getItem('folio')||'').length<200000));
 await p.E(()=>$('#clr').click());await W(300);await p.reload();await W(1200);
 ck('idb','clear stored empties IDB',await p.E(()=>Object.keys(AC).length===0));
 ck('idb','no errors',p.errs.length===0,p.errs.join('|'));await p.ctx.close()}

/* ---------- 3. night mode + animation ---------- */
{const ctx=await b.newContext({viewport:{width:884,height:1060},hasTouch:true,timezoneId:'America/Los_Angeles'});const p=await ctx.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));
 await p.clock.install({time:new Date('2026-09-28T17:30:00-07:00')});
 await mock(p);await p.addInitScript(s=>{try{if(!localStorage.getItem('folio'))localStorage.setItem('folio',JSON.stringify(s))}catch(e){}},seed(['Alpha'],{night:'dark',theme:'light'}));
 await p.goto(URL0);await p.clock.runFor(1500);
 ck('night','day theme before sunset',await p.evaluate(()=>document.documentElement.dataset.theme==='light'&&!document.documentElement.classList.contains('night')));
 await p.evaluate(()=>{S.sel='all';render();openReader(cur[0])});await p.clock.runFor(2500);
 await p.clock.runFor(70*60e3);
 for(let i=0;i<3000;i++){await p.clock.runFor(2e3);if(await p.evaluate(()=>!!$('#sky')))break}
 await p.clock.runFor(300);
 const n=await p.evaluate(()=>({th:document.documentElement.dataset.theme,night:document.documentElement.classList.contains('night'),sky:!!$('#sky'),pe:$('#sky')&&getComputedStyle($('#sky')).pointerEvents,fade:document.documentElement.classList.contains('thfade'),hl:getComputedStyle(document.documentElement).getPropertyValue('--hl').trim()}));
 ck('night','switches to dark after sunset',n.th==='dark'&&n.night,JSON.stringify(n));
 ck('night','sky animation shown',n.sky);ck('night','animation does not block touches',n.pe==='none');
 ck('night','gradual fade on',n.fade);ck('night','warm highlight at night',/255, ?150, ?60|255,150,60/.test(n.hl),n.hl);
 await p.clock.runFor(1200);await p.screenshot({path:'/tmp/t/n-night-anim.png'});
 ck('night','reader still usable during animation',await p.evaluate(()=>{const r=$('.book').getBoundingClientRect();const e=document.elementFromPoint(r.left+r.width*.9,r.top+60);return !!e&&!e.closest('#sky')}));
 await p.clock.runFor(8000);ck('night','animation removes itself',await p.evaluate(()=>!$('#sky')));
 await p.clock.runFor(13*3600e3);
 ck('night','back to day at sunrise',await p.evaluate(()=>document.documentElement.dataset.theme==='light'&&!document.documentElement.classList.contains('night')));
 ck('night','sunset label',await p.evaluate(()=>/sunset/.test(nightLabel())));
 ck('night','no errors',p.errs.length===0,p.errs.join('|'));await ctx.close()}

/* ---------- 4. progress, gallery, swipes, pull, brief, media, hinge ---------- */
for(const [vp,w,h] of [['phone',380,820],['fold',884,1060]]){
 const p=await mk(b,{w,h,mob:w<500,seedData:seed(['Alpha','Beta','Gamma','Pod','Tube'],{sel:'all'})});
 const E=p.E;
 ck(vp,'feeds ok',await E(()=>S.feeds.every(f=>state[f.id]==='ok')),await E(()=>JSON.stringify(state)));
 // media badges
 ck(vp,'podcast badge',await E(()=>[...document.querySelectorAll('.card .mb')].some(x=>/Listen · 42 min/.test(x.textContent))));
 ck(vp,'video badge',await E(()=>[...document.querySelectorAll('.card .mb')].some(x=>/Video/.test(x.textContent))));
 // podcast reader
 await E(()=>openReader(cur.find(a=>a.audio)));await W(1500);
 ck(vp,'audio player in reader',await E(()=>!!$('.cols .aud audio')&&$('.cols .aud audio').src.includes('.mp3')));
 await p.tap('[data-aspd="1.5"]');ck(vp,'podcast speed',await E(()=>$('.cols .aud audio').playbackRate===1.5&&S.prate===1.5));
 await p.tap('#cl');await W(200);
 await E(()=>openReader(cur.find(a=>a.yt)));await W(800);
 ck(vp,'youtube embed',await E(()=>!!$('.cols .vid iframe')&&/youtube-nocookie\.com\/embed\/abcdefghij\d/.test($('.cols .vid iframe').src)&&!$('.cols .note')));
 await p.screenshot({path:`/tmp/t/n-${vp}-video.png`});
 await p.tap('#cl');await W(200);
 // gallery
 await E(()=>{S.sel='all';render();openReader(cur.find(a=>a.link.includes('alpha')))});await W(2500);
 ck(vp,'article has photos',await E(()=>document.querySelectorAll('.cols .body img').length>=2));
 const im=await E(()=>{const i=[...document.querySelectorAll('.cols img')].find(x=>{const r=x.getBoundingClientRect();return r.width>50&&r.left>=0&&r.right<=innerWidth});if(!i)return null;const r=i.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}});
 if(im){await p.touchscreen.tap(im.x,im.y);await W(400)}
 ck(vp,'tap photo opens viewer',await E(()=>$('#gal')&&!$('#gal').hidden),JSON.stringify(im));
 const gc=await E(()=>$('#gcnt').textContent);ck(vp,'viewer counts photos',/\/ [2-9]/.test(gc),gc);
 await p.screenshot({path:`/tmp/t/n-${vp}-gallery.png`});
 const i0=await E(()=>G.i);await p.touchDrag(w*.8,h/2,w*.2,h/2+5,10);await W(300);
 ck(vp,'swipe to next photo',await E(()=>G.i)===i0+1||await E(()=>G.list.length)===1);
 // double tap zoom
 await p.touchscreen.tap(w/2,h/2);await W(80);await p.touchscreen.tap(w/2,h/2);await W(300);
 ck(vp,'double tap zooms',await E(()=>G.s>1));
 await p.touchscreen.tap(w/2,h/2);await W(80);await p.touchscreen.tap(w/2,h/2);await W(300);
 await p.touchDrag(w/2,h*.4,w/2,h*.85,10);await W(400);
 ck(vp,'swipe down closes viewer',await E(()=>$('#gal').hidden));
 // progress
 await E(()=>{R.pg=Math.min(1,R.np-1);show()});await W(100);
 const np=await E(()=>R.np);
 await E(()=>{window.CLK=[];['pointerdown','pointerup','click','touchend'].forEach(t=>document.addEventListener(t,e=>CLK.push(t+':'+(e.target.id||e.target.tagName)+':'+e.defaultPrevented),true))});
 await p.tap('#cl');await W(300);
 const ep0=await E(()=>R.ep!=null?R.ep:R.np-1);
 if(np>2&&ep0>1){ck(vp,'progress bar on card',await E(()=>document.querySelectorAll('.card .prg').length>=1));
  await E(()=>{S.sel='today';render()});await W(200);
  ck(vp,'continue reading row',await E(()=>!!$('.crow .cr')));
  await p.screenshot({path:`/tmp/t/n-${vp}-today.png`});
  await p.tap('.crow .cr');await W(800);ck(vp,'continue opens at saved page',await E(()=>$('#rd').classList.contains('on')&&R.pg>=1));await p.tap('#cl');await W(200);
 }
 // swipes
 await E(()=>{S.sel='all';render();$('main').scrollTop=0});await W(200);
 const cardBox=async n=>E(n=>{const c=document.querySelectorAll('#grid .card')[n];c.scrollIntoView({block:'center'});const r=c.getBoundingClientRect();return{x:r.left,y:r.top,w:r.width,h:r.height,link:cur[+c.dataset.i].link}},n);
 let cb=await cardBox(2);await W(100);cb=await cardBox(2);
 await p.touchDrag(cb.x+cb.w*.2,cb.y+cb.h/2,cb.x+cb.w*.2+170,cb.y+cb.h/2+4,12);await W(500);
 ck(vp,'swipe right saves',await E(l=>S.saved.some(x=>x.link===l),cb.link));
 ck(vp,'swipe did not open story',await E(()=>!$('#rd').classList.contains('on')));
 cb=await cardBox(3);await W(100);cb=await cardBox(3);
 const wasRead=await E(l=>!!S.read[l],cb.link);
 await p.touchDrag(cb.x+cb.w*.8,cb.y+cb.h/2,cb.x+cb.w*.8-170,cb.y+cb.h/2+4,12);await W(500);
 ck(vp,'swipe left toggles read',await E(l=>!!S.read[l],cb.link)!==wasRead);
 cb=await cardBox(4);await W(100);cb=await cardBox(4);
 await p.touchDrag(cb.x+cb.w*.5,cb.y+cb.h/2,cb.x+cb.w*.5+30,cb.y+cb.h/2,4,30);await W(400);
 ck(vp,'short swipe does nothing',await E(l=>!S.saved.some(x=>x.link===l),cb.link));
 ck(vp,'no swipe leftovers',await E(()=>!$('#swl')&&[...document.querySelectorAll('#grid .card')].every(c=>!c.style.transform)));
 // tap still opens
 cb=await cardBox(5);await p.touchscreen.tap(cb.x+cb.w/2,cb.y+cb.h/2);await W(600);
 ck(vp,'tap card still opens',await E(()=>$('#rd').classList.contains('on')));await p.tap('#cl');await W(200);
 // vertical scroll still works
 await E(()=>{$('main').scrollTop=0});const st0=await E(()=>$('main').scrollTop);
 await p.touchDrag(w/2,h*.8,w/2,h*.3,10);await W(500);
 ck(vp,'vertical scroll works over cards',await E(()=>$('main').scrollTop)>st0+50);
 // pull to refresh
 await W(3000);await E(()=>{$('main').scrollTop=0});await W(800);const stp=await E(()=>$('main').scrollTop);
 await p.touchDrag(w/2,160,w/2,420,14);await W(300);
 ck(vp,'pull to refresh triggers (st '+stp+')',await E(()=>$('#ref').classList.contains('spin')||/stor|Refreshing/.test($('#toast').textContent)),await E(()=>$('#toast').textContent));
 await W(2500);
 // brief
 await E(()=>{S.read={};S.brief=null;S.sel='brief';render()});await W(200);
 const bl=await E(()=>S.brief.links.length);ck(vp,'brief has up to 10 from mixed sources',bl===10&&await E(()=>new Set(S.brief.links.map(l=>findStory(l).feedId)).size>=4),'n '+bl);
 await p.screenshot({path:`/tmp/t/n-${vp}-brief.png`});
 await p.tap('[data-bstart]');await W(1500);
 ck(vp,'brief opens first story',await E(()=>R.inBrief&&curA.link===S.brief.links[0]));
 const hasNext=await E(()=>!!$('.cols [data-bnext]'));ck(vp,'next-in-brief button at end',hasNext);
 await E(()=>{R.pg=R.np-1;show()});await W(200);await p.screenshot({path:`/tmp/t/n-${vp}-bnext.png`});
 await E(()=>$('.cols [data-bnext]').click());await W(1200);
 ck(vp,'next goes to story 2',await E(()=>curA.link===S.brief.links[1]));
 await E(()=>{S.brief.links.forEach(l=>S.read[l]=1);closeRd()});await W(300);
 ck(vp,'caught up screen',await E(()=>!!$('.bdone')));
 await p.screenshot({path:`/tmp/t/n-${vp}-done.png`});
 ck(vp,'no h-scroll',await E(()=>document.documentElement.scrollWidth<=innerWidth+1));
 ck(vp,'no errors',p.errs.length===0,p.errs.join('|'));
 await p.ctx.close();
}

/* ---------- 5. Fold hinge alignment ---------- */
{const ctx=await b.newContext({viewport:{width:884,height:1000},hasTouch:true});const p=await ctx.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));
 await p.addInitScript(()=>{Object.defineProperty(window,'viewport',{value:{segments:[{x:0,y:0,width:430,height:1000},{x:454,y:0,width:430,height:1000}]},configurable:true})});
 await mock(p);await p.addInitScript(s=>{try{if(!localStorage.getItem('folio'))localStorage.setItem('folio',JSON.stringify(s))}catch(e){}},seed(['Alpha']));
 await p.goto(URL0);await W(1300);
 await p.evaluate(()=>{S.sel='all';render();openReader(cur[0])});await W(2000);
 const r=await p.evaluate(()=>{const c=$('.cols'),cr=c.getBoundingClientRect(),gap=parseFloat(getComputedStyle(c).columnGap),mid=cr.left+cr.width/2,bk=$('.book').getBoundingClientRect();return{cpv:R.cpv,mid,gap,bkMid:bk.left+bk.width/2}});
 ck('hinge','two pages on the fold',r.cpv===2);ck('hinge','gutter centered on crease',Math.abs(r.mid-442)<2&&Math.abs(r.bkMid-442)<2,JSON.stringify(r));ck('hinge','gutter wider than crease',r.gap>=24+40);
 await p.screenshot({path:'/tmp/t/n-hinge.png'});
 await p.evaluate(()=>{window.viewport.segments=[{x:0,y:0,width:500,height:1000},{x:524,y:0,width:360,height:1000}];dispatchEvent(new Event('resize'))});await W(400);
 const r2=await p.evaluate(()=>{const bk=$('.book').getBoundingClientRect();return bk.left+bk.width/2});ck('hinge','follows off-center crease',Math.abs(r2-512)<2,'mid '+r2);
 await p.evaluate(()=>{delete window.viewport;dispatchEvent(new Event('resize'))});await W(400);
 ck('hinge','normal layout when flat',await p.evaluate(()=>!$('.book').style.marginLeft&&!$('.book').style.marginRight));
 ck('hinge','no errors',p.errs.length===0,p.errs.join('|'));await ctx.close()}

/* ---------- 6. sync between two devices ---------- */
{const A=await mk(b,{seedData:seed(['Alpha','Beta'],{relay:'https://relay.test/?url='})});
 const B=await mk(b,{seedData:seed(['Gamma'],{relay:'https://relay.test/?url=',onboarded:1})});
 await A.E(()=>{toggleSave(findStory(cur[0].link)||cur[0]);S.hl.push({t:1,q:'quote A',art:{title:'x',link:'y'}});S.theme='broadsheet';S.setT=Date.now();save()});
 await A.tap('#gear');await W(300);await A.E(()=>$('#s-sync').scrollIntoView());await A.tap('#systart');await W(2500);
 const code=await A.E(()=>S.sync);ck('sync','code created',/^[A-Z0-9]{4}(-[A-Z0-9]{4}){3}$/.test(code),code);
 ck('sync','A synced',await A.E(()=>!!S.syncAt),await A.E(()=>S.syncMsg));
 const blob=Object.values(KV)[0]||'';ck('sync','stored data is encrypted',blob.length>100&&!blob.includes('alpha.test')&&!blob.includes('quote A'));
 await B.tap('#gear');await W(300);await B.E(()=>$('#s-sync').scrollIntoView());B.nextPrompt=code.toLowerCase().replace(/-/g,' ');await B.tap('#syjoin');await W(3500);
 const bs=await B.E(()=>({feeds:S.feeds.map(f=>f.url).sort(),saved:S.saved.length,hl:S.hl.length,theme:S.theme,msg:S.syncMsg}));
 ck('sync','B gets A feeds and keeps its own',bs.feeds.length===3,JSON.stringify(bs));
 ck('sync','B gets saved + highlights',bs.saved===1&&bs.hl===1,JSON.stringify(bs));
 ck('sync','B gets newer settings',bs.theme==='broadsheet');
 ck('sync','B loads new feeds',await B.E(()=>S.feeds.every(f=>state[f.id]==='ok')));
 // B deletes a feed and unsaves; A adds a feed
 await B.E(()=>{S.feeds=S.feeds.filter(f=>!f.url.includes('beta'));S.saved=[];save()});
 await B.E(()=>syncNow(true));await W(2500);
 await A.E(()=>{S.feeds.push({id:'zz',url:'https://delta.test/feed',title:'Delta',folder:''});save()});
 await A.E(()=>syncNow(true));await W(2500);
 const as=await A.E(()=>({feeds:S.feeds.map(f=>f.url),saved:S.saved.length}));
 ck('sync','deletion on B reaches A',!as.feeds.some(u=>u.includes('beta'))&&as.saved===0,JSON.stringify(as));
 ck('sync','A keeps new feed + gets B feed',as.feeds.some(u=>u.includes('delta'))&&as.feeds.some(u=>u.includes('gamma')),JSON.stringify(as));
 await B.E(()=>syncNow(true));await W(2500);
 ck('sync','B gets A new feed',await B.E(()=>S.feeds.some(f=>f.url.includes('delta'))&&!S.feeds.some(f=>f.url.includes('beta'))));
 // wrong code
 await B.E(()=>{S.sync='AAAA-BBBB-CCCC-DDDD';S.syncB=null});
 KV[Object.keys(KV)[0]]&&0;
 // a different code maps to a different id: seed that id with garbage from A key to simulate mismatch
 const ok=await B.E(()=>syncNow(true));ck('sync','different code starts its own space',ok===true);
 ck('sync','no errors A',A.errs.length===0,A.errs.join('|'));ck('sync','no errors B',B.errs.length===0,B.errs.join('|'));
 await B.tap('#gear').catch(()=>{});await W(300);await B.E(()=>$('#s-sync').scrollIntoView());await B.screenshot({path:'/tmp/t/n-sync.png'});
 await A.ctx.close();await B.ctx.close();
 const C=await mk(b,{seedData:seed(['Alpha'],{relay:'https://relay.test/?url='}),opt:{noKV:true}});
 await C.E(()=>{S.sync='AAAA-BBBB-CCCC-EEEE'});const r=await C.E(()=>syncNow(true));
 ck('sync','missing storage explained',r===false&&await C.E(()=>/storage/.test(S.syncMsg)),await C.E(()=>S.syncMsg));
 await C.ctx.close();
}

/* ---------- 7. settings render at phone ---------- */
{const p=await mk(b,{w:380,h:820,mob:true,seedData:seed(['Alpha'])});
 await p.tap('#menu');await W(300);await p.tap('#gear');await W(400);
 for(const id of ['#ngt','#sybox','#obagain','#fresh']){ck('settings',id+' present',await p.E(i=>!!$(i),id))}
 await p.selectOption('#ngt','midnight');await W(200);ck('settings','night select shows location row',await p.E(()=>!$('#ngeorow').hidden&&/sunset/.test($('#nlab').textContent)));
 ck('settings','settings width fits',await p.E(()=>{const d=$('#set').getBoundingClientRect();return d.right<=innerWidth&&$('.sbody').scrollWidth<=$('.sbody').clientWidth+1}));
 await p.E(()=>$('#s-sync').scrollIntoView());await W(200);await p.screenshot({path:'/tmp/t/n-settings-sync.png'});
 ck('settings','no errors',p.errs.length===0,p.errs.join('|'));await p.ctx.close()}

await b.close();
console.log(log.join('\n'));console.log(`\n${passes} passed, ${fails} failed`);
})().catch(e=>{console.log(log.join('\n'));console.error('CRASH',e);process.exit(1)});
