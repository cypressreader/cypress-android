const {APP,OUT}=require('./env');
const fs=require('fs'),vm=require('vm');
const code=fs.readFileSync(OUT+'/chk.js','utf8');
const mk=(name='x')=>{
 const f=function(){};
 const store={};
 const p=new Proxy(f,{
  get(t,k){
   if(k===Symbol.toPrimitive)return()=>'';
   if(k==='then')return undefined;
   if(k==='length')return 0;
   if(k==='classList')return {toggle(){},add(){},remove(){},contains(){return false}};
   if(k==='style')return {setProperty(){},removeProperty(){}};
   if(k==='dataset')return store;
   if(k==='value'||k==='textContent'||k==='innerHTML'||k==='title'||k==='href')return store[k]!==undefined?store[k]:'';
   if(k==='open'||k==='hidden'||k==='disabled'||k==='checked')return !!store[k];
   if(k==='files')return [];
   if(k in store)return store[k];
   return mk(String(k));
  },
  set(t,k,v){store[k]=v;return true},
  apply(){return mk('ret')},
  construct(){return mk('new')}
 });
 return p;
};
const ls={};
const errors=[];
const doc=mk('document');
const ctx={
 console,setTimeout,clearTimeout,setInterval,clearInterval,performance,MutationObserver:class{observe(){}disconnect(){}},HTMLDialogElement:class{},IntersectionObserver:class{observe(){}unobserve(){}disconnect(){}},
 localStorage:{getItem:k=>ls[k]===undefined?null:ls[k],setItem:(k,v)=>{ls[k]=String(v)},removeItem:k=>{delete ls[k]}},
 document:new Proxy({},{get:(t,k)=>k==='hidden'?false:k==='documentElement'?mk('html'):k==='body'?mk('body'):k==='addEventListener'?(()=>{}):k==='querySelectorAll'?(()=>[]):k==='createTreeWalker'?(()=>({nextNode:()=>null})):k==='createElement'?(()=>mk('el')):mk(String(k))}),
 navigator:{onLine:true,language:'en-US'},
 matchMedia:()=>({matches:false}),
 fetch:()=>Promise.reject(new Error('offline')),
 AbortController,AbortSignal,URL,Blob,
 DOMParser:class{parseFromString(){return{body:{childNodes:[],textContent:''},querySelector:()=>null,querySelectorAll:()=>[],documentElement:{outerHTML:''},head:{prepend(){}},createElement:()=>mk('el')}}},
 getSelection:()=>({toString:()=>''}),
 addEventListener(){},innerWidth:1000,innerHeight:800,
 speechSynthesis:{onvoiceschanged:null,getVoices:()=>[],cancel(){},speak(){}},
 SpeechSynthesisUtterance:class{},NodeFilter:{SHOW_TEXT:4},
 Range:class{setStart(){}setEnd(){}},Highlight:class{},
 requestAnimationFrame:f=>setTimeout(f,0),cancelAnimationFrame:clearTimeout,
 alert(){},confirm(){return true},prompt(){return null},location:{protocol:'file:',reload(){}},
};
ctx.window=ctx;ctx.CSS={highlights:{set(){},delete(){}}};
ctx.window.speechSynthesis=ctx.speechSynthesis;
process.on('unhandledRejection',e=>errors.push('unhandled: '+e));
vm.createContext(ctx);
try{vm.runInContext(code,ctx);console.log('BOOT OK (script ran through init incl. render + loadAll)')}
catch(e){console.log('BOOT ERROR:',e.stack.split('\n').slice(0,4).join('\n'))}


