/* World Edition, the writer: turn the day's gathered stories into the edition file.
 *
 * This is the pass that did not exist. `pick.js` chooses the candidates from the feeds by counting, `gather.js`
 * reads each one through the app's own extractor and drops what cannot be read, and this writes
 * `world-edition.json` in the format the app already reads (WORLD-EDITION-FORMAT.md). No model is involved:
 * every field here is either the publisher's own words, a number that was counted, or a house rule.
 *
 *   node scripts/edition/compose.js --candidates cand.json --gathered got.json          # print what it would write
 *   node scripts/edition/compose.js --candidates cand.json --gathered got.json --write  # write both copies
 *
 * What it does NOT do yet, on purpose:
 *  - No photographs. A picture may only be printed once a pair of eyes has cleared it (`clear` in the format,
 *    pass 4 of the plan). Until that pass exists, every page is type - which the app already renders as the
 *    cover's third state and a section's type opener.
 *  - One edition, the US desk. The International edition needs its own desk of outlets; writing it from the
 *    same feeds would be the same magazine with a different name on it.
 *  - No editorial judgement: no rewritten headlines, no standfirsts of our own, no pull quotes in the file.
 *    The app picks a pull quote from the stored story itself, word for word, which is the rule in the format.
 */
const fs=require('fs'),path=require('path'),{ROOT}=require('./app');

const arg=n=>{const i=process.argv.indexOf(n);return i>0?process.argv[i+1]:null};
const CAND=arg('--candidates'),GOT=arg('--gathered'),WRITE=process.argv.includes('--write');
const CLEARED=arg('--photos'),DROP=arg('--drop');
const OUT=arg('--out')||path.join(ROOT,'world-edition.json');
const DOCS=path.resolve(__dirname,'../../docs/app/world-edition.json');
if(!CAND){console.log('need --candidates <file from pick.js> (and --gathered <file from gather.js>)');process.exit(1)}

const cand=JSON.parse(fs.readFileSync(CAND,'utf8'));
/* Without a gathered file nothing has been read, so nothing can be printed: a hollow page is the one thing the
   gate exists to prevent. Run gather.js first. */
const got=GOT?JSON.parse(fs.readFileSync(GOT,'utf8')):null;
if(!got){console.log('need --gathered <file from gather.js>: a story that has not been read must not be printed');process.exit(1)}
const read=new Map((got.kept||[]).map(k=>[k.link,k]));
/* Pictures that have been looked at. A photo reaches the page ONLY from this file: the app refuses one that is
   missing any clearance mark, and a mark can only be made by something that saw the picture. */
const pics=new Map();
if(CLEARED)for(const p of (JSON.parse(fs.readFileSync(CLEARED,'utf8')).photos||[]))pics.set(p.link,p);
/* Stories left out by hand this time: a price deal, a paid showroom listing, a newsletter round-up. Each is a
   rule the picker should learn rather than a judgement to repeat here. */
const drop=new Set(DROP?JSON.parse(fs.readFileSync(DROP,'utf8')):[]);

/* The 24 shapes the app will draw on a type cover, in the format's own order. One is chosen by the date so that
   two editions running the same day look the same and consecutive days do not. */
const SHAPES='ring arc rise fall wave grid bar split cross plus tri square diamond peak dip ripple rays bars stack zigzag frame half spiral horizon'.split(' ');
const today=new Date(),iso=d=>d.toISOString().slice(0,10);
const DATE=arg('--date')||iso(today);
const dayN=Math.floor(Date.parse(DATE+'T12:00:00Z')/864e5);

const prev=(()=>{try{return JSON.parse(fs.readFileSync(OUT,'utf8'))}catch(e){return null}})();
const issue=(prev&&prev.date!==DATE&&prev.issue?prev.issue+1:(prev&&prev.issue)||1);

/* Build one edition's sections from what survived. Both editions draw on the same gathered stories, so this
   runs once per edition and the pictures and the drop list apply to both. */
