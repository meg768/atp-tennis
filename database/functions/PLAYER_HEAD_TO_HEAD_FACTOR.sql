DELIMITER ;;

DROP FUNCTION IF EXISTS `PLAYER_HEAD_TO_HEAD_FACTOR`;;

CREATE FUNCTION `PLAYER_HEAD_TO_HEAD_FACTOR`(
    playerID VARCHAR(32),
    opponentID VARCHAR(32),
    surface VARCHAR(50)
) RETURNS DECIMAL(10,4)
    DETERMINISTIC
BEGIN
    /*
    PLAYER_HEAD_TO_HEAD_FACTOR(playerID, opponentID, surface)

    Purpose
    - Return one head-to-head-based win signal in the range 0..1 for playerID
      against opponentID.
    - Higher means the head-to-head signal favors playerID.
    - Lower means the head-to-head signal favors opponentID.
    - 0.5 is neutral.

    Why this is a function
    - It returns one scalar value.
    - It is intended to be usable inside regular SQL queries.
    - Example usage:
      SELECT PLAYER_HEAD_TO_HEAD_FACTOR('S0AG', 'A0E2', NULL);
      SELECT PLAYER_HEAD_TO_HEAD_FACTOR('S0AG', 'A0E2', 'Hard');

    Why this exists
    - The odds model already has a head-to-head factor in JavaScript.
    - Keeping the same core logic in MariaDB avoids duplicated business logic.

    High-level model
    1. Look only at completed matches between the two players.
    2. Ignore matches without a known event date.
    3. Restrict the sample to the last 2 years.
    4. If surface is provided, only use matches on that surface.
    5. Apply light smoothing so small samples do not become too extreme.

    Exact smoothing choice
    - wins_player = number of H2H wins for playerID
    - matches = total H2H matches in the sample
    - factor = (wins_player + 1) / (matches + 2)

    Interpretation of the smoothing
    - No matches => 0.5
    - 1-0 H2H => 0.6667
    - 2-0 H2H => 0.7500
    - 0-2 H2H => 0.2500

    Inputs and edge cases
    - Invalid playerID => NULL
    - Invalid opponentID => NULL
    - Same player and opponent => NULL
    - No H2H matches in the sample => 0.5000

    Surface parameter
    - If surface is NULL or empty, all surfaces are included.
    - Otherwise only exact surface matches are included.

    Non-goals in the current version
    - No recency weighting inside the 2-year window
    - No opponent-strength adjustment
    - No tournament-importance adjustment
    */

    DECLARE v_matches INT DEFAULT 0;
    DECLARE v_wins_player INT DEFAULT 0;
    DECLARE v_surface VARCHAR(50) DEFAULT NULL;

    IF playerID IS NULL OR TRIM(playerID) = '' OR opponentID IS NULL OR TRIM(opponentID) = '' THEN
        RETURN NULL;
    END IF;

    IF UPPER(playerID) = UPPER(opponentID) THEN
        RETURN NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM players WHERE id = playerID) THEN
        RETURN NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM players WHERE id = opponentID) THEN
        RETURN NULL;
    END IF;

    SET v_surface = NULLIF(TRIM(surface), '');

    SELECT
        COUNT(*) AS matches_played,
        COALESCE(SUM(CASE WHEN m.winner = playerID THEN 1 ELSE 0 END), 0) AS wins_player
    INTO
        v_matches,
        v_wins_player
    FROM matches m
    JOIN events e ON e.id = m.event
    WHERE
        m.status = 'Completed'
        AND e.date IS NOT NULL
        AND e.date >= DATE_SUB(CURDATE(), INTERVAL 2 YEAR)
        AND (
            (m.winner = playerID AND m.loser = opponentID)
            OR
            (m.winner = opponentID AND m.loser = playerID)
        )
        AND (v_surface IS NULL OR e.surface = v_surface);

    RETURN ROUND((v_wins_player + 1) / (v_matches + 2), 4);
END;;

DELIMITER ;
