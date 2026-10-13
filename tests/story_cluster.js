/* "The story so far" (B59): stories that only share generic wording ("best and worst", "bringing back") are never bundled; the same event still is. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{console.log((ok?'ok ':'FAIL ')+n+(ok?'':' '+(x||'')));if(!ok)bad++};
(async()=>{const b=await chromium.launch();const p=await (await b.newContext()).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{n:4});await p.goto('file://'+APP);await p.waitForTimeout(1200);
const r=await p.evaluate(()=>{const f=S.feeds[0],g=S.feeds[1],h=S.feeds[2],now=Date.now(),H=36e5;
 const mk=(fd,t,title,d)=>({feedId:fd.id,title,link:'https://'+fd.id+'.test/'+t,date:now-d*H,summary:'x',img:''});
 const A=mk(f,'a','Android is the best and worst thing about Googlebooks',1),B=mk(g,'b','The Best—And Worst—States for Teachers in 2026',20);
 const C=mk(f,'c','Why the US is bringing back firing squads',1),D=mk(g,'d','Bringing Our Kids Back to Just Schools',20),E=mk(h,'e','The studio behind Star Wars Zero Company is bringing back some of its furloughed staff',30);
 const F=mk(f,'f','Trump weighs joining the fight against Houthis after Riyadh airport attack',1),G=mk(g,'g','Houthis attack Riyadh airport as Trump weighs joining the fight',30),I=mk(h,'h','Riyadh airport attack: what we know about the Houthi strike',40);
 items[f.id]=[A,C,F];items[g.id]=[B,D,G];items[h.id]=[E,I];
 return {a:storyTimeline(A).length,c:storyTimeline(C).length,f:storyTimeline(F).length}});
ck('"best and worst" does not bundle a teachers story with a Googlebooks story',r.a===0,JSON.stringify(r));
ck('"bringing back" does not bundle firing squads with schools and a game studio',r.c===0,JSON.stringify(r));
ck('the same event from three outlets still bundles',r.f===3,JSON.stringify(r));
ck('no page errors',!errs.length,errs[0]);await b.close();console.log(bad?'story_cluster '+bad+' FAILED':'story_cluster all passed');process.exit(bad?1:0)})();
