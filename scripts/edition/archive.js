/* World Edition, pass 4c: the third place to look for a picture.
 *
 * The edition asks the publisher first, then the other newsrooms who covered the same story. When neither has
 * a picture that passes, the page has been going bare. This is the third place: the free archives, which hold
 * a photograph of almost every place, building, institution, species, vehicle and historical event a story is
 * likely to be about. Wikimedia Commons alone is around 120 million freely licensed files.
 *
 * WHAT IT WILL AND WILL NOT DO. A wrong picture is worse than no picture, so the match has to be strict:
 *   - the subject is a multi-word proper name taken from the HEADLINE and confirmed in the ARTICLE TEXT, so a
 *     name the headline only alludes to is not searched for;
 *   - the file's own title or the archive's description of it must contain that whole subject, not a word of it;
 *   - the licence must be a free one, named on the page as the archive states it;
 *   - and NEVER on the Obituary page. David, 2026-11-27, asked for publisher photographs only there: a face is
 *     the one thing an archive can get wrong in a way a reader would never forgive, and it is the page where
 *     being wrong costs most.
 * No match, no picture. That is the normal outcome and it is the right one.
 *
 * Asked at BUILD TIME, by this script, never by a phone, so no reader is involved and the app makes no new
 * request. The picture itself is then served from the archive like any other, under the credit it requires.
 *
 *   node scripts/edition/archive.js --gathered got.json        # what it would find, printed, nothing written
 */
const fs=require('fs');

const NEVER=new Set(['Obituary']);/* David's answer, 2026-11-27 */
/* words that look like names at the start of a headline but name nothing an archive can hold */
const STOP=/^(The|A|An|This|That|These|Those|New|How|Why|What|When|Where|Who|Here|There|After|Before|Inside|Meet|Watch|First|Last|Best|Worst|More|Most|Town|City|Man|Woman|People|One|Two|Three|Police|Report|Study|Exclusive|Opinion|Analysis|Review|Live|Update)$/i;

/* The subject: the longest run of capitalised words in the headline that also appears, word for word, in the
   story. Two words at least - a single capitalised word is as likely to be the first word of the sentence as
   a name. "Thames Barrier", "Great Barrier Reef", "International Space Station" all survive this; "Town" and
   "Thanksgiving" do not. */