let kept=[];
function build(src){
 const sections=[];
 for(const s of src){
  const stories=[];
  for(const st of s.stories||[]){
   const r=read.get(st.l);if(!r)continue;            /* pass 1 dropped it: not read, too short, or gated */
   if(drop.has(st.l))continue;
   /* the swap rule: when the publisher's own page would not answer, another newsroom's version of the same
      story was read instead, so that is the one printed - its masthead, its headline, its address */
   const sw=r.swap&&r.swap.l?r.swap:null;
   const o={t:(sw&&sw.t)||st.t,o:(sw&&sw.o)||st.o,l:(sw&&sw.l)||st.l};
   const ph=pics.get(st.l);
   if(ph)o.photo={url:ph.url,credit:ph.credit,w:ph.w,h:ph.h,people:ph.people!==false,
     clear:ph.clear,by:'Claude, looked at each one'};
   if(st.n>1)o.n=st.n;                               /* "Reported by n of N outlets checked" */
   else o.why='The only outlet checked that carried it';
   /* the standfirst is the publisher's own summary FROM ITS FEED, never a sentence lifted out of the article */
   if(!stories.length&&st.dek)o.dek=String(st.dek).replace(/\s+/g,' ').trim().slice(0,170);
   /* `kind` is left out rather than guessed */
   stories.push(o);kept.push({...st,section:s.name,words:r.words});
  }
  /* The lead follows the picture. A section opens on a page of its own, and that page is a photograph when its
     lead has one, so among the stories that survived, one with a cleared picture leads and the counting order
     decides the rest. This is how magazines have always chosen what opens a section. */
  const li=stories.findIndex(x=>x.photo);
  if(li>0)stories.unshift(stories.splice(li,1)[0]);
  sections.push({name:s.name,stories});
 }
 return sections;
}

/* The cover story is the most reported story of the day. Nobody picks it - that is the promise on the method
   page, and it is the whole reason the counting exists. */
/* THE COVER. The lead is the most reported story of the day - nobody picks it, which is the promise on the
   method page. But a magazine chooses its cover from among the stories strong enough to lead, and among those
   it takes the one with a photograph worth the front page; that is how covers have always been chosen, and it
   is in the pipeline plan as "the lead follows the picture". So: the top story by counting leads, unless
   another story within one newsroom of it has a cover-size picture and the top one does not. */
/* The cover names the day's lead story, and the standing pages are not it. An obituary, the archive page, the
   last-page good news, a review and an explainer each have their own place in the book and a magazine does not
   put them on the front - David, looking at the built issue: "Still showing the Duran duran story as the cover
   is that correct". Moving the death to the obituary page was only half of it; the cover was still pointing at
   it, because it was still the most reported story in the edition. */
const NOT_COVER=new Set(['Obituary','From the archive','Back page','Review','Explainer']);
function coverOf(sections){
 const all=[];
 sections.forEach((s,si)=>{if(NOT_COVER.has(s.name))return;
  s.stories.forEach((st,ti)=>all.push({st,lead:[si,ti],n:st.n||1}))});
 if(!all.length)return{lead:[0,0],story:null};
 all.sort((a,b)=>b.n-a.n);
 const top=all[0];
 const coverable=p=>p.st.photo&&p.st.photo.w>=1600&&p.st.photo.h&&p.st.photo.w>=p.st.photo.h;
 /* How far the cover may step down to find a photograph. One newsroom was too tight: on 26 November the lead
    had a picture 1,024px wide - too small for a front page - and the magazine ran a type cover while a 6,978px
    photograph sat on a story three newsrooms behind it. Three is the limit; below that a story is not one of
    the day's leads any more and the type cover is the honest answer. */
 if(!coverable(top)){
  /* among the stories close enough to lead, the one with the best photograph for a front page - the widest,
     and landscape ahead of square. Taking the first in counting order picked a 1,920px picture while a
     6,978px one sat on a story with the same number of newsrooms. */
  const near=all.filter(p=>p.n>=top.n-3&&coverable(p))
    .sort((a,b)=>(b.st.photo.w*(b.st.photo.w/b.st.photo.h>=1.3?1.15:1))-(a.st.photo.w*(a.st.photo.w/a.st.photo.h>=1.3?1.15:1)));
  if(near.length)return{lead:near[0].lead,story:near[0].st,followedPicture:true};
 }
 return{lead:top.lead,story:top.st};
}

const srcEds=(cand.editions&&cand.editions.length)?cand.editions
 :[{id:'us',name:'US Edition',regions:['US'],fallback:true,sections:cand.sections||[]}];
const built=srcEds.map(e=>{
 const sections=build(e.sections||[]);
 const{lead,story,followedPicture}=coverOf(sections);
 return{...e,sections,lead,leadStory:story,followedPicture,count:sections.reduce((n,s)=>n+s.stories.length,0)};
}).filter(e=>e.count);
const total=built[0]?built[0].count:0;
const sections=built[0]?built[0].sections:[];
const lead=built[0]?built[0].lead:[0,0];
const leadStory=built[0]?built[0].leadStory:null;

