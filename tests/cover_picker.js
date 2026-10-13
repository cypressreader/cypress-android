/* Cover picker (B56): every style takes a real tap, the choice shows (checked state), and only one style is checked. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{console.log((ok?'ok ':'FAIL ')+n+(ok?'':' '+(x||'')));if(!ok)bad++};
(async()=>{const b=await chromium.launch();
 for(const [W,H] of [[412,860],[1100,800]]){
  const p=await (await b.newContext({viewport:{width:W,height:H}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{n:10});
  await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(400);
  await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());document.getElementById('cvbtn').click()});await p.waitForTimeout(500);
  const keys=await p.evaluate(()=>[...document.querySelectorAll('#cvg [data-cvk]')].map(x=>x.dataset.cvk));
  ck(`[${W}] the picker lists every style`,keys.length>=25,keys.length);
  const fails=[];
  for(const k of keys){
   await p.evaluate(k=>{const el=document.querySelector(`#cvg [data-cvk="${k}"]`);el.scrollIntoView({block:'center'})},k);await p.waitForTimeout(60);
   const bx=await p.evaluate(k=>{const r=document.querySelector(`#cvg [data-cvk="${k}"]`).getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+Math.min(r.height/2,60)}},k);
   await p.mouse.click(bx.x,bx.y);await p.waitForTimeout(120);
   const r=await p.evaluate(k=>({cvs:S.cvs,on:[...document.querySelectorAll('#cvg [aria-pressed="true"]')].map(x=>x.dataset.cvk),open:document.getElementById('cvpk').open}),k);
   if(r.cvs!==k||r.on.length!==1||r.on[0]!==k)fails.push(k+JSON.stringify(r));
   if(!r.open){await p.evaluate(()=>document.getElementById('cvbtn').click());await p.waitForTimeout(300)}
  }
  ck(`[${W}] every style takes a tap and shows as the only checked one`,!fails.length,fails.slice(0,4).join(' | '));
  ck(`[${W}] no page errors`,!errs.length,errs[0]);await p.close()}
 await b.close();console.log(bad?'cover_picker '+bad+' FAILED':'cover_picker all passed');process.exit(bad?1:0)
})();
