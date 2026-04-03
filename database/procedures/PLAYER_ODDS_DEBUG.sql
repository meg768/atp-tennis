DELIMITER ;;

DROP PROCEDURE IF EXISTS `PLAYER_ODDS_DEBUG`;;

CREATE PROCEDURE `PLAYER_ODDS_DEBUG`(
    IN playerA VARCHAR(255),
    IN playerB VARCHAR(255),
    IN surface VARCHAR(50),
    IN eloWeight DOUBLE,
    IN rankWeight DOUBLE,
    IN formWeight DOUBLE,
    IN headToHeadWeight DOUBLE
)
BEGIN
    /*
    PLAYER_ODDS_DEBUG(playerA, playerB, surface, eloWeight, rankWeight,
    formWeight, headToHeadWeight)

    Purpose
    - Return two rows of odds/debug output for a matchup while allowing
      ad hoc experimentation with factor weights.
    - One row is returned per player.

    Inputs
    - playerA, playerB:
      ATP ids or free-text player names
    - surface:
      Optional surface selector such as 'Hard', 'Clay', or 'Grass'
    - eloWeight, rankWeight, formWeight, headToHeadWeight:
      Non-negative factor weights

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
    - Factor columns are weighted contributions, not raw probabilities
    - factor is the normalized blended probability after dividing by the
      total weight

    Example usage
    - CALL PLAYER_ODDS_DEBUG('Tien', 'Burruchaga', 'Clay', 70, 10, 10, 10);
    - CALL PLAYER_ODDS_DEBUG('Tien', 'Burruchaga', 'Clay', 60, 20, 10, 10);
    */

    DECLARE defaultMargin DOUBLE DEFAULT 0.05;
    DECLARE resolvedPlayerA VARCHAR(32) DEFAULT NULL;
    DECLARE resolvedPlayerB VARCHAR(32) DEFAULT NULL;
    DECLARE normalizedSurface VARCHAR(50) DEFAULT NULL;
    DECLARE totalWeight DOUBLE DEFAULT NULL;

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

    DECLARE weightedEloA DOUBLE DEFAULT NULL;
    DECLARE weightedRankA DOUBLE DEFAULT NULL;
    DECLARE weightedFormA DOUBLE DEFAULT NULL;
    DECLARE weightedHeadToHeadA DOUBLE DEFAULT NULL;

    DECLARE weightedEloB DOUBLE DEFAULT NULL;
    DECLARE weightedRankB DOUBLE DEFAULT NULL;
    DECLARE weightedFormB DOUBLE DEFAULT NULL;
    DECLARE weightedHeadToHeadB DOUBLE DEFAULT NULL;

    DECLARE factorA DOUBLE DEFAULT NULL;
    DECLARE factorB DOUBLE DEFAULT NULL;
    DECLARE pricedFactorA DOUBLE DEFAULT NULL;
    DECLARE pricedFactorB DOUBLE DEFAULT NULL;

    SET resolvedPlayerA = PLAYER_LOOKUP(playerA);
    SET resolvedPlayerB = PLAYER_LOOKUP(playerB);
    SET normalizedSurface = NULLIF(TRIM(surface), '');
    SET totalWeight = COALESCE(eloWeight, 0)
        + COALESCE(rankWeight, 0)
        + COALESCE(formWeight, 0)
        + COALESCE(headToHeadWeight, 0);

    IF resolvedPlayerA IS NULL
        OR resolvedPlayerB IS NULL
        OR UPPER(resolvedPlayerA) = UPPER(resolvedPlayerB)
        OR totalWeight <= 0
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

            SET weightedEloA = eloFactorA * COALESCE(eloWeight, 0);
            SET weightedRankA = rankFactorA * COALESCE(rankWeight, 0);
            SET weightedFormA = formFactorA * COALESCE(formWeight, 0);
            SET weightedHeadToHeadA = headToHeadFactorA * COALESCE(headToHeadWeight, 0);

            SET weightedEloB = eloFactorB * COALESCE(eloWeight, 0);
            SET weightedRankB = rankFactorB * COALESCE(rankWeight, 0);
            SET weightedFormB = formFactorB * COALESCE(formWeight, 0);
            SET weightedHeadToHeadB = headToHeadFactorB * COALESCE(headToHeadWeight, 0);

            SET factorA = (
                weightedEloA
                + weightedRankA
                + weightedFormA
                + weightedHeadToHeadA
            ) / totalWeight;

            SET factorB = (
                weightedEloB
                + weightedRankB
                + weightedFormB
                + weightedHeadToHeadB
            ) / totalWeight;

            IF factorA <= 0 OR factorA >= 1 OR factorB <= 0 OR factorB >= 1 THEN
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
                SET pricedFactorA = factorA * (1 + defaultMargin);
                SET pricedFactorB = factorB * (1 + defaultMargin);

                SELECT
                    p.id AS player,
                    p.name AS name,
                    ROUND(
                        CASE WHEN pricedFactorA >= 1 THEN 1.01 ELSE 1 / pricedFactorA END,
                        2
                    ) AS odds,
                    ROUND(factorA, 4) AS factor,
                    ROUND(weightedEloA / totalWeight, 4) AS elo_factor,
                    ROUND(weightedRankA / totalWeight, 4) AS rank_factor,
                    ROUND(weightedFormA / totalWeight, 4) AS form_factor,
                    ROUND(weightedHeadToHeadA / totalWeight, 4) AS head_to_head_factor
                FROM players p
                WHERE p.id = resolvedPlayerA

                UNION ALL

                SELECT
                    p.id AS player,
                    p.name AS name,
                    ROUND(
                        CASE WHEN pricedFactorB >= 1 THEN 1.01 ELSE 1 / pricedFactorB END,
                        2
                    ) AS odds,
                    ROUND(factorB, 4) AS factor,
                    ROUND(weightedEloB / totalWeight, 4) AS elo_factor,
                    ROUND(weightedRankB / totalWeight, 4) AS rank_factor,
                    ROUND(weightedFormB / totalWeight, 4) AS form_factor,
                    ROUND(weightedHeadToHeadB / totalWeight, 4) AS head_to_head_factor
                FROM players p
                WHERE p.id = resolvedPlayerB;
            END IF;
        END IF;
    END IF;
END;;

DELIMITER ;
