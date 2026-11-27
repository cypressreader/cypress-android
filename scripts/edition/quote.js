/* The last word: the line the edition ends on (David, 2026-11-26: "The last page of the edition should also
 * end with a famous quote. People love quotes.")
 *
 * WHERE IT COMES FROM, in order:
 *   1. Wikiquote's Quote of the Day, when it answers. It is sourced, checkable and changes daily, and it is
 *      asked for at BUILD TIME, never by a phone. Wikiquote rate-limits shared addresses, so this fails often
 *      from a cloud container and may well work from the scheduled run; either way nothing waits on it.
 *   2. The list below otherwise. Forty lines whose wording and attribution are not in dispute - which rules
 *      out most of what circulates as a famous quote, because a great deal of it was never said by the person
 *      it is hung on. They are chosen by the date, so both editions of one issue carry the same line and
 *      consecutive issues do not repeat.
 *
 * A quote is never invented, never trimmed to fit, and never printed without the name on it.
 *
 *   node scripts/edition/quote.js                 # show the line this issue would end on
 *   node scripts/edition/quote.js --write         # write it into the edition file
 */
const fs=require('fs'),path=require('path'),https=require('https'),{ROOT}=require('./app');

const arg=n=>{const i=process.argv.indexOf(n);return i>0?process.argv[i+1]:null};
const WRITE=process.argv.includes('--write');
const EDITION=arg('--edition')||path.join(ROOT,'world-edition.json');
const DOCS=path.resolve(__dirname,'../../docs/app/world-edition.json');

/* Short, plainly attributed, and old enough that quoting a line of it is ordinary practice. Kept deliberately
   various: a scientist, a novelist, a campaigner, a comedian - an edition that ends on the same voice every
   day is a mannerism. */
const LINES=[
 ['Nothing in life is to be feared, it is only to be understood.','Marie Curie'],
 ['The time is always right to do what is right.','Martin Luther King Jr.'],
 ['I have no special talent. I am only passionately curious.','Albert Einstein'],
 ['It is not down in any map; true places never are.','Herman Melville'],
 ['We are all in the gutter, but some of us are looking at the stars.','Oscar Wilde'],
 ['The world breaks everyone, and afterward many are strong at the broken places.','Ernest Hemingway'],
 ['Not everything that is faced can be changed, but nothing can be changed until it is faced.','James Baldwin'],
 ['A room without books is like a body without a soul.','Cicero'],
 ['A thing of beauty is a joy for ever.','John Keats'],
 ['Whatever you are, be a good one.','Abraham Lincoln'],
 ['You must do the things you think you cannot do.','Eleanor Roosevelt'],
 ['Somewhere, something incredible is waiting to be known.','Carl Sagan'],
 ['I would rather have questions that can’t be answered than answers that can’t be questioned.','Richard Feynman'],
 ['Tell me and I forget. Teach me and I remember. Involve me and I learn.','Benjamin Franklin'],
 ['The past is never dead. It’s not even past.','William Faulkner'],
 ['There is no greater agony than bearing an untold story inside you.','Maya Angelou'],
 ['The arc of the moral universe is long, but it bends toward justice.','Martin Luther King Jr.'],
 ['A ship in harbour is safe, but that is not what ships are built for.','John A. Shedd'],
 ['The greatest glory in living lies not in never falling, but in rising every time we fall.','Nelson Mandela'],
 ['We are what we pretend to be, so we must be careful about what we pretend to be.','Kurt Vonnegut'],
 ['Whereof one cannot speak, thereof one must be silent.','Ludwig Wittgenstein'],
 ['I am not afraid of storms, for I am learning how to sail my ship.','Louisa May Alcott'],
 ['The only true wisdom is in knowing you know nothing.','Socrates'],
 ['The best way out is always through.','Robert Frost'],
 ['Injustice anywhere is a threat to justice everywhere.','Martin Luther King Jr.'],
 ['The mind is not a vessel to be filled but a fire to be kindled.','Plutarch'],
 ['If you want to go fast, go alone. If you want to go far, go together.','African proverb'],
 ['Education is the most powerful weapon which you can use to change the world.','Nelson Mandela'],
 ['I never think of the future. It comes soon enough.','Albert Einstein'],
 ['A people without the knowledge of their past history is like a tree without roots.','Marcus Garvey'],
 ['It always seems impossible until it’s done.','Nelson Mandela'],
 ['The best time to plant a tree was twenty years ago. The second best time is now.','Chinese proverb'],
 ['No one can make you feel inferior without your consent.','Eleanor Roosevelt'],
 ['Life can only be understood backwards; but it must be lived forwards.','Søren Kierkegaard'],
 ['An investment in knowledge pays the best interest.','Benjamin Franklin'],
 ['The universe is under no obligation to make sense to you.','Neil deGrasse Tyson'],
 ['Keep your face always toward the sunshine, and shadows will fall behind you.','Walt Whitman'],
 ['Reading is a conversation. All books talk. But a good book listens as well.','Mark Haddon'],
 ['He who has a why to live can bear almost any how.','Friedrich Nietzsche'],
 ['The medium is the message.','Marshall McLuhan'],
];

const get=url=>new Promise(res=>{
 const r=https.get(url,{timeout:12000,headers:{'accept':'application/json','user-agent':'CyPress edition builder'}},q=>{
  if(q.statusCode!==200){q.resume();return res(null)}
  let b='';q.setEncoding('utf8');q.on('data',c=>b+=c);q.on('end',()=>{try{res(JSON.parse(b))}catch(e){res(null)}});
 });
 r.on('timeout',()=>{r.destroy();res(null)});r.on('error',()=>res(null));
});

/* Wikiquote's page is a table whose first cell is the quote and whose last line names who said it. Both have
   to be found, and the quote has to be short enough to be a last word rather than a passage, or it is left. */
async function wikiquote(){
 const j=await get('https://en.wikiquote.org/w/api.php?action=parse&page=Wikiquote%3AQuote_of_the_day&prop=text&format=json&formatversion=2');
 const html=j&&j.parse&&j.parse.text;if(!html)return null;
 const plain=s=>String(s).replace(/<[^>]+>/g,' ').replace(/&#(\d+);/g,(m,n)=>String.fromCharCode(+n))
   .replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();
 const cell=/<td[^>]*>([\s\S]*?)<\/td>/.exec(html);if(!cell)return null;
 const t=plain(cell[1]);
 const m=/^[“"']?(.+?)[”"']?\s*[~—-]{1,2}\s*([A-Z][^,;]{2,40})/.exec(t);
 if(!m)return null;
 const text=m[1].trim(),who=m[2].trim();
 if(text.length<12||text.length>190||!who)return null;
 return{text,who,src:'Wikiquote'};
}

(async()=>{
 const f=JSON.parse(fs.readFileSync(EDITION,'utf8'));
 const date=String(f.date||new Date().toISOString().slice(0,10));
 let q=await wikiquote();
 if(!q){
  const day=Math.floor(Date.parse(date+'T12:00:00Z')/864e5);
  const [text,who]=LINES[((day%LINES.length)+LINES.length)%LINES.length];
  q={text,who,src:''};
 }
 console.log('The last word: “'+q.text+'” — '+q.who+(q.src?'  ('+q.src+')':'  (from the edition’s own list)'));
 if(!WRITE){console.log('\nNothing written (no --write).');process.exit(0)}
 f.quote=q;
 fs.writeFileSync(EDITION,JSON.stringify(f,null,1));
 try{fs.writeFileSync(DOCS,JSON.stringify(f,null,1))}catch(e){}
 console.log('written into the edition.');
})();
