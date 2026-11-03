-- Estimated ranking from the latest recorded match on/before the requested date.
-- Dates are event start dates, not exact match dates. No status/event filters.
-- Missing/nonpositive ranks are skipped. No future observations are used.
-- Same-date ties use match ID descending for a reproducible selection.
-- Accepts an ATP ID or a name via PLAYER_LOOKUP; returns NULL if unavailable.
-- Create only: intentionally does not replace an existing routine.
DELIMITER $$
CREATE FUNCTION PLAYER_RANK_AT_DATE(player VARCHAR(255), as_of_date DATE)
RETURNS INT
NOT DETERMINISTIC
READS SQL DATA
SQL SECURITY INVOKER
BEGIN
    DECLARE resolved_id VARCHAR(32) DEFAULT NULL;
    DECLARE estimated_rank INT DEFAULT NULL;

    IF player IS NULL OR TRIM(player) = '' OR as_of_date IS NULL THEN
        RETURN NULL;
    END IF;
    SET resolved_id = PLAYER_LOOKUP(player);
    IF resolved_id IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT observation.player_rank INTO estimated_rank
    FROM (
        SELECT m.winner_rank AS player_rank, e.date AS observed_date, m.id AS match_id
        FROM matches m JOIN events e ON e.id = m.event
        WHERE m.winner = resolved_id AND m.winner_rank > 0 AND e.date <= as_of_date
        UNION ALL
        SELECT m.loser_rank AS player_rank, e.date AS observed_date, m.id AS match_id
        FROM matches m JOIN events e ON e.id = m.event
        WHERE m.loser = resolved_id AND m.loser_rank > 0 AND e.date <= as_of_date
    ) observation
    ORDER BY observation.observed_date DESC, observation.match_id DESC
    LIMIT 1;
    RETURN estimated_rank;
END$$
DELIMITER ;
