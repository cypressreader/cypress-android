// For sites where the page reader found no article, try what the app really does (all its fallbacks).
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const rep=JSON.parse(fs.readFileSync('report.json','utf8'));
 const want=new Set(rep.filter(r=>r.pages&&r.pages.length&&r.pages.every(p=>p.nullEx||p.blocked)&&r.items>0).map(r=>r.name));
 const D=[];for(const f of fs.readdirSync('d').filter(f=>f.startsWith('chunk')))for(const d of JSON.parse(fs.readFileSync('d/'+f,'utf8')))if(want.has(d.name))D.push({name:d.name,links:d.links});
 const b=await chromium.launch();const p=await b.newPage();
 await p.goto('file://'+path.resolve(__dirname,'../../www/index.html'));await p.waitForTimeout(1500);
 const out=[];
 for(let i=0;i<D.length;i+=4){const chunk=D.slice(i,i+4);
  out.push(...await Promise.all(chunk.map(d=>p.evaluate(async d=>{const r={name:d.name,pages:[]};
   for(const l of d.links.slice(0,1)){try{const n=await Promise.race([getFull(l),new Promise(r=>setTimeout(()=>r('timeout'),25000))]);
    if(n==='timeout'){r.pages.push('timed out');continue}if(!n){r.pages.push('could not load');continue}
    const t=(n.textContent||'').replace(/\s+/g,' ').trim();const ls=linkShare(n);
    r.pages.push(footerish(t)?'site footer instead of article':ls>=.4?'mostly links':t.length<350?'very short ('+t.length+' chars)':'OK ('+t.length+' chars)')}catch(e){r.pages.push('error')}}
   return r},d))))}
 const bad=out.filter(r=>!r.pages.every(x=>/^OK/.test(x)));
 console.log('\n## Reading the full article, as the app does it, for sites where the plain page reader found nothing');
 console.log('OK:',out.length-bad.length,' Not OK:',bad.length);
 bad.forEach(r=>console.log(' -',r.name+':',r.pages.join(', ')));
 await b.close()})()
