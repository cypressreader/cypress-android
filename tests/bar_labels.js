/* Reader toolbar: the Back / Save / Listen / More labels are real text inside their buttons (under the icon), never outside or above the pill, in every theme, on tablet and desktop widths; on a phone the bar stays icons-only. */
const {APP,OUT}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 const b=await chromium.launch();
 for(const [W,H] of [[412,860],[720,900],[900,820],[1200,820]]){
  const p=await (await b.newContext({viewport:{width:W,height:H}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:6});await p.goto('file://'+APP);await p.waitForTimeout(1300);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(300);
  const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const f=S.feeds[0];const para=n=>`<p>${'Words for the story here, ordinary reporting text. '.repeat(n)}</p>`;
   const a={feedId:f.id,title:'Bar labels',link:'https://w.test/bl',date:Date.now(),summary:'x',img:'',html:para(20)};items[f.id]=[a];S.sel='all';S.scroll='paged';render();await w(200);openReader(a);await w(1400);
   const out=[];for(const [k] of THEME_NAMES){if(!k)continue;S.theme=k;applyTheme();await w(70);
    for(const bt of document.querySelectorAll('#rd .bar .ib[data-lbl]')){if(bt.hidden||getComputedStyle(bt).display==='none')continue;const bl=bt.querySelector('.bl'),B=bt.getBoundingClientRect(),cs=bl&&getComputedStyle(bl);
     const L=bl&&cs.display!=='none'?bl.getBoundingClientRect():null;out.push({k,id:bt.id,lbl:bt.dataset.lbl,has:!!bl,shown:!!L,inside:L?(L.left>=B.left-.5&&L.right<=B.right+.5&&L.top>=B.top-.5&&L.bottom<=B.bottom+.5):null,under:L?(L.top>=B.top+B.height*.4):null,bh:Math.round(B.height)})}}
   return out});
  const t='['+W+'] ';const shown=r.filter(x=>x.shown);
  if(W<700){ck(t+'phone: the bar is icons only (labels not shown)',r.length>0&&shown.length===0,shown.length);}
  else{
   ck(t+'every labelled button has its label as text inside it ('+shown.length+' checks)',shown.length>=4*40,shown.length);
   ck(t+'labels sit inside their buttons, below the icon, in every theme',shown.every(x=>x.inside&&x.under),JSON.stringify(shown.filter(x=>!(x.inside&&x.under)).slice(0,4)));
  }
  ck(t+'no page errors',!errs.length,errs[0]);await p.close();
 }
 await b.close();console.log(bad?'bar_labels '+bad+' FAILED':'bar_labels all passed');process.exit(bad?1:0);
})();
