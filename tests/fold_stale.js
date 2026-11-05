/* Fold unfold with a stale innerWidth (WebView quirk): which classes are on in the first painted frames? */
const T='./';const {mockRich,seedRich,PW}=require(T+'mock3');const {chromium}=require(PW);
const APP=process.argv[2]||require('./env').APP;
(async()=>{const b=await chromium.launch();
for(const sm of ['portrait','off']){
const ctx=await b.newContext({viewport:{width:412,height:900}});const p=await ctx.newPage();
await mockRich(p,{n:40});
await p.addInitScript(([s,sm])=>{localStorage.setItem('folio',JSON.stringify({...s,intro:false,theme:'light',sideh:sm,splitm:'land'}));
 const d=Object.getOwnPropertyDescriptor(window,'innerWidth');Object.defineProperty(window,'innerWidth',{configurable:true,get(){return window.__sw||d.get.call(window)}});
 const h=Object.getOwnPropertyDescriptor(window,'innerHeight');Object.defineProperty(window,'innerHeight',{configurable:true,get(){return window.__sh||h.get.call(window)}})},[seedRich(),sm]);
await p.goto('file://'+APP);await p.waitForTimeout(2200);
await p.evaluate(()=>{[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Got it')?.click();window.__r=0;const r=window.render;window.render=function(){window.__r++;return r.apply(this,arguments)};window.__sw=412;window.__sh=900;setTimeout(()=>{window.__sw=0;window.__sh=0},400)});
await p.setViewportSize({width:840,height:880});
const cls=()=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>r(['narrow','split','sidehide'].filter(c=>document.body.classList.contains(c)).join(',')+' nrp='+document.getElementById('grid').classList.contains('nrp')))));
const f1=await cls();await p.waitForTimeout(1600);const f2=await cls();
console.log(sm,'first frame:',f1,'| settled:',f2,'| renders',await p.evaluate(()=>window.__r));await ctx.close()}
await b.close()})();
