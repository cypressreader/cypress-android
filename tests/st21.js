const {APP}=require('./env');
const {mock,PW}=require('./mock');const {chromium}=require(PW);
let pass=0,fail=0;const log=[];const ck=(n,c,x='')=>{if(c)pass++;else{fail++;log.push(`FAIL ${n} ${x}`)}};
(async()=>{const b=await chromium.launch();
for(const scheme of ['light','dark']){
const ctx=await b.newContext({viewport:{width:390,height:800},colorScheme:scheme});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await mock(p,{n:6});await p.goto('file://'+APP);await p.waitForTimeout(1500);
const pre=scheme+' ';
const R=await p.evaluate(async()=>{
 const o={};const hue=c=>rgb2hsl(anyRgb(c))[0],L=c=>lumOf(anyRgb(c));
 const tl=dynTone('#6a3df0',false),td=dynTone('#6a3df0',true);
 o.lightBg=L(tl.bg);o.darkBg=L(td.bg);o.hueL=hue(tl.bg);o.hueD=hue(td.bg);o.hueSite=hue('#6a3df0');
 o.satL=rgb2hsl(anyRgb(tl.bg))[1];
 o.olive=dynTone('#c8b400',true);o.oliveSat=rgb2hsl(anyRgb(o.olive.bg))[1];
 o.parse=[!!anyRgb('rgb(10, 20, 30)'),!!anyRgb('#abc'),!!anyRgb('hsl(120,50%,40%)'),anyRgb('nonsense')===null];
 o.accL=rgb2hsl(anyRgb(tl.a))[2];o.accD=rgb2hsl(anyRgb(td.a))[2];
 // theme on
 const f=S.feeds[1],now=Date.now();items[f.id]=Array.from({length:6},(_,i)=>({feedId:f.id,title:'Story '+i,link:'https://w.test/'+i,date:now-i*36e5,summary:'x',html:'<p>x</p>'}));
 S.theme='dynamic';S.dynm='sys';S.dtone=undefined;S.dacc=undefined;S.dcalm=undefined;S.dfont=undefined;applyTheme(false);S.sel='s:'+f.id;render();await new Promise(r=>setTimeout(r,1800));
 const root=document.documentElement,lay=()=>[...document.getElementById('dynbg').children].find(x=>x.classList.contains('on'));
 o.tb=lay().style.getPropertyValue('--tb');o.logo=root.style.getPropertyValue('--logo');
 // reader gets the same recipe
 rdB('#6a3df0');o.rbg=$('#rd').style.getPropertyValue('--rbg');o.rexp=dynTone('#6a3df0',dynIsDark()).bg;
 o.sameHue=Math.abs(hue(lay().style.getPropertyValue('--tb').replace(/color-mix.*/,'')||o.tb)-hue(o.rbg))<3;
 // options off
 S.dtone=false;applyFx();await new Promise(r=>setTimeout(r,800));o.tbOff=lay().style.getPropertyValue('--tb');rdB('#6a3df0');o.rbgOff=$('#rd').style.getPropertyValue('--rbg');
 S.dtone=undefined;S.dacc=false;applyFx();await new Promise(r=>setTimeout(r,800));o.logoOff=root.style.getPropertyValue('--logo');
 S.dacc=undefined;applyFx();await new Promise(r=>setTimeout(r,800));o.logoBack=root.style.getPropertyValue('--logo');
 // calm
 o.calmClass=root.classList.contains('dcalm');
 let n=0;const oa=dynApply;window.dynApply=c=>{n++;oa(c)};
 const base=dynSet.c;dynSet.c=base||'#6a3df0';const near=dynSet.c;
 dynSet('#6b3ef1');await new Promise(r=>setTimeout(r,2200));o.nearCalls=n;
 S.dcalm=false;applyFx();dynSet.c=near;n=0;dynSet('#6b3ef1');await new Promise(r=>setTimeout(r,2500));o.nearCallsOff=n;
 S.dcalm=undefined;applyFx();window.dynApply=oa;
 // typeface
 o.serifDefault=getComputedStyle(root).getPropertyValue('--serif');o.dsansDefault=root.classList.contains('dsans');
 S.dfont='sans';applyFx();o.dsans=root.classList.contains('dsans');o.serifSans=getComputedStyle(root).getPropertyValue('--serif');S.dfont='serif';applyFx();
 o.ui=['dtone','dacc','dcalm'].every(k=>!!document.querySelector('[data-tg='+k+']'))&&!!$('#dfont');
 o.keys=['dtone','dacc','dcalm','dfont'].every(k=>SET_KEYS.includes(k));
 o.defOn=['dtone','dacc','dcalm'].every(k=>isOn(k));
 return o});
ck(pre+'light tint is light',R.lightBg>.7,String(R.lightBg));ck(pre+'dark tint is dark',R.darkBg<.05,String(R.darkBg));
ck(pre+'tint keeps the site hue',Math.abs(R.hueL-R.hueSite)<4&&Math.abs(R.hueD-R.hueSite)<4,JSON.stringify([R.hueL,R.hueD,R.hueSite]));
ck(pre+'tint is rich not grey',R.satL>.4,String(R.satL));
ck(pre+'dark yellow is held back',R.oliveSat<=.45,String(R.oliveSat));
ck(pre+'colour parser',R.parse.every(Boolean),JSON.stringify(R.parse));
ck(pre+'accent contrast direction',R.accL<.5&&R.accD>.6,JSON.stringify([R.accL,R.accD]));
ck(pre+'page uses the rich tint',/^hsl\(/.test(R.tb),R.tb);
ck(pre+'reader uses the same recipe',R.rbg===R.rexp&&R.sameHue,JSON.stringify([R.rbg,R.rexp,R.sameHue]));
ck(pre+'site colour on details',/^hsl\(/.test(R.logo),R.logo);
ck(pre+'tint toggle off drops tone',!R.tbOff&&!R.rbgOff,JSON.stringify([R.tbOff,R.rbgOff]));
ck(pre+'details toggle off clears accent',!R.logoOff&&/^hsl\(/.test(R.logoBack),JSON.stringify([R.logoOff,R.logoBack]));
ck(pre+'calm: near colour ignored',R.calmClass&&R.nearCalls===0,JSON.stringify([R.calmClass,R.nearCalls]));
ck(pre+'calm off: near colour applied',R.nearCallsOff>=1,String(R.nearCallsOff));
ck(pre+'serif by default',!R.dsansDefault&&!/Inter/.test(R.serifDefault),R.serifDefault);
ck(pre+'sans option',R.dsans&&/Inter/.test(R.serifSans),R.serifSans);
ck(pre+'settings present',R.ui);ck(pre+'synced keys',R.keys);ck(pre+'defaults on',R.defOn);
ck(pre+'no page errors',!errs.length,errs.join('|'));
await ctx.close()}
console.log('st21',pass,'pass',fail,'fail');log.forEach(l=>console.log(l));await b.close();process.exit(fail?1:0)})();
