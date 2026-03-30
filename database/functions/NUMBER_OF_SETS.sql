DELIMITER ;;

DROP FUNCTION IF EXISTS `NUMBER_OF_SETS`;;

CREATE FUNCTION `NUMBER_OF_SETS`(score TEXT) RETURNS int(11)
    DETERMINISTIC
BEGIN
    /*
    NUMBER_OF_SETS(score)

    Purpose
    - Return the number of sets in a tennis score string.

    Expected score format
    - Space-separated set scores
    - Each set must look like:
      6-4
      7-6(5)
      6-7(8)

    Examples
    - '6-4 6-4' => 2
    - '7-6(5) 3-6 6-3' => 3

    Rules
    - Each valid set token counts as one set.
    - Tie-break points inside parentheses do not change the set count.
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
    DECLARE total_sets INT DEFAULT 0;

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

        SET total_sets = total_sets + 1;
    END WHILE;

    IF total_sets = 0 THEN
        RETURN NULL;
    END IF;

    RETURN total_sets;
END;;

DELIMITER ;
