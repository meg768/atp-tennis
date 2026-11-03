import json,pathlib,sys

sys.path.insert(0, str(pathlib.Path.home() / '.agents/skills/atp-tennis/scripts'))
from database import execute
root=pathlib.Path(__file__).parent
image={'Djokovic':(269,122),'Federer':(224,123),'Nadal':(186,105),'Lendl':(166,92),'McEnroe':(128,94),'Connors':(127,109),'Sampras':(124,71),'Becker':(121,65),'Borg':(113,46),'Agassi':(109,90),'Murray':(105,96),'Edberg':(98,114),'Draper':(69,37),'Hewitt':(65,73),'Wilander':(62,67),'Zverev':(60,88),'Alcaraz':(56,26),'Courier':(53,73),'Medvedev':(52,55),'Safin':(49,50),'Nastase':(48,69),'Kafelnikov':(46,67),'Moya':(44,60),'Ferrero':(41,61),'Kuerten':(38,36),'Roddick':(37,73),'Muster':(37,51),'Rafter':(35,49),'Rios':(22,39),'Newcombe':(21,27)}
sql="""SELECT p.id,p.name,p.highest_rank,e.type,m.status,
SUM(m.winner=p.id AND m.loser_rank BETWEEN 1 AND 10) w,
SUM(m.loser=p.id AND m.winner_rank BETWEEN 1 AND 10) l
FROM players p JOIN matches m ON (m.winner=p.id AND m.loser_rank BETWEEN 1 AND 10) OR (m.loser=p.id AND m.winner_rank BETWEEN 1 AND 10)
JOIN events e ON e.id=m.event
WHERE p.highest_rank=1 OR p.name IN ('Jack Draper','Alexander Zverev')
GROUP BY p.id,p.name,p.highest_rank,e.type,m.status ORDER BY p.name,e.type,m.status"""
(root/'query.sql').write_text(sql)
rows=execute(sql)[0]['rows'];(root/'raw.json').write_text(json.dumps(rows,default=str,indent=2))
players={}
for r in rows:
 p=players.setdefault(r['name'],{'highest':r['highest_rank'],'all':[0,0],'played':[0,0],'tour':[0,0],'completed':[0,0]})
 for rule in ['all','played','tour','completed']:
  if rule!='all' and r['status'] not in (['Completed'] if rule=='completed' else ['Completed','Aborted']):continue
  if rule in ['tour','completed'] and r['type'] in ['Challenger','Rod Laver Cup']:continue
  p[rule][0]+=int(r['w']);p[rule][1]+=int(r['l'])
for name,p in sorted(players.items(),key=lambda x:-x[1]['tour'][0]):
 surname=name.split()[-1];target=image.get(surname)
 print(name,p,'image',target,'MATCH' if target and tuple(p['tour'])==target else '')
(root/'summary.json').write_text(json.dumps(players,indent=2))
