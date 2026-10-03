const {chromium}=require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();p.on('pageerror',e=>console.log('PE',e.message));p.on('console',m=>console.log('C',m.text()));
const h='p'+Buffer.from(JSON.stringify({t:'<img src=x onerror=alert(1)>',s:'x',l:'javascript:alert(1)',i:'http://a/b.png',c:'red;background:url(x)'})).toString('base64url');
await p.goto('file:///home/claude/cypress-android/docs/s.html#'+h);await p.waitForTimeout(500);
console.log(await p.evaluate(()=>document.querySelector('#story').innerHTML.slice(0,300)));
const h2='p'+Buffer.from(JSON.stringify({t:'<img src=x onerror=alert(1)>',s:'x',l:'https://ok.test/a',c:'red;background:url(x)'})).toString('base64url');
await p.goto('file:///home/claude/cypress-android/docs/s.html#'+h2);await p.waitForTimeout(500);
console.log(await p.evaluate(()=>({h1:document.querySelector('h1').textContent,imgs:document.querySelectorAll('#story img').length,col:getComputedStyle(document.documentElement).getPropertyValue('--b'),inj:!!document.querySelector('#story [onerror]')})));
await b.close()})();
