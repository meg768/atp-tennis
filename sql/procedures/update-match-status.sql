DROP PROCEDURE IF EXISTS sp_update_match_status;

DELIMITER @@


CREATE DEFINER = `root` @`%` PROCEDURE `sp_update_match_status` (IN force_update BOOLEAN)
BEGIN
CALL sp_log ('Updating match status for matches...');

UPDATE matches m
JOIN events e ON e.id = m.event
SET
    m.status = CASE
        WHEN m.score IS NULL
        OR m.score = '' THEN 'Unknown'
        WHEN m.score REGEXP '(W/O|WO)' THEN 'Walkover'
        WHEN m.score REGEXP '(RET|DEF|ABD|ABN|INC)' THEN 'Aborted'
        -- NYTT: slutar på ett pågående set (ingen kan ha vunnit setet)
        WHEN m.score REGEXP '([[:space:]]|^)[0-5]-[0-5]$' THEN 'Aborted'
        -- Din regel
        WHEN NUMBER_OF_SETS_PLAYED (m.score) = 0 THEN 'Aborted'
        -- Grand Slam main draw: best-of-5
        WHEN e.type = 'Grand Slam'
        AND m.round IN ('F', 'SF', 'QF', 'R16', 'R32', 'R64', 'R128')
        AND NUMBER_OF_SETS_PLAYED (m.score) >= 3 THEN 'Completed'
        WHEN e.type = 'Grand Slam'
        AND m.round IN ('F', 'SF', 'QF', 'R16', 'R32', 'R64', 'R128')
        AND NUMBER_OF_SETS_PLAYED (m.score) < 3 THEN 'Aborted'
        -- Övrigt: best-of-3
        WHEN NUMBER_OF_SETS_PLAYED (m.score) >= 2 THEN 'Completed'
        ELSE 'Aborted'
    END
WHERE
    force_update = TRUE
    OR m.status IS NULL;

END

@@


DELIMITER ;