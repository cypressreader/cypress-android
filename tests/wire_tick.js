/* Headlines tab: the WIRE label is opaque and the ticker track starts to its right, so scrolling text never passes beneath the label. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 const b=await chromium.launch();
 for(const W of [1100,412]){
  const p=await (await b.newContext({viewport:{width:W,height:860}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(300);
  const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const now=Date.now();
   S.feeds.slice(0,3).forEach((f,fi)=>{items[f.id]=Array.from({length:12},(_,i)=>({feedId:f.id,title:'Wire headline number '+i+' of feed '+fi+' about the day',link:'https://w.test/'+fi+'/'+i,date:now-(i*17+fi*5)*6e4,summary:'x',img:''}))});
   S.sel='digest';S.dgk='morning';render();await w(1200);
   const t=document.querySelector('.wtick');if(!t)return {none:true};
   const lab=t.querySelector('b'),vp=t.querySelector('.wtick-vp'),tr=t.querySelector('.wtick-in'),o={};
   const lr=lab.getBoundingClientRect(),vr=vp.getBoundingClientRect();
   o.opaque=/rgb\(\d+, ?\d+, ?\d+\)$/.test(getComputedStyle(lab).backgroundColor)||/, ?1\)$/.test(getComputedStyle(lab).backgroundColor);o.bg=getComputedStyle(lab).backgroundColor;
   o.rightOfLabel=vr.left>=lr.right+4;o.clips=getComputedStyle(vp).overflowX==='hidden';
   o.labelOnTop=(+getComputedStyle(lab).zIndex||0)>(+getComputedStyle(vp).zIndex||0);
   /* at several moments of the scroll, nothing of the track is visible left of the viewport edge */
   const an=tr.getAnimations()[0];o.anim=!!an;o.under=[];
   for(const frac of [0,.1,.3,.5,.75,.99]){if(an){an.pause();an.currentTime=frac*60000}await w(60);
    const px=lr.right-2,py=lr.top+lr.height/2;const el=document.elementFromPoint(px,py);if(!(el===lab||lab.contains(el)))o.under.push([frac,el&&el.tagName]);
    const sp=[...tr.children].filter(s=>{const q=s.getBoundingClientRect();return q.right>vr.left&&q.left<vr.left}).length;o.leak=(o.leak||0)+(getComputedStyle(vp).overflowX==='hidden'?0:sp)}
   if(an)an.play();
   /* the track is long enough to loop without a gap: two copies, each wider than the viewport */
   o.copies=tr.children.length;o.longEnough=tr.scrollWidth/2>=vr.width*0.9;
   return o});
  const t='['+W+'] ';
  ck(t+'the ticker is there',!r.none);if(r.none){continue}
  ck(t+'the WIRE label has a solid background',r.opaque,r.bg);
  ck(t+'the track starts to the right of the label',r.rightOfLabel&&r.clips,JSON.stringify([r.rightOfLabel,r.clips]));
  ck(t+'the label sits above the track',r.labelOnTop);
  ck(t+'at no point of the scroll is anything under the label',r.under.length===0&&!r.leak,JSON.stringify(r.under));
  ck(t+'the loop is seamless (the headlines are repeated)',r.copies>=2*3&&r.longEnough,JSON.stringify([r.copies,r.longEnough]));
  ck(t+'no page errors',!errs.length,errs[0]);await p.close();
 }
 await b.close();console.log(bad?'wire_tick '+bad+' FAILED':'wire_tick all passed');process.exit(bad?1:0);
})();
