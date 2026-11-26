/* A height-only resize is not a change of shape (David, 2026-11-26: scrolling up as fast as possible made the screen
   resize until the scrolling stopped). Android animates its system bar during a fast fling, which fires a run of resize
   events with the width unchanged. shapeChanged used to run the full reshape on every one of them - covFit, coverCrop,
   tabIndAll, transition writes and a FORCED synchronous layout of the whole document - and that is what was visible.
   This fires the burst and reads the app's own shape log: no full reshape while the height is moving, exactly one once
   it settles, and a width change (fold/unfold) still reshapes on the spot. fold_stale and unfold_cost only ever change
   the width, so nothing else covers this. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x===undefined?'':x)}else console.log('ok',n,x===undefined?'':x)};
const BURST=[915,899,883,867,851,867,883,899,915,899,883,867];/* the bar sliding up, down and up again */
(async()=>{const b=await chromium.launch();
 const p=await b.newPage({viewport:{width:412,height:915}});
 await mock(p);await p.goto('file://'+APP);await p.waitForTimeout(2200);
 const count=()=>p.evaluate(()=>({shape:SHPL.filter(x=>/ shape /.test(x)).length,height:SHPL.filter(x=>/ height /.test(x)).length}));
 ck('the app keeps a shape log',await p.evaluate(()=>Array.isArray(SHPL)));
 await p.evaluate(()=>{SHPL.length=0});
 for(const h of BURST){await p.setViewportSize({width:412,height:h});await p.waitForTimeout(30)}
 const mid=await count();
 ck('no full reshape while the height is still moving',mid.shape===0,JSON.stringify(mid));
 ck('the height-only changes were seen',mid.height>=6,JSON.stringify(mid));
 await p.waitForTimeout(700);
 const after=await count();
 ck('exactly one full reshape once the height settles',after.shape===1,JSON.stringify(after));
 await p.evaluate(()=>{SHPL.length=0});
 await p.setViewportSize({width:884,height:1104});await p.waitForTimeout(200);
 const w=await count();
 ck('a width change still reshapes on the spot',w.shape>=1,JSON.stringify(w));
 /* A Fold mid-fold reports a window that is not on this screen (David's SM-F976U1: window 859 wide, screen 412 wide).
    Laying that out drew the edition at 45% size on the folded screen. A window is never wider than its screen. */
 await p.evaluate(()=>{Object.defineProperty(window.screen,'width',{get:()=>412,configurable:true});SHPL.length=0});
 await p.setViewportSize({width:760,height:1040});await p.waitForTimeout(300);
 const st=await p.evaluate(()=>({shape:SHPL.filter(x=>/ shape /.test(x)).length,stale:SHPL.filter(x=>/ stale /.test(x)).length}));
 ck('a window wider than the screen is never laid out',st.shape===0&&st.stale>0,JSON.stringify(st));
 /* and it must not freeze there: once the retries run out the page takes the size rather than keeping the old one */
 await p.waitForTimeout(900);
 const gv=await p.evaluate(()=>SHPL.filter(x=>/ shape /.test(x)).length);
 ck('it gives up rather than freezing in the old shape',gv>=1,String(gv));
 await b.close();console.log('shape_burst',bad?bad+' FAILED':'all passed');process.exit(bad?1:0)})();
