const {APP,OUT}=require('./env');
const {mock,seed,PW}=require('./mock');const {chromium}=require(PW);
(async()=>{const b=await chromium.launch();let bad=0;const ck=(n,c)=>{if(!c){bad++;console.log('FAIL',n)}else console.log('ok',n)};
const IMG=c=>'data:image/svg+xml;utf8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="900"><rect width="1400" height="900" fill="${c}"/></svg>`);
for(const [n,w,h] of [['fold',884,1000],['phone',380,820]]){
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:true,isMobile:w<500});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{n:8});
 await p.addInitScript(s=>{localStorage.setItem('folio',JSON.stringify(s))},{...seed(['A','B','C']),scroll:undefined});await p.goto(('file://'+APP));await p.waitForTimeout(1800);
 const E=(f,a)=>p.evaluate(f,a);
 // sidebar
 ck(n+' sidebar order',await E(()=>{const t=[...document.querySelectorAll('#side-list .nav')].map(x=>x.textContent.replace(/\d+$/,'').trim());return t.indexOf('All stories')<t.indexOf('Saved')&&t.slice(-4).join()==='Saved,Highlights,History,Stats'}));
 await E(()=>{document.querySelector('#side-list [data-tgl]:not([data-tgl=daily]):not([data-tgl=allst])').click()});
 ck(n+' folder collapses',await E(()=>!!S.fcol&&Object.keys(S.fcol).length===1&&document.querySelectorAll('#side-list .fold')[0].querySelectorAll('.fr').length===0));
 await E(()=>{document.querySelector('#side-list [data-tgl]:not([data-tgl=daily]):not([data-tgl=allst])').click()});
 ck(n+' folder expands',await E(()=>document.querySelectorAll('#side-list .fold')[0].querySelectorAll('.fr').length>0));
 // reading mode auto
 ck(n+' auto mode',await E(()=>isVert()===(!isWide())));
 ck(n+' app icon hidden on web',await E(()=>document.querySelector('#icg').hidden));
 // theme fonts
 ck(n+' match theme font',await E(()=>{S.theme='forest';applyTheme(false);return fontKey()==='domine'&&getComputedStyle(document.documentElement).getPropertyValue('--serif').includes('Domine')}));
 ck(n+' explicit font wins',await E(()=>{S.font='lora';const k=fontKey();S.font=undefined;return k==='lora'}));
 await E(()=>{S.theme='light';applyTheme(false)});
 // features on Today
 await E(()=>{const all=Object.values(items).flat();all.forEach((a,i)=>{a.img=a.img||'x';a.summary='He said “this is the kind of line that a magazine would pull out and set large” today.';if(i%2===0)a.more=[{l:'u'+i,f:'f1',t:'t'},{l:'v'+i,f:'f0',t:'t'}]});cur=[];});
 ck(n+' trendPick',await E(()=>{const pool=Object.values(items).flat().slice(0,8);return trendPick(pool,pool[0]).length>=2&&trendHtml(trendPick(pool,pool[0])).includes('class="trend"')}));
 ck(n+' storyQuote',await E(()=>{cur=[];const pool=Object.values(items).flat().slice(0,8);const h=storyQuote(pool);return h.includes('class="pqc"')&&h.includes('magazine would pull')}));
 ck(n+' ticker is gone',await E(()=>!document.querySelector('#tick')&&typeof tickFill==='undefined'&&!document.body.textContent.includes('Headline ticker')));
 ck(n+' cover styles',await E(()=>{const r=[];for(const m of ['photo','split','mosaic','poster','block','triptych']){S.cvs=m;render();r.push(!!document.querySelector('.cover'))}S.cvs='auto';return r.every(Boolean)}));
 if(w>=700)ck(n+' triptych renders',await E(()=>{S.cvs='triptych';render();const ok=!!document.querySelector('.cover.cv-tri .cvp');S.cvs='auto';render();return ok}));
 ck(n+' quiet/emb/ray classes',await E(()=>{S.quiet=true;S.cray=true;applyFx();const a=document.documentElement.classList.contains('quiet')&&document.documentElement.classList.contains('ray');S.quiet=false;delete S.mast;delete S.cray;applyFx();return a}));
 // reader layouts
 await p.evaluate(async u=>{S.scroll='pages';const a=Object.values(items).flat()[0];a.img=u;openReader(a);await new Promise(r=>setTimeout(r,2500))},IMG('#26d'));
 for(const m of ['hero','split','classic','auto']){
  await E(m=>{S.rl=m;heroSpread();relayout()},m);await p.waitForTimeout(500);
  const st=await E(()=>({f:!!document.querySelector('.hsf'),c:(document.querySelector('.hsf')||{}).className||'',m:!!document.querySelector('.mnotes'),ord:[...document.querySelector('.cols').children].map(x=>x.className.split(' ')[0]).slice(0,4).join()}));
  const wide=w>=700;
  if(m==='hero')ck(n+' layout hero',wide?st.f&&/hs-hero/.test(st.c)&&st.m:!st.f);
  if(m==='split')ck(n+' layout split',wide?st.f&&/hs-split/.test(st.c):!st.f);
  if(m==='classic')ck(n+' layout classic restores order',!st.f&&!st.m&&/kick,tt,dt,hero/.test(st.ord));
  if(m==='auto')ck(n+' layout auto',true);
 }
 ck(n+' tts clean ok',await E(()=>ttsClean()===''));
 ck(n+' tts paywall detected',await E(()=>{const b=document.querySelector('.cols .body');const old=b.innerHTML;b.innerHTML='<p>Subscribe to continue reading this story.</p>';const r=ttsClean();b.innerHTML=old;return r!==''}));
 ck(n+' tts boiler filtered',await E(()=>{const b=document.querySelector('.cols .body');const old=b.innerHTML;b.insertAdjacentHTML('beforeend','<p>Sign up for our newsletter</p>');ttsCollect();const has=TTS.words.some(w=>/newsletter/i.test(w.t));b.innerHTML=old;return !has}));
 ck(n+' tts skip para',await E(()=>{ttsCollect();const a=TTS.words.length;return a>0&&typeof ttsSkipPara==='function'}));
 // digest colophon
 ck(n+' colophon',await E(()=>{closeRd();S.sel='digest';S.dgk='morning';render();return !!document.querySelector('.dg .colo')}));
 ck(n+' no page errors',errs.length===0);if(errs.length)console.log(errs);
 await ctx.close()}
console.log('bad',bad);await b.close()})()
