/* World Edition, pass 4c: the third place to look for a picture.
 *
 * The edition asks the publisher first, then the other newsrooms who covered the same story. When neither has
 * one that passes, the page has been going bare. This is the third place: the free archives.
 *
 * WHICH ARCHIVE. Wikimedia Commons' own API refuses this data centre outright (429 on every request, every
 * time - the same wall the publishers put up, and the same reason the feeds go through a relay). Openverse,
 * the Creative Commons search the WordPress Foundation runs, indexes Commons anyway - 89 million files of it -
 * along with Europeana, the Met, the Smithsonian, NASA, the Science Museum and the Wellcome Collection, and it
 * answers. So the archive is reached through Openverse, and Flickr and iNaturalist are left out of the search:
 * half a billion amateur snapshots is not a picture desk.
 *
 * WHICH PAGES. An archive picture is a picture of the SUBJECT, not of the news - the Thames Barrier, not
 * today's flood. On an explainer or a long read that is honest and normal; on a news page it would quietly
 * pass a library picture off as a picture of the event, which is the same lie as a drawing. So:
 *   NEVER   Home, Around the world, World, Business, Sport - events.
 *           Obituary - David, 2026-11-27: publisher photographs only. A face is the one thing an archive can
 *           get wrong in a way a reader would never forgive, on the page where it costs most.
 *   ALLOWED Explainer, Long read, From the archive, Food, Science & Health, Tech, Culture, Review - where the
 *           picture is of a thing, a place or a work, and saying so is the whole caption.
 *
 * HOW A SUBJECT IS CONFIRMED. Capitalisation alone proves nothing: in a Title Case headline every word is
 * capitalised, which is how an early version of this came up with "Reloads Without Slowing Down" as a subject
 * to search for. So each candidate phrase has to be a real thing: it must appear word for word in the article
 * text AND have an article of its own on Wikipedia (whose API does answer this data centre). "Nikola Tesla",
 * "Venice Biennale", "Australian Open" and "Major League Baseball" survive that; the headline fragments do not.
 * Then the archive file's own title must contain the whole subject. No match, no picture - the normal outcome.
 *
 * Asked at BUILD TIME, here, never by a phone.
 *
 *   node scripts/edition/archive.js --edition docs/app/world-edition.json   # what it would find, nothing written
 */
const fs=require('fs'),https=require('https');

const NEVER=new Set(['Home','Around the world','World','Business','Sport','Obituary']);
const SOURCES='wikimedia,nasa,met,europeana,sciencemuseum,wellcome_collection,brooklynmuseum,museumsvictoria';
/* cc0 and the public domain mark are free outright; by and by-sa need a credit, which the page prints.
   nc is grey for an application, nd forbids the derivative that cropping arguably is. Neither is worth it. */
const LIC_OK=new Set(['cc0','pdm','by','by-sa']);
const STOP=/^(The|A|An|This|That|These|Those|New|How|Why|What|When|Where|Who|Here|There|After|Before|Inside|Meet|Watch|First|Last|Best|Worst|More|Most|One|Two|Three|Live|Update|Exclusive|Opinion|Analysis)$/i;

const UA='CyPressEditionBuilder/1.0 (static magazine build)';
const get=(url)=>new Promise(res=>{
 const r=https.get(url,{timeout:25000,headers:{'accept':'application/json','user-agent':UA}},q=>{
  let b='';q.setEncoding('utf8');q.on('data',c=>b+=c);
  q.on('end',()=>{if(q.statusCode!==200)return res(null);try{res(JSON.parse(b))}catch(e){res(null)}});
 });
 r.on('timeout',()=>{r.destroy();res(null)});r.on('error',()=>res(null));
});
const wait=ms=>new Promise(r=>setTimeout(r,ms));

