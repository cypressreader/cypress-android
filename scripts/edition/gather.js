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
 *   node scripts/edition/gather.js                      # today's edition file, live
 *   node scripts/edition/gather.js --json out.json      # also write the gathered text
 *   node scripts/edition/gather.js --fixtures tests/fixtures
 */
const fs=require('fs'),path=require('path'),http=require('http');
const PW=require('child_process').execSync('npm root -g').toString().trim()+'/playwright';
const {chromium}=require(PW);
const ROOT=path.resolve(__dirname,'../../www');
const EDITION=path.join(ROOT,'world-edition.json');

const arg=n=>{const i=process.argv.indexOf(n);return i>0?process.argv[i+1]:null};
const OUT=arg('--json'),FIX=arg('--fixtures');

/* The gate. Deliberately blunt: these are the conditions under which there is no story to print, not a judgement
   about whether the story is any good. That judgement is pass 2, and it needs a model. */
const MIN_WORDS=120;          /* a printed page holds 150-250; under 120 there is not a page in it */
const MIN_PARAS=3;
/* One slow publisher must never stall the edition. The app tries the page, several relays and a reader service in
   turn, each with its own timeout, so a story that is simply unreachable can take minutes to give up - fine on a
   phone where a person is waiting and can leave, useless in a build that has to finish. A story that has not been
   read by the deadline is dropped like any other, and the edition goes out without it. */
const DEADLINE=Number(arg('--deadline')||25)*1000;

const MIME={'.html':'text/html','.json':'application/json','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const serve=()=>new Promise(res=>{const s=http.createServer((q,r)=>{let f=path.join(ROOT,decodeURIComponent(q.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';
 if(!f.startsWith(ROOT)||!fs.existsSync(f)){r.writeHead(404);return r.end()}
 r.writeHead(200,{'content-type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r)});s.listen(0,'127.0.0.1',()=>res(s))});

function candidates(){
 const d=JSON.parse(fs.readFileSync(EDITION,'utf8')),seen=new Set(),out=[];
 for(const e of d.editions||[])for(const s of e.sections||[])for(const st of s.stories||[]){
  if(!st.l||seen.has(st.l))continue;seen.add(st.l);
  out.push({link:st.l,title:st.h||st.t,outlet:st.o,section:s.name,edition:e.name});
 }
 return out;
}

(async()=>{
 const list=candidates();
 if(!list.length){console.log('no candidate stories in '+EDITION);process.exit(1)}
 const srv=await serve(),url='http://127.0.0.1:'+srv.address().port+'/index.html';
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:412,height:915}});

 /* offline mode: serve a local copy for any story that has one, so the whole path can be exercised with no network */
 if(FIX){const dir=path.resolve(FIX);
  await ctx.route(u=>!/^(127\.0\.0\.1|localhost)$/.test(u.hostname),(r,q)=>{
   const f=path.join(dir,encodeURIComponent(decodeURIComponent(q.url())).slice(0,120)+'.html');
   if(fs.existsSync(f))return r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:fs.readFileSync(f,'utf8')});
   return r.abort().catch(()=>{})});
 }

 const p=await ctx.newPage();
 await p.goto(url,{waitUntil:'domcontentloaded'});await p.waitForTimeout(1500);
 /* the app holds background work back until the finger is still; a steady wheel event keeps userRest() true */
 await p.evaluate(()=>{setInterval(()=>dispatchEvent(new Event('wheel')),800)});

 const kept=[],dropped=[];
 for(const c of list){
  const r=await Promise.race([
   new Promise(res=>setTimeout(()=>res({slow:1}),DEADLINE)),
   p.evaluate(async u=>{
    let n=null;try{n=await getFull(u,false)}catch(e){return{err:String(e&&e.message||e),log:(LG[u]||[]).slice(-3)}}
    if(!n)return{none:1,log:(LG[u]||[]).slice(-3)};
    const ps=[...n.querySelectorAll('p')].map(x=>x.textContent.trim()).filter(Boolean);
    return{tier:n.tier||'',pw:!!n.pw,gate:!!n.gate,preview:!!n.gated_preview,incomplete:!!n.incomplete,
      paras:ps.length,words:ps.join(' ').split(/\s+/).filter(Boolean).length,
      text:ps.join('\n\n'),log:(LG[u]||[]).slice(-3)};
  },c.link)]).catch(e=>({err:String(e)}));

  let why='';
  if(r.slow)why='gave up after '+(DEADLINE/1000)+'s';
  else if(r.err)why='the fetch itself failed ('+r.err+')';
  else if(r.none)why='could not be fetched or read';
  else if(r.pw||r.gate||r.preview)why='behind a paywall or sign-in';
  else if(r.paras<MIN_PARAS)why='only '+r.paras+' paragraph'+(r.paras===1?'':'s');
  else if(r.words<MIN_WORDS)why='only '+r.words+' words';

  if(why){dropped.push({...c,why,log:r.log||[]});process.stdout.write('x')}
  else{kept.push({...c,tier:r.tier,paras:r.paras,words:r.words,text:r.text});process.stdout.write('.')}
 }
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
 await b.close();srv.close();
 process.exit(kept.length<10?2:0);
})();
