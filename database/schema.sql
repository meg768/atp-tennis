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
  `wikipedia` varchar(100) DEFAULT NULL COMMENT 'URL to Wikipedia',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create syntax for TABLE 'settings'
CREATE TABLE `settings` (
  `key` varchar(100) NOT NULL DEFAULT '',
  `value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`value`)),
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create syntax for FUNCTION 'NUMBER_OF_GAMES'
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
END;

-- Create syntax for FUNCTION 'NUMBER_OF_SETS'
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
END;

-- Create syntax for FUNCTION 'NUMBER_OF_TIE_BREAKS'
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
END;

-- Create syntax for FUNCTION 'PLAYER_ELO_FACTOR'
CREATE DEFINER=`root`@`%` FUNCTION `PLAYER_ELO_FACTOR`(playerID VARCHAR(32),
    opponentID VARCHAR(32),
    surface VARCHAR(50)
) RETURNS decimal(10,4)
    DETERMINISTIC
BEGIN
    /*
    PLAYER_ELO_FACTOR(playerID, opponentID, surface)

    Purpose
    - Return one ELO-based win signal in the range 0..1 for playerID against
      opponentID.
    - Higher means the ELO signal favors playerID.
    - Lower means the ELO signal favors opponentID.
    - 0.5 is neutral.

    Why this is a function
    - It returns one scalar value.
    - It is intended to be usable inside regular SQL queries.
    - Example usage:
      SELECT PLAYER_ELO_FACTOR('S0AG', 'A0E2', NULL);
      SELECT PLAYER_ELO_FACTOR('S0AG', 'A0E2', 'Hard');

    Why this exists
    - The odds model already has an ELO-based factor.
    - Keeping the same core logic in MariaDB avoids duplicated business logic.

    Surface behavior
    - NULL or empty surface => use overall `elo_rank`
    - Hard => use `elo_rank_hard`
    - Clay => use `elo_rank_clay`
    - Grass => use `elo_rank_grass`
    - Any other surface value falls back to overall `elo_rank`

    Exact formula
    - probability = 1 / (1 + POW(10, (elo_opponent - elo_player) / 400))

    Inputs and edge cases
    - Invalid playerID => NULL
    - Invalid opponentID => NULL
    - Same player and opponent => NULL
    - Missing usable ELO on either side => NULL
    */

    DECLARE v_surface VARCHAR(50) DEFAULT NULL;
    DECLARE v_elo_player DOUBLE DEFAULT NULL;
    DECLARE v_elo_opponent DOUBLE DEFAULT NULL;
    DECLARE v_probability DOUBLE DEFAULT NULL;

    IF playerID IS NULL OR TRIM(playerID) = '' OR opponentID IS NULL OR TRIM(opponentID) = '' THEN
        RETURN NULL;
    END IF;

    IF UPPER(playerID) = UPPER(opponentID) THEN
        RETURN NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM players WHERE id = playerID) THEN
        RETURN NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM players WHERE id = opponentID) THEN
        RETURN NULL;
    END IF;

    SET v_surface = UPPER(NULLIF(TRIM(surface), ''));

    SELECT
        CASE
            WHEN v_surface = 'HARD' THEN COALESCE(elo_rank_hard, elo_rank)
            WHEN v_surface = 'CLAY' THEN COALESCE(elo_rank_clay, elo_rank)
            WHEN v_surface = 'GRASS' THEN COALESCE(elo_rank_grass, elo_rank)
            ELSE elo_rank
        END
    INTO v_elo_player
    FROM players
    WHERE id = playerID
    LIMIT 1;

    SELECT
        CASE
            WHEN v_surface = 'HARD' THEN COALESCE(elo_rank_hard, elo_rank)
            WHEN v_surface = 'CLAY' THEN COALESCE(elo_rank_clay, elo_rank)
            WHEN v_surface = 'GRASS' THEN COALESCE(elo_rank_grass, elo_rank)
            ELSE elo_rank
        END
    INTO v_elo_opponent
    FROM players
    WHERE id = opponentID
    LIMIT 1;

    IF v_elo_player IS NULL OR v_elo_opponent IS NULL THEN
        RETURN NULL;
    END IF;

    SET v_probability = 1 / (1 + POW(10, (v_elo_opponent - v_elo_player) / 400));

    RETURN ROUND(v_probability, 4);
END;

-- Create syntax for FUNCTION 'PLAYER_FORM_FACTOR'
CREATE DEFINER=`root`@`%` FUNCTION `PLAYER_FORM_FACTOR`(playerID VARCHAR(32)) RETURNS decimal(10,4)
    DETERMINISTIC
BEGIN
/*
PLAYER_FORM_FACTOR(playerID)

Purpose
- Return one numeric form signal in the range 0..1 for a single player.
- Higher means stronger recent form, lower means weaker recent form.
- 0.5 is intentionally treated as neutral.

Why this is a function
- It returns one scalar value.
- It is intended to be usable inside regular SQL queries.
- Example usage:
SELECT PLAYER_FORM_FACTOR('S0AG');
SELECT id, name, PLAYER_FORM_FACTOR(id) AS form_factor FROM players;

High-level model
1. Look only at completed matches for the player.
2. Ignore matches without a known event date.
3. Restrict the sample to the last 8 weeks.
4. Weight newer matches higher than older matches inside that window.
5. Shrink the result toward 0.5 so tiny samples do not look too extreme.

Why this exists
- A plain recent win rate is too jumpy.
- A player who wins 2-3 recent matches should not instantly look like "full form".
- Newer matches should matter more than older matches.

Exact weighting choice
- match_weight = POW(0.5, days_ago / window_days)
- window_days = 8 * 7

Interpretation of the weighting
- A match played today has weight 1.0.
- A match at the edge of the window has weight about 0.5.
- Matches halfway back in the window have weight about sqrt(0.5) ~= 0.707.
- This is a gentle recency bias, not an aggressive one.

Exact smoothing choice
- form_factor = (weighted_wins + 8) / (weighted_matches + 16)

Interpretation of the smoothing
- This is equivalent to a neutral prior of 16 weighted matches at 50/50.
- No matches in the window returns 0.5.
- Small samples stay close to 0.5.
- Larger samples gradually dominate the prior.

Why 16/8 was chosen
- Earlier, weaker smoothing made 2-3 recent wins look too strong.
- This heavier prior keeps the metric conservative.
- The goal is not to maximize reactivity, but to avoid overconfidence.

Inputs and edge cases
- Invalid playerID => NULL
- Unknown playerID => NULL
- Valid player with no matches in the window => 0.5000

Things you may want to tune later
- Recency curve:
change POW(0.5, ...) to another decay function
- Window behavior:
change the hardcoded 8-week window in this function
- Prior strength:
replace +8 / +16 with something lighter or heavier
- Match filtering:
add surface, tournament level, opponent strength, or minimum-match rules

Non-goals in the current version
- No opponent-strength adjustment
- No surface-specific adjustment
- No tournament-importance adjustment
- No explicit cap/minimum-sample threshold beyond the neutral prior
*/

DECLARE v_weighted_matches DECIMAL(12, 6) DEFAULT 0;

DECLARE v_weighted_wins DECIMAL(12, 6) DEFAULT 0;

DECLARE v_window_days DECIMAL(12, 6) DEFAULT 0;
DECLARE v_weeks INT DEFAULT 8;

IF playerID IS NULL
OR TRIM(playerID) = '' THEN RETURN NULL;

ELSEIF NOT EXISTS (
    SELECT
        1
    FROM
        players
    WHERE
        id = playerID
) THEN RETURN NULL;

END IF;

SET
    v_window_days = v_weeks * 7;

SELECT
    COALESCE(SUM(match_weight), 0) AS weighted_matches,
    COALESCE(
        SUM(
            CASE
                WHEN is_win = 1 THEN match_weight
                ELSE 0
            END
        ),
        0
    ) AS weighted_wins INTO v_weighted_matches,
    v_weighted_wins
FROM
    (
        SELECT
            CASE
                WHEN m.winner = playerID THEN 1
                ELSE 0
            END AS is_win,
            POW(0.5, GREATEST(DATEDIFF(CURDATE(), e.date), 0) / v_window_days) AS match_weight
        FROM
            matches m
            JOIN events e ON e.id = m.event
        WHERE
            m.status = 'Completed'
            AND e.date IS NOT NULL
            AND e.date >= DATE_SUB(CURDATE(), INTERVAL v_weeks WEEK)
            AND (
                m.winner = playerID
                OR m.loser = playerID
            )
    ) recent_matches;

/* Conservative neutral prior: 16 weighted matches at 50/50.
This keeps tiny samples from looking like "full form" too early. */
RETURN ROUND((v_weighted_wins + 8) / (v_weighted_matches + 16), 4);

END;

-- Create syntax for FUNCTION 'PLAYER_HEAD_TO_HEAD_FACTOR'
CREATE DEFINER=`root`@`%` FUNCTION `PLAYER_HEAD_TO_HEAD_FACTOR`(playerID VARCHAR(32),
    opponentID VARCHAR(32),
    surface VARCHAR(50)
) RETURNS decimal(10,4)
    DETERMINISTIC
BEGIN
    /*
    PLAYER_HEAD_TO_HEAD_FACTOR(playerID, opponentID, surface)

    Purpose
    - Return one head-to-head-based win signal in the range 0..1 for playerID
      against opponentID.
    - Higher means the head-to-head signal favors playerID.
    - Lower means the head-to-head signal favors opponentID.
    - 0.5 is neutral.

    Why this is a function
    - It returns one scalar value.
    - It is intended to be usable inside regular SQL queries.
    - Example usage:
      SELECT PLAYER_HEAD_TO_HEAD_FACTOR('S0AG', 'A0E2', NULL);
      SELECT PLAYER_HEAD_TO_HEAD_FACTOR('S0AG', 'A0E2', 'Hard');

    Why this exists
    - The odds model already has a head-to-head factor in JavaScript.
    - Keeping the same core logic in MariaDB avoids duplicated business logic.

    High-level model
    1. Look only at completed matches between the two players.
    2. Ignore matches without a known event date.
    3. Restrict the sample to the last 2 years.
    4. If surface is provided, only use matches on that surface.
    5. Apply light smoothing so small samples do not become too extreme.

    Exact smoothing choice
    - wins_player = number of H2H wins for playerID
    - matches = total H2H matches in the sample
    - factor = (wins_player + 1) / (matches + 2)

    Interpretation of the smoothing
    - No matches => 0.5
    - 1-0 H2H => 0.6667
    - 2-0 H2H => 0.7500
    - 0-2 H2H => 0.2500

    Inputs and edge cases
    - Invalid playerID => NULL
    - Invalid opponentID => NULL
    - Same player and opponent => NULL
    - No H2H matches in the sample => 0.5000

    Surface parameter
    - If surface is NULL or empty, all surfaces are included.
    - Otherwise only exact surface matches are included.

    Non-goals in the current version
    - No recency weighting inside the 2-year window
    - No opponent-strength adjustment
    - No tournament-importance adjustment
    */

    DECLARE v_matches INT DEFAULT 0;
    DECLARE v_wins_player INT DEFAULT 0;
    DECLARE v_surface VARCHAR(50) DEFAULT NULL;

    IF playerID IS NULL OR TRIM(playerID) = '' OR opponentID IS NULL OR TRIM(opponentID) = '' THEN
        RETURN NULL;
    END IF;

    IF UPPER(playerID) = UPPER(opponentID) THEN
        RETURN NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM players WHERE id = playerID) THEN
        RETURN NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM players WHERE id = opponentID) THEN
        RETURN NULL;
    END IF;

    SET v_surface = NULLIF(TRIM(surface), '');

    SELECT
        COUNT(*) AS matches_played,
        COALESCE(SUM(CASE WHEN m.winner = playerID THEN 1 ELSE 0 END), 0) AS wins_player
    INTO
        v_matches,
        v_wins_player
    FROM matches m
    JOIN events e ON e.id = m.event
    WHERE
        m.status = 'Completed'
        AND e.date IS NOT NULL
        AND e.date >= DATE_SUB(CURDATE(), INTERVAL 2 YEAR)
        AND (
            (m.winner = playerID AND m.loser = opponentID)
            OR
            (m.winner = opponentID AND m.loser = playerID)
        )
        AND (v_surface IS NULL OR e.surface = v_surface);

    RETURN ROUND((v_wins_player + 1) / (v_matches + 2), 4);
END;

-- Create syntax for FUNCTION 'PLAYER_LOOKUP'
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
END;

-- Create syntax for PROCEDURE 'PLAYER_ODDS'
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `PLAYER_ODDS`(
    IN playerA VARCHAR(255),
    IN playerB VARCHAR(255),
    IN surface VARCHAR(50)
)
BEGIN
    /*
    PLAYER_ODDS(playerA, playerB, surface)

    Purpose
    - Return two rows of decimal odds for a matchup.
    - One row is returned per player.
    - The underlying model matches the current odds pipeline:
      Elo 70%, rank 10%, form 10%, head-to-head 10%,
      followed by a fixed 5% margin when converting to decimal odds.

    Inputs
    - playerA:
      ATP id or free-text player name for the first player
    - playerB:
      ATP id or free-text player name for the second player
    - surface:
      Optional surface selector such as 'Hard', 'Clay', or 'Grass'

    Output columns
    - player
    - name
    - odds
    - factor
    - elo_factor
    - rank_factor
    - form_factor
    - head_to_head_factor

    Notes
    - Player inputs are resolved through PLAYER_LOOKUP(...)
    - The procedure returns an empty result set when either player
      cannot be resolved or when both resolve to the same player.

    Example usage
    - CALL PLAYER_ODDS('Tien', 'Burruchaga', 'Clay');
    - CALL PLAYER_ODDS('T0HA', 'B0FV', 'Clay');
    */

    DECLARE resolvedPlayerA VARCHAR(32) DEFAULT NULL;
    DECLARE resolvedPlayerB VARCHAR(32) DEFAULT NULL;
    DECLARE normalizedSurface VARCHAR(50) DEFAULT NULL;
    DECLARE eloFactorA DECIMAL(10,4) DEFAULT NULL;
    DECLARE rankFactorA DECIMAL(10,4) DEFAULT NULL;
    DECLARE formPlayerA DECIMAL(10,4) DEFAULT NULL;
    DECLARE formPlayerB DECIMAL(10,4) DEFAULT NULL;
    DECLARE formFactorA DOUBLE DEFAULT NULL;
    DECLARE headToHeadFactorA DECIMAL(10,4) DEFAULT NULL;
    DECLARE eloFactorB DECIMAL(10,4) DEFAULT NULL;
    DECLARE rankFactorB DECIMAL(10,4) DEFAULT NULL;
    DECLARE formFactorB DOUBLE DEFAULT NULL;
    DECLARE headToHeadFactorB DECIMAL(10,4) DEFAULT NULL;
    DECLARE factorA DECIMAL(10,4) DEFAULT NULL;
    DECLARE factorB DECIMAL(10,4) DEFAULT NULL;
    DECLARE pricedFactorA DECIMAL(10,4) DEFAULT NULL;
    DECLARE pricedFactorB DECIMAL(10,4) DEFAULT NULL;

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
            CAST(NULL AS DECIMAL(10,2)) AS odds,
            CAST(NULL AS DECIMAL(10,4)) AS factor,
            CAST(NULL AS DECIMAL(10,4)) AS elo_factor,
            CAST(NULL AS DECIMAL(10,4)) AS rank_factor,
            CAST(NULL AS DECIMAL(10,4)) AS form_factor,
            CAST(NULL AS DECIMAL(10,4)) AS head_to_head_factor
        FROM players
        WHERE 1 = 0;
    ELSE
        SET eloFactorA = PLAYER_ELO_FACTOR(resolvedPlayerA, resolvedPlayerB, normalizedSurface);
        SET rankFactorA = PLAYER_RANK_FACTOR(resolvedPlayerA, resolvedPlayerB);
        SET formPlayerA = PLAYER_FORM_FACTOR(resolvedPlayerA);
        SET formPlayerB = PLAYER_FORM_FACTOR(resolvedPlayerB);
        SET headToHeadFactorA = PLAYER_HEAD_TO_HEAD_FACTOR(resolvedPlayerA, resolvedPlayerB, normalizedSurface);

        IF eloFactorA IS NULL
            OR rankFactorA IS NULL
            OR formPlayerA IS NULL
            OR formPlayerB IS NULL
            OR headToHeadFactorA IS NULL
            OR formPlayerA + formPlayerB <= 0
        THEN
            SELECT
                id AS player,
                name AS name,
                CAST(NULL AS DECIMAL(10,2)) AS odds,
                CAST(NULL AS DECIMAL(10,4)) AS factor,
                CAST(NULL AS DECIMAL(10,4)) AS elo_factor,
                CAST(NULL AS DECIMAL(10,4)) AS rank_factor,
                CAST(NULL AS DECIMAL(10,4)) AS form_factor,
                CAST(NULL AS DECIMAL(10,4)) AS head_to_head_factor
            FROM players
            WHERE 1 = 0;
        ELSE
            SET formFactorA = formPlayerA / (formPlayerA + formPlayerB);
            SET eloFactorB = 1 - eloFactorA;
            SET rankFactorB = 1 - rankFactorA;
            SET formFactorB = 1 - formFactorA;
            SET headToHeadFactorB = 1 - headToHeadFactorA;

            SET factorA = (
                eloFactorA * 70
                + rankFactorA * 10
                + formFactorA * 10
                + headToHeadFactorA * 10
            ) / 100;

            IF factorA IS NULL OR factorA <= 0 OR factorA >= 1 THEN
                SELECT
                    id AS player,
                    name AS name,
                    CAST(NULL AS DECIMAL(10,2)) AS odds,
                    CAST(NULL AS DECIMAL(10,4)) AS factor,
                    CAST(NULL AS DECIMAL(10,4)) AS elo_factor,
                    CAST(NULL AS DECIMAL(10,4)) AS rank_factor,
                    CAST(NULL AS DECIMAL(10,4)) AS form_factor,
                    CAST(NULL AS DECIMAL(10,4)) AS head_to_head_factor
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
                        CAST(NULL AS DECIMAL(10,2)) AS odds,
                        CAST(NULL AS DECIMAL(10,4)) AS factor,
                        CAST(NULL AS DECIMAL(10,4)) AS elo_factor,
                        CAST(NULL AS DECIMAL(10,4)) AS rank_factor,
                        CAST(NULL AS DECIMAL(10,4)) AS form_factor,
                        CAST(NULL AS DECIMAL(10,4)) AS head_to_head_factor
                    FROM players
                    WHERE 1 = 0;
                ELSE
                    SELECT
                        p.id AS player,
                        p.name AS name,
                        ROUND(1 / pricedFactorA, 2) AS odds,
                        ROUND(factorA, 4) AS factor,
                        ROUND(eloFactorA * 0.70, 4) AS elo_factor,
                        ROUND(rankFactorA * 0.10, 4) AS rank_factor,
                        ROUND(formFactorA * 0.10, 4) AS form_factor,
                        ROUND(headToHeadFactorA * 0.10, 4) AS head_to_head_factor
                    FROM players p
                    WHERE p.id = resolvedPlayerA

                    UNION ALL

                    SELECT
                        p.id AS player,
                        p.name AS name,
                        ROUND(1 / pricedFactorB, 2) AS odds,
                        ROUND(factorB, 4) AS factor,
                        ROUND(eloFactorB * 0.70, 4) AS elo_factor,
                        ROUND(rankFactorB * 0.10, 4) AS rank_factor,
                        ROUND(formFactorB * 0.10, 4) AS form_factor,
                        ROUND(headToHeadFactorB * 0.10, 4) AS head_to_head_factor
                    FROM players p
                    WHERE p.id = resolvedPlayerB;
                END IF;
            END IF;
        END IF;
    END IF;
END;;
DELIMITER ;

-- Create syntax for PROCEDURE 'PLAYER_ODDS_DEBUG'
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `PLAYER_ODDS_DEBUG`(
    IN playerA VARCHAR(255),
    IN playerB VARCHAR(255),
    IN surface VARCHAR(50),
    IN eloWeight DOUBLE,
    IN rankWeight DOUBLE,
    IN formWeight DOUBLE,
    IN headToHeadWeight DOUBLE
)
BEGIN
    /*
    PLAYER_ODDS_DEBUG(playerA, playerB, surface, eloWeight, rankWeight,
    formWeight, headToHeadWeight)

    Purpose
    - Return two rows of odds/debug output for a matchup while allowing
      ad hoc experimentation with factor weights and margin.
    - One row is returned per player.

    Inputs
    - playerA, playerB:
      ATP ids or free-text player names
    - surface:
      Optional surface selector such as 'Hard', 'Clay', or 'Grass'
    - eloWeight, rankWeight, formWeight, headToHeadWeight:
      Non-negative factor weights

    Output columns
    - player
    - name
    - odds
    - factor
    - elo_factor
    - rank_factor
    - form_factor
    - head_to_head_factor

    Notes
    - Player inputs are resolved through PLAYER_LOOKUP(...)
    - Factor columns are weighted contributions, not raw probabilities
    - factor is the normalized blended probability after dividing by the
      total weight

    Example usage
    - CALL PLAYER_ODDS_DEBUG('Tien', 'Burruchaga', 'Clay', 70, 10, 10, 10);
    - CALL PLAYER_ODDS_DEBUG('Tien', 'Burruchaga', 'Clay', 60, 20, 10, 10);
    */

    DECLARE defaultMargin DOUBLE DEFAULT 0.05;
    DECLARE resolvedPlayerA VARCHAR(32) DEFAULT NULL;
    DECLARE resolvedPlayerB VARCHAR(32) DEFAULT NULL;
    DECLARE normalizedSurface VARCHAR(50) DEFAULT NULL;
    DECLARE totalWeight DOUBLE DEFAULT NULL;

    DECLARE eloFactorA DECIMAL(10,4) DEFAULT NULL;
    DECLARE rankFactorA DECIMAL(10,4) DEFAULT NULL;
    DECLARE formPlayerA DECIMAL(10,4) DEFAULT NULL;
    DECLARE formPlayerB DECIMAL(10,4) DEFAULT NULL;
    DECLARE formFactorA DOUBLE DEFAULT NULL;
    DECLARE headToHeadFactorA DECIMAL(10,4) DEFAULT NULL;

    DECLARE eloFactorB DECIMAL(10,4) DEFAULT NULL;
    DECLARE rankFactorB DECIMAL(10,4) DEFAULT NULL;
    DECLARE formFactorB DOUBLE DEFAULT NULL;
    DECLARE headToHeadFactorB DECIMAL(10,4) DEFAULT NULL;

    DECLARE weightedEloA DOUBLE DEFAULT NULL;
    DECLARE weightedRankA DOUBLE DEFAULT NULL;
    DECLARE weightedFormA DOUBLE DEFAULT NULL;
    DECLARE weightedHeadToHeadA DOUBLE DEFAULT NULL;

    DECLARE weightedEloB DOUBLE DEFAULT NULL;
    DECLARE weightedRankB DOUBLE DEFAULT NULL;
    DECLARE weightedFormB DOUBLE DEFAULT NULL;
    DECLARE weightedHeadToHeadB DOUBLE DEFAULT NULL;

    DECLARE factorA DOUBLE DEFAULT NULL;
    DECLARE factorB DOUBLE DEFAULT NULL;
    DECLARE pricedFactorA DOUBLE DEFAULT NULL;
    DECLARE pricedFactorB DOUBLE DEFAULT NULL;

    SET resolvedPlayerA = PLAYER_LOOKUP(playerA);
    SET resolvedPlayerB = PLAYER_LOOKUP(playerB);
    SET normalizedSurface = NULLIF(TRIM(surface), '');
    SET totalWeight = COALESCE(eloWeight, 0)
        + COALESCE(rankWeight, 0)
        + COALESCE(formWeight, 0)
        + COALESCE(headToHeadWeight, 0);

    IF resolvedPlayerA IS NULL
        OR resolvedPlayerB IS NULL
        OR UPPER(resolvedPlayerA) = UPPER(resolvedPlayerB)
        OR totalWeight <= 0
    THEN
        SELECT
            id AS player,
            name AS name,
            CAST(NULL AS DECIMAL(10,2)) AS odds,
            CAST(NULL AS DECIMAL(10,4)) AS factor,
            CAST(NULL AS DECIMAL(10,4)) AS elo_factor,
            CAST(NULL AS DECIMAL(10,4)) AS rank_factor,
            CAST(NULL AS DECIMAL(10,4)) AS form_factor,
            CAST(NULL AS DECIMAL(10,4)) AS head_to_head_factor
        FROM players
        WHERE 1 = 0;
    ELSE
        SET eloFactorA = PLAYER_ELO_FACTOR(resolvedPlayerA, resolvedPlayerB, normalizedSurface);
        SET rankFactorA = PLAYER_RANK_FACTOR(resolvedPlayerA, resolvedPlayerB);
        SET formPlayerA = PLAYER_FORM_FACTOR(resolvedPlayerA);
        SET formPlayerB = PLAYER_FORM_FACTOR(resolvedPlayerB);
        SET headToHeadFactorA = PLAYER_HEAD_TO_HEAD_FACTOR(resolvedPlayerA, resolvedPlayerB, normalizedSurface);

        IF eloFactorA IS NULL
            OR rankFactorA IS NULL
            OR formPlayerA IS NULL
            OR formPlayerB IS NULL
            OR headToHeadFactorA IS NULL
            OR formPlayerA + formPlayerB <= 0
        THEN
            SELECT
                id AS player,
                name AS name,
                CAST(NULL AS DECIMAL(10,2)) AS odds,
                CAST(NULL AS DECIMAL(10,4)) AS factor,
                CAST(NULL AS DECIMAL(10,4)) AS elo_factor,
                CAST(NULL AS DECIMAL(10,4)) AS rank_factor,
                CAST(NULL AS DECIMAL(10,4)) AS form_factor,
                CAST(NULL AS DECIMAL(10,4)) AS head_to_head_factor
            FROM players
            WHERE 1 = 0;
        ELSE
            SET formFactorA = formPlayerA / (formPlayerA + formPlayerB);
            SET eloFactorB = 1 - eloFactorA;
            SET rankFactorB = 1 - rankFactorA;
            SET formFactorB = 1 - formFactorA;
            SET headToHeadFactorB = 1 - headToHeadFactorA;

            SET weightedEloA = eloFactorA * COALESCE(eloWeight, 0);
            SET weightedRankA = rankFactorA * COALESCE(rankWeight, 0);
            SET weightedFormA = formFactorA * COALESCE(formWeight, 0);
            SET weightedHeadToHeadA = headToHeadFactorA * COALESCE(headToHeadWeight, 0);

            SET weightedEloB = eloFactorB * COALESCE(eloWeight, 0);
            SET weightedRankB = rankFactorB * COALESCE(rankWeight, 0);
            SET weightedFormB = formFactorB * COALESCE(formWeight, 0);
            SET weightedHeadToHeadB = headToHeadFactorB * COALESCE(headToHeadWeight, 0);

            SET factorA = (
                weightedEloA
                + weightedRankA
                + weightedFormA
                + weightedHeadToHeadA
            ) / totalWeight;

            SET factorB = (
                weightedEloB
                + weightedRankB
                + weightedFormB
                + weightedHeadToHeadB
            ) / totalWeight;

            IF factorA <= 0 OR factorA >= 1 OR factorB <= 0 OR factorB >= 1 THEN
                SELECT
                    id AS player,
                    name AS name,
                    CAST(NULL AS DECIMAL(10,2)) AS odds,
                    CAST(NULL AS DECIMAL(10,4)) AS factor,
                    CAST(NULL AS DECIMAL(10,4)) AS elo_factor,
                    CAST(NULL AS DECIMAL(10,4)) AS rank_factor,
                    CAST(NULL AS DECIMAL(10,4)) AS form_factor,
                    CAST(NULL AS DECIMAL(10,4)) AS head_to_head_factor
                FROM players
                WHERE 1 = 0;
            ELSE
                SET pricedFactorA = factorA * (1 + defaultMargin);
                SET pricedFactorB = factorB * (1 + defaultMargin);

                SELECT
                    p.id AS player,
                    p.name AS name,
                    ROUND(
                        CASE WHEN pricedFactorA >= 1 THEN 1.01 ELSE 1 / pricedFactorA END,
                        2
                    ) AS odds,
                    ROUND(factorA, 4) AS factor,
                    ROUND(weightedEloA / totalWeight, 4) AS elo_factor,
                    ROUND(weightedRankA / totalWeight, 4) AS rank_factor,
                    ROUND(weightedFormA / totalWeight, 4) AS form_factor,
                    ROUND(weightedHeadToHeadA / totalWeight, 4) AS head_to_head_factor
                FROM players p
                WHERE p.id = resolvedPlayerA

                UNION ALL

                SELECT
                    p.id AS player,
                    p.name AS name,
                    ROUND(
                        CASE WHEN pricedFactorB >= 1 THEN 1.01 ELSE 1 / pricedFactorB END,
                        2
                    ) AS odds,
                    ROUND(factorB, 4) AS factor,
                    ROUND(weightedEloB / totalWeight, 4) AS elo_factor,
                    ROUND(weightedRankB / totalWeight, 4) AS rank_factor,
                    ROUND(weightedFormB / totalWeight, 4) AS form_factor,
                    ROUND(weightedHeadToHeadB / totalWeight, 4) AS head_to_head_factor
                FROM players p
                WHERE p.id = resolvedPlayerB;
            END IF;
        END IF;
    END IF;
END;;
DELIMITER ;

-- Create syntax for FUNCTION 'PLAYER_RANK_FACTOR'
CREATE DEFINER=`root`@`%` FUNCTION `PLAYER_RANK_FACTOR`(playerID VARCHAR(32),
    opponentID VARCHAR(32)
) RETURNS decimal(10,4)
    DETERMINISTIC
BEGIN
    /*
    PLAYER_RANK_FACTOR(playerID, opponentID)

    Purpose
    - Return one ranking-based win signal in the range 0.01..0.99 for playerID
      against opponentID.
    - Higher means the ranking signal favors playerID.
    - Lower means the ranking signal favors opponentID.
    - 0.5 is neutral.

    Why this is a function
    - It returns one scalar value.
    - It is intended to be usable inside regular SQL queries.
    - Example usage:
      SELECT PLAYER_RANK_FACTOR('S0AG', 'A0E2');

    Why this exists
    - The odds model already has a rank-based factor in JavaScript.
    - Keeping the same formula in MariaDB avoids duplicated logic in two places.

    Exact formula
    - score = LN(rank_opponent) - LN(rank_player)
    - rank_factor = 1 / (1 + EXP(-score))

    Interpretation
    - Lower ATP rank number is better.
    - The log transform makes ranking gaps near the top matter more than the
      same absolute gap lower down the ranking list.
    - Examples:
      rank 5 vs 20 should matter more than rank 105 vs 120

    Inputs and edge cases
    - Invalid playerID => NULL
    - Invalid opponentID => NULL
    - Same player and opponent => NULL
    - Missing or non-positive rank on either side => NULL

    Safety clamp
    - The return value is clamped to 0.01..0.99.
    - This matches the current JS logic and avoids hard 0/1 probabilities.
    */

    DECLARE v_rank_player INT DEFAULT NULL;
    DECLARE v_rank_opponent INT DEFAULT NULL;
    DECLARE v_score DOUBLE DEFAULT NULL;
    DECLARE v_probability DOUBLE DEFAULT NULL;

    IF playerID IS NULL OR TRIM(playerID) = '' OR opponentID IS NULL OR TRIM(opponentID) = '' THEN
        RETURN NULL;
    END IF;

    IF UPPER(playerID) = UPPER(opponentID) THEN
        RETURN NULL;
    END IF;

    SELECT rank INTO v_rank_player
    FROM players
    WHERE id = playerID
    LIMIT 1;

    SELECT rank INTO v_rank_opponent
    FROM players
    WHERE id = opponentID
    LIMIT 1;

    IF v_rank_player IS NULL OR v_rank_player <= 0 OR v_rank_opponent IS NULL OR v_rank_opponent <= 0 THEN
        RETURN NULL;
    END IF;

    SET v_score = LN(v_rank_opponent) - LN(v_rank_player);
    SET v_probability = 1 / (1 + EXP(-v_score));
    SET v_probability = GREATEST(0.01, LEAST(0.99, v_probability));

    RETURN ROUND(v_probability, 4);
END;

-- Create syntax for PROCEDURE 'PLAYER_SEARCH'
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
END;;
DELIMITER ;