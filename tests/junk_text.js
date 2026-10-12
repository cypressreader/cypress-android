/* Item 4: privacy-choice legalese, news-tip furniture, live-blog time stamps and "Up next" never appear inside the story; real paragraphs (including ones about privacy law) stay */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x===undefined?'':x)}else console.log('ok',n)};
const P=k=>'<p>Oil prices fell sharply on Monday after the announcement, analysts said, and traders in London and New York reacted '+k+' as the deal with the supplier moved forward under pressure.</p>';
(async()=>{const b=await chromium.launch();const p=await b.newPage();await mock(p);await p.goto('file://'+APP);await p.waitForTimeout(1000);
 const body=P(1)+P(2)+P(3)+P(4)+'<ul><li>News Tips</li></ul><p>Got a confidential news tip? We want to hear from you.</p>'+P(5)+
  '<p>Notice of Right to Opt-Out of Sale/Sharing and Targeted Advertising</p><p>Residents (or authorized agents) of states listed in the “Your Rights” section may opt out of targeted advertising by moving the toggle to the left.</p><ul><li>Allow Sale of My Personal Info and Sharing/Processing for Targeted Ads</li></ul><p>Please Contact Us</p><ul><li>Ad Choices</li><li>CA Notice</li></ul>';
 const live=P(1)+'<p>25m ago</p><p>15.45 EDT</p>'+P(2)+'<div>UP NEXT</div>'+P(3)+P(4)+P(5);
 const priv='<p>The new privacy law lets residents opt out of targeted advertising, and the toggle regulators demanded must be honoured by every site.</p>'.repeat(1)+P(1)+P(2)+P(3);
 const r=await p.evaluate(([a,l,v])=>{const f=h=>{const n=tidy(extract('<html><body><article><h1>T</h1>'+h+'</article></body></html>','https://www.cnbc.com/a/b'));return n?n.textContent:''};return{cn:f(a),lv:f(l),pv:f(v)}},[body,live,priv]);
 ck('CNBC-style notice text is gone',!/Opt-Out|Allow Sale|News Tip|Ad Choices|CA Notice|Contact Us/.test(r.cn),r.cn.slice(-300));
 ck('the real paragraphs of that story stay',(r.cn.match(/Oil prices fell/g)||[]).length===5,String((r.cn.match(/Oil prices fell/g)||[]).length));
 ck('live-blog stamps and Up next are gone',!/25m ago|15\.45 EDT|UP NEXT/i.test(r.lv),r.lv.slice(0,400));
 ck('a story about privacy law keeps its sentence',/opt out of targeted advertising/.test(r.pv),r.pv.slice(0,200));
 const pw=await p.evaluate(()=>pdfWa('Hitchcock’s and… '+pdfWa('Hitchcock’s and…')));
 ck('a running head converted twice keeps apostrophe and ellipsis',!/\?/.test(pw),pw);
 ck('a cookie-consent sentence is never used as a story summary',await p.evaluate(()=>dekOf({summary:'store and/or access information on a device, personalised advertising and content, ad and content measurement',link:'x'})===''));
 await b.close();console.log('junk_text',bad?bad+' FAILED':'all passed');process.exit(bad?1:0)})();
