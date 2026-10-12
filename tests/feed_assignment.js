/* Stories belong to the feed they came from. When an offline site is covered by a Google News / Bing headline search, only that site's own stories are kept (an empty answer leaves the feed offline instead of filling it with strangers), and a folder view only shows its own feeds' stories. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x===undefined?'':x)}else console.log('ok',n)};
(async()=>{
 const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:412,height:860}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(400);
 const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const o={};
  const gn=items=>'<?xml version="1.0"?><rss version="2.0"><channel><title>q</title>'+items.map((i,k)=>'<item><title>'+i.t+' - '+i.s+'</title><link>https://news.google.com/rss/articles/CBMi'+k+i.t.length+'</link><pubDate>Mon, 12 Oct 2026 08:0'+k+':00 GMT</pubDate><source url="'+i.u+'">'+i.s+'</source></item>').join('')+'</channel></rss>';
  const bing=items=>'<?xml version="1.0"?><rss version="2.0" xmlns:News="https://www.bing.com/news/search?q=x"><channel><title>b</title>'+items.map((i,k)=>'<item><title>'+i.t+'</title><link>'+i.u+'</link><description>d</description><pubDate>Mon, 12 Oct 2026 08:0'+k+':00 GMT</pubDate><News:Source>'+i.s+'</News:Source></item>').join('')+'</channel></rss>';
  const mixed=[{t:'Five calm habits for a slower morning',s:'Zen Habits',u:'https://zenhabits.net'},{t:'Trump weighs joining the fight against Houthis',s:'CNN',u:'https://www.cnn.com'},{t:'Christa Pike back in prison',s:'AP',u:'https://apnews.com'},{t:'How to simplify your inbox',s:'Zen Habits',u:'https://zenhabits.net'}];
  const f={id:'zh',title:'Zen Habits',url:'https://zenhabits.net/feed/',folder:''};
  const of=window.fetchText;
  window.fetchText=async(u,ok)=>/news\.google\.com/.test(u)?gn(mixed):bing(mixed.map(m=>({...m,u:m.u+'/story/'+m.t.length})));
  try{const l=await gnewsFeed(f,'zenhabits.net','test');o.gn=l.map(a=>a.title)}catch(e){o.gn='threw '+e.message}
  try{const l=await bingFeed0(f,'test','zenhabits.net');o.bing=l.map(a=>a.title)}catch(e){o.bing='threw '+e.message}
  const strangers=mixed.filter(m=>m.s!=='Zen Habits');
  window.fetchText=async(u,ok)=>/news\.google\.com/.test(u)?gn(strangers):bing(strangers);
  try{await gnewsFeed(f,'zenhabits.net','test');o.gnNone='kept strangers'}catch(e){o.gnNone='threw'}
  try{await bingFeed0(f,'test','zenhabits.net');o.bingNone='kept strangers'}catch(e){o.bingNone='threw'}
  window.fetchText=of;
  o.onsite=[onSite('www.bbc.co.uk','bbc.com'),onSite('edition.cnn.com','cnn.com'),onSite('apnews.com','zenhabits.net'),onSite('news.google.com','zenhabits.net')];
  return o});
 ck('Google News fallback keeps only the feed\'s own stories',Array.isArray(r.gn)&&r.gn.length===2&&r.gn.every(t=>/habits|inbox/i.test(t)),JSON.stringify(r.gn));
 ck('Bing fallback keeps only the feed\'s own stories',Array.isArray(r.bing)&&r.bing.length===2&&r.bing.every(t=>/habits|inbox/i.test(t)),JSON.stringify(r.bing));
 ck('a fallback that finds only other sites\' stories leaves the feed empty (offline), not full of strangers',r.gnNone==='threw'&&r.bingNone==='threw',JSON.stringify([r.gnNone,r.bingNone]));
 ck('site matching: subdomains and the BBC\'s two domains match, other sites do not',r.onsite[0]&&r.onsite[1]&&!r.onsite[2]&&!r.onsite[3],JSON.stringify(r.onsite));
 /* a folder view only shows its own feeds' stories */
 const f2=await p.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));const now=Date.now();
  const uw=n=>{let x=(n+3)*7919,o='';for(let k=0;k<6;k++){o+=String.fromCharCode(97+x%26);x=Math.floor(x/26)+k*5+1}return o};
  S.folders=[{id:'life',name:'Lifestyle'},{id:'news',name:'News'}];S.feeds=[];const mkf=(id,t,fo)=>{S.feeds.push({id,title:t,url:'https://'+id+'.test/feed',folder:fo});state[id]='ok';items[id]=[]};
  ['lk','lh','am','zh'].forEach(i=>mkf(i,'Life '+i,'life'));['n1','n2','n3','n4'].forEach(i=>mkf(i,'News '+i,'news'));
  let k=0;const add=(fid,t,min)=>items[fid].push({feedId:fid,title:t,link:'https://'+fid+'.test/'+(k++),date:now-min*6e4,summary:'A standfirst.',img:'',html:'<p>'+'Body. '.repeat(60)+'</p>'});
  for(const fid of ['lk','lh','am','zh'])for(let i=0;i<8;i++)add(fid,uw(k*4+1)+' '+uw(k*4+2)+' '+uw(k*4+3)+' garden habits',30+i*70);
  for(const fid of ['n1','n2','n3','n4'])for(let i=0;i<8;i++)add(fid,uw(k*4+1)+' '+uw(k*4+2)+' '+uw(k*4+3)+' election vote',20+i*60);
  S.seen={};S.sel='f:life';S.scroll='page';render();await w(1200);for(let i=0;i<40;i++)NRMORE&&NRMORE();await w(500);
  const lf=new Set(['lk','lh','am','zh']);return {n:cur.length,foreign:cur.filter(a=>!lf.has(a.feedId)).length,shown:document.querySelectorAll('#grid [data-i]').length}});
 ck('Lifestyle folder view lists only Lifestyle feeds\' stories',f2.n>=20&&f2.foreign===0&&f2.shown>=20,JSON.stringify(f2));
 ck('no page errors',!errs.length,errs[0]);
 await b.close();console.log('feed_assignment',bad?bad+' FAILED':'all passed');process.exit(bad?1:0);
})();
