import importlib.util,json
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo
folder=Path(__file__).parent;spec=importlib.util.spec_from_file_location('svenskaspel',Path('/Users/magnus/Library/Mobile Documents/com~apple~CloudDocs/Codex/skills/atp-tennis/scripts/svenskaspel.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);feed=m.fetch();(folder/'odds-final.json').write_text(json.dumps(feed,ensure_ascii=False,default=str))
picks={'Frances Tiafoe':{'min_odds':1.65,'own_probability':.64,'reason':'Hardcourt strength and TA gap, discounted for recent modest form, Halys serve and home crowd.'},'Nuno Borges':{'min_odds':2.55,'own_probability':.41,'reason':'Price needs only 37 percent at 2.70; TA higher. Discount for qualifying loss and modest recent record; Kouame win alone is weak evidence.'}}
result=[]
for item in feed['response']['events']:
 e=item['event']
 for offer in item.get('betOffers',[]):
  if offer.get('criterion',{}).get('englishLabel')!='Match Odds' or offer.get('suspended'):continue
  outcomes=offer.get('outcomes',[])
  if len(outcomes)!=2 or any(o.get('status')!='OPEN' for o in outcomes):continue
  for o in outcomes:
   if o['participant'] not in picks:continue
   start=datetime.fromisoformat(e['start'].replace('Z','+00:00'));assert e['state']=='NOT_STARTED' and start>datetime.fromisoformat(feed['checked_at']) and start.astimezone(ZoneInfo('Europe/Stockholm')).date().isoformat()=='2026-11-04'
   p=picks[o['participant']];price=o['odds']/1000;assert price>=p['min_odds']
   result.append({'player':o['participant'],'opponent':e['awayName'] if o['participant']==e['homeName'] else e['homeName'],'start_swedish':start.astimezone(ZoneInfo('Europe/Stockholm')).isoformat(),'odds':price,**p})
  break
assert len(result)==2
(folder/'own-assessment.json').write_text(json.dumps({'checked_at':feed['checked_at'],'scope':'13 Paris singles fixtures on 2026-11-04 in Svenska Spel feed','basis':'Database TA hardcourt Elo and recent played main-tour event matches, includes qualifying and retirements; official current news. Own probabilities are subjective estimates, not calibrated model outputs.','picks':result,'passes':{'Fils':'Recent retirement; fitness uncertainty despite own reported readiness.','Rinderknech':'Abdominal injury return and today retirement win; Bellucci has three wins on site.','Djokovic':'2h35 match today and 1.26 too short after fitness/rest discount.','Zverev':'Small model margin at 1.38; Musetti has strong recent indoor results.','Paul':'Merida resolved to M0N7, Daniel Merida; no hardcourt Elo available.'},'portfolio_writes':False},ensure_ascii=False,indent=2))
print(json.dumps({'checked_at':feed['checked_at'],'picks':result},ensure_ascii=False))
