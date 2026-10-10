/* The inline script must parse. (A syntax error aborts the whole app, and other checks can still report "ok".) */
const fs=require('fs'),path=require('path');
const h=fs.readFileSync(path.join(__dirname,'..','www','index.html'),'utf8');
const scripts=[...h.matchAll(/<script>([^]*?)<\/script>/g)].map(m=>m[1]);
let bad=0;scripts.forEach((s,i)=>{try{new Function(s)}catch(e){bad++;console.log('FAIL script '+i+': '+e.message)}});
const same=fs.readFileSync(path.join(__dirname,'..','docs','app','index.html'),'utf8')===h;
if(!same){bad++;console.log('FAIL docs/app/index.html differs from www/index.html')}
console.log('syntax',bad?bad+' FAILED':'all passed ('+scripts.length+' scripts, copies identical)');process.exit(bad?1:0);
