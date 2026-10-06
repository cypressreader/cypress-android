const {APP}=require('./env');
const {mock,seed,PW}=require('./mock');const {chromium}=require(PW);
let pass=0,fail=0;const log=[];const ck=(n,c,x='')=>{if(c)pass++;else{fail++;log.push(`FAIL ${n} ${x}`)}};
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:1280,height:900}})).newPage();
await mock(p,{n:3});await p.goto('file://'+APP);await p.waitForTimeout(1500);
const r=await p.evaluate(()=>({
 foot:footerish('Advertise here with Carbon Ads Socials & More This site is made possible by member support. Big thanks to Arcustech. When you buy through links on kottke.org, I may earn an affiliate commission.'),
 real:footerish('The Senate voted on Tuesday to approve the measure after a long debate about funding, with several members arguing that the privacy policy of the agency needed review.'),
 one:footerish('Read our privacy policy. A short note about the story.'),
 twins:noTwins([{title:'Brazil has moved to the right progressively over two decades'},{title:'Brazil has moved to the right progressively over two decades'},{title:'Short'},{title:'Short'}]).length,
 imgBad:(()=>{const f=finishList([{title:'A story title that is long enough',link:'https://a.test/1',img:'javascript:alert(1)'}]);return f[0].img})(),
 promo:(()=>{const d=document.createElement('div');d.innerHTML='<p>'+'Real paragraph text. '.repeat(20)+'</p><p>Enjoy the read? Subscribe to get the best of Noema.</p><p>'+'More real text. '.repeat(20)+'</p>';const o=tidyFrag(d);const w=document.createElement('div');w.append(o);return w.textContent})()
}));
ck('footer page detected',r.foot===true);ck('real article not flagged',r.real===false);ck('one footer phrase is not enough',r.one===false);
ck('same headline from one site shown once (short ones kept)',r.twins===3,String(r.twins));
ck('script address dropped from picture',r.imgBad==='');
ck('subscribe pitch removed from article',!/Subscribe to get the best/.test(r.promo)&&/Real paragraph/.test(r.promo)&&/More real text/.test(r.promo));
console.log(pass+' passed, '+fail+' failed');log.forEach(l=>console.log(l));await b.close()})()
