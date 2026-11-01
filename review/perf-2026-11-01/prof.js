const {chromium}=require('playwright');(async()=>{const b=await chromium.launch({args:['--disable-web-security']});const ctx=await b.newContext({viewport:{width:412,height:900},isMobile:true,hasTouch:true});
await ctx.addInitScript(()=>{window.Capacitor={isNativePlatform:()=>true,getPlatform:()=>'android',isPluginAvailable:()=>false,Plugins:{}}});
const p=await ctx.newPage();const c=await ctx.newCDPSession(p);
await c.send('Profiler.enable');await c.send('Profiler.setSamplingInterval',{interval:200});
const prof=async fn=>{await c.send('Profiler.start');await fn();const {profile}=await c.send('Profiler.stop');const dt={};const tot={};
 const byId=new Map(profile.nodes.map(n=>[n.id,n]));const cnt={};profile.samples.forEach(s=>cnt[s]=(cnt[s]||0)+1);
 const per=(profile.endTime-profile.startTime)/profile.samples.length/1000;
 for(const n of profile.nodes){const k=(n.callFrame.functionName||'(anon)')+(n.callFrame.url.includes('8772')?'':' ['+(n.callFrame.url||'native').split('/').pop().slice(0,20)+']');dt[k]=(dt[k]||0)+(cnt[n.id]||0)*per}
 return Object.entries(dt).sort((a,b)=>b[1]-a[1]).slice(0,22).map(([k,v])=>Math.round(v)+'ms '+k).join('\n')};
await p.goto('http://localhost:8772/index.html');await p.waitForSelector('text=Get started');await p.click('text=Get started');await p.waitForTimeout(3000);
await p.evaluate(async()=>{await addPack(0);await addPack(1)});await p.waitForTimeout(2000);
console.log('== refresh 12 sites (fast CPU; x6 for budget phone)');console.log(await prof(()=>p.evaluate(async()=>{await Promise.all(S.feeds.map(f=>load(f,true)));await new Promise(r=>setTimeout(r,1600))})));
console.log('== launch with saved stories');const p2=await ctx.newPage();const c2=await ctx.newCDPSession(p2);await c2.send('Profiler.enable');await c2.send('Profiler.setSamplingInterval',{interval:200});await c2.send('Profiler.start');await p2.goto('http://localhost:8772/index.html');await p2.waitForTimeout(2500);
const {profile}=await c2.send('Profiler.stop');const cnt={};profile.samples.forEach(s=>cnt[s]=(cnt[s]||0)+1);const per=(profile.endTime-profile.startTime)/profile.samples.length/1000;const dt={};for(const n of profile.nodes){const k=(n.callFrame.functionName||'(anon)')+(n.callFrame.url.includes('8772')?'':' ['+(n.callFrame.url||'native').split('/').pop().slice(0,20)+']');dt[k]=(dt[k]||0)+(cnt[n.id]||0)*per}
console.log(Object.entries(dt).filter(([k])=>!/idle/.test(k)).sort((a,b)=>b[1]-a[1]).slice(0,18).map(([k,v])=>Math.round(v)+'ms '+k).join('\n'));await b.close()})();
