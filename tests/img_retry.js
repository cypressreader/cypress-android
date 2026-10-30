/* Image retry: tapping "Tap to try again" on a picture that could not load gives exactly one picture in its place,
   and when that picture is the story's lead photo (already shown at the top) the lead is not shown a second time. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x===undefined?'':x)}else console.log('ok',n)};
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAZAAAADICAIAAABJdyC1AAAAMElEQVR4nO3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPgYQeAAAWk6Hf0AAAAASUVORK5CYII=','base64');
(async()=>{const b=await chromium.launch();
 for(const W of [412,1100])for(const lead of [false,true]){
  const p=await (await b.newContext({viewport:{width:W,height:860}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{n:3});let ok=false;
  await p.route(/img\.test/,r=>{const u=r.request().url();(!/w=1200/.test(u)||ok)?r.fulfill({status:200,contentType:'image/png',body:png}):r.fulfill({status:404,body:''})});
  await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});
  await p.evaluate(lead=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const f=S.feeds[0].id,para='<p>'+'Body words go here for the story. '.repeat(30)+'</p>';
   const a={feedId:f,title:'Picture retry story',link:'https://s.test/story-9',date:Date.now(),summary:'s',img:lead?'https://img.test/a.jpg':'',html:'<figure><img src="https://img.test/a.jpg?w=1200" width="640" height="360" alt="A tiger"><figcaption>A tiger</figcaption></figure>'+para+para+para};
   items[f]=[a];state[f]='ok';acPut(a.link,a.html,1);S.sel='all';S.scroll='page';render();openReader(a)},lead);
  await p.waitForTimeout(2500);const tag=W+(lead?' lead':' plain')+': ';
  const pre=await p.evaluate(()=>[...document.querySelectorAll('[data-imgretry]')].filter(x=>!x.closest('.tl,.tl-leaf')).length);console.log('   lead imgs before retry:',await p.evaluate(()=>[...document.querySelectorAll('#rd img')].map(i=>i.className+':'+Math.round(i.getBoundingClientRect().width)).join(',')));ck(tag+'the failed picture shows the retry button',pre===1,String(pre));
  ok=true;await p.evaluate(()=>document.querySelector('[data-imgretry]').click());await p.waitForTimeout(2000);
  const vis=await p.evaluate(()=>[...document.querySelectorAll('#rd img')].filter(i=>i.getBoundingClientRect().width>40&&i.naturalWidth>0&&!i.closest('.tl,.tl-leaf')/* not the page-turn copies */).map(i=>i.src.split('?')[0]));
  ck(tag+'exactly one picture after the retry',vis.length===1,JSON.stringify(vis));
  ck(tag+'no retry button left',await p.evaluate(()=>!document.querySelector('[data-imgretry]')));
  ck(tag+'no page errors',!errs.length,errs[0]);await p.context().close();
 }
 await b.close();console.log('img_retry',bad?bad+' FAILED':'all passed');process.exit(bad?1:0)})();
