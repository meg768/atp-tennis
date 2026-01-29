DELIMITER //

DROP FUNCTION IF EXISTS NUMBER_OF_SETS_PLAYED//

CREATE FUNCTION NUMBER_OF_SETS_PLAYED(score VARCHAR(255))
RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE sets_played INT;

    IF score IS NULL OR TRIM(score) = '' THEN
        RETURN 0;
    END IF;

    IF UPPER(score) LIKE '%RET%' THEN
        RETURN 0;
    END IF;

    IF UPPER(score) LIKE '%W/O%' THEN
        RETURN 0;
    END IF;

    SET score = TRIM(score);
    SET sets_played = 1 + LENGTH(score) - LENGTH(REPLACE(score, ' ', ''));

    IF sets_played BETWEEN 2 AND 5 THEN
        RETURN sets_played;
    END IF;

    RETURN 0;
END//

DELIMITER ;
