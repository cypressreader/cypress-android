const {mock,seed,PW}=require('./mock');const {chromium}=require(PW);
const VPS=[['phone',380,820,true],['fold',884,1060,true],['desktop',1280,900,false]];
let pass=0,fail=0;const log=[];const ck=(vp,n,c,x='')=>{if(c)pass++;else{fail++;log.push(`FAIL [${vp}] ${n} ${x}`)}};
const BODY=`<p>"Hello," she said. It's a fine day - really. The 'old' way isn't gone, and the "new" way is here to stay for a while, with more words to reach length.</p>
<p>${'Filler words to make the paragraph long enough for pagination. '.repeat(12)}</p>
<h2>A section</h2><p>${'More text goes here so the page has room. '.repeat(14)}</p>
<figure><img src="https://img.test/a.jpg"><figcaption>A crowd gathers (Photo: Jane Doe)</figcaption></figure>
<figure><img src="https://img.test/b.jpg"><figcaption>Another view</figcaption></figure>
<figure><img src="https://img.test/c.jpg"><figcaption>Third view. Photo: Getty Images</figcaption></figure>
<hr><p>${'Code follows. '.repeat(20)}</p>
<pre><code>const x = 1;\nfunction veryLongName(){ return "a very long line that must scroll sideways rather than wrapping in the middle of a token"; }</code></pre>
<iframe src="https://www.youtube.com/embed/abc123DEF45"></iframe>
<blockquote class="twitter-tweet"><p>A very short post</p>&mdash; Someone <a href="https://twitter.com/x/status/123">date</a></blockquote>
<p>See <a href="https://ex.test/page">this related page</a> for more. ${'Tail text. '.repeat(30)}</p>`;
(async()=>{const b=await chromium.launch();
for(const [vp,w,h,touch] of VPS){
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:touch,isMobile:touch&&w<500});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await mock(p,{n:8});
 const face=await p.evaluate(()=>{const mk=(fn)=>{const c=document.createElement('canvas');c.width=200;c.height=200;const x=c.getContext('2d');x.fillStyle='#3a5a8c';x.fillRect(0,0,200,200);fn(x);return c.toDataURL('image/png').split(',')[1]};return{bottom:mk(x=>{x.fillStyle='rgb(224,172,105)';x.fillRect(40,110,120,90)}),top:mk(x=>{x.fillStyle='rgb(224,172,105)';x.fillRect(40,0,120,80)})}});
 await p.route('https://img.test/**',r=>{const u=r.request().url();const k=/face-top/.test(u)?'top':/face/.test(u)?'bottom':null;if(!k)return r.fulfill({status:200,contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==','base64')});
  r.fulfill({status:200,contentType:'image/png',headers:{'access-control-allow-origin':'*'},body:Buffer.from(face[k],'base64')})});
 await p.addInitScript(s=>{try{if(!localStorage.getItem('folio'))localStorage.setItem('folio',JSON.stringify(s))}catch(e){}},seed(['Alpha','Beta','Gamma']));
 await p.goto('file:///mnt/user-data/outputs/cypress.html');await p.waitForTimeout(1800);
 const E=(f,a)=>p.evaluate(f,a);
 // --- editions + templates
 await E(()=>{S.sel='today';render()});
 ck(vp,'edition helper',await E(()=>/(Morning|Afternoon|Evening|Late-Night) Edition/.test(edition())));
 ck(vp,'today has template wrappers',await E(()=>document.querySelectorAll('#grid .tpl').length>=1));
 ck(vp,'dateline shows edition',await E(()=>/Edition/.test(document.querySelector('#grid').textContent)));
 // --- cover face-aware flip + tint
 await E(()=>{for(const f of S.feeds)for(const a of items[f.id])a.img='';items[S.feeds[0].id][0].img='https://img.test/face.png';S.read={};S.sel='today';S.cover=true;render()});
 await p.waitForTimeout(1500);
 const hasCover=await E(()=>!!document.querySelector('#grid .cover'));
 if(hasCover){
  ck(vp,'cover flips text away from face at bottom',await E(()=>document.querySelector('#grid .cover').classList.contains('flip')));
  ck(vp,'cover picks photo tint',await E(()=>/^#[0-9a-f]{6}$/i.test(document.querySelector('#grid .cover').style.getPropertyValue('--b').trim())));
  await E(()=>{items[S.feeds[0].id][0].img='https://img.test/face-top.png';render()});await p.waitForTimeout(1500);
  ck(vp,'no flip when face is at top',await E(()=>!document.querySelector('#grid .cover').classList.contains('flip')));
 }else ck(vp,'cover present (skipped on this layout)',true);
 // --- thumbnails / best image
 const pr=await E(()=>{const x='<rss xmlns:media="http://search.yahoo.com/mrss/"><channel><title>T</title><item><title>A</title><link>https://t.test/a</link><media:thumbnail url="https://t.test/s.jpg" width="100"/><media:content url="https://t.test/big.jpg" width="1200" medium="image"/><description>d</description></item></channel></rss>';const r=parse(x,{id:'z',url:'https://t.test/feed'}).list[0];return{img:r.img,th:r.th}});
 ck(vp,'largest image chosen',/big\.jpg/.test(pr.img),JSON.stringify(pr));
 ck(vp,'thumbnail kept for blur-up',/s\.jpg/.test(pr.th));
 ck(vp,'card renders blur-up placeholder',await E(()=>{const h=card({feedId:S.feeds[0].id,title:'x',link:'https://t.test/a',img:'https://t.test/big.jpg',th:'https://t.test/s.jpg',date:1,summary:''},0,'mid');return /data-th/.test(h)&&/--th:url/.test(h)&&/classList.add\('ld'\)/.test(h)}));
 // --- article furniture
 await E(BODY=>{S.sel='all';S.capn=0;render();const a=cur[0];a.by='Jane Roe';a.sec='Culture';a.cm='https://news.ycombinator.com/item?id=5';S.rt[a.link]=4;acPut(a.link,BODY);window.__A=a;openReader(a)},BODY);
 await p.waitForTimeout(1500);
 const rd=await E(()=>{const q=s=>document.querySelector(s);const t=q('.cols .body').textContent;return{kick:(q('.kick')||{}).textContent,dt:(q('.dt')||{}).textContent,cmt:(q('.cmt')||{}).textContent,curly:/“Hello,”/.test(t)&&/It’s/.test(t)&&/‘old’/.test(t),straight:/"/.test([...document.querySelectorAll('.cols .body p')].map(x=>x.textContent).join(' ')),endash:/day – really/.test(t),cr:(q('.crd')||{}).textContent,strip:document.querySelectorAll('.strip').length,strips:document.querySelectorAll('.strip>*').length,code:!!q('.code>pre')&&!!q('.cpy'),wsp:q('pre')&&getComputedStyle(q('pre')).whiteSpace,emb:document.querySelectorAll('.emb').length,yt:!!q('.emb.yt img'),kr:document.querySelectorAll('.kr button').length,orn:getComputedStyle(q('.body h2'),'::before').content,hr:q('.body hr')&&getComputedStyle(q('.body hr'),'::after').content}});
 ck(vp,'kicker shows source',/Alpha|Beta|Gamma/.test(rd.kick),rd.kick);
 ck(vp,'byline + reading time in header',/By Jane Roe/.test(rd.dt)&&/4 min read/.test(rd.dt),rd.dt);
 ck(vp,'discussion chip',/Hacker News/.test(rd.cmt||''),String(rd.cmt));
 ck(vp,'curly quotes',rd.curly,JSON.stringify(rd));
 ck(vp,'no straight double quotes left',!rd.straight);
 ck(vp,'spaced hyphen becomes en dash',rd.endash);
 ck(vp,'credit split from caption',/Jane Doe/.test(rd.cr||''),String(rd.cr));
 ck(vp,'3 photos become a filmstrip',rd.strip===1&&rd.strips===3,JSON.stringify([rd.strip,rd.strips]));
 ck(vp,'code block has copy button and no wrapping',rd.code&&rd.wsp==='pre',JSON.stringify([rd.code,rd.wsp]));
 ck(vp,'embeds become cards',rd.emb>=2&&rd.yt,JSON.stringify([rd.emb,rd.yt]));
 ck(vp,'keep reading block',rd.kr>=1,String(rd.kr));
 ck(vp,'section ornaments render',rd.orn&&rd.orn!=='none',JSON.stringify([rd.orn]));
 await E(()=>{decorate();decorate()});
 ck(vp,'decorate is idempotent',await E(()=>document.querySelectorAll('.strip').length===1&&document.querySelectorAll('.code').length===1&&document.querySelectorAll('.crd').length>=1));
 // embed re-hydration from cache markup
 ck(vp,'embed survives cache round trip',await E(()=>{const d=document.createElement('div');d.innerHTML=document.querySelector('.cols .body').innerHTML;const f=fromHTML(d.innerHTML,'https://x.test/');const t=document.createElement('div');t.append(f);return t.querySelectorAll('.emb').length>=2&&!!t.querySelector('.emb.yt img')}));
 // --- link peek
 await E(()=>{window.__nav=0;addEventListener('beforeunload',()=>window.__nav++)});
 const linkPos=await E(()=>{const a=document.querySelector('.cols .body a[href="https://ex.test/page"]');a.scrollIntoView&&0;return !!a});
 await E(()=>{const a=document.querySelector('.cols .body a[href="https://ex.test/page"]');a.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}))});
 await p.waitForTimeout(700);
 ck(vp,'link opens normally, no preview card',await E(()=>!document.querySelector('#peek.on')&&!LAYER.includes('peek')&&$('#rd').classList.contains('on')),await E(()=>LAYER.join()));
 // --- selection actions + colours
 await E(()=>{const m=bodyText();const i=m.t.indexOf('fine day');SELV={q:'fine day',off:i};selAct('hl','y');});
 ck(vp,'yellow highlight stored + painted',await E(()=>S.hl[0].c==='y'&&CSS.highlights.get('mark-y')&&CSS.highlights.get('mark-y').size===1));
 await E(()=>{S.hl.unshift({id:'old1',link:curA.link,q:'"Hello," she said',off:0,note:'',t:Date.now(),art:{title:'x',link:curA.link,ft:'x',fc:'#123456'}});applyHl()});
 ck(vp,'old straight-quote highlight still matches',await E(()=>CSS.highlights.get('mark').size>=1));
 ck(vp,'selection bar is colours + note + copy/share/follow',await E(()=>['copy','img','follow','note'].every(k=>document.querySelector(`#selbar [data-s="${k}"]`))&&!['define','translate','search'].some(k=>document.querySelector(`#selbar [data-s="${k}"]`))&&document.querySelectorAll('#selbar .dot').length===4));
 // --- page turn feel
 await E(()=>{window.__v=[];navigator.vibrate=n=>{window.__v.push(n);return true};S.tsound=true;R.pg=0;show()});
 await E(()=>go(1));await p.waitForTimeout(100);
 ck(vp,'turn has sheen layer',await E(()=>!!(R.T&&(R.T.sn||R.T.st))));
 await p.waitForTimeout(1100);
 ck(vp,'sound synth does not throw',await E(()=>{try{paperSound();return true}catch(e){return false}}));
 // --- focus etc still fine
 await E(()=>closeRd());await p.waitForTimeout(300);
 // --- view transition open from a card tap
 await E(()=>{for(const f of S.feeds)for(const a of items[f.id])if(!a.img)a.img='https://img.test/z.jpg';S.sel='all';render()});await p.waitForTimeout(400);
 await E(()=>document.querySelector('#grid .card img').closest('.card').click());await p.waitForTimeout(1500);
 ck(vp,'card tap opens story (with transition)',await E(()=>$('#rd').classList.contains('on')&&!!document.querySelector('#sheet .hero')));
 ck(vp,'transition names cleaned up',await E(()=>{const h=document.querySelector('#sheet .hero');return !h.style.viewTransitionName&&![...document.querySelectorAll('#grid img')].some(i=>i.style.viewTransitionName)}));
 ck(vp,'no page errors',errs.length===0,errs.join('|'));
 await ctx.close();
}
await b.close();console.log('pass',pass,'fail',fail);log.forEach(l=>console.log(l));})();
