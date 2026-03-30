DELIMITER ;;

DROP FUNCTION IF EXISTS `PLAYER_RANK_FACTOR`;;

CREATE FUNCTION `PLAYER_RANK_FACTOR`(
    playerID VARCHAR(32),
    opponentID VARCHAR(32)
) RETURNS DECIMAL(10,4)
    DETERMINISTIC
BEGIN
    /*
    PLAYER_RANK_FACTOR(playerID, opponentID)

    Purpose
    - Return one ranking-based win signal in the range 0.01..0.99 for playerID
      against opponentID.
    - Higher means the ranking signal favors playerID.
    - Lower means the ranking signal favors opponentID.
    - 0.5 is neutral.

    Why this is a function
    - It returns one scalar value.
    - It is intended to be usable inside regular SQL queries.
    - Example usage:
      SELECT PLAYER_RANK_FACTOR('S0AG', 'A0E2');

    Why this exists
    - The odds model already has a rank-based factor in JavaScript.
    - Keeping the same formula in MariaDB avoids duplicated logic in two places.

    Exact formula
    - score = LN(rank_opponent) - LN(rank_player)
    - rank_factor = 1 / (1 + EXP(-score))

    Interpretation
    - Lower ATP rank number is better.
    - The log transform makes ranking gaps near the top matter more than the
      same absolute gap lower down the ranking list.
    - Examples:
      rank 5 vs 20 should matter more than rank 105 vs 120

    Inputs and edge cases
    - Invalid playerID => NULL
    - Invalid opponentID => NULL
    - Same player and opponent => NULL
    - Missing or non-positive rank on either side => NULL

    Safety clamp
    - The return value is clamped to 0.01..0.99.
    - This matches the current JS logic and avoids hard 0/1 probabilities.
    */

    DECLARE v_rank_player INT DEFAULT NULL;
    DECLARE v_rank_opponent INT DEFAULT NULL;
    DECLARE v_score DOUBLE DEFAULT NULL;
    DECLARE v_probability DOUBLE DEFAULT NULL;

    IF playerID IS NULL OR TRIM(playerID) = '' OR opponentID IS NULL OR TRIM(opponentID) = '' THEN
        RETURN NULL;
    END IF;

    IF UPPER(playerID) = UPPER(opponentID) THEN
        RETURN NULL;
    END IF;

    SELECT rank INTO v_rank_player
    FROM players
    WHERE id = playerID
    LIMIT 1;

    SELECT rank INTO v_rank_opponent
    FROM players
    WHERE id = opponentID
    LIMIT 1;

    IF v_rank_player IS NULL OR v_rank_player <= 0 OR v_rank_opponent IS NULL OR v_rank_opponent <= 0 THEN
        RETURN NULL;
    END IF;

    SET v_score = LN(v_rank_opponent) - LN(v_rank_player);
    SET v_probability = 1 / (1 + EXP(-v_score));
    SET v_probability = GREATEST(0.01, LEAST(0.99, v_probability));

    RETURN ROUND(v_probability, 4);
END;;

DELIMITER ;
