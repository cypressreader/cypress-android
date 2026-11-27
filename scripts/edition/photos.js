/* World Edition, pass 4: find a picture for every story, and make them easy to look at before any is printed.
 *
 * A magazine is its pictures as much as its words. The app will only print one that carries every clearance
 * mark (`clear` in WORLD-EDITION-FORMAT.md: logo, text, child, body, grief, mugshot), and those marks can only
 * come from something that has actually looked at the picture. This does the part a machine can do on its own
 * and then lays the survivors out so the looking is one glance instead of forty.
 *
 * The cheap checks first, in this order, because each one is free and throws away most of the work:
 *   - https, and not an address that names itself a logo, placeholder, sprite, avatar or tracking pixel
 *     (the app's own LOGOISH list - no second list to keep in step)
 *   - big enough: 1,600px on the long edge to be a cover, 600 inside (the app's own WE_BIG / WE_SM)
 *   - a sane shape: between 2:5 and 3:1, so banners and slivers go
 *   - measured for real by loading it, never trusted from the markup
 *
 * What comes out: photos.json (one candidate per story, with its true size and the publisher's caption) and
 * contact.png, a numbered contact sheet. Nothing is marked clear here. That is the next step and it is done by
 * eye, which is the whole point of the pass.
 *
 *   node scripts/edition/photos.js --gathered got.json --candidates cand.json --out tmp/photos
 *
 * ---------------------------------------------------------------------------------------------------------
 * THE SIX MARKS, AND WHAT EACH ONE MEANS. Written here because this is the file that prepares the looking, and
 * because a rule that lives in somebody's head drifts. Whoever or whatever clears a picture - MJ, a session,
 * David - answers these six questions about it, and `clear` lists only the ones it passes. The app prints a
 * photograph only when all six are there (`wePhotoOk` / `WE_CLEAR`), so a missing mark is simply no picture.
 *
 *   logo     Is the picture a logo, wordmark, badge, app icon or press handout dominated by one? A brand on a
 *            shirt or a van inside a real scene is fine; a picture that IS the brand is not.
 *   text     Are there words burned into the image that the page would print as if they were ours - a headline
 *            card, a quote graphic, a titled chart, a poster, a slide, a meme? Incidental words in the world
 *            (a street sign, a shop front, a protest placard in a crowd) are fine.
 *   child    Is anyone who looks under about sixteen identifiable in the frame? A crowd at a distance where no
 *            face reads is fine.
 *   body     A dead or injured body, blood, a covered corpse, a coffin with the body visible, or a person in
 *            visible physical distress from violence or disaster.
 *   grief    A person crying, mourning, being comforted; a funeral; the moment of loss. We do not print
 *            somebody's worst day as decoration on a page.
 *   mugshot  A police booking photograph, handcuffs, a perp walk, a court dock, a wanted poster.
 *
 * `people:false` is separate and says NO identifiable person is the subject of the frame. It is required when
 * the headline accuses somebody (`WE_ACCUSE` in the app), so that a story about a charge never runs a face.
 *
 * THE BIAS IS DELIBERATE AND IT IS NOT SYMMETRIC. Wrongly clearing a picture publishes a mugshot or a grieving
 * face. Wrongly refusing one costs a bare page, which this magazine already treats as the correct outcome when
 * in doubt. So the eye does not need to be perfect, it needs to be CAUTIOUS: anything you are unsure about
 * gets no mark, and a picture with no marks does not print. Never guess in favour of printing.
 * ---------------------------------------------------------------------------------------------------------
 */
const fs=require('fs'),path=require('path'),{openApp}=require('./app');

const arg=n=>{const i=process.argv.indexOf(n);return i>0?process.argv[i+1]:null};
const GOT=arg('--gathered'),CAND=arg('--candidates'),OUT=arg('--out')||'photos-out';
if(!GOT){console.log('need --gathered <file from gather.js>');process.exit(1)}
fs.mkdirSync(OUT,{recursive:true});

const got=JSON.parse(fs.readFileSync(GOT,'utf8'));
const cand=CAND?JSON.parse(fs.readFileSync(CAND,'utf8')):null;
/* the picture the feed carried, where there was one: often the publisher's own lead image, already sized */
const feedPic={},sibs={};
if(cand)for(const s of cand.sections||[])for(const st of s.stories||[]){
 if(st.img)feedPic[st.l]=st.img;
 if(st.sibs&&st.sibs.length)sibs[st.l]=st.sibs;
}

