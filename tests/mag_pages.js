/* "Flip through pages (experiment)": off = normal feed; on = swipeable pages, every story once, taps open the reader. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
const svg=(w,h,c)=>'data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'"><rect width="'+w+'" height="'+h+'" fill="'+c+'"/></svg>');
(async()=>{
 const b=await chromium.launch();
 for(const [W,H,shot] of [[390,780,1],[820,1100,0],[1280,800,0]]){
  const p=await (await b.newContext({viewport:{width:W,height:H}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(300);
  const t='['+W+'x'+H+'] ';
  const seed=await p.evaluate(async({a,b2,c})=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const f=S.feeds[0],now=Date.now();
   const sum='A longer summary that explains what the story is about in a couple of sentences, so that editorial and feature pages have a dek to show under the headline.';
   const imgs=[a,b2,c,'','',a,'',b2,c,'','',a,'','',b2,''];
   items[f.id]=imgs.map((im,i)=>({feedId:f.id,title:'Magazine story number '+i+(i%5===0?' with a much longer headline that goes on for quite a while so it needs to wrap over many lines on a phone':''),link:'https://m.test/s'+i,date:now-i*36e5,summary:i%3?sum:'Short.',img:im,html:'<p>Body '+i+'</p>'}));
   S.feeds.slice(1).forEach(x=>items[x.id]=[]);state[f.id]='ok';S.sel='all';S.mgp=false;S.view='card';render();await new Promise(r=>setTimeout(r,300));
   return {off:!!document.querySelector('#grid.mg'),cards:document.querySelectorAll('#grid .card').length}},{a:svg(1600,900,'#468'),b2:svg(1000,1400,'#864'),c:svg(1200,800,'#684')});
  ck(t+'off: normal feed, no pages',!seed.off&&seed.cards>0,JSON.stringify(seed));
  await p.evaluate(()=>{S.mgp=true;save();render()});await p.waitForTimeout(1500);
  const r=await p.evaluate(()=>{const g=document.querySelector('#grid'),pg=g.querySelector('.mg-pager'),pages=[...g.querySelectorAll('.mg-page')];
   const links=[...g.querySelectorAll('a[data-edstory]')].map(a=>a.dataset.edstory);
   const bad=pages.filter(s=>{const sh=s.querySelector('.sheet').getBoundingClientRect();return [...s.querySelectorAll('a.st')].some(a=>{const r=a.getBoundingClientRect();return r.height<=0||r.right>sh.right+2||r.left<sh.left-2})}).length;
   return {has:!!pg,n:pages.length,dup:links.length-new Set(links).size,tot:links.length,types:pages.map(s=>s.dataset.t).join(','),h:pg&&pg.getBoundingClientRect().height,vh:innerHeight,docW:document.documentElement.scrollWidth,iw:innerWidth,bad,
     tall:pages.filter(s=>{const sh=s.querySelector('.sheet');return sh.scrollHeight>sh.clientHeight+2}).length,cnt:g.querySelector('.mg-cnt').textContent}});
  ck(t+'on: pager with several pages',r.has&&r.n>=4,JSON.stringify(r));
  ck(t+'no story twice',r.dup===0,JSON.stringify(r));
  ck(t+'pager fits the screen and nothing overflows sideways',r.h>250&&r.h<r.vh&&r.docW<=r.iw&&r.bad===0&&r.tall===0,JSON.stringify(r));
  ck(t+'mixes page types',new Set(r.types.split(',')).size>=3,r.types);
  if(shot)await p.screenshot({path:process.env.SHOT||'/tmp/mg.png'});
  await p.keyboard.press('Tab').catch(()=>{});
  await p.evaluate(()=>{document.querySelector('.mg-pager').focus()});await p.keyboard.press('ArrowRight');await p.waitForTimeout(700);
  const i2=await p.evaluate(()=>document.querySelector('.mg-cnt').textContent);ck(t+'arrow key turns the page',/^2 \//.test(i2),i2);
  await p.evaluate(()=>render());await p.waitForTimeout(300);
  const i3=await p.evaluate(()=>document.querySelector('.mg-cnt').textContent);ck(t+'re-render keeps the page',/^2 \//.test(i3),i3);
  await p.evaluate(()=>{document.querySelector('.mg-page:nth-child(2) a.st').click()});await p.waitForTimeout(1500);
  ck(t+'tap opens the reader',await p.evaluate(()=>document.querySelector('#rd').classList.contains('on')));
  await p.evaluate(()=>{closeRd()});await p.waitForTimeout(600);
  await p.evaluate(()=>{S.mgp=false;save();render()});await p.waitForTimeout(400);
  ck(t+'turned off again: normal feed back',await p.evaluate(()=>!document.querySelector('#grid.mg')&&!document.querySelector('.mg-pager')&&document.querySelectorAll('#grid .card').length>0));
  ck(t+'no page errors',!errs.length,errs[0]);await p.close();
 }
 await b.close();console.log(bad?'mag_pages '+bad+' FAILED':'mag_pages all passed');process.exit(bad?1:0);
})();
