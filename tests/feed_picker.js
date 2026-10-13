/* First-run feed picker: ONE selected state. A selected source shows a filled circle with a check and a dark border; an unselected one shows an empty ring and no highlight. The look, the aria state and the count always agree, and tapping again leaves no trace of the selection. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x===undefined?'':x)}else console.log('ok',n)};
(async()=>{
 const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:412,height:860}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});await p.waitForTimeout(400);
 const r=await p.evaluate(async()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const w=ms=>new Promise(r=>setTimeout(r,ms));
  obOpen(false);OB.step=2;obRender();await w(500);
  const all=()=>[...document.querySelectorAll('[data-obsrc]')];
  const look=x=>{const d=x.querySelector('b'),cs=getComputedStyle(d),af=getComputedStyle(d,'::after');return {on:x.classList.contains('on'),pressed:x.getAttribute('aria-pressed'),fill:cs.backgroundColor!=='rgba(0, 0, 0, 0)',check:af.content!=='none'&&af.content!=='normal',ringShadow:cs.boxShadow!=='none'}};
  const consistent=()=>all().every(x=>{const l=look(x);return l.on===l.fill&&l.on===l.check&&(l.pressed===null||l.pressed===String(l.on))&&!l.ringShadow});
  const o={};o.initialConsistent=consistent();
  const x=all().find(y=>!y.classList.contains('on'))||all()[0];
  const wasOn=x.classList.contains('on');
  if(wasOn){x.click();await w(120)}
  o.off=look(x);o.countOff=+$('#obcount').textContent;
  x.click();await w(150);o.on=look(x);o.countOn=+$('#obcount').textContent;o.consistentOn=consistent();
  x.click();await w(150);o.off2=look(x);o.countOff2=+$('#obcount').textContent;o.consistentOff=consistent();
  /* every source, selected and unselected: still consistent after an Add all / Remove all */
  const pk=document.querySelector('[data-obpack]');if(pk){pk.click();await w(150);o.consAll1=consistent();pk.click();await w(150);o.consAll2=consistent()}
  return o});
 ck('every source starts consistent (look = state)',r.initialConsistent);
 ck('unselected: empty ring, no fill, no check, no leftover color ring',!r.off.on&&!r.off.fill&&!r.off.check&&!r.off.ringShadow,JSON.stringify(r.off));
 ck('selected: filled circle with a check, and the state says pressed',r.on.on&&r.on.fill&&r.on.check&&(r.on.pressed===null||r.on.pressed==='true'),JSON.stringify(r.on));
 ck('tapping again removes every trace (no dot stays behind)',!r.off2.on&&!r.off2.fill&&!r.off2.check&&!r.off2.ringShadow&&r.countOff2===r.countOff,JSON.stringify([r.off2,r.countOff,r.countOff2]));
 ck('the selected count goes up by one and back',r.countOn===r.countOff+1,JSON.stringify([r.countOff,r.countOn]));
 ck('look and state agree for every source after taps',r.consistentOn&&r.consistentOff);
 ck('look and state agree after Add all and Remove all',r.consAll1===undefined||(r.consAll1&&r.consAll2),JSON.stringify([r.consAll1,r.consAll2]));
 ck('no page errors',!errs.length,errs[0]);
 await b.close();console.log('feed_picker',bad?bad+' FAILED':'all passed');process.exit(bad?1:0);
})();
