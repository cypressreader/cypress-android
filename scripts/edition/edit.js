/* World Edition: the reading pass - every story is read before it is printed, against STYLEBOOK.md.
 *
 * David, 2026-11-28: "have it set up to be everything automatic done by Claude. Set up the rules."
 *
 * WHY THIS EXISTS. Every editorial rule the pipeline had matched WORDS IN A HEADLINE (pick.js). That is a
 * sieve, and each live run found what it lets through: a rapper called Stove God Cooks in Food, because of
 * the word "cooks"; a blog announcing its own contest leading the Review page, because of the word
 * "review"; "Rumer Willis shares touching moment" in Business, because of the word "shares". Rules like
 * that are never finished. A reader is: the same Claude session that already looks at every photograph now
 * READS every story - its headline, its summary and its opening - and answers the five questions in
 * STYLEBOOK.md section 2.
 *
 * IT ONLY EVER REFUSES. It cannot add a story, move one, reorder a section or change a word, so the promise
 * on the method page - nobody hand-picks the news - stays true. It works exactly like the picture pass
 * (photos.js / clear.js): this lays the stories out, an eye reads them and writes verdicts, this writes
 * the verdicts down.
 *
 *   node scripts/edition/edit.js --gathered got.json --out tmp-edit
 *        writes tmp-edit/sheet.md (read this) and tmp-edit/sheet.json (the numbers)
 *   node scripts/edition/edit.js --sheet tmp-edit/sheet.json --verdicts v.json           # say what it would do
 *   node scripts/edition/edit.js --sheet tmp-edit/sheet.json --verdicts v.json --write   # do it
 *   node scripts/edition/edit.js --selfcheck
 *   --edition f.json   another edition file; never mirrored over the live copy
 *
 * THE VERDICT FILE: {"3":{"keep":true},"7":{"keep":false,"rule":"2.2","why":"a column"},"12":{"keep":true,"dek":false},
 *                    "2":{"keep":true,"except":["US Edition"],"rule":"2.3","why":"a Canadian ruling is not Home news"}}
 * `except` names the editions a kept story is taken OUT of. Found on the first real reading (28 November): the
 * two editions give the same story different pages, and a story can be on the right page in one and the
 * wrong page in the other. Without this the only choices were to print it wrongly or lose it from both.
 *
 * WHAT IT REFUSES TO DO, so a mistake cannot empty the magazine or print something unread:
 *   - a story with no verdict, or whose `keep` is not exactly true, is REMOVED: unread is not printed;
 *   - a verdict for a number that is not on the sheet stops everything, nothing written - the sheet and the
 *     reading have come apart;
 *   - if the verdicts would leave an edition with fewer than 10 stories it writes NOTHING and says so. An
 *     editor who refuses most of an issue has misread the stylebook, and the unedited issue is the safer one.
 */
const fs=require('fs'),path=require('path');
const arg=n=>{const i=process.argv.indexOf(n);return i>0?process.argv[i+1]:null};
const WRITE=process.argv.includes('--write'),GIVEN=arg('--edition');
const ROOT=path.resolve(__dirname,'../../www');
const EDITION=GIVEN||path.join(ROOT,'world-edition.json');
const DOCS=path.resolve(__dirname,'../../docs/app/world-edition.json');
const MIN=10;

/* every story in the file once, however many editions and pages carry it */
function lay(f,got){
 const text=new Map();
 for(const k of (got&&got.kept)||[]){text.set(k.link,k);for(const s of k.sibs||[])if(s&&s.l&&!text.has(s.l))text.set(s.l,k);if(k.swap&&k.swap.l)text.set(k.swap.l,k)}
 const byTitle=new Map(((got&&got.kept)||[]).map(k=>[String(k.title||'').toLowerCase().slice(0,60),k]));
 const cards=[],seen=new Map();
 for(const e of f.editions||[])(e.sections||[]).forEach(s=>(s.stories||[]).forEach((st,i)=>{
  let c=seen.get(st.l);
  if(!c){const g=text.get(st.l)||byTitle.get(String(st.t||'').toLowerCase().slice(0,60))||null;
   c={no:cards.length+1,link:st.l,title:st.h||st.t||'',outlet:st.o||'',dek:st.dek||'',words:g?g.words||0:0,
      opening:g?String(g.text||'').replace(/\s*\n\s*/g,' ¶ ').slice(0,900):'',where:[]};
   seen.set(st.l,c);cards.push(c)}
  c.where.push((e.name||e.id)+' / '+s.name+(i===0?' (opens the section)':''))}));
 return cards}

