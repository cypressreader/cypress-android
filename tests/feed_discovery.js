/* Paste-an-address adding (B46): the app finds the site's feed on its own: the page's own <link rel="alternate"> (main feed before the comments feed), a link that says RSS or Subscribe, the usual places (also under a /blog path), Medium, and the shortcuts for Reddit, GitHub and YouTube. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{console.log((ok?'ok ':'FAIL ')+n+(ok?'':' '+(x||'')));if(!ok)bad++};
const rss=t=>`<?xml version="1.0"?><rss version="2.0"><channel><title>${t}</title>${[1,2,3].map(i=>`<item><title>${t} story ${i}</title><link>https://x.test/${i}</link><pubDate>Mon, 12 Oct 2026 10:0${i}:00 GMT</pubDate><description>Text ${i}</description></item>`).join('')}</channel></rss>`;
const page=(head,body)=>`<!doctype html><html><head><title>Site</title>${head}</head><body>${body||'<p>hello</p>'}</body></html>`;
const SITES={
 'a.test':{'/':page('<link rel="alternate" type="application/atom+xml" title="Comments" href="/comments.atom"><link rel="alternate" type="application/rss+xml" title="Posts" href="/rss2.xml">'),'/rss2.xml':rss('Site A posts'),'/comments.atom':'<feed xmlns="http://www.w3.org/2005/Atom"><title>Comments</title><entry><title>c1</title></entry><entry><title>c2</title></entry></feed>'},
 'b.test':{'/':page('','<a href="/news/subscribe.xml">Subscribe via RSS</a>'),'/news/subscribe.xml':rss('Site B')},
 'c.test':{'/blog/':page(''),'/blog/feed':rss('Blog C')},
 'e.test':{'/':page(''),'/feeds/posts/default':'<feed xmlns="http://www.w3.org/2005/Atom"><title>Blogger E</title><entry><title>p1</title></entry><entry><title>p2</title></entry><entry><title>p3</title></entry></feed>'},
 'g.test':{'/':page('<link rel="alternate" type="application/rss+xml" href="https://feeds.g.test/main?fmt=xml">'),'/main':rss('Wrong')},
 'feeds.g.test':{'/main':rss('Site G feed')}
};
(async()=>{
 const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:412,height:860}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 const asked=[];await mock(p,{n:3});
 await p.route(/^https?:\/\/(?!localhost)/,r=>{
  let u=r.request().url();try{const o=new URL(u);if(/corsproxy\.io|allorigins|codetabs/.test(o.hostname))u=o.searchParams.get('url')||o.searchParams.get('quest')||u}catch(e){}
  let x;try{x=new URL(u)}catch(e){return r.abort()}
  asked.push(x.hostname+x.pathname);
  const site=SITES[x.hostname];
  if(site){const body=site[x.pathname]||site[x.pathname.replace(/\/$/,'')];if(body)return r.fulfill({status:200,contentType:/<(rss|feed)/.test(body)?'text/xml':'text/html',body,headers:{'access-control-allow-origin':'*'}});return r.fulfill({status:404,body:'nope',headers:{'access-control-allow-origin':'*'}})}
  if(/medium\.com\/feed\//.test(u))return r.fulfill({status:200,contentType:'text/xml',body:rss('Medium'),headers:{'access-control-allow-origin':'*'}});
  return r.abort()});
 await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(400);
 const find=async u=>p.evaluate(async u=>{try{const r=await Promise.race([findFeed(u),new Promise((_,j)=>setTimeout(()=>j('timeout'),20000))]);return {url:r.url,title:parse(r.xml,{id:'t',url:r.url,title:''}).title}}catch(e){return {err:String(e)}}},u);
 let r=await find('https://a.test/');ck('uses the page\'s own feed link, the main feed before the comments feed',r.url==='https://a.test/rss2.xml',JSON.stringify(r));
 r=await find('https://b.test/');ck('finds a "Subscribe via RSS" link when the page has no feed tag',r.url==='https://b.test/news/subscribe.xml',JSON.stringify(r));
 r=await find('https://c.test/blog/');ck('an address with a /blog path is tried under that path',r.url==='https://c.test/blog/feed',JSON.stringify(r));
 r=await find('https://e.test/');ck('finds a Blogger-style feed',r.url==='https://e.test/feeds/posts/default',JSON.stringify(r));
 r=await find('https://g.test/');ck('follows a feed link that points to another host',r.url.startsWith('https://feeds.g.test/main')&&r.title==='Site G feed',JSON.stringify(r));
 r=await find('https://medium.com/@someone');ck('a Medium profile becomes its feed address',/^https:\/\/medium\.com\/feed\/@someone$/.test(r.url||''),JSON.stringify(r));
 const sh=await p.evaluate(()=>{const fs=[];const o=fetchText;return [socialUrl('r/gadgets'),socialUrl('@someone@mastodon.social'),socialUrl('someone.bsky.social')]});
 ck('shortcuts: subreddit, Mastodon and Bluesky names',sh[0]==='https://www.reddit.com/r/gadgets/.rss'&&sh[1]==='https://mastodon.social/@someone.rss'&&/bsky\.app\/profile\/someone\.bsky\.social\/rss/.test(sh[2]),JSON.stringify(sh));
 ck('no page errors',!errs.length,errs[0]);await b.close();console.log(bad?'feed_discovery '+bad+' FAILED':'feed_discovery all passed');process.exit(bad?1:0)})();
