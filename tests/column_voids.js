/* Page mode: text flows to fill the columns. Pictures, tables, code and quotes that do not fit the room left at the foot of a column no longer leave a half-empty column (the block moves after the next paragraph, at most three paragraphs), and large photos no longer force their own column. Several article shapes, three tablet sizes. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 const b=await chromium.launch();
 for(const [W,H] of [[1100,820],[820,1180],[1366,1024]]){
  const p=await (await b.newContext({viewport:{width:W,height:H}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:10});
  await p.route('https://img.test/**',r=>{const m=r.request().url().match(/(\d+)x(\d+)/);const w=+m[1],h=+m[2];r.fulfill({status:200,contentType:'image/svg+xml',body:`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#6a9"/><circle cx="50%" cy="40%" r="20%" fill="#fde9b8"/></svg>`})});
  await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(400);
  const res=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const f=S.feeds[0];const now=Date.now();
   const P=(n,k)=>'<p>'+('Reporting text for paragraph '+k+' of the story, with ordinary words that make a realistic line length for the column. ').repeat(n)+'</p>';
   const fig=(w,h,c)=>'<figure><img src="https://img.test/'+w+'x'+h+'.jpg" width="'+w+'" height="'+h+'" alt=""><figcaption>'+c+'</figcaption></figure>';
   const A=[P(4,0),fig(1200,800,'Landscape photo'),P(5,1),fig(900,1400,'A tall portrait photo'),P(6,2),fig(1200,500,'Wide panorama'),P(5,3),'<blockquote>'+P(3,'q')+'</blockquote>',P(4,4),fig(800,800,'Square photo'),P(7,5),'<h2>A section heading</h2>',P(5,6),'<ul><li>One list item that is fairly long and wraps onto a couple of lines in the column</li><li>Another list item</li><li>A third list item with some words</li></ul>',P(8,7),fig(1200,900,'Another photo'),P(6,8),'<table><thead><tr><th>Name</th><th>Value</th></tr></thead><tbody>'+Array.from({length:14},(_,i)=>'<tr><td>Row '+i+'</td><td>'+(i*37)+'</td></tr>').join('')+'</tbody></table>',P(6,9),'<pre><code>'+Array.from({length:18},(_,i)=>'line '+i+' of some code that is quite long to look at here').join('\n')+'</code></pre>',P(8,10)].join('');
   const arts=[{h:A,t:'Mixed media'},{h:Array.from({length:12},(_,i)=>P(7,i)+(i%3===2?'<h2>Heading '+i+'</h2>':'')).join(''),t:'Plain long'},{h:P(5,0)+fig(1000,1500,'Portrait')+P(3,1)+fig(1000,1500,'Portrait two')+P(10,2)+fig(1000,1500,'Portrait three')+P(12,3),t:'Portrait heavy'},{h:P(6,0)+fig(1600,900,'W1')+P(4,1)+fig(1600,900,'W2')+P(4,2)+fig(1600,900,'W3')+P(4,3)+fig(1600,900,'W4')+P(6,4)+fig(1600,900,'W5')+P(5,5),t:'Photo essay'}];
   S.feeds.slice(1).forEach(x=>items[x.id]=[]);state[f.id]='ok';
   items[f.id]=arts.map((a,i)=>({feedId:f.id,title:a.t,link:'https://w.test/v'+i,date:now-i*36e5,summary:'x',img:'',html:a.h}));
   S.scroll='paged';S.fbleed=true;S.sel='all';render();await w(400);const out=[];
   for(const a of items[f.id]){openReader(a);await w(3800);
    const c=document.querySelector('.cols'),bd=c.querySelector('.body'),cs=getComputedStyle(c),gap=parseFloat(cs.columnGap)||0,colH=c.clientHeight,ncc=+cs.columnCount||1,pitch=(c.clientWidth+gap)/ncc;
    const bl=bd.getBoundingClientRect(),bt=bl.top,nC=Math.ceil((bd.offsetWidth+gap)/pitch),low=new Array(nC).fill(0);
    for(const e of bd.querySelectorAll('p,li,h2,h3,h4,blockquote,figure,img,table,pre,figcaption,.pullq,.tbl,.emb,.rfoot,.rtags,.endmark')){for(const q of e.getClientRects()){if(!q.width||!q.height)continue;const k=Math.floor((q.left-bl.left+2)/pitch);if(k>=0&&k<nC){const bb=q.bottom-bt;if(bb>low[k])low[k]=bb}}}
    const em=bd.querySelector('.endmark,.rtags,.rfoot'),eq=em&&em.getClientRects()[0],endC=eq?Math.floor((eq.left-bl.left+2)/pitch):nC-1;
    const fill=low.map(x=>Math.round(x/colH*100));
    const ps=[...bd.querySelectorAll(':scope>p')].filter(p=>!p.classList.contains('endmark')&&!p.classList.contains('rtags')&&!p.classList.contains('dropcap')||p.classList.contains('dropcap')).map(p=>p.textContent.replace(/\s+/g,' ').trim().slice(0,40));
    out.push({t:a.title,np:R.np,fill,endC,voids:fill.map((x,i)=>[i,x]).filter(([i,x])=>i<endC&&x<55),figs:bd.querySelectorAll('figure,.imgfb').length,paras:ps,orig:(a.html.match(/<p>/g)||[]).length});
   }
   return out});
  for(const r of res){
   const t='['+W+'x'+H+' '+r.t+'] ';
   ck(t+'no half-empty column before the end of the article',r.voids.length===0,JSON.stringify([r.fill,r.voids]));
  }
  const mixed=res.find(r=>r.t==='Mixed media');
  ck('['+W+'x'+H+'] every picture is still there',res.find(r=>r.t==='Photo essay').figs>=5&&mixed.figs>=5,JSON.stringify(res.map(r=>[r.t,r.figs])));
  ck('['+W+'x'+H+'] the text keeps its order (paragraphs are not shuffled)',res.every(r=>{const nums=r.paras.map(s=>{const m=s.match(/paragraph (\w+)/);return m?m[1]:null}).filter(x=>x!==null);const exp=nums.slice().sort((a,b)=>String(a).localeCompare(String(b),undefined,{numeric:true}));return JSON.stringify(nums)===JSON.stringify(exp)}),JSON.stringify(res.map(r=>r.paras.map(s=>(s.match(/paragraph (\w+)/)||[])[1]))));
  ck('['+W+'x'+H+'] no page errors',!errs.length,errs[0]);await p.close();
 }
 await b.close();console.log(bad?'column_voids '+bad+' FAILED':'column_voids all passed');process.exit(bad?1:0);
})();
