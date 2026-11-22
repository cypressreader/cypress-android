const {mock,PW}=require('/home/user/cypress-android/tests/mock');const {chromium}=require(PW);
(async()=>{const b=await chromium.launch();const out={};
for(const v of ['old','new']){
 const ctx=await b.newContext({viewport:{width:884,height:1104}});const p=await ctx.newPage();p.on('pageerror',e=>{});
 await mock(p,{n:6});await p.goto('file://'+require('path').resolve(__dirname,'../../',v==='old'?'tools/r3/old.html':'www/index.html'));await p.waitForTimeout(1500);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(300);
 out[v]=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));
  const c=document.createElement('canvas');c.width=1200;c.height=750;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,0,750);g.addColorStop(0,'#c8d4dc');g.addColorStop(.5,'#5a6e7a');g.addColorStop(1,'#2a3a2a');x.fillStyle=g;x.fillRect(0,0,1200,750);const img=c.toDataURL('image/jpeg',.7);const now=Date.now();
  S.feeds.slice(0,4).forEach((f,fi)=>{items[f.id]=Array.from({length:10},(_,i)=>({feedId:f.id,title:'Why the president turned against his former ally number '+i+' '+fi,link:'https://w.test/'+fi+'/'+i,date:now-(i*4+fi)*36e5/3,summary:'Behind the break lies a domestic power struggle.',img,sec:'News'}));state[f.id]='ok'});
  const names=(typeof THEME_NAMES!=='undefined'?Object.keys(THEME_NAMES):[]);const res=[];
  for(const th of names)for(const sch of ['light','dark'])for(const cards of ['medium','large'])for(const sel of ['all','today']){
   S.theme=th;S.sch=sch;S.cards=cards;S.sel=sel;try{applyTheme()}catch(e){}render();await w(500);
   const bad=[...document.querySelectorAll('#grid .card,#grid .dcov')].filter(c=>c.querySelector('img')&&!c.closest('.tl,.tl-leaf')).map(c=>{const h=c.querySelector('h3,h2'),im=c.querySelector('img');if(!h)return null;const a=h.getBoundingClientRect(),q=im.getBoundingClientRect();if(a.height<1||!(a.top<q.bottom&&a.bottom>q.top&&a.left<q.right&&a.right>q.left))return null;const m=getComputedStyle(h).color.match(/[\d.]+/g).map(Number);return m[0]+m[1]+m[2]<300?(c.className.replace(/\s+/g,' ').trim().slice(0,50)+(h.style.color?' [inked '+h.style.color+']':'')):null}).filter(Boolean);
   if(bad.length)res.push(th+'/'+sch+'/'+cards+'/'+sel+': '+bad.length+' '+bad[0])}
  return {n:names.length,res}});
 await ctx.close()}
console.log('themes',out.old.n,out.new.n);console.log('OLD dark-over-photo:',out.old.res.length);out.old.res.slice(0,8).forEach(x=>console.log('  ',x));console.log('NEW dark-over-photo:',out.new.res.length);out.new.res.slice(0,40).forEach(x=>console.log('  ',x));
await b.close()})();
