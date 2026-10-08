const {APP,OUT}=require('./env');
const {mock,seed,KV,PW}=require('./mock2');const {chromium}=require(PW);
const URL0=('file://'+APP);
let fails=0,passes=0;const log=[];
const ck=(g,name,cond,extra="")=>{console.log((cond?"ok":"FAIL")+" ["+g+"] "+name+" "+(cond?"":extra));if(cond)passes++;else{fails++;log.push(`FAIL [${g}] ${name} ${extra}`)}};
const W=ms=>new Promise(r=>setTimeout(r,ms));
async function mk(b,{w=884,h=1060,touch=true,seedData=null,opt={},mob=false,init=null,url=URL0}={}){
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:touch,isMobile:mob,acceptDownloads:true});
 const p=await ctx.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));
 p.on('dialog',d=>{const v=p.nextPrompt;p.nextPrompt=undefined;if(d.type()==='prompt')d.accept(v||'');else d.accept()});
 await mock(p,opt);if(init)await p.addInitScript(init);
 if(seedData)await p.addInitScript(s=>{try{if(!localStorage.getItem('folio'))localStorage.setItem('folio',JSON.stringify(s))}catch(e){}},seedData);
 await p.goto(url);await W(1400);
 p.E=(f,a)=>p.evaluate(f,a);p.ctx=ctx;
 p.touchDrag=async(x0,y0,x1,y1,steps=12,hold=16)=>{const cdp=p.cdp||(p.cdp=await ctx.newCDPSession(p));const t=(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y}]});await t('touchStart',x0,y0);for(let i=1;i<=steps;i++){await t('touchMove',x0+(x1-x0)*i/steps,y0+(y1-y0)*i/steps);await W(hold)}await t('touchEnd')};
 return p;
}
const SITES=['Alpha','Beta','Gamma','Pod','Tube'];
(async()=>{
const b=await chromium.launch();

/* 1,2,7: vertical scrolling + tap to scroll + time left; 5 drop caps/pull quote; 10 tables */
for(const [vp,w,h] of [['phone',380,820],['fold',884,1060],['desk',1280,900]]){
 const p=await mk(b,{w,h,mob:w<500,seedData:seed(SITES)});const E=p.E;
 await E(()=>{S.sel='all';render();openReader(cur.find(a=>a.link.includes('alpha')))});await W(2500);
 const pc=await E(()=>$('#pc').textContent);ck(vp,'time left shown on pages',w<520?/^\d+\/\d+( · \d+m)?$/.test(pc):/\d+ \/ \d+ · (\d+ min left|last page)/.test(pc),pc);
 ck(vp,'drop cap applied',await E(()=>!!$('.cols .body p.dropcap')));
 ck(vp,'pull quote inserted',await E(()=>!!$('.cols .body .pullq')));
 ck(vp,'pull quote not read aloud/highlight text',await E(()=>{ttsCollect();const has=TTS.words.some(w=>w.n.parentElement.closest('.pullq'));ttsStop();return !has&&!bodyText().nodes.some(x=>x.n.parentElement.closest('.pullq'))}));
 ck(vp,'pull quote not saved to cache',await E(()=>!/pullq|dropcap/.test(acGet(curA.link)||'')));
 // switch to vertical via settings click in reader
 await E(()=>{S.scroll='vertical';applyFs(true)});await W(500);
 const v=await E(()=>{const vw=$('#rd .view');return{vert:$('#rd').classList.contains('vert'),sh:vw.scrollHeight,ch:vw.clientHeight,np:R.np,pc:$('#pc').textContent,colw:$('.cols').getBoundingClientRect().width}});
 ck(vp,'vertical mode scrolls',v.vert&&v.sh>v.ch*1.5&&v.np===1,JSON.stringify(v));
 ck(vp,'vertical pc shows % and time',w<520?/^\d+%( · \d+m)?$/.test(v.pc):/^\d+% · (\d+ min left|done)/.test(v.pc),v.pc);
 ck(vp,'vertical column readable width',v.colw<=760&&v.colw>=w*0.5-40||w<500,String(v.colw));
 await p.screenshot({path:`/tmp/t/v3-${vp}-vert.png`});
 // tap bottom scrolls down
 const bb=await p.locator('.book').boundingBox();const st0=await E(()=>$('#rd .view').scrollTop);
 await p.touchscreen.tap(bb.x+bb.width*(w<500?.5:.97),bb.y+bb.height*.9);await W(900);
 const st1=await E(()=>$('#rd .view').scrollTop);ck(vp,'tap bottom scrolls down',st1>st0+bb.height*.5,st0+'→'+st1);
 await p.touchscreen.tap(bb.x+bb.width*(w<500?.5:.97),bb.y+bb.height*.1);await W(900);
 ck(vp,'tap top scrolls up',await E(()=>$('#rd .view').scrollTop)<st1-50);
 await E(()=>document.querySelector('#nx').click());await W(900);ck(vp,'next button scrolls in vertical',await E(()=>$('#rd .view').scrollTop)>50);
 // finger scroll works (native)
 await W(800);const s2=await E(()=>$('#rd .view').scrollTop);await p.touchDrag(bb.x+bb.width/2,bb.y+bb.height*.7,bb.x+bb.width/2,bb.y+bb.height*.3,10);await W(700);
 ck(vp,'finger scroll works',await E(()=>$('#rd .view').scrollTop)>s2+40);
 // horizontal swipe does not start a page turn
 await p.touchDrag(bb.x+bb.width*.8,bb.y+200,bb.x+bb.width*.2,bb.y+205,10);await W(500);ck(vp,'no page turn in vertical',await E(()=>!R.T&&!document.querySelector('.tl-leaf')));
 // progress saved + resume
 await E(()=>{const v=$('#rd .view');v.scrollTop=(v.scrollHeight-v.clientHeight)*.5;v.dispatchEvent(new Event('scroll'))});await W(300);
 const pr=await E(()=>S.prog[curA.link]&&S.prog[curA.link].p);ck(vp,'vertical progress stored',pr>.4&&pr<.8,String(pr));
 const link=await E(()=>curA.link);await p.tap('#cl');await W(300);await E(l=>openReader(findStory(l)),link);await W(900);
 ck(vp,'vertical resumes position',await E(()=>{const v=$('#rd .view');return v.scrollTop/(v.scrollHeight-v.clientHeight)})>.4);
 // TTS start in vertical from visible word
 ck(vp,'read-aloud starts at visible text',await E(()=>{ttsCollect();const i=ttsStartWord();ttsStop();return i>20}));
 // scroll to end -> finished stat
 await E(()=>{const v=$('#rd .view');v.scrollTop=v.scrollHeight;v.dispatchEvent(new Event('scroll'))});await W(300);
 ck(vp,'finished counted',await E(()=>!!S.st.fin[curA.link]));
 await E(()=>{S.scroll='pages';applyFs(true)});await W(400);ck(vp,'back to pages',await E(()=>!$('#rd').classList.contains('vert')&&R.np>1));
 await p.tap('#cl');await W(200);
 // table story via md + feed html
 await E(()=>{const a={feedId:'f0',title:'Table test',link:'https://alpha.test/table',date:Date.now(),img:'',summary:'',html:'<p>'+'Intro words for the table story. '.repeat(20)+'</p><table><tr><th>Phone</th><th>Price</th><th>Battery</th><th>Weight</th><th>Screen</th><th>Chip</th><th>Camera</th></tr><tr><td>Fold 8 Ultra</td><td>$1,999</td><td>5,000 mAh</td><td>239 g</td><td>8.2 in</td><td>Snapdragon</td><td>200 MP</td></tr><tr><td colspan="2">Merged</td><td>x</td><td>y</td><td>z</td><td>w</td><td>v</td></tr></table><p>'+'After the table. '.repeat(40)+'</p>'};openReader(a)});await W(1200);
 const tb=await E(()=>{const t=$('.cols .body table');if(!t)return null;const wr=t.parentElement,c=$('.cols'),cw=(c.clientWidth-(R.cpv-1)*56)/R.cpv;return{wrap:wr.classList.contains('tbl'),fits:wr.getBoundingClientRect().width<=cw+2,cells:t.querySelectorAll('td,th').length,cs:t.querySelector('[colspan]')?.getAttribute('colspan')}});
 ck(vp,'table kept and wrapped',tb&&tb.wrap&&tb.cells===20&&tb.cs==='2',JSON.stringify(tb));ck(vp,'table fits column (scrolls inside)',tb&&tb.fits);
 await p.screenshot({path:`/tmp/t/v3-${vp}-table.png`});
 await p.tap('#cl');await W(200);
 ck(vp,'no errors',p.errs.length===0,p.errs.join('|'));await p.ctx.close();
}
/* md table conversion */
{const p=await mk(b,{seedData:seed(['Alpha'])});
 ck('md','markdown table converts',await p.E(()=>{const f=md('Markdown Content:\n| A | B |\n|---|---|\n| 1 | 2 |\n| 3 | 4 |','https://x.test');const t=f.querySelector('table');return !!t&&t.querySelectorAll('td').length===4&&t.querySelectorAll('th').length===2}));
 await p.ctx.close()}

/* 14 follow, 18 suggestions, 20 social, 44 repair */
{const p=await mk(b,{seedData:seed(['Alpha','Beta','Gamma'],{feeds:[{id:'f0',title:'The Verge',url:'https://www.theverge.com/rss/index.xml',folder:''},{id:'f1',title:'Alpha',url:'https://alpha.test/feed',folder:''},{id:'f2',title:'Broken',url:'https://gamma.test/oldfeed',folder:''}]})});const E=p.E;
 await p.tap('#sb');await p.fill('#q','story 2');await W(300);
 ck('find','follow bar on search',await E(()=>!!$('[data-follow]')));
 await p.tap('[data-follow]');await W(300);
 ck('find','topic followed',await E(()=>S.sk.some(k=>k.words[0]==='story 2')));
 await E(()=>openSearch(false));await W(200);
 ck('find','topics in sidebar',await E(()=>/Topics you follow/.test($('#side-list').textContent)));
 await E(()=>{S.sel='k:'+S.sk[0].id;render()});ck('find','topic page lists matches + unfollow',await E(()=>cur.length>=1&&!!$('[data-unfollow]')));
 await E(()=>{S.sel='today';render()});ck('find','topic section on Today with why',await E(()=>{const sec=[...document.querySelectorAll('.sech h2')].some(h=>h.textContent==='story 2');return !sec||Object.values(WHY).some(t=>/topic you follow/.test(t))}));
 // follow from selection
 await E(()=>{S.sel='all';render();openReader(cur.find(a=>a.link.includes('alpha')))});await W(2000);
 await E(()=>{const t=$('.cols .body p').firstChild;const r=document.createRange();r.setStart(t,0);r.setEnd(t,9);getSelection().removeAllRanges();getSelection().addRange(r);document.dispatchEvent(new Event('selectionchange'))});await W(400);
 ck('find','selection bar has Follow and Share',await E(()=>!!$('#selbar [data-s="follow"]')&&!!$('#selbar [data-s="img"]')));
 await p.tap('#selbar [data-s="follow"]');await W(200);ck('find','follow from selection',await E(()=>S.sk.some(k=>k.words[0]==='paragraph')));
 await p.tap('#cl');await W(200);
 // suggestions
 await E(()=>$('#add').click());await W(300);await E(()=>{const r=$('#pop [data-cat="-1"]');if(r)r.click()});await W(250);
 const sg=await E(()=>({chip:/For you/.test($('#pop .ahd')?.textContent||''),n:document.querySelectorAll('#pop .pf').length,why:$('#pop .pf small')?.textContent}));
 ck('find','For you suggestions',sg.chip&&sg.n>=5&&/Because you read The Verge/.test(sg.why),JSON.stringify(sg));
 ck('find','suggestions exclude added',await E(()=>![...document.querySelectorAll('#pop [data-add]')].some(b=>b.dataset.add.includes('theverge'))));
 await E(()=>$('#dlg').close());
 // social
 const so=await E(()=>['r/gadgets','u/spez','@Gargron@mastodon.social','jay.bsky.social','@mkbhd','yt mkbhd','theverge.com','https://x.test/feed'].map(socialUrl));
 ck('find','reddit sub',so[0]==='https://www.reddit.com/r/gadgets/.rss');ck('find','reddit user',so[1]==='https://www.reddit.com/user/spez/submitted/.rss');
 ck('find','mastodon',so[2]==='https://mastodon.social/@Gargron.rss',so[2]);ck('find','bluesky',so[3]==='https://bsky.app/profile/jay.bsky.social/rss',so[3]);
 ck('find','youtube handle',so[4]==='https://www.youtube.com/@mkbhd'&&so[5]==='https://www.youtube.com/@mkbhd',so[4]+' '+so[5]);
 ck('find','plain site',so[6]==='https://theverge.com'&&so[7]==='https://x.test/feed');
 // repair: gamma oldfeed fails; findFeed(origin) → tries /feed which mock serves
 await E(()=>{const f=S.feeds.find(f=>/oldfeed/.test(f.url));if(f){S.health[f.id]={fn:6,ff:Date.now()-4*864e5,fail:Date.now()};load(f,true).catch(()=>{})}});
 await W(3000);ck('find','feed repair finds moved feed automatically',await E(()=>S.feeds.some(f=>f.url==='https://gamma.test/feed'&&f.oldUrl)),await E(()=>JSON.stringify(S.feeds.map(f=>f.url))));
 ck('find','repaired feed has stories',await E(()=>{const f=S.feeds.find(f=>f.url==='https://gamma.test/feed');return state[f.id]==='ok'&&items[f.id].length>0}));
 ck('find','no errors',p.errs.length===0,p.errs.join('|'));await p.ctx.close()}

/* 21 cover, 22 cards, 38 why */
for(const [vp,w,h] of [['phone',380,820],['fold',884,1060]]){
 const p=await mk(b,{w,h,mob:w<500,seedData:seed(SITES,{sel:'today',narrow:'off',cvs:'poster'})});const E=p.E;
 ck(vp,'cover on Today',await E(()=>!!$('.cover')&&!!$('.cover .cvlead h2')&&document.querySelectorAll('.cover .cvl').length>=2));
 ck(vp,'cover no dup in sections',await E(()=>{const ls=[...document.querySelectorAll('#grid .card')].map(c=>c.getAttribute('href'));const cv=[...document.querySelectorAll('.cvl,.cvlead')].map(c=>c.getAttribute('href'));return !ls.some(l=>cv.includes(l))}));
 await p.screenshot({path:`/tmp/t/v3-${vp}-cover.png`});
 await p.tap('.cvl');await W(800);ck(vp,'cover line opens story',await E(()=>$('#rd').classList.contains('on')));await p.tap('#cl');await W(300);
 await E(()=>{$('main').scrollTop=0});
 if(await E(()=>!!document.querySelector('.cover [data-why]'))){await p.tap('.cover [data-why]');await W(200);ck(vp,'why popover on cover',await E(()=>!$('#whyp').hidden&&/Top story/.test($('#whyp').textContent)))}else ck(vp,'no empty info button on cover',true);
 await E(()=>{{const w=$('#whyp');if(w)w.hidden=true}});
 const wc=await E(()=>{const w=document.querySelector('#grid .card [data-why]');w.scrollIntoView({block:'center'});const r=w.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}});await W(200);
 await p.touchscreen.tap(wc.x,wc.y);await W(300);
 ck(vp,'why on card, no story opened',await E(()=>!$('#whyp').hidden&&$('#whyp').textContent.length>20&&!$('#rd').classList.contains('on')),await E(()=>$('#whyp').textContent));
 ck(vp,'why popover on screen',await E(()=>{const r=$('#whyp').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight}));
 // card sizes
 for(const c of ['large','compact','medium']){await E(c=>{S.cards=c;S.sel='all';render()},c);await W(150);
  const r=await E(()=>{const cs=[...document.querySelectorAll('#grid .card')];const a=cs[0].getBoundingClientRect();return{w:a.width,h:a.height,cols:new Set(cs.slice(0,6).map(x=>Math.round(x.getBoundingClientRect().left))).size,hs:document.documentElement.scrollWidth<=innerWidth+1}});
  if(c==='large')ck(vp,'large cards bigger',r.h>=260&&(w<500?r.cols===1:r.cols<=2),JSON.stringify(r));
  if(c==='compact')ck(vp,'compact cards short',r.h<140,JSON.stringify(r));
  ck(vp,c+' no h-scroll',r.hs);
  await p.screenshot({path:`/tmp/t/v3-${vp}-cards-${c}.png`});}
 // cover off
 await E(()=>{S.cover=false;S.sel='today';render()});ck(vp,'cover can be turned off',await E(()=>!$('.cover')&&!!$('.card.lead')));
 ck(vp,'no errors',p.errs.length===0,p.errs.join('|'));await p.ctx.close();
}

/* 26 shortcuts */
{const p=await mk(b,{seedData:seed(SITES),url:URL0+'?view=brief'});ck('short','?view=brief opens The Daily brief',await p.E(()=>S.sel==='brief'&&$('#ttl').textContent==='The Daily'&&!location.search));await p.ctx.close();
 const q=await mk(b,{seedData:seed(SITES),url:URL0+'?view=search'});await W(500);ck('short','?view=search opens search',await q.E(()=>$('#srch').classList.contains('open')));await q.ctx.close()}

/* 29 weather sky, 30 launch animation */
{const p=await mk(b,{seedData:seed(SITES,{geo:{lat:34,lon:-118},wx:true})});
 await p.route(/api\.open-meteo\.com/,r=>r.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify({current:{weather_code:61,cloud_cover:90}})}));
 await p.E(()=>sky('set'));await W(700);
 const s=await p.E(()=>({rain:$('#sky').classList.contains('rain'),drops:document.querySelectorAll('#sky .sk-drop').length}));ck('wx','rain in sky',s.rain&&s.drops>10,JSON.stringify(s));
 await p.screenshot({path:'/tmp/t/v3-rain.png',clip:{x:0,y:960,width:300,height:100}});
 await W(5200);await p.E(()=>{WX.t=0});
 await p.unroute(/api\.open-meteo\.com/);await p.route(/api\.open-meteo\.com/,r=>r.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify({current:{weather_code:0,cloud_cover:5}})}));
 await p.E(()=>sky('set'));await W(700);ck('wx','stars on clear night',await p.E(()=>document.querySelectorAll('#sky .sk-star.tw').length>=6));
 await p.E(()=>{WX.t=0});await p.unroute(/api\.open-meteo\.com/);await p.route(/api\.open-meteo\.com/,r=>r.abort());
 await W(5200);await p.E(()=>sky('set'));await W(700);ck('wx','offline weather: plain sky still works',await p.E(()=>!!$('#sky')&&!document.querySelector('#sky .sk-drop')));
 ck('wx','no errors',p.errs.length===0,p.errs.join('|'));await p.ctx.close()}
{const p=await mk(b,{seedData:seed(SITES,{intro:true})});
 // mk waited 1400ms; intro lasts 1700ms+450
 const p2=await b.newContext({viewport:{width:884,height:1060}});const pg=await p2.newPage();await mock(pg);await pg.addInitScript(s=>{try{if(!localStorage.getItem('folio'))localStorage.setItem('folio',JSON.stringify(s))}catch(e){}},seed(SITES,{intro:true}));
 const errs=[];pg.on('pageerror',e=>errs.push(e.message));await pg.goto(URL0);await W(500);
 let sh=false;for(let i=0;i<30&&!sh;i++){sh=await pg.evaluate(()=>!!document.getElementById('lflash'));if(!sh)await W(100)}ck('intro','launch animation shows',sh);await pg.screenshot({path:'/tmp/t/v3-intro.png'});
 await W(2800);ck('intro','launch animation removes itself',await pg.evaluate(()=>!document.getElementById('lflash')));
 await pg.reload();await W(300);ck('intro','only once per session',await pg.evaluate(()=>!document.getElementById('lflash')));
 await pg.evaluate(()=>{S.logo='circuit';save();sessionStorage.clear()});await W(300);await pg.reload();let cv=false;for(let i=0;i<30&&!cv;i++){cv=await pg.evaluate(()=>!!document.getElementById('lflash'));if(!cv)await W(100)}ck('intro','circuit variant',cv);
 await pg.screenshot({path:'/tmp/t/v3-intro2.png'});
 ck('intro','animation never blocks touches',await pg.evaluate(()=>{const o=document.getElementById('lflash');return !o||getComputedStyle(o).pointerEvents==='none'}));
 ck('intro','no errors',errs.length===0,errs.join('|'));await p2.close();await p.ctx.close()}

