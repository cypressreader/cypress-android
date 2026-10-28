/* Two-column page 1: when the "Why it matters" box lands at the top of column 2, the story text follows it in that column instead of starting on the next page and leaving the column empty. With no box (or the box under the picture in column 1) the text still starts at the top of column 2. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
const IMG='data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#468"/></svg>');
(async()=>{
 const b=await chromium.launch();
 for(const [W,H] of [[884,860],[1100,820],[820,1180]]){
  const p=await (await b.newContext({viewport:{width:W,height:H}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(300);
  const r=await p.evaluate(async({IMG})=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const f=S.feeds[0];const now=Date.now();
   const P=k=>'<p>Paragraph '+k+' '+'Real articles have shorter paragraphs than this one, so the text flows down the page. '.repeat(3)+'</p>';
   const sum='For a long time, this thing was just a place where I dumped files when my primary storage was getting too full, or a graveyard where memory cards were purged and nothing mattered much at all';
   const mk=(i,img,summary)=>({feedId:f.id,title:'Why gap story '+i,link:'https://w.test/wg'+i,date:now-i*36e5,summary,img,html:Array.from({length:14},(_,k)=>P(k)).join('')});
   items[f.id]=[mk(0,IMG,sum),mk(1,IMG,'x'),mk(2,'',sum)];S.feeds.slice(1).forEach(x=>items[x.id]=[]);state[f.id]='ok';
   S.scroll='paged';S.cont=true;S.sel='all';render();await w(500);
   const out=[];
   for(let i=0;i<3;i++){
    openReader(items[f.id][i]);await w(2600);
    const c=document.querySelector('.cols'),cr=c.getBoundingClientRect(),pitch=(R.step)/R.cpv;
    const col=e=>e?Math.floor((e.getBoundingClientRect().left-cr.left+2)/pitch):null;
    const why=c.querySelector(':scope>.whyit'),fp=c.querySelector(':scope>.body>p');
    out.push({cpv:R.cpv,why:why?col(why):null,firstP:col(fp),forced:getComputedStyle(c.querySelector(':scope>.body').firstElementChild).breakBefore});
   }
   return out},{IMG});
  const t='['+W+'x'+H+'] ';
  if(r[0].cpv!==2){console.log('skip',t,'not a two-page layout');await p.close();continue}
  ck(t+'the story text always starts on page 1 (box under the picture: top of column 2; box at the top of column 2: right after it)',r[0].firstP===1&&((r[0].why===0&&r[0].forced==='column')||(r[0].why===1&&r[0].forced==='auto')),JSON.stringify(r[0]));
  ck(t+'no box: the text starts at the top of column 2',r[1].why===null&&r[1].firstP===1&&r[1].forced==='column',JSON.stringify(r[1]));
  ck(t+'box in column 1 (no picture): the text follows the box',r[2].why===0&&r[2].firstP===0&&r[2].forced==='auto',JSON.stringify(r[2]));/* fitWhy: with no picture the text follows the box, so no column is left empty */
  ck(t+'no page errors',!errs.length,errs[0]);await p.close();
 }
 await b.close();console.log(bad?'why_gap '+bad+' FAILED':'why_gap all passed');process.exit(bad?1:0);
})();