function subjectOf(title,text){
 const t=String(title||'').replace(/[‘’]/g,"'").replace(/\s+/g,' ').trim();
 const body=String(text||'');
 const runs=[];
 let cur=[];
 for(const w of t.split(' ')){
  const bare=w.replace(/^[^A-Za-z0-9']+|[^A-Za-z0-9']+$/g,'');
  if(/^[A-Z][A-Za-z'’-]+$/.test(bare)&&!STOP.test(bare))cur.push(bare);
  else{if(cur.length)runs.push(cur);cur=[]}
 }
 if(cur.length)runs.push(cur);
 const cands=runs.filter(r=>r.length>=2).map(r=>r.join(' ')).sort((a,b)=>b.length-a.length);
 for(const c of cands)if(body.includes(c))return c;
 return '';
}

/* Commons answers a browser the way it answers nobody else: the catalogue is asked from inside the page, with
   `origin=*` so the browser is allowed to read it, which is the same route the feeds already take. */
async function commons(tab,subject,want){
 return await tab.evaluate(async ([q,n])=>{
  const api='https://commons.wikimedia.org/w/api.php?origin=*&format=json&formatversion=2&';
  const go=async u=>{try{const r=await fetch(u);return r.ok?await r.json():null}catch(e){return null}};
  const s=await go(api+'action=query&list=search&srnamespace=6&srlimit='+n+'&srsearch='+encodeURIComponent(q));
  const hits=((s&&s.query&&s.query.search)||[]).map(h=>h.title);
  if(!hits.length)return[];
  const d=await go(api+'action=query&prop=imageinfo&iiprop=url|size|mime|extmetadata&titles='+encodeURIComponent(hits.join('|')));
  const pages=(d&&d.query&&d.query.pages)||[];
  const out=[];
  for(const p of pages){
   const i=p.imageinfo&&p.imageinfo[0];if(!i)continue;
   const m=i.extmetadata||{},v=k=>String((m[k]&&m[k].value)||'').replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim();
   out.push({src:i.url,w:i.width,h:i.height,mime:i.mime,
    file:String(p.title||'').replace(/^File:/,''),
    desc:v('ImageDescription').slice(0,400),
    artist:v('Artist').slice(0,120),
    lic:v('LicenseShortName').slice(0,60),
    usable:String((m.NonFree&&m.NonFree.value)||'0')!=='1'});
  }
  return out;
 },[subject,want]);
}

/* A free licence, a real photograph, big enough to print, and - the rule that does the work - the archive's own
   words about the file must name the whole subject. */
const FREE=/^(cc[ -]|public domain|pd[- ]|cc0|no restrictions|attribution)/i;
function keep(c,subject){
 if(!c||!c.usable||!/^https:\/\//.test(c.src||''))return false;
 if(!/^image\/(jpeg|png)$/.test(c.mime||''))return false;/* no svg: an archive svg is a map, a flag or a logo */
 if(!FREE.test(c.lic||''))return false;
 if(Math.max(c.w||0,c.h||0)<900)return false;
 const r=Math.max(c.w,c.h)/Math.max(1,Math.min(c.w,c.h));
 if(r>2.6)return false;/* a banner or a panorama is not a story picture */
 const hay=(c.file+' '+c.desc).toLowerCase();
 return hay.includes(subject.toLowerCase());
}

/* The credit the archive requires, written the way the magazine writes one. */
function credit(c){
 const who=(c.artist||'').replace(/\s*\(.*?\)\s*/g,' ').replace(/\s+/g,' ').trim();
 return (who?who+' / ':'')+(c.lic||'free licence')+', via Wikimedia Commons';
}

/* The one function photos.js calls. Returns candidates in the shape it already measures, or an empty list. */
async function fromArchive(tab,{title,text,section}){
 if(NEVER.has(section))return[];
 const subject=subjectOf(title,text);
 if(!subject)return[];
 let got=[];
 for(let go=0;go<2&&!got.length;go++){
  try{got=await commons(tab,subject,8)}catch(e){got=[]}
  if(!got.length)await new Promise(r=>setTimeout(r,3000));
 }
 return got.filter(c=>keep(c,subject))
   .sort((a,b)=>Math.max(b.w,b.h)-Math.max(a.w,a.h))
   .slice(0,3)
   .map(c=>({src:c.src,cap:credit(c),alt:c.desc.slice(0,160),arch:'Wikimedia Commons',subject}));
}

module.exports={fromArchive,subjectOf,credit,keep};

/* Run on its own to see what it would find for today's edition, printed, writing nothing. */
if(require.main===module)(async()=>{
 const arg=n=>{const i=process.argv.indexOf(n);return i>0?process.argv[i+1]:null};
 const GOT=arg('--gathered');
 if(!GOT){console.log('need --gathered <file from gather.js>');process.exit(1)}
 const {openApp}=require('./app');
 const got=JSON.parse(fs.readFileSync(GOT,'utf8'));
 const app=await openApp(),tab=await app.ctx.newPage();
 let found=0,asked=0;
 for(const k of got.kept||[]){
  const subject=subjectOf(k.title,k.text||'');
  if(NEVER.has(k.section)){console.log('  --  '+k.section.padEnd(17)+'(never, by rule)  '+k.title.slice(0,46));continue}
  if(!subject){console.log('  --  '+k.section.padEnd(17)+'(no subject in the headline)  '+k.title.slice(0,46));continue}
  asked++;
  const pics=await fromArchive(tab,{title:k.title,text:k.text||'',section:k.section});
  if(pics.length)found++;
  console.log((pics.length?'  '+String(pics.length).padStart(2)+'  ':'   0  ')+k.section.padEnd(17)+'['+subject+']  '+k.title.slice(0,40));
  for(const p of pics)console.log('        '+p.src.slice(0,96)+'\n          '+p.cap);
 }
 console.log('\n'+found+' of '+asked+' searchable stories found a free archive picture');
 await app.close();
})();
