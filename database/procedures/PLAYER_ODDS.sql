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
    - The underlying model matches the current odds pipeline:
      Elo 70%, rank 10%, form 10%, head-to-head 10%,
      followed by a fixed 5% margin when converting to decimal odds.

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
    - factor
    - elo_factor
    - rank_factor
    - form_factor
    - head_to_head_factor

    Notes
    - Player inputs are resolved through PLAYER_LOOKUP(...)
    - The procedure returns an empty result set when either player
      cannot be resolved or when both resolve to the same player.

    Example usage
    - CALL PLAYER_ODDS('Tien', 'Burruchaga', 'Clay');
    - CALL PLAYER_ODDS('T0HA', 'B0FV', 'Clay');
    */

    DECLARE resolvedPlayerA VARCHAR(32) DEFAULT NULL;
    DECLARE resolvedPlayerB VARCHAR(32) DEFAULT NULL;
    DECLARE normalizedSurface VARCHAR(50) DEFAULT NULL;
    DECLARE eloFactorA DECIMAL(10,4) DEFAULT NULL;
    DECLARE rankFactorA DECIMAL(10,4) DEFAULT NULL;
    DECLARE formPlayerA DECIMAL(10,4) DEFAULT NULL;
    DECLARE formPlayerB DECIMAL(10,4) DEFAULT NULL;
    DECLARE formFactorA DOUBLE DEFAULT NULL;
    DECLARE headToHeadFactorA DECIMAL(10,4) DEFAULT NULL;
    DECLARE eloFactorB DECIMAL(10,4) DEFAULT NULL;
    DECLARE rankFactorB DECIMAL(10,4) DEFAULT NULL;
    DECLARE formFactorB DOUBLE DEFAULT NULL;
    DECLARE headToHeadFactorB DECIMAL(10,4) DEFAULT NULL;
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
            CAST(NULL AS DECIMAL(10,2)) AS odds,
            CAST(NULL AS DECIMAL(10,4)) AS factor,
            CAST(NULL AS DECIMAL(10,4)) AS elo_factor,
            CAST(NULL AS DECIMAL(10,4)) AS rank_factor,
            CAST(NULL AS DECIMAL(10,4)) AS form_factor,
            CAST(NULL AS DECIMAL(10,4)) AS head_to_head_factor
        FROM players
        WHERE 1 = 0;
    ELSE
        SET eloFactorA = PLAYER_ELO_FACTOR(resolvedPlayerA, resolvedPlayerB, normalizedSurface);
        SET rankFactorA = PLAYER_RANK_FACTOR(resolvedPlayerA, resolvedPlayerB);
        SET formPlayerA = PLAYER_FORM_FACTOR(resolvedPlayerA);
        SET formPlayerB = PLAYER_FORM_FACTOR(resolvedPlayerB);
        SET headToHeadFactorA = PLAYER_HEAD_TO_HEAD_FACTOR(resolvedPlayerA, resolvedPlayerB, normalizedSurface);

        IF eloFactorA IS NULL
            OR rankFactorA IS NULL
            OR formPlayerA IS NULL
            OR formPlayerB IS NULL
            OR headToHeadFactorA IS NULL
            OR formPlayerA + formPlayerB <= 0
        THEN
            SELECT
                id AS player,
                name AS name,
                CAST(NULL AS DECIMAL(10,2)) AS odds,
                CAST(NULL AS DECIMAL(10,4)) AS factor,
                CAST(NULL AS DECIMAL(10,4)) AS elo_factor,
                CAST(NULL AS DECIMAL(10,4)) AS rank_factor,
                CAST(NULL AS DECIMAL(10,4)) AS form_factor,
                CAST(NULL AS DECIMAL(10,4)) AS head_to_head_factor
            FROM players
            WHERE 1 = 0;
        ELSE
            SET formFactorA = formPlayerA / (formPlayerA + formPlayerB);
            SET eloFactorB = 1 - eloFactorA;
            SET rankFactorB = 1 - rankFactorA;
            SET formFactorB = 1 - formFactorA;
            SET headToHeadFactorB = 1 - headToHeadFactorA;

            SET factorA = (
                eloFactorA * 70
                + rankFactorA * 10
                + formFactorA * 10
                + headToHeadFactorA * 10
            ) / 100;

            IF factorA IS NULL OR factorA <= 0 OR factorA >= 1 THEN
                SELECT
                    id AS player,
                    name AS name,
                    CAST(NULL AS DECIMAL(10,2)) AS odds,
                    CAST(NULL AS DECIMAL(10,4)) AS factor,
                    CAST(NULL AS DECIMAL(10,4)) AS elo_factor,
                    CAST(NULL AS DECIMAL(10,4)) AS rank_factor,
                    CAST(NULL AS DECIMAL(10,4)) AS form_factor,
                    CAST(NULL AS DECIMAL(10,4)) AS head_to_head_factor
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
                        CAST(NULL AS DECIMAL(10,2)) AS odds,
                        CAST(NULL AS DECIMAL(10,4)) AS factor,
                        CAST(NULL AS DECIMAL(10,4)) AS elo_factor,
                        CAST(NULL AS DECIMAL(10,4)) AS rank_factor,
                        CAST(NULL AS DECIMAL(10,4)) AS form_factor,
                        CAST(NULL AS DECIMAL(10,4)) AS head_to_head_factor
                    FROM players
                    WHERE 1 = 0;
                ELSE
                    SELECT
                        p.id AS player,
                        p.name AS name,
                        ROUND(1 / pricedFactorA, 2) AS odds,
                        ROUND(factorA, 4) AS factor,
                        ROUND(eloFactorA * 0.70, 4) AS elo_factor,
                        ROUND(rankFactorA * 0.10, 4) AS rank_factor,
                        ROUND(formFactorA * 0.10, 4) AS form_factor,
                        ROUND(headToHeadFactorA * 0.10, 4) AS head_to_head_factor
                    FROM players p
                    WHERE p.id = resolvedPlayerA

                    UNION ALL

                    SELECT
                        p.id AS player,
                        p.name AS name,
                        ROUND(1 / pricedFactorB, 2) AS odds,
                        ROUND(factorB, 4) AS factor,
                        ROUND(eloFactorB * 0.70, 4) AS elo_factor,
                        ROUND(rankFactorB * 0.10, 4) AS rank_factor,
                        ROUND(formFactorB * 0.10, 4) AS form_factor,
                        ROUND(headToHeadFactorB * 0.10, 4) AS head_to_head_factor
                    FROM players p
                    WHERE p.id = resolvedPlayerB;
                END IF;
            END IF;
        END IF;
    END IF;
END;;

DELIMITER ;
