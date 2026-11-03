import importlib.util,json
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo
SKILL=Path('/Users/magnus/Library/Mobile Documents/com~apple~CloudDocs/Codex/skills/atp-tennis');folder=Path(__file__).parent

def load(name):
 spec=importlib.util.spec_from_file_location(name,SKILL/'scripts'/f'{name}.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
feed=load('svenskaspel').fetch();(folder/'odds-initial.json').write_text(json.dumps(feed,ensure_ascii=False,default=str))
db=load('database');events=db.execute('SELECT id,date,name,type,surface FROM events WHERE id=%s',('2026-352',))[0]['rows'];assert len(events)==1 and events[0]['surface']=='Hard'
rows=[]
for item in feed['response']['events']:
 e=item['event'];start=datetime.fromisoformat(e['start'].replace('Z','+00:00'))
 if 'paris' not in str(e.get('group','')).lower() or e.get('state')!='NOT_STARTED' or start.astimezone(ZoneInfo('Europe/Stockholm')).date().isoformat()!='2026-11-04':continue
 for offer in item.get('betOffers',[]):
  outcomes=offer.get('outcomes',[])
  if offer.get('criterion',{}).get('englishLabel')!='Match Odds' or offer.get('suspended') or len(outcomes)!=2 or any(o.get('status')!='OPEN' for o in outcomes):continue
  prices={o['participant']:o['odds']/1000 for o in outcomes}
  names=(e['homeName'],e['awayName']);ids=[];profiles=[]
  for name in names:
   p=db.execute('SELECT id,name,rank,elo_rank_hard,elo_rank,age,country FROM players WHERE name=%s',(name,))[0]['rows']
   ids.append(p[0]['id'] if len(p)==1 else None);profiles.append(p)
  p=db.execute('SELECT WIN_PROBABILITY_TA(%s,%s,%s) AS p',(*ids,'Hard'))[0]['rows'][0]['p'] if all(ids) else None
  row={'id':e['id'],'start':e['start'],'names':names,'ids':ids,'prices':[prices[n] for n in names],'p':[p,1-p] if p is not None else None,'profiles':profiles}
  if p is not None:row.update({'ta':[round(1/min(.999,max(.001,q*1.05)),2) for q in (p,1-p)],'model_ev':[round((q*prices[n]-1)*100,1) for q,n in zip((p,1-p),names)]})
  rows.append(row);break
(folder/'comparison.json').write_text(json.dumps({'checked_at':feed['checked_at'],'event':events,'rows':rows},ensure_ascii=False,default=str,indent=2))
print(json.dumps({'checked_at':feed['checked_at'],'rows':rows},ensure_ascii=False,default=str))
