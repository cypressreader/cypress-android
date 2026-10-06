const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage();
await p.goto('file://'+require('path').resolve(__dirname,'../../www/index.html'));await p.waitForTimeout(1500);
const files=fs.readdirSync('d').filter(f=>f.startsWith('chunk')).sort();const all=[];
for(const f of files){const D=JSON.parse(fs.readFileSync('d/'+f,'utf8'));
 const r=await p.evaluate(D=>{
  const txt=h=>String(h||'').replace(/<[^>]+>/g,' ').replace(/&[a-z#0-9]+;/gi,' ').replace(/\s+/g,' ').trim();
  const lk=fr=>{const d=document.createElement('div');d.append(fr.cloneNode(true));const all=d.textContent.replace(/\s+/g,' ').trim().length||1;let l=0;d.querySelectorAll('a').forEach(a=>l+=a.textContent.replace(/\s+/g,' ').trim().length);return l/all};
  return D.map(d=>{
   const o={cat:d.cat,name:d.name,url:d.url};
   let list=[];try{list=parse(d.xml,{id:'x',url:d.url}).list}catch(e){o.parseErr=String(e).slice(0,60)}
   o.items=list.length;
   const ft=list.slice(0,15).map(a=>txt(a.html||a.summary||'').length);
   o.feedAvg=ft.length?Math.round(ft.reduce((a,b)=>a+b,0)/ft.length):0;
   o.shortShare=ft.length?+(ft.filter(n=>n<350).length/ft.length).toFixed(2):0;
   o.linkish=list.slice(0,15).filter(a=>{const h=a.html||'';const t=txt(h);const nl=(h.match(/<a /g)||[]).length;return t.length<500&&nl>=1&&nl>=t.length/150}).length;
   o.newest=Math.max(0,...list.map(a=>a.date||0));
   o.pages=d.pages.map((h,i)=>{
    const r={link:(d.links[i]||'').slice(0,90),raw:h.length};
    if(h.length<1500){r.blocked=true;return r}
    try{let f=extract(h,d.links[i]);if(!f){r.nullEx=true;return r}f=tidy(f);const t=f.textContent.replace(/\s+/g,' ').trim();r.len=t.length;r.foot=footerish(t);r.lk=+lk(f).toFixed(2);r.q=textQuality(t).ok;r.head=t.slice(0,90);
     const fa=list.find(a=>a.link===d.links[i]);r.feedLen=fa?txt(fa.html||fa.summary||'').length:-1}catch(e){r.err=String(e).slice(0,60)}
    return r})
   return o})},D);
 all.push(...r)}
fs.writeFileSync('report.json',JSON.stringify(all));console.log(all.length);await b.close()})()
