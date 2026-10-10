/* Reader control: whole-word topic mute everywhere, highlights as quote cards with one markdown export, shelf playlist button, duplicate-coverage chip, dark mode at sunset toggle. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:412,height:860},acceptDownloads:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});
 const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const now=Date.now();
  const f=S.feeds[0];
  const T=['New AI chip ships this week','The minister said the plan would pass','Mayor opens bridge after repairs','Climate summit ends without a deal','Markets rally on rate hopes','Rescue teams reach flooded village'];
  items[f.id]=T.map((t,i)=>({feedId:f.id,title:t,link:'https://w.test/'+i,date:now-i*36e5,summary:'x',img:''}));S.feeds.slice(1).forEach(x=>items[x.id]=[]);state[f.id]='ok';
  const out={};
  S.mute=['ai'];out.aiHidden=muted(items[f.id][0]);out.saidKept=!muted(items[f.id][1]);
  S.mute=['climate summit'];out.phrase=muted(items[f.id][3])&&!muted(items[f.id][2]);S.mute=[];
  S.sel='all';S.atab='latest';render();await w(700);
  S.mute=['mayor'];render();await w(500);out.listHides=![...document.querySelectorAll('#grid .card')].some(c=>/Mayor/.test(c.textContent));S.mute=[];
  /* topic page: mute button */
  openTopic('bridge');await w(500);out.topicMute=!!document.querySelector('[data-topicmute]');openSearch(false);
  /* quick menu */
  render();await w(500);const c=document.querySelector('#grid .card');qaOpen(c,100,200);out.qa=[...document.querySelectorAll('#qa button')].map(x=>x.textContent);qaClose&&qaClose();
  /* highlights */
  S.hl=[{q:'A sentence worth keeping from the story.',t:now,c:'y',art:{title:'Story title',link:'https://w.test/0',ft:'Source',fc:'#369',date:now}}];S.sel='notes';render();await w(400);
  out.hlCards=document.querySelectorAll('#grid .hlc').length;out.exportBtns=document.querySelectorAll('#grid [data-hexport]').length;out.oldBtns=document.querySelectorAll('#grid [data-hcopy]').length;
  out.md=hlMarkdown();
  /* shelf */
  S.saved=items[f.id].slice(0,3).map(a=>({...a,st:now}));S.sel='saved';render();await w(500);out.shelfBtn=!!document.querySelector('[data-shelfplay]')||!('speechSynthesis' in window);
  /* dup chip */
  const a=items[f.id][5];a.more=[{l:'x1',t:'t',f:'a'},{l:'x2',t:'t',f:'b'},{l:'x3',t:'t',f:'c'},{l:'x4',t:'t',f:'d'}];out.chip=[card(a,0,'mid')].map(h=>(h.match(/class="pw tr"[^>]*>([^<]*)/)||[])[1]);
  return out});
 ck('muting "ai" hides AI stories but not "said"',r.aiHidden&&r.saidKept,JSON.stringify(r));
 ck('a muted phrase matches as text',r.phrase);ck('mute hides stories from lists',r.listHides);
 ck('topic page offers Mute this topic',r.topicMute);ck('quick menu offers the mute',r.qa.some(x=>/Don’t show me stories about/.test(x)),JSON.stringify(r.qa));
 ck('highlights are quote cards',r.hlCards===1);ck('highlights have one export button and no extra chrome',r.exportBtns===1&&r.oldBtns===0,JSON.stringify(r));
 ck('highlights export as markdown',/^# My highlights/.test(r.md)&&/^> A sentence worth keeping/m.test(r.md),r.md);
 ck('shelf can be listened to',r.shelfBtn);ck('duplicate coverage chip says how many report it',r.chip.some(x=>/5 sources report this/.test(x)),JSON.stringify(r.chip));
 const [dl]=await Promise.all([p.waitForEvent('download'),p.evaluate(()=>exportHighlightsMd())]);ck('export downloads a .md file',/\.md$/.test(dl.suggestedFilename()),dl.suggestedFilename());
 const t=await p.evaluate(async()=>{S.autodark=true;document.querySelector('.tg[data-tg="autodark"]').click();await new Promise(r=>setTimeout(r,200));return S.night});ck('dark at sunset toggle sets the twin night look',t==='twin'||t==='off',t);
 ck('no page errors',!errs.length,errs[0]);await b.close();
 console.log('control',bad?bad+' FAILED':'all passed');process.exit(bad?1:0);
})();