/* every capitalised run of two words or more in the headline that also appears in the story */
function candidates(title,text){
 const t=String(title||'').replace(/[‘’]/g,"'").replace(/\s+/g,' ').trim(),body=String(text||'');
 const runs=[];let cur=[];
 for(const w of t.split(' ')){
  const bare=w.replace(/^[^A-Za-z0-9']+|[^A-Za-z0-9']+$/g,'');
  if(/^[A-Z][A-Za-z'’-]+$/.test(bare)&&!STOP.test(bare))cur.push(bare);
  else{if(cur.length)runs.push(cur);cur=[]}
 }
 if(cur.length)runs.push(cur);
 const out=new Set();
 for(const r of runs){
  /* the whole run, then its leading pairs: "Hundred Years Ago Nikola Tesla Predicted" also offers "Nikola Tesla" */
  for(let len=r.length;len>=2;len--)for(let i=0;i+len<=r.length;i++){
   const p=r.slice(i,i+len).join(' ');
   if(body.includes(p))out.add(p);
  }
 }
 return [...out].sort((a,b)=>b.length-a.length).slice(0,6);
}

/* Which of these phrases name a real thing. Asked of Wikipedia 40 at a time, so the whole edition costs a
   handful of requests rather than one per story. Returns the canonical article titles. */
async function realThings(phrases){
 const real=new Set();
 const all=[...new Set(phrases)].filter(p=>p.length<120);
 for(let i=0;i<all.length;i+=40){
  const batch=all.slice(i,i+40);
  const j=await get('https://en.wikipedia.org/w/api.php?action=query&redirects=1&format=json&formatversion=2&titles='
    +encodeURIComponent(batch.join('|')));
  const pages=(j&&j.query&&j.query.pages)||[];
  for(const p of pages)if(!p.missing&&p.title)real.add(p.title);
  for(const n of ((j&&j.query&&j.query.normalized)||[]))if(real.has(n.to))real.add(n.from);
  for(const r of ((j&&j.query&&j.query.redirects)||[]))if(real.has(r.to))real.add(r.from);
  await wait(900);
 }
 return real;
}

async function openverse(subject){
 const u='https://api.openverse.org/v1/images/?page_size=12&license_type=all-cc&source='+SOURCES
   +'&q='+encodeURIComponent(subject);
 for(let go=0;go<2;go++){
  const j=await get(u);
  if(j&&Array.isArray(j.results))return j.results;
  await wait(2500);
 }
 return [];
}

function keep(r,subject,big){
 if(!r||!/^https:\/\//.test(r.url||''))return false;
 if(!LIC_OK.has(String(r.license||'').toLowerCase()))return false;
 const w=+r.width||0,h=+r.height||0;
 if(Math.max(w,h)<(big?1600:1200))return false;
 const ratio=Math.max(w,h)/Math.max(1,Math.min(w,h));
 if(ratio>2.4)return false;
 if(/\.svg($|\?)/i.test(r.url))return false;
 /* the file's own title must name the whole subject - this is the rule that keeps a tangential picture out */
 return String(r.title||'').toLowerCase().includes(subject.toLowerCase());
}

/* The caption says what the picture is OF, then who made it and under what. A reader can then see at a glance
   that it came from a library rather than from today. */
function credit(r){
 const what=String(r.title||'').replace(/^File:/,'').replace(/\.(jpe?g|png|tiff?)$/i,'').replace(/\s+/g,' ').trim();
 const who=String(r.creator||'').replace(/\s+/g,' ').trim();
 const lic=({cc0:'CC0',pdm:'public domain'})[r.license]||('CC '+String(r.license||'').toUpperCase());
 const where=({wikimedia:'Wikimedia Commons',met:'the Metropolitan Museum of Art',nasa:'NASA',
   europeana:'Europeana',sciencemuseum:'the Science Museum',wellcome_collection:'the Wellcome Collection',
   brooklynmuseum:'the Brooklyn Museum',museumsvictoria:'Museums Victoria'})[r.source]||r.source;
 return (what?what+'. ':'')+(who?who+' / ':'')+lic+', via '+where;
}

/* The one function photos.js calls, once per story that still has nothing. */
async function fromArchive({title,text,section},realSet,big){
 if(NEVER.has(section))return[];
 const subs=candidates(title,text).filter(p=>realSet.has(p));
 for(const subject of subs){
  const got=await openverse(subject);
  const ok=got.filter(r=>keep(r,subject,big)).sort((a,b)=>Math.max(b.width,b.height)-Math.max(a.width,a.height));
  if(ok.length)return ok.slice(0,3).map(r=>({src:r.url,w:r.width,h:r.height,cap:credit(r),
    alt:String(r.title||'').slice(0,160),arch:r.source,subject}));
  await wait(400);
 }
 return [];
}

module.exports={fromArchive,candidates,realThings,credit,keep,NEVER};

if(require.main===module)(async()=>{
 const arg=n=>{const i=process.argv.indexOf(n);return i>0?process.argv[i+1]:null};
 const ED=arg('--edition')||'docs/app/world-edition.json';
 const f=JSON.parse(fs.readFileSync(ED,'utf8'));
 const rows=[];
 for(const e of f.editions||[])for(const s of e.sections||[])for(const st of s.stories||[])
  if(e.id==='us')rows.push({section:s.name,title:st.t,text:(st.t||'')+' '+(st.dek||''),has:!!(st.photo&&st.photo.url)});
 const all=[];for(const r of rows)if(!NEVER.has(r.section))all.push(...candidates(r.title,r.text));
 console.log('asking Wikipedia which of '+new Set(all).size+' phrases name a real thing…');
 const real=await realThings(all);
 console.log('real: '+[...real].join(' | ')+'\n');
 let hit=0,asked=0;
 for(const r of rows){
  if(NEVER.has(r.section)){console.log('  --   '+r.section.padEnd(17)+'(never, by rule)');continue}
  const subs=candidates(r.title,r.text).filter(p=>real.has(p));
  if(!subs.length){console.log('  --   '+r.section.padEnd(17)+'(no real subject)  '+r.title.slice(0,40));continue}
  asked++;
  const p=await fromArchive(r,real,!r.has);
  if(p.length)hit++;
  console.log('  '+(p.length?String(p.length).padStart(2):' 0')+'   '+r.section.padEnd(17)+'['+subs.join(' / ')+']');
  for(const x of p.slice(0,1))console.log('        '+x.w+'x'+x.h+'  '+x.cap.slice(0,96)+'\n        '+x.src.slice(0,96));
 }
 console.log('\n'+hit+' of '+asked+' searchable stories found a free archive picture');
})();
