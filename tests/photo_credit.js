/* a photo credit ("Fadfebrian/Getty Images") is never the first line of the story */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;
(async()=>{const b=await chromium.launch();const p=await b.newPage();await mock(p);await p.goto('file://'+APP);await p.waitForTimeout(1000);
const P='<p>'+'It’s easy to lose yourself in the morass of technical terminologies when shopping for internet providers. '.repeat(8)+'</p>';
const variants={
 span:'<div class="c"><span>Fadfebrian/Getty Images</span></div>'+P,
 fig:'<figure><img src="https://x.test/a.jpg"><figcaption>Fadfebrian/Getty Images</figcaption></figure>'+P,
 nested:'<div><div><p><small>Fadfebrian/Getty Images</small></p></div>'+P+'</div>',
 inline:'<p><span class="credit">Fadfebrian/Getty Images</span></p>'+P,
 sametext:'<p>Fadfebrian/Getty Images</p>'+P,
 pipe:'<p>AFP | Getty Images</p>'+P,
 brp:'<p>Fadfebrian/Getty Images<br>'+'It’s easy to lose yourself in the morass of technical terminologies when shopping for internet providers. '.repeat(8)+'</p>'};
for(const [k,v] of Object.entries(variants)){
 const h='<html><head><title>T</title></head><body><article><h1>Mbps vs MB/s</h1>'+v+P+P+'</article></body></html>';
 const r=await p.evaluate(h=>{const n=tidy(extract(h,'https://www.engadget.com/a/b'));return n?n.textContent.trim().slice(0,60):null},h);if(!r||/Getty/.test(r)||!/^Mbps vs MB\/sIt/.test(r)){bad++;console.log('FAIL',k,r)}else console.log('ok',k)}
await b.close();console.log('photo_credit',bad?bad+' FAILED':'all passed');process.exit(bad?1:0)})();
