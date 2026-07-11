
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `flatly`;
/*!50001 DROP VIEW IF EXISTS `flatly`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `flatly` AS SELECT
 1 AS `id`,
  1 AS `event_date`,
  1 AS `event_id`,
  1 AS `event_name`,
  1 AS `event_location`,
  1 AS `event_type`,
  1 AS `event_surface`,
  1 AS `round`,
  1 AS `winner`,
  1 AS `loser`,
  1 AS `winner_id`,
  1 AS `winner_rank`,
  1 AS `loser_id`,
  1 AS `loser_rank`,
  1 AS `score`,
  1 AS `status`,
  1 AS `duration` */;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `log` (
  `timestamp` datetime DEFAULT current_timestamp(),
  `message` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `matches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `matches` (
  `id` varchar(50) NOT NULL DEFAULT '' COMMENT 'Match ID',
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
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `players`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
  `elo_rank` int(11) DEFAULT NULL COMMENT 'ELO rank',
  `elo_rank_hard` int(11) DEFAULT NULL COMMENT 'ELO rank on hardcourt',
  `elo_rank_clay` int(11) DEFAULT NULL COMMENT 'ELO rank on clay',
  `elo_rank_grass` int(11) DEFAULT NULL COMMENT 'ELO rank on grass',
  `hard_factor` int(11) DEFAULT NULL COMMENT 'Performance on hardcourt (0-100)',
  `clay_factor` int(11) DEFAULT NULL COMMENT 'Performance on clay (0-100)',
  `grass_factor` int(11) DEFAULT NULL COMMENT 'Performance on grass (0-100)',
  `url` varchar(100) DEFAULT NULL COMMENT 'URL to ATP home page',
  `wikipedia` varchar(100) DEFAULT NULL COMMENT 'URL to Wikipedia',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `settings` (
  `key` varchar(100) NOT NULL DEFAULT '',
  `value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`value`)),
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
/*!50003 DROP FUNCTION IF EXISTS `NUMBER_OF_GAMES` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`%` FUNCTION `NUMBER_OF_GAMES`(score TEXT) RETURNS int(11)
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
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
/*!50003 DROP FUNCTION IF EXISTS `NUMBER_OF_SETS` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`%` FUNCTION `NUMBER_OF_SETS`(score TEXT) RETURNS int(11)
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
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
/*!50003 DROP FUNCTION IF EXISTS `NUMBER_OF_TIE_BREAKS` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`%` FUNCTION `NUMBER_OF_TIE_BREAKS`(score TEXT) RETURNS int(11)
    DETERMINISTIC
BEGIN
    /*
    NUMBER_OF_TIE_BREAKS(score)

    Purpose
    - Return how many sets in a tennis score string were decided by tie-break.

    Expected score format
    - Space-separated set scores
    - Each set must look like:
      6-4
      7-6(5)
      6-7(8)

    Examples
    - '6-4 6-4' => 0
    - '7-6(5) 3-6 6-3' => 1
    - '7-6(4) 6-7(8) 7-6(6)' => 3

    Rules
    - A set counts as a tie-break set when it ends with '(...)'.
    - The number inside the parentheses is not interpreted further.
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
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
/*!50003 DROP FUNCTION IF EXISTS `PLAYER_LOOKUP` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`%` FUNCTION `PLAYER_LOOKUP`(searchTerm VARCHAR(255)
) RETURNS varchar(32) CHARSET utf8mb4 COLLATE utf8mb4_general_ci
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
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
/*!50003 DROP FUNCTION IF EXISTS `PLAYER_WIN_FACTOR` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` FUNCTION `PLAYER_WIN_FACTOR`(playerID VARCHAR(32),
    opponentID VARCHAR(32),
    surface VARCHAR(50)
) RETURNS double
    DETERMINISTIC
BEGIN

    DECLARE v_player_id VARCHAR(32) DEFAULT NULL;
    DECLARE v_opponent_id VARCHAR(32) DEFAULT NULL;
    DECLARE v_surface VARCHAR(50) DEFAULT NULL;
    DECLARE v_surface_name VARCHAR(50) DEFAULT NULL;

    DECLARE v_overall_a DOUBLE DEFAULT 1500;
    DECLARE v_overall_b DOUBLE DEFAULT 1500;
    DECLARE v_surface_a DOUBLE DEFAULT 1500;
    DECLARE v_surface_b DOUBLE DEFAULT 1500;
    DECLARE v_rank_a INT DEFAULT NULL;
    DECLARE v_rank_b INT DEFAULT NULL;

    DECLARE v_surface_matches_a INT DEFAULT 0;
    DECLARE v_surface_wins_a INT DEFAULT 0;
    DECLARE v_surface_matches_b INT DEFAULT 0;
    DECLARE v_surface_wins_b INT DEFAULT 0;
    DECLARE v_form_matches_a INT DEFAULT 0;
    DECLARE v_form_wins_a INT DEFAULT 0;
    DECLARE v_form_matches_b INT DEFAULT 0;
    DECLARE v_form_wins_b INT DEFAULT 0;
    DECLARE v_recent_matches_a INT DEFAULT 0;
    DECLARE v_recent_wins_a INT DEFAULT 0;
    DECLARE v_recent_matches_b INT DEFAULT 0;
    DECLARE v_recent_wins_b INT DEFAULT 0;

    DECLARE v_feature_overall DOUBLE DEFAULT 0;
    DECLARE v_feature_surface DOUBLE DEFAULT 0;
    DECLARE v_feature_ranking DOUBLE DEFAULT 0;
    DECLARE v_feature_surface_form DOUBLE DEFAULT 0;
    DECLARE v_feature_form12 DOUBLE DEFAULT 0;
    DECLARE v_feature_form365 DOUBLE DEFAULT 0;
    DECLARE v_score DOUBLE DEFAULT 0.0000253868667645;
    DECLARE v_probability DOUBLE DEFAULT NULL;

    IF playerID IS NULL OR TRIM(playerID) = '' OR opponentID IS NULL OR TRIM(opponentID) = '' THEN
        RETURN NULL;
    END IF;

    SET v_player_id = PLAYER_LOOKUP(playerID);
    SET v_opponent_id = PLAYER_LOOKUP(opponentID);
    IF v_player_id IS NULL OR v_opponent_id IS NULL OR UPPER(v_player_id) = UPPER(v_opponent_id) THEN
        RETURN NULL;
    END IF;

    SET v_surface = UPPER(NULLIF(TRIM(surface), ''));
    SET v_surface_name = CASE v_surface
        WHEN 'HARD' THEN 'Hard'
        WHEN 'CLAY' THEN 'Clay'
        WHEN 'GRASS' THEN 'Grass'
        ELSE NULL
    END;

    SELECT
        COALESCE(elo_rank, 1500),
        COALESCE(CASE v_surface
            WHEN 'HARD' THEN elo_rank_hard
            WHEN 'CLAY' THEN elo_rank_clay
            WHEN 'GRASS' THEN elo_rank_grass
            ELSE elo_rank
        END, elo_rank, 1500),
        rank
    INTO v_overall_a, v_surface_a, v_rank_a
    FROM players WHERE id = v_player_id LIMIT 1;

    SELECT
        COALESCE(elo_rank, 1500),
        COALESCE(CASE v_surface
            WHEN 'HARD' THEN elo_rank_hard
            WHEN 'CLAY' THEN elo_rank_clay
            WHEN 'GRASS' THEN elo_rank_grass
            ELSE elo_rank
        END, elo_rank, 1500),
        rank
    INTO v_overall_b, v_surface_b, v_rank_b
    FROM players WHERE id = v_opponent_id LIMIT 1;

    IF v_surface_name IS NULL THEN
        SET v_probability = 1 / (1 + POW(10, (v_overall_b - v_overall_a) / 400));
        RETURN LEAST(0.995, GREATEST(0.005, v_probability));
    END IF;

    SELECT COUNT(*), COALESCE(SUM(m.winner = v_player_id), 0)
    INTO v_surface_matches_a, v_surface_wins_a
    FROM matches m JOIN events e ON e.id = m.event
    WHERE m.winner IS NOT NULL AND m.loser IS NOT NULL
      AND e.surface = v_surface_name
      AND (m.winner = v_player_id OR m.loser = v_player_id);

    SELECT COUNT(*), COALESCE(SUM(m.winner = v_opponent_id), 0)
    INTO v_surface_matches_b, v_surface_wins_b
    FROM matches m JOIN events e ON e.id = m.event
    WHERE m.winner IS NOT NULL AND m.loser IS NOT NULL
      AND e.surface = v_surface_name
      AND (m.winner = v_opponent_id OR m.loser = v_opponent_id);

    SELECT COUNT(*), COALESCE(SUM(recent.winner = v_player_id), 0)
    INTO v_form_matches_a, v_form_wins_a
    FROM (
        SELECT m.winner
        FROM matches m JOIN events e ON e.id = m.event
        WHERE e.date IS NOT NULL
          AND e.type IN ('Grand Slam', 'Masters', 'ATP-500', 'ATP-250')
          AND m.winner IS NOT NULL AND m.loser IS NOT NULL
          AND (m.winner = v_player_id OR m.loser = v_player_id)
        ORDER BY e.date DESC, e.id DESC, m.id DESC
        LIMIT 12
    ) recent;

    SELECT COUNT(*), COALESCE(SUM(recent.winner = v_opponent_id), 0)
    INTO v_form_matches_b, v_form_wins_b
    FROM (
        SELECT m.winner
        FROM matches m JOIN events e ON e.id = m.event
        WHERE e.date IS NOT NULL
          AND e.type IN ('Grand Slam', 'Masters', 'ATP-500', 'ATP-250')
          AND m.winner IS NOT NULL AND m.loser IS NOT NULL
          AND (m.winner = v_opponent_id OR m.loser = v_opponent_id)
        ORDER BY e.date DESC, e.id DESC, m.id DESC
        LIMIT 12
    ) recent;

    SELECT COUNT(*), COALESCE(SUM(m.winner = v_player_id), 0)
    INTO v_recent_matches_a, v_recent_wins_a
    FROM matches m JOIN events e ON e.id = m.event
    WHERE e.date IS NOT NULL AND e.date >= CURDATE() - INTERVAL 365 DAY
      AND m.winner IS NOT NULL AND m.loser IS NOT NULL
      AND (m.winner = v_player_id OR m.loser = v_player_id);

    SELECT COUNT(*), COALESCE(SUM(m.winner = v_opponent_id), 0)
    INTO v_recent_matches_b, v_recent_wins_b
    FROM matches m JOIN events e ON e.id = m.event
    WHERE e.date IS NOT NULL AND e.date >= CURDATE() - INTERVAL 365 DAY
      AND m.winner IS NOT NULL AND m.loser IS NOT NULL
      AND (m.winner = v_opponent_id OR m.loser = v_opponent_id);

    SET v_feature_overall = (v_overall_a - v_overall_b) / 400;
    SET v_feature_surface = (v_surface_a - v_surface_b) / 400;
    IF v_rank_a IS NOT NULL AND v_rank_a > 0 AND v_rank_b IS NOT NULL AND v_rank_b > 0 THEN
        SET v_feature_ranking = LN(v_rank_b / v_rank_a);
    END IF;
    SET v_feature_surface_form =
        (CASE WHEN v_surface_matches_a > 0 THEN v_surface_wins_a / v_surface_matches_a ELSE 0.5 END)
        - (CASE WHEN v_surface_matches_b > 0 THEN v_surface_wins_b / v_surface_matches_b ELSE 0.5 END);
    SET v_feature_form12 =
        (CASE WHEN v_form_matches_a > 0 THEN v_form_wins_a / v_form_matches_a ELSE 0.5 END)
        - (CASE WHEN v_form_matches_b > 0 THEN v_form_wins_b / v_form_matches_b ELSE 0.5 END);
    SET v_feature_form365 =
        (CASE WHEN v_recent_matches_a > 0 THEN v_recent_wins_a / v_recent_matches_a ELSE 0.5 END)
        - (CASE WHEN v_recent_matches_b > 0 THEN v_recent_wins_b / v_recent_matches_b ELSE 0.5 END);

    SET v_score = v_score
        + 0.308259581872 * (v_feature_overall / 0.480841409542)
        + 0.271303033199 * (v_feature_surface / 0.453431590526)
        + 0.226042701631 * (v_feature_ranking / 1.032929982385)
        + 0.067860094189 * (v_feature_surface_form / 0.218879304230)
        + 0.066165906183 * (v_feature_form12 / 0.253832178694)
        + 0.031416125989 * (v_feature_form365 / 0.211008586769);

    SET v_probability = 1 / (1 + EXP(-v_score));
    RETURN LEAST(0.995, GREATEST(0.005, v_probability));
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
/*!50003 DROP PROCEDURE IF EXISTS `PLAYER_ODDS` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `PLAYER_ODDS`(
    IN playerA VARCHAR(255),
    IN playerB VARCHAR(255),
    IN surface VARCHAR(50)
)
BEGIN


    DECLARE resolvedPlayerA VARCHAR(32) DEFAULT NULL;
    DECLARE resolvedPlayerB VARCHAR(32) DEFAULT NULL;
    DECLARE normalizedSurface VARCHAR(50) DEFAULT NULL;
    DECLARE factorA DOUBLE DEFAULT NULL;
    DECLARE factorB DOUBLE DEFAULT NULL;
    DECLARE pricedFactorA DOUBLE DEFAULT NULL;
    DECLARE pricedFactorB DOUBLE DEFAULT NULL;

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
            CAST(NULL AS DECIMAL(10,2)) AS odds
        FROM players
        WHERE 1 = 0;
    ELSE
        SET factorA = PLAYER_WIN_FACTOR(resolvedPlayerA, resolvedPlayerB, normalizedSurface);

        IF factorA IS NULL OR factorA <= 0 OR factorA >= 1 THEN
            SELECT
                id AS player,
                name AS name,
                CAST(NULL AS DECIMAL(10,2)) AS odds
            FROM players
            WHERE 1 = 0;
        ELSE
            SET factorB = 1 - factorA;
            SET pricedFactorA = factorA * 1.05;
            SET pricedFactorB = factorB * 1.05;

            IF factorB <= 0 OR factorB >= 1 THEN
                SELECT
                    id AS player,
                    name AS name,
                    CAST(NULL AS DECIMAL(10,2)) AS odds
                FROM players
                WHERE 1 = 0;
            ELSE
                SELECT
                    p.id AS player,
                    p.name AS name,
                    ROUND(1 / pricedFactorA, 2) AS odds
                FROM players p
                WHERE p.id = resolvedPlayerA

                UNION ALL

                SELECT
                    p.id AS player,
                    p.name AS name,
                    ROUND(1 / pricedFactorB, 2) AS odds
                FROM players p
                WHERE p.id = resolvedPlayerB;
            END IF;
        END IF;
    END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
/*!50003 DROP PROCEDURE IF EXISTS `PLAYER_SEARCH` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `PLAYER_SEARCH`(
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
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50001 DROP VIEW IF EXISTS `flatly`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `flatly` AS select `matches`.`id` AS `id`,`C`.`date` AS `event_date`,`C`.`id` AS `event_id`,`C`.`name` AS `event_name`,`C`.`location` AS `event_location`,`C`.`type` AS `event_type`,`C`.`surface` AS `event_surface`,`matches`.`round` AS `round`,`A`.`name` AS `winner`,`B`.`name` AS `loser`,`A`.`id` AS `winner_id`,`matches`.`winner_rank` AS `winner_rank`,`B`.`id` AS `loser_id`,`matches`.`loser_rank` AS `loser_rank`,`matches`.`score` AS `score`,`matches`.`status` AS `status`,`matches`.`duration` AS `duration` from (((`matches` left join `players` `A` on(`matches`.`winner` = `A`.`id`)) left join `players` `B` on(`matches`.`loser` = `B`.`id`)) left join `events` `C` on(`matches`.`event` = `C`.`id`)) order by `C`.`date` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
