DROP VIEW IF EXISTS `grand-slam-winners`;

CREATE VIEW `grand-slam-winners` AS
SELECT
    winner AS name,
    WIOC AS country,
    COUNT(winner) AS wins
FROM
    matches
WHERE
    round = 'F'
    AND level = 'Grand Slam'
GROUP BY
    winner
ORDER BY
    wins DESC,
    winner;
