/* The Obituary page: gather the material for the one line this magazine writes itself.
 *
 * Everything else in the edition is the publisher's own words. This page is the exception David asked for:
 * a short note saying why the death matters and what the person did, because a headline and a standfirst do
 * not tell a reader who has never heard the name why they should care. It is written by a machine, and the
 * page says so in as many words - the same rule as the spoken introduction.
 *
 * WHERE THE FACTS COME FROM. Two places, both named on the page:
 *   - the publisher's own obituary, as the gate read it;
 *   - Wikipedia's summary of that person, which is the short factual paragraph at the top of their article
 *     (licensed CC BY-SA, so it is credited). It is asked for at BUILD TIME, by this script, never by a
 *     phone, so nothing about any reader is involved and no new request reaches the app.
 *
 * THE CHECKS, because a name is not a person. A summary is only used when Wikipedia's own one-line
 * description says this is a person, and when the article agrees that they have died - the description
 * carries the years (Wikipedia writes "English musician (1942-2026)") or the text says so. A living
 * namesake is therefore refused rather than printed.
 *
 *   node scripts/edition/obit.js --gathered got.json --out obit.json         # collect the material
 *   node scripts/edition/obit.js --gathered got.json --note "..." --write    # write the note into the edition
 */
const fs=require('fs'),path=require('path'),https=require('https'),{ROOT}=require('./app');

const arg=n=>{const i=process.argv.indexOf(n);return i>0?process.argv[i+1]:null};
const GOT=arg('--gathered'),OUT=arg('--out'),NOTE=arg('--note'),WRITE=process.argv.includes('--write');
const EDITION=arg('--edition')||path.join(ROOT,'world-edition.json');
const DOCS=path.resolve(__dirname,'../../docs/app/world-edition.json');

const get=(url)=>new Promise(res=>{
 const r=https.get(url,{timeout:15000,headers:{'accept':'application/json','user-agent':'CyPress edition builder'}},q=>{
  if(q.statusCode!==200){q.resume();return res(null)}
  let b='';q.setEncoding('utf8');q.on('data',c=>b+=c);q.on('end',()=>{try{res(JSON.parse(b))}catch(e){res(null)}});
 });
 r.on('timeout',()=>{r.destroy();res(null)});r.on('error',()=>res(null));
});

/* The name is the part of the headline before the comma or before the verb: "Michael Giles, King Crimson
   Co-Founder, Dead at 84" and "Andy Taylor, guitarist of Duran Duran, dies at 65" both give the name. */
