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

-- Create syntax for FUNCTION 'PLAYER_FATIGUE_FACTOR'
CREATE DEFINER=`root`@`%` FUNCTION `PLAYER_FATIGUE_FACTOR`(playerID VARCHAR(32),
    weeks INT
) RETURNS decimal(10,4)
    DETERMINISTIC
BEGIN
    /*
    PLAYER_FATIGUE_FACTOR(playerID, weeks)

    Purpose
    - Return one numeric fatigue/restedness signal in the range 0..1 for a single player.
    - Higher means more rested.
    - Lower means more recent workload.

    Why this is a function
    - It returns one scalar value.
    - It is intended to be usable inside regular SQL queries.
    - Example usage:
      SELECT PLAYER_FATIGUE_FACTOR('S0AG', 1);
      SELECT id, name, PLAYER_FATIGUE_FACTOR(id, 1) AS fatigue_factor FROM players;

    High-level model
    1. Look only at completed matches for the player.
    2. Ignore matches without a known event date.
    3. Restrict the sample to the last N weeks.
    4. Weight newer matches higher than older matches inside that window.
    5. Estimate workload from the match itself:
       - every match adds a base load
       - extra sets add extra load
       - tie-break sets add a small extra load
    6. Convert total workload into a 0..1 restedness factor.

    Why this exists
    - Match congestion matters in tennis.
    - A player who has played several recent matches should usually be treated as a bit less fresh.
    - The workload signal should be simple, local, and deterministic.

    Exact weighting choice
    - match_weight = POW(0.5, days_ago / window_days)
    - window_days = weeks * 7

    Interpretation of the weighting
    - A match played today has weight 1.0.
    - A match at the edge of the window has weight about 0.5.
    - Newer workload matters more than older workload.

    Exact workload choice
    - match_load =
        match_weight *
        (
          1.0
          + 0.4 * extra_sets
          + 0.15 * tie_breaks
        )
    - extra_sets = GREATEST(NUMBER_OF_SETS(score) - 2, 0)
    - tie_breaks = NUMBER_OF_TIE_BREAKS(score)

    Interpretation of the workload
    - Every match adds a baseline workload.
    - Longer matches increase the load.
    - Tie-break-heavy matches increase the load a little more.

    Exact conversion to restedness
    - fatigue_factor = 1 / (1 + total_load / 4)

    Interpretation of the restedness scale
    - No recent matches => 1.0
    - One recent straight-sets match => still fairly rested
    - Several recent matches => lower value
    - This is intentionally a simple first version, not a physiology model

    Inputs and edge cases
    - Invalid playerID => NULL
    - weeks <= 0 => NULL
    - Unknown playerID => NULL
    - Valid player with no matches in the window => 1.0000

    Things you may want to tune later
    - Recency curve:
      change POW(0.5, ...) to another decay function
    - Window behavior:
      use more or fewer weeks
    - Workload weights:
      change base match load, extra set penalty, or tie-break penalty
    - Duration:
      add match duration if you want a stronger load signal
    - Travel:
      add travel or surface-switch penalties outside this function if needed

    Non-goals in the current version
    - No travel adjustment
    - No time-zone adjustment
    - No surface-switch adjustment
    - No direct use of match duration yet
    */

    DECLARE v_total_load DECIMAL(12,6) DEFAULT 0;
    DECLARE v_window_days DECIMAL(12,6) DEFAULT 0;

    IF playerID IS NULL OR TRIM(playerID) = '' OR weeks IS NULL OR weeks <= 0 THEN
        RETURN NULL;
    ELSEIF NOT EXISTS (
        SELECT 1
        FROM players
        WHERE id = playerID
    ) THEN
        RETURN NULL;
    END IF;

    SET v_window_days = weeks * 7;

    SELECT
        COALESCE(SUM(match_load), 0)
    INTO
        v_total_load
    FROM (
        SELECT
            POW(0.5, GREATEST(DATEDIFF(CURDATE(), e.date), 0) / v_window_days) *
            (
                1
                + 0.4 * GREATEST(COALESCE(NUMBER_OF_SETS(m.score), 2) - 2, 0)
                + 0.15 * COALESCE(NUMBER_OF_TIE_BREAKS(m.score), 0)
            ) AS match_load
        FROM matches m
        JOIN events e ON e.id = m.event
        WHERE
            m.status = 'Completed'
            AND e.date IS NOT NULL
            AND e.date >= DATE_SUB(CURDATE(), INTERVAL weeks WEEK)
            AND (m.winner = playerID OR m.loser = playerID)
    ) recent_matches;

    RETURN ROUND(1 / (1 + v_total_load / 4), 4);
END;

-- Create syntax for FUNCTION 'PLAYER_FORM_FACTOR'
CREATE DEFINER=`root`@`%` FUNCTION `PLAYER_FORM_FACTOR`(playerID VARCHAR(32), weeks INT) RETURNS decimal(10,4)
    DETERMINISTIC
