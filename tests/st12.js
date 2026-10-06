const {APP}=require('./env');
const {mock,seed,PW}=require('./mock');const {chromium}=require(PW);
let pass=0,fail=0;const log=[];const ck=(n,c,x='')=>{if(c)pass++;else{fail++;log.push(`FAIL ${n} ${x}`)}};
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:1280,height:900}})).newPage();
await mock(p,{n:6});await p.goto('file://'+APP);await p.waitForTimeout(1500);
const R=await p.evaluate(async()=>{
 const mk=(n,old,txt)=>Array.from({length:n},(_,i)=>({title:'Story '+i,link:'https://x.test/'+i,date:Date.now()-(old?400*864e5:3600e3*i),html:txt||'short'}));
 const frag=h=>{const d=document.createElement('div');d.innerHTML=h;const f=document.createDocumentFragment();while(d.firstChild)f.append(d.firstChild);return f};
 const long='<p>'+'A real paragraph of reporting with many words in it. '.repeat(20)+'</p>';
 const linkList='<p><a href="https://a.test">First great article</a> <a href="https://b.test">Second great article</a></p>'.repeat(8);
 const out={};const orig=window.getFull;
 window.getFull=async()=>frag(long);out.good=(await feedIssues(mk(6,false))).map(i=>i.k);
 window.getFull=async()=>frag(linkList);out.links=(await feedIssues(mk(6,false))).map(i=>i.k);
 window.getFull=async()=>frag('<p>Advertise here with Carbon Ads. Socials &amp; More. This site is made possible by member support. '+'x '.repeat(80)+'</p>');out.junk=(await feedIssues(mk(6,false))).map(i=>i.k);
 window.getFull=async()=>null;out.unread=(await feedIssues(mk(6,false))).map(i=>i.k);
 window.getFull=async()=>frag('<p>A line.</p>');out.thin=(await feedIssues(mk(6,false))).map(i=>i.k);
 window.getFull=async()=>frag(long);out.stale=(await feedIssues(mk(6,true))).map(i=>i.k);
 window.getFull=async()=>{throw new Error('x')};out.err=(await feedIssues(mk(6,false))).map(i=>i.k);
 window.getFull=async()=>null;out.richFeed=(await feedIssues(mk(6,false,'<p>'+'Full text in the feed itself. '.repeat(80)+'</p>'))).map(i=>i.k);
 window.getFull=orig;return out});
ck('normal site: no warning',R.good.length===0,JSON.stringify(R.good));
ck('list of links is flagged',R.links.includes('links'));
ck('footer page is flagged',R.junk.includes('junk'));
ck('unreadable articles flagged',R.unread.includes('unread'));
ck('very short posts flagged',R.thin.includes('thin'));
ck('stale site flagged',R.stale.includes('stale'));
ck('a failing check never warns',R.err.length===0,JSON.stringify(R.err));
ck('feed with full text in the feed is not tested against the page',R.richFeed.length===0,JSON.stringify(R.richFeed));
// flow: stub the check, press Add on a catalogue row, cancel -> nothing added; add anyway -> added
const flow=async(answer)=>{
 await p.evaluate(()=>{window.__orig=window.feedIssues;window.feedIssues=async()=>[{k:'links'}]});
 const before=await p.evaluate(()=>S.feeds.length);
 await p.evaluate(()=>{const u='https://zeta.test/feed';addVerified(u,'Zeta','Tech',null)});
 await p.waitForSelector('#ask',{timeout:8000});
 const txt=await p.evaluate(()=>document.querySelector('#ask').textContent);
 await p.click(answer==='ok'?'#ask [data-a="1"]':'#ask [data-a="0"]');
 await p.waitForTimeout(800);
 const after=await p.evaluate(()=>S.feeds.length);
 await p.evaluate(()=>{window.feedIssues=window.__orig});return {before,after,txt}};
const c=await flow('cancel');ck('warning shown with the reason',/lists of links/.test(c.txt)&&/Add anyway/.test(c.txt),c.txt);ck('cancel adds nothing',c.after===c.before,JSON.stringify(c));
const a=await flow('ok');ck('add anyway adds the feed',a.after===a.before+1,JSON.stringify(a));
const off=await p.evaluate(async()=>{S.fcheck=false;window.feedIssues=async()=>[{k:'links'}];const r=await preCheck('https://eta.test/feed','Eta','<rss><channel><title>x</title></channel></rss>');S.fcheck=true;return r});
ck('setting off skips the check',off==='ok');
console.log(pass+' passed, '+fail+' failed');log.forEach(l=>console.log(l));await b.close()})()
