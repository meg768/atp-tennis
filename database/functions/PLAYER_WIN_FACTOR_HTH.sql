DELIMITER ;;

DROP FUNCTION IF EXISTS `PLAYER_WIN_FACTOR_HTH`;;

CREATE FUNCTION `PLAYER_WIN_FACTOR_HTH`(
    playerID VARCHAR(32),
    opponentID VARCHAR(32),
    surface VARCHAR(50)
) RETURNS DECIMAL(10,4)
    DETERMINISTIC
BEGIN
    /*
    PLAYER_WIN_FACTOR_HTH(playerID, opponentID, surface)

    Purpose
    - Return a head-to-head-based win probability for playerID against
      opponentID.
    - Higher return value means playerID is more likely to win.
    - 0.5 is neutral.

    Model
    - This function is intentionally head-to-head-only.
    - It does not use Elo, ranking, form, or ATP stat ratings.

    Sample window
    - Look only at completed matches between the two players.
    - Ignore matches without a known event date.
    - Restrict the sample to the last 2 years.
    - If surface is provided, only use matches on that surface.
    - If surface is NULL or empty, use all surfaces.

    Sample weighting
    - raw_hth = wins_player / matches
    - sample_weight = matches / (matches + 5)
    - hth_probability = 0.5 + (raw_hth - 0.5) * sample_weight
    - No matches => 0.5
    - Small samples stay closer to neutral
    - Larger samples are allowed to matter more

    Inputs and edge cases
    - playerID and opponentID may be ATP ids or player names
    - Invalid player reference => NULL
    - Invalid opponent reference => NULL
    - Same player and opponent => NULL
    */

    DECLARE v_player_id VARCHAR(32) DEFAULT NULL;
    DECLARE v_opponent_id VARCHAR(32) DEFAULT NULL;
    DECLARE v_surface VARCHAR(50) DEFAULT NULL;
    DECLARE v_surface_name VARCHAR(50) DEFAULT NULL;
    DECLARE v_matches INT DEFAULT 0;
    DECLARE v_wins_player INT DEFAULT 0;
    DECLARE v_raw_hth DOUBLE DEFAULT 0.5;
    DECLARE v_sample_k DOUBLE DEFAULT 5;
    DECLARE v_sample_weight DOUBLE DEFAULT 0;
    DECLARE v_probability DOUBLE DEFAULT 0.5;

    IF playerID IS NULL OR TRIM(playerID) = '' OR opponentID IS NULL OR TRIM(opponentID) = '' THEN
        RETURN NULL;
    END IF;

    SET v_player_id = PLAYER_LOOKUP(playerID);
    SET v_opponent_id = PLAYER_LOOKUP(opponentID);

    IF v_player_id IS NULL OR v_opponent_id IS NULL THEN
        RETURN NULL;
    END IF;

    IF UPPER(v_player_id) = UPPER(v_opponent_id) THEN
        RETURN NULL;
    END IF;

    SET v_surface = UPPER(NULLIF(TRIM(surface), ''));
    SET v_surface_name = CONCAT(UCASE(LEFT(v_surface, 1)), LCASE(SUBSTRING(v_surface, 2)));

    SELECT
        COUNT(*) AS matches_played,
        COALESCE(SUM(CASE WHEN m.winner = v_player_id THEN 1 ELSE 0 END), 0) AS wins_player
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
            (m.winner = v_player_id AND m.loser = v_opponent_id)
            OR
            (m.winner = v_opponent_id AND m.loser = v_player_id)
        )
        AND (
            v_surface IS NULL
            OR e.surface = v_surface_name
        );

    IF v_matches = 0 THEN
        RETURN 0.5;
    END IF;

    SET v_raw_hth = v_wins_player / v_matches;
    SET v_sample_weight = v_matches / (v_matches + v_sample_k);
    SET v_probability = 0.5 + (v_raw_hth - 0.5) * v_sample_weight;

    RETURN ROUND(v_probability, 4);
END;;

DELIMITER ;
