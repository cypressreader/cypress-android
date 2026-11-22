#!/usr/bin/env node
/* Speed: gives "unindexed" style rules a key the browser can index them by.
   A rule whose last part is only :is(a, b, c) (no class, id or tag of its own) is tried on EVERY element each time
   styles are worked out. This rewrites   P :is(a, b)X   as   P :is(a, b):where(ka)X, P :is(a, b):where(kb)X
   where ka / kb is the class, id or tag that a / b must end in. Same elements match, and :where() adds no weight,
   so the cascade is unchanged. Safe to run again (already-keyed rules are left alone).
   Run after adding CSS:  node scripts/css-keys.js        (--check: report only, exit 1 if something could be keyed) */
const fs=require('fs'),path=require('path');const FILE=process.argv.find(a=>/\.html$/.test(a))||path.resolve(__dirname,'../www/index.html');const CHECK=process.argv.includes('--check');
/* split at top-level occurrences of a separator test; respects (), [], strings */
function splitTop(s,isSep){const out=[];let d=0,q='',st=0;for(let i=0;i<s.length;i++){const c=s[i];if(q){if(c==='\\')i++;else if(c===q)q='';continue}if(c==='"'||c==="'"){q=c;continue}if(c==='\\'){i++;continue}if(c==='('||c==='[')d++;else if(c===')'||c===']')d--;else if(!d&&isSep(c)){out.push(s.slice(st,i));st=i+1}}out.push(s.slice(st));return out}
/* index where the last compound of a complex selector starts */
function lastCompoundAt(s){let d=0,q='',at=0;for(let i=0;i<s.length;i++){const c=s[i];if(q){if(c==='\\')i++;else if(c===q)q='';continue}if(c==='"'||c==="'"){q=c;continue}if(c==='\\'){i++;continue}if(c==='('||c==='[')d++;else if(c===')'||c===']')d--;else if(!d&&(c===' '||c==='>'||c==='+'||c==='~'||c==='\n'||c==='\t'))at=i+1}return at}
/* simple selectors of one compound: [{t:'tag'|'id'|'class'|'attr'|'pc'|'pe', s:text, name, args, a, b}] or null if not understood */
function simples(c){const out=[];let i=0;const id=/^(?:[-_a-zA-Z0-9 -￿]|\\.)+/;if(/[\/{}@&]/.test(c))return null;
 if(c[0]==='*'){out.push({t:'star',s:'*',a:0,b:1});i=1}else{const m=c.match(id);if(m&&c[0]!==':'){out.push({t:'tag',s:m[0],a:0,b:m[0].length});i=m[0].length}}
 while(i<c.length){const ch=c[i],a=i;if(ch==='#'||ch==='.'){const m=c.slice(i+1).match(id);if(!m)return null;i+=1+m[0].length;out.push({t:ch==='#'?'id':'class',s:c.slice(a,i),a,b:i})}
  else if(ch==='['){let d=0,q='';for(;i<c.length;i++){const x=c[i];if(q){if(x==='\\')i++;else if(x===q)q='';continue}if(x==='"'||x==="'")q=x;else if(x==='[')d++;else if(x===']'&&!--d){i++;break}}out.push({t:'attr',s:c.slice(a,i),a,b:i})}
  else if(ch===':'){const pe=c[i+1]===':';i+=pe?2:1;const m=c.slice(i).match(id);if(!m)return null;const name=m[0].toLowerCase();i+=m[0].length;let args=null;if(c[i]==='('){let d=0,q='';const s0=i+1;for(;i<c.length;i++){const x=c[i];if(q){if(x==='\\')i++;else if(x===q)q='';continue}if(x==='"'||x==="'")q=x;else if(x==='('||x==='[')d++;else if(x===')'||x===']'){if(!--d){args=c.slice(s0,i);i++;break}}}if(args===null)return null}
   out.push({t:pe||/^(before|after|first-line|first-letter)$/.test(name)?'pe':'pc',s:c.slice(a,i),name,args,a,b:i})}
  else return null}
 return out}
