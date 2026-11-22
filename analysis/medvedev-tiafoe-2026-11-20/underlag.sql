WITH probability AS (SELECT WIN_PROBABILITY_TA('MM58','TD51','Hard') AS p)
SELECT NOW() AS database_time, 'MariaDB ATP; Completed; alla importerade singelnivåer inklusive kval; eventdatum är turneringsstart' AS scope,
(SELECT JSON_ARRAYAGG(JSON_OBJECT('id',id,'name',name,'country',country,'rank',rank,'hard_elo',elo_rank_hard)) FROM players WHERE id IN ('MM58','TD51')) AS players,
(SELECT JSON_ARRAYAGG(JSON_OBJECT('event_start',e.date,'event_id',e.id,'name',e.name,'type',e.type,'surface',e.surface,'round',m.round,'winner',w.name,'loser',l.name,'score',m.score,'status',m.status,'duration',m.duration)) FROM matches m JOIN events e ON e.id=m.event JOIN players w ON w.id=m.winner JOIN players l ON l.id=m.loser WHERE m.status='Completed' AND ((m.winner IN ('MM58','TD51') OR m.loser IN ('MM58','TD51')) AND e.date >= '2026-10-01' OR (m.winner='MM58' AND m.loser='TD51') OR (m.winner='TD51' AND m.loser='MM58'))) AS matches_unsorted,
p,1-p AS tiafoe_probability,1/p AS medvedev_fair,1/(1-p) AS tiafoe_fair,ROUND(1/(p*1.05),2) AS medvedev_ta,ROUND(1/((1-p)*1.05),2) AS tiafoe_ta,p*1.36-1 AS medvedev_ev,(1-p)*3.20-1 AS tiafoe_ev,
(1/1.36)/(1/1.36+1/3.20) AS market_medvedev_no_margin,
(1/3.20)/(1/1.36+1/3.20) AS market_tiafoe_no_margin
FROM probability;
