const {mock,seed,PW}=require('./mock');const {chromium}=require(PW);
let pass=0,fail=0;const log=[];const ck=(n,c,x='')=>{if(c)pass++;else{fail++;log.push(`FAIL ${n} ${x}`)}};
(async()=>{const b=await chromium.launch();
for(const [vp,w,h,touch] of [['phone',380,820,true],['desktop',1280,900,false]]){
 for(const feats of [['icon','share','media','alerts','pack','widget','back','tts'],['icon','share','media','back'],null]){
  const tag=vp+(feats?(feats.includes('tts')?'+tts':'-tts'):'-x');
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:touch,isMobile:touch&&w<500});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:6});
  await p.addInitScript(F=>{
   delete window.speechSynthesis;window.__calls=[];const rec=(n,a)=>window.__calls.push([n,a]);const L={};let live=null;
   const emit=(n,d)=>L[n]&&L[n](d);const Q=[];let gen=0;const pump=()=>{const a=Q.shift();if(!a){live=null;return}live=a;const g=gen;const words=a.text.split(' ');let off=0,i=0;setTimeout(()=>{if(live!==a||g!==gen)return;emit('ttsStart',{id:a.id});const tick=()=>{if(live!==a||g!==gen)return;if(i>=words.length){live=null;emit('ttsEnd',{id:a.id});pump();return}emit('ttsBoundary',{id:a.id,start:off,end:off+words[i].length});off+=words[i].length+1;i++;setTimeout(tick,8)};tick()},10)};
   const X=F?{features:async()=>({features:F}),notifStatus:async()=>({granted:true}),bgConfigure:async a=>rec('bg',a),getPendingShare:async()=>({}),getPendingOpen:async()=>({}),
    ttsVoices:async()=>({voices:[{id:'en-us-x-a-local',name:'English (United States) · a',lang:'en-US',local:true},{id:'fr-fr-x-b-local',name:'French · b',lang:'fr-FR',local:true}],ready:true}),
    ttsSpeak:async a=>{rec('speak',a);if(!a.add){Q.length=0;live=null;gen++}Q.push(a);if(!live)pump()},
    ttsStop:async()=>{rec('stop');Q.length=0;live=null;gen++},
    addListener:(n,f)=>{L[n]=f;return{remove(){}}}}:null;
   window.Capacitor={isNativePlatform:()=>true,Plugins:{CyNative:{info:async()=>({versionCode:5,versionName:'1',canInstall:true}),setBars:async()=>{}},...(X?{CyExtras:X}:{})}};
  },feats);
  await p.addInitScript(s=>{try{if(!localStorage.getItem('folio'))localStorage.setItem('folio',JSON.stringify(s))}catch(e){}},seed(['Alpha','Beta']));
  await p.goto('file:///mnt/user-data/outputs/cypress.html');await p.waitForTimeout(1500);
  const E=(f,a)=>p.evaluate(f,a);
  if(feats&&feats.includes('tts')){
   ck(tag+' speechSynthesis shim present',await E(()=>'speechSynthesis' in window&&typeof SpeechSynthesisUtterance==='function'));
   ck(tag+' voices loaded',await E(()=>speechSynthesis.getVoices().length===2));
   ck(tag+' not nospeech',await E(()=>!document.documentElement.classList.contains('nospeech')));
   await E(()=>{document.querySelector('#gear').click()});await p.waitForTimeout(200);
   ck(tag+' voice select filled',await E(()=>document.querySelectorAll('#voice option').length===3));
   await E(()=>document.querySelector('#set').close());
   await E(()=>{S.sel='all';render();document.querySelector('#grid a.card').click()});await p.waitForTimeout(1500);
   ck(tag+' read-aloud button exists',await E(()=>!!document.querySelector('#ra')));
   await E(()=>document.querySelector('#ra').click());await p.waitForTimeout(900);
   ck(tag+' speak called',await E(()=>window.__calls.some(c=>c[0]==='speak'&&c[1].text.length>20)));
   ck(tag+' TTS on and advancing',await E(()=>TTS.on&&TTS.wi>0),JSON.stringify(await E(()=>({on:TTS.on,wi:TTS.wi}))));
   ck(tag+' highlight',await E(()=>{try{return CSS.highlights.has('tts')}catch(e){return true}}));
   await E(()=>document.querySelector('#ra').click());await p.waitForTimeout(200);
   ck(tag+' pause calls stop',await E(()=>window.__calls.some(c=>c[0]==='stop')));
   ck(tag+' paused state',await E(()=>TTS.paused===true));
   // voice choice is passed
   await E(()=>{S.voice='fr-fr-x-b-local';save();ttsFrom(0)});await p.waitForTimeout(400);
   ck(tag+' voice passed to engine',await E(()=>window.__calls.filter(c=>c[0]==='speak').pop()[1].voice==='fr-fr-x-b-local'));
   await E(()=>ttsStop());
  }else{
   ck(tag+' shim removed / not installed',await E(()=>!('speechSynthesis' in window)));
   ck(tag+' nospeech class',await E(()=>document.documentElement.classList.contains('nospeech')));
  }
  ck(tag+' no page errors',errs.length===0,errs.join('|'));
  await ctx.close();
 }
}
await b.close();console.log(pass+' passed, '+fail+' failed');log.forEach(x=>console.log(x))})()
