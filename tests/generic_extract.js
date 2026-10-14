/* B10: the generic (Readability-style) article finder. The first finder stays in charge wherever it already finds the story; the generic one is used when the first finds nothing or clearly less than the page holds, and never pulls in comments, sidebars or share boxes. Measured against Mozilla Readability on 156 real pages: see TESTING.md (1.92). */
const {APP}=require('./env');const {mock,PW}=require('./mock');const {chromium}=require(PW);
let bad=0,n=0;const ck=(nm,ok,x)=>{n++;if(!ok){bad++;console.log('FAIL',nm,x||'')}else console.log('ok',nm)};
const para=(k,len=330)=>('Paragraph '+k+' of the story, with commas, clauses, and enough words to read like real running text for the finder. ').repeat(Math.ceil(len/115)).slice(0,len);
const W=k=>'<div class="'+k+'">';
const pages={
  noisy:'<html><body><header><a href="/">Home</a></header><div class="wrap"><h1>Noisy</h1><div class="article-body">'+Array.from({length:4},(_,i)=>'<p>'+para('N'+i)+'</p>').join('')+'</div></div><div class="comments"><p>'+para('C1',400)+'</p><p>'+para('C2',400)+'</p></div><div class="sidebar widget"><p>'+para('S1',400)+'</p></div></body></html>',
 /* no paragraph tags at all: text sits in one div, lines separated by <br> */
 brs:'<html><body><div class="site-nav"><a href="/">Home</a></div><div class="post-text">'+Array.from({length:6},(_,i)=>para('B'+i,300)).join('<br><br>')+'</div><div class="footer-links"><a href="/a">A</a> <a href="/b">B</a></div></body></html>',
 /* control: an ordinary page the first finder handles */
 plain:'<html><body><article><h1>Plain</h1>'+Array.from({length:6},(_,i)=>'<p>'+para('P'+i,320)+'</p>').join('')+'</article><aside class="related"><p>'+para('R1',400)+'</p></aside></body></html>'
};
(async()=>{const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await mock(p,{n:2});await p.goto('file://'+APP);await p.waitForTimeout(1200);
 const ex=(html,mode)=>p.evaluate(([h,m])=>{EXMODE=m;const fr=extract(h,'https://x.test/a');EXMODE='auto';if(!fr)return null;const w=document.createElement('div');w.append(fr);return {t:w.textContent.replace(/\s+/g,' ').trim(),gen:!!fr.generic}},[html,mode]);
 const nz=await ex(pages.noisy,'gen');
 ck('the generic finder keeps comments out of the story',nz&&nz.t.length>1000&&!/Paragraph C1/.test(nz.t),nz&&nz.t.slice(0,80));
 ck('the generic finder keeps the sidebar out of the story',nz&&!/Paragraph S1/.test(nz.t)&&!/\bHome\b/.test(nz.t));
 const br=await ex(pages.brs,'auto'),brc=await ex(pages.brs,'cur');
 ck('line-break page: the first finder finds nothing',!brc,brc&&brc.t.length);
 ck('line-break page: the generic finder finds the story',br&&br.gen&&/Paragraph B0 /.test(br.t)&&/Paragraph B5 /.test(br.t),br&&br.t.length);
 ck('line-break page: no footer links in the story',br&&!/\bHome\b/.test(br.t));
 const pl=await ex(pages.plain,'auto'),plc=await ex(pages.plain,'cur');
 ck('ordinary page: the first finder is left alone (same text)',pl&&plc&&pl.t===plc.t&&!pl.gen,pl&&pl.t.length+' vs '+(plc&&plc.t.length));
 ck('ordinary page: no related box',pl&&!/Paragraph R1/.test(pl.t));
 /* speed: a big page costs little */
 const big='<html><body>'+Array.from({length:600},(_,i)=>'<div class="blk'+(i%7)+'"><p>'+para('X'+i,260)+'</p><ul><li><a href="/'+i+'">link '+i+'</a></li></ul></div>').join('')+'</body></html>';
 const ms=await p.evaluate(h=>{const t=performance.now();EXMODE='gen';extract(h,'https://x.test/a');EXMODE='auto';return performance.now()-t},big);
 ck('a 600-block page is found in under 400 ms ('+Math.round(ms)+' ms)',ms<400,ms);
 ck('no page errors',!errs.length,errs[0]);
 await b.close();console.log(bad?'FAILED '+bad:'generic_extract all '+n+' passed');process.exit(bad?1:0)})();
