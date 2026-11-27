/* Back out of a story in the World Edition, and stay in the magazine.
 *
 * David, 2026-11-27, from the phone: "when I go into a story and [choose] to go back instead of going back to the
 * magazine it sends me back to the main app."
 *
 * THE FAULT: the back machinery keeps a stack of layers, and before popping one it asks whether that layer is still
 * alive. For the story open inside the edition it asked `!!document.querySelector('.we-sp')` - a thing in the DOM.
 * The edition rebuilds those pages whenever it re-renders: a refresh, a fold, or a corrected issue arriving during
 * the day, which is now a normal event. The layer then looked dead, the press was thrown away and a SECOND back
 * fired, popping the magazine itself. One press, two steps, out to the app. `WE.sp != null` is the truth.
 *
 * Each case below is a way back out of a story. The last one is the one that broke.
 *   node tests/we_back.js
 */
const {openApp}=require('../scripts/edition/app');

const look=p=>p.evaluate(()=>({sel:S.sel,sp:WE.sp,mag:!!document.querySelector('.we-sc'),story:document.querySelectorAll('.we-sc .we-sp').length}));
const back=async p=>{await p.evaluate(()=>{if(window.cyBack)cyBack();else history.back()});await p.waitForTimeout(900)};
const open=async(p,i)=>{await p.evaluate(i=>weRead(i,WE.pg|0),i);await p.waitForSelector('.we-sc .we-sp',{timeout:15000}).catch(()=>{});await p.waitForTimeout(1200)};

(async()=>{
 const app=await openApp({viewport:{width:412,height:915}});const p=app.page;let fails=0;
 const must=async(tag,want)=>{const s=await look(p);
  const ok=s.mag&&s.sel==='we'&&(want!=='reading'||s.story>0)&&(want!=='magazine'||s.story===0);
  if(!ok){fails++;console.log('FAIL '+tag+': expected the '+want+', got '+JSON.stringify(s))}
  else console.log('ok   '+tag)};
 try{
  await p.waitForTimeout(1200);
  await p.click('text=Get started',{timeout:1500}).catch(()=>{});
  await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());S.sel='we';render()});
  await p.waitForSelector('.we-sc .we-pg',{timeout:30000});await p.waitForTimeout(2500);

  await open(p,0);await must('a story opens',    'reading');
  await back(p);  await must('back closes it',   'magazine');

  await open(p,1);await p.evaluate(()=>{const b=document.querySelector('.we-sc [data-werb]');if(b)b.click();else weRdClose()});await p.waitForTimeout(900);
  await open(p,2);await back(p);await must('back after the corner mark closed one','magazine');

  /* the one David hit: the edition re-renders under the open story, and the press must still land in the magazine */
  await open(p,3);
  await p.evaluate(()=>{WE.sig='';render()});await p.waitForTimeout(1200);
  await back(p);  await must('back after the edition re-rendered','magazine');
 }catch(e){fails++;console.log('FAIL we_back threw: '+(e&&e.message||e))}
 await app.close();
 console.log(fails?fails+' FAIL(s)':'we_back: every way out stays in the magazine');
 process.exit(fails?1:0);
})();
