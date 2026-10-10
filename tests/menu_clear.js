/* On a phone the menu button never overlaps the page title (The Daily, All stories, ...), in every theme, at common phone widths, with the icon sized by the web view in different ways. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 const b=await chromium.launch();
 for(const W of [360,412]){
  const p=await (await b.newContext({viewport:{width:W,height:800},hasTouch:true,isMobile:true})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:6});await p.goto('file://'+APP);await p.waitForTimeout(1300);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(300);
  const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const out=[];
   /* worst case for a web view: the inline icons lose their size (measured as 0 or as 300 wide) */
   const st=document.createElement('style');st.id='__wv';document.head.append(st);
   for(const mode of ['normal','svg-auto']){st.textContent=mode==='svg-auto'?'.top svg{width:auto!important;height:auto!important}':'';
    for(const [k] of THEME_NAMES){if(!k)continue;S.theme=k;applyTheme();for(const sel of ['today','all']){S.sel=sel;render();await w(60);
      const m=document.querySelector('#menu'),t=document.querySelector('#ttl');if(!m||!t||getComputedStyle(m).display==='none'){out.push({k,sel,mode,skip:1});continue}
      const a=m.getBoundingClientRect(),c=t.getBoundingClientRect();out.push({k,sel,mode,gap:Math.round(c.left-a.right),mw:Math.round(a.width),mh:Math.round(a.height)})}}}
   return out});
  const t='['+W+'] ';const real=r.filter(x=>!x.skip);
  ck(t+'the menu button is shown on the phone layout ('+real.length+' checks)',real.length>=80,real.length);
  ck(t+'the menu button never overlaps the title (at least 6px clear) in every theme',real.every(x=>x.gap>=6),JSON.stringify(real.filter(x=>x.gap<6).slice(0,4)));
  ck(t+'the menu button keeps its 38px box even if the icon is measured oddly',real.every(x=>x.mw===38&&x.mh===38),JSON.stringify(real.filter(x=>x.mw!==38||x.mh!==38).slice(0,3)));
  ck(t+'no page errors',!errs.length,errs[0]);await p.close();
 }
 await b.close();console.log(bad?'menu_clear '+bad+' FAILED':'menu_clear all passed');process.exit(bad?1:0);
})();
