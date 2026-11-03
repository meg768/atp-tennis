from pathlib import Path
import sys

sys.path.insert(0, str(Path.home() / '.agents/skills/atp-tennis/scripts'))
from database import execute
from collections import defaultdict
import json
p=Path('analysis/ATP-20261019-04')
q="""WITH appearances AS (
SELECT p.id player,p.name,p.`rank`,m.id match_id,e.date,e.name event,e.surface,m.round,m.status,1 win,m.loser opponent,m.loser_rank opponent_rank FROM players p JOIN matches m ON m.winner=p.id JOIN events e ON e.id=m.event WHERE p.`rank` BETWEEN 1 AND 20 AND e.date BETWEEN '2025-01-01' AND '2026-10-19' AND e.type IN ('Grand Slam','Masters','ATP-500','ATP-250','World Championship') AND m.status IN ('Completed','Aborted') AND m.round NOT IN ('Q1','Q2','Q3')
UNION ALL
SELECT p.id,p.name,p.`rank`,m.id,e.date,e.name,e.surface,m.round,m.status,0,m.winner,m.winner_rank FROM players p JOIN matches m ON m.loser=p.id JOIN events e ON e.id=m.event WHERE p.`rank` BETWEEN 1 AND 20 AND e.date BETWEEN '2025-01-01' AND '2026-10-19' AND e.type IN ('Grand Slam','Masters','ATP-500','ATP-250','ATP-250','World Championship') AND m.status IN ('Completed','Aborted') AND m.round NOT IN ('Q1','Q2','Q3')
), ordered AS (SELECT *,ROW_NUMBER() OVER(PARTITION BY player ORDER BY date DESC,CASE round WHEN 'F' THEN 9 WHEN 'SF' THEN 8 WHEN 'QF' THEN 7 WHEN 'R16' THEN 6 WHEN 'R32' THEN 5 WHEN 'R64' THEN 4 WHEN 'R128' THEN 3 WHEN 'RR' THEN 2 ELSE 1 END DESC,match_id DESC) seq FROM appearances)
SELECT * FROM ordered WHERE seq<=20 ORDER BY `rank`,seq DESC"""
r=execute(q)[0]['rows'];(p/'query.sql').write_text(q);(p/'matches.json').write_text(json.dumps(r,default=str,ensure_ascii=False,indent=2))
g=defaultdict(list)
for x in r:g[x['name']].append(x)
for name,ms in g.items():
 old=ms[:-10];new=ms[-10:];top=[m for m in new if m['opponent_rank'] and m['opponent_rank']<=20]
 print(json.dumps({'name':name,'old':sum(m['win'] for m in old),'new':sum(m['win'] for m in new),'seq':''.join('W' if m['win'] else 'L' for m in new),'last':str(new[-1]['date']),'last_event':new[-1]['event'],'vs20':[sum(m['win'] for m in top),len(top)],'lossranks':[m['opponent_rank'] for m in new if not m['win']]},ensure_ascii=False))
