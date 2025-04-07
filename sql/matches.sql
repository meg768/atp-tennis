SELECT
    matches.id,
    C.date,
    C.id AS event_id,
    C.name AS event,
    C.location,
    C.type,
    C.surface,
    matches.round,
    A.name AS winner,
    B.name AS loser,
    A.id AS winner_id,
    matches.winner_rank,
    B.id AS loser_id,
    matches.loser_rank,
    matches.score,
    matches.duration
FROM
    matches
    LEFT JOIN players AS A ON matches.winner = A.id
    LEFT JOIN players AS B ON matches.loser = B.id
    LEFT JOIN events AS C ON matches.event = C.id
ORDER BY
    C.date