/* B24/B25: highlight delay is measured from the engine's timestamps; breaths between sections are requested */
const {APP}=require('./env');const {mock,seed,PW}=require('./mock');const {chromium}=require(PW);
let pass=0,fail=0;const log=[];const ck=(n,c,x='')=>{if(c)pass++;else{fail++;log.push(`FAIL ${n} ${x}`)}};
(async()=>{const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:380,height:820},hasTouch:true,isMobile:true});const p=await ctx.newPage();
 await mock(p,{n:6});
 await p.addInitScript(()=>{
  delete window.speechSynthesis;window.__calls=[];const L={};let live=null,gen=0;const Q=[];
  const pump=()=>{const a=Q.shift();if(!a){live=null;return}live=a;const g=gen,words=a.text.split(' ');let off=0,i=0;
   setTimeout(()=>{if(live!==a||g!==gen)return;L.ttsStart&&L.ttsStart({id:a.id});const tick=()=>{if(live!==a||g!==gen)return;if(i>=words.length){live=null;L.ttsEnd&&L.ttsEnd({id:a.id});pump();return}
    L.ttsBoundary&&L.ttsBoundary({id:a.id,start:off,end:off+words[i].length,ts:Date.now()-450});off+=words[i].length+1;i++;setTimeout(tick,60)};tick()},10)};
  const X={features:async()=>({features:['tts']}),getPendingShare:async()=>({}),getPendingOpen:async()=>({}),
   ttsVoices:async()=>({voices:[{id:'v1',name:'English',lang:'en-US',local:true}],ready:true}),
   ttsSpeak:async a=>{window.__calls.push(a);if(!a.add){Q.length=0;live=null;gen++}Q.push(a);if(!live)pump()},ttsStop:async()=>{Q.length=0;live=null;gen++},
   addListener:(n,f)=>{L[n]=f;return{remove(){}}}};
  window.Capacitor={isNativePlatform:()=>true,Plugins:{CyNative:{info:async()=>({versionCode:5,versionName:'1',canInstall:true}),setBars:async()=>{}},CyExtras:X}};
 });
 await p.addInitScript(s=>{try{if(!localStorage.getItem('folio'))localStorage.setItem('folio',JSON.stringify(s))}catch(e){}},seed(['Alpha','Beta']));
 await p.goto('file://'+APP);await p.waitForTimeout(1500);
 const E=(f,a)=>p.evaluate(f,a);
 await E(()=>{S.sel='all';render();document.querySelector('#grid .card[data-i]').click()});await p.waitForTimeout(1500);
 await E(()=>document.querySelector('#ra').click());await p.waitForTimeout(2500);
 const calls=await E(()=>window.__calls.map(c=>({add:c.add,pause:c.pause,n:c.text.length})));
 ck('speech started',calls.length>0);
 ck('first chunk has no pause',calls[0]&&!calls[0].pause);
 ck('some later chunk asks for a pause at a section break',calls.slice(1).some(c=>c.pause>0),JSON.stringify(calls.slice(0,8)));
 ck('pauses are sane (<=2s)',calls.every(c=>(c.pause||0)<=2000));
 const lag=await E(()=>TTS.lag);
 ck('engine delay measured from timestamps',lag>380&&lag<700,String(lag));
 ck('highlight word advances',await E(()=>TTS.wi>3));
 await E(()=>ttsStop());
 console.log(`${pass} passed, ${fail} failed`);log.forEach(l=>console.log(l));await b.close();process.exit(fail?1:0)})();
