/* World Edition, pass 4e: the picture set in type, for the pages that have no picture at all.
 *
 * David said yes to all three kinds on 2026-11-27 (picture-desk page, artifact CUB6iGBNovNw8QrEaedeuu,
 * collection `pictures`): the number, the sentence, the small chart. Unlike a drawing, a plate may sit on a
 * NEWS page, and the reason is the whole point of it: a plate is made of the story's own words and numbers,
 * so it cannot be mistaken for evidence of anything. It claims nothing the article does not already claim.
 *
 * THE ONE RULE THAT MAKES THAT TRUE: nothing is printed that is not in the article, word for word. The model
 * chooses WHICH number and WHICH sentence; it is never allowed to write one. Every figure, every quoted line
 * and every name is checked back against the text before it is written, and a plate that fails any check is
 * thrown away whole. This is the same rule the last word runs on - "a quote is never invented, never trimmed
 * to fit, and never printed without the name on it" - and the same rule as draw.js: a bad plate is worse than
 * a bare page, so when in doubt there is no plate.
 *
 *   number    one figure the story turns on, and what it counts
 *   sentence  one line somebody actually said, and who said it
 *   chart     3 to 8 real figures that make a shape, and the line that says what moved
 *
 * The app holds the same contract again (`wePlate`), so a bad edition file cannot print a broken plate either.
 *
 * WHERE IT RUNS: the scheduled Action, after gather and after the pictures. In a cloud session publishers
 * answer 403, so feed it the text gather.js already pulled (`--text`) rather than asking it to fetch.
 *
 *   node scripts/edition/plate.js --text gathered.json           # what it would set, nothing written
 *   node scripts/edition/plate.js --text gathered.json --write   # write the plates into the edition
 *   node scripts/edition/plate.js --all                          # every bare story, not only the section leads
 */
const fs=require('fs'),path=require('path'),{ROOT}=require('./app');
const {spawn}=require('child_process');

const arg=n=>{const i=process.argv.indexOf(n);return i>0?process.argv[i+1]:null};
const EDITION=arg('--edition')||path.join(ROOT,'world-edition.json');
const DOCS=path.resolve(__dirname,'../../docs/app/world-edition.json');
const TEXT=arg('--text'),WRITE=process.argv.includes('--write'),ALL=process.argv.includes('--all');
const LIMIT=Number(arg('--limit')||4);
const ACCOUNT=process.env.CF_ACCOUNT||'cbc8ef24792cbf676d3717119cf1abb6';
const WORDS='@cf/meta/llama-3.3-70b-instruct-fp8-fast';

/* the app's own picture gate, mirrored (wePhotoOk / weArtPass). Held in two places on purpose, exactly as the
   drawing rule is: this decides which pages are bare, and the app decides again what it will print. */
const CLEAR=['logo','text','child','body','grief','mugshot'],SM=600;
const ACCUSE=/\b(accused|alleged|charged|convicted|guilty|killer|suspect|victim|arrested|indicted|sentenced)\b/i;
const hasPicture=st=>{const p=st.photo;
 if(st.art)return true;
 return !!(p&&/^https:\/\//.test(p.url||'')&&String(p.credit||'').trim()&&Math.max(+p.w||0,+p.h||0)>=SM
  &&CLEAR.every(k=>(p.clear||[]).includes(k))&&!(p.people!==false&&ACCUSE.test(st.t||'')));
};

/* The request goes through curl and not node's own https: the key is injected by this environment's outbound
   proxy, which node's https client ignores entirely (draw.js, 27 Nov - every call arrived with no credential).
   Nothing here ever sees or stores the key. */
const post=(url,body)=>new Promise(res=>{
 const c=spawn('curl',['-s','--max-time','120','-X','POST',url,'-H','content-type: application/json','--data-binary','@-']);
 let out='',bad='';
 c.stdout.setEncoding('utf8');c.stdout.on('data',d=>out+=d);
 c.stderr.setEncoding('utf8');c.stderr.on('data',d=>bad+=d);
 c.on('error',e=>res({json:null,raw:String(e.message).slice(0,200)}));
 c.on('close',()=>{try{res({json:JSON.parse(out)})}catch(e){res({json:null,raw:(bad||out||'empty answer').slice(0,200)})}});
 c.stdin.end(JSON.stringify(body));
});

