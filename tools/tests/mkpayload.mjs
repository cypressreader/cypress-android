const o={t:'Two Iranian men charged over alleged terror plot targeting Manchester',s:'The Guardian',l:'https://www.theguardian.com/uk-news',c:'#1f6feb',d:Date.now(),i:'https://davealmaguer-hub.github.io/cypress-android/logo.png',x:'Counter-terrorism police said on Friday that two men have been charged. A court appearance is expected next week.'};
const raw=new TextEncoder().encode(JSON.stringify(o));
const z=new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer());
console.log('z'+Buffer.from(z).toString('base64url'));
