/* Regression: with real-world-shaped feed data the Daily must render the magazine (cover, sections, back cover), never the plain card list.
   Shapes: normal, image-only (NASA APOD style), no dates, sparse fields (missing title/summary/img/author), old items, very few stories, a single story. */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
const SH={};const shapes={
 normal:(f,fi,now)=>Array.from({length:12},(_,i)=>({feedId:f.id,title:'Story '+fi+' '+i+' about things',link:'https://w.test/'+fi+'/'+i,date:now-(i*5+fi)*3600e3,summary:'text '.repeat(30),img:i%2?'https://img.test/'+i+'.jpg':''})),
 apod:(f,fi,now)=>Array.from({length:10},(_,i)=>({feedId:f.id,title:'APOD: Nebula '+i,link:'https://apod.test/'+i,date:now-(i*24+fi)*3600e3,summary:'',img:'https://img.test/a'+i+'.jpg'})),
 nodate:(f,fi,now)=>Array.from({length:10},(_,i)=>({feedId:f.id,title:'No date '+i,link:'https://nd.test/'+fi+'/'+i,summary:'x',img:''})),
 sparse:(f,fi,now)=>Array.from({length:10},(_,i)=>({feedId:f.id,title:i%3?'Sparse '+i:undefined,link:'https://sp.test/'+fi+'/'+i,date:i%2?now-i*36e5:undefined,summary:undefined,img:undefined,author:null})),
 old:(f,fi,now)=>Array.from({length:10},(_,i)=>({feedId:f.id,title:'Old '+fi+' '+i,link:'https://old.test/'+fi+'/'+i,date:now-(20+i)*864e5,summary:'x',img:'https://img.test/o'+i+'.jpg'})),
 few:(f,fi,now)=>Array.from({length:fi?1:3},(_,i)=>({feedId:f.id,title:'Few '+fi+' '+i,link:'https://few.test/'+fi+'/'+i,date:now-i*36e5,summary:'x',img:''})),
 one:(f,fi,now)=>fi?[]:[{feedId:f.id,title:'The only story',link:'https://one.test/1',date:now-36e5,summary:'x',img:''}],
 mixed:(f,fi,now)=>fi===0?SH.apod(f,fi,now):fi===1?SH.sparse(f,fi,now):fi===2?SH.nodate(f,fi,now):SH.normal(f,fi,now)
};
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
(async()=>{
 for(const W of [412,1100])for(const [name,fn] of Object.entries(shapes)){
  const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:W,height:860}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});
  const r=await p.evaluate(async([name,all])=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const now=Date.now();const SH={};for(const k in all)SH[k]=eval('('+all[k]+')');const fn=SH[name];
   S.feeds.slice(0,4).forEach((f,fi)=>{items[f.id]=fn(f,fi,now);state[f.id]='ok'});S.edn=null;S.sel='today';S.cards='compact';
   let err='';try{render()}catch(e){err=String(e&&e.message)}await new Promise(r=>setTimeout(r,900));
   const g=document.querySelector('#grid');return {err,cov:!!g.querySelector('.dcov'),sec:g.querySelectorAll('.dsec2').length,back:!!g.querySelector('.dback,.colo'),plain:g.dataset.cards==='narrow'&&!g.querySelector('.dcov')}},[name,Object.fromEntries(Object.entries(shapes).map(([k,v])=>[k,v.toString()]))]).catch(e=>({err:'eval '+e.message}));
  ck(W+' '+name+' renders magazine',!r.err&&r.cov&&r.sec>=1&&r.back&&!r.plain,JSON.stringify(r));
  ck(W+' '+name+' no page errors',!errs.length,errs[0]);
  await b.close();
 }
 console.log('daily_real',bad?bad+' FAILED':'all passed');process.exit(bad?1:0);
})();
