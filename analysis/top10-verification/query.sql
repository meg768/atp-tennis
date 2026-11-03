SELECT p.id,p.name,p.highest_rank,e.type,m.status,
SUM(m.winner=p.id AND m.loser_rank BETWEEN 1 AND 10) w,
SUM(m.loser=p.id AND m.winner_rank BETWEEN 1 AND 10) l
FROM players p JOIN matches m ON (m.winner=p.id AND m.loser_rank BETWEEN 1 AND 10) OR (m.loser=p.id AND m.winner_rank BETWEEN 1 AND 10)
JOIN events e ON e.id=m.event
WHERE p.highest_rank=1 OR p.name IN ('Jack Draper','Alexander Zverev')
GROUP BY p.id,p.name,p.highest_rank,e.type,m.status ORDER BY p.name,e.type,m.status