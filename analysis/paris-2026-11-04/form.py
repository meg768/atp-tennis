import importlib.util,json
from pathlib import Path
folder=Path(__file__).parent;spec=importlib.util.spec_from_file_location('database',Path('/Users/magnus/Library/Mobile Documents/com~apple~CloudDocs/Codex/skills/atp-tennis/scripts/database.py'));db=importlib.util.module_from_spec(spec);spec.loader.exec_module(db)
ids=['TD51','HB64','BT72','KE29','RC91','B0GG','Z355','M0EJ','D643','H0BH','F0F1','M0FH']
sql='''WITH played AS (
SELECT m.id,e.date,e.name event,e.type,e.surface,m.round,m.winner player,m.loser opponent,m.loser_rank opponent_rank,1 won,m.score,m.status FROM matches m JOIN events e ON e.id=m.event
WHERE e.surface='Hard' AND e.date BETWEEN '2026-08-01' AND '2026-11-03' AND e.type IN ('Masters','ATP-500','ATP-250','Grand Slam') AND m.status IN ('Completed','Aborted')
UNION ALL
SELECT m.id,e.date,e.name,e.type,e.surface,m.round,m.loser,m.winner,m.winner_rank,0,m.score,m.status FROM matches m JOIN events e ON e.id=m.event
WHERE e.surface='Hard' AND e.date BETWEEN '2026-08-01' AND '2026-11-03' AND e.type IN ('Masters','ATP-500','ATP-250','Grand Slam') AND m.status IN ('Completed','Aborted')
), ranked AS (SELECT played.*,ROW_NUMBER() OVER(PARTITION BY player ORDER BY date DESC,CASE round WHEN 'F' THEN 10 WHEN 'SF' THEN 9 WHEN 'QF' THEN 8 WHEN 'R16' THEN 7 WHEN 'R32' THEN 6 WHEN 'R64' THEN 5 WHEN 'R128' THEN 4 WHEN 'Q3' THEN 3 WHEN 'Q2' THEN 2 WHEN 'Q1' THEN 1 ELSE 0 END DESC,id DESC) rn FROM played WHERE player IN ('''+','.join(['%s']*len(ids))+'''))
SELECT r.*,p.name opponent_name FROM ranked r LEFT JOIN players p ON p.id=r.opponent WHERE rn<=10 ORDER BY player,rn'''
rows=db.execute(sql,ids)[0]['rows'];(folder/'recent-hard.json').write_text(json.dumps(rows,default=str,ensure_ascii=False,indent=2))
profiles={r['id']:r['name'] for r in db.execute('SELECT id,name FROM players WHERE id IN ('+','.join(['%s']*len(ids))+')',ids)[0]['rows']}
for id in ids:
 own=[r for r in rows if r['player']==id];print(json.dumps({'player':profiles[id],'wins':sum(r['won'] for r in own),'played':len(own),'recent':[{'event':r['event'],'event_date':r['date'],'round':r['round'],'opponent':r['opponent_name'],'won':r['won'],'score_winner_first':r['score'],'status':r['status']} for r in own[:5]]},default=str,ensure_ascii=False))
print('MERIDA',json.dumps(db.execute('SELECT id,name,rank,elo_rank_hard FROM players WHERE name LIKE %s',('%Merida%',))[0]['rows'],ensure_ascii=False))
