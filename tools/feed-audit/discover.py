"""For every site whose feed gave no stories, look for a working feed address on the site itself.
Reads report.json (from an.js). Prints suggestions and writes suggestions.json."""
import json,re,subprocess,sys,concurrent.futures as cf,datetime
from urllib.parse import urljoin,urlparse
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"
def get(u,lim=3000000):
    r=subprocess.run(['curl','-sL','-m','25','-A',UA,'--max-filesize',str(lim),u],capture_output=True)
    return r.stdout.decode('utf8','ignore')
def newest(x):
    best=0
    for m in re.findall(r'<(?:pubDate|updated|dc:date|published)>\s*([^<]+)<',x)[:30]:
        for fmt in ('%a, %d %b %Y %H:%M:%S %z','%a, %d %b %Y %H:%M:%S %Z','%Y-%m-%dT%H:%M:%S%z','%Y-%m-%dT%H:%M:%SZ'):
            try:
                d=datetime.datetime.strptime(m.strip().replace('GMT','+0000'),fmt)
                if d.tzinfo is None:d=d.replace(tzinfo=datetime.timezone.utc)
                best=max(best,d.timestamp());break
            except Exception:pass
    return best
def good(u):
    x=get(u)
    n=len(re.findall(r'<item[ >]|<entry[ >]',x))
    if n<3 or not re.search(r'<(rss|feed|rdf)',x[:3000],re.I):return None
    nw=newest(x)
    if nw and datetime.datetime.now().timestamp()-nw>120*86400:return None
    return n
def one(r):
    base='{u.scheme}://{u.netloc}'.format(u=urlparse(r['url']))
    html=get(base+'/',1500000)
    cands=[]
    for m in re.finditer(r'<link[^>]+>',html):
        t=m.group(0)
        if re.search(r'type=["\']application/(rss|atom)\+xml',t,re.I):
            h=re.search(r'href=["\']([^"\']+)',t)
            if h:cands.append(urljoin(base+'/',h.group(1).replace('&amp;','&')))
    for p in ('/feed','/feed/','/rss','/rss.xml','/feed.xml','/atom.xml','/index.xml','/feeds/all.rss','/blog/feed'):cands.append(base+p)
    seen=set()
    for c in cands:
        if c in seen or c.rstrip('/')==r['url'].rstrip('/'):continue
        seen.add(c);n=good(c)
        if n:return (r['name'],r['url'],c,n)
    return (r['name'],r['url'],None,0)
rep=json.load(open(sys.argv[1] if len(sys.argv)>1 else 'report.json'))
todo=[r for r in rep if r.get('items',0)==0 and not re.search(r'news\.google\.com|bing\.com/news',r['url'])]  # the app already covers those with its own headline fallback
out=[]
with cf.ThreadPoolExecutor(8) as ex:
    for res in ex.map(one,todo):out.append(res)
sug={n:{'old':o,'new':c,'items':k} for n,o,c,k in out if c}
json.dump(sug,open('suggestions.json','w'),indent=1)
print('\n## Found a working feed address for',len(sug),'of',len(todo),'sites with no stories')
for n,o,c,k in out:
    if c:print(f'{n}\n   was: {o}\n   now: {c}  ({k} stories)')
print('\n## Still nothing found for:',', '.join(n for n,o,c,k in out if not c))
