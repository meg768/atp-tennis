DELIMITER ;;

DROP FUNCTION IF EXISTS `PLAYER_ODDS_FACTOR`;;

CREATE FUNCTION `PLAYER_ODDS_FACTOR`(
    playerID VARCHAR(32),
    opponentID VARCHAR(32),
    surface VARCHAR(50)
) RETURNS DECIMAL(10,4)
    DETERMINISTIC
BEGIN
    /*
    PLAYER_ODDS_FACTOR(playerID, opponentID, surface)

    Purpose
    - Return one odds-model factor in the range 0..1 for playerID against
      opponentID.
    - The result uses the same blended method as the project's odds pipeline.
    - No bookmaker margin is applied to the returned factor.

    Why this is a function
    - It returns one scalar value.
    - It is intended to be usable inside regular SQL queries.
    - Example usage:
      SELECT PLAYER_ODDS_FACTOR('S0AG', 'A0E2', NULL);
      SELECT PLAYER_ODDS_FACTOR('S0AG', 'A0E2', 'Clay');

    Model parity with compute-odds.js
    - Elo factor: 70%
    - Rank factor: 10%
    - Form factor: 10%
    - Head-to-head factor: 10%
    - Form is normalized from two single-player form values:
      form_a / (form_a + form_b)
    - Final result is the blended win probability for playerID.

    Inputs and edge cases
    - Invalid playerID => NULL
    - Invalid opponentID => NULL
    - Same player and opponent => NULL
    - Any missing/invalid factor input => NULL
    */

    DECLARE v_surface VARCHAR(50) DEFAULT NULL;
    DECLARE v_elo_factor DECIMAL(10,4) DEFAULT NULL;
    DECLARE v_rank_factor DECIMAL(10,4) DEFAULT NULL;
    DECLARE v_form_player DECIMAL(10,4) DEFAULT NULL;
    DECLARE v_form_opponent DECIMAL(10,4) DEFAULT NULL;
    DECLARE v_form_factor DOUBLE DEFAULT NULL;
    DECLARE v_head_to_head_factor DECIMAL(10,4) DEFAULT NULL;
    DECLARE v_probability DOUBLE DEFAULT NULL;

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

    SET v_elo_factor = PLAYER_ELO_FACTOR(playerID, opponentID, v_surface);
    SET v_rank_factor = PLAYER_RANK_FACTOR(playerID, opponentID);
    SET v_form_player = PLAYER_FORM_FACTOR(playerID);
    SET v_form_opponent = PLAYER_FORM_FACTOR(opponentID);
    SET v_head_to_head_factor = PLAYER_HEAD_TO_HEAD_FACTOR(playerID, opponentID, v_surface);

    IF v_elo_factor IS NULL
        OR v_rank_factor IS NULL
        OR v_form_player IS NULL
        OR v_form_opponent IS NULL
        OR v_head_to_head_factor IS NULL
    THEN
        RETURN NULL;
    END IF;

    IF v_form_player + v_form_opponent <= 0 THEN
        RETURN NULL;
    END IF;

    SET v_form_factor = v_form_player / (v_form_player + v_form_opponent);

    SET v_probability = (
        v_elo_factor * 70
        + v_rank_factor * 10
        + v_form_factor * 10
        + v_head_to_head_factor * 10
    ) / 100;

    IF v_probability IS NULL OR v_probability <= 0 THEN
        RETURN NULL;
    END IF;

    IF v_probability >= 1 THEN
        RETURN 0.9900;
    END IF;

    RETURN ROUND(v_probability, 4);
END;;

DELIMITER ;
