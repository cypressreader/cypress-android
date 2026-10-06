import json,re,subprocess,concurrent.futures as cf,os,hashlib,sys
ua="Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36"
cat=json.load(open('cat.json'))
os.makedirs('d',exist_ok=True)
def get(u,lim):
    r=subprocess.run(['curl','-sL','-m','25','-A',ua,'--max-filesize',str(lim),u],capture_output=True)
    return r.stdout.decode('utf8','ignore')
def links(x):
    out=[]
    for i in re.findall(r'<item[ >].*?</item>|<entry[ >].*?</entry>',x,re.S)[:6]:
        m=re.search(r'<link>\s*(?:<!\[CDATA\[)?\s*(https?://[^<\]\s]+)',i) or re.search(r'<link[^>]+rel="alternate"[^>]*href="([^"]+)"',i) or re.search(r'<link[^>]+href="([^"]+)"[^>]*rel="alternate"',i) or re.search(r'<link[^>]+href="([^"]+)"',i)
        if m: out.append(m.group(1).replace('&amp;','&'))
    return out
def one(row):
    c,n,u,v=row
    x=get(u,3000000)
    ls=[l for l in links(x) if l.rstrip('/')!=u.rstrip('/')][:3]
    pages=[get(l,900000) for l in ls[:2]]
    return {'cat':c,'name':n,'url':u,'xml':x[:600000],'links':ls[:2],'pages':pages}
res=[]
with cf.ThreadPoolExecutor(24) as ex:
    for i,r in enumerate(ex.map(one,cat)):
        res.append(r)
        if i%100==0:print(i,flush=True)
for k in range(0,len(res),25):
    json.dump(res[k:k+25],open(f'd/chunk{k//25:02d}.json','w'))
print('done',len(res))
