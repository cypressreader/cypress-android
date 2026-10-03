const {mock,seed,PW}=require('./mock');const {chromium}=require(PW);
const VPS=[['phone',380,820,true],['fold',884,1060,true],['desktop',1280,900,false]];
let pass=0,fail=0;const log=[];const ck=(vp,n,c,x='')=>{if(c)pass++;else{fail++;log.push(`FAIL [${vp}] ${n} ${x}`)}};
(async()=>{const b=await chromium.launch();
for(const [vp,w,h,touch] of VPS){
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:touch,isMobile:touch&&w<500});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await mock(p,{n:12});
 await p.addInitScript(s=>{try{if(!localStorage.getItem('folio'))localStorage.setItem('folio',JSON.stringify(s))}catch(e){}},seed(['Alpha','Beta','Gamma']));
 await p.goto('file:///mnt/user-data/outputs/cypress.html');
 const E=(f,a)=>p.evaluate(f,a);
 // progress: sample during initial load
 const seen=await E(()=>new Promise(res=>{let max=0,lp=false,pfb=!!document.querySelector('#pfbar');const t=setInterval(()=>{if(document.body.classList.contains('lp')){lp=true;const v=parseFloat(getComputedStyle(document.querySelector('aside .logo .lgm')).getPropertyValue('--p'));if(v>max)max=v}},40);setTimeout(()=>{clearInterval(t);res({max,lp,pfb})},3500)}));
 ck(vp,'logo progress class appears while loading',seen.lp,JSON.stringify(seen));
 ck(vp,'progress value rises',seen.max>=4,JSON.stringify(seen));
 ck(vp,'no bottom pill',!(await E(()=>document.querySelector('#pfbar'))));
 await p.waitForTimeout(3000);
 ck(vp,'progress clears when done',await E(()=>!document.body.classList.contains('lp')));
 ck(vp,'default preload mode top10',await E(()=>pfMode()==='top10'));
 // top 10 in view cached
 await E(()=>{S.sel='all';S.capn=0;render()});await p.waitForTimeout(6000);
 const c10=await E(()=>{const by=storyMap();const l=[...document.querySelectorAll('#grid a.card')].map(c=>by.get(c.getAttribute('href'))).filter(Boolean).slice(0,10);return l.filter(a=>acGet(a.link)).length+'/'+l.length});
 ck(vp,'top 10 stories prepared',c10.startsWith('10/'),c10);
 // rolling refill
 const before=await E(()=>Object.keys(AC).length);
 await E(()=>{const by=storyMap();const cards=[...document.querySelectorAll('#grid a.card')].map(c=>by.get(c.getAttribute('href')));readAhead(cards[9])});await p.waitForTimeout(3500);
 const after=await E(()=>Object.keys(AC).length);
 ck(vp,'rolling refill adds stories ahead',after>before,before+'→'+after);
 // logo pulse shows checkmarks kept
 ck(vp,'check marks on ready',await E(()=>document.querySelectorAll('#grid .rdy').length>=8));
 // warm images
 await E(()=>{const d=document.createElement('div');d.innerHTML='<img src="https://x.test/a.jpg"><img src="https://x.test/b.jpg">';window.__w=WARM.length;warmImgs(d,{img:'https://x.test/h.jpg'})});
 ck(vp,'images warmed',await E(()=>WARM.length===window.__w+3),String(await E(()=>WARM.length)));
 // wifi only
 await E(()=>{Object.defineProperty(navigator,'connection',{value:{type:'cellular',saveData:false},configurable:true});S.pfwifi=true});
 ck(vp,'wifi-only blocks on cellular',await E(()=>pfAllowed()===false));
 await E(()=>{S.pfwifi=false;delete S.dsave});ck(vp,'cellular ok when wifi-only off',await E(()=>pfAllowed()===true));
 await E(()=>{S.dsave=true});ck(vp,'data saver blocks on cellular',await E(()=>pfAllowed()===false));
 await E(()=>{S.dsave=false;Object.defineProperty(navigator,'connection',{value:{type:'wifi'},configurable:true})});ck(vp,'wifi allowed',await E(()=>pfAllowed()===true));
 // storage cap
 const capOk=await E(()=>{acClear();S.acMB=1;const big='x'.repeat(400000);for(let i=0;i<6;i++)acPut('https://cap.test/'+i,big);const z=acSize();S.acMB=60;return z.n<=1048576+400000&&z.c<6&&!!AC['https://cap.test/5']});
 ck(vp,'storage cap evicts oldest',capOk);
 // offline mode
 await E(()=>{S.offline=true;offApply(true)});
 ck(vp,'offline class',await E(()=>document.body.classList.contains('offl')));
 ck(vp,'offline fetchText rejects',await E(async()=>{try{await fetchText('https://alpha.test/feed');return false}catch(e){return /Offline/.test(e.message)}}));
 ck(vp,'offline blocks preload',await E(()=>pfAllowed()===false));
 await E(()=>loadAll(true));await p.waitForTimeout(400);
 ck(vp,'offline keeps cached stories',await E(()=>document.querySelectorAll('#grid a.card').length>3));
 await E(()=>{S.offline=false;offApply(true)});await p.waitForTimeout(2500);
 ck(vp,'offline off restores',await E(()=>!document.body.classList.contains('offl')));
 // per-site cap
 await E(()=>{S.capn=3;S.sel='all';render()});
 const per=await E(()=>{const by=storyMap(),c={};[...document.querySelectorAll('#grid a.card')].forEach(a=>{const x=by.get(a.getAttribute('href'));if(x)c[x.feedId]=(c[x.feedId]||0)+1});return Math.max(...Object.values(c))});
 ck(vp,'per-site cap in All',per<=3,String(per));
 await E(()=>{S.capn=0;render()});
 // like ranking
 const rk=await E(()=>{const f=S.feeds[2].id,a=items[f][8];const b=likeScore(a);likeA(a,1);const c=likeScore(a);likeA(a,1);likeA(a,1);return [b,c,likeScore(a)]});
 ck(vp,'more like this raises score',rk[1]>rk[0]&&rk[2]>rk[1],JSON.stringify(rk));
 ck(vp,'undo toast for like',await E(()=>!!document.querySelector('#toast .tundo')));
 await E(()=>document.querySelector('#toast .tundo').click());
 ck(vp,'like undo restores',await E(()=>{const a=items[S.feeds[2].id][8];return likeScore(a)>0}));
 await E(()=>{S.lk=null});
 // 5 minutes
 await E(()=>{S.read={};S.sel='today';render()});
 ck(vp,'5-minute chip on Today',await E(()=>!!document.querySelector('[data-five]')));
 await E(()=>document.querySelector('[data-five]').click());await p.waitForTimeout(400);
 const fm=await E(()=>({sel:S.sel,n:S.brief.links.length,five:S.brief.five,t:S.brief.links.reduce((n,l)=>n+(readMin(findStory(l))||3),0),head:document.querySelector('.bhead h2')&&document.querySelector('.bhead h2').textContent}));
 ck(vp,'5-minute read built',fm.sel==='brief'&&fm.n>=1&&fm.t<=6&&fm.five===1&&/5-minute/.test(fm.head),JSON.stringify(fm));
 // reader menu
 await E(()=>{S.sel='all';render();openReader(cur[0])});await p.waitForTimeout(600);
 ck(vp,'reader menu has like/focus',await E(()=>!!document.querySelector('[data-act="more"]')&&!!document.querySelector('[data-act="focus"]')));
 // trending badge
 await E(()=>{closeRd();const id=S.feeds[0].id,a=items[id][0];a.title='Big merger announced today by giant companies';items[S.feeds[1].id][0].title='Big merger announced today by giant firms';items[S.feeds[2].id][0].title='Big merger announced today by giant companies';S.sel='all';render()});
 ck(vp,'trending badge for 3 outlets',await E(()=>!!document.querySelector('#grid .pw.tr')));
 ck(vp,'settings rows exist',await E(()=>['#pfm','#acmb','#capn','[data-tg="offline"]','[data-tg="dsave"]','[data-tg="pfwifi"]'].every(q=>!!document.querySelector(q))));
 ck(vp,'no page errors',errs.length===0,errs.join('|'));
 await ctx.close();
}
await b.close();console.log('pass',pass,'fail',fail);log.forEach(l=>console.log(l));})();
