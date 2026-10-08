const {APP,OUT}=require('./env');
const {mock,seed,PW}=require('./mock');const {chromium}=require(PW);
const VPS=[['phone',380,820,true],['fold',884,1060,true],['desktop',1280,900,false]];
let pass=0,fail=0;const log=[];const ck=(vp,n,c,x='')=>{if(c)pass++;else{fail++;log.push(`FAIL [${vp}] ${n} ${x}`)}};
(async()=>{const b=await chromium.launch();
for(const [vp,w,h,touch] of VPS){
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:touch,isMobile:touch&&w<500});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await mock(p,{n:8});
 await p.addInitScript(s=>{try{if(!localStorage.getItem('folio'))localStorage.setItem('folio',JSON.stringify(s))}catch(e){}},seed(['Alpha','Beta','Gamma']));
 await p.goto(('file://'+APP));await p.waitForTimeout(1800);
 const E=(f,a)=>p.evaluate(f,a);
 // themes
 for(const th of ['broadsheet','midnight','forest','rose','mono']){
  await E(t=>{S.theme=t;applyTheme(false)},th);
  ck(vp,'theme '+th,await E(t=>document.documentElement.dataset.theme===t&&getComputedStyle(document.body).backgroundColor!=='rgba(0, 0, 0, 0)',th));
 }
 ck(vp,'theme swatches in settings',await E(()=>document.querySelectorAll('#thm button').length>=11));
 await E(()=>{S.theme='auto';applyTheme(false)});
 // presets & hfont
 await E(()=>document.querySelector('#tpre [data-tp=classic]').click());
 ck(vp,'preset classic',await E(()=>S.font==='garamond'&&S.lh===1.9&&tpreOn()==='classic'));
 ck(vp,'headline font var',await E(()=>document.documentElement.style.getPropertyValue('--serif').includes('Playfair')));
 await E(()=>document.querySelector('#tpre [data-tp=editorial]').click());
 ck(vp,'preset editorial resets headline',await E(()=>getComputedStyle(document.documentElement).getPropertyValue('--serif').includes('Newsreader')));
 // reduce motion
 await E(()=>{S.rmo=true;applyRmo()});
 ck(vp,'reduce motion class',await E(()=>document.documentElement.classList.contains('rmo')&&reduced()));
 await E(()=>{S.rmo=false;applyRmo()});
 // keyboard reach
 await p.waitForTimeout(400);
 ck(vp,'cards keyboard reachable',await E(()=>{const c=document.querySelector('#grid .card');return !c||c.tabIndex===0}));
 ck(vp,'nav aria-current',await E(()=>!!document.querySelector('aside .nav[aria-current=true]')||!document.querySelector('aside .nav')));
 // paused feed
 const fid=await E(()=>S.feeds[0].id);
 await E(id=>{const f=S.feeds.find(x=>x.id===id);f.snz=Date.now()+864e5;save();render()},fid);
 ck(vp,'paused feed detected',await E(id=>paused(S.feeds.find(x=>x.id===id)),fid));
 await E(id=>{const f=S.feeds.find(x=>x.id===id);delete f.snz;save();render()},fid);
 ck(vp,'unpaused',await E(id=>!paused(S.feeds.find(x=>x.id===id)),fid));
 // per-feed settings dialog
 await E(id=>openFset(id),fid);
 ck(vp,'feed settings opens',await E(()=>document.querySelector('#fset').open));
 await E(()=>document.querySelector('#fset').close());
 // quick actions
 await E(()=>{S.sel='today';render()});
 const ok=await E(()=>{const c=document.querySelector('#grid .card');if(!c)return true;c.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,clientX:100,clientY:200}));return !!document.querySelector('#qa')&&!document.querySelector('#qa').hidden});
 ck(vp,'quick actions open',ok);
 await E(()=>{const q=document.querySelector('#qa');if(q)q.hidden=true});
 // history + tips + cleanup + saved chips
 ck(vp,'history fn',await E(()=>typeof histAdd==='function'&&typeof renderHist==='function'));
 await E(()=>{S.sel='hist';render()});
 ck(vp,'history renders',await E(()=>document.querySelector('#grid')!=null));
 await E(()=>{S.sel='today';render()});
 await E(()=>openTips());
 ck(vp,'tips dialog',await E(()=>document.querySelector('#tips').open));
 await E(()=>document.querySelector('#tips').close());
 await E(()=>openCleanup());
 ck(vp,'cleanup dialog',await E(()=>document.querySelector('#cln').open));
 await E(()=>document.querySelector('#cln').close());
 await E(()=>{S.saved=[{id:'x1',title:'T1',link:'https://a.test/1',feedId:S.feeds[0].id,tags:['work']}];S.sel='saved';render()});
 ck(vp,'saved renders',await E(()=>document.querySelector('#grid').children.length>0));
 // article card canvas
 ck(vp,'article card fn',await E(()=>typeof articleCard==='function'));
 ck(vp,'no page errors',errs.length===0,errs.join('|'));
 await ctx.close();
}
await b.close();log.forEach(l=>console.log(l));console.log('pass',pass,'fail',fail);})();
