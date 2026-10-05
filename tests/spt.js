const {APP,OUT}=require('./env');
const {mock,seed,PW}=require('./mock2');const {chromium}=require(PW);
(async()=>{const b=await chromium.launch();
for(const [name,w,h] of [['p',430,900],['t',1000,1200]]){
const ctx=await b.newContext({viewport:{width:w,height:h}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED/.test(m.text()))errs.push('c:'+m.text())});await mock(p,{n:6});
await p.addInitScript(s=>{localStorage.setItem('folio',JSON.stringify(s))},{...seed(['CNN','Wired','Verge']),sel:'all'});
await p.goto(('file://'+APP));await p.waitForTimeout(2500);
await p.evaluate(()=>document.querySelector('#gear').click());await p.waitForTimeout(600);
await p.screenshot({path:`sp/${name}-list.png`});
const info=await p.evaluate(()=>{const o={};o.pages=[...document.querySelectorAll('.spage')].map(s=>s.id+':'+s.querySelectorAll('.line').length+'/'+s.querySelectorAll('.smore .line').length);
o.legacyLines=[...document.querySelectorAll('#setlegacy .sbox>*')].filter(n=>!n.closest('[hidden]')).length;
o.leftTg=[...document.querySelectorAll('#setlegacy [data-tg]')].map(b=>b.dataset.tg);
o.leftover=[...document.querySelectorAll('#setlegacy .sgrp>.sbox>*')].map(n=>{const lb=n.querySelector&&n.querySelector('.lb');return lb?lb.firstChild.textContent:(n.id||n.className)}).join(' | ');
return o});console.log(name,JSON.stringify(info,null,0));
for(const id of ['look','read','feeds','alerts','sync','about']){
 await p.evaluate(id=>setShow(id),id);await p.waitForTimeout(300);
 await p.evaluate(()=>document.querySelectorAll('.smore').forEach(d=>d.open=false));
 await p.screenshot({path:`sp/${name}-${id}.png`});}
console.log(name,'errs',errs);await ctx.close()}
await b.close()})()
