/* B93: every service the app itself calls (not the news sites) is named on the privacy page */
const fs=require('fs'),path=require('path');
const app=fs.readFileSync(process.env.APP||path.resolve(__dirname,'../www/index.html'),'utf8');
const priv=fs.readFileSync(path.resolve(__dirname,'../docs/privacy.html'),'utf8').replace(/<[^>]*>/g,' ');
let bad=0;
const SERVICES=[['is.gd','is.gd'],['api.rss2json.com','rss2json'],['allorigins.win','allorigins'],['codetabs.com','codetabs'],['corsproxy.io','corsproxy'],['r.jina.ai','jina'],['web.archive.org','archive'],['morss.it','morss'],['youtube-nocookie.com','youtube-nocookie'],['i.ytimg.com','ytimg'],['cdn.jsdelivr.net','jsdelivr'],['fonts.googleapis.com','google fonts'],['nominatim.openstreetmap.org','nominatim'],['open-meteo.com','open-meteo'],['api.github.com','github'],['google.com/s2/favicons','google'],['static.cloudflareinsights.com','cloudflare analytics']];
for(const [host,word] of SERVICES){
 const used=app.includes(host);const said=priv.toLowerCase().includes(word);
 if(used&&!said){bad++;console.log('FAIL the app calls',host,'but the privacy page does not mention',word)}else console.log('ok',host,used?'(used, disclosed)':'(not used)')}
if(app.includes('cloudflareinsights')){bad++;console.log('FAIL the app page carries the Cloudflare analytics beacon, but the privacy page says there is none')}
const home=fs.readFileSync(path.resolve(__dirname,'../docs/index.html'),'utf8');
if(/cloudflareinsights|google-analytics|googletagmanager|plausible|matomo/i.test(home+app)){bad++;console.log('FAIL an analytics script is in the pages')}else console.log('ok no analytics script in the home page or the app');
console.log(bad?'privacy_hosts FAILED '+bad:'privacy_hosts all passed');process.exit(bad?1:0);
