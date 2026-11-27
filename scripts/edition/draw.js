/* World Edition, pass 4d: the illustration, for the pages that are allowed one.
 *
 * David said yes to this on 2026-11-27, under a rule with a hard line down the middle of it. A machine-made
 * picture beside a news story is a picture of something that did not happen as shown, and a caption does not
 * undo that, because people remember pictures and forget captions. So:
 *
 *   NEVER   Home, Around the world, World, Business, Science & Health, Tech, Sport, Food, Obituary.
 *           Real events and real people. A photograph, or type.
 *   ALLOWED Explainer, Long read, Review, From the archive, Back page.
 *           An argument, an opinion, history held at a distance - where a magazine has always commissioned a
 *           drawing, and nobody has ever taken one for evidence.
 *
 * The rule is held in two places on purpose: here, so nothing is drawn for a page that may not have one, and
 * again in the app (`WE_ART_OK`), so a bad edition file cannot put a drawing on the obituary either.
 *
 * THE STYLE IS LOCKED, because a model left to itself makes the glossy rendered thing everyone recognises on
 * sight, and that would be worse than a bare page. Flat, two or three colours from the edition's own palette,
 * no gradients, no photographic rendering, no faces, no lettering. A printed cartoon or a paperback cover.
 *
 * Every one of them is labelled on the page: "Illustration made by a machine" - David's wording, 2026-11-27.
 *
 * Drawn at BUILD TIME, here, never by a phone. The file is written to docs/app/we-art/ and served from the
 * site like any other picture, so it is NOT carried inside the app and the download does not grow.
 *
 *   node scripts/edition/draw.js --edition world-edition.json            # what it would draw, nothing written
 *   node scripts/edition/draw.js --edition world-edition.json --write    # draw them and write them in
 */
const fs=require('fs'),path=require('path'),https=require('https'),{ROOT}=require('./app');

const arg=n=>{const i=process.argv.indexOf(n);return i>0?process.argv[i+1]:null};
const EDITION=arg('--edition')||path.join(ROOT,'world-edition.json');
const WRITE=process.argv.includes('--write');
const ART=path.resolve(__dirname,'../../docs/app/we-art');
const ACCOUNT=process.env.CF_ACCOUNT||'cbc8ef24792cbf676d3717119cf1abb6';
const MODEL='@cf/black-forest-labs/flux-1-schnell';

const ALLOWED=new Set(['Explainer','Long read','Review','From the archive','Back page']);

/* The style, word for word on every prompt. The negative half matters more than the positive half. */
const STYLE='Flat two-colour editorial illustration in the style of a printed newspaper cartoon or a mid-century '
 +'paperback cover. Deep navy #16263f and brick red #a8372a on a cream #f3efe6 ground, nothing else. Bold simple '
 +'shapes, clean edges, generous empty space, slight print texture. Strictly no gradients, no shading, no '
 +'photographic rendering, no 3D, no glow, no lens effects, no text, no letters, no numbers, no logos, no human '
 +'faces, no crowds, no watermark.';

/* What the picture is OF. An illustration says something about the piece, so the idea is the one thing a
   machine should not improvise: `idea` in the edition file is used when an editor (or the editorial pass) has
   written one. Without it, the concrete nouns of the headline become a still life - a safe, dull, honest
   fallback that never claims to depict an event. */
