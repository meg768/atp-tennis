DELIMITER //

DROP FUNCTION IF EXISTS NUMBER_OF_GAMES_PLAYED//

CREATE FUNCTION NUMBER_OF_GAMES_PLAYED(score VARCHAR(255))
RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE total_games INT DEFAULT 0;
    DECLARE i INT DEFAULT 1;
    DECLARE sets INT;
    DECLARE set_score VARCHAR(20);
    DECLARE a INT;
    DECLARE b INT;

    IF score IS NULL OR TRIM(score) = '' THEN
        RETURN 0;
    END IF;

    IF score LIKE '%RET%' OR score LIKE '%W/O%' THEN
        RETURN 0;
    END IF;

    -- Normalisera whitespace: TAB, NBSP, CR/LF -> space
    SET score = TRIM(score);
    SET score = REPLACE(score, CHAR(9),  ' ');
    SET score = REPLACE(score, CHAR(160),' ');
    SET score = REPLACE(score, CHAR(10), ' ');
    SET score = REPLACE(score, CHAR(13), ' ');

    -- Kollapsa dubbla spaces
    WHILE INSTR(score, '  ') > 0 DO
        SET score = REPLACE(score, '  ', ' ');
    END WHILE;

    SET sets = 1 + LENGTH(score) - LENGTH(REPLACE(score, ' ', ''));

    WHILE i <= sets DO
        SET set_score = SUBSTRING_INDEX(SUBSTRING_INDEX(score, ' ', i), ' ', -1);

        -- Token måste börja med två siffror (t.ex. 64, 76(4), 10 etc)
        IF CHAR_LENGTH(set_score) < 2 OR set_score NOT REGEXP '^[0-9]{2}' THEN
            RETURN 0;
        END IF;

        SET a = CAST(SUBSTRING(set_score, 1, 1) AS UNSIGNED);
        SET b = CAST(SUBSTRING(set_score, 2, 1) AS UNSIGNED);

        SET total_games = total_games + a + b;
        SET i = i + 1;
    END WHILE;

    RETURN total_games;
END//

DELIMITER ;