const ASK='You are a magazine art editor making a full-page plate out of a story\'s own words, because there is '
 +'no photograph for the page. You are given a headline and the article. Choose ONE of three, and reply with '
 +'JSON only, no preamble and no explanation.\n'
 +'{"kind":"number","big":"<the figure exactly as the article writes it>","sub":"<at most 9 words saying what it counts>"}\n'
 +'{"kind":"sentence","line":"<one sentence somebody says in the article, copied exactly, at most 140 characters>","who":"<the name of the person who said it, as the article gives it>"}\n'
 +'{"kind":"chart","values":[<3 to 8 figures from the article, in the order the article gives them, as plain numbers>],"sub":"<at most 12 words saying what moved>"}\n'
 +'Rules you must not break: every figure, every word of the sentence and the name must appear in the article '
 +'exactly as you write them - copy, never paraphrase, never round, never translate. Choose the number only if '
 +'the story genuinely turns on it; choose the sentence only if somebody is quoted saying it; choose the chart '
 +'only if the figures are the same measure at different times or places. If none of the three is honestly '
 +'available, reply exactly: NONE';

const norm=s=>String(s||'').replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/[–—]/g,'-').replace(/\s+/g,' ').trim();
const inText=(needle,hay)=>!!needle&&norm(hay).toLowerCase().includes(norm(needle).toLowerCase());
/* A figure has to be found the way the ARTICLE writes it, not the way the model hands it over: it answers 17700
   and the page says $17,700. Caught by --selfcheck on the first run, which would otherwise have refused every
   honest chart in the edition and looked like the model's fault. */
const numText=(n,hay)=>{const v=Number(String(n).replace(/[, ]/g,''));if(!isFinite(v))return false;
 return [String(n),String(v),v.toLocaleString('en-US')].some(x=>inText(x,hay))};

/* Every check here answers one question: is this on the page the reader can go and read? A plate that cannot be
   pointed at in the article is a plate the machine wrote, and that is the thing this file exists to prevent. */
