const fs=require('fs'),vm=require('vm');
const code=fs.readFileSync('/tmp/chk.js','utf8');
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
 console,setTimeout,clearTimeout,setInterval,clearInterval,performance,
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
setTimeout(()=>{console.log(errors.length?errors.slice(0,5):'no async errors');process.exit(0)},800);
