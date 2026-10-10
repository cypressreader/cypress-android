/* Quote of the day names the person quoted (many phrasings); a story with a named speaker is preferred; the outlet stands in only when no speaker can be found. */
const fs=require('fs'),path=require('path');const {APP}=require('./env');
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
const s=fs.readFileSync(APP,'utf8');const a=s.indexOf('function nrQuoteText'),b=s.indexOf('function nrQuoteHtml'),c=s.indexOf('function quoteBy'),d=s.indexOf('function briefQuote');
eval(s.slice(a,b)+s.slice(c,d)+';globalThis.nq=nrQuoteText;globalThis.qb=quoteBy;');
const T=[
['said: before the quote','Foreign Secretary David Lammy said: “We will not stand by while civilians are put at risk in this conflict, and we urge all sides to step back.” Talks resume on Monday.',/David Lammy/],
['told the BBC, with age','“It was the worst night of my life and I never want to go through it again,” Mohammed Khan, 34, told the BBC. Floods hit the region.',/^Mohammed Khan$/],
['name, a spokeswoman, said','Sarah Jones, a spokeswoman for the charity, said “we are overwhelmed by the response from the public and cannot thank people enough”.',/^Sarah Jones$/],
['said local fisherman NAME','“We have never seen anything like this in forty years of fishing here,” said local fisherman Tom Bell.',/^Tom Bell$/],
['colon form','Police Chief Inspector Anna Reyes: “The suspect fled on foot and we are asking anyone with information to come forward immediately.”',/Anna Reyes/],
['wrote on X that','The company’s boss, Elon Musk, wrote on X that “the new rocket will fly before the end of the year, and we will not delay it again”.',/^Elon Musk$/],
['according to Dr','“Nobody could have predicted how quickly the water would rise in the valley,” according to Dr Priya Patel of the Met Office.',/Priya Patel/],
['only a job title is not a name','“This is a landmark moment for the whole country and the people who fought for it,” the Prime Minister said.',/^$/],
['pronoun is not a name','“We have never seen anything like this in forty years of fishing here,” he said. Tom Bell, 61, has fished the bay since 1984.',/^$/]];
for(const [n,t,re] of T){const q=nq({summary:t});ck(n,q&&q.real&&re.test(qb({summary:t},q.q)),JSON.stringify(q&&qb({summary:t},q.q)))}
const q=nq({summary:'“Plain words with no speaker named anywhere in this sentence at all,” the report concluded.'});ck('no speaker: empty (outlet used)',qb({summary:'“Plain words with no speaker named anywhere in this sentence at all,” the report concluded.'},q.q)==='');
(async()=>{const {mock,PW}=require('./mock');const {chromium}=require(PW);const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:412,height:860}})).newPage();await mock(p,{n:10});await p.goto('file://'+APP);await p.waitForTimeout(1200);await p.click('text=Get started').catch(()=>{});
 const h=await p.evaluate(()=>{const f=S.feeds[0].id,now=Date.now();const mk=(i,sm)=>({feedId:f,title:'Story '+i,link:'https://w.test/q'+i,date:now-i*6e4,summary:sm});const A=mk(1,'“Plain words with no speaker named anywhere in this sentence at all,” the report concluded.'),B=mk(2,'“We have never seen anything like this in forty years of fishing here,” said local fisherman Tom Bell.');items[f]=[A,B];cur=[];return briefQuote([A,B])+'|'+(()=>{items[f]=[A];cur=[];return briefQuote([A])})()});
 const [one,two]=h.split('|');ck('a story with a named speaker beats an earlier one without',/Tom Bell/.test(one)&&/forty years/.test(one),one);ck('no speaker anywhere: outlet name shows',/Plain words/.test(two)&&!/bq-by/.test(two),two);await b.close();
 console.log(bad?'brief_quote '+bad+' FAILED':'brief_quote all passed');process.exit(bad?1:0);})();