(async()=>{
 const app=await openApp(),page=app.page;

 const stories=(got.kept||[]).map(k=>({link:k.link,title:k.title,outlet:k.outlet,section:k.section,
   sibs:sibs[k.link]||[],
   pics:[...(feedPic[k.link]?[{src:feedPic[k.link],cap:'',alt:'',fromFeed:1}]:[]),...(k.pics||[])]}));

 /* THE OTHER OUTLETS WHO COVERED IT. A story whose own page gave nothing printable is not a story without a
    picture: two or three other newsrooms covered the same event, each with its own photographer. Their pages
    are opened in a tab of their own and read for the picture the publisher put at the top - the share image
    and the article's own figures, with the caption the publisher wrote under it. Only for stories that need
    one, at most two siblings each, so the run does not double in length for pictures it already has. */
 const tab=await app.ctx.newPage();
 async function fromSibling(u){
  try{
   await tab.goto(u,{waitUntil:'domcontentloaded',timeout:20000});
   await tab.waitForTimeout(800);
   return await tab.evaluate(()=>{
    const out=[],add=(src,cap,alt,og)=>{if(/^https:\/\//.test(src||''))out.push({src,og:!!og,cap:(cap||'').replace(/\s+/g,' ').trim().slice(0,220),alt:(alt||'').slice(0,160)})};
    const og=document.querySelector('meta[property="og:image"],meta[name="twitter:image"]');
    if(og)add(og.getAttribute('content'),'','',1);
    for(const f of [...document.querySelectorAll('figure')].slice(0,4)){
     const im=f.querySelector('img'),c=f.querySelector('figcaption');
     if(im)add(im.getAttribute('src')||im.getAttribute('data-src'),c&&c.textContent,im.getAttribute('alt'));
    }
    return out;
   });
  }catch(e){return[]}
 }

 let n=0,asked=0;
 for(const s of stories){
  /* measured in the page: the app's own junk-address rule first, then the picture is actually loaded, because
     a publisher's markup lies about size more often than not */
  const seen=new Set();
  const list=s.pics.filter(p=>{const k=p.src.split(/[?#]/)[0];if(seen.has(k))return false;seen.add(k);return true}).slice(0,12);
  const measure=async ps=>page.evaluate(async ps2=>{
   const out=[];
   for(const p of ps2){
    if(LOGOISH.test(p.src)||/\/(avatar|icon|logo|badge|pixel|1x1)\b/i.test(p.src))continue;
    const d=await new Promise(res=>{const im=new Image();let done=0;
      im.onload=()=>{if(!done++)res({w:im.naturalWidth,h:im.naturalHeight})};
      im.onerror=()=>{if(!done++)res(null)};
      setTimeout(()=>{if(!done++)res(null)},9000);im.referrerPolicy='no-referrer';im.src=p.src});
    if(!d||!d.w)continue;
    const long=Math.max(d.w,d.h),r=d.w/d.h;
    if(long<WE_SM||r<0.4||r>3)continue;
    /* WHICH PICTURE A MAGAZINE WOULD CHOOSE, among the ones that are clean enough to print.
       Biggest is not the same as best, so size is only the start:
       - a share card is not a photograph. An address that says og, social, share, card or twitter is the
         picture a publisher made for a link preview, and it usually has the headline printed across it;
       - a page's own figure, with the caption the publisher wrote under it, beats a bare image with none;
       - a section opener is a wide page, so a landscape picture opens it and a portrait fights it;
       - and the file still has to be big enough to print across that page. */
    const card=/\b(og|social|share|card|twitter|meta|preview|thumb)\b|[?&](w|width)=(\d{2,3})\b/i.test(p.src)&&!p.cap;
    let score=Math.min(long,4000)/1000;          /* size, but with a ceiling: 4,000px is not twice as good as 2,000 */
    if(p.cap)score+=1.2;                          /* the publisher wrote a caption under it: it is a picture of the story */
    if(!p.fromFeed&&!p.og)score+=.3;              /* the article's own figure rather than the feed's thumbnail */
    if(card)score-=1.5;
    if(r>=1.2&&r<=2.2)score+=.8;                  /* a landscape that fits a page */
    else if(r<1)score-=.6;                        /* a portrait on a page built wide */
    out.push({...p,w:d.w,h:d.h,long,score,card,cover:long>=WE_BIG&&r>=1.1&&!card});
   }
   /* best first, and the size rule still decides what may open a section */
   out.sort((a,b)=>b.score-a.score);
   return out;/* the winner opens the story; the rest are what a long read can carry inside it */
  },ps);

  s.all=await measure(list);s.best=s.all[0]||null;
  /* nothing printable of its own, or nothing big enough to open a section: ask the others who were there */
  if((!s.best||!s.best.cover)&&s.sibs.length){
   for(const sb of s.sibs.slice(0,2)){
    const got2=await fromSibling(sb.l);asked++;
    if(!got2.length)continue;
    const b=(await measure(got2.map(p=>({...p,outlet:sb.o}))))[0];
    if(b&&(!s.best||b.long>s.best.long)){s.best={...b,outlet:sb.o,sib:sb.o};}
    if(s.best&&s.best.cover)break;
   }
  }
  process.stdout.write(s.best?(s.best.sib?'s':'.'):'x');n++;
 }
 process.stdout.write('\n');

 const have=stories.filter(s=>s.best);
 console.log(have.length+' of '+stories.length+' stories have a picture that passes the cheap checks ('
  +have.filter(s=>s.best.sib).length+' of them from another outlet that covered the story, '+asked+' sibling pages opened)');
 for(const s of have)console.log('  '+String(s.best.w+'x'+s.best.h).padStart(10)+(s.best.cover?' COVER':'      ')+'  '+s.section.padEnd(17)+s.title.slice(0,48));

 /* THE PICTURES INSIDE A LONG READ. The opener takes the best picture; a long read may also carry two or
    three from the body, where the publisher had them. The rules are mechanical, and they exist because the
    raw list is mostly furniture - one story offered twelve pictures all sitting after paragraph 23, which is
    a related-articles strip, not the article:
      - the section must be one that may carry them (the app holds the same list as WE_INL_OK);
      - the publisher must have written a caption under it - that caption becomes the credit the app requires,
        and a picture nobody captioned is usually furniture;
      - never a share card, never the one already opening the story;
      - `after` (how many paragraphs stood before it) must be a real position in the body;
      - THREE OR MORE SHARING ONE POSITION IS A STRIP, and the whole cluster goes;
      - at most three, and never two within two paragraphs of each other, so they are spread through the read.
    They are still only CANDIDATES: like every picture, each one needs its six marks before it can print. */
 const INL_OK=new Set(['Long read']);
 for(const s of have){
  if(!INL_OK.has(s.section))continue;
  const by={};(s.all||[]).forEach(p=>{if(p.after>0)by[p.after]=(by[p.after]||0)+1});
  const body=(s.all||[]).filter(p=>p!==s.best&&p.cap&&!p.card&&p.after>0&&by[p.after]<3)
    .sort((a,b)=>a.after-b.after);
  const keep=[];for(const p of body){if(keep.length>=3)break;if(keep.length&&p.after-keep[keep.length-1].after<2)continue;keep.push(p)}
  s.inl=keep;
 }
 const inls=have.flatMap(s=>(s.inl||[]).map(p=>({s,p})));
 if(inls.length)console.log(inls.length+' picture'+(inls.length===1?'':'s')+' offered from inside long reads');

 /* one numbered list for the sheet and for photos.json, so a verdict about number 7 means number 7 in both */
 const cards=[...have.map(s=>({s,p:s.best,kind:'opener'})),...inls.map(x=>({s:x.s,p:x.p,kind:'inline'}))]
   .map((c,i)=>({...c,no:i+1}));

 /* The contact sheet: every candidate at a size a person can judge, numbered, with what the publisher wrote
    under it. One picture to look at instead of forty files to open. */
 const sheet=`<!doctype html><meta charset="utf-8"><style>
  body{margin:0;background:#f6f4ef;font:13px/1.35 system-ui,sans-serif;color:#15202b}
  .g{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;padding:14px}
  figure{margin:0;background:#fff;border:1px solid #d8d3c7;display:flex;flex-direction:column}
  img{width:100%;height:190px;object-fit:cover;display:block;background:#e6e2d8}
  figcaption{padding:7px 9px;display:flex;flex-direction:column;gap:3px}
  b{font-size:15px}.s{color:#6b6559;font-size:11px}.c{font-size:11px;color:#3d4954}
 </style><div class="g">${cards.map(({s,p,kind,no})=>`<figure>
   <img src="${p.src}" referrerpolicy="no-referrer">
   <figcaption><b>${no}. ${s.section}${kind==='inline'?' &middot; inside the story':''}</b>
    <span class="s">${p.sib?p.sib+' (for '+s.outlet+')':s.outlet} &middot; ${p.w}&times;${p.h}${p.cover?' &middot; cover size':''}${kind==='inline'?' &middot; after paragraph '+p.after:''}</span>
    <span class="c">${(s.title||'').replace(/[<&]/g,'')}</span>
    <span class="s">${((p.cap||p.alt||'no caption')).replace(/[<&]/g,'').slice(0,120)}</span>
   </figcaption></figure>`).join('')}</div>`;
 fs.writeFileSync(path.join(OUT,'contact.html'),sheet);
 const sheetTab=tab;
 await sheetTab.setViewportSize({width:1280,height:900});
 await sheetTab.goto('file://'+path.resolve(OUT,'contact.html'),{waitUntil:'networkidle'}).catch(()=>{});
 await sheetTab.waitForTimeout(2500);
 await sheetTab.screenshot({path:path.join(OUT,'contact.png'),fullPage:true});

 fs.writeFileSync(path.join(OUT,'photos.json'),JSON.stringify({made:new Date().toISOString(),
   photos:cards.map(({s,p,kind,no})=>({no,kind,link:s.link,title:s.title,outlet:s.outlet,section:s.section,
     url:p.src,w:p.w,h:p.h,cover:!!p.cover,from:p.sib||s.outlet,...(kind==='inline'?{after:p.after}:{}),
     credit:(p.cap||'').trim()||(p.alt||'').trim()||p.sib||s.outlet}))},null,1));
 console.log('\nwritten: '+path.join(OUT,'photos.json')+' and '+path.join(OUT,'contact.png'));
 console.log('NOTHING IS CLEARED YET. Look at the sheet, then mark each one.');
 await app.close();
})();
