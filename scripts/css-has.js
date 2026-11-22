#!/usr/bin/env node
/* Speed: story-page style rules must not use :has(). With them in the sheet, ANY class change in the app cost the browser
   about 25 times more (1.3 ms instead of 0.05 ms per restyle on a fast machine), and opening a story does about 100 restyles.
   This rewrites   X:has(ARG)   as   X[hz-abcd]   (and X:not(:has(ARG)) as X:not([hz-abcd])) for rules about the story page,
   and lists every (X's key, ARG, mark) in the HASX table inside the app; hasSync() in the app keeps the marks true.
   The mark is an attribute, not a class: a class on a plain <p> would stop p:not([class]) rules and code from seeing it as plain.
   Run after adding story-page CSS that uses :has():  node scripts/css-has.js      (--check: report only, exit 1 if any is left) */
const fs=require('fs'),path=require('path');const {mapPreludes,splitTop,simples}=require('./css-keys.js');
const FILE=process.argv.find(a=>/\.html$/.test(a))||path.resolve(__dirname,'../www/index.html');const CHECK=process.argv.includes('--check');
const SCOPE=/#rd|#sheet|\.cols|\.body|\.rf-next/;/* a selector about the story page */
const hash=s=>{let h=5381;for(const c of s)h=((h*33)^c.charCodeAt(0))>>>0;return h.toString(36)};
const TABLE=new Map();let left=0,done=0;
/* end of the (...) group opening at s[i]==='(' */
const close=(s,i)=>{let d=0,q='';for(;i<s.length;i++){const c=s[i];if(q){if(c==='\\')i++;else if(c===q)q='';continue}if(c==='"'||c==="'")q=c;else if(c==='('||c==='[')d++;else if(c===')'||c===']'){if(!--d)return i}}return -1};
/* the compound that holds position i, at i's own paren depth: [start,end) */
function compoundAround(s,i){let a=i,d=0;for(let j=i-1;j>=0;j--){const c=s[j];if(c===')'||c===']')d++;else if(c==='('||c==='['){if(!d)break;d--}else if(!d&&/[\s>+~,]/.test(c))break;a=j}
 let b=i;d=0;for(let j=i;j<s.length;j++){const c=s[j];if(c==='('||c==='[')d++;else if(c===')'||c===']'){if(!d)break;d--}else if(!d&&/[\s>+~,]/.test(c))break;b=j+1}return [a,b]}
function keyFor(s,i){/* the class/id/tag of the element the :has() at i is about; climbs out of :not( / :is( when :has() stands alone inside it */
 for(let guard=0;guard<4;guard++){const [a,b]=compoundAround(s,i);const S=simples(s.slice(a,b));if(!S)return null;if(S.some(x=>x.t==='tag'&&/^(body|html)$/i.test(x.s)))return null;/* page-wide ones are not the story's */const k=S.find(x=>x.t==='id')||S.find(x=>x.t==='class')||S.find(x=>x.t==='tag');if(k)return k.s;
  /* no key here: is this compound the whole argument of an enclosing :not( or :is( ? */if(a<1||s[a-1]!=='(')return null;const m=s.slice(0,a-1).match(/:(not|is|where)$/);if(!m)return null;
  if(m[1]!=='not'&&splitTop(s.slice(a,close(s,a-1)),c=>c===',').length>1)return null;/* :is(:has(a),:has(b)) stays */i=a-1-m[0].length}return null}
function fixSelector(sel){if(!sel.includes(':has(')||!SCOPE.test(sel))return sel;let s=sel,from=0;
 for(;;){const i=s.indexOf(':has(',from);if(i<0)break;const e=close(s,i+4);if(e<0)break;const arg=s.slice(i+5,e).trim().replace(/\s*([>+~,])\s*/g,'$1').replace(/\s+/g,' ');const key=keyFor(s,i);
  if(!key||arg.includes(':has(')||/:(focus|hover|active|checked)/.test(arg)){left++;from=e;continue}
  const cls='hz-'+hash(key+'|'+arg);TABLE.set(cls,[key,arg,cls]);s=s.slice(0,i)+'['+cls+']'+s.slice(e+1);done++;from=i}
 return s}
const fixPrelude=p=>{if(!p.includes(':has(')||p.includes('/*')&&p.replace(/^(\s|\/\*[\s\S]*?\*\/)*/,'').includes('/*'))return p;const m=p.match(/^((?:\s|\/\*[\s\S]*?\*\/)*)([\s\S]*)$/);return m[1]+splitTop(m[2],c=>c===',').map(fixSelector).join(',')};
const html=fs.readFileSync(FILE,'utf8');const M=/\/\*HASX\*\/(\[[\s\S]*?\])\/\*\/HASX\*\//;const cur=html.match(M);if(!cur){console.error('no /*HASX*/[...]/*/HASX*/ table in '+FILE);process.exit(2)}
for(const r of JSON.parse(cur[1]))TABLE.set(r[2],r);
let res=html.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi,(m,a,css,z)=>a+mapPreludes(css,fixPrelude)+z);
res=res.replace(M,()=>'/*HASX*/'+JSON.stringify([...TABLE.values()].sort((a,b)=>a[2]<b[2]?-1:1))+'/*/HASX*/');
if(CHECK){console.log(done?done+' story-page :has() could be replaced: run node scripts/css-has.js':'no story-page :has() left to replace'+(left?' ('+left+' kept on purpose)':''));process.exit(done?1:0)}
if(res!==html)fs.writeFileSync(FILE,res);console.log('replaced '+done+' :has() in '+path.basename(FILE)+'; table has '+TABLE.size+' entries; '+left+' story-page :has() kept as they are');
