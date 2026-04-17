DELIMITER ;;

DROP PROCEDURE IF EXISTS `PLAYER_STATS`;;

CREATE PROCEDURE `PLAYER_STATS`(
    IN playerA VARCHAR(255),
    IN playerB VARCHAR(255),
    IN surface VARCHAR(50)
)
BEGIN
    /*
    PLAYER_STATS(playerA, playerB, surface)

    Purpose
    - Return one row per player for a matchup.
    - Expose the currently active model output together with every
      PLAYER_WIN_FACTOR_* component so the model can be debugged in SQL.

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
    - win_factor
    - elo_factor
    - form_factor
    - rating_factor
    - ranking_factor
    - hth_factor

    Notes
    - Player inputs are resolved through PLAYER_LOOKUP(...)
    - The procedure returns an empty result set when either player cannot be
      resolved or when both resolve to the same player

    Example usage
    - CALL PLAYER_STATS('Zverev', 'Cobolli', 'Clay');
    - CALL PLAYER_STATS('Z0A4', 'C0E9', 'Clay');
    */

    DECLARE resolvedPlayerA VARCHAR(32) DEFAULT NULL;
    DECLARE resolvedPlayerB VARCHAR(32) DEFAULT NULL;
    DECLARE normalizedSurface VARCHAR(50) DEFAULT NULL;

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
            CAST(NULL AS DECIMAL(10,4)) AS win_factor,
            CAST(NULL AS DECIMAL(10,4)) AS elo_factor,
            CAST(NULL AS DECIMAL(10,4)) AS form_factor,
            CAST(NULL AS DECIMAL(10,4)) AS rating_factor,
            CAST(NULL AS DECIMAL(10,4)) AS ranking_factor,
            CAST(NULL AS DECIMAL(10,4)) AS hth_factor
        FROM players
        WHERE 1 = 0;
    ELSE
        SELECT
            p.id AS player,
            p.name AS name,
            PLAYER_WIN_FACTOR(resolvedPlayerA, resolvedPlayerB, normalizedSurface) AS win_factor,
            PLAYER_WIN_FACTOR_ELO(resolvedPlayerA, resolvedPlayerB, normalizedSurface) AS elo_factor,
            PLAYER_WIN_FACTOR_FORM(resolvedPlayerA, resolvedPlayerB, normalizedSurface) AS form_factor,
            PLAYER_WIN_FACTOR_RATING(resolvedPlayerA, resolvedPlayerB, normalizedSurface) AS rating_factor,
            PLAYER_WIN_FACTOR_RANKING(resolvedPlayerA, resolvedPlayerB, normalizedSurface) AS ranking_factor,
            PLAYER_WIN_FACTOR_HTH(resolvedPlayerA, resolvedPlayerB, normalizedSurface) AS hth_factor
        FROM players p
        WHERE p.id = resolvedPlayerA

        UNION ALL

        SELECT
            p.id AS player,
            p.name AS name,
            PLAYER_WIN_FACTOR(resolvedPlayerB, resolvedPlayerA, normalizedSurface) AS win_factor,
            PLAYER_WIN_FACTOR_ELO(resolvedPlayerB, resolvedPlayerA, normalizedSurface) AS elo_factor,
            PLAYER_WIN_FACTOR_FORM(resolvedPlayerB, resolvedPlayerA, normalizedSurface) AS form_factor,
            PLAYER_WIN_FACTOR_RATING(resolvedPlayerB, resolvedPlayerA, normalizedSurface) AS rating_factor,
            PLAYER_WIN_FACTOR_RANKING(resolvedPlayerB, resolvedPlayerA, normalizedSurface) AS ranking_factor,
            PLAYER_WIN_FACTOR_HTH(resolvedPlayerB, resolvedPlayerA, normalizedSurface) AS hth_factor
        FROM players p
        WHERE p.id = resolvedPlayerB;
    END IF;
END;;

DELIMITER ;
