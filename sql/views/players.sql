DROP VIEW IF EXISTS `players`;

CREATE VIEW `players` AS
SELECT DISTINCT
    winner AS name
FROM
    matches
UNION
SELECT DISTINCT
    loser AS name
FROM
    matches
ORDER BY
    name
