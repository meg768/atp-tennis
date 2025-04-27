DROP VIEW IF EXISTS `flatly`;

CREATE VIEW `flatly` AS
SELECT
    matches.id AS id,
    C.date AS event_date,
    C.id AS event_id,
    C.name AS event_name,
    C.location AS event_location,
    C.type AS event_type,
    C.surface AS event_surface,
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
    event_date