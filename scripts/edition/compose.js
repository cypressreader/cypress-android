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
const OUT=arg('--out')||path.join(ROOT,'world-edition.json');
const DOCS=path.resolve(__dirname,'../../docs/app/world-edition.json');
if(!CAND){console.log('need --candidates <file from pick.js> (and --gathered <file from gather.js>)');process.exit(1)}

const cand=JSON.parse(fs.readFileSync(CAND,'utf8'));
/* Without a gathered file nothing has been read, so nothing can be printed: a hollow page is the one thing the
   gate exists to prevent. Run gather.js first. */
const got=GOT?JSON.parse(fs.readFileSync(GOT,'utf8')):null;
if(!got){console.log('need --gathered <file from gather.js>: a story that has not been read must not be printed');process.exit(1)}
const read=new Map((got.kept||[]).map(k=>[k.link,k]));

/* The 24 shapes the app will draw on a type cover, in the format's own order. One is chosen by the date so that
   two editions running the same day look the same and consecutive days do not. */
const SHAPES='ring arc rise fall wave grid bar split cross plus tri square diamond peak dip ripple rays bars stack zigzag frame half spiral horizon'.split(' ');
const today=new Date(),iso=d=>d.toISOString().slice(0,10);
const DATE=arg('--date')||iso(today);
const dayN=Math.floor(Date.parse(DATE+'T12:00:00Z')/864e5);

const prev=(()=>{try{return JSON.parse(fs.readFileSync(OUT,'utf8'))}catch(e){return null}})();
const issue=(prev&&prev.date!==DATE&&prev.issue?prev.issue+1:(prev&&prev.issue)||1);

const sections=[],kept=[];
for(const s of cand.sections||[]){
 const stories=[];
 for(const st of s.stories||[]){
  const r=read.get(st.l);if(!r)continue;            /* pass 1 dropped it: not read, too short, or gated */
  const o={t:st.t,o:st.o,l:st.l};
  if(st.n>1)o.n=st.n;                               /* "Reported by n of N outlets checked" */
  else o.why='The only outlet checked that carried it';
  /* the standfirst is the publisher's own summary FROM ITS FEED, never a sentence lifted out of the article */
  if(!stories.length&&st.dek)o.dek=String(st.dek).replace(/\s+/g,' ').trim().slice(0,170);
  /* `kind` is left out rather than guessed: calling every story an article would be wrong about the broadcast
     segments, and the app does not read the field yet. */
  stories.push(o);kept.push({...st,section:s.name,words:r.words});
 }
 sections.push({name:s.name,stories});
}
const total=kept.length;

/* The cover story is the most reported story of the day. Nobody picks it - that is the promise on the method
   page, and it is the whole reason the counting exists. */
let lead=[0,0],leadStory=null;
{let best=-1;
 sections.forEach((s,si)=>s.stories.forEach((st,ti)=>{const n=st.n||1;if(n>best){best=n;lead=[si,ti];leadStory=st}}));
}

const edition={
 id:'us',name:'US Edition',regions:['US'],fallback:true,
 cover:{lead,mood:'ordinary',shape:SHAPES[dayN%SHAPES.length],accent:null,photo:null,
  logo:dayN%2?'ghost':'top',
  photoNote:'No photograph: a picture is printed only once it has been cleared by eye, and that pass is not built yet.'},
 sections
};

const file={
 format:1,date:DATE,issue,sampled:cand.sampled||0,
 method:[
  'This edition was built by counting. The feeds of '+(cand.sampled||0)+' outlets were read, headlines about the same event were grouped, and a story is big when separate outlets report it. The cover story is the one reported by the most outlets. Nobody hand-picks it.',
  'Every edition has the same ten sections in the same order, each with a fixed number of places: Home 4, World 4, Business 2, Science & Health 2, Tech 1, Culture 1, Sport 1, Food 1, one long read, and one story to finish on. A section may run short but never borrows, and no section prints two stories from the same outlet.',
  'Every story was opened and read before it was printed. A story that could not be read, that is behind a paywall or a sign-in, or that has fewer than three paragraphs or 120 words was dropped and its place left empty rather than filled with a hollow page.',
  'Every headline is the publisher’s own, word for word, and opens the publisher’s story. A summary line is the publisher’s own from its feed. Nothing here is written for you by a machine.',
  'One link per story, to an outlet that lets you read it. The app never goes past a paywall or meter and never keeps a publisher’s story on a server.',
  'One edition a day. It is not updated after it is published, apart from a dated correction. No opinion columns, no games, no weather.'
 ],
 editions:[edition]
};

console.log('EDITION '+DATE+'  No. '+issue+'  '+(cand.sampled||0)+' outlets read');
for(const s of sections)console.log('  '+s.name.padEnd(18)+s.stories.length+(s.stories.length?'  '+s.stories.map(x=>x.o).join(', '):''));
console.log('\n'+total+' stories printed, '+((got.dropped||[]).length)+' dropped at the gate.');
if(leadStory)console.log('cover: '+leadStory.t.slice(0,70)+'  ('+(leadStory.n||1)+' outlets, '+leadStory.o+')');
console.log('cover state: type ('+file.editions[0].cover.shape+' shape, masthead '+file.editions[0].cover.logo+')');

/* The stop condition from the plan, and the one rule that makes going away safe: a thin edition never replaces
   a good one. The edition already live stays live. */
const MIN=Number(arg('--min')||10);   /* --min is for trying the writer out in a cloud session, where publishers refuse us and only a handful of stories can be read. The scheduled Action leaves it alone. */
if(total<MIN){console.log('\nSTOP: only '+total+' stories survived, so the edition already live is kept. Nothing written.');process.exit(2)}

if(!WRITE){console.log('\nNothing written (no --write). Pass --write to replace '+path.relative(process.cwd(),OUT)+' and the copy in docs/app/.');process.exit(0)}
fs.writeFileSync(OUT,JSON.stringify(file,null,1));
fs.writeFileSync(DOCS,JSON.stringify(file,null,1));   /* the app is served from www/ and the site from docs/ */
console.log('\nwritten: '+path.relative(process.cwd(),OUT)+' and '+path.relative(process.cwd(),DOCS));
console.log('Now check it before it goes anywhere: node tests/layout/check.js && node tests/layout/paint.js');
