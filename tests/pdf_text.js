/* PDF text from real article HTML: the opening paragraph is the standfirst and shows once, repeated paragraphs show once, markdown marks never reach the page. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:412,height:860}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(300);
 const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const f=S.feeds[0];
  const lede='Everything was great until he arrived, and then the whole plan for the harbour fell apart in one afternoon.';
  const body=k=>`<p>Paragraph ${k} of the article carries enough ordinary words to look like real reporting from a well known technology publication.</p>`;
  const mk=(link,html,summary)=>({feedId:f.id,title:'Test '+link,link:'https://w.test/'+link,date:Date.now(),summary:summary||'x',img:'',html});
  const o={};
  /* short opening paragraph = standfirst, removed from the body */
  let s=await pdfStory(mk('a',`<p>${lede}</p>${body(1)}${body(2)}${body(3)}`));
  o.a={dek:s.dek,pageDek:s.pageDek,first:s.blocks[0]&&s.blocks[0].s.slice(0,30),count:s.blocks.filter(b=>b.s===lede).length};
  /* long opening paragraph stays in the body, no separate standfirst on the page */
  const longp=lede+' '+'More words follow in the same paragraph so that it runs well beyond the standfirst length. '.repeat(3);
  s=await pdfStory(mk('b',`<p>${longp}</p>${body(1)}${body(2)}`));
  o.b={dek:s.dek,pageDek:s.pageDek,inBody:s.blocks.some(b=>b.s===longp.replace(/\s+/g,' ').trim())};
  /* the same paragraph twice, markdown marks */
  s=await pdfStory(mk('c',`<p>${lede}</p><p>${lede}</p>${body(1)}<p>The ~~$350~~ price is _he_ said __huge__ and **bold** and *it* here, see [the review](https://x.test/r) for more words in this paragraph.</p>${body(1)}${body(2)}`));
  o.c={n:s.blocks.length,lede:s.blocks.filter(b=>b.s===lede).length,p1:s.blocks.filter(b=>/^Paragraph 1 /.test(b.s)).length,md:s.blocks.map(b=>b.s).join(' | ')};
  /* a one-paragraph story keeps its text */
  s=await pdfStory(mk('d',`<p>${lede}</p>`));o.d={blocks:s.blocks.length,pageDek:s.pageDek};
  return o});
 ck('the opening paragraph becomes the standfirst and leaves the body',r.a.dek===r.a.pageDek&&r.a.count===0&&/^Paragraph 1/.test(r.a.first),JSON.stringify(r.a));
 ck('a long opening paragraph stays once in the body, with no second copy as standfirst',r.b.inBody&&r.b.pageDek==='',JSON.stringify(r.b));
 ck('a repeated paragraph is dropped',r.c.p1===1&&r.c.lede<=0,JSON.stringify(r.c));
 ck('no markdown marks reach the PDF text',!/~~|__|\*\*|_he_|\*it\*|\]\(/.test(r.c.md)&&/\$350 price is he said huge and bold and it here, see the review for more/.test(r.c.md),r.c.md);
 ck('a one-paragraph story keeps its text',r.d.blocks===1&&r.d.pageDek==='',JSON.stringify(r.d));
 ck('no page errors',!errs.length,errs[0]);await b.close();
 console.log(bad?'pdf_text '+bad+' FAILED':'pdf_text all passed');process.exit(bad?1:0);
})();
