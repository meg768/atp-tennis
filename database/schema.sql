-- Create syntax for TABLE 'archive'
CREATE TABLE `archive` (
  `id` varchar(32) NOT NULL DEFAULT '',
  `date` date DEFAULT NULL,
  `name` varchar(50) DEFAULT NULL,
  `type` varchar(32) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create syntax for VIEW 'currently'
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`%` SQL SECURITY DEFINER VIEW `currently` AS with ongoing_events as (select `e`.`id` AS `id`,`e`.`name` AS `name`,`e`.`date` AS `date`,`e`.`type` AS `type`,`e`.`location` AS `location` from `events` `e` where `e`.`type` in ('Grand Slam','Masters','ATP-500','ATP-250') and `e`.`date` >= curdate() - interval 14 day and !exists(select 1 from `matches` `m` where `m`.`event` = `e`.`id` and `m`.`round` = 'F' and `m`.`score` is not null and `m`.`score` <> '' limit 1)), main_draw_matches as (select `m`.`id` AS `match_id`,`m`.`event` AS `event`,`m`.`round` AS `round`,`m`.`winner` AS `winner`,`m`.`loser` AS `loser` from `matches` `m` where `m`.`round` in ('F','SF','QF','R16','R32','R128')), player_matches as (select `mdm`.`event` AS `event`,`mdm`.`match_id` AS `match_id`,`mdm`.`round` AS `round`,`mdm`.`winner` AS `winner`,`mdm`.`loser` AS `loser`,`mdm`.`winner` AS `player_id`,1 AS `is_winner` from `main_draw_matches` `mdm` union all select `mdm`.`event` AS `event`,`mdm`.`match_id` AS `match_id`,`mdm`.`round` AS `round`,`mdm`.`winner` AS `winner`,`mdm`.`loser` AS `loser`,`mdm`.`loser` AS `player_id`,0 AS `is_winner` from `main_draw_matches` `mdm`), ranked_player_matches as (select `pm`.`event` AS `event`,`pm`.`match_id` AS `match_id`,`pm`.`round` AS `round`,`pm`.`winner` AS `winner`,`pm`.`loser` AS `loser`,`pm`.`player_id` AS `player_id`,`pm`.`is_winner` AS `is_winner`,row_number() over ( partition by `pm`.`event`,`pm`.`player_id` order by case `pm`.`round` when 'F' then 6 when 'SF' then 5 when 'QF' then 4 when 'R16' then 3 when 'R32' then 2 when 'R128' then 1 else 0 end desc,`pm`.`match_id` desc) AS `rn` from `player_matches` `pm`), alive_players as (select `rpm`.`event` AS `event`,`rpm`.`player_id` AS `player_id`,`rpm`.`round` AS `round` from `ranked_player_matches` `rpm` where `rpm`.`rn` = 1 and `rpm`.`is_winner` = 1)select `oe`.`id` AS `event_id`,`oe`.`date` AS `event_date`,`oe`.`name` AS `event_name`,`oe`.`location` AS `event_location`,`oe`.`type` AS `event_type`,`p`.`id` AS `player_id`,`p`.`name` AS `player`,`p`.`country` AS `player_country`,`p`.`rank` AS `player_rank`,`ap`.`round` AS `round` from ((`ongoing_events` `oe` join `alive_players` `ap` on(`ap`.`event` = `oe`.`id`)) join `players` `p` on(`p`.`id` = `ap`.`player_id`)) order by `oe`.`date` desc,`oe`.`name`,`p`.`rank` is null,`p`.`rank`,`p`.`name`;

-- Create syntax for TABLE 'events'
CREATE TABLE `events` (
  `id` varchar(20) NOT NULL DEFAULT '' COMMENT 'Unique ID',
  `date` date DEFAULT NULL COMMENT 'Start of event',
  `name` varchar(50) DEFAULT NULL COMMENT 'Name of event',
  `location` varchar(50) DEFAULT NULL COMMENT 'Country',
  `type` varchar(50) DEFAULT NULL COMMENT 'Typically ''Grand Slam'', ''Masters'', ''ATP-500'', ''ATP-250''',
  `surface` varchar(50) DEFAULT NULL COMMENT 'Typically ''Hard'', ''Clay'', ''Grass''',
  `url` varchar(100) DEFAULT NULL COMMENT 'URL to atptour.com',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create syntax for VIEW 'flatly'
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`%` SQL SECURITY DEFINER VIEW `flatly`
AS SELECT
   `matches`.`id` AS `id`,
   `C`.`date` AS `event_date`,
   `C`.`id` AS `event_id`,
   `C`.`name` AS `event_name`,
   `C`.`location` AS `event_location`,
   `C`.`type` AS `event_type`,
   `C`.`surface` AS `event_surface`,
   `matches`.`round` AS `round`,
   `A`.`name` AS `winner`,
   `B`.`name` AS `loser`,
   `A`.`id` AS `winner_id`,
   `matches`.`winner_rank` AS `winner_rank`,
   `B`.`id` AS `loser_id`,
   `matches`.`loser_rank` AS `loser_rank`,
   `matches`.`score` AS `score`,
   `matches`.`status` AS `status`,
   `matches`.`duration` AS `duration`
FROM (((`matches` left join `players` `A` on(`matches`.`winner` = `A`.`id`)) left join `players` `B` on(`matches`.`loser` = `B`.`id`)) left join `events` `C` on(`matches`.`event` = `C`.`id`)) order by `C`.`date`;

-- Create syntax for TABLE 'log'
CREATE TABLE `log` (
  `timestamp` datetime DEFAULT current_timestamp(),
  `message` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create syntax for TABLE 'matches'
CREATE TABLE `matches` (
  `id` varchar(50) NOT NULL DEFAULT '',
  `event` varchar(50) DEFAULT NULL COMMENT 'ID of event',
  `round` varchar(50) DEFAULT 'NUL' COMMENT 'Typically ''F'', ''SF'', ''QF'', ''R16'', ''R32'', ''R128''',
  `winner` varchar(50) DEFAULT NULL COMMENT 'ID of winner',
  `loser` varchar(50) DEFAULT NULL COMMENT 'ID of loser',
  `winner_rank` int(11) DEFAULT NULL COMMENT 'Winner current rank',
  `loser_rank` int(11) DEFAULT NULL COMMENT 'Loser current rank',
  `score` varchar(50) DEFAULT NULL COMMENT 'Final score - example ''7-6(5) 3-6 6-3 6-4''',
  `status` enum('Completed','Aborted','Walkover','Unknown') DEFAULT NULL COMMENT 'Status of match',
  `duration` varchar(50) DEFAULT NULL COMMENT 'Duration of the match in format H:MM',
  PRIMARY KEY (`id`),
  KEY `events` (`event`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create syntax for TABLE 'players'
CREATE TABLE `players` (
  `id` varchar(32) NOT NULL DEFAULT '' COMMENT 'Unique ID',
  `name` varchar(64) DEFAULT NULL COMMENT 'Full name',
  `country` varchar(16) DEFAULT NULL COMMENT 'Country code',
  `age` int(11) DEFAULT NULL COMMENT 'Age',
  `birthdate` date DEFAULT NULL COMMENT 'Date of birth',
  `pro` int(11) DEFAULT NULL COMMENT 'Year turned professional',
  `active` tinyint(1) DEFAULT NULL COMMENT 'Currently active',
  `height` int(11) DEFAULT NULL COMMENT 'Height in cm',
  `weight` int(11) DEFAULT NULL COMMENT 'Weight in kg',
  `rank` int(11) DEFAULT NULL COMMENT 'Current rank',
  `highest_rank` int(11) DEFAULT NULL COMMENT 'Highest rank',
  `highest_rank_date` date DEFAULT NULL COMMENT 'Highest rank date',
  `career_wins` int(11) DEFAULT NULL COMMENT 'Career wins',
  `career_losses` int(11) DEFAULT NULL COMMENT 'Career losses',
  `career_titles` int(11) DEFAULT NULL COMMENT 'Career titles',
  `career_prize` int(11) DEFAULT NULL COMMENT 'Career prize money',
  `ytd_wins` int(11) DEFAULT NULL COMMENT 'YTD wins',
  `ytd_losses` int(11) DEFAULT NULL COMMENT 'YTD losses',
  `ytd_titles` int(11) DEFAULT NULL COMMENT 'YTD titles',
  `ytd_prize` int(11) DEFAULT NULL COMMENT 'YTD prize money',
  `coach` varchar(100) DEFAULT NULL COMMENT 'Name of current coach',
  `points` int(11) DEFAULT NULL COMMENT 'ATP ranking points',
  `serve_rating` double DEFAULT NULL COMMENT 'ATP Serve rating (52 weeks)',
  `return_rating` double DEFAULT NULL COMMENT 'ATP Return rating (52 weeka)',
  `pressure_rating` double DEFAULT NULL COMMENT 'ATP Under pressure rating (52 weeks)',
  `elo_rank` int(11) DEFAULT NULL,
  `elo_rank_clay` int(11) DEFAULT NULL,
  `elo_rank_grass` int(11) DEFAULT NULL,
  `elo_rank_hard` int(11) DEFAULT NULL,
  `hard_factor` int(11) DEFAULT NULL COMMENT 'Performance on hardcourt (0-100)',
  `clay_factor` int(11) DEFAULT NULL COMMENT 'Performance on clay (0-100)',
  `grass_factor` int(11) DEFAULT NULL COMMENT 'Performance on grass (0-100)',
  `url` varchar(100) DEFAULT NULL COMMENT 'URL to ATP home page',
  `image_url` varchar(100) DEFAULT NULL COMMENT 'URL to image on atptour.com',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create syntax for TABLE 'queries'
CREATE TABLE `queries` (
  `name` longtext DEFAULT NULL,
  `question` longtext NOT NULL,
  `query` longtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create syntax for TABLE 'settings'
CREATE TABLE `settings` (
  `key` varchar(100) NOT NULL DEFAULT '',
  `value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`value`)),
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create syntax for TABLE 'storage'
CREATE TABLE `storage` (
  `key` varchar(100) NOT NULL DEFAULT '',
  `value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`value`)),
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create syntax for FUNCTION 'NUMBER_OF_GAMES'
CREATE DEFINER=`root`@`%` FUNCTION `NUMBER_OF_GAMES`(score TEXT) RETURNS int(11)
    DETERMINISTIC
BEGIN
        DECLARE working TEXT;
        DECLARE token TEXT;
        DECLARE base_token TEXT;
        DECLARE pos INT;
        DECLARE left_games INT;
        DECLARE right_games INT;
        DECLARE total_games INT DEFAULT 0;
        DECLARE set_count INT DEFAULT 0;

        IF score IS NULL THEN
            RETURN NULL;
        END IF;

        IF TRIM(score) = '' THEN
            RETURN 0;
        END IF;

        SET working = UPPER(TRIM(score));

        IF working REGEXP '(^|[[:space:]])(RET|RET''D|RETD|W/O|WO|WALKOVER|DEF|ABD)($|[[:space:]])' THEN
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

            IF token NOT REGEXP '^\\[(0|15|30|40|A)-(0|15|30|40|A)\\]$' THEN
                IF NOT (
                    token REGEXP '^[0-9]+-[0-9]+$' OR
                    token REGEXP '^[0-9]+-[0-9]+\\([0-9]+\\)$' OR
                    token REGEXP '^[0-9]+\\([0-9]+\\)-[0-9]+\\([0-9]+\\)$' OR
                    token REGEXP '^[0-9]+\\([0-9]+\\)[0-9]+\\([0-9]+\\)$' OR
                    token REGEXP '^[0-9]+[0-9]+\\([0-9]+\\)$' OR
                    token REGEXP '^[0-9]+\\([0-9]+\\)[0-9]+$' OR
                    token REGEXP '^[0-9]{2,4}$'
                ) THEN
                    RETURN NULL;
                END IF;

                SET base_token = REGEXP_REPLACE(token, '\\([0-9]+\\)', '');

                IF base_token REGEXP '^[0-9]+-[0-9]+$' THEN
                    SET left_games = CAST(SUBSTRING_INDEX(base_token, '-', 1) AS UNSIGNED);
                    SET right_games = CAST(SUBSTRING_INDEX(base_token, '-', -1) AS UNSIGNED);
                ELSEIF CHAR_LENGTH(base_token) = 2 THEN
                    SET left_games = CAST(LEFT(base_token, 1) AS UNSIGNED);
                    SET right_games = CAST(RIGHT(base_token, 1) AS UNSIGNED);
                ELSEIF CHAR_LENGTH(base_token) = 3 THEN
                    SET left_games = CAST(LEFT(base_token, 1) AS UNSIGNED);
                    SET right_games = CAST(RIGHT(base_token, 2) AS UNSIGNED);
                ELSEIF CHAR_LENGTH(base_token) = 4 THEN
                    SET left_games = CAST(LEFT(base_token, 2) AS UNSIGNED);
                    SET right_games = CAST(RIGHT(base_token, 2) AS UNSIGNED);
                ELSE
                    RETURN NULL;
                END IF;

                SET total_games = total_games + left_games + right_games;
                SET set_count = set_count + 1;
            END IF;
        END WHILE;

        IF set_count = 0 THEN
            RETURN NULL;
        END IF;

        RETURN total_games;
    END;

-- Create syntax for FUNCTION 'NUMBER_OF_SETS'
CREATE DEFINER=`root`@`%` FUNCTION `NUMBER_OF_SETS`(score TEXT) RETURNS int(11)
    DETERMINISTIC
BEGIN
        DECLARE working TEXT;
        DECLARE token TEXT;
        DECLARE pos INT;
        DECLARE total_sets INT DEFAULT 0;

        IF score IS NULL THEN
            RETURN NULL;
        END IF;

        IF TRIM(score) = '' THEN
            RETURN 0;
        END IF;

        SET working = UPPER(TRIM(score));

        IF working REGEXP '(^|[[:space:]])(RET|RET''D|RETD|W/O|WO|WALKOVER|DEF|ABD)($|[[:space:]])' THEN
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

            IF token NOT REGEXP '^\\[(0|15|30|40|A)-(0|15|30|40|A)\\]$' THEN
                IF NOT (
                    token REGEXP '^[0-9]+-[0-9]+$' OR
                    token REGEXP '^[0-9]+-[0-9]+\\([0-9]+\\)$' OR
                    token REGEXP '^[0-9]+\\([0-9]+\\)-[0-9]+\\([0-9]+\\)$' OR
                    token REGEXP '^[0-9]+\\([0-9]+\\)[0-9]+\\([0-9]+\\)$' OR
                    token REGEXP '^[0-9]+[0-9]+\\([0-9]+\\)$' OR
                    token REGEXP '^[0-9]+\\([0-9]+\\)[0-9]+$' OR
                    token REGEXP '^[0-9]{2,4}$'
                ) THEN
                    RETURN NULL;
                END IF;

                SET total_sets = total_sets + 1;
            END IF;
        END WHILE;

        IF total_sets = 0 THEN
            RETURN NULL;
        END IF;

        RETURN total_sets;
    END;

-- Create syntax for FUNCTION 'NUMBER_OF_TIE_BREAKS'
CREATE DEFINER=`root`@`%` FUNCTION `NUMBER_OF_TIE_BREAKS`(score TEXT) RETURNS int(11)
    DETERMINISTIC
BEGIN
        DECLARE working TEXT;
        DECLARE token TEXT;
        DECLARE pos INT;
        DECLARE total_tie_breaks INT DEFAULT 0;
        DECLARE set_count INT DEFAULT 0;

        IF score IS NULL THEN
            RETURN NULL;
        END IF;

        IF TRIM(score) = '' THEN
            RETURN 0;
        END IF;

        SET working = UPPER(TRIM(score));

        IF working REGEXP '(^|[[:space:]])(RET|RET''D|RETD|W/O|WO|WALKOVER|DEF|ABD)($|[[:space:]])' THEN
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

            IF token NOT REGEXP '^\\[(0|15|30|40|A)-(0|15|30|40|A)\\]$' THEN
                IF NOT (
                    token REGEXP '^[0-9]+-[0-9]+$' OR
                    token REGEXP '^[0-9]+-[0-9]+\\([0-9]+\\)$' OR
                    token REGEXP '^[0-9]+\\([0-9]+\\)-[0-9]+\\([0-9]+\\)$' OR
                    token REGEXP '^[0-9]+\\([0-9]+\\)[0-9]+\\([0-9]+\\)$' OR
                    token REGEXP '^[0-9]+[0-9]+\\([0-9]+\\)$' OR
                    token REGEXP '^[0-9]+\\([0-9]+\\)[0-9]+$' OR
                    token REGEXP '^[0-9]{2,4}$'
                ) THEN
                    RETURN NULL;
                END IF;

                SET set_count = set_count + 1;

                IF token REGEXP '\\([0-9]+\\)' THEN
                    SET total_tie_breaks = total_tie_breaks + 1;
                END IF;
            END IF;
        END WHILE;

        IF set_count = 0 THEN
            RETURN NULL;
        END IF;

        RETURN total_tie_breaks;
    END;

-- Create syntax for PROCEDURE 'sp_log'
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `sp_log`(IN p_message TEXT)
BEGIN
    INSERT INTO log(message)
    VALUES (p_message);
END;;
DELIMITER ;

-- Create syntax for PROCEDURE 'sp_update'
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `sp_update`()
BEGIN
    DECLARE exit handler FOR SQLEXCEPTION
    BEGIN
        CALL sp_log('sp_update: ERROR during execution');
        RESIGNAL;
    END;

    CALL sp_log('Updating after import procedures...');

    CALL sp_update_surface_factors();
    CALL sp_update_match_duration();
    CALL sp_update_match_status(FALSE);

    CALL sp_log('Update finished successfully.');
END;;
DELIMITER ;

-- Create syntax for PROCEDURE 'sp_update_match_duration'
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `sp_update_match_duration`()
BEGIN
    /*
        Uppdaterar matches.duration
        Från format HH:MM:SS
        Till format HH:MM
        Påverkar endast rader som exakt matchar HH:MM:SS.
    */
    
    CALL sp_log('Updating match duration times...');

    UPDATE matches
    SET duration = LEFT(duration, 5)
    WHERE duration IS NOT NULL
      AND duration REGEXP '^[0-9]{2}:[0-9]{2}:[0-9]{2}$';
END;;
DELIMITER ;

-- Create syntax for PROCEDURE 'sp_update_match_status'
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `sp_update_match_status`(IN force_update BOOLEAN)
BEGIN
    CALL sp_log('Updating match status for matches...');

    UPDATE matches m
    SET m.status =
        CASE
            WHEN force_update = FALSE AND m.status IN ('Completed', 'Aborted', 'Walkover')
                THEN m.status
            WHEN m.score IS NULL OR TRIM(m.score) = ''
                THEN 'Unknown'
            WHEN UPPER(m.score) REGEXP '(^|[[:space:]])(W/O|WO|WALKOVER)($|[[:space:]])'
                THEN 'Walkover'
            WHEN UPPER(m.score) REGEXP '(^|[[:space:]])(RET|RET''D|RETD|DEF|ABD)($|[[:space:]])'
                THEN 'Aborted'
            ELSE 'Completed'
        END
    WHERE
        force_update = TRUE
        OR m.status IS NULL
        OR m.status = 'Unknown';
END;;
DELIMITER ;

-- Create syntax for PROCEDURE 'sp_update_surface_factors'
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `sp_update_surface_factors`()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE current_player_id VARCHAR(50);

  -- Cursor: endast aktiva spelare
  DECLARE player_cursor CURSOR FOR
      SELECT id FROM players WHERE active;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

  CALL sp_log('Updating surface factors for active players...');

  -- 1) Nollställ ALLA spelare
  UPDATE players
     SET grass_factor = NULL,
         clay_factor  = NULL,
         hard_factor  = NULL;

  -- 2) Uppdatera endast aktiva
  OPEN player_cursor;

  player_loop: LOOP
    FETCH player_cursor INTO current_player_id;
    IF done THEN
      LEAVE player_loop;
    END IF;

    CALL sp_update_surface_factors_for_player(current_player_id);
  END LOOP;

  CLOSE player_cursor;
END;;
DELIMITER ;

-- Create syntax for PROCEDURE 'sp_update_surface_factors_for_player'
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `sp_update_surface_factors_for_player`(IN player_id VARCHAR(50))
BEGIN
  DECLARE clay_wins INT DEFAULT 0;
  DECLARE clay_matches INT DEFAULT 0;
  DECLARE hard_wins INT DEFAULT 0;
  DECLARE hard_matches INT DEFAULT 0;
  DECLARE grass_wins INT DEFAULT 0;
  DECLARE grass_matches INT DEFAULT 0;
  DECLARE clay_factor TINYINT;
  DECLARE hard_factor TINYINT;
  DECLARE grass_factor TINYINT;


  -- Drop and recreate temporary table
  DROP TEMPORARY TABLE IF EXISTS recent_matches;

  CREATE TEMPORARY TABLE recent_matches AS
  SELECT *
  FROM flatly
  WHERE event_date >= CURDATE() - INTERVAL 2 YEAR;

  -- Clay
  SELECT COUNT(*) INTO clay_wins
  FROM recent_matches
  WHERE event_surface = 'Clay' AND winner_id = player_id;

  SELECT COUNT(*) INTO clay_matches
  FROM recent_matches
  WHERE event_surface = 'Clay' AND (winner_id = player_id OR loser_id = player_id);

  -- Hard
  SELECT COUNT(*) INTO hard_wins
  FROM recent_matches
  WHERE event_surface = 'Hard' AND winner_id = player_id;

  SELECT COUNT(*) INTO hard_matches
  FROM recent_matches
  WHERE event_surface = 'Hard' AND (winner_id = player_id OR loser_id = player_id);

  -- Grass
  SELECT COUNT(*) INTO grass_wins
  FROM recent_matches
  WHERE event_surface = 'Grass' AND winner_id = player_id;

  SELECT COUNT(*) INTO grass_matches
  FROM recent_matches
  WHERE event_surface = 'Grass' AND (winner_id = player_id OR loser_id = player_id);

  -- Surface factors (win percentages)
  SET clay_factor = CASE WHEN clay_matches = 0 THEN NULL ELSE ROUND(clay_wins * 100 / clay_matches, 0) END;
  SET hard_factor = CASE WHEN hard_matches = 0 THEN NULL ELSE ROUND(hard_wins * 100 / hard_matches, 0) END;
  SET grass_factor = CASE WHEN grass_matches = 0 THEN NULL ELSE ROUND(grass_wins * 100 / grass_matches, 0) END;

  -- Update players table
  UPDATE players
  SET
    clay_factor = clay_factor,
    hard_factor = hard_factor,
    grass_factor = grass_factor
  WHERE id = player_id;

  -- Cleanup
  DROP TEMPORARY TABLE IF EXISTS recent_matches;
END;;
DELIMITER ;