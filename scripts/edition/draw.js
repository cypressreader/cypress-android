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
const REDRAW=process.argv.includes('--redraw');
const ART=path.resolve(__dirname,'../../docs/app/we-art');
const ACCOUNT=process.env.CF_ACCOUNT||'cbc8ef24792cbf676d3717119cf1abb6';
const MODEL='@cf/black-forest-labs/flux-1-schnell';

const ALLOWED=new Set(['Explainer','Long read','Review','From the archive','Back page']);

/* The style, word for word on every prompt. The negative half matters more than the positive half. */
/* The style, word for word on every prompt. Tested 27 Nov: the model obeys the SHAPE instructions well and
   ignores the COLOUR ones about half the time - a plate came back pink and pale blue however many times the
   prompt said otherwise. So the colours are not argued for here, they are imposed afterwards by housePalette.
   What this half of the prompt is for is composition: one object, centred, flat, no text, nobody in it. */
const STYLE='Two-colour screen print, flat vector editorial illustration in the style of a 1960s printed '
 +'newspaper cartoon. Solid flat fills, hard edges, bold poster shapes, no photographic rendering, no 3D, '
 +'no gradients, no soft shadows. ONE single object, centred, drawn very large so that it FILLS the frame '
 +'edge to edge and is cropped by the edges. Close up. No small object floating in empty space. '
 +'An empty scene or a still life with NO living thing in it whatsoever. Absolutely no people, no human '
 +'figures, no faces, no hands, no crowds, no animals, no text, no letters, no numbers, no logos, no watermark.';
/* "no people, no faces" alone does not hold. Asked for a Thanksgiving dinner on 27 Nov it drew a woman,
   face and all, for a story about a real named person - the breach this whole rule exists to prevent.
   Naming the KIND of picture wanted (an empty scene, a still life with nothing living in it) holds far
   better than forbidding a thing, but it is still the model's choice, so every drawing is looked at by eye
   before it prints. An automatic check needs a vision model, and the one on this account needs Meta's
   licence accepted, which is David's to accept and not mine. */
/* "generous empty space" was in here until 27 Nov and it did exactly what it says: a pumpkin the size of a
   postage stamp in the bottom third of an empty square, which a landscape crop would have cut in half. The
   page wants a picture, not a sticker. */

/* WHAT THE PICTURE IS OF - the one thing a machine should not improvise from a headline, and for a while here
   it did. Taking the concrete nouns out of 'The Bombmaker Next Door' and handing them to an illustrator got a
   picture with BOMBMAKER printed across the top in foot-high letters; 'Town Rewards a Woman...' got a shop
   sign reading TOWN REWARDS. Every drawing made from a mechanical idea was thrown away; both made from an
   idea written as a sentence were kept. So a picture editor writes the brief: a model reads the headline and
   the standfirst and names ONE concrete object. If it will not, NOTHING IS DRAWN - a bad picture is worse
   than a bare page, which is the whole rule of this file. */
const BRIEF='You are a magazine picture editor briefing an illustrator. You are given a headline and a '
 +'standfirst. Reply with ONE sentence of at most 22 words naming a single concrete inanimate object to draw, '
 +'and how it is seen. The object must be one a reader connects to the story the moment they read the '
 +'headline. Never a person, a face, a body part, an animal, a crowd, a weapon, a flag or a logo. Never '
 +'anything carrying writing: no sign, no book cover, no screen showing text, no newspaper, no label. Never '
 +'the literal event. Begin with "A single". No preamble, no quotation marks, no explanation.';
const WORDS='@cf/meta/llama-3.3-70b-instruct-fp8-fast';

