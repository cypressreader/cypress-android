/* B22 follow-up: a feed running on Google News / Bing stand-ins keeps only its own site's stories, also from the saved copy read at start (so "Earlier on, 10 from Lifestyle" holds none of another site's hard news) */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x===undefined?'':x)}else console.log('ok',n)};
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:412,height:860}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await mock(p,{n:4});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});
 await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const f=S.feeds[0];f.url='https://lifestyle.test/feed';f.via='gnews';const now=Date.now();
  const mk=(t,l,x)=>({feedId:f.id,title:t,link:l,date:now-6e4,summary:'s',img:'',html:'',...x});
  items[f.id]=[mk('Own story one on the site','https://lifestyle.test/a/1',{gn:1,os:1}),mk('Pope Leo XIV to undergo lung surgery this week','https://www.vatican-news.example/pope',{gn:1}),mk('Hurricane Simon nears Mexico with 155 mph winds','https://news.google.com/rss/articles/CBMiabc',{gn:1}),mk('Own older saved story from the site','https://www.lifestyle.test/a/2',{gn:1}),mk('A story from the real feed','https://lifestyle.test/a/3',{})];
  state[f.id]='ok';save();saveCache0()});
 await p.route(/^https?:\/\/(?!localhost)/,r=>r.abort());await p.goto('file://'+APP);await p.waitForTimeout(1800);
 const t=await p.evaluate(()=>(items[S.feeds[0].id]||[]).map(a=>a.title));
 ck('own-site stories stay',t.includes('Own story one on the site')&&t.includes('Own older saved story from the site')&&t.includes('A story from the real feed'),JSON.stringify(t));
 ck('another site\'s hard news is dropped',!t.some(x=>/Pope Leo/.test(x)),JSON.stringify(t));
 ck('a stand-in story whose site cannot be told is dropped',!t.some(x=>/Hurricane/.test(x)),JSON.stringify(t));
 ck('no page errors',!errs.length,errs[0]);
 await b.close();console.log('stand_in_saved',bad?bad+' FAILED':'all passed');process.exit(bad?1:0)})();
