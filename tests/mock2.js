const zlib=require('zlib');
function png(w,h,rgb){const raw=Buffer.alloc((w*3+1)*h);for(let y=0;y<h;y++){raw[y*(w*3+1)]=0;for(let x=0;x<w;x++){const o=y*(w*3+1)+1+x*3;raw[o]=rgb[0];raw[o+1]=(x*255/w)|0;raw[o+2]=rgb[2]}}
 const crc=b=>{let c,t=[];for(let n=0;n<256;n++){c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0}c=0xffffffff;for(const x of b)c=t[(c^x)&255]^(c>>>8);return (c^0xffffffff)>>>0};
 const ch=(ty,d)=>{const l=Buffer.alloc(4);l.writeUInt32BE(d.length);const td=Buffer.concat([Buffer.from(ty),d]);const c=Buffer.alloc(4);c.writeUInt32BE(crc(td));return Buffer.concat([l,td,c])};
 const ih=Buffer.alloc(13);ih.writeUInt32BE(w,0);ih.writeUInt32BE(h,4);ih[8]=8;ih[9]=2;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),ch('IHDR',ih),ch('IDAT',zlib.deflateSync(raw)),ch('IEND',Buffer.alloc(0))])}
const IMG=png(640,400,[40,90,160]);
const long=n=>Array.from({length:n},(_,i)=>`<p>Paragraph ${i} of the article body with enough words to look like real reporting, and a bit more text so it reaches a realistic length for extraction.</p>`).join('');
const now=Date.now();
function feed(name,n){
 const it=i=>{
  if(name==='Pod')return `<item><title>Pod episode ${i}</title><link>https://pod.test/ep-${i}</link><pubDate>${new Date(now-i*9e5).toUTCString()}</pubDate><description>Episode notes ${i}. ${'Talk about things. '.repeat(20)}</description><enclosure url="https://pod.test/ep-${i}.mp3" type="audio/mpeg" length="1"/><itunes:duration>2520</itunes:duration></item>`;
  if(name==='Tube')return `<entry><title>Tube video ${i}</title><link rel="alternate" href="https://www.youtube.com/watch?v=abcdefghij${i}"/><yt:videoId>abcdefghij${i}</yt:videoId><published>${new Date(now-i*9e5).toISOString()}</published><media:group><media:description>Video description</media:description></media:group></entry>`;
  return `<item><title>${name} story ${i}</title><link>https://${name.toLowerCase()}.test/story-${i}</link><pubDate>${new Date(now-i*9e5-name.length*1e4).toUTCString()}</pubDate><description>Short summary for story ${i}.</description><media:content url="https://${name.toLowerCase()}.test/img-${i}.png" medium="image"/></item>`};
 if(name==='Tube')return `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom" xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/"><title>Tube</title>${Array.from({length:n},(_,i)=>it(i+1)).join('')}</feed>`;
 return `<?xml version="1.0"?><rss xmlns:media="http://search.yahoo.com/mrss/" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"><channel><title>${name}</title>${Array.from({length:n},(_,i)=>it(i+1)).join('')}</channel></rss>`;
}
const article=(t,h)=>`<html><body><article><h1>${t}</h1><figure><img src="https://${h}/photo-a.png" width="640" height="400"></figure>${long(10)}<figure><img src="https://${h}/photo-b.png" width="640" height="400"></figure>${long(6)}</article></body></html>`;
const KV={};
async function mock(p,opt={}){
 if(!opt.noAsk){
  try{await p.exposeFunction('__np',()=>{const v=p.nextPrompt;p.nextPrompt=undefined;return v==null?'':String(v)})}catch(e){}
  await p.addInitScript(()=>{const go=async d=>{if(d.__t)return;d.__t=1;await new Promise(r=>requestAnimationFrame(()=>r()));const i=d.querySelector('#ask-i');if(i){const v=await window.__np();i.value=v}const b=d.querySelector('[data-a="1"]');b&&b.click()};new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.id==='ask')setTimeout(()=>go(n),0)}).observe(document,{childList:true,subtree:true})});
 }
 await p.addInitScript(()=>{addEventListener('load',()=>{const o=window.setShow;if(!o||window.__noall)return;window.setShow=function(){o.apply(this,arguments);document.querySelectorAll('.spage').forEach(s=>s.hidden=false);set.classList.add('inpage');document.querySelectorAll('.smore').forEach(d=>d.open=true)}})});
 if(!process.env.ACC)await p.addInitScript(()=>{document.addEventListener('DOMContentLoaded',()=>{for(const sh of document.styleSheets){let r;try{r=sh.cssRules}catch(e){continue}for(let i=r.length-1;i>=0;i--){const t=r[i].selectorText||'';if(t==='.snav'||/^\.sgrp:not\(\.open\)/.test(t))sh.deleteRule(i)}}})});
 await p.route(/^https?:\/\/(?!localhost)/,async r=>{
  const req=r.request(),u=decodeURIComponent(req.url());
  if(u.startsWith('https://relay.test/sync')){
   if(opt.noKV)return r.fulfill({status:501,body:'no storage',headers:{'Access-Control-Allow-Origin':'*'}});
   const id=new URL(req.url()).searchParams.get('id');
   if(req.method()==='OPTIONS')return r.fulfill({status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,PUT,OPTIONS','Access-Control-Allow-Headers':'Content-Type'}});
   if(req.method()==='PUT'){KV[id]=req.postData();return r.fulfill({status:200,body:'ok',headers:{'Access-Control-Allow-Origin':'*'}})}
   return r.fulfill({status:KV[id]?200:404,body:KV[id]||'',headers:{'Access-Control-Allow-Origin':'*'}});
  }
  if(/\.test\/.*\.png/.test(u)&&!u.includes('corsproxy'))return r.fulfill({status:200,contentType:'image/png',body:IMG});
  const m=u.match(/https?:\/\/(\w+)\.test\/(feed|story-\d+|ep-\d+)/);
  if(u.includes('corsproxy.io')&&m){
   const nm=m[1][0].toUpperCase()+m[1].slice(1);
   if(m[2]==='feed')return r.fulfill({status:200,contentType:'text/xml',body:feed(nm,opt.n||6)});
   return r.fulfill({status:200,contentType:'text/html',body:article(nm+' '+m[2],m[1]+'.test')});
  }
  return r.abort();
 });
}
const seed=(feeds,extra={})=>({feeds:feeds.map((n,i)=>({id:'f'+i,title:n,url:`https://${n.toLowerCase()}.test/feed`,folder:i<2?'d1':''})),folders:[{id:'d1',name:'Tech'}],sel:'all',scroll:'pages',ver:'2026.10.06e',intro:false,todayIntro:1,...extra});
module.exports={mock,seed,KV,PW:require('child_process').execSync('npm root -g').toString().trim()+'/playwright'};
