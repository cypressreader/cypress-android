/* Adding a feed tells you where it went (folder named) and offers to open it; the folder picker is visible, not folded away. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x===undefined?'':x)}else console.log('ok',n)};
(async()=>{
 const b=await chromium.launch();
 for(const W of [412,1100]){
  const p=await (await b.newContext({viewport:{width:W,height:860}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(400);
  const t=W+' ';
  /* the folder picker is open the moment the dialog opens */
  const open=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());S.fcheck=false;S.sel='all';render();$('#add').click();await new Promise(r=>setTimeout(r,300));const d=$('#adv'),fo=$('#fo');const r=fo.getBoundingClientRect();return {open:d.open,vis:r.width>20&&r.height>10,label:(document.querySelector('label[for=fo]')||{}).textContent}});
  ck(t+'"Name and folder" is open and the folder picker is visible',open.open&&open.vis,JSON.stringify(open));
  /* adding from the list names the folder and offers Open */
  await p.evaluate(async()=>{const u=$('#u');u.value='dezeen';u.dispatchEvent(new Event('input',{bubbles:true}));try{pop()}catch(e){}await new Promise(r=>setTimeout(r,600))});
  const has=await p.evaluate(()=>!!document.querySelector('#pop [data-add]'));ck(t+'the list offers a site to add',has);
  if(has){
   const before=await p.evaluate(()=>S.feeds.length);
   await p.evaluate(()=>document.querySelector('#pop [data-add]').click());await p.waitForTimeout(1500);
   const r=await p.evaluate(()=>{const tt=document.querySelector('#toast');const f=S.feeds[S.feeds.length-1],fo=S.folders.find(o=>o.id===f.folder);return {n:S.feeds.length,text:tt?tt.textContent:'',btn:tt&&tt.querySelector('.tundo')?tt.querySelector('.tundo').textContent:'',folder:fo&&fo.name,id:f.id}});
   ck(t+'a feed was added',r.n===before+1,JSON.stringify(r));
   ck(t+'the confirmation names the folder it went to',r.folder&&r.text.includes('“'+r.folder+'”')&&/^Added/.test(r.text),r.text);
   ck(t+'the confirmation offers Open',r.btn==='Open',r.btn);
   await p.evaluate(()=>document.querySelector('#toast .tundo').click());await p.waitForTimeout(500);
   const o=await p.evaluate(id=>({sel:S.sel,dlg:$('#dlg').open,want:'s:'+id}),r.id);
   ck(t+'Open takes you to that feed',o.sel===o.want&&!o.dlg,JSON.stringify(o));
  }
  /* a pasted address goes to the chosen folder and says so */
  await p.evaluate(async()=>{S.sel='all';render();$('#add').click();await new Promise(r=>setTimeout(r,200));fillFolders();$('#fo').value=S.folders[1]?S.folders[1].id:S.folders[0].id;$('#u').value='https://pasted.test/feed';$('#n').value='Pasted Site'});
  await p.evaluate(()=>document.querySelector('#frm').requestSubmit());await p.waitForTimeout(3500);
  const q=await p.evaluate(()=>{const tt=document.querySelector('#toast'),f=S.feeds.find(f=>f.title==='Pasted Site'),fo=f&&S.folders.find(o=>o.id===f.folder);return {added:!!f,folder:fo&&fo.name,text:tt?tt.textContent:''}});
  ck(t+'a pasted address is added and the note names its folder',q.added&&q.folder&&q.text.includes('“'+q.folder+'”'),JSON.stringify(q));
  ck(t+'no page errors',!errs.length,errs[0]);
  await p.context().close();
 }
 await b.close();console.log('add_feed',bad?bad+' FAILED':'all passed');process.exit(bad?1:0);
})();
