DELIMITER ;;

DROP FUNCTION IF EXISTS `PLAYER_ELO_FACTOR`;;

CREATE FUNCTION `PLAYER_ELO_FACTOR`(
    playerID VARCHAR(32),
    opponentID VARCHAR(32),
    surface VARCHAR(50)
) RETURNS DECIMAL(10,4)
    DETERMINISTIC
BEGIN
    /*
    PLAYER_ELO_FACTOR(playerID, opponentID, surface)

    Purpose
    - Return one ELO-based win signal in the range 0..1 for playerID against
      opponentID.
    - Higher means the ELO signal favors playerID.
    - Lower means the ELO signal favors opponentID.
    - 0.5 is neutral.

    Why this is a function
    - It returns one scalar value.
    - It is intended to be usable inside regular SQL queries.
    - Example usage:
      SELECT PLAYER_ELO_FACTOR('S0AG', 'A0E2', NULL);
      SELECT PLAYER_ELO_FACTOR('S0AG', 'A0E2', 'Hard');

    Why this exists
    - The odds model already has an ELO-based factor.
    - Keeping the same core logic in MariaDB avoids duplicated business logic.

    Surface behavior
    - NULL or empty surface => use overall `elo_rank`
    - Hard => use `elo_rank_hard`
    - Clay => use `elo_rank_clay`
    - Grass => use `elo_rank_grass`
    - Any other surface value falls back to overall `elo_rank`

    Exact formula
    - probability = 1 / (1 + POW(10, (elo_opponent - elo_player) / 400))

    Inputs and edge cases
    - Invalid playerID => NULL
    - Invalid opponentID => NULL
    - Same player and opponent => NULL
    - Missing selected ELO on either side => NULL
    */

    DECLARE v_surface VARCHAR(50) DEFAULT NULL;
    DECLARE v_elo_player DOUBLE DEFAULT NULL;
    DECLARE v_elo_opponent DOUBLE DEFAULT NULL;
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

    SET v_surface = UPPER(NULLIF(TRIM(surface), ''));

    SELECT
        CASE
            WHEN v_surface = 'HARD' THEN elo_rank_hard
            WHEN v_surface = 'CLAY' THEN elo_rank_clay
            WHEN v_surface = 'GRASS' THEN elo_rank_grass
            ELSE elo_rank
        END
    INTO v_elo_player
    FROM players
    WHERE id = playerID
    LIMIT 1;

    SELECT
        CASE
            WHEN v_surface = 'HARD' THEN elo_rank_hard
            WHEN v_surface = 'CLAY' THEN elo_rank_clay
            WHEN v_surface = 'GRASS' THEN elo_rank_grass
            ELSE elo_rank
        END
    INTO v_elo_opponent
    FROM players
    WHERE id = opponentID
    LIMIT 1;

    IF v_elo_player IS NULL OR v_elo_opponent IS NULL THEN
        RETURN NULL;
    END IF;

    SET v_probability = 1 / (1 + POW(10, (v_elo_opponent - v_elo_player) / 400));

    RETURN ROUND(v_probability, 4);
END;;

DELIMITER ;
