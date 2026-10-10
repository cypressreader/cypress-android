/* The end mark of a story is the CyPress logo in every theme (themes with their own icon variant keep it): never the plain flourish. */
const {APP,OUT}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 const b=await chromium.launch();
 for(const W of [412,1100]){
  const p=await (await b.newContext({viewport:{width:W,height:860}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:6});await p.goto('file://'+APP);await p.waitForTimeout(1300);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(300);
  const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const f=S.feeds[0];
   const para=n=>`<p>${'Words for the story here, ordinary reporting text with a few more words. '.repeat(n)}</p>`;
   const a={feedId:f.id,title:'End mark',link:'https://w.test/em1',date:Date.now(),summary:'x',img:'',html:para(14)+para(14)};
   items[f.id]=[a];S.sel='all';S.scroll='vertical';render();await w(300);openReader(a);await w(2000);
   const out={themes:[],hasMark:!!document.querySelector('.cols .body .endmark'),foot:!!document.querySelector('.rf-fin')};
   for(const [k] of THEME_NAMES){if(!k)continue;S.theme=k;applyTheme();await w(120);
    const e=document.querySelector('.cols .body .endmark');if(!e){out.themes.push({k,none:true});continue}
    const ff=document.querySelector('.rf-fin'),fc=ff?getComputedStyle(ff):null;
    const cs=getComputedStyle(e),r=e.getBoundingClientRect();
    out.themes.push({k,sym:document.documentElement.classList.contains('hasym'),w:Math.round(r.width),h:Math.round(r.height),mask:(cs.webkitMaskImage||cs.maskImage||'').slice(0,26),bg:cs.backgroundImage.slice(0,26),fs:cs.fontSize,op:cs.opacity,ff:fc?{w:Math.round(ff.getBoundingClientRect().width),fs:fc.fontSize,m:(fc.webkitMaskImage||fc.maskImage||'').slice(0,22),bg:fc.backgroundImage.slice(0,22)}:null})}
   return out});
  const t='['+W+'] ';
  ck(t+'the story ends with an end mark',r.hasMark,'');
  const noSym=r.themes.filter(x=>!x.sym&&!x.none),sym=r.themes.filter(x=>x.sym);
  ck(t+'themes without their own symbol ('+noSym.length+') show the app logo (a '+'logo mask, sized, not text)',noSym.length>=2&&noSym.every(x=>/data:image\/png/.test(x.mask)&&x.w>=28&&x.h>=28&&x.fs==='0px'),JSON.stringify(noSym.filter(x=>!(/data:image\/png/.test(x.mask)&&x.w>=28)).slice(0,3)));
  ck(t+'themes with their own icon variant ('+sym.length+') keep it, sized',sym.length>=5&&sym.every(x=>x.w>=28&&x.h>=28),JSON.stringify(sym.filter(x=>x.w<28)));
  ck(t+'the end-of-story colophon is the CyPress logo in every theme (no text flourish)',r.foot&&r.themes.every(x=>x.ff&&x.ff.fs==='0px'&&x.ff.w>=28&&/data:image\/png/.test(x.ff.m)),JSON.stringify(r.themes.filter(x=>!(x.ff&&x.ff.fs==='0px'&&x.ff.w>=28&&/data:image\/png/.test(x.ff.m))).slice(0,3)));
  ck(t+'every theme was checked and has a mark',r.themes.every(x=>!x.none),JSON.stringify(r.themes.filter(x=>x.none)));
  await p.evaluate(()=>{S.theme='light';applyTheme()});await p.waitForTimeout(200);
  await p.evaluate(()=>{const v=document.querySelector('.cols .body .endmark');v&&v.scrollIntoView({block:'center'})});await p.waitForTimeout(250);await p.screenshot({path:OUT+'/endmark-light-'+W+'.png'});
  ck(t+'no page errors',!errs.length,errs[0]);await p.close();
 }
 await b.close();console.log(bad?'end_mark '+bad+' FAILED':'end_mark all passed');process.exit(bad?1:0);
})();
