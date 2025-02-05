DROP VIEW IF EXISTS `match-winners`;

CREATE VIEW `match-winners` AS
SELECT
    winner AS name,
    WIOC AS country,
    COUNT(winner) AS wins
FROM
    matches
GROUP BY
    winner
ORDER BY
    wins DESC