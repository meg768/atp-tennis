DELIMITER ;;

DROP FUNCTION IF EXISTS `NUMBER_OF_GAMES`;;

CREATE FUNCTION `NUMBER_OF_GAMES`(score TEXT) RETURNS int(11)
    DETERMINISTIC
BEGIN

/*
NUMBER_OF_GAMES(score)

Purpose
- Return the total number of games in a tennis score string.

Expected score format
- Space-separated set scores
- Each set must look like:
  6-4
  7-6(5)
  6-7(8)

Examples
- '6-4 6-4' => 22
- '7-6(5) 3-6 6-3' => 31

Rules
- Tie-break points inside parentheses are ignored.
- Only the game counts on each side of the set are summed.
- Extra whitespace is normalized before parsing.

Edge cases
- NULL input => NULL
- Empty string => 0
- Invalid token anywhere in the score => NULL
- No valid sets parsed => NULL

Why this is strict
- It is intended as a helper for repo-controlled ATP score strings.
- Returning NULL on malformed input is safer than guessing.
*/

    DECLARE working TEXT;
    DECLARE token TEXT;
    DECLARE pos INT;
    DECLARE total_games INT DEFAULT 0;
    DECLARE set_count INT DEFAULT 0;
    DECLARE cleaned_token TEXT;
    DECLARE left_games INT;
    DECLARE right_games INT;

    IF score IS NULL THEN
        RETURN NULL;
    END IF;

    SET working = TRIM(score);

    IF working = '' THEN
        RETURN 0;
    END IF;

    SET working = REGEXP_REPLACE(working, '[[:space:]]+', ' ');

    WHILE working <> '' DO
        SET pos = LOCATE(' ', working);

        IF pos = 0 THEN
            SET token = working;
            SET working = '';
        ELSE
            SET token = LEFT(working, pos - 1);
            SET working = TRIM(SUBSTRING(working, pos + 1));
        END IF;

        IF token NOT REGEXP '^[0-9]+-[0-9]+(\\([0-9]+\\))?$' THEN
            RETURN NULL;
        END IF;

        SET cleaned_token = REGEXP_REPLACE(token, '\\([0-9]+\\)$', '');
        SET left_games = CAST(SUBSTRING_INDEX(cleaned_token, '-', 1) AS UNSIGNED);
        SET right_games = CAST(SUBSTRING_INDEX(cleaned_token, '-', -1) AS UNSIGNED);

        SET total_games = total_games + left_games + right_games;
        SET set_count = set_count + 1;
    END WHILE;

    IF set_count = 0 THEN
        RETURN NULL;
    END IF;

    RETURN total_games;
END;;

DELIMITER ;
