DELIMITER ;;

DROP PROCEDURE IF EXISTS `PLAYER_SEARCH`;;

CREATE PROCEDURE `PLAYER_SEARCH`(
    IN searchTerm VARCHAR(255)
)
BEGIN
    /*
    PLAYER_SEARCH(searchTerm)

    Purpose
    - Return a ranked list of player candidates for a search term.
    - This is the primary lookup/search interface for player-name resolution.

    Input
    - searchTerm:
      ATP player id or free-text player name

    Output columns
    - id
    - name
    - country
    - rank
    - active
    - At most 5 rows

    Matching rules
    - Exact player id match first
    - Exact player name match second
    - Exact last name match third
    - Prefix name match fourth
    - Broader contains match fifth

    Ordering
    - Best match_score first
    - Active players before inactive players
    - Ranked players before unranked players
    - Better ATP rank first
    - Name as final tiebreaker

    Validation
    - Empty searchTerm returns an empty result set

    Example usage
    - CALL PLAYER_SEARCH('S0AG');
    - CALL PLAYER_SEARCH('Sinner');
    */

    DECLARE normalizedTerm VARCHAR(255) DEFAULT TRIM(COALESCE(searchTerm, ''));
    DECLARE prefixTerm VARCHAR(256);
    DECLARE containsTerm VARCHAR(257);

    IF normalizedTerm = '' THEN
        SELECT
            id,
            name,
            country,
            rank,
            active
        FROM players
        WHERE 1 = 0;
    ELSE
        SET prefixTerm = CONCAT(normalizedTerm, '%');
        SET containsTerm = CONCAT('%', normalizedTerm, '%');

        SELECT
            id,
            name,
            country,
            rank,
            active
        FROM (
            SELECT
                id,
                name,
                country,
                rank,
                active,
                CASE
                    WHEN UPPER(id) = UPPER(normalizedTerm) THEN 1
                    WHEN LOWER(name) = LOWER(normalizedTerm) THEN 2
                    WHEN LOWER(SUBSTRING_INDEX(name, ' ', -1)) = LOWER(normalizedTerm) THEN 3
                    WHEN LOWER(name) LIKE LOWER(prefixTerm) THEN 4
                    WHEN LOWER(name) LIKE LOWER(containsTerm) THEN 5
                    ELSE 6
                END AS match_score
            FROM players
            WHERE
                UPPER(id) = UPPER(normalizedTerm)
                OR LOWER(name) = LOWER(normalizedTerm)
                OR LOWER(name) LIKE LOWER(prefixTerm)
                OR LOWER(name) LIKE LOWER(containsTerm)
        ) ranked_candidates
        WHERE
            1 = 1
        ORDER BY
            match_score ASC,
            (active = 1) DESC,
            (rank IS NULL) ASC,
            rank ASC,
            name ASC
        LIMIT 5;
    END IF;
END;;

DELIMITER ;
