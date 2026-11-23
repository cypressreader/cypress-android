// Color/contrast + icon-shape scan of 13 screens. Run: APP=www/index.html node tools/scan/colors.js light halcyon,press,halcyon+gbar out.json  (dark for dark). Group results by element: a fail on one theme is that theme; on many themes, a shared rule.
const T='/home/user/cypress-android/tests/';const {APP}=require(T+'env');const {mock,PW}=require(T+'mock');const {chromium}=require(PW);
const [,,SCH,THS,OUT]=process.argv;const fs=require('fs');
const PROBE=(screen)=>{
 const lum=c=>{const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};return .2126*f(c[0])+.7152*f(c[1])+.0722*f(c[2])};
 const parse=s=>{const m=s.match(/rgba?\(([^)]+)\)/);if(!m){const c=s.match(/color\(srgb ([^)]+)\)/);if(!c)return null;const p=c[1].split(/[ \/]+/).map(Number);return[p[0]*255,p[1]*255,p[2]*255,p[3]??1]}const p=m[1].split(/[ ,\/]+/).filter(Boolean).map(Number);return[p[0],p[1],p[2],p[3]??1]};
 const over=(top,bot)=>{const a=top[3];return[top[0]*a+bot[0]*(1-a),top[1]*a+bot[1]*(1-a),top[2]*a+bot[2]*(1-a),1]};
 const cr=(a,b)=>{const x=lum(a),y=lum(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
 const vis=e=>{const r=e.getBoundingClientRect();if(r.width<2||r.height<2||r.bottom<0||r.top>innerHeight||r.right<0||r.left>innerWidth)return false;for(let x=e;x&&x.nodeType===1;x=x.parentElement){const c=getComputedStyle(x);if(c.visibility==='hidden'||c.display==='none'||+c.opacity<.05)return false}return true};
 const bgOf=e=>{let layers=[];for(let x=e;x;x=x.parentElement){const c=getComputedStyle(x);if(c.backgroundImage&&c.backgroundImage!=='none'&&!/gradient/.test(c.backgroundImage))return{img:1};if(/gradient/.test(c.backgroundImage||'')&&x!==document.querySelector('.top'))return{img:1};if(x.tagName==='IMG'||x.tagName==='VIDEO'||x.tagName==='CANVAS')return{img:1};const b=parse(c.backgroundColor);if(b&&b[3]>0){layers.push(b);if(b[3]>=.99)break}}
  // an image sitting under the element (card photos with text on top)
  const r=e.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;const stack=document.elementsFromPoint(Math.max(0,Math.min(innerWidth-1,cx)),Math.max(0,Math.min(innerHeight-1,cy)));for(const s of stack){if(s===e||s.contains(e))continue;if(/^(IMG|VIDEO|CANVAS|PICTURE)$/.test(s.tagName)&&!e.contains(s))return{img:1};const cs=getComputedStyle(s);if(cs.backgroundImage!=='none'&&!/gradient/.test(cs.backgroundImage)&&!s.contains(e))return{img:1}}
  let base=parse(getComputedStyle(document.body).backgroundColor)||[255,255,255,1];if(base[3]<1)base=over(base,[255,255,255,1]);for(let i=layers.length-1;i>=0;i--)base=over(layers[i],base);return{c:base}};
 const op=e=>{let o=1;for(let x=e;x&&x.nodeType===1;x=x.parentElement)o*=+getComputedStyle(x).opacity;return o};
 const path=e=>{const p=[];for(let x=e;x&&x!==document.body&&p.length<4;x=x.parentElement){let s=x.tagName.toLowerCase();if(x.id)s+='#'+x.id;else if(x.classList.length)s+='.'+[...x.classList].slice(0,2).join('.');p.unshift(s);if(x.id)break}return p.join('>')};
 const out=[];const seen=new Set();
 const all=[...document.querySelectorAll('body *')];
 for(const e of all){if(e.closest('.tl,.tl-leaf,#toast,script,style,noscript'))continue;
  const own=[...e.childNodes].filter(n=>n.nodeType===3&&n.textContent.trim()).map(n=>n.textContent.trim()).join(' ');
  const isIcon=e.tagName==='svg'&&e.closest('button,a,[role=button],.ib');
  if(!own&&!isIcon)continue;{const r=e.getBoundingClientRect(),cx=Math.min(innerWidth-1,Math.max(0,r.left+Math.min(r.width/2,8))),cy=Math.min(innerHeight-1,Math.max(0,r.top+r.height/2)),h=document.elementFromPoint(cx,cy);if(!h||!(h===e||e.contains(h)||h.contains(e)&&!/^(DIALOG)$/.test(h.tagName)||(isIcon&&e.parentElement.contains(h))))continue}if(!isIcon&&parseFloat(getComputedStyle(e).fontSize)<1)continue;if(!vis(e))continue;
  const c=getComputedStyle(e);let fg;
  if(isIcon){const st=c.stroke!=='none'?c.stroke:c.fill;fg=parse(st&&!/url/.test(st)?st:c.color)}else fg=parse(c.color);
  if(!fg)continue;const B=bgOf(e);if(B.img)continue;
  const o=op(e)*fg[3];const fgc=over([fg[0],fg[1],fg[2],o],B.c);const ratio=cr(fgc,B.c);
  const fsz=parseFloat(c.fontSize),bold=+c.fontWeight>=700,large=fsz>=24||(bold&&fsz>=18.66);
  const need=isIcon?3:large?3:4.5;
  const k=path(e)+'|'+(isIcon?'icon':own.slice(0,30));if(seen.has(k))continue;seen.add(k);
  if(ratio<need)out.push({s:screen,el:path(e),t:isIcon?'[icon]':own.slice(0,40),r:+ratio.toFixed(2),need,fs:fsz,fg:c.color,bg:'rgb('+B.c.slice(0,3).map(Math.round).join(',')+')'});
 }
 // shapes: icon buttons in the top bar and tabs
 const ib=[...document.querySelectorAll('.top>.ib,#tabs button,.top>button')].filter(vis).map(b=>{const r=b.getBoundingClientRect(),s=b.querySelector('svg'),sc=s&&getComputedStyle(s);return b.id+':'+Math.round(r.width)+'x'+Math.round(r.height)+':'+getComputedStyle(b).borderRadius+(s?':svg'+Math.round(s.getBoundingClientRect().width)+':sw'+(sc.strokeWidth):'')});
 const unnamed=[...document.querySelectorAll('button,a[href],[role=button]')].filter(vis).filter(b=>!(b.getAttribute('aria-label')||b.textContent.trim()||b.title||b.getAttribute('aria-labelledby'))).map(path).slice(0,8);
 return{low:out,ib,unnamed};
};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},colorScheme:SCH});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message.slice(0,120)));
await mock(p,{n:6});await p.goto('file://'+APP);await p.waitForTimeout(2000);
await p.evaluate(()=>{const o=document.querySelector('#ob');if(o){o.close();o.remove()}const W=['Harbor','Orchard','Violin','Glacier','Lantern','Meadow','Compass','Saffron','Thunder','Pebble','Quartz','Willow'],V=['council approves','festival returns','market rallies','league expands','museum reopens','railway delays','clinic opens'],now=Date.now();S.feeds.forEach((f,k)=>{items[f.id]=Array.from({length:18},(_,i)=>({feedId:f.id,title:W[(i+k*5)%12]+' '+V[(i*3+k)%7]+' after a long week of talks and planning',link:'https://w.test/'+k+'-'+i,date:now-(i*4+k)*36e5/3,summary:'A short summary of the story with enough words to fill two lines of the card on a phone.',by:'Jane Reporter',html:'<p>'+'Paragraph text of the article body, long enough to look like real reporting. '.repeat(8)+'</p>'.repeat(1)+'<p>Another paragraph that continues the story with more detail and quotes.</p>'.repeat(10),img:i%3===0?'file:///home/user/cypress-android/tests/fixtures_hero.jpg':''}))});S.read={};WIRE.pillT=0;wireReset();wireSettle();});
const res={};
for(const th0 of THS.split(',')){const [th,gb]=th0.split('+');
 const go=async(screen,fn)=>{try{await p.evaluate(fn);await p.waitForTimeout(900);const r=await p.evaluate(PROBE,screen);(res[th0+'/'+SCH]??={})[screen]=r}catch(e){(res[th0+'/'+SCH]??={})[screen]={err:String(e).slice(0,200)}}};
 const setT=`(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());try{drawer(false)}catch(e){}if(typeof closeReader==='function')try{closeReader()}catch(e){}S.theme='${th}';S.sch='sys';applyTheme(false);document.documentElement.classList.toggle('gbar',${gb?'true':'false'});})()`;
 const go2=async(screen,fn,w)=>{try{await p.evaluate(fn);await p.waitForTimeout(w||900);const r=await p.evaluate(PROBE,screen);(res[th0+'/'+SCH]??={})[screen]=r}catch(e){(res[th0+'/'+SCH]??={})[screen]={err:String(e).slice(0,200)}}};
 await go2('daily4s',new Function(`${setT};S.sel='today';render();document.querySelector('main').scrollTop=0`),4500);
 await go2('list',new Function(`${setT};S.view='list';S.sel='all';render()`));
 await go2('columns',new Function(`${setT};S.view='tiles';S.wdens='col';S.sel='all';render()`));
 await go2('mag',new Function(`${setT};S.view='tiles';S.wdens='mag';S.sel='s:'+S.feeds[1].id;render()`));
 await go2('addsite',new Function(`${setT};S.sel='all';render();document.querySelector('#add').click()`));
 await go2('manage',new Function(`${setT};document.querySelector('#mng').showModal()`));
 await go2('aa',new Function(`${setT};S.sel='all';render();const f=S.feeds[0];return Promise.resolve(openReader(items[f.id][2])).then(()=>new Promise(r=>setTimeout(()=>{const b=document.querySelector('[data-act=aa]');if(b)b.click();r()},700)))`));
}
fs.writeFileSync(OUT,JSON.stringify({res,errs:[...new Set(errs)].slice(0,10)}));await b.close()})();
