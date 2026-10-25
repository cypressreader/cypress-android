/* Settings reachability: every control that existed in the old ten-section Settings is either placed on one of the seven pages or is listed in SET_HIDE (with a reason below). Run: node tests/settings_reach.js */
const {APP}=require('./env');const {PW}=require('./mock');const {chromium}=require(PW);
const MERGED=['Section covers','Pull quotes on The Daily','End-of-story mark'];/* mirrored by their merged row through SET_MK */
const WHY={'Light or dark':'replaced by Light, dark or Dynamic','Varied story layout':'replaced by Front page style','Quiet layout':'replaced by Front page style','Sepia paper':'legacy, replaced by themes','Newsprint grain':'legacy','Data saver':'replaced by Pictures','Text only':'replaced by Pictures','Living Dynamic theme':'replaced by Dynamic','Tint the app from the cover photo':'part of Dynamic','Tint pages with photo colors':'part of Dynamic','Paper texture':'legacy','Tidy photo captions':'legacy','Polished typography':'legacy','Sepia reading page':'in the reader Aa popover','Page-turn sound':'legacy','Page-turn tick':'legacy','Light rays on the cover':'legacy','Seasonal touches':'legacy','Interface sounds':'legacy','Reduce motion':'replaced by Motion','Photo magazine look (testing)':'unfinished (D3)','Single-key shortcuts':'moved into the Keyboard shortcuts sheet (D3)','Section covers':'merged into Covers for sites, folders and topics','Pull quotes on The Daily':'merged into Pull quotes','End-of-story mark':'merged into Page marks'};
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:412,height:915}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.route(/^https?:\/\/(?!file)/,r=>r.abort());
 await p.addInitScript(()=>{try{localStorage.setItem('x','1')}catch(e){}});
 await p.goto('file://'+APP);await p.waitForTimeout(1500);
 await p.getByText('Skip for now').first().click().catch(()=>{});await p.waitForTimeout(400);
 const before=await p.evaluate(()=>[...document.querySelectorAll('#set .line')].map(l=>{const lb=l.querySelector('.lb');return {l:lb&&lb.firstChild?lb.firstChild.textContent.trim():'',ids:[...l.querySelectorAll('[id],[data-tg]')].map(e=>e.id||'tg:'+e.dataset.tg)}}));
 await p.evaluate(()=>document.querySelector('#gear').click());await p.waitForTimeout(800);
 const r=await p.evaluate(()=>{const miss=[],hid=[];const ren=Object.values(SET_REN).map(x=>x[0]);document.querySelectorAll('#setlegacy .line').forEach(l=>{const lb=l.querySelector('.lb');hid.push(lb&&lb.firstChild?lb.firstChild.textContent.trim():'?')});return {hid,hidden:SET_HIDE.slice(),lines:[...document.querySelectorAll('#setpane .line')].map(l=>{const lb=l.querySelector('.lb');return lb&&lb.firstChild?lb.firstChild.textContent.trim():''}),ren,renOld:Object.keys(SET_REN),ids:[...document.querySelectorAll('#setpane [id],#setpane [data-tg]')].map(e=>e.id||'tg:'+e.dataset.tg)}});
 let bad=0;
 const placed=new Set(r.lines),ids=new Set(r.ids);
 for(const x of before){
  if(!x.l)continue;
  const ok=placed.has(x.l)||r.renOld.some(k=>k.slice(2)===x.l&&placed.has(SET_REN_LOOK(r,k)))||r.hidden.includes(x.l)||MERGED.includes(x.l)||x.ids.some(i=>ids.has(i));
  if(!ok){bad++;console.log('NOT REACHABLE:',x.l)}
 }
 function SET_REN_LOOK(r,k){const i=r.renOld.indexOf(k);return r.ren[i]}
 for(const h of r.hid){if(!(h in WHY)){bad++;console.log('hidden without a reason:',h)}}
 for(const h of r.hid){if(!r.hidden.includes(h)&&!MERGED.includes(h)){bad++;console.log('hidden but not in SET_HIDE:',h)}}
 const pages=await p.evaluate(()=>SET_PAGES.map(x=>x.t));
 console.log('pages:',pages.join(' | '));
 console.log('placed lines:',r.lines.length,'hidden with reason:',r.hid.length,'old rows checked:',before.length);
 if(errs.length){bad++;console.log('page errors',errs)}
 console.log(bad?'FAIL':'settings_reach ok');await b.close();process.exit(bad?1:0)})();
