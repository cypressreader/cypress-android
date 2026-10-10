/* PDF overhaul: contents numbers never touch headlines, summaries are cut at a word with a real ellipsis (no stray "&"), drop caps keep their letter, every paragraph appears once, briefs keep header and body together, the contents is clickable with a bookmark outline, and the designed cover / lead art / pull quotes are present. Uses the real typesetter and poppler. */
const fs=require('fs'),cp=require('child_process'),path=require('path'),os=require('os');
const have=c=>{try{cp.execSync('which '+c,{stdio:'ignore'});return true}catch(e){return false}};
if(!have('pdftotext')||!have('pdfimages')||!have('pdftoppm')){console.log('pdf_overhaul skipped (poppler not installed)');process.exit(0)}
const html=fs.readFileSync(path.join(__dirname,'..','www','index.html'),'utf8');
const a=html.indexOf('const PDFW={'),b=html.indexOf('return {bytes:out,pages:all.length};\n}',a)+'return {bytes:out,pages:all.length};\n}'.length;
eval(html.slice(a,b)+';globalThis.pdfIssue=pdfIssue;');
const JPG=Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/yQALCAABAAEBAREA/8wABgAQEAX/2gAIAQEAAD8A0s8g/9k=','base64');
const im={bytes:new Uint8Array(JPG),w:1,h:1};
const long='The committee met on Tuesday to discuss the long-running dispute over the harbour redevelopment, a plan that has divided the town for years. “We can’t keep doing this,” said one member, and the room agreed that something had to give before the winter.';
const T=['Pentagon plans a new round of cuts as the agency criticises the deal and its critics','Celebrity chef opens a restaurant nobody expected in the old port district','Peace talks resume in Geneva after a long and difficult winter of fighting','Prosecutors defend assault on rule of law charges in a packed courtroom','That the agency will review the rules is welcome news for local businesses'];
const DEK='Everything was great until he arrived, and then the whole plan for the harbour fell apart in a single afternoon of argument over costs.';
const feat=(i,img)=>({dek:DEK,pageDek:DEK,title:T[i],source:'Source '+i,min:6,author:i%2?'Jane Doe':'',link:'https://x.test/'+i,words:1100,img,blocks:[{t:'p',s:'The '+long.slice(4)+' First paragraph of story '+i+'.'},{t:'h',s:'What changed'},...Array.from({length:14},(_,k)=>({t:'p',s:'Paragraph '+k+' of story '+i+': '+long})),{t:'q',s:'“This is the line a magazine would lift out and set large,” she said.'}],note:''});
const mid=(i,img)=>({...feat(i,img),words:500,min:3,blocks:feat(i,img).blocks.slice(0,9)});
const brf=(i,img)=>({dek:'Short item '+i+' standfirst.',title:'Brief item '+i+' headline',source:'Source '+i,min:1,author:'',link:'https://x.test/b'+i,words:90,img,blocks:[{t:'p',s:'BRIEFBODY'+i+' the council said on Monday that the repairs would be delayed again, citing weather and supply problems.'},{t:'p',s:'BRIEFTAIL'+i+' residents were told to expect diversions until then.'}],note:''});
const stories=[feat(0,im),feat(1,null),mid(2,im),mid(3,null),mid(4,im),brf(0,null),brf(1,im),brf(2,null),brf(3,null),brf(4,null),brf(5,null)];
const ed={kind:'The Morning Edition',date:'Saturday, October 10',short:'Oct 10',issue:283,totalMin:'40 minutes',cover:{title:stories[0].title,source:'Source 0',deck:DEK,img:im},stories};
const r=pdfIssue(ed);const f=path.join(os.tmpdir(),'cy_pdf_overhaul.pdf');fs.writeFileSync(f,Buffer.from(r.bytes));
const tx=(args)=>cp.execSync('pdftotext '+args+' '+f+' -',{encoding:'utf8'});
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
const all=tx('-raw');
/* 1. contents numbers are separated from the headlines */
const bb=tx('-f 2 -l 2 -bbox');
const words=[...bb.matchAll(/<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)<\/word>/g)].map(m=>({x0:+m[1],y0:+m[2],x1:+m[3],y1:+m[4],t:m[5]}));
const nums=words.filter(w=>/^\d{1,3}$/.test(w.t)&&w.x0>480);
let gapOk=nums.length>=5;const gaps=[];
for(const n of nums){const prev=words.filter(w=>w!==n&&Math.abs(w.y0-n.y0)<4&&w.x1<=n.x0).sort((p,q)=>q.x1-p.x1)[0];if(prev){const g=n.x0-prev.x1;gaps.push(Math.round(g));if(g<14)gapOk=false}}
ck('page numbers sit apart from headlines (14pt or more)',gapOk,JSON.stringify([nums.length,gaps]));
ck('contents is numbered 01, 02, ...',/\b01\b/.test(tx('-f 2 -l 2'))&&/\b05\b/.test(tx('-f 2 -l 2')));
/* 2. summaries cut at a word with a proper ellipsis */
const toc=tx('-f 2 -l 2');
ck('no stray ampersand from a broken ellipsis',!/&/.test(toc)&&!/&/.test(tx('-f 1 -l 1')));
const cut=[...toc.matchAll(/(\S+)…/g)].map(m=>m[1]);
const vocab=new Set(DEK.split(/\s+/).map(w=>w.replace(/[.,]$/,'')));
ck('summaries end in a real ellipsis after a whole word',cut.length>=1&&cut.every(w=>vocab.has(w.replace(/[.,]$/,''))),JSON.stringify(cut));
/* 3. drop caps keep their letter */
const raw=all;const pageTxt=[null,...[...Array(r.pages)].map((_,k)=>tx('-f '+(k+1)+' -l '+(k+1)))];const storyPages=[...Array(r.pages)].map((_,k)=>k+1).filter(p=>p>=2&&!/In this issue/.test(pageTxt[p]));
ck('every drop cap carries its letter (The ... not he ...)',(raw.match(/T\s?he committee met on Tuesday to discuss/g)||[]).length>=1&&(raw.match(/he committee met on Tuesday to discuss/g)||[]).length===(raw.match(/T\s?he committee met on Tuesday to discuss/g)||[]).length,'');
const ds=[...raw.matchAll(/(?:^|\n)([A-Z])\n?([a-z]+ [a-z]+ [a-z]+)/g)].length;
ck('drop caps are drawn',ds>=1||/T\s*he committee/.test(raw));
/* 5. briefs keep header and body together, in order */
let order=true;for(let i=0;i<6;i++){const h=raw.indexOf('Brief item '+i+' headline'),bd=raw.indexOf('BRIEFBODY'+i),tl=raw.indexOf('BRIEFTAIL'+i);if(!(h>=0&&bd>h&&tl>bd))order=false}
ck('each brief reads header, body, tail in order',order);
const briefPages=[];for(let p=1;p<=r.pages;p++){if(/BRIEFBODY/.test(tx('-f '+p+' -l '+p)))briefPages.push(p)}
let together=true;for(let i=0;i<6;i++){const pg=storyPages.filter(p=>pageTxt[p].includes('Brief item '+i+' headline'));const pg2=storyPages.filter(p=>pageTxt[p].includes('BRIEFBODY'+i));if(pg[0]!==pg2[0])together=false}
ck('a brief never starts on one page and continues its header elsewhere',together);
/* 4. each paragraph once */
const dupP=(n)=>(raw.match(new RegExp('Paragraph 3 of story '+n+':','g'))||[]).length;
ck('a body paragraph appears once',dupP(0)===1&&dupP(1)===1,dupP(0)+','+dupP(1));
const dekCount=(raw.match(/Everything was great until he arrived/g)||[]).length;
ck('the standfirst appears once per place it belongs (cover, contents, story page)',dekCount<=1+5+5,String(dekCount));
/* 6. clickable contents and bookmarks */
const bytes=fs.readFileSync(f).toString('latin1');
ck('has a bookmark outline that opens with the file',/\/Outlines \d+ 0 R/.test(bytes)&&/\/PageMode \/UseOutlines/.test(bytes));
const links=[...bytes.matchAll(/\/Subtype \/Link \/Rect \[[^\]]+\] \/Border \[0 0 0\] \/Dest \[(\d+) 0 R/g)].map(m=>+m[1]);
ck('every contents entry is a link',links.length===stories.length,String(links.length));
const pageIds=new Set([...bytes.matchAll(/(\d+) 0 obj\n<< \/Type \/Page /g)].map(m=>+m[1]));
ck('every link lands on a real page',links.every(n=>pageIds.has(n)));
const outDest=[...bytes.matchAll(/\/Title \(([^)]*)\) \/Parent \d+ 0 R[^>]*\/Dest \[(\d+) 0 R/g)];
ck('bookmarks: cover, contents, sections and each story',outDest.length>=2+3+stories.length&&outDest.every(m=>pageIds.has(+m[2])),String(outDest.length));
ck('bookmark titles include the story headlines',stories.every(s=>bytes.includes(s.title.slice(0,30))));
const info=cp.execSync('pdfinfo '+f+' 2>&1',{encoding:'utf8'});
ck('poppler opens the file without complaint',/Pages:\s+\d+/.test(info)&&!/Error|Syntax/i.test(info),info.slice(0,200));
/* design */
const imgs=(p)=>cp.execSync('pdfimages -list -f '+p+' -l '+p+' '+f,{encoding:'utf8'}).split('\n').filter(l=>/\bimage\b/.test(l)).length;
ck('full-page cover carries the cover picture',imgs(1)>=1);
const colors=(p,pre)=>{const o=path.join(os.tmpdir(),pre);cp.execSync('pdftoppm -r 24 -f '+p+' -l '+p+' -singlefile '+f+' '+o);const d=fs.readFileSync(o+'.ppm');const hdr=d.toString('latin1',0,20).match(/^P6\s+(\d+)\s+(\d+)\s+255\s/);const off=hdr?hdr[0].length:15;const set=new Set();for(let i=off;i+2<d.length;i+=3)set.add((d[i]>>4)+','+(d[i+1]>>4)+','+(d[i+2]>>4));return set.size};
ck('cover is a designed full page, not a flat colour',colors(1,'cv')>=6);
/* story pages: feature opener art (picture or designed fallback), second feature has no picture so it must use the fallback */
const fp=storyPages.find(p=>pageTxt[p].includes(T[1].slice(0,30)));
ck('a feature without a picture gets the designed fallback art (not a blank)',colors(fp,'fa')>=8,String(fp));
ck('a feature opens full bleed (picture on its first page)',imgs(storyPages.find(p=>pageTxt[p].includes(T[0].slice(0,30))))>=1);
ck('pull quote is set on feature pages',/This is the line a magazine would lift out/.test(raw.replace(/\s+/g,' ')));
ck('contents page is designed: thumbnails or art tiles, leaders, numerals',colors(2,'tc')>=10&&imgs(2)>=1);
console.log('pdf_overhaul',bad?bad+' FAILED':'all passed');process.exit(bad?1:0);
