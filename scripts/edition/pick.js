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
 *   node scripts/edition/pick.js --json cand.json     # write the candidates for gather.js
 *   node scripts/edition/pick.js --hours 48           # how far back a story may be (default 36)
 */
const fs=require('fs'),https=require('https'),{openApp}=require('./app');

const arg=n=>{const i=process.argv.indexOf(n);return i>0?process.argv[i+1]:null};
const OUT=arg('--json'),HOURS=Number(arg('--hours')||36);

/* THE DESK. Ten sections, fixed order, fixed number of places (the method page: "each with a fixed number of
   places ... A section may run short but never borrows"). Each section lists the outlets whose feeds it reads,
   by the name they carry in the app's catalogue - the addresses stay in the app, which is where they are kept
   up to date. Home is the US desk and World the foreign one, which is the only reason they are split: they
   read the same kind of feed. */
const DESK=[
 {name:'Home',n:6,outlets:['NPR','PBS NewsHour','NBC News','CBS News','AP News','Axios','The Hill','CNN','Fox News','Semafor','ProPublica']},
 {name:'World',n:6,outlets:['BBC World','The Guardian World','Al Jazeera','Deutsche Welle','Reuters','BBC News','Global News','The Guardian']},
 {name:'Business',n:4,outlets:['CNBC','Forbes','Fortune','Fast Company','Inc.']},
 {name:'Science & Health',n:4,outlets:['Science News','New Scientist','Scientific American','NASA','Space.com','Live Science','ScienceDaily','STAT','KFF Health News','NPR Health','ScienceDaily Health','Quanta Magazine']},
 {name:'Tech',n:4,outlets:['Ars Technica','The Verge','Wired','MIT Technology Review','TechCrunch','ZDNet','Engadget','Gizmodo','Hacker News']},
 {name:'Culture',n:4,outlets:['The Atlantic','Vox','Slate','Hyperallergic','Open Culture','Colossal','It’s Nice That','Dezeen','Variety','Pitchfork','The A.V. Club','Rolling Stone','IndieWire','designboom']},
 {name:'Sport',n:3,outlets:['ESPN','BBC Sport','Sky Sports','CBS Sports','Formula 1','SB Nation','MLB']},
 {name:'Food',n:3,outlets:['The Kitchn','Budget Bytes','Bon Appétit','Serious Eats','Lifehacker']},
 {name:'Long read',n:3,outlets:['Longreads','Aeon','Knowable Magazine','Wait But Why','Farnam Street','Smashing Magazine','MIT Technology Review']},
 {name:'Back page',n:2,outlets:['Good News Network','Positive News','Reasons to Be Cheerful','The Optimist Daily','YES! Magazine','Our World in Data']},
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

const pool=async(list,n,fn)=>{const out=[];let i=0;await Promise.all(Array.from({length:n},async()=>{while(i<list.length){const k=i++;out[k]=await fn(list[k])}}));return out};

(async()=>{
 const app=await openApp();
 const page=app.page;

 /* the app's own catalogue is the list of feeds: name -> address */
 const cat=await page.evaluate(()=>{const m={};for(const c of CAT)for(const f of c.f)m[f[0]]=f[1];return m});
 const want=[...new Set(DESK.flatMap(d=>d.outlets))];
 const missing=want.filter(o=>!cat[o]);
 if(missing.length)console.log('not in the app catalogue, skipped: '+missing.join(', '));
 const feeds=want.filter(o=>cat[o]).map((o,i)=>({id:'e'+i,url:cat[o],title:o,outlet:o}));
 /* the site behind each feed, worked out by the app's own siteOf, so the relay asks Google News for the right
    publisher and the answer can be checked against it */
 const sites=await page.evaluate(us=>us.map(u=>siteOf({url:u})),feeds.map(f=>f.url));
 feeds.forEach((f,i)=>f.site=sites[i]);

 process.stdout.write('reading '+feeds.length+' feeds ');
 const got=await pool(feeds,8,async f=>{const r=await get(app.ctx,f.url,f.site);process.stdout.write(r.xml?(r.via?'r':'.'):'x');return{f,...r}});
 process.stdout.write('\n');
 const ok=got.filter(g=>g.xml),bad=got.filter(g=>!g.xml);

 /* parse and group in the page, with the app's own code. One story reported by several outlets comes back as one
    group whose `more` names the others, which is exactly the count the edition prints. */
 const groups=await page.evaluate(({ok,hours})=>{
  const all=[];
  for(const g of ok){
   let r=null;try{r=parse(g.xml,{id:g.f.id,url:g.f.url,title:g.f.title})}catch(e){continue}
   for(const a of (r&&r.list)||[])all.push(a);
  }
  const cut=Date.now()-hours*36e5;
  /* the app's own filters, so the edition refuses what the lists already refuse: a shopping deal, a promo for
     the publisher's own newsletter, a feed's non-story pages. A magazine prints none of them, whatever the
     reader's Hide deals switch happens to say, so dealItem is asked directly rather than through dealHide. */
  /* Three the app's filters let through, each caught by eye in the 26 November edition: a price cut The Verge
     files as news ("is down to $300, its best price"), a paid showroom listing (Dezeen Showroom is advertising
     with a byline), and a newsletter round-up filed as a story (MIT Technology Review's "The Download"). A
     magazine prints none of the three. */
  const notNews=a=>/\b(is|now|are)\s+down to\s*[$\u00a3\u20ac]|best price|deal of the day|\bsave [$\u00a3\u20ac]\d/i.test(a.title||'')
    ||/dezeen\.com\/[^?#]*showroom/i.test(a.link||'')
    ||/^the download[:\u2014-]/i.test((a.title||'').trim());
  const fresh=all.filter(a=>a.date&&a.date>=cut&&!junkItem(a)&&!dealItem(a)&&!promoItem(a)&&!notNews(a));
  return group(fresh).map(x=>({title:x.title,link:x.link,feedId:x.feedId,date:x.date,img:x.img||'',
   summary:x.summary||'',more:(x.more||[]).map(m=>({f:m.f,l:m.l,t:m.t,img:m.img||''}))}));
 },{ok:ok.map(g=>({f:{id:g.f.id,url:g.f.url,title:g.f.title},xml:g.xml})),hours:HOURS});

 const outletOf={},siteFor={};for(const f of feeds){outletOf[f.id]=f.outlet;siteFor[f.id]=f.site}
 for(const g of groups)g.site=siteFor[g.feedId]||'';
 /* how many SEPARATE outlets reported it. Two feeds of the same outlet (NPR and NPR Health) are one voice. */
 for(const g of groups){
  const names=new Set([outletOf[g.feedId],...g.more.map(m=>outletOf[m.f])].filter(Boolean));
  g.outlets=[...names];g.n=names.size;g.outlet=outletOf[g.feedId]||'';
 }
 /* biggest story first; a tie goes to the newer one */
 groups.sort((a,b)=>b.n-a.n||b.date-a.date);

 /* Is this story one the edition has already printed? The same event reaches the desk under several mastheads,
    and the grouping above only merges headlines that are close enough: the SpaceX satellite story came through
    as "FCC says SpaceX can deploy..." on AP and "SpaceX gets FCC approval..." on Engadget - two groups, one
    event. So a candidate is grouped WITH the stories already accepted, by the app's own group(), and if it
    vanishes into one of them it is a repeat. One detector, never two of them to keep in step. */
 const isRepeat=(accepted,cand)=>accepted.length?page.evaluate(([a,c])=>group([...a,c]).length===group(a).length,
   [accepted,{title:cand.title,link:cand.link,feedId:cand.feedId}]):Promise.resolve(false);

 /* a tab of its own for looking up relayed links: navigating the app's page away would take the app with it */
 const tab=await app.ctx.newPage();
 const used=new Set(),accepted=[],sections=[];
 for(const d of DESK){
  const mine=[];
  for(const g of groups){
   if(mine.length>=d.n)break;
   if(!d.outlets.includes(g.outlet)||used.has(g.link))continue;
   /* one story per outlet per section: a desk whose other feeds went quiet would otherwise fill its whole
      section from whichever outlet publishes most often (Space.com twice in Science & Health, one of them an
      almanac item). A section that cannot be filled from different outlets runs short, which the method page
      allows and a reader reads as a quiet day. */
   if(mine.some(x=>x.outlet===g.outlet))continue;
   if(await isRepeat(accepted,g))continue;
   /* a story that came through the relay points at Google, not at the publisher: look its real address up
      now, while there is still another candidate to fall back on if it does not resolve */
   if(!await resolve(tab,page,g)){used.add(g.link);continue}
   mine.push(g);accepted.push({title:g.title,link:g.link,feedId:g.feedId});
   /* a group's other outlets are the same story: using one spends them all, so the next section cannot print
      the same event under a different masthead */
   used.add(g.link);for(const m of g.more)if(m.l)used.add(m.l);
  }
  sections.push({name:d.name,places:d.n,stories:mine.map(g=>({t:g.title,o:g.outlet,l:g.link,n:g.n,
   dek:g.summary||'',img:g.img||'',date:g.date,outlets:g.outlets,
   /* The other outlets' versions of the same story. Grouping finds them, and until now they were used only to
      stop the same event printing twice. They are also the other photographers who were there: the format says
      a cover photo is "the best photo among all outlets' versions", and 16 of 27 stories in the 26 November
      edition had no usable picture of their own while 27 sibling versions went unlooked at. */
   sibs:(g.more||[]).filter(m=>m.l&&!/news\.google\.com/.test(m.l)).map(m=>({o:outletOf[m.f]||'',l:m.l,img:m.img||''})).slice(0,4)}))});
 }

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

 if(OUT){fs.writeFileSync(OUT,JSON.stringify({picked:new Date().toISOString(),hours:HOURS,sampled,
   lead:lead?[lead.si,lead.ti]:null,sections},null,1));console.log('written to '+OUT)}
 await app.close();
 process.exit(total<10?2:0);
})();
