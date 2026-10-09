/* Messy-data layout test. Renders the main screens at many widths with ugly data (no pictures, broken pictures,
   very long headlines, long unbroken words, empty summaries) and checks for the problems we keep meeting on real
   devices: sideways overflow, headlines squeezed into slivers, empty gaps inside rows, oversized quote blocks. */
const {APP,OUT}=require('./env');
const {mockRich,seedRich,PW}=require('./mock3');const {chromium}=require(PW);
const WIDTHS=(process.env.WIDTHS||'360,412,600,700,768,834,1024,1180,1366').split(',').map(Number);
const SCEN=(process.env.SCEN||'noimg,messy,allimg').split(',');
const VIEWS=[['today','latest'],['all','top'],['all','quick'],['all','deep'],['digest',''],['digest','week'],['all',''],['f:d1','']];
const fails={};let n=0;
const bad=(k,msg)=>{(fails[k]=fails[k]||[]).push(msg)};
(async()=>{const b=await chromium.launch();
for(const w of WIDTHS){
 const ctx=await b.newContext({viewport:{width:w,height:900},hasTouch:w<700,isMobile:w<500});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await mockRich(p,{n:40});await p.addInitScript(s=>{try{if(!localStorage.getItem('folio'))localStorage.setItem('folio',JSON.stringify({...s,intro:false,theme:'light'}))}catch(e){}},seedRich());
 await p.goto('file://'+APP);await p.waitForTimeout(2200);await p.evaluate(()=>{[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Got it')?.click()});
 for(const sc of SCEN){
  await p.evaluate(sc=>{
   const LONG=['The unusually long and winding headline that keeps going well past the point where a sensible editor would have cut it down to size for a small screen','Supercalifragilisticexpialidocious-and-antidisestablishmentarianism-unbroken-token-that-never-wraps-anywhere','Short one','Why “quotes” and — dashes & ampersands <b>behave</b> badly in headlines: a long look','A'];
   const SUMM=['','A short summary.','“This is a real quoted sentence that is long enough to become a pull quote on the page,” the minister said.','Strikes on tankers in the Strait of Hormuz and oil infrastructure in Saudi Arabia came as the region’s exporters were getting more oil to the world market. '.repeat(3)];
   let k=0;Object.keys(items).forEach(fid=>{items[fid].forEach((a,i)=>{k++;a.title=LONG[(k*7+i)%LONG.length]+' '+k;a.summary=SUMM[(k*3+i)%SUMM.length];a.wc=[0,150,900,2400,3000][(k+i)%5];
     a.img=sc==='noimg'?'':sc==='allimg'?'https://img.test/'+(1+(k%20))+'.jpg':(k%3===0?'':k%3===1?'https://x.invalid/missing.jpg':'https://img.test/'+(1+(k%20))+'.jpg')})});
   S.rt=S.rt||{};Object.values(items).flat().forEach((a,i)=>{if(i%4===0)S.rt[a.link]=[2,12,6,25][i%4+((i>>2)%4)]||3});
  },sc);
  for(const [sel,sub] of VIEWS){
   n++;const key=`${sc} @${w} ${sel}${sub?'/'+sub:''}`;
   await p.evaluate(([sel,sub])=>{if(sel==='today'){S.sel='today'}else if(sel==='all'){S.sel='all';S.atab=sub||'latest'}else if(sel==='digest'){S.sel='digest';S.dgk=sub}else{S.sel=sel}render()},[sel,sub]);
   await p.waitForTimeout(450);
   for(let i=0;i<12;i++){await p.evaluate(()=>{window.NRMORE&&NRMORE()});await p.waitForTimeout(40)}
   const r=await p.evaluate(()=>{
    const m=document.querySelector('main').getBoundingClientRect(),out=[];
    const inScroller=e=>{for(let x=e.parentElement;x&&x.id!=='grid';x=x.parentElement){const o=getComputedStyle(x).overflowX;if((o==='auto'||o==='scroll')&&x.scrollWidth>x.clientWidth+2)return true}return false};
    document.querySelectorAll('#grid *').forEach(e=>{const r=e.getBoundingClientRect();if(!r.width||!r.height)return;
     if((r.right>m.right+3||r.left<m.left-3)&&getComputedStyle(e).position!=='fixed'&&!inScroller(e)&&!(e.tagName==='IMG'&&e.parentNode.classList&&e.parentNode.classList.contains('card'))&&!e.closest('.nr-ph-strip,.nr-strip,.nr-hs,.tbl,.cover,.dcov,.dwell,.dback'))out.push('overflow '+e.tagName+'.'+String(e.className).slice(0,30)+' '+Math.round(r.left-m.left)+'..'+Math.round(r.right-m.right))});
    document.querySelectorAll('#grid .card h3').forEach(h=>{const r=h.getBoundingClientRect();if(!r.width)return;
     if(r.width<90&&!h.closest('.nr-ph-strip,.nr-strip,.nr-hs,.nr-tall'))out.push('sliver headline '+Math.round(r.width)+'px');
     if(h.scrollWidth>h.clientWidth+3&&getComputedStyle(h).overflowX!=='visible'||h.scrollWidth>m.width+3)out.push('headline clipped '+h.scrollWidth+'>'+h.clientWidth)});
    document.querySelectorAll('#grid .card.nr-row,#grid .card.nr-late,#grid .card.nr-m,#grid .card.nr-s').forEach(c=>{const tx=c.querySelector('.tx');if(!tx)return;const ch=c.getBoundingClientRect().height,th=tx.getBoundingClientRect().height,im=c.querySelector(':scope>img');
     const imh=im&&getComputedStyle(im).display!=='none'?im.getBoundingClientRect().height:0;const stk=imh&&im.getBoundingClientRect().bottom<=tx.getBoundingClientRect().top+2;if(ch>(stk?th+imh:Math.max(th,imh))+90)out.push('row gap '+Math.round(ch)+' vs text '+Math.round(th)+' photo '+Math.round(imh)+' ['+String(c.className).replace(/card|nr /g,'').trim()+' in '+String(c.parentElement.className).slice(0,20)+']')});
    document.querySelectorAll('#grid .nr-quote,#grid .nr-pq').forEach(q=>{const h=q.getBoundingClientRect().height;if(h>640)out.push('quote block '+Math.round(h)+'px')});
    document.querySelectorAll('#grid .card').forEach(c=>{const h=c.getBoundingClientRect().height;if(h>900)out.push('huge card '+Math.round(h)+' '+String(c.className).slice(0,40))});
    return out.slice(0,6)});
   r.forEach(x=>bad(x.replace(/\d+/g,'#').slice(0,60),key+': '+x));
   if(errs.length){bad('page error',key+': '+errs.pop())}
  }
 }
 await ctx.close();
}
await b.close();
const kinds=Object.keys(fails);
console.log(`checked ${n} screens at ${WIDTHS.length} widths`);
kinds.forEach(k=>{console.log('FAIL '+k+' ×'+fails[k].length);fails[k].slice(0,4).forEach(x=>console.log('    '+x))});
console.log('bad '+kinds.length);process.exit(kinds.length?1:0)})();
