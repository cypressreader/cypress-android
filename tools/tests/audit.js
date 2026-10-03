const {mock,seed,PW}=require('/tmp/t/mock2.js');const {chromium}=require(PW);
let pass=0,fail=0;const ck=(n,c,x='')=>{console.log((c?'ok  ':'FAIL')+' '+n+' '+(c?'':x));c?pass++:fail++};
(async()=>{const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:390,height:800},hasTouch:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await mock(p,{n:6});await p.addInitScript(s=>{try{if(!localStorage.getItem('folio'))localStorage.setItem('folio',JSON.stringify(s))}catch(e){}},seed(['Alpha','Beta']));
await p.goto('file:///mnt/user-data/outputs/cypress.html');await p.waitForTimeout(2000);
const E=(f,a)=>p.evaluate(f,a);
// link guards
ck('webUrl rejects javascript:',await E(()=>webUrl('javascript:alert(1)')===''||webUrl('javascript:alert(1)')==null||!webUrl('javascript:alert(1)')));
ck('webUrl keeps https',await E(()=>/^https:\/\/a\.test/.test(webUrl('https://a.test/x'))));
ck('webUrl rejects data:',await E(()=>!webUrl('data:text/html,<b>x</b>')));
ck('esc escapes quote',await E(()=>esc("a'b").includes('&#39;')||!esc("a'b").includes("'")));
ck('okColor rejects url()',await E(()=>!okColor('red;background:url(x)')));
ck('okId rejects quote',await E(()=>!okId("a'b")));
// cleanLib
const cl=await E(()=>{const d=cleanLib({feeds:[{id:'ok1',url:'https://a.test/f'},{id:"x'y",url:'https://b.test'},{id:'ok2',url:'javascript:1'}],folders:[],saved:[{link:'javascript:1',title:'x'},{link:'https://a.test/1',title:'y'}]});return {f:d.feeds.length,s:d.saved.length}});
ck('cleanLib drops bad feeds and links',cl.f===1&&cl.s===1,JSON.stringify(cl));
// saved cap
const sc=await E(()=>{S.saved=Array.from({length:1200},(_,i)=>({link:'https://a.test/'+i,title:'t'+i,html:'<p>'+i+'</p>'}));capSaved();return {n:S.saved.length,h:S.saved.filter(a=>a.html).length}});
ck('saved cap 1000, html only newest 100',sc.n===1000&&sc.h<=100,JSON.stringify(sc));
// error log
await E(()=>elog('t','boom'));ck('error log records',await E(()=>ELOG.some(x=>x.g==='t'&&x.m==='boom')));
// date parsing
ck('pdate zone abbreviation',await E(()=>{const d=pdate('Fri, 02 Oct 2026 10:00:00 EDT');return Math.abs(d-Date.UTC(2026,9,2,14,0,0))<2000}));
ck('pdate future clamped',await E(()=>pdate('Fri, 02 Oct 2099 10:00:00 GMT')<=Date.now()+3.7e6));
// parse shapes
ck('parse RDF',await E(()=>{const l=parse('<?xml version="1.0"?><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns="http://purl.org/rss/1.0/"><channel><title>R</title></channel><item><title>One</title><link>https://r.test/1</link></item></rdf:RDF>',{url:'https://r.test/f'}).list;return l.length===1}));
ck('parse BOM + leading space',await E(()=>parse('﻿  \n<rss><channel><title>T</title><item><title>x</title><link>https://t.test/1</link></item></channel></rss>',{url:'https://t.test/f'}).list.length===1));
ck('JSON feed bad items ignored',await E(()=>parse(JSON.stringify({version:'https://jsonfeed.org/version/1.1',title:'J',items:[null,5,{title:'ok',url:'https://j.test/1'}]}),{url:'https://j.test/f'}).list.length===1));
// sync merge: deleted on one side stays deleted, both-side additions merged
const mg=await E(()=>{const base={feeds:[{id:'a',url:'https://a.test'},{id:'b',url:'https://b.test'}],folders:[],saved:[],hl:[]};
 const loc={feeds:[{id:'a',url:'https://a.test'},{id:'c',url:'https://c.test'}],folders:[],saved:[],hl:[]};
 const rem={feeds:[{id:'a',url:'https://a.test'},{id:'b',url:'https://b.test'},{id:'d',url:'https://d.test'}],folders:[],saved:[],hl:[]};
 try{const r=merge3(base.feeds.map(f=>f.id),loc.feeds,rem.feeds,f=>f.id,{},{});return r.map(f=>f.id).sort().join(',')}catch(e){return 'ERR '+e.message}});
ck('merge3: local delete b kept, adds c and d',mg==='a,c,d',mg);
// askBox
await E(()=>{window.__r=null;askBox({title:'T',text:'x',ok:'Yes'}).then(v=>{window.__r=v})});await p.waitForTimeout(400);
ck('askBox resolves true (auto)',await E(()=>window.__r===true));
await E(()=>{window.__r=null;askBox({title:'T',input:true,value:'abc'}).then(v=>{window.__r=v})});await p.waitForTimeout(400);
ck('askBox returns input text',await E(()=>typeof window.__r==='string'));
// duplicate add
const n0=await E(()=>S.feeds.length);
await E(()=>{findFeed=async u=>({url:S.feeds[0].url,xml:'<rss><channel><title>T</title><item><title>x</title><link>https://a.test/1</link></item></channel></rss>'})});
await E(()=>{document.querySelector('#add').click()});await p.waitForTimeout(200);
await p.fill('#u',await E(()=>S.feeds[0].url));await p.waitForTimeout(200);
ck('inFeeds sees existing feed',await E(()=>inFeeds(S.feeds[0].url)));
ck('no feed count change',await E(()=>S.feeds.length)===n0);
// freeze blocks saves
await E(()=>{freezeApp();localStorage.setItem('folio','{"feeds":[],"folders":[]}');S.feeds.push({id:'zz',url:'https://z.test'});save()});
ck('frozen app does not overwrite storage',await E(()=>localStorage.getItem('folio')==='{"feeds":[],"folders":[]}'));
ck('no page errors',errs.length===0,errs.join('|'));
console.log('pass',pass,'fail',fail);await b.close()})();