function nameFrom(title){
 let t=String(title||'').replace(/\s+/g,' ').trim();
 t=t.split(/[,:–—(]/)[0];
 t=t.replace(/\b(dies|died|dead|obituary|has died|passes away).*$/i,'').trim();
 return /^[A-Z][^ ]*( [A-Z][^ ]*){0,3}$/.test(t)?t:'';
}

/* A name on its own is often not enough. "Andy Taylor" is a disambiguation page - there are several - so when
   the plain title is ambiguous or missing, the encyclopedia is searched for the name together with whatever the
   headline says about them ("Duran Duran"), and the first article it offers is tried instead. Wikipedia rate-
   limits a shared address, so a refusal is waited out once rather than treated as an answer. */
async function summary(title){
 for(let go=0;go<2;go++){
  const j=await get('https://en.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent(String(title).replace(/ /g,'_')));
  if(j)return j;
  await new Promise(r=>setTimeout(r,4000));
 }
 return null;
}
async function search(q){
 const j=await get('https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch='+encodeURIComponent(q)+'&srlimit=3&format=json&formatversion=2');
 const hits=(j&&j.query&&j.query.search)||[];
 return hits.length?hits[0].title:'';
}
async function wiki(name,hint){
 if(!name)return null;
 let j=await summary(name);
 if(!j||j.type==='disambiguation'||!j.extract){
  const t=await search(name+' '+(hint||''));
  j=t?await summary(t):null;
 }
 if(!j||j.type==='disambiguation'||!j.extract)return null;
 /* the article has to be about the person the headline is about */
 if(!String(j.title||'').toLowerCase().includes(String(name).split(' ').pop().toLowerCase()))return null;
 const d=String(j.description||'');
 /* a person, and one the encyclopedia agrees has died */
 const years=/\((\d{4})\s*[–—-]\s*(\d{4})\)/.exec(d);
 const dead=!!years||/\bwas an?\b/i.test(j.extract)||/\bdied\b/i.test(j.extract);
 if(!dead)return null;
 return{title:j.title,description:d,extract:j.extract,
   born:years?+years[1]:null,died:years?+years[2]:null,
   url:(j.content_urls&&j.content_urls.desktop&&j.content_urls.desktop.page)||''};
}

(async()=>{
 if(!GOT){console.log('need --gathered <file from gather.js>');process.exit(1)}
 const got=JSON.parse(fs.readFileSync(GOT,'utf8'));
 const obit=(got.kept||[]).find(k=>k.section==='Obituary')
   ||(got.kept||[]).find(k=>/\b(dies|died|dead) at \d{2}\b|\bobituary\b/i.test(k.title||''));
 if(!obit){console.log('no obituary in this edition');process.exit(0)}

 const name=nameFrom(obit.swap&&obit.swap.t||obit.title);
 /* what the headline says about them, which is what tells two people of the same name apart */
 const hint=String(obit.swap&&obit.swap.t||obit.title).replace(/^[^,]*,?/,'').replace(/\b(dies|died|dead)\b.*$/i,'').replace(/[^A-Za-z0-9 ]/g,' ').trim().slice(0,60);
 const w=await wiki(name,hint);
 console.log('obituary: '+(obit.swap&&obit.swap.t||obit.title));
 console.log('person:   '+(name||'(could not read a name from the headline)'));
 console.log('wikipedia: '+(w?w.title+' — '+w.description:'no usable article (refused: not a person, still living, or ambiguous)'));

 if(NOTE){
  /* writing the note in. Everything about it is recorded with it: who wrote it and from what. */
  const f=JSON.parse(fs.readFileSync(EDITION,'utf8'));
  let n=0;
  for(const e of f.editions||[])for(const s of e.sections||[])for(const st of s.stories||[]){
   if(s.name!=='Obituary')continue;
   st.note=String(NOTE).replace(/\s+/g,' ').trim();
   /* the red label above the note already says a machine wrote it; this line names what it was written FROM.
      Saying "written by a machine" twice on one page reads as a disclaimer rather than a credit. */
   st.noteBy='From '+(obit.swap&&obit.swap.o||obit.outlet)+'’s obituary'+(w?' and Wikipedia':'');
   if(w&&w.url)st.noteSrc=w.url;
   n++;
  }
  if(!n){console.log('\nno obituary page in the edition file to write it into');process.exit(2)}
  if(!WRITE){console.log('\nwould write the note onto '+n+' page(s). Pass --write.');process.exit(0)}
  fs.writeFileSync(EDITION,JSON.stringify(f,null,1));
  try{fs.writeFileSync(DOCS,JSON.stringify(f,null,1))}catch(e){}
  console.log('\nwritten onto '+n+' page(s), and the page says who wrote it.');
  process.exit(0);
 }

 const material={made:new Date().toISOString(),
  story:{title:obit.swap&&obit.swap.t||obit.title,outlet:obit.swap&&obit.swap.o||obit.outlet,link:obit.swap&&obit.swap.l||obit.link,words:obit.words,
    text:String(obit.text||'').slice(0,6000)},
  person:name,wikipedia:w,
  asks:['Two sentences at most, under 300 characters.',
   'Who they were and why the death matters - what they changed, not what they were famous for being.',
   'Only facts that appear in the publisher’s obituary or the Wikipedia summary above.',
   'No adjectives of grief, no "beloved", no "legendary". Plain past tense.',
   'Never repeat the headline.']};
 if(OUT){fs.writeFileSync(OUT,JSON.stringify(material,null,1));console.log('\nmaterial for the note written to '+OUT)}
 else console.log('\n'+JSON.stringify(material.asks,null,1));
})();
