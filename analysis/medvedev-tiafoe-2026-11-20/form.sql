WITH selected_players AS (
 SELECT id,name FROM players WHERE id IN ('MM58','TD51')
), recent AS (
 SELECT p.id,p.name,m.id AS match_id,e.date AS event_start,e.name AS event_name,e.type,e.surface,m.round,m.score,
 m.winner=p.id AS won,CASE WHEN m.winner=p.id THEN m.loser_rank ELSE m.winner_rank END AS opponent_rank,
 ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY e.date DESC,
 CASE WHEN m.round REGEXP '^RR[0-9]+$' THEN CAST(SUBSTRING(m.round,3) AS UNSIGNED)+20 ELSE CASE m.round WHEN 'F' THEN 10 WHEN 'SF' THEN 9 WHEN 'QF' THEN 8 WHEN 'R16' THEN 7 WHEN 'R32' THEN 6 WHEN 'R64' THEN 5 WHEN 'R128' THEN 4 ELSE 0 END END DESC,m.id DESC) AS recency
 FROM selected_players p JOIN matches m ON m.winner=p.id OR m.loser=p.id JOIN events e ON e.id=m.event
 WHERE m.status='Completed' AND e.date >= '2026-10-01' AND e.date <= '2026-11-20'
 AND e.type IN ('Grand Slam','Masters','ATP-500','ATP-250','World Championship')
 AND m.round NOT IN ('Q1','Q2','Q3')
)
SELECT NOW() AS extracted_at,'ATP MariaDB' AS source,'Completed; ATP-huvudturneringar; event_start >= 2026-10-01; sortering eventdatum fallande, omgång fallande, match-id fallande; endast Hard i detta urval; avbrott och walkover uteslutna' AS scope,
 id,name,COUNT(*) AS matches,SUM(won) AS wins,SUM(NOT won) AS losses,
 SUM(CASE WHEN recency<=5 THEN won ELSE 0 END) AS last5_wins,SUM(CASE WHEN recency<=5 THEN NOT won ELSE 0 END) AS last5_losses,
 JSON_ARRAYAGG(JSON_OBJECT('event_start',event_start,'event',event_name,'round',round,'won',won,'score',score,'opponent_rank',opponent_rank,'recency',recency)) AS details_unsorted
FROM recent GROUP BY id,name ORDER BY name;
