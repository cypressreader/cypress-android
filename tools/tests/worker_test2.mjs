import fs from 'fs';
const real=fs.readFileSync('/home/claude/cypress-android/docs/s.html','utf8');
let calls=[];
globalThis.fetch=async(u,o)=>{u=String(u);calls.push(u);
 if(u.endsWith('/s.html'))return new Response(real,{status:200});
 if(u.includes('feeds.example.org/rss'))return new Response('<rss><channel><title>T</title></channel></rss>',{status:200,headers:{'content-type':'application/rss+xml; charset=ISO-8859-1'}});
 if(u.includes('feeds.example.org/gone'))return new Response('x',{status:404});
 if(u.includes('feeds.example.org/big'))return new Response('x',{status:200,headers:{'content-length':'9999999'}});
 if(u.includes('feeds.example.org/html'))return new Response('<script>alert(1)</script>',{status:200,headers:{'content-type':'text/html'}});
 if(u.endsWith('/cypress-android/')||u.endsWith('cypress-android/index.html'))return new Response('<html>LANDING</html>',{status:200,headers:{'content-type':'text/html'}});
 if(u.endsWith('/app/'))return new Response('<html>APP</html>',{status:200,headers:{'content-type':'text/html'}});
 if(u.endsWith('/cypress-android/app'))return new Response('',{status:301,headers:{location:'https://davealmaguer-hub.github.io/cypress-android/app/'}});
 if(u.endsWith('/cypress-android/nope'))return new Response('nf',{status:404});
 return new Response('?',{status:404})};
const w=(await import('/home/claude/cypress-android/docs/worker/share-worker.js')).default;
let pass=0,fail=0;const ck=(n,c,x='')=>{console.log((c?'ok  ':'FAIL')+' '+n+' '+(c?'':x));c?pass++:fail++};
const H='https://cypressreader.com';
const same={'sec-fetch-site':'same-origin','sec-fetch-mode':'cors'};
const get=(p,h={})=>w.fetch(new Request(H+p,{headers:h}));
// story
{const o={t:'Hello',s:'Src',l:'https://a.test',i:'',x:'d'};const pl='p'+Buffer.from(JSON.stringify(o)).toString('base64url');const r=await get('/s/'+pl);const h=await r.text();
 ck('story 200',r.status===200);ck('base is own origin',h.includes('<base href="https://cypressreader.com/">'));ck('og:image logo on own domain',h.includes('og:image" content="https://cypressreader.com/logo.png"'));ck('no github username in output',!h.includes('davealmaguer'),h.match(/.{30}davealmaguer.{30}/)?.[0]);}
// get
{const r=await get('/get');ck('/get 302 to apk',r.status===302&&/cypress\.apk$/.test(r.headers.get('location')));}
// site
{const r=await get('/');ck('/ landing proxied',r.status===200&&(await r.text()).includes('LANDING'));}
{const r=await get('/app/');ck('/app/ proxied',(await r.text()).includes('APP')&&r.headers.get('cache-control')==='no-cache');}
{const r=await get('/app');ck('/app redirects to /app/ on own host',r.status===301&&r.headers.get('location')===H+'/app/',r.headers.get('location'));}
{const r=await get('/nope');ck('/nope 404',r.status===404);}
ck('/worker hidden',(await get('/worker/share-worker.js')).status===404);
ck('POST not allowed',(await w.fetch(new Request(H+'/',{method:'POST'}))).status===404);
// feed
{const r=await get('/feed?u='+encodeURIComponent('https://feeds.example.org/rss'),same);const t=await r.text();ck('feed ok',r.status===200&&t.includes('<rss>'));ck('feed plain text + nosniff + sandbox',/^text\/plain; charset=ISO-8859-1/.test(r.headers.get('content-type'))&&r.headers.get('x-content-type-options')==='nosniff'&&/sandbox/.test(r.headers.get('content-security-policy')),r.headers.get('content-type'));}
{const r=await get('/feed?u='+encodeURIComponent('https://feeds.example.org/html'),same);ck('html is served as text/plain',/text\/plain/.test(r.headers.get('content-type')));}
{const r=await get('/feed?u='+encodeURIComponent('https://feeds.example.org/rss'),{referer:H+'/app/'});ck('referer from own app accepted',r.status===200);}
{const r=await get('/feed?u='+encodeURIComponent('https://feeds.example.org/rss'),{'sec-fetch-site':'cross-site'});ck('cross-site blocked',r.status===403);}
{const r=await get('/feed?u='+encodeURIComponent('https://feeds.example.org/rss'));ck('no headers blocked',r.status===403);}
{const r=await get('/feed?u='+encodeURIComponent('https://feeds.example.org/rss'),{'sec-fetch-site':'same-origin','sec-fetch-mode':'navigate'});ck('direct navigation blocked',r.status===403);}
for(const bad of ['http://localhost/x','http://127.0.0.1/x','http://10.0.0.5/x','http://192.168.1.1/x','http://169.254.169.254/x','http://172.20.0.1/x','http://[::1]/x','http://intranet/x','file:///etc/passwd','javascript:1','https://user:pw@feeds.example.org/rss','https://feeds.example.org:8080/rss','https://cypressreader.com/feed?u=x','http://foo.internal/x','http://2130706433/x'])
 {const r=await get('/feed?u='+encodeURIComponent(bad),same);ck('refuses '+bad,r.status===400,r.status)}
{const r=await get('/feed?u='+encodeURIComponent('https://feeds.example.org/gone'),same);ck('404 passes through',r.status===404);}
{const r=await get('/feed?u='+encodeURIComponent('https://feeds.example.org/big'),same);ck('too large 413',r.status===413);}
{const r=await get('/feed',same);ck('missing u 400',r.status===400);}
{const r=await w.fetch(new Request(H+'/feed?u=https://feeds.example.org/rss',{method:'POST',headers:same}));ck('feed POST 405',r.status===405);}
console.log('pass',pass,'fail',fail);
