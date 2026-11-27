/* World Edition, pass 0 and pass 1: gather and gate. No model, no judgement - just "can this story be read?"
 *
 * The one rule that matters here: THIS DOES NOT REIMPLEMENT THE READER. It loads www/index.html in a headless
 * browser and calls the app's own getFull(), which fetches, extracts, tidies and junk-cleans exactly the way the
 * phone does. So the pipeline cleans text the same way the reader does, forever, and there is no second cleaner to
 * keep in step. (WORLD-EDITION-PIPELINE.md, pass 0.)
 *
 * Pass 1 is the gate: a story that did not come through is dropped here rather than printed as a hollow page. That
 * is the same judgement the edition now makes at render time, applied early enough to pick a different story.
 *
 * WHERE IT RUNS: the scheduled Action, where the network is open. In a cloud session publishers answer 403 or
 * nothing, so most stories will fail here with "could not be fetched" - that is the environment, not the code.
 * Pass --fixtures <dir> to read local copies instead and exercise the whole path offline.
 *
 *   node scripts/edition/gather.js --candidates cand.json   # gate the stories pick.js chose from the feeds
 *   node scripts/edition/gather.js                          # or re-gate the stories in today's edition file
 *   node scripts/edition/gather.js --json out.json          # also write the gathered text
 *   node scripts/edition/gather.js --fixtures tests/fixtures
 */
const fs=require('fs'),path=require('path'),{openApp,ROOT}=require('./app');
const EDITION=path.join(ROOT,'world-edition.json');

const arg=n=>{const i=process.argv.indexOf(n);return i>0?process.argv[i+1]:null};
const OUT=arg('--json'),FIX=arg('--fixtures'),CAND=arg('--candidates');

/* The gate. Deliberately blunt: these are the conditions under which there is no story to print, not a judgement
   about whether the story is any good. That judgement is pass 2, and it needs a model. */
const MIN_WORDS=120;          /* a printed page holds 150-250; under 120 there is not a page in it */
const MIN_PARAS=3;
/* One slow publisher must never stall the edition. The app tries the page, several relays and a reader service in
   turn, each with its own timeout, so a story that is simply unreachable can take minutes to give up - fine on a
   phone where a person is waiting and can leave, useless in a build that has to finish. A story that has not been
   read by the deadline is dropped like any other, and the edition goes out without it. */
/* David, 2026-11-26: "25 second time out seems short. Maybe give it more time." It was short: on the
   26 November run it threw away both obituaries and sixteen stories in all, and a phone reading the same
   page would have waited longer. 45 seconds now, and the gate reads three stories at once so the whole pass
   still finishes in about the same wall-clock time it used to take at 25. */
const DEADLINE=Number(arg('--deadline')||45)*1000;
const LANES=Number(arg('--lanes')||3);

/* Where the day's stories come from. `--candidates` is the real pipeline: the list `pick.js` chose from the
   feeds by counting. With no flag it falls back to the stories in the edition file, which is how this started
   and is still the way to re-gate an edition that already exists. */
function candidates(){
 const seen=new Set(),out=[],add=(st,section,edition)=>{
  if(!st.l||seen.has(st.l))return;seen.add(st.l);
  out.push({link:st.l,title:st.h||st.t,outlet:st.o,section,edition,sibs:st.sibs||[]});
 };
 if(CAND){
  const d=JSON.parse(fs.readFileSync(CAND,'utf8'));
  /* every edition's stories, not just the first one's: the two editions share most of them, and `add` keeps
     each address once, so the extra edition costs almost nothing to gate */
  for(const e of d.editions||[{name:'picked',sections:d.sections||[]}])
   for(const s of e.sections||[])for(const st of s.stories||[])add(st,s.name,e.name||'picked');
  return out;
 }
 const d=JSON.parse(fs.readFileSync(EDITION,'utf8'));
 for(const e of d.editions||[])for(const s of e.sections||[])for(const st of s.stories||[])add(st,s.name,e.name);
 return out;
}

