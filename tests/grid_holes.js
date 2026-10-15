/* Feed grids leave no empty card-sized holes: in any block of cards laid out in columns, a last row with fewer cards than columns is filled by a card that spans the row. Checked at phone, tablet and desktop widths, for All stories, one feed and a folder, with odd and even numbers of stories. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x===undefined?'':x)}else console.log('ok',n)};
(async()=>{
 const b=await chromium.launch();
 for(const W of [412,515,700,900,1100,1400]){
  const p=await (await b.newContext({viewport:{width:W,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(400);
  const found=[];let checked=0;
  for(const count of [9,10,11,13,14]){
   const r=await p.evaluate(async count=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const now=Date.now();
    const uw=n=>{let x=(n+3)*7919,o='';for(let k=0;k<6;k++){o+=String.fromCharCode(97+x%26);x=Math.floor(x/26)+k*5+1}return o};
    const svg=c=>'data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"><rect width="800" height="500" fill="'+c+'"/></svg>');
    S.feeds.slice(0,4).forEach((f,fi)=>{items[f.id]=Array.from({length:count},(_,i)=>({feedId:f.id,title:[0,1,2,3].map(k=>uw((fi*count+i)*4+k+40)).join(' ')+(i%3===0?' with a longer headline that wraps':''),link:'https://w.test/'+fi+'/'+i,date:now-(i*7+fi*2+2)*6e4,summary:'A standfirst for the story long enough for two lines of text.',img:(i%2===0)?svg(['#468','#a64','#6a5','#85a'][fi]):'',html:'<p>'+'Body. '.repeat(60)+'</p>'}));state[f.id]='ok'});
    S.seen={};S.scroll='page';const out=[];
    for(const sel of ['all','s:'+S.feeds[0].id,'f:'+(S.folders[0]||{}).id]){S.sel=sel;render();await w(700);for(let i=0;i<40;i++)NRMORE&&NRMORE();await w(500);
     const g=document.querySelector('#grid');const conts=new Map();
     [...g.querySelectorAll('[data-i]')].filter(e=>e.offsetParent).forEach(e=>{const c=e.parentElement;if(!conts.has(c))conts.set(c,[]);const r=e.getBoundingClientRect();conts.get(c).push({l:Math.round(r.left),t:Math.round(r.top),b:Math.round(r.bottom),r:Math.round(r.right),h:Math.round(r.height)})});
     for(const [c,list0] of conts){/* the newsroom feed (grid.nr and its photo/text strips) is a varied rhythm of lead, trio, text rows and strips by design, not a uniform grid: it has no "last row" to fill */if(c.classList.contains('nr')||c.closest('.nr'))continue;const cw=c.getBoundingClientRect().width||innerWidth;const list=list0.filter(x=>x.r-x.l<cw*.7);/* full-width and full-bleed cards are not columns */const cols=[];list.map(x=>x.l).sort((a,b)=>a-b).forEach(l=>{if(!cols.length||l-cols[cols.length-1]>40)cols.push(l)});if(cols.length<2||list.length<2)continue;
      const lastTop=Math.max(...list.map(x=>x.t)),lastRow=list.filter(x=>x.t>=lastTop-3),contR=Math.max(...list.map(x=>x.r));
      const colBottoms=cols.map(L=>Math.max(...list.filter(x=>Math.abs(x.l-L)<=40).map(x=>x.b)));const med=list.map(x=>x.h).sort((a,b)=>a-b)[Math.floor(list.length/2)];
      const partialRow=lastRow.length<cols.length&&Math.max(...lastRow.map(x=>x.r))<contR-20;
      const unevenCols=!lastRow.some(x=>x.r-x.l>(contR-Math.min(...list.map(y=>y.l)))*.8)&&Math.max(...colBottoms)-Math.min(...colBottoms)>Math.max(60,med*.6)&&list.length>=3;
      if(partialRow||unevenCols)out.push({sel,cont:c.className.split(' ').slice(0,3).join('.'),cols:cols.length,n:list.length,partialRow,unevenCols})}
    }
    return out},count);
   checked++;found.push(...r.map(x=>({count,...x})));
  }
  ck(W+'px: no empty card-sized holes in All stories, one feed or a folder ('+checked+' list lengths)',!found.length,JSON.stringify(found.slice(0,3)));
  ck(W+'px: no page errors',!errs.length,errs[0]);await p.context().close();
 }
 await b.close();console.log('grid_holes',bad?bad+' FAILED':'all passed');process.exit(bad?1:0);
})();
