/* B76: every cover style, on tablet widths, keeps its masthead and headline inside the cover (runs the cover_fit checks at 744, 1024 and 1280 wide) */
const cp=require('child_process'),path=require('path');
const r=cp.spawnSync('node',[path.resolve(__dirname,'cover_fit.js')],{env:Object.assign({},process.env,{SIZES:'744x1133,1024x768,1280x800',HEADS:'short,word'}),encoding:'utf8',maxBuffer:1<<26});
const out=(r.stdout||'')+(r.stderr||'');const m=out.match(/cover_fit all (\d+) passed/);
if(m&&r.status===0){console.log('cover_tablet all passed ('+m[1]+' checks)');process.exit(0)}
console.log(out.split('\n').filter(l=>/FAIL|fail/.test(l)).slice(0,10).join('\n')||out.slice(-600));process.exit(1);
