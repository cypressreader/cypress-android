const {chromium}=require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright');
const {mock,seed}=require('/tmp/t/mock2.js');
(async()=>{const b=await chromium.launch();
const c=await b.newContext({viewport:{width:884,height:1000},hasTouch:true});const p=await c.newPage();
await mock(p,{n:12});await p.addInitScript(s=>{try{if(!localStorage.getItem('folio'))localStorage.setItem('folio',JSON.stringify(s))}catch(e){}},seed(['Alpha','Beta','Gamma']));
await p.goto('file:///mnt/user-data/outputs/cypress.html');await p.waitForTimeout(2500);
await p.evaluate(()=>{S.sel='today';render()});await p.waitForTimeout(800);
const ths=await p.evaluate(()=>[...document.querySelectorAll('[data-th]')].map(x=>x.dataset.th));
await p.evaluate(()=>document.querySelector('#gear').click());await p.waitForTimeout(500);const keys=await p.evaluate(()=>[...new Set([...document.querySelectorAll('#set [data-th]')].map(x=>x.dataset.th))]);await p.evaluate(()=>document.querySelector('#set').close());await p.waitForTimeout(300);
console.log('themes',keys&&keys.length);
const meas=()=>p.evaluate(()=>{const c=document.querySelector('.cover');const r=c&&c.getBoundingClientRect();const sb=document.querySelector('#sb,aside,.side');const sr=sb&&sb.getBoundingClientRect();return {theme:document.documentElement.dataset.theme,ch:r&&Math.round(r.height),cw:r&&Math.round(r.width),sw:document.documentElement.scrollWidth,iw:innerWidth,sbl:sr&&Math.round(sr.left),fs:getComputedStyle(document.documentElement).fontSize,z:getComputedStyle(document.documentElement).zoom,sy:scrollY}});
console.log('start',await meas());
const list=keys||[];const out=[];
for(const k of list){await p.evaluate(k=>{S.theme=k;applyTheme(false);save();render()},k);await p.waitForTimeout(500);out.push(await meas())}
const base=out[0];const odd=out.filter(o=>o.ch!==out[0].ch||o.sw>o.iw+1||o.sbl<0||o.fs!==out[0].fs);
console.log('distinct cover heights',[...new Set(out.map(o=>o.ch))]);
console.log('odd',JSON.stringify(odd.slice(0,12)));
await b.close()})();
