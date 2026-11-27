/* World Edition, the front of pass 0: pick the day's candidate stories FROM THE FEEDS.
 *
 * Until now the pipeline's candidates were the stories already written into `world-edition.json` - a list a
 * person had chosen by hand. This picks them the way the edition's own method page says they are picked:
 *
 *   "The finished edition will be picked by counting. Headlines about the same event are grouped, and a story
 *    is big when many separate outlets report it. The cover story is the one reported by the most outlets.
 *    Nobody hand-picks it."
 *
 * So: read the feeds, group the headlines, count the outlets behind each group, and fill each section's fixed
 * number of places from its own desk, best first. No model, no judgement about what a story is worth beyond
 * how many newsrooms thought it mattered.
 *
 * IT DOES NOT REIMPLEMENT THE READER. The feeds are parsed by the app's own `parse()` and grouped by the app's
 * own `group()`, inside the running app - the same code, and the same clustering, as The Daily on the phone.
 * The feed addresses come from the app's own catalogue (`CAT`), so there is no second list to keep in step.
 *
 * What comes out is a candidate list, not an edition: every story still has to be read and gated
 * (`gather.js`) before it can be printed, and a story that cannot be read is dropped there.
 *
 *   node scripts/edition/pick.js                      # print what today's edition would be made of
 *   node scripts/edition/pick.js --wide               # also read the swept publishers whose pictures load
 *   node scripts/edition/pick.js --json cand.json     # write the candidates for gather.js
 *   node scripts/edition/pick.js --hours 48           # how far back a story may be (default 36)
 */
const fs=require('fs'),https=require('https'),{openApp}=require('./app');

const arg=n=>{const i=process.argv.indexOf(n);return i>0?process.argv[i+1]:null};
const WIDE=process.argv.includes('--wide');/* read the swept publishers too - see the note in the catalogue read below */
const OUT=arg('--json'),HOURS=Number(arg('--hours')||36);

/* THE DESK. Ten sections, fixed order, fixed number of places (the method page: "each with a fixed number of
   places ... A section may run short but never borrows"). Each section lists the outlets whose feeds it reads,
   by the name they carry in the app's catalogue - the addresses stay in the app, which is where they are kept
   up to date. Home is the US desk and World the foreign one, which is the only reason they are split: they
   read the same kind of feed. */
/* THE DESK. The sections, in the order they are printed, each with its fixed number of places. A desk reads
   whole categories of the app's own catalogue (735 feeds, kept up to date in the app) rather than a list of
   outlet names kept here - that is what "drastically more outlets" means in practice, and it costs nothing:
   feeds are free to read and only the stories that reach the edition are opened.
   A desk may also be a KIND of story rather than a place in the world: `find` matches the headline, and those
   desks read everything, because an obituary or an explainer can come from any newsroom. (David's second
   sheet: good news, explainers, obituaries, criticism and the archive are his yeses that code can find; the
   numbers page, in pictures and the same-story-two-ways need the model pass and are not here yet.) */
/* The kinds a news desk refuses. Sport reaches every general feed and reads like news; a fixture list, a
   transfer, a fantasy column or a score is sport wherever it was published. Written once and used by the
   desks that are places rather than kinds. */
/* NOT A STORY, ON ANY DESK (David, 2026-11-27: "that one story isn't even a story. How did that get passed
   out reviewer?"). The honest answer was that nothing reviews the TEXT - the eye that looks at an edition
   looks only at pictures. The desks test which KIND of story a headline is, never whether it is one.
   These are the shapes that are published on a news feed and are not news: a post talking to the readers, a
   list of discount codes, a weekly links roundup, a giveaway, a horoscope. They are refused everywhere,
   before any desk sees them, because none of them belongs in any section. Kept narrow on purpose: every
   pattern here is a shape of PUBLISHING, not a subject, so it cannot silently drop a real story about sales,
   gifts or newsletters. */
