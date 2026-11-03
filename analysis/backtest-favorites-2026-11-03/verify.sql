SELECT COUNT(*) AS settled_matches,
 SUM((o.player_oddset < o.opponent_oddset AND m.winner = o.player)
  OR (o.opponent_oddset < o.player_oddset AND m.winner = o.opponent)) AS wins,
 SUM(CASE
  WHEN o.player_oddset < o.opponent_oddset AND m.winner = o.player THEN 100*o.player_oddset
  WHEN o.opponent_oddset < o.player_oddset AND m.winner = o.opponent THEN 100*o.opponent_oddset
  ELSE 0 END) AS payout_sek
FROM odds o
JOIN matches m ON m.event=o.event
 AND ((m.winner=o.player AND m.loser=o.opponent)
  OR (m.winner=o.opponent AND m.loser=o.player))
WHERE m.status='Completed'
 AND o.player_oddset>1 AND o.opponent_oddset>1
 AND o.player_oddset<>o.opponent_oddset;