const run=c=>vm.runInContext(c,ctx);
const T=(name,c)=>{try{const r=run(c);console.log('PASS',name,r===undefined?'':'-> '+JSON.stringify(r))}catch(e){console.log('FAIL',name,'::',e.message.split('\n')[0])}};
run(`
 items.a1=[{feedId:'a1',title:'NASA launches rocket to Mars this week',link:'https://x.com/1',date:Date.now()-1e6,img:'https://i/1.jpg',html:'<p>hi <a href="https://other.com/full">Read the full article</a></p>',summary:'nasa rocket mars',wc:900},{feedId:'a1',title:'Other story about phones',link:'https://x.com/2',date:Date.now()-2e6,img:'',html:'',summary:'phones',wc:100}];
 items.a2=[{feedId:'a2',title:'NASA launches rocket toward Mars this week say officials',link:'https://y.com/1',date:Date.now()-5e5,img:'',html:'',summary:'x',wc:0}];
 items.a4=[{feedId:'a4',title:'World news today',link:'https://z.com/1',date:Date.now(),img:'',html:'',summary:'',wc:0}];
 S.sk=[{id:'k1',name:'Space',words:['nasa','mars']}];
 S.hl=[{id:'h1',link:'https://x.com/1',q:'launches rocket',off:5,note:'good',t:Date.now(),art:{feedId:'a1',title:'NASA launches',link:'https://x.com/1',date:1,img:'',ft:'TechCrunch',fu:'https://techcrunch.com/feed/',fc:'#0a9e4b'}}];
 S.saved=[{feedId:'a1',title:'Saved one',link:'https://x.com/s',date:1,html:'',summary:'',ft:'T',fu:'',fc:'#000'}];
`);
for(const sel of ['today','all','saved','notes','k:k1','f:f1','s:a1']){
 for(const view of ['tiles','list']){
  T('render '+sel+' '+view,"S.sel='"+sel+"';S.view='"+view+"';render();cur.length");
 }
}
T('hideRead+sort source',"S.sel='all';S.hideRead=true;S.sort='source';S.read['https://x.com/2']=1;render();const n=cur.length;S.hideRead=false;S.sort='new';n");
T('group merges NASA duplicates',"S.sel='all';S.group=true;render();cur.filter(a=>a.more&&a.more.length).length");
T('kmatch',"kmatch(S.sk[0],{title:'Mars rover',summary:''})&&!kmatch(S.sk[0],{title:'Phones',summary:''})");
T('kcount',"kcount(S.sk[0])");
T('readMin from wc & rt',"[readMin({link:'q',wc:900}),readMin({link:'q',wc:100}),(S.rt['r']=7,readMin({link:'r'}))]");
T('relayUrl',"[relayUrl('a.workers.dev'),relayUrl('https://a.workers.dev/?url='),relayUrl('')]");
T('outLinks (DOMParser stubbed)',"typeof outLinks");
T('renderMng',"renderMng();1");
T('renderSf',"renderSf();1");
T('hlClick copy/del paths',"hlClick({target:{closest:()=>null}})");
T('mnMarkup/pbMarkup',"mnMarkup().includes('data-act')&&pbMarkup().includes('pbq')");
T('acPut eviction & saved kept',"AC={};S.saved=[{link:'l0'}];for(let i=0;i<40;i++)acPut('l'+i,'<p>'+i+'</p>');[Object.keys(AC).length,!!AC.l0,!!AC.l39,!!AC.l1]");
T('acGet',"acGet('l39')");
T('posAt anchoring',"(()=>{const m={nodes:[{n:{data:'Hello '},s:0},{n:{data:'world foo'},s:6}]};const t='Hello world foo';const i=t.indexOf('world');const a=posAt(m,i),b=posAt(m,i+5);return [a[1],b[1],a[0].data,b[0].data]})()");
T('ttsEnd queue selection',"S.queue=true;S.sel='all';render();curA=cur[0];const idx=cur.findIndex(x=>x.link===curA.link);idx");
T('openReader runs',"S.sel='all';render();openReader(cur[0]).then(()=>{globalThis.__or='done'},e=>{globalThis.__or='ERR '+e.message});1");
T('toggleWeb/loadWeb defined',"typeof toggleWeb+typeof loadWeb");
T('doAct unread',"doAct('unread');1");
T('setAuto',"S.auto=15;setAuto();clearInterval(arT);1");
T('updVw',"updVw();1");
setTimeout(()=>{console.log('openReader result:',ctx.__or);console.log(errors.length?errors.slice(0,5):'no async errors');process.exit(0)},1500);
