# ************************************************************
# Sequel Pro SQL dump
# Version 4541
#
# http://www.sequelpro.com/
# https://github.com/sequelpro/sequelpro
#
# Värd: router.egelberg.se (MySQL 5.5.5-10.11.6-MariaDB-0+deb12u1)
# Databas: atp
# Genereringstid: 2026-02-25 17:41:26 +0000
# ************************************************************


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


# Tabelldump archive
# ------------------------------------------------------------

DROP TABLE IF EXISTS `archive`;

CREATE TABLE `archive` (
  `id` varchar(32) NOT NULL DEFAULT '',
  `date` date DEFAULT NULL,
  `name` varchar(50) DEFAULT NULL,
  `type` varchar(32) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



# Tabelldump currently
# ------------------------------------------------------------

DROP VIEW IF EXISTS `currently`;

CREATE TABLE `currently` (
   `event_id` VARCHAR(20) NOT NULL DEFAULT '',
   `event_date` DATE NULL DEFAULT NULL,
   `event_name` VARCHAR(50) NULL DEFAULT NULL,
   `event_location` VARCHAR(50) NULL DEFAULT NULL,
   `event_type` VARCHAR(50) NULL DEFAULT NULL,
   `player_id` VARCHAR(32) NOT NULL DEFAULT '',
   `player` VARCHAR(64) NULL DEFAULT NULL,
   `player_country` VARCHAR(16) NULL DEFAULT NULL,
   `player_rank` INT(11) NULL DEFAULT NULL,
   `round` VARCHAR(50) NULL DEFAULT NULL
) ENGINE=MyISAM;



# Tabelldump events
# ------------------------------------------------------------

DROP TABLE IF EXISTS `events`;

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



# Tabelldump flatly
# ------------------------------------------------------------

DROP VIEW IF EXISTS `flatly`;

CREATE TABLE `flatly` (
   `id` VARCHAR(50) NOT NULL DEFAULT '',
   `event_date` DATE NULL DEFAULT NULL,
   `event_id` VARCHAR(20) NULL DEFAULT '',
   `event_name` VARCHAR(50) NULL DEFAULT NULL,
   `event_location` VARCHAR(50) NULL DEFAULT NULL,
   `event_type` VARCHAR(50) NULL DEFAULT NULL,
   `event_surface` VARCHAR(50) NULL DEFAULT NULL,
   `round` VARCHAR(50) NULL DEFAULT 'NUL',
   `winner` VARCHAR(64) NULL DEFAULT NULL,
   `loser` VARCHAR(64) NULL DEFAULT NULL,
   `winner_id` VARCHAR(32) NULL DEFAULT '',
   `winner_rank` INT(11) NULL DEFAULT NULL,
   `loser_id` VARCHAR(32) NULL DEFAULT '',
   `loser_rank` INT(11) NULL DEFAULT NULL,
   `score` VARCHAR(50) NULL DEFAULT NULL,
   `status` ENUM('Completed','Aborted','Walkover','Unknown') NULL DEFAULT NULL,
   `duration` VARCHAR(50) NULL DEFAULT NULL
) ENGINE=MyISAM;



# Tabelldump log
# ------------------------------------------------------------

DROP TABLE IF EXISTS `log`;

CREATE TABLE `log` (
  `timestamp` datetime DEFAULT current_timestamp(),
  `message` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



# Tabelldump matches
# ------------------------------------------------------------

DROP TABLE IF EXISTS `matches`;

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
  `duration` varchar(50) DEFAULT NULL COMMENT 'Duration of the match',
  PRIMARY KEY (`id`),
  KEY `events` (`event`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



# Tabelldump players
# ------------------------------------------------------------

DROP TABLE IF EXISTS `players`;

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



# Tabelldump queries
# ------------------------------------------------------------

DROP TABLE IF EXISTS `queries`;

CREATE TABLE `queries` (
  `name` longtext DEFAULT NULL,
  `question` longtext NOT NULL,
  `query` longtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



# Tabelldump settings
# ------------------------------------------------------------

DROP TABLE IF EXISTS `settings`;

CREATE TABLE `settings` (
  `key` varchar(100) NOT NULL DEFAULT '',
  `value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`value`)),
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



# Tabelldump storage
# ------------------------------------------------------------

DROP TABLE IF EXISTS `storage`;

CREATE TABLE `storage` (
  `key` varchar(100) NOT NULL DEFAULT '',
  `value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`value`)),
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;





# Replace placeholder table for currently with correct view syntax
# ------------------------------------------------------------

DROP TABLE `currently`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`%` SQL SECURITY DEFINER VIEW `currently` AS with ongoing_events as (select `e`.`id` AS `id`,`e`.`name` AS `name`,`e`.`date` AS `date`,`e`.`type` AS `type`,`e`.`location` AS `location` from `events` `e` where `e`.`type` in ('Grand Slam','Masters','ATP-500','ATP-250') and `e`.`date` >= curdate() - interval 14 day and !exists(select 1 from `matches` `m` where `m`.`event` = `e`.`id` and `m`.`round` = 'F' and `m`.`score` is not null and `m`.`score` <> '' limit 1)), main_draw_matches as (select `m`.`id` AS `match_id`,`m`.`event` AS `event`,`m`.`round` AS `round`,`m`.`winner` AS `winner`,`m`.`loser` AS `loser` from `matches` `m` where `m`.`round` in ('F','SF','QF','R16','R32','R128')), player_matches as (select `mdm`.`event` AS `event`,`mdm`.`match_id` AS `match_id`,`mdm`.`round` AS `round`,`mdm`.`winner` AS `winner`,`mdm`.`loser` AS `loser`,`mdm`.`winner` AS `player_id`,1 AS `is_winner` from `main_draw_matches` `mdm` union all select `mdm`.`event` AS `event`,`mdm`.`match_id` AS `match_id`,`mdm`.`round` AS `round`,`mdm`.`winner` AS `winner`,`mdm`.`loser` AS `loser`,`mdm`.`loser` AS `player_id`,0 AS `is_winner` from `main_draw_matches` `mdm`), ranked_player_matches as (select `pm`.`event` AS `event`,`pm`.`match_id` AS `match_id`,`pm`.`round` AS `round`,`pm`.`winner` AS `winner`,`pm`.`loser` AS `loser`,`pm`.`player_id` AS `player_id`,`pm`.`is_winner` AS `is_winner`,row_number() over ( partition by `pm`.`event`,`pm`.`player_id` order by case `pm`.`round` when 'F' then 6 when 'SF' then 5 when 'QF' then 4 when 'R16' then 3 when 'R32' then 2 when 'R128' then 1 else 0 end desc,`pm`.`match_id` desc) AS `rn` from `player_matches` `pm`), alive_players as (select `rpm`.`event` AS `event`,`rpm`.`player_id` AS `player_id`,`rpm`.`round` AS `round` from `ranked_player_matches` `rpm` where `rpm`.`rn` = 1 and `rpm`.`is_winner` = 1)select `oe`.`id` AS `event_id`,`oe`.`date` AS `event_date`,`oe`.`name` AS `event_name`,`oe`.`location` AS `event_location`,`oe`.`type` AS `event_type`,`p`.`id` AS `player_id`,`p`.`name` AS `player`,`p`.`country` AS `player_country`,`p`.`rank` AS `player_rank`,`ap`.`round` AS `round` from ((`ongoing_events` `oe` join `alive_players` `ap` on(`ap`.`event` = `oe`.`id`)) join `players` `p` on(`p`.`id` = `ap`.`player_id`)) order by `oe`.`date` desc,`oe`.`name`,`p`.`rank` is null,`p`.`rank`,`p`.`name`;


# Replace placeholder table for flatly with correct view syntax
# ------------------------------------------------------------

DROP TABLE `flatly`;

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

--
-- Dumping routines (PROCEDURE) for database 'atp'
--
DELIMITER ;;

# Dump of PROCEDURE sp_log
# ------------------------------------------------------------

/*!50003 DROP PROCEDURE IF EXISTS `sp_log` */;;
/*!50003 SET SESSION SQL_MODE="STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION"*/;;
/*!50003 CREATE*/ /*!50020 DEFINER=`root`@`%`*/ /*!50003 PROCEDURE `sp_log`(IN p_message TEXT)
BEGIN
    INSERT INTO log(message)
    VALUES (p_message);
END */;;

/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;;
# Dump of PROCEDURE sp_update
# ------------------------------------------------------------

/*!50003 DROP PROCEDURE IF EXISTS `sp_update` */;;
/*!50003 SET SESSION SQL_MODE="STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION"*/;;
/*!50003 CREATE*/ /*!50020 DEFINER=`root`@`%`*/ /*!50003 PROCEDURE `sp_update`()
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
END */;;

/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;;
# Dump of PROCEDURE sp_update_match_duration
# ------------------------------------------------------------

/*!50003 DROP PROCEDURE IF EXISTS `sp_update_match_duration` */;;
/*!50003 SET SESSION SQL_MODE="STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION"*/;;
/*!50003 CREATE*/ /*!50020 DEFINER=`root`@`%`*/ /*!50003 PROCEDURE `sp_update_match_duration`()
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
END */;;

/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;;
# Dump of PROCEDURE sp_update_match_status
# ------------------------------------------------------------

/*!50003 DROP PROCEDURE IF EXISTS `sp_update_match_status` */;;
/*!50003 SET SESSION SQL_MODE="STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION"*/;;
/*!50003 CREATE*/ /*!50020 DEFINER=`root`@`%`*/ /*!50003 PROCEDURE `sp_update_match_status`(IN force_update BOOLEAN)
BEGIN
    CALL sp_log('Updating match status for matches...');

    UPDATE matches m
    JOIN events e ON e.id = m.event
    SET m.status =
        CASE

            -- Behåll Walkover om vi inte tvingar uppdatering
            WHEN force_update = FALSE AND m.status = 'Walkover'
                THEN m.status

            -- Ingen score (NULL eller bara whitespace)
            WHEN m.score IS NULL OR TRIM(m.score) = ''
                THEN 'Unknown'

            -- Om matchen inte är färdig enligt tennisregler
            WHEN IS_MATCH_COMPLETED(m.score) = 0
                THEN 'Aborted'

            -- Grand Slam main draw = best-of-5
            WHEN e.type = 'Grand Slam'
                 AND m.round IN ('F','SF','QF','R16','R32','R64','R128')
                 AND NUMBER_OF_SETS_PLAYED(m.score) >= 3
                THEN 'Completed'

            WHEN e.type = 'Grand Slam'
                 AND m.round IN ('F','SF','QF','R16','R32','R64','R128')
                 AND NUMBER_OF_SETS_PLAYED(m.score) < 3
                THEN 'Aborted'

            -- Övriga matcher = best-of-3
            WHEN NUMBER_OF_SETS_PLAYED(m.score) >= 2
                THEN 'Completed'

            ELSE 'Aborted'

        END
    WHERE
        force_update = TRUE
        OR m.status IS NULL
        OR m.status = 'Unknown';

END */;;

/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;;
# Dump of PROCEDURE sp_update_surface_factors
# ------------------------------------------------------------

/*!50003 DROP PROCEDURE IF EXISTS `sp_update_surface_factors` */;;
/*!50003 SET SESSION SQL_MODE="STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION"*/;;
/*!50003 CREATE*/ /*!50020 DEFINER=`root`@`%`*/ /*!50003 PROCEDURE `sp_update_surface_factors`()
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
END */;;

/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;;
# Dump of PROCEDURE sp_update_surface_factors_for_player
# ------------------------------------------------------------

/*!50003 DROP PROCEDURE IF EXISTS `sp_update_surface_factors_for_player` */;;
/*!50003 SET SESSION SQL_MODE="STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION"*/;;
/*!50003 CREATE*/ /*!50020 DEFINER=`root`@`%`*/ /*!50003 PROCEDURE `sp_update_surface_factors_for_player`(IN player_id VARCHAR(50))
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
END */;;

/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;;
DELIMITER ;

--
-- Dumping routines (FUNCTION) for database 'atp'
--
DELIMITER ;;

# Dump of FUNCTION IS_MATCH_COMPLETED
# ------------------------------------------------------------

/*!50003 DROP FUNCTION IF EXISTS `IS_MATCH_COMPLETED` */;;
/*!50003 SET SESSION SQL_MODE="STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION"*/;;
/*!50003 CREATE*/ /*!50020 DEFINER=`root`@`%`*/ /*!50003 FUNCTION `IS_MATCH_COMPLETED`(score VARCHAR(255)) RETURNS tinyint(4)
    DETERMINISTIC
BEGIN
    DECLARE last_set VARCHAR(50);
    DECLARE games_part VARCHAR(50);
    DECLARE a_str VARCHAR(10);
    DECLARE b_str VARCHAR(10);
    DECLARE a INT;
    DECLARE b INT;
    DECLARE hi INT;
    DECLARE lo INT;

    IF score IS NULL OR TRIM(score) = '' THEN
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

    -- Hämta sista setet
    SET last_set = SUBSTRING_INDEX(score, ' ', -1);

    -- Ta bort eventuell tiebreak-del, t.ex. 7-6(5) → 7-6
    SET games_part = SUBSTRING_INDEX(last_set, '(', 1);

    -- Validera formatet "X-Y" eller "XX-YY"
    IF games_part NOT REGEXP '^[0-9]{1,2}-[0-9]{1,2}$' THEN
        RETURN 0;
    END IF;

    SET a_str = SUBSTRING_INDEX(games_part, '-', 1);
    SET b_str = SUBSTRING_INDEX(games_part, '-', -1);

    SET a = CAST(a_str AS UNSIGNED);
    SET b = CAST(b_str AS UNSIGNED);

    SET hi = GREATEST(a, b);
    SET lo = LEAST(a, b);

    /*
      Match anses avslutad om:
      - någon har minst 6 games
      - och leder med minst 2 games
      (täcker 6-0, 6-4, 8-6, 13-11 osv)
      - eller tiebreak-set 7-6
    */
    IF (hi >= 6 AND (hi - lo) >= 2)
       OR (hi = 7 AND lo = 6)
    THEN
        RETURN 1;
    END IF;

    RETURN 0;
END */;;

/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;;
# Dump of FUNCTION NUMBER_OF_GAMES_PLAYED
# ------------------------------------------------------------

/*!50003 DROP FUNCTION IF EXISTS `NUMBER_OF_GAMES_PLAYED` */;;
/*!50003 SET SESSION SQL_MODE="STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION"*/;;
/*!50003 CREATE*/ /*!50020 DEFINER=`root`@`%`*/ /*!50003 FUNCTION `NUMBER_OF_GAMES_PLAYED`(score VARCHAR(255)) RETURNS int(11)
    DETERMINISTIC
BEGIN
    DECLARE total_games INT DEFAULT 0;
    DECLARE i INT DEFAULT 1;
    DECLARE sets INT;
    DECLARE set_token VARCHAR(30);
    DECLARE games_part VARCHAR(30);
    DECLARE a_str VARCHAR(10);
    DECLARE b_str VARCHAR(10);
    DECLARE a INT;
    DECLARE b INT;

    IF score IS NULL OR TRIM(score) = '' THEN
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

    -- Antal set = antal tokens (spaces + 1)
    SET sets = 1 + LENGTH(score) - LENGTH(REPLACE(score, ' ', ''));

    WHILE i <= sets DO
        SET set_token = SUBSTRING_INDEX(SUBSTRING_INDEX(score, ' ', i), ' ', -1);

        -- Ta bort eventuell tiebreak-del: 7-6(5) -> 7-6
        SET games_part = SUBSTRING_INDEX(set_token, '(', 1);

        -- Måste se ut som "X-Y" eller "XX-YY"
        IF games_part NOT REGEXP '^[0-9]{1,2}-[0-9]{1,2}$' THEN
            RETURN 0;
        END IF;

        SET a_str = SUBSTRING_INDEX(games_part, '-', 1);
        SET b_str = SUBSTRING_INDEX(games_part, '-', -1);

        SET a = CAST(a_str AS UNSIGNED);
        SET b = CAST(b_str AS UNSIGNED);

        SET total_games = total_games + a + b;
        SET i = i + 1;
    END WHILE;

    RETURN total_games;
END */;;

/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;;
# Dump of FUNCTION NUMBER_OF_MINUTES_PLAYED
# ------------------------------------------------------------

/*!50003 DROP FUNCTION IF EXISTS `NUMBER_OF_MINUTES_PLAYED` */;;
/*!50003 SET SESSION SQL_MODE="STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION"*/;;
/*!50003 CREATE*/ /*!50020 DEFINER=`root`@`%`*/ /*!50003 FUNCTION `NUMBER_OF_MINUTES_PLAYED`(duration VARCHAR(8)) RETURNS int(11)
    DETERMINISTIC
BEGIN
    DECLARE hours INT;
    DECLARE minutes INT;

    IF duration IS NULL OR LENGTH(duration) < 5 THEN
        RETURN NULL;
    END IF;

    SET hours = CAST(SUBSTRING_INDEX(duration, ':', 1) AS UNSIGNED);
    SET minutes = CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(duration, ':', -2), ':', 1) AS UNSIGNED);

    RETURN (hours * 60) + minutes;
END */;;

/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;;
# Dump of FUNCTION NUMBER_OF_SETS
# ------------------------------------------------------------

/*!50003 DROP FUNCTION IF EXISTS `NUMBER_OF_SETS` */;;
/*!50003 SET SESSION SQL_MODE="STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION"*/;;
/*!50003 CREATE*/ /*!50020 DEFINER=`root`@`%`*/ /*!50003 FUNCTION `NUMBER_OF_SETS`(event_type VARCHAR(50), round VARCHAR(20)) RETURNS int(11)
    DETERMINISTIC
BEGIN
  RETURN
    CASE
      WHEN event_type = 'Grand Slam'
           AND round IN ('F','SF','QF','R16','R32','R64','R128')
        THEN 5
      ELSE 3
    END;
END */;;

/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;;
# Dump of FUNCTION NUMBER_OF_SETS_PLAYED
# ------------------------------------------------------------

/*!50003 DROP FUNCTION IF EXISTS `NUMBER_OF_SETS_PLAYED` */;;
/*!50003 SET SESSION SQL_MODE="STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION"*/;;
/*!50003 CREATE*/ /*!50020 DEFINER=`root`@`%`*/ /*!50003 FUNCTION `NUMBER_OF_SETS_PLAYED`(score VARCHAR(255)) RETURNS int(11)
    DETERMINISTIC
BEGIN
    DECLARE sets_played INT DEFAULT 0;

    IF score IS NULL OR TRIM(score) = '' THEN
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

    -- Räkna antal set = antal tokens (spaces + 1)
    SET sets_played = 1 + LENGTH(score) - LENGTH(REPLACE(score, ' ', ''));

    -- Rimliga gränser: 1..5 (avbruten match kan ge 1 set)
    IF sets_played BETWEEN 1 AND 5 THEN
        RETURN sets_played;
    END IF;

    RETURN 0;
END */;;

/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;;
# Dump of FUNCTION NUMBER_OF_TIEBREAKS_PLAYED
# ------------------------------------------------------------

/*!50003 DROP FUNCTION IF EXISTS `NUMBER_OF_TIEBREAKS_PLAYED` */;;
/*!50003 SET SESSION SQL_MODE="STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION"*/;;
/*!50003 CREATE*/ /*!50020 DEFINER=`root`@`%`*/ /*!50003 FUNCTION `NUMBER_OF_TIEBREAKS_PLAYED`(score VARCHAR(255)) RETURNS int(11)
    DETERMINISTIC
BEGIN
    IF score IS NULL OR TRIM(score) = '' THEN
        RETURN 0;
    END IF;

    RETURN LENGTH(score) - LENGTH(REPLACE(score, '(', ''));
END */;;

/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;;
DELIMITER ;

/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
