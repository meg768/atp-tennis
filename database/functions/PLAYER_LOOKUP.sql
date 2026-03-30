DELIMITER ;;

DROP FUNCTION IF EXISTS `PLAYER_LOOKUP`;;

CREATE FUNCTION `PLAYER_LOOKUP`(
    searchTerm VARCHAR(255)
) RETURNS VARCHAR(32)
    DETERMINISTIC
BEGIN
    /*
    PLAYER_LOOKUP(searchTerm)

    Purpose
    - Return the best matching player id for a search term.
    - This follows the same matching and ranking rules as `PLAYER_SEARCH`.

    Input
    - searchTerm:
      ATP player id or free-text player name

    Output
    - Best matching `players.id`
    - `NULL` when no match is found

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
    - Empty searchTerm returns `NULL`

    Example usage
    - SELECT PLAYER_LOOKUP('S0AG');
    - SELECT PLAYER_LOOKUP('Sinner');
    */

    DECLARE normalizedTerm VARCHAR(255) DEFAULT TRIM(COALESCE(searchTerm, ''));
    DECLARE prefixTerm VARCHAR(256);
    DECLARE containsTerm VARCHAR(257);
    DECLARE resultPlayerID VARCHAR(32) DEFAULT NULL;

    IF normalizedTerm = '' THEN
        RETURN NULL;
    END IF;

    SET prefixTerm = CONCAT(normalizedTerm, '%');
    SET containsTerm = CONCAT('%', normalizedTerm, '%');

    SELECT
        id
    INTO
        resultPlayerID
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
        ORDER BY
            match_score ASC,
            (active = 1) DESC,
            (rank IS NULL) ASC,
            rank ASC,
            name ASC
        LIMIT 1
    ) ranked_candidates;

    RETURN resultPlayerID;
END;;

DELIMITER ;