BEGIN
/*
PLAYER_FORM_FACTOR(playerID, weeks)

Purpose
- Return one numeric form signal in the range 0..1 for a single player.
- Higher means stronger recent form, lower means weaker recent form.
- 0.5 is intentionally treated as neutral.

Why this is a function
- It returns one scalar value.
- It is intended to be usable inside regular SQL queries.
- Example usage:
SELECT PLAYER_FORM_FACTOR('S0AG', 8);
SELECT id, name, PLAYER_FORM_FACTOR(id, 8) AS form_factor FROM players;

High-level model
1. Look only at completed matches for the player.
2. Ignore matches without a known event date.
3. Restrict the sample to the last N weeks.
4. Weight newer matches higher than older matches inside that window.
5. Shrink the result toward 0.5 so tiny samples do not look too extreme.

Why this exists
- A plain recent win rate is too jumpy.
- A player who wins 2-3 recent matches should not instantly look like "full form".
- Newer matches should matter more than older matches.

Exact weighting choice
- match_weight = POW(0.5, days_ago / window_days)
- window_days = weeks * 7

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
- weeks <= 0 => NULL
- Unknown playerID => NULL
- Valid player with no matches in the window => 0.5000

Things you may want to tune later
- Recency curve:
change POW(0.5, ...) to another decay function
- Window behavior:
use more or fewer weeks
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

IF playerID IS NULL
OR TRIM(playerID) = ''
OR weeks IS NULL
OR weeks <= 0 THEN RETURN NULL;

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
    v_window_days = weeks * 7;

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
            AND e.date >= DATE_SUB(CURDATE(), INTERVAL weeks WEEK)
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
CREATE DEFINER=`root`@`%` FUNCTION `PLAYER_LOOKUP`(searchTerm VARCHAR(255),
    maxResults INT
) RETURNS longtext CHARSET utf8mb4 COLLATE utf8mb4_general_ci
    DETERMINISTIC
BEGIN
    /*
    PLAYER_LOOKUP(searchTerm, maxResults)

    Purpose
    - Return a JSON array of ranked player candidates for a search term.
    - Best match is always the first array element.

    Inputs
    - searchTerm:
      ATP player id or free-text player name
    - maxResults:
      maximum number of candidates to return

    Output
    - JSON array of candidate objects
    - Empty JSON array when no match is found

    Matching rules
    - Exact player id match first
    - Exact player name match second
    - Prefix name match third
    - Broader contains match fourth

    Ordering
    - Best match_score first
    - Active players before inactive players
    - Ranked players before unranked players
    - Better ATP rank first
    - Players with ELO before players without ELO
    - Higher ELO first
    - Name as final tiebreaker

    Validation
    - Empty searchTerm returns `[]`
    - Invalid `maxResults` falls back to `5`

    Example usage
    - SELECT PLAYER_LOOKUP('S0AG', 5);
    - SELECT PLAYER_LOOKUP('Sinner', 5);
    */

    DECLARE normalizedTerm VARCHAR(255) DEFAULT TRIM(COALESCE(searchTerm, ''));
    DECLARE normalizedLimit INT DEFAULT COALESCE(maxResults, 5);
    DECLARE prefixTerm VARCHAR(256);
    DECLARE containsTerm VARCHAR(257);
    DECLARE resultJson LONGTEXT DEFAULT NULL;

    IF normalizedTerm = '' THEN
        RETURN JSON_ARRAY();
    END IF;

    IF normalizedLimit < 1 OR normalizedLimit > 50 THEN
        SET normalizedLimit = 5;
    END IF;

    SET prefixTerm = CONCAT(normalizedTerm, '%');
    SET containsTerm = CONCAT('%', normalizedTerm, '%');

    SELECT
        JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', id,
                'name', name,
                'country', country,
                'rank', rank,
                'active', active,
                'elo_rank', elo_rank,
                'elo_rank_hard', elo_rank_hard,
                'elo_rank_clay', elo_rank_clay,
                'elo_rank_grass', elo_rank_grass,
                'match_score', match_score
            )
        )
    INTO
        resultJson
    FROM (
        SELECT
            id,
            name,
            country,
            rank,
            active,
            elo_rank,
            elo_rank_hard,
            elo_rank_clay,
            elo_rank_grass,
            CASE
                WHEN UPPER(id) = UPPER(normalizedTerm) THEN 1
                WHEN LOWER(name) = LOWER(normalizedTerm) THEN 2
                WHEN LOWER(name) LIKE LOWER(prefixTerm) THEN 3
                WHEN LOWER(name) LIKE LOWER(containsTerm) THEN 4
                ELSE 5
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
            (elo_rank IS NULL) ASC,
            elo_rank DESC,
            name ASC
        LIMIT normalizedLimit
    ) ranked_candidates;

    RETURN COALESCE(resultJson, JSON_ARRAY());
END;

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