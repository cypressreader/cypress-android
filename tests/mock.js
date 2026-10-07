// shared mock network for playwright tests
const long=n=>Array.from({length:n},(_,i)=>`<p>Paragraph ${i} of the article body with enough words to look like real reporting, and a bit more text so it reaches a realistic length for extraction.</p>`).join('');
const feedXml=(name,n)=>`<?xml version="1.0"?><rss xmlns:media="http://search.yahoo.com/mrss/"><channel><title>${name}</title>${Array.from({length:n},(_,i)=>`<item><title>${name} story ${i+1}</title><link>https://${name.toLowerCase()}.test/story-${i+1}</link><pubDate>${new Date(Date.now()-(i+1)*9e5).toUTCString()}</pubDate><description>Short summary for story ${i+1}.</description></item>`).join('')}</channel></rss>`;
const articleHtml=(title)=>`<html><head><title>${title}</title></head><body><nav><a href="/">Home</a></nav><article><h1>${title}</h1>${long(14)}<p>Code</p><pre><code>&lt;string name="rcs_video_bottom_sheet_heading_with_name"&gt;Call %1$s&lt;/string&gt; averyveryveryverylongunbrokentokenphone.openbeta_dynamic_module_name_that_never_ends</code></pre>${long(4)}<p>Posts from this author will be added to your daily email digest.</p></article><footer>© 2026</footer></body></html>`;
async function mock(p,opt={}){
 await p.addInitScript(()=>{addEventListener('load',()=>{const o=window.setShow;if(!o||window.__noall)return;window.setShow=function(){o.apply(this,arguments);document.querySelectorAll('.spage').forEach(s=>s.hidden=false);set.classList.add('inpage');document.querySelectorAll('.smore').forEach(d=>d.open=true)}})});
 if(!process.env.ACC)await p.addInitScript(()=>{document.addEventListener('DOMContentLoaded',()=>{for(const sh of document.styleSheets){let r;try{r=sh.cssRules}catch(e){continue}for(let i=r.length-1;i>=0;i--){const t=r[i].selectorText||'';if(t==='.snav'||/^\.sgrp:not\(\.open\)/.test(t))sh.deleteRule(i)}}})});
 await p.route(/^https?:\/\/(?!localhost)/,r=>{
  const u=decodeURIComponent(r.request().url());
  const m=u.match(/https?:\/\/(\w+)\.test\/(feed|story-\d+)/);
  if(u.includes('corsproxy.io')&&m){
   if(m[2]==='feed')return r.fulfill({status:200,contentType:'text/xml',body:feedXml(m[1][0].toUpperCase()+m[1].slice(1),opt.n||6)});
   if(opt.noArticles)return r.fulfill({status:403,body:''});
   return r.fulfill({status:200,contentType:'text/html',body:articleHtml(m[1]+' '+m[2])});
  }
  return r.abort();
 });
}
const seed=(feeds)=>({feeds:feeds.map((n,i)=>({id:'f'+i,title:n,url:`https://${n.toLowerCase()}.test/feed`,folder:i<2?'d1':''})),folders:[{id:'d1',name:'Tech'}],sel:'all',scroll:'pages',ver:'2026.10.07f',intro:false,setall:1});
module.exports={mock,seed,PW:require('child_process').execSync('npm root -g').toString().trim()+'/playwright'};
