/* Markdown never reaches the reader: _italics_, __bold__, **bold**, *italics*, ~~strikethrough~~ and [links](url) become real formatting; repeated paragraphs show once. Real-world shaped Verge / TechCrunch text. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 for(const W of [412,1100]){
  const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:W,height:860}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(300);
  const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const f=S.feeds[0];
   const fill=' The rest of this paragraph carries enough ordinary words to look like a real news story paragraph from a well known technology publication.';
   const verge='<p>Everything was great until _he_ arrived.'+fill+'</p><p>Everything was great until _he_ arrived.'+fill+'</p>'
    +'<p>The ~~$350~~ $299 price is __huge__, **really** huge, and *quite* a lot of money for _a phone_—or so it seems. See [the full review](https://www.theverge.com/review) for more.'+fill+'</p>'
    +'<p>The file is named my_snake_case_file and the code a_b_c stays, as does 2*3*4 and a lone * star.'+fill+'</p>'
    +'<p>TechCrunch says <strong>__nested__</strong> and __**both**__ work, with <a href="https://x.test/real">a real link</a> beside [another one](https://x.test/md).'+fill+'</p>'
    +'<p>Third paragraph with <em>real</em> markup, _“quoted italics”_ and “_inner_” marks and more words to read here.'+fill+'</p>';
   const a={feedId:f.id,title:'Markdown test',link:'https://w.test/mdi',date:Date.now(),summary:'Everything was great until _he_ arrived.',img:'',html:verge};
   items[f.id]=[a];S.sel='all';render();await w(300);openReader(a);await w(2200);
   const body=document.querySelector('.cols .body'),o={};
   o.text=body.textContent;o.em=[...body.querySelectorAll('em')].map(e=>e.textContent);o.strong=[...body.querySelectorAll('strong')].map(e=>e.textContent);
   o.s=[...body.querySelectorAll('s')].map(e=>e.textContent);o.links=[...body.querySelectorAll('a')].map(e=>e.textContent+'>'+e.getAttribute('href'));
   o.dups=[...body.querySelectorAll('p')].filter(p=>/^E?verything was great/.test(p.textContent.replace(/\s+/g,' ').trim())).length;
   o.dek=dekOf(a,200);
   return o});
  const t=W+' ';
  ck(t+'no raw underscores around words',!/_he_|_a phone_|_inner_|__huge__|__nested__|__\*\*/.test(r.text),r.text.slice(0,400));
  ck(t+'no raw tildes',!/~~/.test(r.text)&&r.s.includes('$350'),JSON.stringify(r.s)+r.text.slice(0,300));
  ck(t+'no raw asterisk marks, lone * kept',!/\*\*|\*really\*|\*quite\*/.test(r.text)&&/2\*3\*4/.test(r.text)&&/lone \* star/.test(r.text),r.text);
  ck(t+'italics render',r.em.includes('he')&&r.em.includes('quite')&&r.em.includes('a phone')&&r.em.includes('real'),JSON.stringify(r.em));
  ck(t+'bold renders',r.strong.includes('huge')&&r.strong.includes('really')&&r.strong.includes('nested')&&r.strong.includes('both'),JSON.stringify(r.strong));
  ck(t+'markdown links become links, real links kept',r.links.some(x=>x==='the full review>https://www.theverge.com/review')&&r.links.some(x=>x==='another one>https://x.test/md')&&r.links.some(x=>x==='a real link>https://x.test/real'),JSON.stringify(r.links));
  ck(t+'snake_case and a_b_c untouched',/my_snake_case_file/.test(r.text)&&/a_b_c/.test(r.text));
  ck(t+'repeated opening paragraph shows once',r.dups===1,String(r.dups));
  ck(t+'dek has no raw marks',!/_he_/.test(r.dek)&&/\bhe\b/.test(r.dek),r.dek);
  ck(t+'no page errors',!errs.length,errs[0]);await b.close();
 }
 console.log('md_inline',bad?bad+' FAILED':'all passed');process.exit(bad?1:0);
})();
