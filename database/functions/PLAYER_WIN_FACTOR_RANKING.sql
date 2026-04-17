DELIMITER ;;

DROP FUNCTION IF EXISTS `PLAYER_WIN_FACTOR_RANKING`;;

CREATE FUNCTION `PLAYER_WIN_FACTOR_RANKING`(
    playerID VARCHAR(32),
    opponentID VARCHAR(32),
    surface VARCHAR(50)
) RETURNS DECIMAL(10,4)
    DETERMINISTIC
BEGIN
    /*
    PLAYER_WIN_FACTOR_RANKING(playerID, opponentID, surface)

    Purpose
    - Return a ranking-based win probability for playerID against opponentID.
    - Higher return value means playerID is more likely to win.
    - 0.5 is neutral.

    Model
    - This function is intentionally ranking-only.
    - It does not use Elo, form, head-to-head, or ATP stat ratings.
    - The surface argument is accepted for API consistency but is currently
      ignored because ATP ranking is not surface-specific.

    Ranking signal
    - Lower ranking number is better.
    - The model uses the log distance between the players' rankings so that
      differences near the top matter more than the same absolute gap lower
      down the ranking list.

    Formula
    - rank_score = LN(rank_opponent) - LN(rank_player)
    - ranking_probability = 1 / (1 + EXP(-rank_score))

    Interpretation
    - Equal ranks => 0.5
    - Better rank for playerID => above 0.5
    - Worse rank for playerID => below 0.5

    Inputs and edge cases
    - playerID and opponentID may be ATP ids or player names
    - Invalid player reference => NULL
    - Invalid opponent reference => NULL
    - Same player and opponent => NULL
    - Missing or non-positive rank on either side => 0.5
    */

    DECLARE v_player_id VARCHAR(32) DEFAULT NULL;
    DECLARE v_opponent_id VARCHAR(32) DEFAULT NULL;
    DECLARE v_rank_player INT DEFAULT NULL;
    DECLARE v_rank_opponent INT DEFAULT NULL;
    DECLARE v_rank_score DOUBLE DEFAULT 0;
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

    SELECT rank
    INTO v_rank_player
    FROM players
    WHERE id = v_player_id
    LIMIT 1;

    SELECT rank
    INTO v_rank_opponent
    FROM players
    WHERE id = v_opponent_id
    LIMIT 1;

    IF v_rank_player IS NULL OR v_rank_player <= 0 OR v_rank_opponent IS NULL OR v_rank_opponent <= 0 THEN
        RETURN 0.5;
    END IF;

    SET v_rank_score = LN(v_rank_opponent) - LN(v_rank_player);
    SET v_probability = 1 / (1 + EXP(-v_rank_score));

    RETURN ROUND(v_probability, 4);
END;;

DELIMITER ;
