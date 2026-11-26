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
    const out=[],add=(src,cap,alt)=>{if(/^https:\/\//.test(src||''))out.push({src,cap:(cap||'').replace(/\s+/g,' ').trim().slice(0,220),alt:(alt||'').slice(0,160)})};
    const og=document.querySelector('meta[property="og:image"],meta[name="twitter:image"]');
    if(og)add(og.getAttribute('content'),'','');
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
   for(const p of ps){
    if(LOGOISH.test(p.src)||/\/(avatar|icon|logo|badge|pixel|1x1)\b/i.test(p.src))continue;
    const d=await new Promise(res=>{const im=new Image();let done=0;
      im.onload=()=>{if(!done++)res({w:im.naturalWidth,h:im.naturalHeight})};
      im.onerror=()=>{if(!done++)res(null)};
      setTimeout(()=>{if(!done++)res(null)},9000);im.referrerPolicy='no-referrer';im.src=p.src});
    if(!d||!d.w)continue;
    const long=Math.max(d.w,d.h),r=d.w/d.h;
    if(long<WE_SM||r<0.4||r>3)continue;
    out.push({...p,w:d.w,h:d.h,long,cover:long>=WE_BIG});
   }
   /* the biggest clean one wins: a cover needs the big file and an inside page is never hurt by one */
   out.sort((a,b)=>b.long-a.long);
   return out[0]||null;
  },ps);

  s.best=await measure(list);
  /* nothing printable of its own, or nothing big enough to open a section: ask the others who were there */
  if((!s.best||!s.best.cover)&&s.sibs.length){
   for(const sb of s.sibs.slice(0,2)){
    const got2=await fromSibling(sb.l);asked++;
    if(!got2.length)continue;
    const b=await measure(got2.map(p=>({...p,outlet:sb.o})));
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

 /* The contact sheet: every candidate at a size a person can judge, numbered, with what the publisher wrote
    under it. One picture to look at instead of forty files to open. */
 const sheet=`<!doctype html><meta charset="utf-8"><style>
  body{margin:0;background:#f6f4ef;font:13px/1.35 system-ui,sans-serif;color:#15202b}
  .g{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;padding:14px}
  figure{margin:0;background:#fff;border:1px solid #d8d3c7;display:flex;flex-direction:column}
  img{width:100%;height:190px;object-fit:cover;display:block;background:#e6e2d8}
  figcaption{padding:7px 9px;display:flex;flex-direction:column;gap:3px}
  b{font-size:15px}.s{color:#6b6559;font-size:11px}.c{font-size:11px;color:#3d4954}
 </style><div class="g">${have.map((s,i)=>`<figure>
   <img src="${s.best.src}" referrerpolicy="no-referrer">
   <figcaption><b>${i+1}. ${s.section}</b>
    <span class="s">${s.best.sib?s.best.sib+' (for '+s.outlet+')':s.outlet} &middot; ${s.best.w}&times;${s.best.h}${s.best.cover?' &middot; cover size':''}</span>
    <span class="c">${(s.title||'').replace(/[<&]/g,'')}</span>
    <span class="s">${((s.best.cap||s.best.alt||'no caption')).replace(/[<&]/g,'').slice(0,120)}</span>
   </figcaption></figure>`).join('')}</div>`;
 fs.writeFileSync(path.join(OUT,'contact.html'),sheet);
 const sheetTab=tab;
 await sheetTab.setViewportSize({width:1280,height:900});
 await sheetTab.goto('file://'+path.resolve(OUT,'contact.html'),{waitUntil:'networkidle'}).catch(()=>{});
 await sheetTab.waitForTimeout(2500);
 await sheetTab.screenshot({path:path.join(OUT,'contact.png'),fullPage:true});

 fs.writeFileSync(path.join(OUT,'photos.json'),JSON.stringify({made:new Date().toISOString(),
   photos:have.map((s,i)=>({no:i+1,link:s.link,title:s.title,outlet:s.outlet,section:s.section,
     url:s.best.src,w:s.best.w,h:s.best.h,cover:!!s.best.cover,from:s.best.sib||s.outlet,
     credit:(s.best.cap||'').trim()||(s.best.alt||'').trim()||s.best.sib||s.outlet}))},null,1));
 console.log('\nwritten: '+path.join(OUT,'photos.json')+' and '+path.join(OUT,'contact.png'));
 console.log('NOTHING IS CLEARED YET. Look at the sheet, then mark each one.');
 await app.close();
})();
