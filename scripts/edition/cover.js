/* World Edition: give the cover its picture - AFTER the pictures exist.
 *
 * David, 2026-11-28: "Make sure there's always a cover story. I mean a cover story with a picture or drawing."
 *
 * WHY THE COVER WAS ALWAYS BARE. compose.js chooses the cover photograph at the moment it writes the edition,
 * from the stories that carry a photograph. At that moment NONE do: a photograph is only printed after an eye
 * has cleared it, and the clearing (photos.js, clear.js) runs afterwards. Nothing ever went back to the cover,
 * so every edition the pipeline built by itself had a type cover - issue No. 4 went out bare with sixteen
 * cleared photographs inside it. This step is the going back. It runs LAST, after clear.js and draw.js.
 *
 * THE ORDER, and each step is tried only when the one above found nothing:
 *   1. NEAR, BIG    the lead story, or one within 3 newsrooms of it, with a cover-size photograph (1,600px).
 *                   Printed full-bleed. This is compose.js's own rule, run now that it can succeed.
 *   2. NEAR, FRAMED the same stories with a photograph of 1,000px or more. Too small to fill the page, so it
 *                   is set as a framed picture above the headline (`frame: true`), which is how print runs a
 *                   photograph it cannot bleed.
 *   3. STRONG       any story reported by at least half as many newsrooms as the lead (and at least 2),
 *                   most-reported first. The cover story MOVES to it and the note on the method page says so.
 *   4. DRAWN        a drawing made for the lead story (draw.js --cover writes `cover.draw`), framed.
 *   5. ANY          any cleared photograph of 1,000px or more, most-reported story first. A cover with a
 *                   real picture of a lesser story beats a bare one.
 *   6. TYPE         nothing at all was cleared and nothing was drawn. Said plainly; exit code 3.
 *
 * WHAT IT NEVER DOES: print a photograph that was not cleared (all six marks), or one of an identifiable
 * person under a headline that accuses (the app refuses those too), or take the cover from a standing page
 * (the obituary, the archive, the back page, a review, an explainer) - same list as compose.js.
 *
 *   node scripts/edition/cover.js                 # say what it would do, both editions
 *   node scripts/edition/cover.js --write         # do it, and stamp a fresh rev so phones take the change
 *   node scripts/edition/cover.js --edition f.json [--write]   # another file; never mirrors to the live copy
 *   node scripts/edition/cover.js --selfcheck     # the order above, proved on made-up issues
 */
const fs=require('fs'),path=require('path');
const arg=n=>{const i=process.argv.indexOf(n);return i>0?process.argv[i+1]:null};
const WRITE=process.argv.includes('--write'),GIVEN=arg('--edition');
const ROOT=path.resolve(__dirname,'../../www');
const EDITION=GIVEN||path.join(ROOT,'world-edition.json');
const DOCS=path.resolve(__dirname,'../../docs/app/world-edition.json');

const NOT_COVER=new Set(['Obituary','From the archive','Back page','Review','Explainer']);/* compose.js's list */
const MARKS=['logo','text','child','body','grief','mugshot'];                               /* the app's WE_CLEAR */
const ACCUSE=/\b(scandal|charged|accused|alleged|allegedly|indicted|arrested|convicted|guilty|suspect|fraud)\b/i;/* the app's WE_ACCUSE */
const BIG=1600,FRAMED=1000;

const usable=(st,min)=>{const p=st&&st.photo;
 return !!(p&&/^https:\/\//.test(p.url||'')&&String(p.credit||'').trim()&&(+p.w||0)>=min&&(+p.w||0)>=(+p.h||0)
  &&MARKS.every(k=>(p.clear||[]).includes(k))&&!(p.people!==false&&ACCUSE.test(String(st.h||st.t||''))))};
/* widest first, and a proper landscape ahead of a near-square one: the same preference compose.js states */
const best=l=>l.slice().sort((a,b)=>(b.n-a.n)||((b.st.photo.w*(b.st.photo.w/b.st.photo.h>=1.3?1.15:1))-(a.st.photo.w*(a.st.photo.w/a.st.photo.h>=1.3?1.15:1))));
const widest=l=>l.slice().sort((a,b)=>(b.st.photo.w*(b.st.photo.w/b.st.photo.h>=1.3?1.15:1))-(a.st.photo.w*(a.st.photo.w/a.st.photo.h>=1.3?1.15:1)));