const NOT_A_STORY=/^(how|what|where|when|who)\s+(was|were|is|are|did|do)\s+your\b|^(open thread|weekend (reading|links|open))|\b\d{1,2}%\s*off\b|\b(discount|promo|coupon)\s*codes?\b|\bbest deals\b|\bdeals? of the (day|week)\b|\b(gift|shopping)\s+guide\b|\bwhat (we|i)( a|'?)re (reading|buying|loving|watching this week)\b|\blinks? (we|i) love\b|\bgiveaway\b|\bhoroscopes?\b|\bsubscribe to our\b|\bthis week'?s newsletter\b|\b(wordle|quordle|heardle|nerdle|strands|sudoku|crosswords?|connections|spelling bee|nyt mini)\b[^|]{0,40}\b(hints?|answers?|clues?|solutions?)\b|\bpuzzle\s*#\s*\d+|\bearnings call transcript\b|\b(q[1-4]|full[- ]year) \d{4} (results|earnings) call\b/i;
const SPORTY=/\b(nfl|nba|mlb|nhl|ncaa|fifa|uefa|premier league|la liga|serie a|f1|formula 1|grand prix|super bowl|world cup|playoffs?|quarterfinals?|semifinals?|touchdown|home run|fantasy football|week \d+|game \d+|\bvs\.?\b|steelers|packers|lakers|yankees|dodgers|man utd|manchester (united|city)|arsenal|liverpool|chelsea|wildcats|australian open|us open|french open|atp|wta|test match|six nations|strikers?|midfielders?|goalkeepers?|wingers?|quarterbacks?|wide receivers?|point guards?|transfer window|signs? a new contract|signs new contract|on loan to|caps for|matchday|kick-?off|full-?time|half-?time|depth charts?|recruiting class|bowl game|mock drafts?)\b/i;
/* WHAT COUNTS AS SPORT IN A MAGAZINE (David, 2026-11-26): "it should only be major events. Someone won the
   world cup, world series, super bowl, Wimbledon etc. A random team winning a random game doesn't matter for
   99% of readers. Now a sport related major story like Kobe Bryant dying or Messi retiring does matter
   because that's a major story affecting all of sports."
   So the Sport desk takes two kinds and nothing else: something was WON - a final, a championship, a medal, a
   record - or a career ended, was banned or was sold for a record. Everything else, which is most of what a
   sports feed publishes, is a result nobody outside the fixture cares about a day later.
   A death goes to the Obituary page instead, which is where a magazine prints one. */
const SPORT_WON=/\b(world cup|super bowl|world series|wimbledon|olympics?|paralympics?|the ashes|tour de france|ryder cup|stanley cup|nba finals|world championships?|world record|gold medal|grand slam|ballon d'or|copa (am[\u00e9e]rica|libertadores)|champions league|europa league|euro 20\d\d)\b/i;
const SPORT_FINAL=/\b(wins?|won|beat|crowned|clinch(es|ed)?|lifts?|claims?|seals?)\b[^.]{0,40}\b(title|final|championship|crown|cup|gold|medal|record)\b|\b(final|semi-?final|championship|title) (win|victory|triumph|decider)\b/i;
const SPORT_CAREER=/\b(retires?|retirement|announces? (his|her|their) retirement|hangs up|sacked as (manager|coach|head coach)|steps down as (manager|coach|captain)|banned for|doping ban|life(time)? ban|hall of fame|record (transfer|signing|deal)|world record)\b/i;
/* and what a sports feed is mostly made of, which a magazine never prints */
const SPORT_NOISE=/\bfantasy\b|start '?em|sit '?em|\bodds\b|\bbetting\b|\bpicks?\b|\brankings?\b|\bpower rankings\b|\binjury report\b|\bweek \d+\b|\bpreview\b|\bhow to watch\b|\bhighlights\b|\brecap\b|\btrade rumou?rs?\b|\bmock draft\b/i;

const DESK=[
 {name:'Home',not:SPORTY,n:6,cats:['News','Politics'],home:1,
  outlets:['NPR','PBS NewsHour','NBC News','CBS News','AP News','Axios','The Hill','CNN','Fox News','Semafor','ProPublica','NPR Politics','The Hill Politics','Roll Call','Politico','The Intercept','FiveThirtyEight']},
 {name:'World',not:SPORTY,n:6,
  outlets:['BBC World','The Guardian World','Al Jazeera','Deutsche Welle','Reuters','BBC News','Global News','The Guardian','Foreign Policy','Foreign Affairs','BBC Politics','France 24','The Japan Times','CNA','Africanews','MercoPress']},
 {name:'Business',not:SPORTY,n:4,cats:['Business','Money']},
 {name:'Science & Health',n:4,cats:['Science','Health','Space','Environment']},
 {name:'Tech',n:4,cats:['Tech','Mobile','AI & Security','Developers']},
 {name:'Culture',not:SPORTY,n:4,cats:['Culture','Entertainment','Design','Music','Film & TV','Books']},
 {name:'Review',n:2,cats:['Books','Film & TV','Music','Design','Culture'],
  find:/\breview\b|\bverdict\b|\breviewed\b|\u2605/i},
 {name:'Explainer',not:SPORTY,n:2,any:1,
  find:/\bexplainer\b|\bexplained\b|what to know|\bwhy (is|are|do|does|did|has|have)\b|\bhow (does|do|did|to)\b/i},
 {name:'Sport',n:3,cats:['Sports'],
  find:new RegExp(SPORT_WON.source+'|'+SPORT_FINAL.source+'|'+SPORT_CAREER.source,'i'),
  /* a death is an obituary, not a result, so it is left for that page */
  /* and a piece ABOUT a retirement - a reaction, a rumour, a question - is not a career ending: "Kevin Durant
     Reacts to ... Making NBA History Retirement Question" reached Sport on 26 November */
  not:new RegExp(SPORT_NOISE.source+'|\\b(dies|died|dead at)\\b|\\b(reacts?|rumou?rs?|speculation|question|talks about|hints?)\\b','i')},
/* THE FOOD DESK HAD NO TEST THAT A HEADLINE WAS ABOUT FOOD (David, 2026-11-27, from the phone: "that one
   story isn't even a story"). It took the whole Lifestyle category - 82 outlets - and printed whatever came
   first. On the 27th that was a Ladbible piece about the last episode of Chicken Shop Date, which reached a
   food section because its feed is filed under Lifestyle, and a Cup of Jo post asking readers how their
   Thanksgiving went, ending in a numbered list of discount codes. Neither is a story and nothing was
   checking. Lifestyle stays as the pool, because that is where food writing lives, but a headline now has to
   be ABOUT food or drink to be printed as food. The desk running short on a thin day is the correct
   outcome - the method page already tells a reader a quiet section means a quiet day. */
 {name:'Food',n:3,cats:['Food','Lifestyle'],
  find:/\b(recipes?|cook(s|ed|ing|book)?|bake[drs]?|baking|roast(ed|ing)?|grill(ed|ing)?|kitchen|chefs?|restaurants?|diner|menus?|dish(es)?|meals?|dinner|lunch|breakfast|brunch|supper|foods?|eat(s|en|ing)?|flavou?rs?|ingredients?|pantry|wines?|beers?|cocktails?|whisk(e)?y|coffee|teas?|bread|pasta|pizza|cheese|dessert|cakes?|sauces?|spice[sd]?|michelin|tast(e|es|ing)|feast|butcher|bakery|farmers'? market|grocer(y|ies)|dining|appetite|leftovers?)\b/i,
  not:SPORTY},
 {name:'From the archive',not:SPORTY,n:1,cats:['History'],
  find:/\bon this day\b|years ago\b|\bin 1[89]\d\d\b|\bhistory of\b|\bthe forgotten\b|\bwhen .* (was|were)\b/i},
 {name:'Obituary',n:1,any:1,first:1,
  find:/\b(dies|died|dead) at \d{2}\b|\bobituary\b|\b(19|20)\d\d\s*[\u2013\u2014-]\s*20\d\d\b/i},
 {name:'Long read',not:SPORTY,n:3,cats:['Knowledge'],
  outlets:['Longreads','Aeon','Knowable Magazine','Wait But Why','Farnam Street','Quanta Magazine','Granta','JSTOR Daily','Nautilus','The Atlantic']},
 {name:'Back page',n:2,cats:['Good news']},
];

/* TWO EDITIONS. The format has always had them and only the US one has been written, so an international
   reader has been getting the US magazine. They cost nothing extra: the feeds are read once, the headlines
   grouped once, and each edition then picks from the same groups with its own desk. Both may carry the same
   story - two editions of a magazine do - so a story is spent within an edition, not across them.
   The international desk is the US one with Home replaced: an international reader opens on the world. */
const INTL=[{name:'Around the world',n:6,
  outlets:['BBC World','The Guardian World','Al Jazeera','Deutsche Welle','Reuters','BBC News','Global News','The Guardian','France 24','The Japan Times','Euronews','Foreign Policy','Foreign Affairs','BBC Politics']},
 ...DESK.filter(d=>d.name!=='Home')];
const EDITIONS=[
 {id:'us',name:'US Edition',regions:['US'],fallback:true,desk:DESK},
 {id:'int',name:'International Edition',
  regions:['GB','IE','AU','NZ','CA','ZA','IN','SG','DE','FR','NL','BE','SE','NO','DK','FI','ES','IT','PT','PL','JP','KR','BR','MX','AR','CL','AE','NG','KE','PH'],
  desk:INTL},
];

/* One feed, fetched through the open browser rather than by hand in Node. Reason, measured: a request with our
   own user agent was refused by 19 of 73 outlets (BBC, NPR, The Guardian, Ars Technica, Wired and more all
   answered 403); the browser's own request carries the headers a feed reader is expected to send and they
   answer it. Playwright follows the redirects and the timeout for us, so this is also less code. */
const one=async(ctx,url,headers)=>{
 try{const r=await ctx.request.get(url,{timeout:25000,maxRedirects:4,headers});
  if(!r.ok())return{err:'HTTP '+r.status()};
  const b=await r.body();if(b.length>4e6)return{err:'too big'};
  const xml=b.toString('utf8');
  return /<(rss|feed|rdf:RDF)[\s>]/i.test(xml.slice(0,2000))?{xml}:{err:'not a feed'};
 }catch(e){return{err:String(e&&e.message||e).split('\n')[0].slice(0,60)}}
};
/* THE RELAY. A third of the desks' feeds refuse a request from a data centre outright - BBC, The Guardian, Ars
   Technica, Wired, ESPN all answer 403 however politely we ask, and that is what left World with one story and
   Science & Health with none. The app has had the answer to this all along: when a site's own feed is no good
   it reads that site through Google News instead (`gnewsFor`), which is how CNN and Reuters are already in the
   catalogue. Google answers a data centre perfectly happily. Tried only when the direct request fails.
   What it costs: a Google News item carries no picture and its link points at Google, so a story that reaches
   the edition this way has its real address looked up afterwards (`resolve` below) and its picture comes from
   the article itself. The reading service was tried first and is not usable: r.jina.ai now answers 401 without
   a paid key. */
const gnews=(site)=>'https://news.google.com/rss/search?q='+encodeURIComponent('site:'+site+' when:2d')+'&hl=en-US&gl=US&ceid=US:en';
const get=async(ctx,url,site)=>{
 const d=await one(ctx,url);
 if(d.xml)return d;
 if(!site)return d;
 const r=await one(ctx,gnews(site));
 return r.xml?{xml:r.xml,via:site}:{err:d.err+' (and through Google News: '+r.err+')'};
};
/* A Google News link is a redirect. Only the stories that actually made the edition are looked up - a page
   visit each, about a second and a half - and one that does not land on the outlet's own site is dropped,
   because the search can answer with another publisher's version of the story. */
async function resolve(tab,app,g){
 if(!/news\.google\.com/.test(g.link))return true;
 try{
  await tab.goto(g.link,{waitUntil:'domcontentloaded',timeout:20000});
  await tab.waitForTimeout(1200);
  const u=tab.url();
  if(/news\.google\.com/.test(u))return false;
  if(!await app.evaluate(([h,s])=>onSite(h,s),[new URL(u).hostname,g.site||'']))return false;
  g.link=u;return true;
 }catch(e){return false}
}

/* Google News hands back "Headline - BBC", and a relayed story would otherwise print Google's addition as if
   the publisher had written it. The edition prints the publisher's own words, so the masthead it appended is
   taken off again - only when it is the trailing one, and only when it names the outlet the story came from. */
const ownWords=(t,outlet)=>{
 t=String(t||'').trim();
 const o=String(outlet||'').trim().toLowerCase();
 if(!o)return t;
 const same=x=>{x=x.trim().toLowerCase().replace(/^the\s+/,'');const b=o.replace(/^the\s+/,'');
  return !!x&&x.length<=24&&(x===b||b.startsWith(x)||x.startsWith(b))};
 /* only the trailing one, only when it names the outlet the story came from, and at most a couple of times
    (Google sometimes appends it twice) */
 for(let i=0;i<3;i++){
  const m=/^(.*\S)\s[-\u2013\u2014]\s([^-\u2013\u2014]{1,24})$/.exec(t);
  if(!m||!same(m[2]))break;
  t=m[1].trim();
 }
 return t;
};
const pool=async(list,n,fn)=>{const out=[];let i=0;await Promise.all(Array.from({length:n},async()=>{while(i<list.length){const k=i++;out[k]=await fn(list[k])}}));return out};

(async()=>{
 const app=await openApp();
 const page=app.page;

 /* the app's own catalogue is the list of feeds: name -> address */
 /* the app's own catalogue, by category and by outlet name */
 const cat=await page.evaluate(wide=>{const m={},byCat={};
  for(const c of CAT){byCat[c.n]=c.f.map(f=>f[0]);for(const f of c.f)m[f[0]]=f[1]}
  /* --wide: also read MJ's swept publishers (CATW in the app), and only the ones whose PICTURES were verified
     to load. Two reasons, both about the edition's own weaknesses: more outlets make the counting that decides
     the front page better, and a page goes bare when no photograph passes, so an outlet whose pictures work is
     worth more to this pipeline than one whose pictures do not. They are search-only in the app and stay out of
     the browsable catalogue; this reads the list directly rather than putting them in CAT. */
  if(wide&&typeof CATW==='string')for(const l of CATW.split('\n')){const p=l.split('|');
   if(p.length<4||p[3]!=='1'||m[p[0]])continue;
   m[p[0]]=p[1];(byCat[p[2]]=byCat[p[2]]||[]).push(p[0])}
  return{m,byCat}},WIDE);
 const inCat=n=>cat.byCat[n]||[];
 /* every outlet any desk reads: the categories it takes whole, plus the ones it names */
 const DESKS=EDITIONS.flatMap(e=>e.desk);
 const want=[...new Set(DESKS.flatMap(d=>[...(d.cats||[]).flatMap(inCat),...(d.outlets||[])]))];
 const missing=[...new Set(DESKS.flatMap(d=>d.outlets||[]))].filter(o=>!cat.m[o]);
 if(missing.length)console.log('named but not in the app catalogue, skipped: '+missing.join(', '));
 /* a desk that matches a kind of story rather than a place reads everything the others read */
 const everyone=want.slice();
 for(const d of DESKS)if(d.any)d.outlets=everyone;
 const feeds=want.filter(o=>cat.m[o]).map((o,i)=>({id:'e'+i,url:cat.m[o],title:o,outlet:o}));
 /* which outlets each desk may take from, worked out once */
 for(const d of DESKS)d.from=new Set(d.any?everyone:[...(d.cats||[]).flatMap(inCat),...(d.outlets||[])]);
 /* the site behind each feed, worked out by the app's own siteOf, so the relay asks Google News for the right
    publisher and the answer can be checked against it */
 const sites=await page.evaluate(us=>us.map(u=>siteOf({url:u})),feeds.map(f=>f.url));
 feeds.forEach((f,i)=>f.site=sites[i]);

 process.stdout.write('reading '+feeds.length+' feeds ');
 const got=await pool(feeds,12,async f=>{const r=await get(app.ctx,f.url,f.site);process.stdout.write(r.xml?(r.via?'r':'.'):'x');return{f,...r}});
 process.stdout.write('\n');
 const ok=got.filter(g=>g.xml),bad=got.filter(g=>!g.xml);

 /* parse and group in the page, with the app's own code. One story reported by several outlets comes back as one
    group whose `more` names the others, which is exactly the count the edition prints. */
 /* Parse in batches and keep the result in the page. Handing 597 feeds' XML across in one call killed the
    browser outright - hundreds of megabytes of strings in one argument - and the only thing that has to cross
    is the finished list of groups. Each batch is parsed, filtered and thrown away; what is kept is the small
    part of every story the edition needs. */
 await page.evaluate(()=>{window.__we=[]});
 const BATCH=20;
 for(let i=0;i<ok.length;i+=BATCH){
  const part=ok.slice(i,i+BATCH).map(g=>({f:{id:g.f.id,url:g.f.url,title:g.f.title},xml:g.xml}));
  await page.evaluate(({part,hours})=>{
   const cut=Date.now()-hours*36e5;
   /* the app's own filters, so the edition refuses what the lists already refuse: a shopping deal, a promo for
      the publisher's own newsletter, a feed's non-story pages. A magazine prints none of them, whatever the
      reader's Hide deals switch happens to say, so dealItem is asked directly rather than through dealHide.
      Three more the app lets through, each caught by eye in the 26 November edition: a price cut filed as news,
      a paid Dezeen Showroom listing, a newsletter round-up - and a headline carrying a bare web address, which
      is the publisher's own furniture and breaks mid-word when printed word for word. */
   const notNews=a=>/(^|\s)(https?:\/\/|www\.)|\b[a-z0-9-]+\.(com|org|net|co\.uk|io)\b/i.test(a.title||'')
     ||/\b(is|now|are)\s+down to\s*[$\u00a3\u20ac]|best price|deal of the day|\bsave [$\u00a3\u20ac]\d/i.test(a.title||'')
     ||/dezeen\.com\/[^?#]*showroom/i.test(a.link||'')
     ||/^the download[:\u2014-]/i.test((a.title||'').trim())
     /* a publisher's daily round-up under its own name ("9to5Mac Daily: November 26") is a programme, not a
        story, and so is a fan-opinion listicle */
     ||/\bdaily:\s|\b(round-?up|newsletter|digest):/i.test(a.title||'')
     ||/\b(fans|viewers|critics) are wrong\b|\byou('re| are) (doing|using) .* wrong\b/i.test(a.title||'')
     /* "EarthCARE ATLAS" reached Science & Health from ESA's feed and was set across the page as a headline.
        Two words naming a thing is a caption or a file name, not a headline; a magazine headline says
        something, and three words is the lowest that can. */
     ||String(a.title||'').trim().split(/\s+/).length<3
     ||/how to watch|where to watch|\bsaved stories\b|\blatest (news|stories)\b|^(news|home|articles)$/i.test(a.title||'');
   for(const g of part){
    let r=null;try{r=parse(g.xml,{id:g.f.id,url:g.f.url,title:g.f.title})}catch(e){continue}
    for(const a of (r&&r.list)||[]){
     if(!a.date||a.date<cut)continue;
     if(junkItem(a)||dealItem(a)||promoItem(a)||notNews(a))continue;
     /* only what the edition needs from a story, so a day's worth fits in the page */
     window.__we.push({feedId:a.feedId,title:a.title,link:a.link,date:a.date,img:a.img||'',summary:a.summary||''});
    }
   }
  },{part,hours:HOURS});
  for(const g of ok.slice(i,i+BATCH))g.xml='';/* and let Node drop it too */
 }
 const groups=await page.evaluate(()=>{
  const g=group(window.__we);window.__we=[];
  return g.map(x=>({title:x.title,link:x.link,feedId:x.feedId,date:x.date,img:x.img||'',
   summary:x.summary||'',more:(x.more||[]).map(m=>({f:m.f,l:m.l,t:m.t,img:m.img||''}))}));
 });

 const outletOf={},siteFor={};for(const f of feeds){outletOf[f.id]=f.outlet;siteFor[f.id]=f.site}
 for(const g of groups)g.site=siteFor[g.feedId]||'';
 /* HOW MANY SEPARATE NEWSROOMS REPORTED IT - which is not the same as how many mastheads carried it.
    Two feeds of one outlet (NPR and NPR Health) are one voice. And a story that arrives under four mastheads
    with the SAME HEADLINE, word for word, is one newsroom's copy syndicated four times: the wire. Counting it
    as four would make the edition's front page a measure of how widely AP sells, not of what mattered, and
    that danger grows with every outlet added. Identical headlines therefore count once. */
 const plain=t=>String(t||'').toLowerCase().replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim();
 for(const g of groups){
  const voices=new Map();/* outlet -> its headline, so one outlet cannot vote twice either */
  voices.set(outletOf[g.feedId]||'',plain(g.title));
  for(const m of g.more){const o=outletOf[m.f];if(o&&!voices.has(o))voices.set(o,plain(m.t))}
  voices.delete('');
  g.outlets=[...voices.keys()];
  g.wire=new Set([...voices.values()]).size<voices.size;/* at least two told it in the very same words */
  g.n=new Set([...voices.values()]).size;
  g.carried=voices.size;/* how many mastheads, for the report */
  g.outlet=outletOf[g.feedId]||'';
 }
 /* THE RUNNING ORDER. Biggest story first, where "biggest" is how many newsrooms told it - but a day-old
    story is not today's news however many outlets carried it yesterday, so a story loses a point once it is
    over a day old and gains one when it broke in the last six hours. The edition is printed twice a day; this
    is what stops the morning's issue being the evening's again. */
 const HOUR=36e5,now=Date.now();
 for(const g of groups){
  const age=(now-(g.date||now))/HOUR;
  g.score=g.n+(age<=6?1:0)-(age>24?1:0);
 }
 groups.sort((a,b)=>b.score-a.score||b.n-a.n||b.date-a.date);

 /* Is this story one the edition has already printed? The same event reaches the desk under several mastheads,
    and the grouping above only merges headlines that are close enough: the SpaceX satellite story came through
    as "FCC says SpaceX can deploy..." on AP and "SpaceX gets FCC approval..." on Engadget - two groups, one
    event. So a candidate is grouped WITH the stories already accepted, by the app's own group(), and if it
    vanishes into one of them it is a repeat. One detector, never two of them to keep in step. */
 const isRepeat=(accepted,cand)=>accepted.length?page.evaluate(([a,c])=>group([...a,c]).length===group(a).length,
   [accepted,{title:cand.title,link:cand.link,feedId:cand.feedId}]):Promise.resolve(false);

 /* a tab of its own for looking up relayed links: navigating the app's page away would take the app with it */
 const tab=await app.ctx.newPage();
 /* each edition picks from the same groups with its own desk */
 const editions=[];
 for(const E of EDITIONS){
  const used=new Set(),accepted=[],sections=[],spoke=new Map();
  /* WHO CHOOSES FIRST. The desks print in the order they are written, but they do not all choose in that
     order. The Obituary desk goes first, because the day's biggest death belongs on the obituary page: on
     26 November the Home desk took Andy Taylor's death (11 newsrooms) as news and the Obituary page was left
     with a second, smaller death - so the magazine led on one death and ran an obituary of another, which no
     magazine would do. It also quietly fixes a bias in the counting: a well-known person's death is quick to
     write, so every newsroom files one within the hour, and it beats a harder story that fewer could cover. */
  const order=[...E.desk.filter(d=>d.first),...E.desk.filter(d=>!d.first)];
  const got=new Map();
  for(const d of order){
   const mine=[];
   for(const g of groups){
    if(mine.length>=d.n)break;
    if(!d.from.has(g.outlet)||used.has(g.link))continue;
    /* a desk that is a kind of story only takes a headline that is that kind */
    /* not a story on any desk, whatever the feed called it */
    if(NOT_A_STORY.test(g.title||''))continue;
    /* a title of one or two words is a feed's placeholder, not a headline: The Atlantic offered the Long
       read desk a story called "television" on 27 November, and it was picked. */
    if((g.title||'').trim().split(/\s+/).length<3)continue;
    if(d.find&&!d.find.test(g.title||''))continue;
    /* and a desk that is a place in the world refuses the kinds that are not its business. Section-by-source
       finds what matters and does not know where it belongs: on 26 November it filed a tennis result in
       World, Aaron Rodgers in Culture and an ammunition plant in Business, all because of whose feed they
       came down. A headline that is plainly sport does not belong in a news or culture section. */
    if(d.not&&d.not.test(g.title||''))continue;
    /* no outlet speaks more than twice in one edition, however loud its feed is */
    if((spoke.get(g.outlet)||0)>=2)continue;
    /* one story per outlet per section: a desk whose other feeds went quiet would otherwise fill its whole
       section from whichever outlet publishes most often. A section that cannot be filled from different
       outlets runs short, which the method page allows and a reader reads as a quiet day. */
    if(mine.some(x=>x.outlet===g.outlet))continue;
    if(await isRepeat(accepted,g))continue;
    /* a story that came through the relay points at Google, not at the publisher: look its real address up
       now, while there is still another candidate to fall back on if it does not resolve */
    if(!await resolve(tab,page,g)){used.add(g.link);continue}
    mine.push(g);accepted.push({title:g.title,link:g.link,feedId:g.feedId});
    spoke.set(g.outlet,(spoke.get(g.outlet)||0)+1);
    /* a group's other outlets are the same story: using one spends them all inside THIS edition */
    used.add(g.link);for(const m of g.more)if(m.l)used.add(m.l);
   }
   got.set(d.name,mine.map(g=>({t:ownWords(g.title,g.outlet),o:g.outlet,l:g.link,n:g.n,
    dek:g.summary||'',img:g.img||'',date:g.date,outlets:g.outlets,
    sibs:(g.more||[]).filter(m=>m.l&&!/news\.google\.com/.test(m.l)).map(m=>({o:outletOf[m.f]||'',l:m.l,t:ownWords(m.t||'',outletOf[m.f]||''),img:m.img||''})).slice(0,4)})));
  }
  /* A SECTION THAT RUNS SHORT HANDS ITS PLACES TO ONE THAT HAS MORE TO SAY (David, 2026-11-27, told that the
     new refusals would thin some sections: "If a section runs short that's ok just add more to other
     sections"). Every refusal above - not a story, not food, plainly sport - now costs the issue nothing in
     SIZE, only in where the stories sit, which is the right trade: it was never the aim to print less, only
     to stop printing the wrong thing.
     Second pass only, so a desk's own first choices always come before another desk's overflow; +3 at most to
     any one desk, so a single loud section cannot swallow a thin day; and every gate above still applies,
     because a spare place is not a reason to lower the bar. */
  let spare=E.desk.reduce((n,d)=>n+Math.max(0,d.n-(got.get(d.name)||[]).length),0);
  for(const d of E.desk){
   if(spare<=0)break;
   const mine=got.get(d.name)||[];let extra=0;
   for(const g of groups){
    if(spare<=0||extra>=3)break;
    if(!d.from.has(g.outlet)||used.has(g.link))continue;
    if(NOT_A_STORY.test(g.title||''))continue;
    if(d.find&&!d.find.test(g.title||''))continue;
    if(d.not&&d.not.test(g.title||''))continue;
    if((spoke.get(g.outlet)||0)>=2)continue;
    if(mine.some(x=>x.o===g.outlet||x.outlet===g.outlet))continue;
    if(await isRepeat(accepted,g))continue;
    if(!await resolve(tab,page,g)){used.add(g.link);continue}
    accepted.push({title:g.title,link:g.link,feedId:g.feedId});
    spoke.set(g.outlet,(spoke.get(g.outlet)||0)+1);
    used.add(g.link);for(const m of g.more)if(m.l)used.add(m.l);
    mine.push({t:ownWords(g.title,g.outlet),o:g.outlet,l:g.link,n:g.n,
     dek:g.summary||'',img:g.img||'',date:g.date,outlets:g.outlets,
     sibs:(g.more||[]).filter(m=>m.l&&!/news\.google\.com/.test(m.l)).map(m=>({o:outletOf[m.f]||'',l:m.l,t:ownWords(m.t||'',outletOf[m.f]||''),img:m.img||''})).slice(0,4)});
    extra++;spare--;
   }
   got.set(d.name,mine);
  }
  /* printed in the order they are written, whatever order they chose in */
  for(const d of E.desk)sections.push({name:d.name,places:d.n,stories:got.get(d.name)||[]});
  editions.push({id:E.id,name:E.name,regions:E.regions,fallback:!!E.fallback,sections});
 }
 /* the US edition is the one printed in the report and the one the old files called "sections" */
 const sections=editions[0].sections;

 const sampled=new Set(ok.map(g=>g.f.outlet)).size;
 const total=sections.reduce((n,s)=>n+s.stories.length,0);
 console.log('\n'+sampled+' outlets answered, '+bad.length+' did not. '+groups.length+' stories after grouping.');
 for(const s of sections){
  console.log('\n'+s.name+'  '+s.stories.length+' of '+s.places);
  for(const st of s.stories)console.log('  '+String(st.n).padStart(2)+' outlet'+(st.n===1?' ':'s')+'  '+st.o.padEnd(18)+'  '+st.t.slice(0,58));
 }
 if(bad.length)console.log('\nno answer: '+bad.map(g=>g.f.outlet+' ('+g.err+')').join(', '));
 /* the lead is simply the most reported story of the day - the method page promises nobody picks it */
 const lead=sections.flatMap((s,si)=>s.stories.map((st,ti)=>({...st,si,ti}))).sort((a,b)=>b.n-a.n||b.date-a.date)[0];
 if(lead)console.log('\nlead by count: '+lead.t.slice(0,70)+'  ('+lead.n+' outlets, '+lead.o+')');
 console.log('\n'+total+' candidate stories. They still have to be read and gated: scripts/edition/gather.js');

 for(const e of editions.slice(1)){
  const n=e.sections.reduce((m,x)=>m+x.stories.length,0);
  console.log('\n'+e.name+': '+n+' stories, '+e.sections.filter(x=>x.stories.length).length+' sections with something in them');
 }
 if(OUT){fs.writeFileSync(OUT,JSON.stringify({picked:new Date().toISOString(),hours:HOURS,sampled,
   lead:lead?[lead.si,lead.ti]:null,sections,editions},null,1));console.log('written to '+OUT)}
 await app.close();
 process.exit(total<10?2:0);
})();
