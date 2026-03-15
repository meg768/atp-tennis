# ************************************************************
# Sequel Pro SQL dump
# Version 4541
#
# http://www.sequelpro.com/
# https://github.com/sequelpro/sequelpro
#
# Värd: router.egelberg.se (MySQL 5.5.5-10.11.6-MariaDB-0+deb12u1)
# Databas: atp
# Genereringstid: 2026-03-15 18:25:02 +0000
# ************************************************************


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


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
  `duration` varchar(50) DEFAULT NULL COMMENT 'Duration of the match in format H:MM',
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



# Tabelldump settings
# ------------------------------------------------------------

DROP TABLE IF EXISTS `settings`;

CREATE TABLE `settings` (
  `key` varchar(100) NOT NULL DEFAULT '',
  `value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`value`)),
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;





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
-- Helper functions for normalized score queries
--
DELIMITER ;;

DROP FUNCTION IF EXISTS `NUMBER_OF_GAMES`;;
CREATE FUNCTION `NUMBER_OF_GAMES`(score TEXT) RETURNS int(11)
    DETERMINISTIC
BEGIN
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

DROP FUNCTION IF EXISTS `NUMBER_OF_SETS`;;
CREATE FUNCTION `NUMBER_OF_SETS`(score TEXT) RETURNS int(11)
    DETERMINISTIC
BEGIN
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

DROP FUNCTION IF EXISTS `NUMBER_OF_TIE_BREAKS`;;
CREATE FUNCTION `NUMBER_OF_TIE_BREAKS`(score TEXT) RETURNS int(11)
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

        SET set_count = set_count + 1;

        IF token REGEXP '\\([0-9]+\\)$' THEN
            SET total_tie_breaks = total_tie_breaks + 1;
        END IF;
    END WHILE;

    IF set_count = 0 THEN
        RETURN NULL;
    END IF;

    RETURN total_tie_breaks;
END;;

DELIMITER ;

/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
