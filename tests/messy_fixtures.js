/* kept:1 = the page itself was too big to send whole, so the text the phone kept is cleaned again instead.
   stories testers sent with 'Send a messy story': each page as their phone got it, and what the cleanup must (and must not) keep. Add one per fixed report */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);const fs=require('fs'),path=require('path');
let bad=0,n=0;const ck=(nm,ok,x)=>{n++;if(!ok){bad++;console.log('FAIL',nm,x||'')}else console.log('ok',nm)};
const F=[
 {f:'makeuseof.html',u:'https://www.makeuseof.com/windows-11-is-making-file-explorer-significantly-faster/',first:/^Microsoft is speeding things up/,keep:[/wider release/],drop:[/holds a B\.A/,/Link copied/,/Followed/]},

 {f:'xda.html',u:'https://www.xda-developers.com/i-asked-lovable-bolt-and-google-ai-studio-to-build-the-same-web-app-and-one-is-in-a-different-league/',first:/^If you have the vision/,keep:[/untapped potential/],drop:[/creating an account/i,/provide your email/i]},
 {f:'techradar_kept.html',kept:1,u:'https://www.techradar.com/vpn/vpn-privacy-security/people-in-jordan-turn-to-vpns-as-telegram-goes-dark-nationwide',first:/^Proton VPN sign-ups/,keep:[/end-to-end encryption/],drop:[/Whatsapp Reddit/i]},
];
(async()=>{const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{n:2});await p.goto('file://'+APP);await p.waitForTimeout(1200);
 for(const x of F){const h=fs.readFileSync(path.join(__dirname,'fixtures/messy',x.f),'utf8');
  const t=await p.evaluate(([h,u,k])=>{const fr=k?document.createRange().createContextualFragment(h):extract(h,u);if(!fr)return '';const w=document.createElement('div');w.append(fr);try{junkClean(w,u)}catch(e){}return w.textContent.replace(/\s+/g,' ').trim()},[h,x.u,x.kept]);
  ck(x.f+': story found',t.length>1000,t.length);ck(x.f+': starts with the story',x.first.test(t),t.slice(0,120));
  x.keep.forEach(r=>ck(x.f+': keeps '+r,r.test(t)));x.drop.forEach(r=>ck(x.f+': drops '+r,!r.test(t)))}
 ck('no page errors',!errs.length,errs[0]);
 await b.close();console.log(bad?'FAILED '+bad:'messy_fixtures all '+n+' passed');process.exit(bad?1:0)})();
