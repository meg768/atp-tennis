SELECT
    sets_played AS `Antal set`,
    COUNT(*) AS `Antal matcher`,
    COUNT(*) / SUM(COUNT(*)) OVER () AS `Sannolikhet`
FROM
    (
        SELECT
            NUMBER_OF_SETS_PLAYED (score) AS sets_played
        FROM
            flatly
        WHERE
            event_type = 'Grand Slam'
            AND round IN ('F', 'SF', 'QF', 'R16', 'R32', 'R64', 'R128')
            AND event_date >= DATE_SUB(CURDATE(), INTERVAL 5 YEAR)
    ) x
WHERE
    sets_played > 0
GROUP BY
    sets_played
ORDER BY
    sets_played;
