const {mock,seed,PW}=require('./mock');const fs=require('fs');
const H=['Chipmaker unveils its most efficient processor yet','City council votes to expand overnight transit service','How a small lab is rethinking battery recycling','The quiet return of the single-camera phone','Inside the fight over open-source AI models','Rising seas push coastal towns to rethink zoning','A decade later, the smart-home dream is still unfinished','New study links sleep timing to memory in teenagers','Streaming prices climb again as subscribers hold steady','Why the next generation of trains may run on hydrogen','Researchers map the loudest places on Earth','Local bakeries band together to buy flour in bulk','The case for slower software updates','Museum returns hundreds of artifacts to their home country','Electric ferries start commuter runs across the bay','What a year of remote work did to office real estate','Small satellites are changing how farmers plan their seasons','Game studio shuts down after surprise hit fails to sell','The accessibility feature everyone ended up using','A guide to the quietest mechanical keyboards','Voters weigh a ballot measure on library funding','Coral nurseries offer hope for a damaged reef','The slow rise of repair-friendly laptops','Festival organisers rethink the headline slot','Why your phone battery is not the problem anymore','Startups race to make cheaper grid batteries','Neighbourhood gardens turn vacant lots green','Cybersecurity teams brace for a new kind of phishing','Retailers test shelves that never need restocking','An old canal gets a second life as a public park'];
const feedXml=(name,n,off)=>`<?xml version="1.0"?><rss xmlns:media="http://search.yahoo.com/mrss/"><channel><title>${name}</title>${Array.from({length:n},(_,i)=>{const k=(i*3+off)%H.length,hasImg=(i%7)!==3;const t=(i%5===0&&off<6)?H[i%6]:H[k];return `<item><title>${t}</title><link>https://${name.toLowerCase()}.test/story-${i+1}</link><pubDate>${new Date(Date.now()-(i*1.4+off*.7+.3)*36e5).toUTCString()}</pubDate><description>${t}. The report looks at what changed, who is affected and what comes next, with new details from people close to the story.</description>${hasImg?`<media:content url="https://img.test/${((i*5+off*7)%24)+1}.jpg" medium="image" type="image/jpeg"/>${(i%3===1)?`<media:thumbnail url="https://img.test/${((i*5+off*7)%24)+1}.jpg"/>`:''}`:''}</item>`}).join('')}</channel></rss>`;
const OFF={circuit:0,lumen:2,harbor:4,atlas:6};
async function mockRich(p,opt={}){
 await mock(p,opt);
 await p.route(/^https?:\/\/(?!localhost)/,async r=>{
  const u=decodeURIComponent(r.request().url());
  let m=u.match(/https?:\/\/img\.test\/(\d+)\.jpg/);
  if(m)return r.fulfill({status:200,contentType:'image/jpeg',body:fs.readFileSync((process.env.IMGDIR||__dirname+'/img')+'/'+m[1]+'.jpg')});
  m=u.match(/https?:\/\/(\w+)\.test\/feed/);
  if(m&&u.includes('corsproxy.io')){const dl=+(process.env.FEEDDELAY||0);if(dl)await new Promise(x=>setTimeout(x,Math.random()*dl));const nm=m[1][0].toUpperCase()+m[1].slice(1);return r.fulfill({status:200,contentType:'text/xml',body:feedXml(nm,opt.n||30,OFF[m[1]]||0)})}
  return r.fallback();
 });
}
const seedRich=()=>{const s=seed(['Circuit','Lumen','Harbor','Atlas']);return s};
module.exports={mockRich,seedRich,PW};
