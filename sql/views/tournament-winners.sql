DROP VIEW IF EXISTS `tournament-winners`;

CREATE VIEW `tournament-winners` AS
SELECT
    winner AS name,
    WIOC AS country,
    COUNT(winner) AS wins
FROM
    matches
WHERE
    round = 'F'
GROUP BY
    winner
ORDER BY
    wins DESC,
    winner;
