/* Cover headlines fit: for every cover style, on phone widths, with short and long headlines (including "Australia politics live: PM urged to call Trump about execution livestream" and a headline with one very long word), no headline is cut off ("..." or hidden lines), sticks out of its cover, breaks a word in the middle, or overlaps the masthead or a picture panel. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0,checks=0;const fails=[];
const svg=()=>`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b6ea5"/><stop offset="1" stop-color="#e0a458"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="60%" cy="38%" r="18%" fill="#fde9b8"/></svg>`;
const STYLES0=['type','photo','poster','block','gazette','gallery','spotlight','magazine','broadcast','duotone','index','overlap','cinema','rail','titleseq','chapters','journal','plays','fact','collage','italic'];
const STYLES=process.env.STYLES?process.env.STYLES.split(','):STYLES0;
const PANEL=new Set(['block','gazette','gallery','index','cinema','chapters','journal']);
const HEADS={short:'Markets rally on rate hopes',aus:'Australia politics live: PM urged to call Trump about execution livestream',long:'After 4 Hours, Phantom Blade Zero Just Became My Most-Anticipated Action Game Of The Year, Say Reviewers Who Played It',word:'Internationalization of telecommunications infrastructure accelerates dramatically'};
const SIZES=(process.env.SIZES||'320x568,360x740,412x860,515x900,820x1180').split(',').map(s=>s.split('x').map(Number));
const THEMES=(process.env.THEMES||'').split(',').filter(x=>x!==undefined);
(async()=>{const b=await chromium.launch();
 for(const [W,H] of SIZES){
  const p=await (await b.newContext({viewport:{width:W,height:H}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{n:10});
  await p.route('https://img.test/**',r=>r.fulfill({status:200,contentType:'image/svg+xml',body:svg()}));
  await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(400);
  await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close())});
  for(const [hk,ht] of Object.entries(HEADS).filter(([k])=>!process.env.HEADS||process.env.HEADS.split(',').includes(k)))for(const st of STYLES){
   const r=await p.evaluate(async([st,ht])=>{const w=ms=>new Promise(r=>setTimeout(r,ms));const now=Date.now();
    S.feeds.slice(0,4).forEach((f,fi)=>{items[f.id]=Array.from({length:16},(_,i)=>({feedId:f.id,title:i?'Headline number '+i+' of feed '+fi+' about the subject '+(i*7+fi):ht,link:'https://w.test/'+fi+'/'+i,date:now-(i*55+fi*9+5)*6e4,summary:'A standfirst long enough to serve as a deck for the story in a couple of lines.',img:i<8?'https://img.test/x'+i+'.svg':'',html:''}));state[f.id]='ok'});
    S.cvs=st;S.sel='today';S.cvt={n:0,t:'type',p:''};save();render();await w(500);try{await document.fonts.ready}catch(e){}await w(100);document.querySelector('main').scrollTop=0;
    const cv=document.querySelector('#grid .dcov,#grid .cover');if(!cv)return{none:1};const h=cv.querySelector('.cvlead h2,.dcv-lead h2');if(!h)return{none:2};
    const cr=cv.getBoundingClientRect(),hr=h.getBoundingClientRect(),cs=getComputedStyle(h);const out=[];
    const inter=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
    /* is any line hidden? measure the headline without its clamp and compare with what is shown */
    {const lh=parseFloat(cs.lineHeight)||parseFloat(cs.fontSize)*1.1,shown=h.clientHeight,sv=[h.style.webkitLineClamp,h.style.maxHeight,h.style.overflow,h.style.display];h.style.webkitLineClamp='unset';h.style.maxHeight='none';h.style.overflow='visible';h.style.display='block';const nat=h.getBoundingClientRect().height;h.style.webkitLineClamp=sv[0];h.style.maxHeight=sv[1];h.style.overflow=sv[2];h.style.display=sv[3];
     if(nat>shown+lh*.4)out.push('headline cut off or truncated with ... ('+Math.round(nat/lh)+' lines, '+Math.round(shown/lh)+' shown)')}
    if(h.scrollWidth>h.clientWidth+2)out.push('headline wider than its box');
    /* a word that is wider than the box would be broken */
    const c=document.createElement('canvas').getContext('2d');c.font=cs.fontStyle+' '+cs.fontWeight+' '+cs.fontSize+' '+cs.fontFamily;const inner=h.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);const tt=cs.textTransform==='uppercase'?h.textContent.toUpperCase():h.textContent;
    const lw=Math.max(...tt.split(/\s+/).flatMap(x=>x.split(/(?<=-)/)).map(x=>c.measureText(x).width+(parseFloat(cs.letterSpacing)||0)*x.length));if(lw>inner+3)out.push('a word is wider than the box ('+Math.round(lw)+' > '+Math.round(inner)+')');
    if(hr.left<cr.left-1||hr.right>cr.right+1||hr.bottom>cr.bottom+1||hr.top<cr.top-1)out.push('sticks out of the cover');
    const top=cv.querySelector('.cvtop,.dcv-top');if(top){const t=top.getBoundingClientRect();if(inter(hr,t)>6)out.push('overlaps the masthead')}
    if(!cv.classList.contains('dcov')){const im=cv.querySelector(':scope>img');if(im&&['block','gazette','gallery','index','cinema','chapters','journal'].includes(st)&&getComputedStyle(im).position!=='absolute'){const i=im.getBoundingClientRect();if(inter(hr,i)>6)out.push('overlaps the picture')}}
    return{out,fs:parseFloat(cs.fontSize),h:Math.round(cr.height),lines:Math.round(hr.height/(parseFloat(cs.lineHeight)||parseFloat(cs.fontSize)))}},[st,ht]);
   process.stdout.write(st+'/'+hk+' ');checks++;if(r.none){fails.push(`${W}x${H} ${st}/${hk}: no cover rendered (${r.none})`);bad++;continue}
   if(r.out.length){bad++;fails.push(`${W}x${H} ${st}/${hk} (${r.fs.toFixed(0)}px): ${r.out.join('; ')}`)}
  }
  if(errs.length){bad++;fails.push(W+': page error '+errs[0])}
  await p.context().close()}
 await b.close();fails.slice(0,60).forEach(f=>console.log('FAIL',f));if(fails.length>60)console.log('... and',fails.length-60,'more');
 console.log('cover_fit',bad?bad+' of '+checks+' FAILED':'all '+checks+' passed');process.exit(bad?1:0)})();
