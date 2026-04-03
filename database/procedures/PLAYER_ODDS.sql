DELIMITER ;;

DROP PROCEDURE IF EXISTS `PLAYER_ODDS`;;

CREATE PROCEDURE `PLAYER_ODDS`(
    IN playerA VARCHAR(255),
    IN playerB VARCHAR(255),
    IN surface VARCHAR(50)
)
BEGIN
    /*
    PLAYER_ODDS(playerA, playerB, surface)

    Purpose
    - Return two rows of decimal odds for a matchup.
    - One row is returned per player.
    - The underlying win probability now comes from PLAYER_WIN_FACTOR(...),
      which is the single source of truth for the model.
    - A fixed 5% margin is then applied when converting fair probability to
      decimal odds.

    Inputs
    - playerA:
      ATP id or free-text player name for the first player
    - playerB:
      ATP id or free-text player name for the second player
    - surface:
      Optional surface selector such as 'Hard', 'Clay', or 'Grass'

    Output columns
    - player
    - name
    - odds

    Notes
    - Player inputs are resolved through PLAYER_LOOKUP(...)
    - The procedure returns an empty result set when either player cannot be
      resolved or when both resolve to the same player

    Example usage
    - CALL PLAYER_ODDS('Tien', 'Burruchaga', 'Clay');
    - CALL PLAYER_ODDS('T0HA', 'B0FV', 'Clay');
    */

    DECLARE resolvedPlayerA VARCHAR(32) DEFAULT NULL;
    DECLARE resolvedPlayerB VARCHAR(32) DEFAULT NULL;
    DECLARE normalizedSurface VARCHAR(50) DEFAULT NULL;
    DECLARE factorA DECIMAL(10,4) DEFAULT NULL;
    DECLARE factorB DECIMAL(10,4) DEFAULT NULL;
    DECLARE pricedFactorA DECIMAL(10,4) DEFAULT NULL;
    DECLARE pricedFactorB DECIMAL(10,4) DEFAULT NULL;

    SET resolvedPlayerA = PLAYER_LOOKUP(playerA);
    SET resolvedPlayerB = PLAYER_LOOKUP(playerB);
    SET normalizedSurface = NULLIF(TRIM(surface), '');

    IF resolvedPlayerA IS NULL
        OR resolvedPlayerB IS NULL
        OR UPPER(resolvedPlayerA) = UPPER(resolvedPlayerB)
    THEN
        SELECT
            id AS player,
            name AS name,
            CAST(NULL AS DECIMAL(10,2)) AS odds
        FROM players
        WHERE 1 = 0;
    ELSE
        SET factorA = PLAYER_WIN_FACTOR(resolvedPlayerA, resolvedPlayerB, normalizedSurface);

        IF factorA IS NULL OR factorA <= 0 OR factorA >= 1 THEN
            SELECT
                id AS player,
                name AS name,
                CAST(NULL AS DECIMAL(10,2)) AS odds
            FROM players
            WHERE 1 = 0;
        ELSE
            SET factorB = 1 - factorA;
            SET pricedFactorA = factorA * 1.05;
            SET pricedFactorB = factorB * 1.05;

            IF factorB <= 0 OR factorB >= 1 THEN
                SELECT
                    id AS player,
                    name AS name,
                    CAST(NULL AS DECIMAL(10,2)) AS odds
                FROM players
                WHERE 1 = 0;
            ELSE
                SELECT
                    p.id AS player,
                    p.name AS name,
                    ROUND(1 / pricedFactorA, 2) AS odds
                FROM players p
                WHERE p.id = resolvedPlayerA

                UNION ALL

                SELECT
                    p.id AS player,
                    p.name AS name,
                    ROUND(1 / pricedFactorB, 2) AS odds
                FROM players p
                WHERE p.id = resolvedPlayerB;
            END IF;
        END IF;
    END IF;
END;;

DELIMITER ;