async function askIdea(st){
 const r=await post('https://api.cloudflare.com/client/v4/accounts/'+ACCOUNT+'/ai/run/'+WORDS,
  {messages:[{role:'system',content:BRIEF},
    {role:'user',content:'Headline: '+String(st.t||'')+'\nStandfirst: '+String(st.dek||'')}],
   max_tokens:60,temperature:.4});
 if(r.code!==200||!r.json||!r.json.success){
  const why=(r.json&&r.json.errors&&r.json.errors[0]&&r.json.errors[0].message)||r.raw||('HTTP '+r.code);
  return{err:why};
 }
 let t=String((r.json.result&&(r.json.result.response||r.json.result.output))||'').replace(/\s+/g,' ').trim();
 t=t.replace(/^["\u201c\u2018']+|["\u201d\u2019']+$/g,'').trim();
 const m=t.match(/^(.{10,240}?[.!?])(\s|$)/);if(m)t=m[1];/* one sentence was asked for; hold it to one */
 if(!/^A single/i.test(t)||t.length<12)return{err:'the brief came back in a shape I did not ask for: '+t.slice(0,70)};
 return{idea:t};
}

/* THE REQUEST GOES THROUGH curl, NOT node's own https, and that is not a style choice. The Cloudflare key
   is injected by this environment's outbound proxy, and node's https client ignores the proxy settings
   entirely: it connected straight out, arrived at Cloudflare with no credential, and every drawing came
   back 'Authentication error' long after the token itself was working. curl honours the proxy, so the key
   is attached. Nothing here ever sees or stores the key. */
const {spawn}=require('child_process');
const post=(url,body)=>new Promise(res=>{
 const c=spawn('curl',['-s','--max-time','120','-X','POST',url,'-H','content-type: application/json','--data-binary','@-']);
 let out='',bad='';
 c.stdout.setEncoding('utf8');c.stdout.on('data',d=>out+=d);
 c.stderr.setEncoding('utf8');c.stderr.on('data',d=>bad+=d);
 c.on('error',e=>res({code:0,json:null,raw:String(e.message).slice(0,200)}));
 c.on('close',()=>{try{res({code:200,json:JSON.parse(out)})}catch(e){res({code:0,json:null,raw:(bad||out||'empty answer').slice(0,200)})}});
 c.stdin.end(JSON.stringify(body));
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
/* The safety filter refuses about one prompt in five, and it is not reading the subject: the same story
   drew fine in the other edition on the same run. It is a coin toss, so it is tossed twice. */
async function drawTwice(prompt){
 const a=await draw(prompt);
 if(!a.err)return a;
 await new Promise(r=>setTimeout(r,1500));
 return await draw(prompt);
}

/* THE HOUSE PALETTE, IMPOSED. The model will not hold a palette on instruction, so every pixel is mapped to
   one of the edition's three colours by brightness: light becomes the paper, dark becomes the ink, and a
   midtone becomes the red if it is warm and the ink if it is cool. It cannot drift, whatever the model does
   on the day, and the result reads as a real two-colour print rather than a flat render.
   Done on the canvas of the browser the pipeline already runs, so there is no new dependency and nothing
   extra has to exist on the machine that runs the scheduled build. */
const PAPER=[243,239,230],INK=[22,38,63],RED=[168,55,42];
async function housePalette(tab,bytes){
 const mime=(bytes[0]===0xFF&&bytes[1]===0xD8)?'image/jpeg':'image/png';
 const out=await tab.evaluate(async ([d,m,P,I,R])=>await new Promise(res=>{
  const im=new Image();
  im.onload=()=>{
   const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;
   const x=c.getContext('2d');x.drawImage(im,0,0);
   const g=x.getImageData(0,0,c.width,c.height),a=g.data;
   for(let i=0;i<a.length;i+=4){
    const r=a[i],gg=a[i+1],b=a[i+2],l=.299*r+.587*gg+.114*b,warm=r-(gg+b)/2;
    const t=l>188?P:(l<92?I:(warm>8?R:I));
    a[i]=t[0];a[i+1]=t[1];a[i+2]=t[2];a[i+3]=255;
   }
   x.putImageData(g,0,0);
   /* out as a landscape plate. The square's outer margin is where the model leaves its strays - a page
      number, a signature, a stray glyph - and the page prints a band anyway, so the centre is taken and
      the margin goes with it. */
   const W=Math.round(c.width*.92),H=Math.round(W*3/5),ox=Math.round((c.width-W)/2),oy=Math.round((c.height-H)/2);
   const o=document.createElement('canvas');o.width=W;o.height=H;
   o.getContext('2d').drawImage(c,ox,oy,W,H,0,0,W,H);
   res({u:o.toDataURL('image/jpeg',.88),w:W,h:H});
  };
  im.onerror=()=>res(null);
  im.src='data:'+m+';base64,'+d;
 }),[bytes.toString('base64'),mime,PAPER,INK,RED]);
 return out?{buf:Buffer.from(out.u.split(',')[1],'base64'),w:out.w,h:out.h}:null;
}

const key=s=>{let h=0;for(const c of String(s))h=(h*31+c.charCodeAt(0))>>>0;return h.toString(36)};

(async()=>{
 const f=JSON.parse(fs.readFileSync(EDITION,'utf8'));
 const jobs=[];
 for(const e of f.editions||[])for(const s of e.sections||[])for(const st of s.stories||[]){
  if(!ALLOWED.has(s.name))continue;
  if(st.photo&&st.photo.url)continue;/* a real photograph always wins */
  if(st.art&&st.art.url&&!REDRAW)continue;/* a drawing already passed an eye: do not spend it again */
  jobs.push({e:e.id,section:s.name,st});
 }
 /* A DRAWING FOR THE COVER (David, 2026-11-28: "always a cover story with a picture or drawing"). Asked for
    with --cover. cover.js is the one place that decides what the cover carries; it is asked here whether a
    photograph will do, and only when none will - not the lead's, not a near story's, not a strong story's -
    is the day's lead drawn. The drawing is kept or thrown away by the same eye and the same rules as any
    other, and the app labels it "Illustration made by a machine". */
 if(process.argv.includes('--cover')){const{choose}=require('./cover');
  for(const e of f.editions||[]){const had=e.cover&&e.cover.draw;if(had)delete e.cover.draw;const r=choose(e);if(had)e.cover.draw=had;
   if(!r.top||['near-big','near-framed','strong'].includes(r.step))continue;
   if(had&&had.url&&!REDRAW)continue;
   jobs.push({e:e.id,section:'Cover',st:r.top.st,cover:e})}}
 console.log('pages that may carry an illustration and have no photograph: '+jobs.length);
 for(const j of jobs)console.log('  '+j.e+'  '+j.section.padEnd(17)+j.st.t.slice(0,54));
 if(!jobs.length)process.exit(0);

 if(!WRITE){
  const b=await askIdea(jobs[0].st);
  console.log('\nthe brief for the first one: '+(b.idea||'REFUSED - '+b.err));
  console.log('\nnothing drawn. Pass --write.');
  process.exit(0);
 }

 fs.mkdirSync(ART,{recursive:true});
 const {openApp}=require('./app');
 const app=await openApp(),tab=await app.ctx.newPage();
 let made=0,failed=0,why='';const briefs=[];
 const live=new Set(),done=new Map();
 for(const j of jobs){
  /* the brief first. No brief, no drawing - the mechanical idea is gone and is not coming back. */
  /* ONE STORY, ONE DRAWING. Both editions usually carry the same story, and each copy was briefed, drawn and
     paid for separately - then written to the same file name, so the first edition was left pointing at a
     picture made for the second. A story already drawn in this run is given the same picture. */
  const kk=(j.cover?'c:':'s:')+(j.st.l||j.st.t);
  if(done.has(kk)){const a=done.get(kk);if(j.cover)j.cover.cover.draw={...a};else j.st.art={...a};continue}
  let idea=j.st.idea;
  if(!idea){const b=await askIdea(j.st);if(b.err){failed++;why=why||b.err;process.stdout.write('b');continue}idea=b.idea}
  briefs.push(j.section+': '+idea);
  const r=await drawTwice(STYLE+' '+idea);
  if(r.err){failed++;why=why||r.err;process.stdout.write('x');continue}
  const jp=await housePalette(tab,r.png);
  if(!jp){failed++;process.stdout.write('x');continue}
  const name=key(j.st.l||j.st.t)+(j.cover?'-c':'')+'.jpg';
  fs.writeFileSync(path.join(ART,name),jp.buf);
  const art={url:'we-art/'+name,w:jp.w,h:jp.h};done.set(kk,art);
  if(j.cover){j.cover.cover=j.cover.cover||{};j.cover.cover.draw={...art}}else j.st.art={...art};
  live.add(name);made++;process.stdout.write('.');
 }
 process.stdout.write('\n');
 /* Keep the folder to what the editions still point AT - which is not the same as what was drawn just now.
    Pruning by 'drawn this run' deleted the one good drawing the moment a skip was added, because a drawing
    that was kept rather than redrawn is exactly the one nothing in this run touched. Read the file. */
 for(const e of f.editions||[])for(const sc of e.sections||[])for(const st of sc.stories||[])
  if(st.art&&st.art.url)live.add(String(st.art.url).replace(/^.*\//,''));
 for(const e of f.editions||[])if(e.cover&&e.cover.draw&&e.cover.draw.url)live.add(String(e.cover.draw.url).replace(/^.*\//,''));
 /* ONLY THE LIVE EDITION MAY EMPTY THE LIVE FOLDER. Run on a test file with --edition, this deleted every
    published drawing the test file did not mention, and then wrote the test file over the copy the site
    serves - the clear.js accident of 27 November, still open here. The folder is pruned, and the deployed
    copy mirrored, only when the file being written IS one of the two live copies. */
 const docs=path.resolve(__dirname,'../../docs/app/world-edition.json'),www=path.resolve(ROOT,'world-edition.json');
 const LIVE=path.resolve(EDITION)===docs||path.resolve(EDITION)===www;
 if(LIVE)for(const old of fs.readdirSync(ART))if(/\.jpg$/.test(old)&&!live.has(old))fs.unlinkSync(path.join(ART,old));

 if(made){
  f.rev=new Date().toISOString();/* an issue corrected during its own day must still reach a phone that already has it */
  fs.writeFileSync(EDITION,JSON.stringify(f,null,1));
  try{if(path.resolve(EDITION)===www)fs.writeFileSync(docs,JSON.stringify(f,null,1))}catch(e){}
 }
 for(const b of briefs)console.log('  '+b);
 console.log(made+' drawn, '+failed+' not'+(why?' ('+why+')':''));
 if(failed&&/neurons|allocation/i.test(why))console.log('The account has spent its Workers AI allowance for today. It resets daily.');
 if(failed&&/auth/i.test(why))console.log('The Cloudflare token cannot run Workers AI. Add the "Workers AI" permission to it in the Cloudflare dashboard.');
 await app.close();
})();
