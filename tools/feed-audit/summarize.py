"""Reads report.json (from an.js) and prints the feeds worth a look. Run: python3 summarize.py [report.json]"""
import json,sys,time,collections
R=json.load(open(sys.argv[1] if len(sys.argv)>1 else 'report.json'))
now=time.time()*1000;flags=collections.defaultdict(list)
for r in R:
    pg=r.get('pages',[])
    if r.get('items',0)==0:flags['no stories (dead, or blocking this machine)'].append(r['name']);continue
    if r['newest'] and now-r['newest']>120*864e5:flags['nothing new for 4+ months'].append(r['name'])
    if r['linkish']>=5:flags['posts that are mostly links'].append((r['name'],r['linkish']))
    if any(p.get('foot') for p in pg):flags['page text is the site footer'].append(r['name'])
    if any(p.get('lk',0)>=.45 and p.get('len',0)>0 for p in pg):flags['page is mostly links'].append(r['name'])
    if pg and all(p.get('nullEx') for p in pg):flags['no article found on page (often a bot-check page, ~5.5 KB)'].append(r['name'])
    if any(p.get('q')==False for p in pg):flags['page text looks garbled'].append(r['name'])
for k,v in flags.items():print('\n##',k,len(v));print(v)
