const {chromium}=require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright');
(async()=>{const b=await chromium.launch();
for(const [nm,w,h,rnd] of [['tree-phone',390,844,0.1],['circuit-phone',390,844,0.9],['tree-desk',1100,800,0.1],['ios-circuit',390,844,0.9]]){
 const c=await b.newContext({viewport:{width:w,height:h},userAgent:nm.startsWith('ios')?'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Mobile/15E148 Safari/604.1':undefined});const p=await c.newPage();
 await p.addInitScript(r=>{Math.random=()=>r},rnd);
 await p.route(/fonts\./,r=>r.abort());
 await p.goto('http://localhost:8765/index.html');await p.waitForTimeout(700);
 const m=await p.evaluate(()=>{const e=document.getElementById('mark');const r=e.getBoundingClientRect();return {lg:e.dataset.lg,w:r.width,h:r.height,m:getComputedStyle(e).maskImage||getComputedStyle(e).webkitMaskImage,sw:document.documentElement.scrollWidth,iw:innerWidth}});
 console.log(nm,JSON.stringify(m));await p.screenshot({path:'/tmp/t/site-'+nm+'.png'});await c.close()}
await b.close()})();
