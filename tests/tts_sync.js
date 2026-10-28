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
    L.ttsBoundary&&L.ttsBoundary({id:a.id,start:off,end:off+words[i].length,ts:Date.now()-450});off+=words[i].length+1;i++;setTimeout(tick,330)};tick()},10)};/* about 180 words a minute: much faster reports look like an engine that reports ahead of its voice, and the app rightly paces by the clock instead */
  const X={features:async()=>({features:['tts','ttsSleep']}),getPendingShare:async()=>({}),getPendingOpen:async()=>({}),
   ttsVoices:async()=>({voices:[{id:'v1',name:'English',lang:'en-US',local:true}],ready:true}),
   ttsSleepAt:async a=>{window.__sleepAt=a},ttsSpeak:async a=>{window.__calls.push(a);if(!a.add){Q.length=0;live=null;gen++}Q.push(a);if(!live)pump()},ttsStop:async()=>{Q.length=0;live=null;gen++},
   addListener:(n,f)=>{L[n]=f;return{remove(){}}}};
  window.Capacitor={isNativePlatform:()=>true,Plugins:{CyNative:{info:async()=>({versionCode:5,versionName:'1',canInstall:true}),setBars:async()=>{}},CyExtras:X}};
 });
 await p.addInitScript(s=>{try{if(!localStorage.getItem('folio'))localStorage.setItem('folio',JSON.stringify(s))}catch(e){}},seed(['Alpha','Beta']));
 await p.goto('file://'+APP);await p.waitForTimeout(1500);
 const E=(f,a)=>p.evaluate(f,a);
 await E(()=>{/* the app runs as native here, so feeds can't use the test's mock network: give it stories directly */S.feeds.forEach((f,fi)=>{items[f.id]=Array.from({length:4},(_,i)=>({feedId:f.id,title:'Story '+fi+' '+i+' about a topic',link:'https://'+f.title.toLowerCase()+'.test/story-'+(i+1),date:Date.now()-(i+1)*9e5,summary:'A short summary.',img:'',html:'<p>'+'The council met on Tuesday to discuss the plan for the new park and the road beside it. '.repeat(4)+'</p><h2>What comes next</h2><p>'+'Residents will vote on the design next month after a period of public comment. '.repeat(4)+'</p><p>'+'Work could start in the spring if the budget is approved by the board. '.repeat(3)+'</p>'}));state[f.id]='ok'});S.sel='all';render();document.querySelector('#grid .card[data-i]').click()});await p.waitForTimeout(1500);
 /* the test page only has the feed's text, so the app first says it couldn't load the full story; a second tap reads what's there (as a person would) */await E(()=>document.querySelector('#ra').click());await p.waitForTimeout(300);await E(()=>{if(!TTS.on)document.querySelector('#ra').click()});await p.waitForTimeout(2500);
 const calls=await E(()=>window.__calls.map(c=>({add:c.add,pause:c.pause,n:c.text.length})));
 ck('speech started',calls.length>0);
 ck('first chunk has no pause',calls[0]&&!calls[0].pause);
 ck('some later chunk asks for a pause at a section break',calls.slice(1).some(c=>c.pause>0),JSON.stringify(calls.slice(0,8)));
 ck('pauses are sane (<=2s)',calls.every(c=>(c.pause||0)<=2000));
 const lag=await E(()=>TTS.lag);
 ck('engine delay measured from timestamps',lag>380&&lag<700,String(lag));
 ck('highlight word advances',await E(()=>TTS.wi>3));
 /* B85: pause then resume carries on from the word the voice was on, not the (earlier) highlighted word */
 const rs=await E(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));ttsStop();ttsCollect();ttsFrom(0);await w(1500);const sp=TTS.sp,wi=TTS.wi;ttsPause();const n0=window.__calls.length;ttsToggle();await w(300);const c=window.__calls[n0];return {sp,wi,first:c&&c.text.split(' ')[0],want:TTS.words[sp]&&TTS.words[sp].t}});
 ck('the highlight is ahead of the voice (word '+rs.wi+' vs '+rs.sp+')',rs.wi>rs.sp,JSON.stringify(rs));
 ck('resume starts at the word the voice was on, skipping nothing',rs.first===rs.want,JSON.stringify(rs));
 /* B86: the sleep time goes to the phone, both with new speech and on its own */
 const sl=await E(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));ttsStop();setSleep('15');await w(100);const own=window.__sleepAt;ttsCollect();ttsFrom(0);await w(400);const c=window.__calls[window.__calls.length-1];const r={own:own&&own.stopAt,sent:c&&c.stopAt,at:SLEEP.at};setSleep('0');await w(100);r.cleared=window.__sleepAt&&window.__sleepAt.stopAt;ttsStop();return r});
 ck('setting the timer tells the phone the stop time',sl.own&&Math.abs(sl.own-sl.at)<2000,JSON.stringify(sl));
 ck('speech started with a timer carries the stop time',sl.sent&&Math.abs(sl.sent-sl.at)<2000,JSON.stringify(sl));
 ck('turning the timer off clears it on the phone',sl.cleared===0,JSON.stringify(sl));
 await E(()=>window.__ttsSleep());
 ck('when the phone reports the sleep stop the page stops too',await E(()=>!TTS.on||TTS.paused));
 /* B87: a voice marked as "reports early" is forgotten after two weeks and can be reset by hand */
 const vt=await E(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));ttsStop();const vv=bestVoice();const key=(vv&&vv.voiceURI)||'default';
  S.tnbv=key;S.tnbt=Date.now()-20*864e5;TTS.nb=1;ttsCollect();ttsFrom(0);await w(200);const old={nb:TTS.nb,kept:!!S.tnbv};ttsStop();
  S.tnbv=key;S.tnbt=Date.now();TTS.nb=0;ttsCollect();ttsFrom(0);await w(200);const fresh={nb:TTS.nb,kept:!!S.tnbv};ttsStop();
  document.getElementById('vtreset')&&document.getElementById('vtreset').click();const reset={has:!!document.getElementById('vtreset'),cleared:!S.tnbv&&TTS.nb===0};return {old,fresh,reset}});
 ck('a voice mark older than two weeks is forgotten',vt.old.nb===0&&!vt.old.kept,JSON.stringify(vt));
 ck('a recent mark is kept',vt.fresh.nb===1&&vt.fresh.kept,JSON.stringify(vt));
 ck('Settings has a Reset button that clears it',vt.reset.has&&vt.reset.cleared,JSON.stringify(vt));
 await E(()=>ttsStop());
 console.log(`${pass} passed, ${fail} failed`);log.forEach(l=>console.log(l));await b.close();process.exit(fail?1:0)})();