/* 31,32,33,34 listening */
{const init=()=>{window.SPOKEN=[];const fake={speaking:false,pending:false,paused:false,getVoices:()=>[{voiceURI:'v1',name:'Alice Female',lang:'en-US',default:true},{voiceURI:'v2',name:'Bob Male',lang:'en-US'}],cancel(){this.q=[];this.speaking=false},speak(u){SPOKEN.push({t:u.text,v:u.voice&&u.voice.voiceURI,p:u.pitch});this.speaking=true;setTimeout(()=>{u.onstart&&u.onstart();setTimeout(()=>{this.speaking=false;u.onend&&u.onend()},Math.min(40,u.text.length))},5)},pause(){},resume(){},addEventListener(){},onvoiceschanged:null};Object.defineProperty(window,'speechSynthesis',{value:fake,configurable:true});window.SpeechSynthesisUtterance=class{constructor(t){this.text=t}};window.MS={};try{const ms=navigator.mediaSession;ms.setActionHandler=(a,f)=>{MS[a]=f}}catch(e){}};
 const p=await mk(b,{seedData:seed(SITES,{voice:'v1'}),init});const E=p.E;
 await E(()=>{S.sel='all';render();openReader(cur.find(a=>a.link.includes('alpha')))});await W(2000);
 await p.tap('#mo');await p.tap('[data-act="upnext"]');await W(100);
 ck('listen','add to up next',await E(()=>S.lq.length===1));
 const nextLink=await E(()=>{const b=cur.find(a=>a.link.includes('beta'));S.lq=[b.link];save();return b.link});
 await p.tap('#rp');await W(200);ck('listen','up next listed in playback menu',await E(()=>document.querySelectorAll('#upn .upi').length===1));
 await p.selectOption('#slp','15');await W(100);ck('listen','sleep timer set',await E(()=>SLEEP.t&&/min left/.test($('#slpm').textContent)));
 await p.selectOption('#slp','0');
 await p.tap('#rp');
 // quote voice
 await E(()=>{S.qvoice='auto';const b=$('.cols .body p');b.textContent='He said “this is a quoted line” and left.';ttsCollect()});
 ck('listen','quote words flagged',await E(()=>TTS.words.filter(w=>w.q).length===5),await E(()=>JSON.stringify(TTS.words.slice(0,9).map(w=>w.t+':'+!!w.q))));
 ck('listen','auto second voice',await E(()=>quoteVoice()&&quoteVoice().voiceURI==='v2'));
 await E(()=>{SPOKEN.length=0;ttsFrom(0)});await W(900);
 const sp=await E(()=>SPOKEN.slice(0,6));ck('listen','quote spoken in second voice',sp.some(x=>/quoted line/.test(x.t)&&x.v==='v2')&&sp.some(x=>/^Test|^Alpha|He said/.test(x.t)&&x.v==='v1'),JSON.stringify(sp));
 await E(()=>ttsStop());
 ck('listen','lock-screen handlers registered',await E(()=>typeof MS.play==='function'&&typeof MS.nexttrack==='function'&&typeof MS.pause==='function'));
 ck('listen','media metadata set',await E(()=>navigator.mediaSession.metadata&&navigator.mediaSession.metadata.album==='CyPress'));
 // queue advances to up next at end
 await E(()=>{S.queue=false;ttsCollect();ttsFrom(TTS.words.length-2)});await W(1500);
 ck('listen','up next plays after story',await E(l=>curA&&curA.link===l,nextLink),await E(()=>curA&&curA.link));
 await E(()=>ttsStop());
 // sleep end of story
 await E(()=>{setSleep('eos');S.lq=[cur.find(a=>a.link.includes('gamma')).link];ttsCollect();ttsFrom(TTS.words.length-2)});await W(1200);
 ck('listen','sleep at end of story stops',await E(()=>!TTS.on&&curA.link.includes('beta')));
 // brief aloud
 await E(()=>closeRd());await W(200);
 await E(()=>{S.read={};S.brief=null;S.sel='brief';render()});await W(200);
 await E(()=>{SPOKEN.length=0});await p.tap('[data-blisten]');await W(2500);
 const br=await E(()=>({intro:SPOKEN.some(x=>/Here’s your (brief|Daily)/.test(x.t)),on:$('#rd').classList.contains('on'),lq:S.lq.length,brief:R.briefAudio}));
 ck('listen','brief aloud starts with intro',br.intro&&br.on&&br.lq>=5&&br.brief,JSON.stringify(br));
 await E(()=>{ttsCollect();ttsFrom(TTS.words.length-1)});await W(2500);
 ck('listen','next brief story announced',await E(()=>SPOKEN.some(x=>/Story 2 of/.test(x.t))),await E(()=>JSON.stringify(SPOKEN.slice(-4).map(x=>x.t.slice(0,40)))));
 await E(()=>ttsStop());
 ck('listen','no errors',p.errs.length===0,p.errs.join('|'));await p.ctx.close()}

