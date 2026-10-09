/* PDF export: builds a sample edition with the real typesetter, then checks the file with pdftotext/pdfimages:
   complete headlines and page numbers in the contents, pictures on the story pages, running heads only in the top margin, folios only in the bottom margin. */
const fs=require('fs'),cp=require('child_process'),path=require('path'),os=require('os');
const have=c=>{try{cp.execSync('which '+c,{stdio:'ignore'});return true}catch(e){return false}};
if(!have('pdftotext')||!have('pdfimages')){console.log('pdf_layout skipped (poppler not installed)');process.exit(0)}
const html=fs.readFileSync(path.join(__dirname,'..','www','index.html'),'utf8');
const a=html.indexOf('const PDFW={'),b=html.indexOf('return {bytes:out,pages:all.length};\n}',a)+'return {bytes:out,pages:all.length};\n}'.length;
eval(html.slice(a,b)+';globalThis.pdfIssue=pdfIssue;');
/* a tiny valid JPEG (1x1, grey), scaled by the PDF viewer */
const JPG=Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/yQALCAABAAEBAREA/8wABgAQEAX/2gAIAQEAAD8A0s8g/9k=','base64');
const im={bytes:new Uint8Array(JPG),w:1,h:1};
const lorem='The committee met on Tuesday to discuss the long-running dispute over the harbour redevelopment, a plan that has divided the town. “We can’t keep doing this,” said one member. ';
const mk=(i,words,img)=>({title:'Story number '+i+' about the harbour and what comes after the vote',source:'Source '+i,min:Math.max(1,Math.round(words/230)),author:'',link:'https://x.test/'+i,words,img,blocks:[{t:'p',s:lorem.repeat(Math.ceil(words/30))},{t:'h',s:'A heading'},{t:'p',s:lorem.repeat(Math.ceil(words/60))}],note:''});
const stories=[mk(0,1200,im),mk(1,800,im),mk(2,300,im),mk(3,120,im),mk(4,90,null)];
const r=pdfIssue({kind:'The Evening Edition',date:'Friday, October 9',short:'Oct 9',issue:282,totalMin:'1 hour',cover:{title:stories[0].title,source:'Source 0',deck:'Deck line.',img:im},stories});
const f=path.join(os.tmpdir(),'cy_pdf_layout.pdf');fs.writeFileSync(f,Buffer.from(r.bytes));
const tx=(args)=>cp.execSync('pdftotext '+args+' '+f+' -',{encoding:'utf8'});
let bad=0;const ck=(n,ok,x)=>{if(!ok){bad++;console.log('FAIL',n,x||'')}else console.log('ok',n)};
const contents=tx('-f 2 -l 2 -layout');
stories.forEach((s,i)=>ck('contents has headline '+i,contents.includes('Story number '+i+' about the harbour')));
ck('contents has source lines',stories.every(s=>contents.includes(s.source)));
const nums=[...contents.matchAll(/Story number \d+[^\n]*?\s(\d{1,3})\s*$/gm)].map(m=>+m[1]);
ck('every contents entry has a page number on its first line',nums.length===stories.length,JSON.stringify(nums));
ck('page numbers within the document',nums.every(n=>n>=3&&n<=r.pages),JSON.stringify([nums,r.pages]));
const imgs=cp.execSync('pdfimages -list '+f,{encoding:'utf8'}).split('\n').filter(l=>/\bimage\b/.test(l));
ck('pictures on the cover and on story pages',imgs.length>=4,String(imgs.length));
let heads=0,foot=0;
for(let p=3;p<=r.pages-1;p++){
 const top=tx('-f '+p+' -l '+p+' -x 0 -y 0 -W 596 -H 42').trim(),bottom=tx('-f '+p+' -l '+p+' -x 0 -y 800 -W 596 -H 42').trim();
 if(top&&!/^CYPRESS/.test(top))ck('page '+p+' top margin holds only the running head',false,top.slice(0,60));else if(top)heads++;
 if(!/^\d+$/.test(bottom))ck('page '+p+' bottom margin holds only the page number',false,bottom.slice(0,60));else foot++;
}
ck('running heads appear',heads>=1);ck('folios on every inner page',foot===r.pages-3);
console.log('pdf_layout',bad?bad+' FAILED':'all passed');process.exit(bad?1:0);