function check(p,text,title){
 const t=norm(text)+' '+norm(title);
 if(!p||typeof p!=='object')return{err:'no plate'};
 const sub=norm(p.sub);
 if(p.kind==='number'){
  const big=norm(p.big);
  if(!big||big.length>14)return{err:'the figure is missing or too long for the page: '+big.slice(0,20)};
  if(!/\d/.test(big))return{err:'the figure has no digit in it: '+big};
  if(!inText(big,t)&&!numText(big,t))return{err:'the figure is not in the article word for word: '+big};
  if(!sub||sub.length>90)return{err:'the line under the figure is missing or too long'};
  if(/\d/.test(sub)&&!inText(sub,t))return{err:'the line under the figure states a number the article does not'};
  return{plate:{kind:'number',big,sub}};
 }
 if(p.kind==='sentence'){
  let line=norm(p.line).replace(/^["']+|["']+$/g,'').trim();
  const who=norm(p.who);
  if(!line||line.length>140)return{err:'the sentence is missing or too long: '+line.slice(0,30)};
  if(!inText(line,t))return{err:'the sentence is not in the article word for word: '+line.slice(0,40)};
  if(!who||who.length>70)return{err:'the sentence has no name on it'};
  if(!inText(who,t))return{err:'the name is not in the article: '+who};
  return{plate:{kind:'sentence',line,who}};
 }
 if(p.kind==='chart'){
  const v=(Array.isArray(p.values)?p.values:[]).map(x=>Number(String(x).replace(/[, ]/g,'')));
  if(v.length<3||v.length>8||v.some(x=>!isFinite(x)||x<0))return{err:'a chart needs 3 to 8 real figures'};
  const missing=(Array.isArray(p.values)?p.values:[]).filter(x=>!numText(x,t));
  if(missing.length)return{err:'figures that are not in the article: '+missing.join(', ').slice(0,40)};
  if(!sub||sub.length>90)return{err:'the line under the chart is missing or too long'};
  const max=Math.max(...v);if(!(max>0))return{err:'every figure is zero'};
  if(max===Math.min(...v))return{err:'the figures do not move, so there is no shape to draw'};
  return{plate:{kind:'chart',bars:v.map(x=>Math.round(x/max*100)),sub}};
 }
 return{err:'the reply names no kind of plate I know'};
}

async function askPlate(st,text){
 const body=String(text||'').replace(/\s+/g,' ').slice(0,6000);
 const r=await post('https://api.cloudflare.com/client/v4/accounts/'+ACCOUNT+'/ai/run/'+WORDS,
  {messages:[{role:'system',content:ASK},{role:'user',content:'Headline: '+String(st.t||'')+'\n\nArticle:\n'+body}],
   max_tokens:240,temperature:.2});
 if(!r.json||!r.json.success){
  return{err:(r.json&&r.json.errors&&r.json.errors[0]&&r.json.errors[0].message)||r.raw||'the service did not answer'};
 }
 let out=String((r.json.result&&(r.json.result.response||r.json.result.output))||'').trim();
 if(/^NONE\b/i.test(out))return{err:'the model found nothing honest to print'};
 const m=out.match(/\{[\s\S]*\}/);if(!m)return{err:'the reply was not JSON: '+out.slice(0,70)};
 let p=null;try{p=JSON.parse(m[0])}catch(e){return{err:'the reply was not JSON I could read: '+m[0].slice(0,70)}}
 return check(p,body,st.t);
}

/* --selfcheck proves the one rule this file turns on, without spending a model call: a plate that is not in
   the article is refused. Every case below is a thing a model actually does - rounding a figure, tidying a
   quote, hanging a real line on the wrong name, drawing a chart of numbers nobody wrote down. */
const SELF=[
 ['number, as written',{kind:'number',big:'2,000',sub:'people she cooks for every year'},true],
 ['number, rounded by the model',{kind:'number',big:'2,500',sub:'people she cooks for every year'},false],
 ['number with no digit',{kind:'number',big:'two thousand',sub:'people she cooks for'},false],
 ['number, line invents a figure',{kind:'number',big:'2,000',sub:'up from 900 in 1988'},false],
 ['sentence, word for word',{kind:'sentence',line:'Thank you so very much, community.',who:'Kennard'},true],
 ['sentence, tidied up',{kind:'sentence',line:'Thank you so much, community.',who:'Kennard'},false],
 ['sentence, wrong name on it',{kind:'sentence',line:'Thank you so very much, community.',who:'Emma Watson'},false],
 ['sentence with no name',{kind:'sentence',line:'Thank you so very much, community.',who:''},false],
 ['chart of real figures',{kind:'chart',values:[15000,17700,27000],sub:'the goal, October, the total'},true],
 ['chart with an invented figure',{kind:'chart',values:[15000,21000,27000],sub:'the goal, October, the total'},false],
 ['chart that does not move',{kind:'chart',values:[2000,2000,2000],sub:'people fed'},false],
 ['chart of two figures',{kind:'chart',values:[15000,27000],sub:'the goal and the total'},false]];
function selfcheck(){
 const text="After 37 years of eating Gloria Kennard's Thanksgiving dinners, a Texas community was hungry to return the "
  +'kindness. The devout woman cooks for 2,000 people every year, but the town was busy raising over $27,000 to buy '
  +'"Miss Gloria" a new car. "Thank you so very much, community. And God bless you," Kennard told local news. The Bridge '
  +'Ministries launched a GoFundMe with a $15,000 goal. By October, 174 donors had contributed more than $17,700.';
 let bad=0;
 for(const [name,p,want] of SELF){const r=check(p,text,'Town Rewards a Woman Whose Thanksgiving Meal Feeds Thousands');
  const got=!r.err;if(got!==want)bad++;
  console.log((got===want?'  ok   ':'  FAIL ')+name.padEnd(30)+(r.err?'refused: '+r.err:'printed: '+JSON.stringify(r.plate)))}
 console.log(bad?bad+' case(s) wrong':'every case behaved');return bad}

(async()=>{
 if(process.argv.includes('--selfcheck'))return process.exit(selfcheck()?1:0);
 const d=JSON.parse(fs.readFileSync(EDITION,'utf8'));
 const texts=new Map();
 if(TEXT){const g=JSON.parse(fs.readFileSync(TEXT,'utf8'));
  for(const k of (g.kept||g.stories||[]))if(k&&k.link)texts.set(k.link,k.text||'')}

 const want=[];
 for(const e of (d.editions||[d])) for(const s of (e.sections||[]))
  (s.stories||[]).forEach((st,i)=>{if(!hasPicture(st)&&(ALL||i===0))want.push({st,sec:s.name,ed:e})});

 if(!want.length){console.log('every page already carries a picture: no plate needed');return}
 console.log(want.length+' bare page'+(want.length===1?'':'s')+(LIMIT<want.length?', taking the first '+LIMIT:''));

 let set=0;
 for(const w of want.slice(0,LIMIT)){
  const text=texts.get(w.st.l)||'';
  const head=w.sec+' / '+String(w.st.t||'').slice(0,54);
  if(!text){console.log('  -- '+head+': no article text (pass --text from gather.js)');continue}
  const r=await askPlate(w.st,text);
  if(r.err){console.log('  -- '+head+': '+r.err);continue}
  console.log('  ok '+head+': '+JSON.stringify(r.plate));
  if(WRITE){w.st.plate=r.plate;set++}
 }

 if(WRITE&&set){
  /* the rev stamp, or the correction never travels: a phone keeps an issue of the same date unless rev differs
     (HANDOFF, 1.400). Any pass that edits an issue in place must stamp it. */
  d.rev=new Date().toISOString();
  fs.writeFileSync(EDITION,JSON.stringify(d,null,1));
  if(fs.existsSync(DOCS))fs.writeFileSync(DOCS,JSON.stringify(d,null,1));
  console.log(set+' plate'+(set===1?'':'s')+' written, issue stamped '+d.rev);
 } else if(WRITE) console.log('nothing to write');
})().catch(e=>{console.error('FAIL plate: '+(e&&e.stack||e));process.exit(1)});
