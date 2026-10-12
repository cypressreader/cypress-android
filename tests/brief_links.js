/* Every story link in every list view opens in the app's own reader (never the publisher's site in the browser), and opens the story that was tapped. Includes the Brief tab ("Three to know"). */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x===undefined?'':x)}else console.log('ok',n)};
(async()=>{
 const b=await chromium.launch();
 for(const W of [412,1100]){
  const ctx=await b.newContext({viewport:{width:W,height:860}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));let popups=0;ctx.on('page',pg=>{if(pg!==p)popups++});
  await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(400);
  await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const now=Date.now();
   const uw=n=>{let x=(n+3)*7919,o='';for(let k=0;k<6;k++){o+=String.fromCharCode(97+x%26);x=Math.floor(x/26)+k*5+1}return o};
   S.feeds.slice(0,4).forEach((f,fi)=>{items[f.id]=Array.from({length:14},(_,i)=>({feedId:f.id,title:[0,1,2,3].map(k=>uw((fi*14+i)*4+k+40)).join(' '),link:'https://w.test/'+fi+'/'+i,date:now-(i*55+fi*9+30)*6e4,summary:'A standfirst for the story.',img:'',html:'<p>'+('Body text of the story with plenty of words. ').repeat(40)+'</p>'}));state[f.id]='ok'})});
  const views=[['Brief (page)',async()=>{S.sel='brief';render()}],['Daily > Today',async()=>{S.sel='today';render()}],['Daily > Brief tab',async()=>{S.sel='today';render();await new Promise(r=>setTimeout(r,800));const b=[...document.querySelectorAll('#mtabs button,[role=tab]')].find(x=>/^\s*Brief/.test(x.textContent));if(b)b.click()}],['Daily > Headlines tab',async()=>{S.sel='today';render();await new Promise(r=>setTimeout(r,800));const b=[...document.querySelectorAll('#mtabs button,[role=tab]')].find(x=>/^\s*Headlines/.test(x.textContent));if(b)b.click()}],['All stories',async()=>{S.sel='all';render()}]];
  for(const [vn,setup] of views){
   await p.evaluate(async setup=>{if(document.querySelector('#rd.on'))closeRd();await new Promise(r=>setTimeout(r,200));await (new Function('return '+setup))()()},setup.toString());
   await p.waitForTimeout(1500);
   const n=await p.evaluate(()=>[...document.querySelectorAll('#grid a[href][data-i]')].filter(a=>a.offsetParent).length);
   const fails=[];let tested=0;
   for(let i=0;i<Math.min(n,12);i++){
    await p.evaluate(()=>{if(document.querySelector('#rd.on'))closeRd()});await p.waitForTimeout(250);
    const el=await p.evaluate(i=>{const as=[...document.querySelectorAll('#grid a[href][data-i]')].filter(a=>a.offsetParent);const a=as[i];if(!a)return null;a.scrollIntoView({block:'center'});const r=a.getBoundingClientRect(),x=r.left+r.width*.35,y=r.top+r.height*.5,t=document.elementFromPoint(x,y);return {x,y,ok:!!t&&a.contains(t),cls:a.className.split(' ').slice(0,2).join('.'),want:cur[+a.dataset.i]&&cur[+a.dataset.i].link}},i);
    if(!el||!el.ok)continue;
    const url0=p.url();await p.mouse.click(el.x,el.y);await p.waitForTimeout(900);
    const got=await p.evaluate(()=>({open:!!document.querySelector('#rd.on'),link:curA&&curA.link}));tested++;
    if(!got.open||got.link!==el.want||p.url()!==url0)fails.push([el.cls,got.open,got.link,p.url().slice(0,30)]);
    if(p.url()!==url0){await p.goBack().catch(()=>{});await p.waitForTimeout(800)}
   }
   ck(W+' '+vn+': '+tested+' story links each open that story in the reader',(/Brief/.test(vn)?tested>=2:true)&&!fails.length&&!popups,JSON.stringify(fails.slice(0,3)));
  }
  ck(W+' no page errors',!errs.length,errs[0]);await ctx.close();
 }
 await b.close();console.log('brief_links',bad?bad+' FAILED':'all passed');process.exit(bad?1:0);
})();
