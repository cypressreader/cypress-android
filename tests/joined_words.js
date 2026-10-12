/* B60: two words are never welded together where a link, a hidden label, a button or an icon stood between them ("company" + "said") */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
(async()=>{const b=await chromium.launch();const p=await b.newPage();await mock(p);await p.goto('file://'+APP);await p.waitForTimeout(1000);
const T='The quick brown fox jumps over the lazy dog while the market moved on Monday, and analysts said the outlook was mixed for the sector overall this year.';
const V={
 linkspace:['<p>The <a href="https://x.test/a">company</a> said it will cut jobs. '+T+'</p>','company said'],
 adjacent:['<p>The <a href="https://x.test/a">company</a><a href="https://x.test/b">said</a> it will cut jobs. '+T+'</p>','company said'],
 linktext:['<p>The <a href="https://x.test/a">company</a>said it will cut jobs. '+T+'</p>','company said'],
 strongtext:['<p>Shares of <strong>Tesla</strong>will fall, it said. '+T+'</p>','Tesla will'],
 comment:['<p>The <a href="https://x.test/a">company</a><!-- -->said it will cut jobs. '+T+'</p>','company said'],
 srsib:['<p>The <a href="https://x.test/a">company</a><span class="sr-only">opens in a new tab</span>said it will cut jobs. '+T+'</p>','company said'],
 imgb:['<p>The company<img src="https://x.test/i.png" width="20" height="20">said it will cut jobs. '+T+'</p>','company said'],
 btn:['<p>The company<button>Follow</button>said it will cut jobs. '+T+'</p>','company said'],
 dropcap:['<p><span class="dropcap">T</span>he company said it will cut jobs. '+T+'</p>','The company'],
 halfword:['<p>The <a href="https://x.test/a">un</a>happy company said it will cut jobs. '+T+'</p>','unhappy company'],
 apos:['<p>The <a href="https://x.test/a">company</a>’s plan said it will cut jobs. '+T+'</p>','company’s plan'],
};
let bad=0;
for(const [k,[v,want]] of Object.entries(V)){const h='<html><body><article><h1>T</h1>'+v+'<p>'+T+'</p><p>'+T+'</p></article></body></html>';
 const r=await p.evaluate(h=>{const n=tidy(extract(h,'https://x.test/a/b'));const f=fromHTML(h,'https://x.test/a/b');const t=x=>x?x.textContent.replace(/\s+/g,' '):'';return [t(n),t(f)]},h);
 const ok=r.every(x=>x.includes(want));if(!ok){bad++;console.log('FAIL',k,JSON.stringify(r.map(x=>x.slice(0,60))))}else console.log('ok',k)}
await b.close();console.log('joined_words',bad?bad+' FAILED':'all passed');process.exit(bad?1:0)})();
