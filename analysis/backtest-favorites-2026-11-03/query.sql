SELECT o.*, m.id AS match_id, m.winner AS result_winner,
       m.loser AS result_loser, m.status AS result_status,
       m.score AS result_score, m.round AS result_round,
       e.name AS linked_event_name, e.date AS event_start_date
FROM odds o
LEFT JOIN events e ON e.id = o.event
LEFT JOIN matches m ON m.event = o.event
 AND ((m.winner = o.player AND m.loser = o.opponent)
   OR (m.winner = o.opponent AND m.loser = o.player))
ORDER BY o.time, o.id, m.id;
