/* Theme picker: exactly one theme shows as selected (and matches the active theme), even though a few themes are listed in two groups; and the edition progress line on the Minimal cover is readable on every theme. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x===undefined?'':x)}else console.log('ok',n)};
(async()=>{
 const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:412,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(400);
 const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));
  $('#set').showModal();await w(300);document.querySelectorAll('#thm details').forEach(d=>{d.open=true});await w(400);const themes=[...new Set([...document.querySelectorAll('#thm button[data-th]')].map(b=>b.dataset.th))];
    const bads=[];for(const th of themes){document.querySelector('#thm button[data-th="'+th+'"]').click();await w(120);
   const on=[...document.querySelectorAll('#thm button.on')],pr=[...document.querySelectorAll('#thm button[aria-pressed="true"]')];
   /* the quick switch and the full list can show the same theme: count themes, not buttons */const onT=new Set(on.filter(b=>b.dataset.th).map(b=>b.dataset.th)),prT=new Set(pr.filter(b=>b.dataset.th).map(b=>b.dataset.th));
   if(onT.size!==1||prT.size!==1||!onT.has(th)||(S.theme||'auto')!==th)bads.push([th,[...onT],[...prT],S.theme])}
  return {n:themes.length,bads}});
 ck('the picker lists several themes',r.n>=20,String(r.n));
 ck('for every theme, exactly one button is pressed and it is the active theme',!r.bads.length,JSON.stringify(r.bads.slice(0,4)));
 /* edition progress text on the Minimal cover */
 const c=await p.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));document.querySelectorAll('dialog[open]').forEach(d=>d.close());const now=Date.now();
  const uw=n=>{let x=(n+3)*7919,o='';for(let k=0;k<6;k++){o+=String.fromCharCode(97+x%26);x=Math.floor(x/26)+k*5+1}return o};
  S.feeds.slice(0,4).forEach((f,fi)=>{items[f.id]=Array.from({length:14},(_,i)=>({feedId:f.id,title:[0,1,2,3].map(k=>uw((fi*14+i)*4+k+40)).join(' '),link:'https://w.test/'+fi+'/'+i,date:now-(i*55+fi*9+30)*6e4,summary:'A standfirst.',img:'',html:'<p>'+'Body. '.repeat(40)+'</p>'}));state[f.id]='ok'});
  const d0=new Date();if(d0.getHours()<5)d0.setDate(d0.getDate()-1);const dn=Math.floor(Date.UTC(d0.getFullYear(),d0.getMonth(),d0.getDate())/864e5);
  const L=c=>{const m=String(c).match(/[\d.]+/g);if(!m)return null;return {l:(0.2126*m[0]+0.7152*m[1]+0.0722*m[2])/255,a:m.length>3?+m[3]:1}};
  const bgOf=el=>{for(let e=el;e;e=e.parentElement){const q=L(getComputedStyle(e).backgroundColor);if(q&&q.a>.5)return q.l}return L(getComputedStyle(document.body).backgroundColor).l};
  const out={};for(const [th,sch] of [['typewriter','light'],['typewriter','dark'],['light','light'],['mono','light'],['sepia','light'],['dark','dark'],['rose','light'],['inkwash','light']]){
   S.theme=th;S.sch=sch;S.cvt={n:dn,t:'min',p:''};applyTheme(false);S.sel='today';render();await w(600);
   const t=[...document.querySelectorAll('#grid *')].find(e=>e.children.length===0&&/\d+ (stories|story) left|Edition finished/.test(e.textContent));if(!t){out[th+'/'+sch]='missing';continue}
   const f=L(getComputedStyle(t).color).l,g=bgOf(t),hi=Math.max(f,g)+.05,lo=Math.min(f,g)+.05;out[th+'/'+sch]=+(hi/lo).toFixed(2)}
  return out});
 const low=Object.entries(c).filter(([k,v])=>v==='missing'||v<4.5);
 ck('the edition progress text is readable (contrast 4.5 or more) on the Minimal cover in light and dark themes',!low.length,JSON.stringify(low));
 ck('no page errors',!errs.length,errs[0]);
 await b.close();console.log('theme_picker',bad?bad+' FAILED':'all passed');process.exit(bad?1:0);
})();