(async()=>{
 const list=candidates();
 if(!list.length){console.log('no candidate stories in '+EDITION);process.exit(1)}
 /* with --fixtures the harness answers every off-site address with a local copy, so the whole path runs offline */
 const app=await openApp({fixtures:FIX}),p=app.page;

 const kept=[],dropped=[];
 /* One page per lane, so three stories are read at once. The app's own reader is what does the reading in
    each of them, exactly as before. */
 const lanes=[p];for(let i=1;i<LANES;i++)lanes.push(await app.ctx.newPage());
 for(const lp of lanes.slice(1)){
  await lp.goto(app.url,{waitUntil:'domcontentloaded'});await lp.waitForTimeout(1200);
  await lp.evaluate(()=>{setInterval(()=>dispatchEvent(new Event('wheel')),800)});
 }

 const readOne=(lp,url)=>Promise.race([
  new Promise(res=>setTimeout(()=>res({slow:1}),DEADLINE)),
  lp.evaluate(async u=>{
   let n=null;try{n=await getFull(u,false)}catch(e){return{err:String(e&&e.message||e),log:(LG[u]||[]).slice(-3)}}
   if(!n)return{none:1,log:(LG[u]||[]).slice(-3)};
   const ps=[...n.querySelectorAll('p')].map(x=>x.textContent.trim()).filter(Boolean);
   /* The pictures the story itself carries, with whatever the publisher wrote under them. A magazine is
      pictures as much as words, and these are the only ones we may print: the publisher's own, shown from
      the publisher's own address. Nothing is judged here - that is the clearance pass. */
   const pics=[...n.querySelectorAll('img')].map(im=>{
    const fig=im.closest('figure'),cap=fig&&fig.querySelector('figcaption');
    return{src:im.getAttribute('src')||im.getAttribute('data-src')||'',
      w:+im.getAttribute('width')||0,h:+im.getAttribute('height')||0,
      alt:(im.getAttribute('alt')||'').replace(/\s+/g,' ').trim().slice(0,160),
      cap:cap?cap.textContent.replace(/\s+/g,' ').trim().slice(0,220):''};
   }).filter(x=>/^https:\/\//.test(x.src));
   return{tier:n.tier||'',pw:!!n.pw,gate:!!n.gate,preview:!!n.gated_preview,incomplete:!!n.incomplete,
     paras:ps.length,words:ps.join(' ').split(/\s+/).filter(Boolean).length,pics,
     text:ps.join('\n\n'),log:(LG[u]||[]).slice(-3)};
  },url)]).catch(e=>({err:String(e)}));

 const verdict=r=>{
  if(!r)return 'nothing came back';
  if(r.slow)return 'gave up after '+(DEADLINE/1000)+'s';
  if(r.err)return 'the fetch itself failed ('+r.err+')';
  if(r.none)return 'could not be fetched or read';
  if(r.pw||r.gate||r.preview)return 'behind a paywall or sign-in';
  if(r.paras<MIN_PARAS)return 'only '+r.paras+' paragraph'+(r.paras===1?'':'s');
  if(r.words<MIN_WORDS)return 'only '+r.words+' words';
  return '';
 };

 /* THE SWAP RULE, which issue 47 asked for and the gate never had: "a story that can't be fetched is swapped
    for one that loads". The grouping already knows which other newsrooms covered the same event, so when a
    publisher's page will not answer, their version is tried before the place is given up. On 26 November the
    Obituary page was empty because Billboard timed out while two other newsrooms' versions of the same death
    sat unused. */
 let i=0;
 const work=async lp=>{
  while(i<list.length){
   const c=list[i++];
   let r=await readOne(lp,c.link),why=verdict(r),swap=null;
   if(why)for(const sb of (c.sibs||[]).slice(0,2)){
    if(!sb||!sb.l||/news\.google\.com/.test(sb.l))continue;
    const r2=await readOne(lp,sb.l),w2=verdict(r2);
    if(!w2){r=r2;why='';swap={l:sb.l,o:sb.o||'',t:sb.t||''};break}
   }
   if(why){dropped.push({...c,why,log:(r&&r.log)||[]});process.stdout.write('x')}
   else{kept.push({...c,tier:r.tier,paras:r.paras,words:r.words,text:r.text,pics:r.pics||[],swap});
    process.stdout.write(swap?'s':'.')}
  }
 };
 await Promise.all(lanes.map(work));
 process.stdout.write('\n\n');

 console.log('READ  '+kept.length+' of '+list.length+' stories');
 for(const k of kept)console.log('  '+String(k.words).padStart(5)+' words  '+k.tier.padEnd(8)+'  '+k.title.slice(0,62));
 if(dropped.length){
  console.log('\nDROPPED  '+dropped.length);
  for(const d of dropped){console.log('  '+d.title.slice(0,62)+'\n      '+d.why+(d.log&&d.log.length?'\n      last: '+d.log[d.log.length-1]:''))}
 }
 /* the stop condition from the plan: a thin edition never replaces a good one */
 console.log('\n'+(kept.length<10
   ? 'STOP: fewer than 10 stories survived the gate, so the edition already live would be kept.'
   : 'OK: enough stories survived the gate to build an edition.'));

 if(OUT){fs.writeFileSync(OUT,JSON.stringify({gathered:new Date().toISOString(),kept,dropped:dropped.map(d=>({link:d.link,title:d.title,why:d.why}))},null,1));
  console.log('written to '+OUT)}
 await app.close();
 process.exit(kept.length<10?2:0);
})();
