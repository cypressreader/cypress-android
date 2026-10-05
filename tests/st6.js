const {APP,OUT}=require('./env');
const {mock,seed,PW}=require('./mock');const {chromium}=require(PW);
let pass=0,fail=0;const log=[];const ck=(n,c,x='')=>{if(c)pass++;else{fail++;log.push(`FAIL ${n} ${x}`)}};
(async()=>{const b=await chromium.launch();
for(const [vp,w,h,touch] of [['phone',380,820,true],['desktop',1280,900,false]]){
 for(const feats of [['icon','share','media','alerts','pack','widget','back'],null]){
 const tag=vp+(feats?'+x':'-x');
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:touch,isMobile:touch&&w<500});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await mock(p,{n:6});
 await p.addInitScript(F=>{
  window.__calls=[];const rec=(n,a)=>window.__calls.push([n,a]);const L={};
  const X=F?{features:async()=>({features:F}),setAppIcon:async a=>{rec('icon',a);return a},getAppIcon:async()=>({icon:'tree'}),
   getPendingShare:async()=>window.__pend||{},getPendingOpen:async()=>({}),notifStatus:async()=>({granted:true}),notifPermission:async()=>({granted:true}),
   mediaStart:async a=>rec('mstart',a),mediaUpdate:async a=>rec('mupd',a),mediaStop:async()=>rec('mstop'),
   bgConfigure:async a=>rec('bg',a),bgItems:async()=>({items:[]}),packGet:async()=>({date:'x',items:[{feedId:'zz',feedTitle:'Src',title:'Pack story one',link:'https://a.test/p1'}]}),bgRunNow:async()=>({}),alertsTest:async()=>rec('atest'),widgetUpdate:async a=>rec('widget',a),
   addListener:(n,f)=>{L[n]=f;return{remove(){}}}}:null;
  window.__emit=(n,d)=>L[n]&&L[n](d);
  window.Capacitor={isNativePlatform:()=>true,Plugins:{CyNative:{info:async()=>({versionCode:5,versionName:'1',canInstall:true}),setBars:async()=>{},shareFile:async()=>{},shareText:async()=>{}},...(X?{CyExtras:X}:{})}};
 },feats);
 await p.addInitScript(s=>{try{if(!localStorage.getItem('folio'))localStorage.setItem('folio',JSON.stringify(s))}catch(e){}},seed(['Alpha','Beta']));
 await p.goto(('file://'+APP));await p.waitForTimeout(1800);
 const E=(f,a)=>p.evaluate(f,a);const calls=n=>E(n=>window.__calls.filter(c=>c[0]===n).map(c=>c[1]),n);
 if(!feats){
  ck(tag+' no extras section',await E(()=>!document.querySelector('#s-notif')));
  ck(tag+' logo tap still works',await E(()=>{$('#logo').click();return true}));
 }else{
  ck(tag+' features detected',await E(()=>nFeat('alerts')&&nFeat('icon')));
  ck(tag+' notifications section',await E(()=>!!document.querySelector('#s-notif')));
  ck(tag+' bgConfigure sent',(await calls('bg')).length>=1);
  // alerts toggle
  await E(()=>{document.querySelector('#gear').click()});await p.waitForTimeout(200);
  await E(()=>{S.alk=['alpha'];document.querySelector('[data-tg=alerts]').click()});await p.waitForTimeout(300);
  const bgs=await calls('bg');const last=bgs[bgs.length-1];
  ck(tag+' alerts enabled in config',last&&last.alerts.enabled===true&&last.alerts.keywords[0]==='alpha',JSON.stringify(last&&last.alerts));
  ck(tag+' feeds sent',last&&last.feeds.length>=2);
  await E(()=>document.querySelector('#set').close());
  // per-feed alert
  await E(()=>{S.feeds[0].alert=true;alertsSync()});await p.waitForTimeout(100);
  const l2=(await calls('bg')).pop();ck(tag+' per-feed alert ids',Array.isArray(l2.alerts.feedIds)&&l2.alerts.feedIds.length===1);
  // icon switch
  const b0=await E(()=>S.logo||'tree');await E(()=>$('#logo').click());await p.waitForTimeout(700);
  const ic=await calls('icon');ck(tag+' logo tap leaves drawer icon alone',ic.length===0,JSON.stringify(ic)+b0);
  // share
  await E(()=>window.__emit('sharedContent',{text:'Look https://newsite.test/blog/',title:'T'}));await p.waitForTimeout(150);
  ck(tag+' share dialog',await E(()=>document.querySelector('#shr').open&&/newsite\.test/.test(document.querySelector('#shu').textContent)));
  await E(()=>document.querySelector('#shs').click());
  ck(tag+' share saved',await E(()=>S.saved.some(x=>x.link==='https://newsite.test/blog/')));
  await E(()=>{S.sel='saved';render()});await p.waitForTimeout(200);
  ck(tag+' saved renders shared link',await E(()=>/newsite|blog/i.test(document.querySelector('#grid').textContent)));
  await E(()=>{S.sel='today';render()});
  // pack
  await E(()=>window.__emit('notificationOpen',{url:'cypress:pack'}));await p.waitForTimeout(300);
  ck(tag+' pack dialog',await E(()=>document.querySelector('#pkd').open&&/Pack story one/.test(document.querySelector('#pkl').textContent)));
  await E(()=>document.querySelector('#pkx').click());
  // media
  await E(()=>{S.sel='today';render()});
  const ok=await E(()=>{try{curA=Object.values(items).flat()[0];ttsStop();return true}catch(e){return false}});
  ck(tag+' media stop hook',(await calls('mstop')).length>=1);
  await E(()=>window.__emit('mediaAction',{action:'stop'}));
  // widget
  await E(()=>{S.widget=true;widgetPush()});await p.waitForTimeout(100);
  ck(tag+' widget push',(await calls('widget')).length>=1||await E(()=>document.querySelectorAll('#grid a.card').length===0));
 }
 ck(tag+' no page errors',errs.length===0,errs.join('|'));
 await ctx.close();}}
await b.close();log.forEach(l=>console.log(l));console.log('pass',pass,'fail',fail)})();