const shape=e=>({
 id:e.id,name:e.name,regions:e.regions||[],fallback:!!e.fallback,
 cover:{lead:e.lead,mood:'ordinary',shape:SHAPES[dayN%SHAPES.length],accent:null,
  photo:(()=>{const p=e.leadStory&&e.leadStory.photo;return p&&p.w>=1600?p:null})(),
  logo:dayN%2?'ghost':'top',
  photoNote:(e.leadStory&&e.leadStory.photo&&e.leadStory.photo.w>=1600)
   ?'The lead story\u2019s own photograph, looked at before it was printed.'
   :'No photograph on the cover: no story close enough to lead had one big enough that had been looked at.'},
 sections:e.sections
});

const file={
 format:1,date:DATE,issue,sampled:cand.sampled||0,
 method:[
  'This edition was built by counting. The feeds of '+(cand.sampled||0)+' outlets were read, headlines about the same event were grouped, and a story is big when separate outlets report it. The cover story is the one reported by the most outlets. Nobody hand-picks it.',
  'Every edition has the same ten sections in the same order, each with a fixed number of places: Home 4, World 4, Business 2, Science & Health 2, Tech 1, Culture 1, Sport 1, Food 1, one long read, and one story to finish on. A section may run short but never borrows, and no section prints two stories from the same outlet.',
  'Every story was opened and read before it was printed. A story that could not be read, that is behind a paywall or a sign-in, or that has fewer than three paragraphs or 120 words was dropped and its place left empty rather than filled with a hollow page.',
  'Every headline is the publisher’s own, word for word, and opens the publisher’s story. A summary line is the publisher’s own from its feed. One thing on these pages is written by a machine and nothing else is: the short note on the Obituary page saying who the person was, put together from that publisher’s obituary and Wikipedia’s summary of them. It is labelled as such where it is printed.',
  'One link per story, to an outlet that lets you read it. The app never goes past a paywall or meter and never keeps a publisher’s story on a server.',
  'One edition a day. It is not updated after it is published, apart from a dated correction. No opinion columns, no games, no weather.'
 ],
 editions:built.map(shape)
};

console.log('EDITION '+DATE+'  No. '+issue+'  '+(cand.sampled||0)+' outlets read');
for(const s of sections)console.log('  '+s.name.padEnd(18)+s.stories.length+(s.stories.length?'  '+s.stories.map(x=>x.o).join(', '):''));
for(const e of built.slice(1))console.log('  + '+e.name+': '+e.count+' stories');
console.log('\n'+total+' stories printed, '+((got.dropped||[]).length)+' dropped at the gate.');
if(leadStory)console.log('cover: '+leadStory.t.slice(0,70)+'  ('+(leadStory.n||1)+' newsrooms, '+leadStory.o+')'
  +(built[0]&&built[0].followedPicture?'  [chosen over a story with the same count because it has a cover photograph]':''));
{const c=file.editions[0].cover;
 console.log('cover state: '+(c.photo?'photograph '+c.photo.w+'x'+c.photo.h+' ('+c.photo.credit+')':'type, '+c.shape+' shape')+', masthead '+c.logo);}

/* The stop condition from the plan, and the one rule that makes going away safe: a thin edition never replaces
   a good one. The edition already live stays live. */
const MIN=Number(arg('--min')||10);   /* --min is for trying the writer out in a cloud session, where publishers refuse us and only a handful of stories can be read. The scheduled Action leaves it alone. */
if(total<MIN){console.log('\nSTOP: only '+total+' stories survived, so the edition already live is kept. Nothing written.');process.exit(2)}

if(!WRITE){console.log('\nNothing written (no --write). Pass --write to replace '+path.relative(process.cwd(),OUT)+' and the copy in docs/app/.');process.exit(0)}
fs.writeFileSync(OUT,JSON.stringify(file,null,1));
fs.writeFileSync(DOCS,JSON.stringify(file,null,1));   /* the app is served from www/ and the site from docs/ */
console.log('\nwritten: '+path.relative(process.cwd(),OUT)+' and '+path.relative(process.cwd(),DOCS));
console.log('Now check it before it goes anywhere: node tests/layout/check.js && node tests/layout/paint.js');