const ABSTRACT=/^(the|a|an|and|or|of|for|to|in|on|at|is|are|was|were|be|been|how|why|what|when|where|who|new|more|most|than|with|from|that|this|it|its|his|her|their|our|your|about|after|before|into|over|under|up|down|out|off|again|very|just|now|still|says?|said|could|would|should|may|might|will|can)$/i;
function ideaFrom(st){
 if(st.idea)return String(st.idea).slice(0,220);
 const words=String(st.t||'').replace(/[^A-Za-z0-9 '-]/g,' ').split(/\s+/).filter(w=>w.length>3&&!ABSTRACT.test(w));
 const nouns=[...new Set(words.map(w=>w.toLowerCase()))].slice(0,5);
 return nouns.length?('A simple symbolic still life suggesting: '+nouns.join(', ')+'. An object, not a scene; nobody in it.')
   :'A simple symbolic arrangement of geometric objects on an empty ground.';
}

const post=(url,body)=>new Promise(res=>{
 const data=JSON.stringify(body);
 const r=https.request(url,{method:'POST',timeout:120000,
   headers:{'content-type':'application/json','content-length':Buffer.byteLength(data)}},q=>{
  let b='';q.setEncoding('utf8');q.on('data',c=>b+=c);
  q.on('end',()=>{try{res({code:q.statusCode,json:JSON.parse(b)})}catch(e){res({code:q.statusCode,json:null,raw:b.slice(0,300)})}});
 });
 r.on('timeout',()=>{r.destroy();res({code:0,json:null,raw:'timed out'})});
 r.on('error',e=>res({code:0,json:null,raw:String(e.message)}));
 r.end(data);
});

async function draw(prompt){
 const r=await post('https://api.cloudflare.com/client/v4/accounts/'+ACCOUNT+'/ai/run/'+MODEL,{prompt,steps:6});
 if(r.code!==200||!r.json||!r.json.success){
  const why=(r.json&&r.json.errors&&r.json.errors[0]&&r.json.errors[0].message)||r.raw||('HTTP '+r.code);
  return{err:why};
 }
 const b64=r.json.result&&(r.json.result.image||r.json.result.images&&r.json.result.images[0]);
 return b64?{png:Buffer.from(b64,'base64')}:{err:'the service answered without a picture'};
}

/* PNG out of the model, JPEG onto the site: the same picture at a fifth of the weight, and the browser the
   pipeline already runs is the only encoder involved - no new dependency for one conversion. */
async function toJpeg(tab,png){
 const b64=png.toString('base64');
 const out=await tab.evaluate(async d=>await new Promise(res=>{
  const im=new Image();
  im.onload=()=>{const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;
   c.getContext('2d').drawImage(im,0,0);res({u:c.toDataURL('image/jpeg',.86),w:c.width,h:c.height})};
  im.onerror=()=>res(null);
  im.src='data:image/png;base64,'+d;
 }),b64);
 return out?{buf:Buffer.from(out.u.split(',')[1],'base64'),w:out.w,h:out.h}:null;
}

const key=s=>{let h=0;for(const c of String(s))h=(h*31+c.charCodeAt(0))>>>0;return h.toString(36)};

(async()=>{
 const f=JSON.parse(fs.readFileSync(EDITION,'utf8'));
 const jobs=[];
 for(const e of f.editions||[])for(const s of e.sections||[])for(const st of s.stories||[]){
  if(!ALLOWED.has(s.name))continue;
  if(st.photo&&st.photo.url)continue;/* a real photograph always wins */
  jobs.push({e:e.id,section:s.name,st});
 }
 console.log('pages that may carry an illustration and have no photograph: '+jobs.length);
 for(const j of jobs)console.log('  '+j.e+'  '+j.section.padEnd(17)+j.st.t.slice(0,54));
 if(!jobs.length)process.exit(0);

 if(!WRITE){
  console.log('\nthe first prompt would be:\n'+STYLE+'\n'+ideaFrom(jobs[0].st));
  console.log('\nnothing drawn. Pass --write.');
  process.exit(0);
 }

 fs.mkdirSync(ART,{recursive:true});
 const {openApp}=require('./app');
 const app=await openApp(),tab=await app.ctx.newPage();
 let made=0,failed=0,why='';
 const live=new Set();
 for(const j of jobs){
  const prompt=STYLE+' '+ideaFrom(j.st);
  const r=await draw(prompt);
  if(r.err){failed++;why=why||r.err;process.stdout.write('x');continue}
  const jp=await toJpeg(tab,r.png);
  if(!jp){failed++;process.stdout.write('x');continue}
  const name=key(j.st.l||j.st.t)+'.jpg';
  fs.writeFileSync(path.join(ART,name),jp.buf);
  j.st.art={url:'we-art/'+name,w:jp.w,h:jp.h};
  live.add(name);made++;process.stdout.write('.');
 }
 process.stdout.write('\n');
 /* keep the folder to the editions still on the site: a drawing nothing points at is dead weight every day */
 for(const old of fs.readdirSync(ART))if(/\.jpg$/.test(old)&&!live.has(old))fs.unlinkSync(path.join(ART,old));

 if(made){
  fs.writeFileSync(EDITION,JSON.stringify(f,null,1));
  const docs=path.resolve(__dirname,'../../docs/app/world-edition.json');
  try{if(path.resolve(EDITION)!==docs)fs.writeFileSync(docs,JSON.stringify(f,null,1))}catch(e){}
 }
 console.log(made+' drawn, '+failed+' not'+(why?' ('+why+')':''));
 if(failed&&/auth/i.test(why))console.log('The Cloudflare token cannot run Workers AI. Add the "Workers AI" permission to it in the Cloudflare dashboard.');
 await app.close();
})();
