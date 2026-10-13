/* Feed search (B46): a big index, other names (CTV, NYT, WaPo), topics ("home decor" finds feeds about it), typo and abbreviation tolerance, "did you mean", and no junk matches. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{console.log((ok?'ok ':'FAIL ')+n+(ok?'':' '+(x||'')));if(!ok)bad++};
/* [query, names that must appear within the first N results, N] */
const WANT=[
 ['ctv',['CTV News'],1],['ctv news',['CTV News'],1],['global news',['Global News'],1],['cbc',['CBC News'],1],['globe and mail',['The Globe and Mail'],1],['toronto star',['Toronto Star'],1],
 ['nyt',['The New York Times'],1],['new york times',['The New York Times'],1],['wapo',['The Washington Post'],1],['washington post',['The Washington Post'],4],['wsj',['The Wall Street Journal'],1],['ft',['Financial Times'],1],['hn',['Hacker News'],1],['la times',['Los Angeles Times'],1],
 ['gurdian',['The Guardian World'],4],['techcrnch',['TechCrunch'],1],['arstechnica',['Ars Technica'],1],['nasa',['NASA'],2],['bloomberg',['Bloomberg Markets'],3],['npr',['NPR'],1],
 ['home decor',['Apartment Therapy','Dezeen','Design Milk'],8],['home decorating',['Apartment Therapy'],8],['interior design',['Dezeen'],8],['gardening',['Gardeners\' World'],6],['gardning',['Gardeners\' World'],6],
 ['crypto',['CoinDesk'],4],['bitcoin',['CoinDesk'],4],['knitting',['Knitting Daily'],4],['woodworking',['Popular Woodworking'],4],['woodwork',['Popular Woodworking'],4],['sleep',['Sleep Review'],4],['personal development',['James Clear'],5],
 ['recipies',['Serious Eats'],8],['mortage',['The Mortgage Reports'],3],['coffee',['Perfect Daily Grind'],4],['sourdough',['The Perfect Loaf'],3],['dogs',['Whole Dog Journal'],3],['cats',['Cat Behavior Associates'],3],
 ['kdrama',['Soompi'],3],['kpop',['Soompi'],3],['f1',['BBC Formula 1'],3],['hockey',['The Hockey News'],4],['stock market',['MarketWatch'],4],['startups',['Crunchbase News'],5],['machine learning',['Machine Learning Mastery'],5],['3d printing',['3DPrint.com'],4],['privacy',['Electronic Frontier Foundation'],8],
 ['ukraine',['Kyiv Independent'],4],['israel',['Haaretz'],4],['climate',['Grist'],4],['space',['Space.com'],4],['chess',['Chess.com News'],3],['poetry',['The Paris Review'],3],['typography',['Typewolf'],3],['law',['SCOTUSblog'],3],['teaching',['EdSurge'],5],['birding',['Audubon'],3]
];
/* matches that would be junk */
const NOT=[['camping',/gaming|game/i],['math',/matt\b/i],['rust',/just one|cookbook/i],['cats',/serious eats|\bsports\b/i],['pets',/hacker news|bbc news/i],['hockey',/hacker/i],['xbox',/fox news|\bvox\b|bon app/i],['nyt',/skinnytaste/i],['linux',/tv line/i],['hiking',/baking/i]];
(async()=>{
 const b=await chromium.launch();const p=await (await b.newContext()).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{n:3});await p.goto('file://'+APP);await p.waitForTimeout(1000);
 const r=await p.evaluate(({WANT,NOT})=>{
  const ix=fidx();const o={n:ix.length,topics:Object.keys(TOPICS).length,miss:[],junk:[],dym:{}};
  for(const [q,want,n] of WANT){const got=catSearch(q).slice(0,n).map(x=>x.n);if(!want.every(w=>got.includes(w)))o.miss.push(q+' → '+got.join('; ')+' (wanted '+want.join(', ')+' in the first '+n+')')}
  for(const [q,rx] of NOT){const got=catSearch(q).map(x=>x.n);if(got.some(g=>rx.test(g)))o.junk.push(q+' → '+got.join('; '))}
  for(const q of ['phsyics','gardenin','guardain','zzzqx','astronmy','ctvv'])o.dym[q]={res:catSearch(q).length,dym:didYouMean(q)};
  const names=new Set(ix.map(x=>x.nm));o.dangling=[];for(const [k,vs] of Object.entries(TOPICS))for(const v of vs)if(!names.has(foldQ(v)))o.dangling.push(k+':'+v);
  const urls=ix.map(x=>x.u.toLowerCase().replace(/^https?:\/\/(www\.)?/,'').replace(/\/+$/,''));o.dupNames=ix.map(x=>x.nm).filter((n,i,a)=>a.indexOf(n)!==i&&ix[i].c===ix[a.indexOf(n)].c);
  o.http=ix.filter(x=>!/^https?:\/\//.test(x.u)).length;
  return o},{WANT,NOT});
 ck('the index is big: 700 or more feeds and 300 or more topics',r.n>=700&&r.topics>=300,r.n+' feeds, '+r.topics+' topics');
 ck('searches find what people type: names, other names, typos, topics ('+WANT.length+' queries)',!r.miss.length,r.miss.join(' | '));
 ck('no junk matches (a short word is not found inside other words)',!r.junk.length,r.junk.join(' | '));
 ck('a typo still finds the right thing (a swapped or missing letter)',r.dym.phsyics.res>0&&r.dym.guardain.res>0&&r.dym.astronmy.res>0&&r.dym.gardenin.res>0,JSON.stringify(r.dym));
 ck('"did you mean": a miss offers the closest name',/CTV News/.test(r.dym.ctvv.dym.join())&&r.dym.ctvv.res===0,JSON.stringify(r.dym.ctvv));
 ck('nothing similar offers nothing (no wild guesses)',r.dym.zzzqx.res===0&&r.dym.zzzqx.dym.length===0,JSON.stringify(r.dym.zzzqx));
 ck('every feed named in a topic really exists in the list',!r.dangling.length,r.dangling.join(', '));
 ck('no feed is listed twice in one folder',!r.dupNames.length,r.dupNames.join(', '));
 /* the dialog: typing shows results, a miss shows suggestions and the manual way */
 const ui=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());document.getElementById('add').click();await new Promise(r=>setTimeout(r,300));const u=document.getElementById('u'),out={};
  u.value='home decor';u.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(r=>setTimeout(r,500));out.topic=[...document.querySelectorAll('#pop .pf')].map(x=>x.textContent).slice(0,8).join(' | ');
  u.value='ctvv';u.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(r=>setTimeout(r,1200));out.miss=document.getElementById('pop').textContent;
  return out});
 ck('typing a topic lists feeds about it, and says why',/Apartment Therapy|Dezeen|Design Milk/.test(ui.topic),ui.topic.slice(0,300));
 ck('a miss never leaves a dead end: it offers "Did you mean" and the manual way',/Did you mean/.test(ui.miss)&&/CTV News/.test(ui.miss)&&/add it (manually|yourself)/i.test(ui.miss),ui.miss.slice(0,300));
 /* B90 (checked, no change needed): v=1 marks the extended catalogue, which is verified live at the moment it is added; v=0 is the hand-checked starter list. With the same match the hand-checked feed ranks first. The audit's proposed flip (if(r.v)sc+=1) would put the extended ones first and breaks 'arstechnica', 'gurdian' and 'home decor' */
 {const o=await p.evaluate(()=>{fidx();const mk=(n,u,v)=>({c:'Test',cn:'test',n,u,v,nm:foldQ(n),nw:foldQ(n).split(' '),nmc:foldQ(n).replace(/ /g,''),al:[],hs:'tt',tp:[],tw:new Set()});
   FIDX.push(mk('Zqxv Gazette','https://a.test/extended',1),mk('Zqxv Gazette Daily','https://b.test/handchecked',0));const r=catSearch('zqxv').map(x=>x.u);return r});
  ck('a hand-checked starter feed ranks above an extended-catalogue feed with the same match',o.indexOf('https://b.test/handchecked')>=0&&o.indexOf('https://a.test/extended')>=0&&o.indexOf('https://b.test/handchecked')<o.indexOf('https://a.test/extended'),JSON.stringify(o))}
 ck('no page errors',!errs.length,errs[0]);await b.close();console.log(bad?'feed_search '+bad+' FAILED':'feed_search all passed');process.exit(bad?1:0)})();