function sheet(cards,f){
 const L=['# Reading sheet - '+f.date+', No. '+f.issue,'',
  'Read STYLEBOOK.md first. For each story answer its five questions (section 2) and write a verdict.',
  'A story with no verdict is removed. `¶` marks a paragraph break. '+cards.length+' stories.',''];
 for(const c of cards){
  L.push('## '+c.no+'. '+c.title);
  L.push('- **where**: '+c.where.join('; '));
  L.push('- **outlet**: '+c.outlet+'   **length**: '+(c.words?c.words+' words':'NOT READ - the text is missing'));
  L.push('- **summary line**: '+(c.dek?c.dek:'(none)'));
  L.push('- **opening**: '+(c.opening||'(no text was read for this story: refuse it under 2.1)'));
  L.push('')}
 return L.join('\n')}

function applyVerdicts(f,cards,vs){
 const nos=new Set(cards.map(c=>String(c.no)));
 const stray=Object.keys(vs).filter(k=>!nos.has(String(k)));
 if(stray.length)return{err:'verdicts for stories that are not on the sheet: '+stray.join(', ')+' - nothing written'};
 const out={kept:0,refused:[],dekless:[],partial:[],byRule:{}},drop=new Set(),nodek=new Set(),part=new Map();
 for(const c of cards){const v=vs[c.no]||vs[String(c.no)];
  if(!v||v.keep!==true){drop.add(c.link);const rule=(v&&v.rule)||'unread';out.byRule[rule]=(out.byRule[rule]||0)+1;
   out.refused.push({no:c.no,title:c.title,where:c.where[0],rule,why:(v&&v.why)||'no verdict - a story nobody read is not printed'});continue}
  out.kept++;if(v.dek===false&&c.dek){nodek.add(c.link);out.dekless.push({no:c.no,title:c.title,why:v.why||''})}
  if(Array.isArray(v.except)&&v.except.length){part.set(c.link,v.except.map(String));out.partial.push({no:c.no,title:c.title,except:v.except,rule:v.rule||'2.3',why:v.why||''});out.byRule[v.rule||'2.3']=(out.byRule[v.rule||'2.3']||0)+1}}
 const gone=(e,st)=>drop.has(st.l)||((part.get(st.l)||[]).some(x=>x===(e.name||'')||x===e.id));
 const counts=(f.editions||[]).map(e=>({name:e.name||e.id,left:(e.sections||[]).reduce((n,s)=>n+(s.stories||[]).filter(st=>!gone(e,st)).length,0)}));
 const thin=counts.filter(c=>c.left<MIN);
 if(thin.length)return{...out,err:'these verdicts would leave '+thin.map(c=>c.name+' with '+c.left+' stories').join(' and ')+' (the minimum is '+MIN+'). Nothing written: re-read STYLEBOOK.md section 2.4, "these are not reasons to refuse".',counts};
 for(const e of f.editions||[]){
  for(const s of e.sections||[]){s.stories=(s.stories||[]).filter(st=>!gone(e,st));for(const st of s.stories)if(nodek.has(st.l))delete st.dek}
  /* the cover names a story by position; cover.js runs after this and chooses again, but never leave it dangling */
  const c=e.cover;if(c&&Array.isArray(c.lead)){const s=(e.sections||[])[c.lead[0]];if(!s||!(s.stories||[])[c.lead[1]]){const si=(e.sections||[]).findIndex(x=>(x.stories||[]).length);c.lead=[Math.max(0,si),0];c.photo=null;delete c.frame}}}
 return{...out,counts}}