/* A SECTION OPENS ON ITS PICTURE (David, 2026-11-28: "And more pictures in the magazine? The ones there look
   good but they are rare"). They were rare because they were hidden, not because they were missing: issue
   No. 4 had sixteen cleared photographs and its Home, World, Business, Culture and Long read sections all
   opened on a bare page with a photograph sitting on a story further down. compose.js already says "the lead
   follows the picture" - and, like the cover, it says so before any picture exists. This is the same rule run
   when it can work: in each section, if the opening story has no picture and a later one does, the pictured
   story opens the section. The obituary page keeps its order; who is named first there is not a layout choice. */
const pictured=st=>{const p=st&&st.photo;return !!(p&&/^https:\/\//.test(p.url||'')&&String(p.credit||'').trim()&&Math.max(+p.w||0,+p.h||0)>=600
  &&MARKS.every(k=>(p.clear||[]).includes(k))&&!(p.people!==false&&ACCUSE.test(String(st.h||st.t||''))))||!!(st&&st.art&&st.art.url)};
function openOnPicture(e){let moved=0;
 for(const s of e.sections||[]){const st=s.stories||[];if(st.length<2||s.name==='Obituary'||pictured(st[0]))continue;
  const i=st.findIndex(pictured);if(i<1)continue;
  const[x]=st.splice(i,1);st.unshift(x);moved++;
  /* the summary line was written for the story that used to open; it does not travel to another story */
 }
 return moved}

function choose(e){
 const all=[];
 (e.sections||[]).forEach((s,si)=>{if(NOT_COVER.has(s.name))return;
  (s.stories||[]).forEach((st,ti)=>all.push({st,lead:[si,ti],n:st.n||1,sec:s.name}))});
 if(!all.length)return{step:'type',why:'the edition has no story that may lead'};
 all.sort((a,b)=>b.n-a.n);
 const top=all[0],near=all.filter(p=>p.n>=top.n-3);
 let l=widest(near.filter(p=>usable(p.st,BIG)));
 if(l.length)return{step:'near-big',pick:l[0],top,frame:false};
 l=widest(near.filter(p=>usable(p.st,FRAMED)));
 if(l.length)return{step:'near-framed',pick:l[0],top,frame:true};
 l=best(all.filter(p=>p.n>=Math.max(2,Math.ceil(top.n/2))&&usable(p.st,FRAMED)));
 if(l.length)return{step:'strong',pick:l[0],top,frame:!usable(l[0].st,BIG)};
 const d=e.cover&&e.cover.draw;
 if(d&&d.url&&d.w&&d.h)return{step:'drawn',top,draw:d};
 l=best(all.filter(p=>usable(p.st,FRAMED)));
 if(l.length)return{step:'any',pick:l[0],top,frame:!usable(l[0].st,BIG)};
 return{step:'type',top,why:'no photograph in this edition has been cleared at 1,000px or more, and no cover drawing was kept'};
}

const NOTE={
 'near-big':()=>'The lead story’s own photograph, looked at before it was printed.',
 'near-framed':()=>'The lead story’s own photograph, looked at before it was printed.',
 strong:r=>'The most reported story of the day had no photograph that could be printed, so the cover carries the next one that did: reported by '+r.pick.n+' newsrooms against '+r.top.n+'.',
 drawn:()=>'No photograph of the lead story could be printed, so the cover carries a drawing made for it by a machine and looked at before it was printed.',
 any:r=>'No story near the top of the day had a photograph that could be printed. The cover carries the best one in the issue, from a story reported by '+r.pick.n+' newsroom'+(r.pick.n===1?'':'s')+'.',
 type:()=>'No photograph on the cover: none in this edition had been looked at and was big enough, and no drawing was kept.'
};

function apply(e){
 const opened=openOnPicture(e);
 const r=choose(e);e.cover=e.cover||{};
 const same=r.pick&&e.cover.lead&&r.pick.lead[0]===e.cover.lead[0]&&r.pick.lead[1]===e.cover.lead[1];
 if(r.pick){e.cover.lead=r.pick.lead;e.cover.photo=r.pick.st.photo;if(r.frame)e.cover.frame=true;else delete e.cover.frame}
 else{e.cover.photo=null;delete e.cover.frame;if(r.top)e.cover.lead=r.top.lead}
 e.cover.photoNote=NOTE[r.step](r);
 return{...r,moved:!!(r.pick&&!same),opened};
}

