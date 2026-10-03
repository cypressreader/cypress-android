const {chromium}=require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright');
const fs=require('fs');const D='/home/claude/cypress-android/docs/';
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const seen=[];
await c.route(/^https:\/\/(?!cypressreader\.com)/,r=>{seen.push(r.request().url());r.abort()});
await c.route('https://cypressreader.com/**',async r=>{const u=new URL(r.request().url());
 if(u.pathname==='/feed'){seen.push('FEED '+u.searchParams.get('u'));return r.fulfill({status:200,contentType:'text/plain',body:'<html><head><title>Story</title></head><body><article><h1>Article headline</h1>'+Array.from({length:10},(_,i)=>'<p>Paragraph '+i+' text. '+'Ordinary sentence text for the reader. '.repeat(6)+'</p>').join('')+'</article></body></html>'})}
 if(u.pathname.startsWith('/app/')){return r.fulfill({status:200,contentType:'text/html',body:fs.readFileSync(D+'app/index.html')})}r.fulfill({status:404,body:''})});
await p.goto('https://cypressreader.com/app/');await p.waitForTimeout(1500);
const r=await p.evaluate(async()=>{const lg=[];let out;try{out=await fetchText('https://news.example.org/a1',null,lg)}catch(e){out='ERR '+e}return {len:String(out).length,lg}});
console.log(JSON.stringify(r),seen);
const r2=await p.evaluate(async()=>{const lg=[];let out;try{out=await fetchText('https://news.example.org/a1',t=>/article/i.test(t)&&t.length>2000,lg)}catch(e){out='ERR '+e}return {len:String(out).length,lg}});console.log(JSON.stringify(r2),seen.slice(-3));seen.length=0;await p.waitForTimeout(100);const r3=await p.evaluate(async()=>{const lg=[];let out;try{out=await fetchText('https://www.bing.com/news/search?q=x&format=RSS',null,lg)}catch(e){out='ERR '+e}return {len:String(out).length,lg}});console.log('bing',JSON.stringify(r3),seen);
await b.close()})();