if(process.argv.includes('--selfcheck')){
 const mk=()=>({date:'2026-01-01',issue:1,editions:[{name:'US',cover:{lead:[0,0]},sections:[
  {name:'Home',stories:Array.from({length:8},(_,i)=>({t:'Home story '+i,o:'Outlet',l:'https://x/h'+i,dek:i===1?'Home story 1':''}))},
  {name:'Food',stories:Array.from({length:6},(_,i)=>({t:'Food story '+i,o:'Outlet',l:'https://x/f'+i}))}]}]});
 const got={kept:[{link:'https://x/h0',title:'Home story 0',words:500,text:'One.\n\nTwo.'}]};
 let bad=0;const t=(name,ok)=>{if(!ok)bad++;console.log((ok?'  ok   ':'  FAIL ')+name)};
 {const f=mk(),c=lay(f,got);t('lays each story out once, with its text',c.length===14&&c[0].words===500&&/¶/.test(c[0].opening)&&c[1].words===0)}
 {const f=mk(),c=lay(f,got),all=Object.fromEntries(c.map(x=>[x.no,{keep:true}]));all[1]={keep:false,rule:'2.2',why:'a column'};all[2]={keep:true,dek:false};
  const r=applyVerdicts(f,c,all);t('a refused story is removed and a bad summary dropped',!r.err&&r.refused.length===1&&f.editions[0].sections[0].stories.length===7&&!f.editions[0].sections[0].stories[0].dek&&r.byRule['2.2']===1)}
 {const f=mk(),c=lay(f,got),some=Object.fromEntries(c.slice(0,12).map(x=>[x.no,{keep:true}]));
  const r=applyVerdicts(f,c,some);t('a story with no verdict is removed',!r.err&&r.refused.length===2&&r.refused[0].rule==='unread')}
 {const f=mk(),c=lay(f,got);const r=applyVerdicts(f,c,{'99':{keep:true}});t('a verdict for a story not on the sheet stops everything',!!r.err&&f.editions[0].sections[0].stories.length===8)}
 {const f=mk(),c=lay(f,got),few=Object.fromEntries(c.slice(0,5).map(x=>[x.no,{keep:true}]));
  const r=applyVerdicts(f,c,few);t('refusing most of an issue writes nothing',!!r.err&&f.editions[0].sections[0].stories.length===8)}
 {const f=mk(),c=lay(f,got),all=Object.fromEntries(c.map(x=>[x.no,{keep:x.no!==1}]));
  applyVerdicts(f,c,all);t('the cover never points at a removed story',!!f.editions[0].sections[f.editions[0].cover.lead[0]].stories[f.editions[0].cover.lead[1]])}
 {const f=mk();f.editions.push(JSON.parse(JSON.stringify(f.editions[0])));f.editions[1].name='INT';const c=lay(f,got),all=Object.fromEntries(c.map(x=>[x.no,{keep:true}]));all[1]={keep:true,except:['US']};
  applyVerdicts(f,c,all);t('a story can be kept in one edition and taken out of the other',f.editions[0].sections[0].stories.length===7&&f.editions[1].sections[0].stories.length===8)}
 console.log(bad?bad+' case(s) wrong':'every case behaved');process.exit(bad?1:0)}

const f=JSON.parse(fs.readFileSync(EDITION,'utf8'));
const GOT=arg('--gathered'),OUT=arg('--out'),SHEET=arg('--sheet'),VERD=arg('--verdicts');
if(GOT&&OUT){
 const cards=lay(f,JSON.parse(fs.readFileSync(GOT,'utf8')));
 fs.mkdirSync(OUT,{recursive:true});
 fs.writeFileSync(path.join(OUT,'sheet.md'),sheet(cards,f));
 fs.writeFileSync(path.join(OUT,'sheet.json'),JSON.stringify({date:f.date,issue:f.issue,cards:cards.map(c=>({no:c.no,link:c.link,title:c.title,where:c.where,dek:c.dek}))},null,1));
 const unread=cards.filter(c=>!c.words).length;
 console.log(cards.length+' stories laid out for reading in '+path.join(OUT,'sheet.md')+(unread?' ('+unread+' have no text and cannot be kept)':''));
 process.exit(0)}
if(!SHEET||!VERD){console.error('need --gathered got.json --out dir   (to lay the stories out)\n  or --sheet dir/sheet.json --verdicts v.json [--write]   (to write the verdicts down)');process.exit(1)}
const sh=JSON.parse(fs.readFileSync(SHEET,'utf8'));
if(String(sh.date)!==String(f.date)||String(sh.issue)!==String(f.issue)){console.error('the sheet is for '+sh.date+' No. '+sh.issue+' and the edition is '+f.date+' No. '+f.issue+' - nothing written');process.exit(1)}
const r=applyVerdicts(f,sh.cards,JSON.parse(fs.readFileSync(VERD,'utf8')));
for(const x of r.refused||[])console.log('  --  #'+x.no+' ['+x.rule+'] '+String(x.title).slice(0,58)+'  -  '+x.why);
for(const x of r.partial||[])console.log('  -/  #'+x.no+' ['+x.rule+'] taken out of '+x.except.join(', ')+': '+String(x.title).slice(0,46)+(x.why?'  -  '+x.why:''));
for(const x of r.dekless||[])console.log('  ~~  #'+x.no+' summary dropped: '+String(x.title).slice(0,50)+(x.why?'  -  '+x.why:''));
if(r.err){console.error('\n'+r.err);process.exit(2)}
console.log('\nread '+sh.cards.length+', kept '+r.kept+', refused '+r.refused.length+(Object.keys(r.byRule).length?' ('+Object.entries(r.byRule).map(([k,n])=>n+' under '+k).join(', ')+')':'')+', summaries dropped '+r.dekless.length);
for(const c of r.counts)console.log('  '+c.name+': '+c.left+' stories');
if(WRITE){f.rev=new Date().toISOString();
 fs.writeFileSync(EDITION,JSON.stringify(f,null,1));
 if(!GIVEN)try{fs.writeFileSync(DOCS,JSON.stringify(f,null,1))}catch(e){}/* never the deployed copy when an explicit --edition was given: see clear.js */
 console.log('written, rev '+f.rev)}
else console.log('(nothing written - add --write)');
