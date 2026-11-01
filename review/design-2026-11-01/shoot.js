const {chromium}=require('playwright');const P=require('./props.js');const O=__dirname+'/review/img/';const only=process.argv[2];
const states={
 daily:async(p,E)=>{await E(()=>{S.sel='today';render();document.querySelector('main').scrollTop=0})},
 dailyLines:async(p,E)=>{await E(()=>{S.sel='today';render();document.querySelector('main').scrollTop=330})},
 all:async(p,E)=>{await E(()=>{S.sel='all';render();document.querySelector('main').scrollTop=0})},
 allfail:async(p,E)=>{await E(()=>{S.sel='all';render();document.querySelector('main').scrollTop=0;[...document.querySelectorAll('#grid .card img')].slice(0,2).forEach(x=>x.src='http://localhost:8771/nope.jpg')})},
 reader:async(p,E)=>{await E(()=>{S.sel='all';render()});await p.waitForTimeout(800);await E(()=>document.querySelector('#grid .card .cl').click())},
 readerpq:async(p,E)=>{await E(()=>{S.sel='all';render()});await p.waitForTimeout(800);await E(()=>document.querySelectorAll('#grid .card .cl')[1].click())},
 settings:async(p,E)=>{await E(()=>$('#gear').click())},
 offline:async(p,E,c)=>{await c.setOffline(true);await E(()=>{S.sel='all';render();document.querySelector('main').scrollTop=0;$('#grid').innerHTML=empNoStories()})},
 drawer:async(p,E)=>{await E(()=>{S.sel='all';render();$('#menu').click()})},
};
(async()=>{const b=await chromium.launch();
for(const x of P){if(only&&!only.split(',').includes(x.id))continue;
 const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,reducedMotion:'reduce'});const p=await c.newPage();p.on('pageerror',e=>console.log(x.id,'ERR',e.message));
 await p.goto('http://localhost:8771/demo.html');await p.waitForTimeout(4500);const E=(f,a)=>p.evaluate(f,a);
 await states[x.state](p,E,c);await p.waitForTimeout(3200);
 await E(()=>document.querySelectorAll('.toast,#toast,.demo-toast').forEach(t=>t.style.display='none'));
 const clip={x:0,y:x.clip[0],width:390,height:x.clip[1]};
 await p.screenshot({path:O+x.id+'-before.jpg',type:'jpeg',quality:78,clip});
 if(x.css)await p.addStyleTag({content:x.css});if(x.js)await E(x.js);await p.waitForTimeout(700);
 await p.screenshot({path:O+x.id+'-after.jpg',type:'jpeg',quality:78,clip});
 await c.close();console.log('shot',x.id)}
await b.close()})();
