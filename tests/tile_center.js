/* One-letter tiles (folder and source mastheads, quote-card avatars) are optically centred: the glyph is nudged down about 0.05em in every one. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 const b=await chromium.launch();
 for(const W of [1100,412]){
  const p=await (await b.newContext({viewport:{width:W,height:860}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(300);
  const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));const now=Date.now();const o={tiles:[]};
   S.feeds.slice(0,4).forEach((f,fi)=>{state[f.id]='ok';items[f.id]=Array.from({length:12},(_,i)=>({feedId:f.id,title:['Harbour','Quantum','Glacier','Orchard'][fi]+' story number '+i+' about the '+['sea','chips','ice','apples'][fi],link:'https://w.test/'+fi+'/'+i,date:now-(i*55+fi*9)*6e4,img:'',summary:'“I did not expect to feel this way about a game that I had only just started playing,” said the reviewer, adding that the combat was the finest of the year.'}))});
   const grab=tag=>{document.querySelectorAll('.fm-mark,.pqc .av,.opt-c').forEach(e=>{const cs=getComputedStyle(e),fs=parseFloat(cs.fontSize),r=e.getBoundingClientRect();o.tiles.push({tag,cls:e.className,pt:parseFloat(cs.paddingTop)/fs,w:Math.round(r.width),h:Math.round(r.height),sz:cs.boxSizing})})};
   S.sel='s:'+S.feeds[0].id;render();await w(900);grab('source');
   S.sel='f:'+S.folders[0].id;render();await w(900);grab('folder');
   S.sel='all';S.atab='latest';render();await w(900);for(let i=0;i<10;i++){try{NRMORE&&NRMORE()}catch(e){}}await w(500);grab('all');
   return o});
  const t='['+W+'] ';
  ck(t+'tiles were found (folder, source)',r.tiles.some(x=>/fm-mark/.test(x.cls)),JSON.stringify(r.tiles.slice(0,4)));
  ck(t+'every one-letter tile is nudged down ~0.05em (padding-top 0.1em)',r.tiles.length>0&&r.tiles.every(x=>Math.abs(x.pt-.1)<.012&&x.sz==='border-box'),JSON.stringify(r.tiles));
  ck(t+'tile sizes are unchanged (square, same as before)',r.tiles.filter(x=>/fm-mark/.test(x.cls)).every(x=>x.w===46&&x.h===46)&&r.tiles.filter(x=>/av/.test(x.cls)&&!/fm-mark/.test(x.cls)).every(x=>x.w===38&&x.h===38),JSON.stringify(r.tiles.map(x=>[x.cls,x.w,x.h])));
  ck(t+'no page errors',!errs.length,errs[0]);await p.close();
 }
 await b.close();console.log(bad?'tile_center '+bad+' FAILED':'tile_center all passed');process.exit(bad?1:0);
})();