/* 35 stats, 36 YIR, 40 quote image, 47 update notice */
{const p=await mk(b,{seedData:seed(SITES,{hl:[{id:'h1',link:'https://alpha.test/story-1',q:'A memorable sentence from the story that I highlighted.',off:0,note:'',t:Date.now(),art:{title:'Alpha story 1',link:'https://alpha.test/story-1',ft:'Alpha',fc:'#2a6'}}],st:{d:{},src:{},tp:{},hr:Array(24).fill(0),fin:{}}})});const E=p.E;
 const clk=await E(()=>{const n=Date.now();const d=k=>{const x=new Date(n-k*864e5);return dayKey(x)};S.st.d[d(0)]={m:24,n:5,f:3};S.st.d[d(1)]={m:12,n:3,f:1};S.st.d[d(2)]={m:40,n:7,f:4};S.st.d[d(9)]={m:5,n:1,f:0};S.st.src={Alpha:9,Beta:5,Gamma:2};S.st.tp={Tech:10};S.st.hr[22]=30;S.st.hr[8]=5;return streaks()});
 ck('stats','streak math',clk.cur===3&&clk.best===3,JSON.stringify(clk));
 // real tracking
 await E(()=>{S.sel='all';render();openReader(cur[0])});await W(1500);ck('stats','open counted',await E(()=>S.st.d[dayKey()].n===6&&S.st.src[fof(curA).title]>=1));
 await p.tap('#cl');
 await E(()=>{S.sel='stats';render()});await W(200);
 const st=await E(()=>({tiles:document.querySelectorAll('.tile').length,bars:document.querySelectorAll('.sbars:not(.hrs) .sbar').length,src:document.querySelectorAll('.hrow').length,pers:$('.sgc h3 small').textContent}));
 ck('stats','stats page renders',st.tiles===4&&st.bars===7&&st.src>=3&&st.pers==='Night owl',JSON.stringify(st));
 ck('stats','no h-scroll',await E(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await p.screenshot({path:'/tmp/t/v3-stats.png',fullPage:true});
 await p.tap('[data-yir]');await W(700);
 ck('yir','year in review opens',await E(()=>!!$('#yir .ys.on')));
 const n=await E(()=>document.querySelectorAll('#yir .ys').length);ck('yir','has slides',n>=7,String(n));
 await p.screenshot({path:'/tmp/t/v3-yir1.png'});
 for(let i=0;i<3;i++){await p.mouse.click(800,500);await W(250)}await p.screenshot({path:'/tmp/t/v3-yir2.png'});
 ck('yir','advances on tap',await E(()=>+$('#yir .ys.on').dataset.s===3));
 for(let i=0;i<n;i++){await p.mouse.click(800,500);await W(120)}await W(400);ck('yir','closes at end',await E(()=>!$('#yir')));
 // quote image
 const qi=await E(async()=>{const c=await quoteImage('A memorable sentence from the story that I highlighted and it keeps going for a while to wrap several lines nicely.',{title:'Alpha story 1',ft:'Alpha',fc:'#2a6'});const d=c.getContext('2d').getImageData(540,700,1,1).data;return{w:c.width,h:c.height,url:c.toDataURL('image/png').length}});
 ck('share','quote image renders',qi.w===1080&&qi.h===1350&&qi.url>20000,JSON.stringify(qi));
 await E(async()=>{const c=await quoteImage('A memorable sentence from the story that I highlighted.',{title:'Alpha story 1',ft:'Alpha',fc:'#2a6'});const a=document.createElement('img');a.id='qprev';a.src=c.toDataURL();a.style.cssText='position:fixed;left:0;top:0;width:432px;z-index:999';document.body.append(a)});await W(300);
 await p.screenshot({path:'/tmp/t/v3-quote.png',clip:{x:0,y:0,width:432,height:540}});await E(()=>$('#qprev').remove());
 await E(()=>{S.sel='notes';render()});const [dl]=await Promise.all([p.waitForEvent('download',{timeout:6000}).catch(()=>null),p.click('[data-hshare="0"]')]);
 ck('share','highlight share image downloads (no share sheet)',!!dl&&/png$/.test(dl?dl.suggestedFilename():''));
 ck('stats','no errors',p.errs.length===0,p.errs.join('|'));await p.ctx.close()}
{// what's new for upgraded user
 const p=await mk(b,{seedData:seed(SITES,{ver:'2026.09.28'})});await W(1200);
 ck('update','what’s new shows after update',await p.E(()=>$('#wn')&&$('#wn').open&&document.querySelectorAll('#wn li').length>=1));
 await p.screenshot({path:'/tmp/t/v3-wn.png'});
 await p.click('#wn .go');await W(200);await p.reload();await W(2500);ck('update','only once',await p.E(()=>!$('#wn')));
 ck('update','update check parses version',await p.E(()=>/const APP_VERSION='([^']+)'/.test(document.documentElement.innerHTML)));
 await p.ctx.close()}
{// update banner via http server
 const http=require('http'),fs=require('fs');let ver='2026.10.01a';const srv=http.createServer((q,r)=>{let t=fs.readFileSync(APP,'utf8');if(ver!=='2026.10.08a')t=t.replace("const APP_VERSION='2026.10.08a'","const APP_VERSION='"+ver+"'");r.writeHead(200,{'Content-Type':'text/html'});r.end(t)}).listen(8765);
 const ctx=await b.newContext({viewport:{width:884,height:1060}});const p=await ctx.newPage();await mock(p);await p.addInitScript(s=>{try{if(!localStorage.getItem('folio'))localStorage.setItem('folio',JSON.stringify(s))}catch(e){}},seed(SITES));
 await p.route('http://localhost:8765/**',r=>r.continue());
 await p.goto('http://localhost:8765/');await W(1200);ver='2026.10.01';await p.evaluate(()=>checkUpdate());await W(800);
 ck('update','new version banner',await p.evaluate(()=>!!$('#upd')));await p.screenshot({path:'/tmp/t/v3-upd.png',clip:{x:0,y:0,width:884,height:80}});
 srv.close();await ctx.close()}

/* 48 narrow cover screen */
{const p=await mk(b,{w:390,h:844,mob:true,seedData:seed(SITES,{sel:'all'})});const E=p.E;
 ck('narrow','narrow layout auto on',await E(()=>document.body.classList.contains('narrow')&&!$('#tabs').hidden));
 const r=await E(()=>{const c=document.querySelector('#grid .card');const b=c.getBoundingClientRect();return{h:b.height,w:b.width,img:c.querySelector('img')&&getComputedStyle(c.querySelector('img')).position}});
 ck('narrow','phone tiles are photo cards',r.h>=150&&r.w>150&&r.w<400,JSON.stringify(r));
 await p.screenshot({path:'/tmp/t/v3-narrow.png'});
 await p.tap('#tabs [data-tab="all"]');await W(200);ck('narrow','tab bar navigates',await E(()=>S.sel==='all'));
 await p.tap('#tabs [data-tab="saved"]');await W(200);ck('narrow','saved tab',await E(()=>S.sel==='saved'));
 await p.tap('#tabs [data-tab="search"]');await W(300);ck('narrow','search tab',await E(()=>$('#srch').classList.contains('open')));await E(()=>openSearch(false));
 await p.tap('#menu');await W(300);ck('narrow','menu button opens menu',await E(()=>document.body.classList.contains('open')));ck('narrow','no More tab',await E(()=>!document.querySelector('#tabs [data-tab="menu"]')&&document.querySelectorAll('#tabs [data-tab]').length===4));await E(()=>document.body.classList.remove('open'));
 await E(()=>{S.sel='all';render();openReader(cur[0])});await W(900);ck('narrow','tabs hidden in reader',await E(()=>getComputedStyle($('#tabs')).display==='none'));await p.tap('#cl');await W(200);
 ck('narrow','last card reachable above tab bar',await E(()=>{$('main').scrollTop=1e6;const c=[...document.querySelectorAll('#grid .card')].pop().getBoundingClientRect(),t=$('#tabs').getBoundingClientRect();return c.bottom<=t.top+2}));
 await E(()=>{S.narrow='off';render()});ck('narrow','can turn off',await E(()=>!document.body.classList.contains('narrow')&&$('#tabs').hidden));
 ck('narrow','no h-scroll',await E(()=>document.documentElement.scrollWidth<=innerWidth+1));
 ck('narrow','no errors',p.errs.length===0,p.errs.join('|'));await p.ctx.close()}

/* 49 flex mode */
{const init=()=>{Object.defineProperty(window,'viewport',{value:{segments:[{x:0,y:0,width:884,height:500},{x:0,y:524,width:884,height:476}]},configurable:true})};
 const p=await mk(b,{w:884,h:1000,seedData:seed(SITES),init});const E=p.E;
 await E(()=>{S.sel='all';render();openReader(cur.find(a=>a.link.includes('alpha')))});await W(2000);
 const f=await E(()=>{const sh=$('#sheet').getBoundingClientRect(),pad=$('#fpad').getBoundingClientRect();return{flex:$('#rd').classList.contains('flex'),shB:sh.bottom,padT:pad.top,padH:pad.height,btn:document.querySelectorAll('#fpad [data-fp]').length}});
 ck('flex','story on top half',f.flex&&f.shB<=501,JSON.stringify(f));ck('flex','controls on bottom half',f.padT>=523&&f.padH>200&&f.btn===6);
 await p.screenshot({path:'/tmp/t/v3-flex.png'});
 const pg0=await E(()=>R.pg);await p.click('#fpad [data-fp="next"]');await W(1000);ck('flex','pad next turns page',await E(()=>R.pg)===pg0+1);
 ck('flex','pad shows page info',await E(()=>/\d+ \/ \d+/.test($('#fpc').textContent)));
 await p.click('#fpad [data-fp="bigger"]');await W(300);ck('flex','pad text size',await E(()=>S.fs===19));
 await E(()=>{delete window.viewport;dispatchEvent(new Event('resize'))});await W(500);ck('flex','flat again = normal',await E(()=>!$('#rd').classList.contains('flex')));
 await p.click('#cl');ck('flex','no errors',p.errs.length===0,p.errs.join('|'));await p.ctx.close()}

/* 50 side-by-side */
for(const [vp,w,h] of [['fold',884,1060],['desk',1280,900]]){
 const p=await mk(b,{w,h,seedData:seed(SITES,{split:true,sel:'all'})});const E=p.E;
 ck(vp,'split active',await E(()=>document.body.classList.contains('split')));
 ck(vp,'placeholder when empty',await E(()=>!!$('#sheet .spe')));
 await p.screenshot({path:`/tmp/t/v3-${vp}-split0.png`});
 await p.click('#grid .card:nth-child(3) h3');await W(1800);
 const r=await E(()=>{const m=$('main').getBoundingClientRect(),rd=$('#rd').getBoundingClientRect();return{on:$('#rd').classList.contains('on'),ml:m.left,mr:m.right,rl:rd.left,rw:rd.width,act:!!$('.card.act'),np:R.np}});
 ck(vp,'story opens beside list',r.on&&r.rl>=r.mr-1&&r.rw>300&&r.act,JSON.stringify(r));
 ck(vp,'list still clickable',await E(()=>{const c=document.querySelector('#grid .card:nth-child(4)');const b=c.getBoundingClientRect();const e=document.elementFromPoint(b.left+b.width/2,b.top+b.height/2);return c.contains(e)}));
 await p.screenshot({path:`/tmp/t/v3-${vp}-split1.png`});
 await p.click('#nx');await W(1000);ck(vp,'page turn works in split',await E(()=>R.pg===1));
 await p.click('#grid .card:nth-child(4) h3');await W(1500);ck(vp,'switch story from list',await E(()=>cur.indexOf(curA)===3||$('.card.act')===document.querySelector('#grid .card:nth-child(4)')));
 await p.click('#cl');await W(300);ck(vp,'close shows placeholder',await E(()=>!!$('#sheet .spe')&&!$('#rd').classList.contains('on')));
 await p.click('#menu');await W(300);ck(vp,'menu drawer in split',await E(()=>document.body.classList.contains('open')&&$('aside').getBoundingClientRect().left>=-1));
 await E(()=>document.body.classList.remove('open'));
 await E(()=>{S.split=false;screenMode();render()});ck(vp,'turn off split',await E(()=>!document.body.classList.contains('split')));
 ck(vp,'no h-scroll',await E(()=>document.documentElement.scrollWidth<=innerWidth+1));
 ck(vp,'no errors',p.errs.length===0,p.errs.join('|'));await p.ctx.close();
}
/* settings rows present and working */
{const p=await mk(b,{w:380,h:820,mob:true,seedData:seed(SITES)});const E=p.E;
 await E(()=>$('#gear').click());await W(300);
 for(const sel of ['#scs [data-sc="vertical"]','#cds [data-cd="large"]','.tg[data-tg="mag"]','.tg[data-tg="cover"]','.tg[data-tg="intro"]','.tg[data-tg="split"]','.tg[data-tg="wx"]','#nrw','#qv','#skyp'])ck('settings',sel+' present',await E(s=>!!$(s),sel));
 await E(()=>$('#scs [data-sc="vertical"]').click());ck('settings','scroll setting',await E(()=>S.scroll==='vertical'));
 await E(()=>$('#cds [data-cd="compact"]').click());ck('settings','cards setting',await E(()=>S.cards==='compact'));
 await E(()=>$('.tg[data-tg="mag"]').click());ck('settings','mag toggle off',await E(()=>S.mag===false&&$('.tg[data-tg="mag"]').textContent==='Off'));
 ck('settings','defaults on for cover/intro',await E(()=>$('.tg[data-tg="cover"]').textContent==='On'));
 ck('settings','quote voice options',await E(()=>$('#qv').options.length>=2));
 ck('settings','fits phone',await E(()=>$('.sbody').scrollWidth<=$('.sbody').clientWidth+1));
 await E(()=>$('#skyp').click());await W(300);ck('settings','sky preview',await E(()=>!!$('#sky')));
 ck('settings','no errors',p.errs.length===0,p.errs.join('|'));await p.ctx.close()}

await b.close();
console.log(log.join('\n'));console.log(`\n${passes} passed, ${fails} failed`);
})().catch(e=>{console.log(log.join('\n'));console.error('CRASH',e);process.exit(1)});
