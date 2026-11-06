/* Share links: a short cypressreader.com/s/<code> link whenever the share worker answers; remembered per story; otherwise the site's own address, without the CyPress lead */
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
 /* C11 (2026-11-06): the unused shareUrl is gone; shareLink is what Share uses. No CyPress link means no "Read this in CyPress:" lead */
 let u=await p.evaluate(`shareLink(${mk(1)})`);ck('a short link when the worker answers',u==='https://cypressreader.com/s/abc1234',u);
 const c1=calls;u=await p.evaluate(`shareLink(${mk(1)})`);ck('the same story shared again needs no new request',u==='https://cypressreader.com/s/abc1234'&&calls===c1,u+' '+calls);
 ck('a CyPress link is led by "Read this in CyPress:"',await p.evaluate(`shareText(${mk(1)},'https://cypressreader.com/s/abc1234')`)==='Read this in CyPress: https://cypressreader.com/s/abc1234');
 mode='bad';u=await p.evaluate(`shareLink(${mk(3)})`);ck('when the worker refuses, the site\'s own address is used',u==='https://s.test/story-3',u);
 const tx=await p.evaluate(`shareText(${mk(3)},'https://s.test/story-3')`);ck('without a CyPress link the message is the headline and the address, no CyPress lead',!/CyPress/.test(tx)&&/^A long headline[^\n]*\nhttps:\/\/s\.test\/story-3$/.test(tx),tx);
 ck('no page errors',!errs.length,errs[0]);
 await b.close();console.log('share_short',bad?bad+' FAILED':'all passed');process.exit(bad?1:0)})();
