/* B91: "Teach CyPress" puts the feed in the folder chosen in the Add dialog, including a brand-new one */
const {APP}=require('./env');const {mock,seed,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:1100,height:800}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await mock(p,{n:3});await p.addInitScript(sd=>{try{if(!localStorage.getItem('folio'))localStorage.setItem('folio',JSON.stringify(sd))}catch(e){}},seed(['Alpha','Beta']));
 await p.goto('file://'+APP);await p.waitForTimeout(1500);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(300);
 const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());S.fcheck=false;document.getElementById('add').click();await new Promise(r=>setTimeout(r,500));
  learnCandidates=async()=>({cands:[{t:'Headline one'}],rx:'x',page:'https://teachone.test/'});askBox=async()=>'1';teachPick=async()=>({fo:$('#fo').value,nf:$('#nf').value});load=()=>Promise.resolve();
  const o={};
  /* a new folder */
  $('#u').value='teachone.test';const fo=$('#fo');fo.value='__new';fo.onchange();$('#nf').value='Fresh Folder';const nf0=S.folders.length;
  await $('#teach').onclick();await new Promise(r=>setTimeout(r,300));
  const f=S.feeds.find(x=>/teachone/.test(x.url||''));const fol=f&&S.folders.find(x=>x.id===f.folder);
  o.newFolder={made:S.folders.length===nf0+1,name:fol&&fol.name,pop:(document.body.textContent.match(/Fresh Folder/)||[])[0]||''};
  /* an existing folder */
  document.getElementById('add').click();await new Promise(r=>setTimeout(r,400));
  learnCandidates=async()=>({cands:[{t:'Headline two'}],rx:'x',page:'https://teachtwo.test/'});
  $('#u').value='teachtwo.test';$('#fo').value=S.folders[0].id;await $('#teach').onclick();await new Promise(r=>setTimeout(r,300));
  const g=S.feeds.find(x=>/teachtwo/.test(x.url||''));o.existing={folder:g&&g.folder,want:S.folders[0].id};
  return o});
 ck('the new folder is created and named as typed',r.newFolder.made&&r.newFolder.name==='Fresh Folder',JSON.stringify(r.newFolder));
 ck('a chosen existing folder is used',r.existing.folder===r.existing.want,JSON.stringify(r.existing));
 ck('no page errors',!errs.length,errs[0]);await b.close();console.log(bad?'FAILED '+bad:'teach_folder all passed');process.exit(bad?1:0)})();