module.exports={choose,apply,usable};
if(require.main!==module)return;/* draw.js asks `choose` whether a photograph will do before it draws one */
if(process.argv.includes('--selfcheck')){
 const ph=(w,h,extra)=>({url:'https://x.example/p.jpg',credit:'A. Photographer',w,h,clear:MARKS.slice(),people:false,...extra});
 const iss=(stories,draw)=>({cover:{lead:[0,0],...(draw?{draw:{url:'we-art/c.jpg',w:942,h:942}}:{})},sections:[{name:'Home',stories},{name:'Back page',stories:[{t:'A standing page',n:99,photo:ph(4000,2000)}]}]});
 /* the section opens on its pictured story first, so a pictured story is at index 0 by the time the cover is chosen */
 const cases=[
  ['the lead has a cover-size photograph',iss([{t:'Lead',n:12,photo:ph(2400,1350)},{t:'Other',n:10}]),'near-big',[0,0],false],
  ['a story within three of the lead has one',iss([{t:'Lead',n:12},{t:'Close',n:9,photo:ph(1920,1080)}]),'near-big',[0,0],false],
  ['the lead has only a smaller photograph',iss([{t:'Lead',n:12,photo:ph(1200,675)},{t:'Other',n:2,photo:ph(3000,1500)}]),'near-framed',[0,0],true],
  ['nothing near, a strong story has one (issue No. 4)',iss([{t:'Lead',n:12},{t:'Second',n:10},{t:'Hack',n:8,photo:ph(1500,999)},{t:'Kitchen',n:1,photo:ph(2560,1440)}]),'strong',[0,0],true],
  ['nothing strong, a drawing was kept',iss([{t:'Lead',n:12},{t:'Kitchen',n:1,photo:ph(2560,1440)}],true),'drawn',[0,1],undefined],
  ['nothing strong and no drawing: the best in the issue',iss([{t:'Lead',n:12},{t:'Kitchen',n:1,photo:ph(2560,1440)}]),'any',[0,0],false],
  ['a photograph that was not fully cleared is never taken',iss([{t:'Lead',n:12,photo:ph(2400,1350,{clear:['logo','text']})}]),'type',[0,0],undefined],
  ['an identifiable person under an accusing headline is never taken',iss([{t:'Minister charged with fraud',n:12,photo:ph(2400,1350,{people:true})}]),'type',[0,0],undefined],
  ['a portrait-shaped photograph is never taken',iss([{t:'Lead',n:12,photo:ph(1400,2100)}]),'type',[0,0],undefined],
  ['a standing page never takes the cover, however big its picture',iss([{t:'Lead',n:1}]),'type',[0,0],undefined]
 ];
 let bad=0;
 for(const[name,e,step,lead,frame] of cases){const r=apply(e);
  const ok=r.step===step&&e.cover.lead[0]===lead[0]&&e.cover.lead[1]===lead[1]&&(frame===undefined||!!e.cover.frame===frame)&&(step==='type'||step==='drawn'?e.cover.photo===null:!!e.cover.photo);
  if(!ok)bad++;console.log((ok?'  ok   ':'  FAIL ')+name.padEnd(62)+' -> '+r.step+' '+JSON.stringify(e.cover.lead)+(e.cover.frame?' framed':''))}
 console.log(bad?bad+' case(s) wrong':'every case behaved');process.exit(bad?1:0);
}

const f=JSON.parse(fs.readFileSync(EDITION,'utf8'));
let bare=0;
for(const e of f.editions||[]){
 const r=apply(e),st=r.pick?r.pick.st:(r.top&&r.top.st);
 console.log((e.name||e.id)+': '+({'near-big':'a full-page photograph','near-framed':'a framed photograph',strong:'a photograph from a strong story',drawn:'a drawing for the lead',any:'the best photograph in the issue',type:'NO PICTURE'})[r.step]
  +(st?'  -  '+String(st.h||st.t||'').slice(0,64)+' ('+(r.pick?r.pick.n:r.top.n)+' newsroom'+((r.pick?r.pick.n:r.top.n)===1?'':'s')+')':'')
  +(r.pick?'  '+r.pick.st.photo.w+'x'+r.pick.st.photo.h+(e.cover.frame?', framed':', full page')+', '+r.pick.st.photo.credit:'')
  +(r.moved?'  [the cover story moved]':'')+(r.why?'  - '+r.why:'')+(r.opened?'\n   '+r.opened+' section'+(r.opened===1?' now opens':'s now open')+' on a pictured story':''));
 if(r.step==='type')bare++;
}
if(WRITE){f.rev=new Date().toISOString();
 fs.writeFileSync(EDITION,JSON.stringify(f,null,1));
 if(!GIVEN)try{fs.writeFileSync(DOCS,JSON.stringify(f,null,1))}catch(e){}/* never the deployed copy when an explicit --edition was given: see clear.js */
 console.log('written, rev '+f.rev)}
else console.log('(nothing written - add --write)');
process.exit(bare?3:0);