/* the keys a compound guarantees: ['.x'] / ['#y'] / ['p'], several when it is only :is(list); null = none */
function keysOf(c){const S=simples(c.trim());if(!S)return null;const pick=t=>S.find(x=>x.t===t);const k=pick('id')||pick('class')||pick('tag');if(k)return [k.s];if(pick('attr'))return ['[attr]'];
 for(const x of S)if(x.t==='pc'&&(x.name==='is'||x.name==='where')){const args=splitTop(x.args,ch=>ch===',').map(a=>a.trim());let all=[];for(const a of args){const kk=keysOf(a.slice(lastCompoundAt(a)));if(!kk){all=null;break}all.push(...kk)}if(all)return [...new Set(all)]}
 return null}
function fixSelector(sel){const lead=sel.match(/^\s*/)[0],s=sel.trim();if(!s)return null;const at=lastCompoundAt(s),comp=s.slice(at);const S=simples(comp);if(!S)return null;
 if(S.some(x=>x.t==='id'||x.t==='class'||x.t==='tag'||x.t==='attr'))return null;/* indexed already */
 const isw=x=>x.t==='pc'&&(x.name==='is'||x.name==='where'),multi=x=>splitTop(x.args,ch=>ch===',').length>1;
 if(S.some(x=>isw(x)&&!multi(x)&&(keysOf(x.s)||[]).length===1))return null;/* a single key inside :is()/:where(): the browser indexes it (this is also what a rule looks like after this script) */
 for(const x of S){if(!isw(x)||!multi(x))continue;
  const k=keysOf(x.s);if(!k||k.includes('[attr]')||k.length>24)continue;
  return k.map(key=>lead+s.slice(0,at)+comp.slice(0,x.b)+':where('+key+')'+comp.slice(x.b)).join(',')}
 return null}
function fixPrelude(p){const m=p.match(/^((?:\s|\/\*[\s\S]*?\*\/)*)([\s\S]*)$/),pre=m[1],body=m[2];if(!body.trim()||body.includes('/*'))return p;let ch=0;const parts=splitTop(body,c=>c===',').map(s=>{const f=fixSelector(s);if(f){ch++;return f}return s});return ch?(fixPrelude.n+=ch,pre+parts.join(',')):p}fixPrelude.n=0;
function mapPreludes(css,fn){let out='',i=0,start=0;const n=css.length;
 const skipBlock=j=>{let d=0,q='';for(;j<n;j++){const c=css[j];if(q){if(c==='\\')j++;else if(c===q)q='';continue}if(c==='/'&&css[j+1]==='*'){j=css.indexOf('*/',j+2);if(j<0)return n;j++;continue}if(c==='"'||c==="'")q=c;else if(c==='{')d++;else if(c==='}'&&!--d)return j+1}return n};
 while(i<n){const c=css[i];if(c==='/'&&css[i+1]==='*'){const e=css.indexOf('*/',i+2);i=e<0?n:e+2;continue}if(c==='"'||c==="'"){i++;while(i<n&&css[i]!==c){if(css[i]==='\\')i++;i++}i++;continue}
  if(c===';'||c==='}'){out+=css.slice(start,i+1);start=++i;continue}
  if(c==='{'){const prelude=css.slice(start,i),t=prelude.replace(/\/\*[\s\S]*?\*\//g,'').trim();
   if(t[0]==='@'){if(/^@(media|supports|container|layer|scope|starting-style)\b/i.test(t)){out+=css.slice(start,i+1);start=++i;continue}const e=skipBlock(i);out+=css.slice(start,e);start=i=e;continue}
   const e=skipBlock(i);out+=fn(prelude)+css.slice(i,e);start=i=e;continue}
  i++}
 return out+css.slice(start)}
const fixCss=css=>mapPreludes(css,fixPrelude);
if(require.main===module){const html=fs.readFileSync(FILE,'utf8');const res=html.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi,(m,a,css,z)=>a+fixCss(css)+z);
 if(CHECK){console.log(fixPrelude.n?fixPrelude.n+' selectors could be keyed: run node scripts/css-keys.js':'all keyed');process.exit(fixPrelude.n?1:0)}
 if(res!==html)fs.writeFileSync(FILE,res);console.log('keyed '+fixPrelude.n+' selectors in '+path.basename(FILE)+' ('+(res.length-html.length)+' bytes added)')}
module.exports={fixCss,fixSelector,mapPreludes,splitTop,lastCompoundAt,simples,keysOf};
