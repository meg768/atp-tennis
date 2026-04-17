DELIMITER ;;

DROP FUNCTION IF EXISTS `PLAYER_WIN_FACTOR_ELO`;;

CREATE FUNCTION `PLAYER_WIN_FACTOR_ELO`(
    playerID VARCHAR(32),
    opponentID VARCHAR(32),
    surface VARCHAR(50)
) RETURNS DECIMAL(10,4)
    DETERMINISTIC
BEGIN
    /*
    PLAYER_WIN_FACTOR_ELO(playerID, opponentID, surface)

    Purpose
    - Return the Elo-based win probability for playerID against opponentID.
    - Higher return value means playerID is more likely to win.
    - 0.5 is neutral.

    Model
    - This function is intentionally Elo-only.
    - No ranking adjustment is applied.
    - No form adjustment is applied.
    - No head-to-head adjustment is applied.
    - All probability comes directly from the selected Elo gap.

    Surface handling
    - Hard => use elo_rank_hard, falling back to elo_rank
    - Clay => use elo_rank_clay, falling back to elo_rank
    - Grass => use elo_rank_grass, falling back to elo_rank
    - NULL, empty, or any other surface => use elo_rank

    Formula
    - elo_gap = elo_player - elo_opponent
    - probability = 1 / (1 + POW(10, -elo_gap / 400))

    Inputs and edge cases
    - playerID and opponentID may be ATP ids or player names
    - Invalid player reference => NULL
    - Invalid opponent reference => NULL
    - Same player and opponent => NULL
    - Missing usable Elo on either side => NULL
    */

    DECLARE v_surface VARCHAR(50) DEFAULT NULL;
    DECLARE v_player_id VARCHAR(32) DEFAULT NULL;
    DECLARE v_opponent_id VARCHAR(32) DEFAULT NULL;
    DECLARE v_elo_player DOUBLE DEFAULT NULL;
    DECLARE v_elo_opponent DOUBLE DEFAULT NULL;
    DECLARE v_elo_gap DOUBLE DEFAULT NULL;
    DECLARE v_probability DOUBLE DEFAULT NULL;

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

    SELECT
        CASE
            WHEN v_surface = 'HARD' THEN COALESCE(elo_rank_hard, elo_rank)
            WHEN v_surface = 'CLAY' THEN COALESCE(elo_rank_clay, elo_rank)
            WHEN v_surface = 'GRASS' THEN COALESCE(elo_rank_grass, elo_rank)
            ELSE elo_rank
        END
    INTO v_elo_player
    FROM players
    WHERE id = v_player_id
    LIMIT 1;

    SELECT
        CASE
            WHEN v_surface = 'HARD' THEN COALESCE(elo_rank_hard, elo_rank)
            WHEN v_surface = 'CLAY' THEN COALESCE(elo_rank_clay, elo_rank)
            WHEN v_surface = 'GRASS' THEN COALESCE(elo_rank_grass, elo_rank)
            ELSE elo_rank
        END
    INTO v_elo_opponent
    FROM players
    WHERE id = v_opponent_id
    LIMIT 1;

    IF v_elo_player IS NULL OR v_elo_opponent IS NULL THEN
        RETURN NULL;
    END IF;

    SET v_elo_gap = v_elo_player - v_elo_opponent;
    SET v_probability = 1 / (1 + POW(10, -v_elo_gap / 400));

    RETURN ROUND(v_probability, 4);
END;;

DELIMITER ;
