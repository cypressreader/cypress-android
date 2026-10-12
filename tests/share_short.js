/* Share links: a short cypressreader.com/s/<code> link whenever the share worker answers; one retry; remembered per story; the long link only as an honest last resort */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x===undefined?'':x)}else console.log('ok',n)};
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:412,height:860}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await mock(p,{n:3});let mode='ok',calls=0;
 await p.route('https://cypressreader.com/api/short',r=>{calls++;const h={'access-control-allow-origin':'*'};
  if(mode==='ok')return r.fulfill({status:200,headers:h,contentType:'application/json',body:'{"code":"abc1234"}'});
  if(mode==='flaky')return calls%2?r.fulfill({status:503,headers:h,body:'{}'}):r.fulfill({status:200,headers:h,contentType:'application/json',body:'{"code":"def5678"}'});
  return r.fulfill({status:400,headers:h,contentType:'application/json',body:'{"error":"Bad link"}'})});
 await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});
 const mk=id=>`({feedId:S.feeds[0].id,title:'A long headline about something that happened today '+${id},link:'https://s.test/story-${id}',date:Date.now(),summary:'s',img:'https://img.test/a.jpg'})`;
 let u=await p.evaluate(`shareUrl(${mk(1)})`);ck('a short link when the worker answers',u==='https://cypressreader.com/s/abc1234',u);
 const c1=calls;u=await p.evaluate(`shareUrl(${mk(1)})`);ck('the same story shared again needs no new request',u==='https://cypressreader.com/s/abc1234'&&calls===c1,u+' '+calls);
 mode='flaky';calls=0;u=await p.evaluate(`shareUrl(${mk(2)})`);ck('one failed try is retried and still gives a short link',u==='https://cypressreader.com/s/def5678'&&calls===2,u+' calls '+calls);
 mode='bad';u=await p.evaluate(`shareUrl(${mk(3)})`);ck('when the worker refuses, the long link is used and says why',/\/s\/[zp][A-Za-z0-9_-]{30,}$/.test(u)&&/HTTP 400/.test(await p.evaluate(()=>SHAREWHY)),u.slice(0,80));
 ck('no page errors',!errs.length,errs[0]);
 await b.close();console.log('share_short',bad?bad+' FAILED':'all passed');process.exit(bad?1:0)})();
