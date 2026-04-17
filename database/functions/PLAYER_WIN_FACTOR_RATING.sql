DELIMITER ;;

DROP FUNCTION IF EXISTS `PLAYER_WIN_FACTOR_RATING`;;

CREATE FUNCTION `PLAYER_WIN_FACTOR_RATING`(
    playerID VARCHAR(32),
    opponentID VARCHAR(32),
    surface VARCHAR(50)
) RETURNS DECIMAL(10,4)
    DETERMINISTIC
BEGIN
    /*
    PLAYER_WIN_FACTOR_RATING(playerID, opponentID, surface)

    Purpose
    - Return a rating-based win probability for playerID against opponentID.
    - Higher return value means playerID is more likely to win.
    - 0.5 is neutral.

    Available data
    - serve_rating
    - return_rating
    - pressure_rating
    - These ratings are stored on a normalized 0..100 scale in players.

    Model
    - This function is intentionally rating-only.
    - It does not use Elo, ranking, form, or head-to-head.
    - The surface argument is accepted for API consistency but is currently
      ignored because the ATP ratings are not surface-specific in this model.

    Metric weights
    - Serve    => 35%
    - Return   => 45%
    - Pressure => 20%

    Missing data
    - A metric is included only if both players have that metric.
    - Active metric weights are renormalized across the included metrics.
    - If no shared rating metrics exist, return 0.5.

    Probability conversion
    - rating_gap = weighted_rating_player - weighted_rating_opponent
    - rating_elo_gap = rating_gap * 2
    - probability = 1 / (1 + POW(10, -rating_elo_gap / 400))

    Interpretation
    - One rating point is treated as roughly two Elo points.
    - This keeps the rating factor meaningful without making it too extreme.

    Inputs and edge cases
    - playerID and opponentID may be ATP ids or player names
    - Invalid player reference => NULL
    - Invalid opponent reference => NULL
    - Same player and opponent => NULL
    */

    DECLARE v_player_id VARCHAR(32) DEFAULT NULL;
    DECLARE v_opponent_id VARCHAR(32) DEFAULT NULL;
    DECLARE v_player_serve DOUBLE DEFAULT NULL;
    DECLARE v_player_return DOUBLE DEFAULT NULL;
    DECLARE v_player_pressure DOUBLE DEFAULT NULL;
    DECLARE v_opponent_serve DOUBLE DEFAULT NULL;
    DECLARE v_opponent_return DOUBLE DEFAULT NULL;
    DECLARE v_opponent_pressure DOUBLE DEFAULT NULL;

    DECLARE v_serve_weight DOUBLE DEFAULT 0.35;
    DECLARE v_return_weight DOUBLE DEFAULT 0.45;
    DECLARE v_pressure_weight DOUBLE DEFAULT 0.20;
    DECLARE v_active_weight_sum DOUBLE DEFAULT 0;

    DECLARE v_player_rating DOUBLE DEFAULT 0;
    DECLARE v_opponent_rating DOUBLE DEFAULT 0;
    DECLARE v_rating_gap DOUBLE DEFAULT 0;
    DECLARE v_rating_elo_gap DOUBLE DEFAULT 0;
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

    SELECT serve_rating, return_rating, pressure_rating
    INTO v_player_serve, v_player_return, v_player_pressure
    FROM players
    WHERE id = v_player_id
    LIMIT 1;

    SELECT serve_rating, return_rating, pressure_rating
    INTO v_opponent_serve, v_opponent_return, v_opponent_pressure
    FROM players
    WHERE id = v_opponent_id
    LIMIT 1;

    IF v_player_serve IS NOT NULL AND v_opponent_serve IS NOT NULL THEN
        SET v_player_rating = v_player_rating + (v_player_serve * v_serve_weight);
        SET v_opponent_rating = v_opponent_rating + (v_opponent_serve * v_serve_weight);
        SET v_active_weight_sum = v_active_weight_sum + v_serve_weight;
    END IF;

    IF v_player_return IS NOT NULL AND v_opponent_return IS NOT NULL THEN
        SET v_player_rating = v_player_rating + (v_player_return * v_return_weight);
        SET v_opponent_rating = v_opponent_rating + (v_opponent_return * v_return_weight);
        SET v_active_weight_sum = v_active_weight_sum + v_return_weight;
    END IF;

    IF v_player_pressure IS NOT NULL AND v_opponent_pressure IS NOT NULL THEN
        SET v_player_rating = v_player_rating + (v_player_pressure * v_pressure_weight);
        SET v_opponent_rating = v_opponent_rating + (v_opponent_pressure * v_pressure_weight);
        SET v_active_weight_sum = v_active_weight_sum + v_pressure_weight;
    END IF;

    IF v_active_weight_sum = 0 THEN
        RETURN 0.5;
    END IF;

    SET v_player_rating = v_player_rating / v_active_weight_sum;
    SET v_opponent_rating = v_opponent_rating / v_active_weight_sum;
    SET v_rating_gap = v_player_rating - v_opponent_rating;
    SET v_rating_elo_gap = v_rating_gap * 2;
    SET v_probability = 1 / (1 + POW(10, -v_rating_elo_gap / 400));

    RETURN ROUND(v_probability, 4);
END;;

DELIMITER ;
