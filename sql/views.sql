/* Queries */
DROP VIEW IF EXISTS `query-hotlist-60`;

CREATE VIEW `query-hotlist-60` AS
SELECT DISTINCT
    WINNER_NAME AS NAME,
    (
        SELECT
            COUNT(WINNER_NAME)
        FROM
            DATA
        WHERE
            WINNER_NAME = NAME
            AND DATEDIFF(CURDATE(), TOURNEY_DATE) < 60
    ) AS WINS
FROM
    DATA
ORDER BY
    WINS DESC
LIMIT
    10;

DROP VIEW IF EXISTS `query-hotlist-90`;

CREATE VIEW `query-hotlist-90` AS
SELECT DISTINCT
    WINNER_NAME AS NAME,
    (
        SELECT
            COUNT(WINNER_NAME)
        FROM
            DATA
        WHERE
            WINNER_NAME = NAME
            AND DATEDIFF(CURDATE(), TOURNEY_DATE) < 90
    ) AS WINS
FROM
    DATA
ORDER BY
    WINS DESC
LIMIT
    10;

;

DROP VIEW IF EXISTS `query-hotlist-30`;

CREATE VIEW `query-hotlist-30` AS
SELECT DISTINCT
    WINNER_NAME AS NAME,
    (
        SELECT
            COUNT(WINNER_NAME)
        FROM
            DATA
        WHERE
            WINNER_NAME = NAME
            AND DATEDIFF(CURDATE(), TOURNEY_DATE) < 30
    ) AS WINS
FROM
    DATA
ORDER BY
    WINS DESC
LIMIT
    10;