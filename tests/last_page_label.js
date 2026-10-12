/* The reader's position label never says "last page" on page 1 (a short or cut-off story used to: 0 minutes left was read as "finished") */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x===undefined?'':x)}else console.log('ok',n)};
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:900,height:800}});await mock(p);await p.goto('file://'+APP);await p.waitForTimeout(1000);
 const r=await p.evaluate(()=>{const out={};const keep={np:R.np,ep:R.ep,pg:R.pg,words:R.words,ready:R.ready};
  R.ep=null;R.np=3;R.words=20;R.pg=0;out.first=pcText();R.pg=1;out.mid=pcText();R.pg=2;out.last=pcText();R.np=1;R.pg=0;out.one=pcText();Object.assign(R,keep);return out});
 ck('page 1 of 3 is not called the last page',!/last page/.test(r.first)&&/^1 \/ 3/.test(r.first),r.first);
 ck('page 2 of 3 is not called the last page',!/last page/.test(r.mid),r.mid);
 ck('page 3 of 3 is the last page',/3 \/ 3 · last page/.test(r.last),r.last);
 await b.close();console.log('last_page_label',bad?bad+' FAILED':'all passed');process.exit(bad?1:0)})();
