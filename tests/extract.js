/* Writes the app's <script> blocks into $OUT/chk.js, which boot.js and feat_run.js read */
const fs=require('fs');const {APP,OUT}=require('./env');
const s=fs.readFileSync(APP,'utf8');const m=[...s.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
m.sort((a,b)=>b.length-a.length);fs.writeFileSync(OUT+'/chk.js',m[0]);console.log('scripts:',m.length);
