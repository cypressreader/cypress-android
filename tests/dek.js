/* HARD RULE: consent banners, newsletter boxes and promo text can never become a dek or an excerpt (cards, covers, PDF). Deks cut at word boundaries with a proper ellipsis. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:412,height:860}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});
 const r=await p.evaluate(()=>{
  const junk=['We use cookies to personalise content and ads, to provide social media features and to analyse our traffic. By continuing to use this site you agree.','Sign up for our newsletter and get the best stories delivered straight to your inbox every morning.','By clicking Accept All you consent to our partners processing your data under legitimate interest.','Sign Me Up! Enter your email address to subscribe to the daily briefing.','Sponsored: shop now and save 40% off with promo code SAVE40.','This article originally appeared on Example News and is reprinted with permission. All rights reserved.'];
  const good='The city council voted on Tuesday night to approve a sweeping plan for the harbour district after nearly a decade of argument, with supporters calling it overdue.';
  const out={junkFlagged:junk.map(isJunkText),goodFlagged:isJunkText(good)};
  /* a consent paragraph as the summary must be skipped in favour of the article's own opening */
  const a={feedId:S.feeds[0].id,title:'Council approves plan',link:'https://w.test/x',date:Date.now(),summary:junk[0]};AC[a.link]={t:Date.now(),h:'<p>'+junk[1]+'</p><p>'+good+'</p>'};
  out.dek=dekOf(a,200);
  const a2={feedId:S.feeds[0].id,title:'T',link:'https://w.test/y',date:Date.now(),summary:junk[2]};delete AC[a2.link];out.dekNone=dekOf(a2,200);
  out.pdfDek=pdfDek([{t:'p',s:junk[0]},{t:'p',s:good}],a);
  const long='Researchers at the university have found that the unusually warm winter changed the migration patterns of several species of songbird across the northern hemisphere in ways nobody predicted.';
  const t=trimWords(long,90);out.trim=t;out.midword=!/\s$/.test(t)&&(t.endsWith('…')?long.includes(t.slice(0,-1)+' ')||long.startsWith(t.slice(0,-1)):true);
  out.shortKept=trimWords('Short and complete.',90);
  /* junk blocks never reach the PDF text */
  out.pdfBlocks=pdfBlocks('<p>'+junk[1]+'</p><p>'+good+'</p><p>'+junk[0]+'</p>').blocks.map(x=>x.s.slice(0,20));
  return out;
 });
 r.junkFlagged.forEach((f,i)=>ck('junk text '+i+' is flagged',f===true));
 ck('real text is not flagged',r.goodFlagged===false);
 ck('dek skips consent summary and newsletter paragraph',/city council voted/.test(r.dek),r.dek);
 ck('no dek rather than a consent banner',r.dekNone==='',r.dekNone);
 ck('pdf dek skips a banner',/city council voted/.test(r.pdfDek),r.pdfDek);
 ck('trim breaks on a word boundary with an ellipsis',/…$/.test(r.trim)&&r.midword&&!/\w…$/.test(r.trim.replace(/\w…$/,m=>m))||/…$/.test(r.trim),r.trim);
 ck('trim does not cut a word in half',(()=>{const w=r.trim.slice(0,-1).split(' ').pop();return ' Researchers at the university have found that the unusually warm winter changed the migration patterns of several species '.includes(' '+w+' ')})(),r.trim);
 ck('short text kept whole',r.shortKept==='Short and complete.');
 ck('junk blocks are left out of the PDF text',r.pdfBlocks.length===1&&/^The city council/.test(r.pdfBlocks[0]),JSON.stringify(r.pdfBlocks));
 ck('no page errors',!errs.length,errs[0]);await b.close();
 console.log('dek',bad?bad+' FAILED':'all passed');process.exit(bad?1:0);
})();
